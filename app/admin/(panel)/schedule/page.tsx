'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Calendar, Clock, ShieldAlert, ShieldCheck, 
  Loader2, Plus, Trash2, Info, ChevronRight,
  Filter, Layers, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';

/* ---------- TYPES ---------- */

interface Slot {
  id: string;
  start_time: string;
  end_time: string;
  is_enabled: boolean;
}

interface Service {
  id: string;
  title: string;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

interface ScheduleException {
  id?: string;
  exception_date: string;
  slot_id: string;
  service_id: string;
  is_blocked: boolean;
}

export default function ScheduleManager() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Static Data
  const [slots, setSlots] = useState<Slot[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  
  // Dynamic Data
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    fetchStaticData();
    fetchDynamicData();
  }, [selectedDate]);

  const fetchStaticData = async () => {
    const [{ data: s }, { data: sl }] = await Promise.all([
      supabase.from('services').select('id, title'),
      supabase.from('slot_timings').select('*').eq('is_enabled', true).order('start_time')
    ]);
    if (s) setServices(s);
    if (sl) setSlots(sl);
  };

  const fetchDynamicData = async () => {
    setLoading(true);
    const [{ data: bd }, { data: ex }] = await Promise.all([
      supabase.from('blocked_dates').select('*').order('blocked_date'),
      supabase.from('schedule_exceptions').select('*').eq('exception_date', selectedDate)
    ]);
    if (bd) setBlockedDates(bd);
    if (ex) setExceptions(ex);
    setLoading(false);
  };

  /* ---------- ACTIONS ---------- */

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
    <div className="p-4 md:p-10 bg-slate-50 min-h-screen space-y-10 max-w-7xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Calendar className="text-indigo-600" size={32} />
            Schedule Overrides
          </h1>
          <p className="text-slate-500 font-medium">Manage holidays, closures, and slot-specific exceptions</p>
        </div>

        <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-2xl">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent font-black text-slate-700 outline-none px-4 py-2"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: GLOBAL BLOCK CONTROLS */}
        <div className="lg:col-span-4 space-y-6">
          <div className={`p-8 rounded-3xl border-2 transition-all duration-500 ${isFullDayBlocked ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-2xl ${isFullDayBlocked ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                <ShieldAlert size={24} />
              </div>
              <h3 className="font-black text-xl text-slate-800 tracking-tight">Full Day Block</h3>
            </div>

            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              Blocking a full day will override all individual slot timings. No bookings will be allowed for any service.
            </p>

            {isFullDayBlocked ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-red-100 text-red-700 text-sm font-bold flex items-center gap-2">
                  <Info size={16} /> 
                  CLOSED: {blockedDates.find(d => d.blocked_date === selectedDate)?.reason || 'No reason provided'}
                </div>
                <button 
                  onClick={toggleGlobalBlock}
                  className="w-full py-4 bg-white border-2 border-red-500 text-red-500 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-lg"
                >
                  REMOVE FULL BLOCK
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <input 
                  placeholder="Reason (e.g. Public Holiday)" 
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
                />
                <button 
                  onClick={toggleGlobalBlock}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700 transition-all shadow-xl shadow-red-100"
                >
                  BLOCK ENTIRE DATE
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Upcoming Closures</h4>
            <div className="space-y-2">
              {blockedDates.filter(d => new Date(d.blocked_date) >= new Date()).slice(0, 5).map(d => (
                <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-700">{d.blocked_date}</span>
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-lg font-black uppercase">Blocked</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: SURGICAL EXCEPTION MATRIX */}
        <div className={`lg:col-span-8 space-y-6 ${isFullDayBlocked ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-black text-slate-800 flex items-center gap-2 uppercase text-sm tracking-widest">
                <Clock className="text-indigo-600" size={18} /> 
                Slot-Service Matrix
              </h3>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                   <span className="text-[10px] font-bold text-slate-400">AVAILABLE</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                   <span className="text-[10px] font-bold text-slate-400">BLOCKED</span>
                 </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">Time Slot</th>
                    {services.map(service => (
                      <th key={service.id} className="p-6 text-center text-[10px] font-black text-slate-800 uppercase tracking-widest border-b border-l border-slate-100">
                        {service.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {slots.map(slot => (
                    <tr key={slot.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-6">
                        <div className="font-black text-slate-700">{slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)}</div>
                      </td>
                      {services.map(service => {
                        const isBlocked = exceptions.some(e => e.slot_id === slot.id && e.service_id === service.id);
                        return (
                          <td key={service.id} className="p-4 border-l border-slate-100 text-center">
                            <button
                              onClick={() => toggleSlotException(slot.id, service.id)}
                              className={`w-full py-3 rounded-xl font-black text-[10px] transition-all flex flex-col items-center justify-center gap-1 ${
                                isBlocked 
                                ? 'bg-red-50 text-red-600 border border-red-100' 
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:scale-105'
                              }`}
                            >
                              {isBlocked ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
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
              <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
              </div>
            )}
          </div>
          
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4">
             <AlertTriangle className="text-indigo-600 mt-1" size={20} />
             <div className="text-sm text-indigo-900 leading-relaxed">
               <span className="font-bold">Pro Tip:</span> In the matrix above, clicking a button toggles availability for that specific service at that specific time. This is useful for blocking "Combo" services while keeping "Single" services open if a specific resource (like a therapist or room) is unavailable.
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}