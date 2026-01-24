'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Calendar, Clock, ShieldAlert, ShieldCheck, 
  Loader2, Plus, Trash2, Info, Save,
  XCircle, CheckCircle2, Users, Settings2, Edit3
} from 'lucide-react';

/* ---------- TYPES ---------- */
interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_enabled: boolean;
}

interface Service {
  id: string;
  title: string;
}

export default function ScheduleManager() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  
  // Slot Management State
  const [isSlotEditorOpen, setIsSlotEditorOpen] = useState(false);
  const [newSlot, setNewSlot] = useState({ start_time: '09:00', end_time: '10:00', capacity: 1 });
  const [globalCapacity, setGlobalCapacity] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchStaticData();
    fetchDynamicData();
  }, [selectedDate]);

  const fetchStaticData = async () => {
    const [{ data: s }, { data: sl }] = await Promise.all([
      supabase.from('services').select('id, title'),
      supabase.from('slot_timings').select('*').order('start_time')
    ]);
    if (s) setServices(s);
    if (sl) {
      setSlots(sl);
      if (sl.length > 0) setGlobalCapacity(sl[0].capacity);
    }
  };

  const fetchDynamicData = async () => {
    setLoading(true);
    const [{ data: bd }, { data: ex }] = await Promise.all([
      supabase.from('blocked_dates').select('*'),
      supabase.from('schedule_exceptions').select('*').eq('exception_date', selectedDate)
    ]);
    if (bd) setBlockedDates(bd);
    if (ex) setExceptions(ex);
    setLoading(false);
  };

  /* ---------- SLOT CRUD ACTIONS ---------- */

  const addSlot = async () => {
    setIsProcessing(true);
    const { error } = await supabase.from('slot_timings').insert([newSlot]);
    if (!error) {
      fetchStaticData();
      setIsSlotEditorOpen(false);
    }
    setIsProcessing(false);
  };

  const deleteSlot = async (id: string) => {
    if (!confirm("Are you sure? This will remove this slot globally and delete associated exceptions.")) return;
    await supabase.from('slot_timings').delete().eq('id', id);
    fetchStaticData();
  };

  const updateGlobalCapacity = async () => {
    setIsProcessing(true);
    await supabase.from('slot_timings').update({ capacity: globalCapacity }).eq('is_enabled', true);
    setSlots(prev => prev.map(s => ({ ...s, capacity: globalCapacity })));
    setIsProcessing(false);
  };

  const updateSlotTiming = async (id: string, field: string, value: any) => {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
    await supabase.from('slot_timings').update({ [field]: value }).eq('id', id);
  };

  /* ---------- EXCEPTION ACTIONS ---------- */

  const toggleGlobalBlock = async () => {
    const existing = blockedDates.find(d => d.blocked_date === selectedDate);
    if (existing) {
      await supabase.from('blocked_dates').delete().eq('id', existing.id);
    } else {
      await supabase.from('blocked_dates').insert([{ blocked_date: selectedDate, reason }]);
    }
    fetchDynamicData();
    setReason('');
  };

  const toggleSlotException = async (slotId: string, serviceId: string) => {
    const existing = exceptions.find(e => e.slot_id === slotId && e.service_id === serviceId);
    if (existing) {
      await supabase.from('schedule_exceptions').delete().eq('id', existing.id);
    } else {
      await supabase.from('schedule_exceptions').insert([{
        exception_date: selectedDate,
        slot_id: slotId,
        service_id: serviceId,
        is_blocked: true
      }]);
    }
    fetchDynamicData();
  };

  const isFullDayBlocked = blockedDates.some(d => d.blocked_date === selectedDate);

  return (
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen space-y-8 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-[#0A2540] p-8 rounded-3xl text-white shadow-xl">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Clock className="text-blue-400" size={28} /> Schedule Overrides
          </h1>
          <p className="text-blue-200/60 font-medium">Define your master schedule and daily exceptions</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 bg-white/10 p-2 rounded-2xl w-full lg:w-auto">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white text-slate-900 font-black rounded-xl outline-none px-6 py-2 w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* SIDEBAR: SLOT & GLOBAL MANAGEMENT */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Master Slot Configuration */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Settings2 size={18} className="text-indigo-600" />
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Master Slots</h3>
              </div>
              <button 
                onClick={() => setIsSlotEditorOpen(!isSlotEditorOpen)}
                className="text-[10px] font-black bg-slate-900 text-white px-2 py-1 rounded uppercase"
              >
                {isSlotEditorOpen ? 'Close' : 'Add Slot'}
              </button>
            </div>

            {isSlotEditorOpen && (
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-2">
                  <input type="time" value={newSlot.start_time} onChange={e => setNewSlot({...newSlot, start_time: e.target.value})} className="p-2 border rounded-lg text-sm font-bold" />
                  <input type="time" value={newSlot.end_time} onChange={e => setNewSlot({...newSlot, end_time: e.target.value})} className="p-2 border rounded-lg text-sm font-bold" />
                </div>
                <button onClick={addSlot} disabled={isProcessing} className="w-full py-2 bg-indigo-600 text-white rounded-lg font-black text-xs uppercase tracking-widest">
                  Confirm New Slot
                </button>
              </div>
            )}

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {slots.map(slot => (
                <div key={slot.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl group">
                  <div className="flex items-center gap-2">
                    <input 
                      type="time" 
                      value={slot.start_time.slice(0,5)} 
                      onChange={e => updateSlotTiming(slot.id, 'start_time', e.target.value)}
                      className="bg-transparent font-bold text-xs text-slate-600 outline-none"
                    />
                    <span className="text-slate-300">-</span>
                    <input 
                      type="time" 
                      value={slot.end_time.slice(0,5)} 
                      onChange={e => updateSlotTiming(slot.id, 'end_time', e.target.value)}
                      className="bg-transparent font-bold text-xs text-slate-600 outline-none"
                    />
                  </div>
                  <button onClick={() => deleteSlot(slot.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Fleet Capacity */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={18} className="text-indigo-600" />
              <h3 className="font-black text-sm uppercase tracking-widest text-slate-800">Fleet Capacity</h3>
            </div>
            <div className="flex gap-2">
              <input type="number" value={globalCapacity} onChange={(e) => setGlobalCapacity(parseInt(e.target.value))} className="w-full p-3 bg-slate-50 border rounded-xl font-bold text-center outline-none" />
              <button onClick={updateGlobalCapacity} className="bg-indigo-600 text-white px-4 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">
                <Save size={18}/>
              </button>
            </div>
          </div>

          {/* Closure Card */}
          <div className={`p-6 rounded-3xl border-2 transition-all ${isFullDayBlocked ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className="font-black text-sm uppercase tracking-widest text-slate-800 mb-4">Closure Actions</h3>
            {isFullDayBlocked ? (
              <button onClick={toggleGlobalBlock} className="w-full py-3 bg-white border-2 border-red-500 text-red-500 font-black rounded-xl text-[10px] uppercase tracking-widest">Remove Date Block</button>
            ) : (
              <div className="space-y-4">
                <input placeholder="Reason..." value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl text-sm" />
                <button onClick={toggleGlobalBlock} className="w-full py-3 bg-red-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest">Block Entire Date</button>
              </div>
            )}
          </div>
        </div>

        {/* MAIN MATRIX */}
        <div className={`lg:col-span-8 space-y-6 ${isFullDayBlocked ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden relative min-h-[400px]">
            <div className="p-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-xs tracking-widest">
                Daily Availability Matrix
              </h3>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-black text-slate-400 uppercase">Open</span></div>
                 <div className="flex items-center gap-2"><div className="w-2 h-2 bg-red-500 rounded-full"></div><span className="text-[10px] font-black text-slate-400 uppercase">Blocked</span></div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Slot (Slots Size)</th>
                    {services.map(service => (
                      <th key={service.id} className="p-4 text-center text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-l border-slate-100 min-w-[120px]">
                        {service.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slots.map(slot => (
                    <tr key={slot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-6 bg-slate-50/30">
                        <div className="flex items-center justify-between gap-4">
                          <div className="font-black text-sm text-slate-700 whitespace-nowrap">{slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)}</div>
                          <input 
                            type="number" 
                            value={slot.capacity} 
                            onChange={(e) => updateSlotTiming(slot.id, 'capacity', parseInt(e.target.value))}
                            className="w-12 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-center outline-none focus:border-indigo-500"
                          />
                        </div>
                      </td>
                      {services.map(service => {
                        const isBlocked = exceptions.some(e => e.slot_id === slot.id && e.service_id === service.id);
                        return (
                          <td key={service.id} className="p-3 border-l border-slate-100">
                            <button
                              onClick={() => toggleSlotException(slot.id, service.id)}
                              className={`w-full py-2.5 rounded-xl font-black text-[9px] transition-all flex flex-col items-center justify-center gap-1 ${
                                isBlocked ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:scale-105'
                              }`}
                            >
                              {isBlocked ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                              {isBlocked ? 'BLOCKED' : 'AVAILABLE'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {loading && (
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm z-20">
                <Loader2 className="animate-spin text-slate-900" size={40} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}