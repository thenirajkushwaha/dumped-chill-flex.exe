'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Calendar, Clock, AlertCircle, Plus, Trash2, 
  Save, XCircle, RotateCcw, Lock, Unlock, Globe, Users, CalendarDays
} from 'lucide-react';
import { format } from 'date-fns';

/* ---------- TYPES ---------- */
interface Service {
  id: string;
  title: string;
}

interface SlotTiming {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  service_id: string;
}

interface ScheduleException {
  id: string;
  exception_date: string;
  slot_id: string | null;
  service_id: string;
  is_blocked: boolean;
  start_time?: string;
  end_time?: string;
  capacity?: number;
  is_added?: boolean;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string;
}

interface MergedSlot {
  type: 'default' | 'modified' | 'added' | 'blocked';
  id: string; // The ID used for referencing the main slot
  exceptionId?: string; // Reference to the exception record if it exists
  start_time: string;
  end_time: string;
  capacity: number;
  bookedCount: number;
  remaining: number;
  originalData?: SlotTiming;
}

export default function ScheduleManager() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Raw Data
  const [defaultSlots, setDefaultSlots] = useState<SlotTiming[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [upcomingBlocks, setUpcomingBlocks] = useState<BlockedDate[]>([]);
  
  // Blocked Date State
  const [isDayBlocked, setIsDayBlocked] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockedDateId, setBlockedDateId] = useState<string | null>(null);

  // Edit State
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [newSlot, setNewSlot] = useState({ start: '09:00', end: '10:00', cap: 5 });

  useEffect(() => {
    fetchServices();
    fetchUpcomingBlocks();
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      fetchScheduleData();
    }
  }, [selectedServiceId, selectedDate]);

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('id, title').order('title');
    if (data && data.length > 0) {
      setServices(data);
      setSelectedServiceId(data[0].id);
    }
  };

  const fetchUpcomingBlocks = async () => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('blocked_dates')
      .select('*')
      .gte('blocked_date', today)
      .order('blocked_date', { ascending: true })
      .limit(10);
    if (data) setUpcomingBlocks(data);
  };

  const fetchScheduleData = async () => {
    setLoading(true);
    
    const [defaultsRes, exceptsRes, blockedRes, bookingsRes] = await Promise.all([
      supabase.from('slot_timings').select('*').eq('service_id', selectedServiceId).order('start_time'),
      supabase.from('schedule_exceptions').select('*').eq('service_id', selectedServiceId).eq('exception_date', selectedDate),
      supabase.from('blocked_dates').select('*').eq('blocked_date', selectedDate).maybeSingle(),
      supabase.from('bookings').select('slot_id').eq('service_id', selectedServiceId).eq('booking_date', selectedDate).neq('status', 'cancelled')
    ]);

    if (defaultsRes.data) setDefaultSlots(defaultsRes.data);
    if (exceptsRes.data) setExceptions(exceptsRes.data);
    if (bookingsRes.data) setBookings(bookingsRes.data);
    
    if (blockedRes.data) {
      setIsDayBlocked(true);
      setBlockedDateId(blockedRes.data.id);
      setBlockReason(blockedRes.data.reason || '');
    } else {
      setIsDayBlocked(false);
      setBlockedDateId(null);
      setBlockReason('');
    }

    setLoading(false);
  };

  /* ---------- MERGE LOGIC (PRIORITY FIX) ---------- */
  const mergedSchedule = useMemo(() => {
    const combined: MergedSlot[] = [];
    const usedExceptionIds = new Set<string>(); // Tracks exceptions merged with defaults

    // 1. Booking Counts Map
    const bookingCounts: Record<string, number> = {};
    bookings.forEach((b: any) => {
      if (b.slot_id) bookingCounts[b.slot_id] = (bookingCounts[b.slot_id] || 0) + 1;
    });

    // Helper to construct slot object
    const buildSlot = (
      type: MergedSlot['type'], 
      id: string, 
      start: string, 
      end: string, 
      cap: number, 
      exceptionId?: string, 
      original?: SlotTiming
    ): MergedSlot => {
      // Sum bookings from both the Default ID and the Exception ID (if merged) to be safe
      const countDefault = bookingCounts[id] || 0;
      const countException = exceptionId && id !== exceptionId ? (bookingCounts[exceptionId] || 0) : 0;
      const totalBooked = countDefault + countException;

      return {
        type,
        id,
        exceptionId,
        start_time: start,
        end_time: end,
        capacity: cap,
        bookedCount: totalBooked,
        remaining: Math.max(0, cap - totalBooked),
        originalData: original
      };
    };

    // A. Process Defaults (Prioritize Exceptions)
    defaultSlots.forEach(slot => {
      // Strategy 1: Find exception linked by explicit Slot ID (Edit Pencil)
      let exception = exceptions.find(e => e.slot_id === slot.id);

      // Strategy 2: Find exception matching TIME (Implicit Override via Add Slot)
      // This fixes the duplicate listing issue in your screenshot
      if (!exception) {
        exception = exceptions.find(e => 
          !e.slot_id && // Is an "Added" slot
          e.start_time === slot.start_time // Times match
        );
      }

      if (exception) {
        usedExceptionIds.add(exception.id); // Mark as consumed so it doesn't show up in section B

        if (exception.is_blocked) {
           combined.push(buildSlot('blocked', slot.id, slot.start_time, slot.end_time, slot.capacity, exception.id, slot));
        } else {
          // Merged/Modified Slot
          combined.push(buildSlot(
            'modified', 
            slot.id, 
            exception.start_time || slot.start_time, 
            exception.end_time || slot.end_time, 
            exception.capacity ?? slot.capacity, 
            exception.id, 
            slot
          ));
        }
      } else {
        // Pure Default
        combined.push(buildSlot('default', slot.id, slot.start_time, slot.end_time, slot.capacity, undefined, slot));
      }
    });

    // B. Process Remaining Added Slots (That didn't match any default)
    const addedSlots = exceptions.filter(e => 
      !e.slot_id && 
      !e.is_blocked && 
      !usedExceptionIds.has(e.id)
    );
    
    addedSlots.forEach(exc => {
      combined.push(buildSlot(
        'added', 
        exc.id, 
        exc.start_time!, 
        exc.end_time!, 
        exc.capacity!, 
        exc.id
      ));
    });

    return combined.sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [defaultSlots, exceptions, bookings]);


  /* ---------- ACTIONS ---------- */

  const toggleDayBlock = async () => {
    if (isDayBlocked && blockedDateId) {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', blockedDateId);
      if (!error) {
        setIsDayBlocked(false);
        setBlockedDateId(null);
        fetchUpcomingBlocks();
      }
    } else {
      const { data, error } = await supabase.from('blocked_dates').insert([{
        blocked_date: selectedDate,
        reason: blockReason || 'Maintenance'
      }]).select().single();
      
      if (!error && data) {
        setIsDayBlocked(true);
        setBlockedDateId(data.id);
        fetchUpcomingBlocks();
      }
    }
  };

  const deleteUpcomingBlock = async (id: string) => {
    if(!confirm("Open this date for bookings?")) return;
    await supabase.from('blocked_dates').delete().eq('id', id);
    fetchUpcomingBlocks();
    const block = upcomingBlocks.find(b => b.id === id);
    if(block && block.blocked_date === selectedDate) {
      fetchScheduleData();
    }
  };

  const createDefaultSlot = async () => {
    await supabase.from('slot_timings').insert([{
      service_id: selectedServiceId,
      start_time: newSlot.start,
      end_time: newSlot.end,
      capacity: newSlot.cap,
      is_enabled: true
    }]);
    setIsAddingSlot(false);
    fetchScheduleData();
  };

  const createExceptionSlot = async () => {
    await supabase.from('schedule_exceptions').insert([{
      service_id: selectedServiceId,
      exception_date: selectedDate,
      start_time: newSlot.start,
      end_time: newSlot.end,
      capacity: newSlot.cap,
      is_blocked: false,
      is_added: true,
      slot_id: null
    }]);
    setIsAddingSlot(false);
    fetchScheduleData();
  };

  const updateSlotOverride = async (slot: MergedSlot, newCap: number) => {
    if (slot.type === 'default') {
      await supabase.from('schedule_exceptions').insert([{
        service_id: selectedServiceId,
        exception_date: selectedDate,
        slot_id: slot.id,
        start_time: slot.start_time,
        end_time: slot.end_time,
        capacity: newCap,
        is_blocked: false
      }]);
    } else if (slot.exceptionId) {
      await supabase.from('schedule_exceptions').update({ capacity: newCap }).eq('id', slot.exceptionId);
    }
    fetchScheduleData();
  };

  const toggleSlotBlock = async (slot: MergedSlot) => {
    if (slot.type === 'blocked') {
      if (slot.exceptionId) await supabase.from('schedule_exceptions').delete().eq('id', slot.exceptionId);
    } else {
      await supabase.from('schedule_exceptions').insert([{
        service_id: selectedServiceId,
        exception_date: selectedDate,
        slot_id: slot.id,
        is_blocked: true
      }]);
    }
    fetchScheduleData();
  };

  const deleteAddedSlot = async (exceptionId: string) => {
    if (!confirm("Remove this additional slot?")) return;
    await supabase.from('schedule_exceptions').delete().eq('id', exceptionId);
    fetchScheduleData();
  };

  const deleteDefaultSlot = async (slotId: string) => {
    if (!confirm("⚠️ WARNING: This is a Master Slot.\n\nDeleting this will remove it from ALL FUTURE DATES.\n\nAre you sure you want to permanently delete this schedule?")) return;
    await supabase.from('slot_timings').delete().eq('id', slotId);
    await supabase.from('schedule_exceptions').delete().eq('slot_id', slotId);
    fetchScheduleData();
  };

  return (
    <div className="p-6 md:p-10 bg-slate-50 min-h-screen space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Slot Manager</h1>
          <p className="text-slate-500 font-medium">Configure defaults and daily exceptions</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 overflow-x-auto max-w-full">
           {services.map(s => (
             <button
              key={s.id}
              onClick={() => setSelectedServiceId(s.id)}
              className={`px-4 py-2 rounded-xl text-sm font-black transition-all whitespace-nowrap ${
                selectedServiceId === s.id 
                ? 'bg-[#0A2540] text-white shadow-md' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
             >
               {s.title}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Controls */}
        <div className="lg:col-span-4 space-y-6">
           {/* Date Picker */}
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 block">Selected Date</label>
              <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full text-lg font-black text-slate-800 bg-slate-50 p-4 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="mt-4 flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <AlertCircle className="text-blue-600 shrink-0" size={20} />
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                  Editing <strong>{format(new Date(selectedDate), 'dd MMM yyyy')}</strong>.
                </p>
              </div>
           </div>

           {/* Day Closure Control */}
           <div className={`p-6 rounded-3xl border-2 transition-all ${isDayBlocked ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                 <div className={`p-2 rounded-lg ${isDayBlocked ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                    {isDayBlocked ? <Lock size={20} /> : <Unlock size={20} />}
                 </div>
                 <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Full Day Closure</h3>
              </div>

              {isDayBlocked ? (
                <div className="space-y-4">
                  <p className="text-sm text-red-600 font-bold bg-white/50 p-3 rounded-lg border border-red-100">
                     Blocked: "{blockReason}"
                  </p>
                  <button 
                    onClick={toggleDayBlock} 
                    className="w-full py-3 bg-white border-2 border-red-200 text-red-500 hover:bg-red-50 font-black rounded-xl text-xs uppercase tracking-widest transition-colors"
                  >
                    Open Bookings
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Reason (e.g. Holiday)" 
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                    className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 font-bold placeholder:font-medium"
                  />
                  <button 
                    onClick={toggleDayBlock} 
                    className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 font-black rounded-xl text-xs uppercase tracking-widest transition-colors"
                  >
                    Block Entire Day
                  </button>
                </div>
              )}
           </div>

           {/* Upcoming Closures List */}
           <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-h-[300px] overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays size={18} className="text-slate-400"/>
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Upcoming Closures</h3>
              </div>
              
              {upcomingBlocks.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium italic">No upcoming blocked dates.</p>
              ) : (
                <div className="space-y-3">
                  {upcomingBlocks.map(block => (
                    <div key={block.id} className="group flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-red-100 transition-colors">
                      <div>
                        <p className="text-xs font-black text-slate-800">{format(new Date(block.blocked_date), 'dd MMM yyyy')}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{block.reason}</p>
                      </div>
                      <button 
                        onClick={() => deleteUpcomingBlock(block.id)}
                        className="p-2 text-slate-300 hover:text-red-500 bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
           </div>

           {/* Legend */}
           <div className="p-6 bg-[#0A2540] rounded-3xl text-white">
              <h3 className="font-black text-lg mb-4">Legend</h3>
              <div className="space-y-3 text-sm font-medium opacity-80">
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-slate-400"></div> Default Slot</div>
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-blue-500"></div> Modified Capacity</div>
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Added for this day</div>
                <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full bg-red-500"></div> Blocked Slot</div>
              </div>
           </div>
        </div>

        {/* RIGHT COLUMN: SLOT LIST */}
        <div className={`lg:col-span-8 space-y-4 transition-all ${isDayBlocked ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
          
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-slate-800">
              Slots for {format(new Date(selectedDate), 'MMMM do')}
            </h2>
            <button 
              onClick={() => setIsAddingSlot(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
            >
              <Plus size={16} /> Add Slot
            </button>
          </div>

          {/* ADD SLOT FORM */}
          {isAddingSlot && (
            <div className="bg-white border-2 border-indigo-100 p-6 rounded-2xl shadow-lg mb-6 animate-in slide-in-from-top-4">
              <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">New Slot Details</h3>
              <div className="flex gap-4 mb-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Start</label>
                  <input type="time" value={newSlot.start} onChange={e => setNewSlot({...newSlot, start: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg font-bold" />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">End</label>
                  <input type="time" value={newSlot.end} onChange={e => setNewSlot({...newSlot, end: e.target.value})} className="w-full p-2 bg-slate-50 rounded-lg font-bold" />
                </div>
                <div className="w-24 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Cap</label>
                  <input type="number" value={newSlot.cap} onChange={e => setNewSlot({...newSlot, cap: parseInt(e.target.value)})} className="w-full p-2 bg-slate-50 rounded-lg font-bold" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={createExceptionSlot} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">Add for {format(new Date(selectedDate), 'MMM do')} Only</button>
                <button onClick={createDefaultSlot} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm">Add to Defaults (All Days)</button>
                <button onClick={() => setIsAddingSlot(false)} className="px-4 py-3 text-slate-400 font-bold text-sm">Cancel</button>
              </div>
            </div>
          )}

          {/* SLOT LIST */}
          <div className="space-y-3">
            {mergedSchedule.map((slot, idx) => {
              const isBlocked = slot.type === 'blocked';
              
              let borderClass = 'border-slate-100';
              let bgClass = 'bg-white';
              let accentColor = 'text-slate-600';

              if (slot.type === 'modified') { borderClass = 'border-blue-200'; bgClass = 'bg-blue-50/30'; accentColor = 'text-blue-600'; }
              if (slot.type === 'added') { borderClass = 'border-emerald-200'; bgClass = 'bg-emerald-50/30'; accentColor = 'text-emerald-600'; }
              if (isBlocked) { borderClass = 'border-red-100'; bgClass = 'bg-red-50/50 grayscale opacity-75'; accentColor = 'text-red-400'; }

              return (
                <div key={`${slot.type}-${slot.id}-${idx}`} className={`group relative p-4 rounded-2xl border-2 ${borderClass} ${bgClass} transition-all hover:shadow-md flex items-center justify-between`}>
                  
                  {/* LEFT: Time & Info */}
                  <div className="flex items-center gap-6">
                    <div className={`p-3 rounded-xl ${isBlocked ? 'bg-red-100' : 'bg-slate-100'} ${accentColor}`}>
                      <Clock size={20} />
                    </div>
                    <div>
                      <h4 className={`text-lg font-black ${isBlocked ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </h4>
                      <div className="flex items-center gap-2">
                         <span className={`text-[10px] font-black uppercase tracking-widest ${accentColor}`}>
                            {slot.type === 'default' ? 'Standard' : slot.type}
                         </span>
                         {slot.type === 'default' && (
                           <span className="flex items-center gap-1 text-[9px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-bold ml-2">
                             <Globe size={10} /> GLOBAL
                           </span>
                         )}
                         {/* Bookings Badge */}
                         {!isBlocked && (
                           <div className={`ml-2 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide flex items-center gap-1 ${
                             slot.remaining === 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                           }`}>
                             <Users size={10} />
                             {slot.bookedCount} Booked / {slot.remaining} Left
                           </div>
                         )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Controls */}
                  <div className="flex items-center gap-4">
                    {!isBlocked && (
                      <div className="flex flex-col items-center">
                        <label className="text-[9px] font-black text-slate-300 uppercase mb-1">Capacity</label>
                        <input 
                          type="number" 
                          disabled={slot.type === 'blocked'}
                          value={slot.capacity}
                          onChange={(e) => updateSlotOverride(slot, parseInt(e.target.value))}
                          className={`w-16 p-2 text-center font-bold rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none ${slot.type === 'modified' ? 'bg-white border-blue-200 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                        />
                      </div>
                    )}

                    <div className="w-px h-10 bg-slate-100 mx-2"></div>

                    {/* Actions */}
                    {slot.type === 'added' ? (
                       <button onClick={() => deleteAddedSlot(slot.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete extra slot">
                         <Trash2 size={18} />
                       </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => toggleSlotBlock(slot)} 
                          className={`p-2 rounded-lg transition-colors ${isBlocked ? 'text-emerald-500 hover:bg-emerald-50' : 'text-slate-300 hover:text-orange-500 hover:bg-orange-50'}`}
                          title={isBlocked ? "Restore Slot for this day" : "Block Slot for this day"}
                        >
                          {isBlocked ? <RotateCcw size={18} /> : <XCircle size={18} />}
                        </button>
                        
                        {/* Only Default slots can be globally deleted */}
                        {slot.type === 'default' && (
                          <button 
                            onClick={() => deleteDefaultSlot(slot.id)} 
                            className="p-2 rounded-lg transition-colors text-slate-300 hover:text-red-600 hover:bg-red-50"
                            title="PERMANENTLY Delete this slot (Global Rule)"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className={`absolute top-1/2 -translate-y-1/2 left-0 w-1 h-12 rounded-r-full ${
                    slot.type === 'default' ? 'bg-slate-300' : 
                    slot.type === 'modified' ? 'bg-blue-500' : 
                    slot.type === 'added' ? 'bg-emerald-500' : 'bg-red-500'
                  }`}></div>
                </div>
              );
            })}

            {mergedSchedule.length === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-400 font-medium">No slots configured for this day.</p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}