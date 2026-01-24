'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Plus, Trash2, Save, Eye, EyeOff, Loader2, Edit2, Upload, 
  Image as ImageIcon, MinusCircle, Link as LinkIcon, Globe, X, CheckCircle2
} from 'lucide-react';

/* ================= TYPES ================= */

interface Testimonial {
  id?: string;
  type: 'text' | 'video'; 
  name: string;
  feedback: string | null;
  rating: number | null;
  video_url: string | null;
  thumbnail_url: string | null;
  source_url: string | null;
  is_visible: boolean;
  created_at?: string;
}

interface Founder {
  id: string;
  founder_name: string;
  photo_url: string;
  quote: string;
  story_journey: string;
  story_vision: string;
  story_why: string;
  mission: string;
  values: string;
  updated_at?: string;
}

interface AwarenessRow {
  id: string;
  section_key: string;
  title: string;
  description: string;
  benefits: string[];
  media_url: string;
  is_active: boolean;
}

interface GalleryEvent {
  id: string;
  title: string;
  description: string;
  category: string;
}

interface GalleryImage {
  id: string;
  event_id: string;
  image_url: string;
}

/* ================= UI CLASSES ================= */

const inputClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const textareaClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const labelClass = 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block';
const primaryBtn = 'inline-flex items-center gap-2 rounded-md bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white hover:bg-[#081d33] transition-colors disabled:opacity-50 shadow-sm';
const secondaryBtn = 'inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors bg-white';
const dangerBtn = 'inline-flex items-center gap-2 rounded-md bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors border border-red-200';

/* ================= COMPONENT ================= */

export default function ContentManager() {
  const [tab, setTab] = useState<'founder' | 'testimonials' | 'gallery' | 'awareness'>('awareness');
  const [loading, setLoading] = useState(false);

  // Data States
  const [awarenessRows, setAwarenessRows] = useState<AwarenessRow[]>([]);
  const [newBenefit, setNewBenefit] = useState<{ [key: string]: string }>({});
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [founder, setFounder] = useState<Founder | null>(null);
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<GalleryEvent | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);

  // Action States
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [tRes, fRes, aRes, eRes] = await Promise.all([
      supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
      supabase.from('founder_content').select('*').maybeSingle(),
      supabase.from('awareness').select('*').order('section_key', { ascending: true }),
      supabase.from('gallery_events').select('*').order('created_at', { ascending: false })
    ]);

    setTestimonials(tRes.data || []);
    setFounder(fRes.data);
    setAwarenessRows(aRes.data || []);
    setEvents(eRes.data || []);
    setLoading(false);
  };

  const loadImages = async (eventId: string) => {
    const { data } = await supabase.from('gallery_images').select('*').eq('event_id', eventId);
    setImages(data || []);
  };

  /* ================= HELPERS ================= */

  const uploadFile = async (file: File, folder: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).slice(2, 9)}_${Date.now()}.${fileExt}`;
    const path = `${folder}/${fileName}`;
    const { error } = await supabase.storage.from('services-media').upload(path, file);
    if (error) throw error;
    return supabase.storage.from('services-media').getPublicUrl(path).data.publicUrl;
  };

  /* ================= AWARENESS ACTIONS ================= */

  const handleAwarenessUpload = async (file: File, index: number) => {
    const row = awarenessRows[index];
    setUploadingId(row.id);
    try {
      const url = await uploadFile(file, 'awareness');
      // Update Database immediately for persistence
      const { error } = await supabase.from('awareness').update({ media_url: url }).eq('id', row.id);
      if (error) throw error;

      const updated = [...awarenessRows];
      updated[index].media_url = url;
      setAwarenessRows(updated);
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleBenefitAdd = (idx: number) => {
    const key = awarenessRows[idx].section_key;
    const val = newBenefit[key];
    if (!val?.trim()) return;
    const up = [...awarenessRows];
    up[idx].benefits = [...(up[idx].benefits || []), val.trim()];
    setAwarenessRows(up);
    setNewBenefit({ ...newBenefit, [key]: '' });
  };

  const removeBenefit = (sectionIdx: number, benefitIdx: number) => {
    const up = [...awarenessRows];
    up[sectionIdx].benefits = up[sectionIdx].benefits.filter((_, i) => i !== benefitIdx);
    setAwarenessRows(up);
  };

  /* ================= TESTIMONIAL ACTIONS ================= */

  const toggleTestimonialVisibility = async (t: Testimonial) => {
    const next = !t.is_visible;
    setTestimonials(prev => prev.map(x => x.id === t.id ? { ...x, is_visible: next } : x));
    await supabase.from('testimonials').update({ is_visible: next }).eq('id', t.id);
  };

  /* ================= GALLERY ACTIONS ================= */

  const handleEventDelete = async () => {
    if (!activeEvent || !window.confirm("Permanently delete this entire event and all its images?")) return;
    setIsSavingEvent(true);
    const { error } = await supabase.from('gallery_events').delete().eq('id', activeEvent.id);
    if (!error) {
      setEvents(prev => prev.filter(e => e.id !== activeEvent.id));
      setActiveEvent(null);
      setImages([]);
    } else {
      alert("Delete failed: " + error.message);
    }
    setIsSavingEvent(false);
  };

  /* ================= RENDER ================= */

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-slate-50 p-6 min-h-screen">
      
      {/* TABS */}
      <div className="flex gap-2 rounded-xl border bg-white p-1.5 shadow-sm sticky top-4 z-20">
        {['awareness', 'founder', 'testimonials', 'gallery'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-bold transition-all
              ${tab === t ? 'bg-[#0A2540] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {loading && <div className="flex flex-col items-center py-20 text-slate-400"><Loader2 className="animate-spin mb-2" /> Loading Content...</div>}

      {/* AWARENESS TAB */}
      {!loading && tab === 'awareness' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-xl border shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Awareness Content</h2>
              <p className="text-xs text-slate-500">Persist text changes by clicking Save All. Images save automatically.</p>
            </div>
            <button className={primaryBtn} onClick={async () => {
              setIsSaving(true);
              await supabase.from('awareness').upsert(awarenessRows);
              setIsSaving(false);
              alert("Saved all changes!");
            }} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save All Text
            </button>
          </div>

          <div className="grid gap-6">
            {awarenessRows.map((row, idx) => (
              <div key={row.id} className="bg-white border rounded-xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3 space-y-3">
                  <label className={labelClass}>Section Image</label>
                  <div className="relative aspect-square rounded-xl border-2 border-dashed flex items-center justify-center bg-slate-50 overflow-hidden group">
                    {row.media_url ? <img src={row.media_url} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-300" size={40}/>}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold transition-opacity">
                      {uploadingId === row.id ? <Loader2 className="animate-spin" /> : <Upload size={20} className="mb-2" />}
                      UPLOAD IMAGE
                      <input type="file" className="hidden" accept="image/*" onChange={e => e.target.files?.[0] && handleAwarenessUpload(e.target.files[0], idx)} />
                    </label>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block text-center uppercase tracking-tighter">{row.section_key}</span>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <label className={labelClass}>Title</label>
                    <input className={inputClass} value={row.title} onChange={e => {
                      const up = [...awarenessRows]; up[idx].title = e.target.value; setAwarenessRows(up);
                    }} />
                  </div>
                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea className={textareaClass} value={row.description} onChange={e => {
                      const up = [...awarenessRows]; up[idx].description = e.target.value; setAwarenessRows(up);
                    }} />
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-3">
                  <label className={labelClass}>Benefits / Bullet Points</label>
                  <div className="flex gap-2">
                    <input 
                      className={inputClass} 
                      placeholder="Add point..." 
                      value={newBenefit[row.section_key] || ''}
                      onChange={e => setNewBenefit({...newBenefit, [row.section_key]: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleBenefitAdd(idx))}
                    />
                    <button onClick={() => handleBenefitAdd(idx)} className="bg-slate-900 text-white px-3 rounded-md hover:bg-black transition-colors"><Plus size={16}/></button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {row.benefits?.map((b, bIdx) => (
                      <span key={bIdx} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-2 border border-indigo-100">
                        {b} <button onClick={() => removeBenefit(idx, bIdx)}><MinusCircle size={14} className="text-indigo-300 hover:text-red-500 transition-colors"/></button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GALLERY TAB */}
      {!loading && tab === 'gallery' && (
        <div className="bg-white border rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-8 min-h-[600px]">
          <div className="space-y-4 border-r pr-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Gallery Events</h3>
              <button className="p-1.5 bg-blue-50 text-blue-600 rounded-lg" onClick={() => { setActiveEvent({ id: crypto.randomUUID(), title: '', description: '', category: 'ice_bath' }); setImages([]); }}>
                <Plus size={20} />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto max-h-[550px]">
              {events.map(ev => (
                <button key={ev.id} onClick={() => { setActiveEvent(ev); loadImages(ev.id); }}
                  className={`w-full text-left p-3 rounded-xl border text-sm transition-all
                    ${activeEvent?.id === ev.id ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-md' : 'hover:bg-slate-50 border-slate-100 text-slate-600'}`}>
                  <p className="font-bold truncate">{ev.title || 'Untitled Event'}</p>
                  <p className={`text-[10px] uppercase tracking-widest mt-1 ${activeEvent?.id === ev.id ? 'text-blue-300' : 'text-slate-400'}`}>{ev.category.replace('_', ' ')}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 space-y-8">
            {activeEvent ? (
              <>
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className={labelClass}>Event Title</label>
                      <input className={`${inputClass} !text-lg !font-bold`} value={activeEvent.title} onChange={e => setActiveEvent({...activeEvent, title: e.target.value})} />
                    </div>
                    <div>
                      <label className={labelClass}>Category</label>
                      <select className={inputClass} value={activeEvent.category} onChange={e => setActiveEvent({...activeEvent, category: e.target.value})}>
                        <option value="ice_bath">Ice Bath</option>
                        <option value="community_events">Community Events</option>
                        <option value="workshops">Workshops</option>
                        <option value="behind_the_scenes">Behind the Scenes</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Event Description</label>
                    <textarea className={textareaClass} value={activeEvent.description} onChange={e => setActiveEvent({...activeEvent, description: e.target.value})} />
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                    <button className={dangerBtn} onClick={handleEventDelete} disabled={isSavingEvent}>
                      {isSavingEvent ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />} Delete Entire Event
                    </button>
                    <button className={primaryBtn} onClick={async () => {
                      setIsSavingEvent(true);
                      await supabase.from('gallery_events').upsert(activeEvent);
                      setEvents(prev => prev.find(e => e.id === activeEvent.id) ? prev.map(e => e.id === activeEvent.id ? activeEvent : e) : [activeEvent, ...prev]);
                      setIsSavingEvent(false);
                      alert("Saved!");
                    }} disabled={isSavingEvent}>
                      {isSavingEvent ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Save Details
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-slate-700">Photos ({images.length})</h4>
                    <label className={secondaryBtn + " cursor-pointer"}>
                      {isUploadingImages ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />} Add Photos
                      <input type="file" multiple className="hidden" disabled={isUploadingImages} onChange={async e => {
                        const files = Array.from(e.target.files || []);
                        setIsUploadingImages(true);
                        for (const f of files) {
                          const url = await uploadFile(f, 'gallery');
                          await supabase.from('gallery_images').insert({ event_id: activeEvent.id, image_url: url });
                        }
                        await loadImages(activeEvent.id);
                        setIsUploadingImages(false);
                      }} />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map(img => (
                      <div key={img.id} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group bg-slate-100 shadow-sm">
                        <img src={img.image_url} className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                        <button className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg" onClick={async () => {
                          await supabase.from('gallery_images').delete().eq('id', img.id);
                          setImages(ims => ims.filter(i => i.id !== img.id));
                        }}><Trash2 size={14}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed rounded-3xl">
                <ImageIcon size={64} className="mb-4 opacity-10" />
                <p className="font-bold">Select an event from the sidebar to manage images</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* FOUNDER TAB */}
      {!loading && tab === 'founder' && founder && (
        <div className="max-w-4xl mx-auto bg-white border rounded-3xl p-10 shadow-sm space-y-10">
          <div className="flex justify-between items-end border-b pb-6">
            <div>
              <h2 className="text-3xl font-black text-[#0A2540] tracking-tight">Founder Profile</h2>
              {founder.updated_at && <p className="text-[10px] text-slate-400 font-mono mt-1 tracking-widest uppercase">Last Synced: {new Date(founder.updated_at).toLocaleString()}</p>}
            </div>
            <button className={primaryBtn + " px-8 py-3"} onClick={async () => {
              setIsSaving(true);
              await supabase.from('founder_content').update({...founder, updated_at: new Date().toISOString()}).eq('id', founder.id);
              setIsSaving(false);
              alert("Profile saved!");
            }} disabled={isSaving}>
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Update Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="space-y-4">
              <label className={labelClass}>Founder Portrait</label>
              <div className="relative aspect-[3/4] rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 group hover:border-blue-400 transition-all">
                {founder.photo_url ? <img src={founder.photo_url} className="w-full h-full object-cover shadow-inner" /> : <ImageIcon className="m-auto mt-24 text-slate-200" size={64} />}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-black cursor-pointer tracking-widest">
                  <Upload size={24} className="mb-2" /> CHANGE PHOTO
                  <input type="file" className="hidden" accept="image/*" onChange={async e => {
                    const f = e.target.files?.[0];
                    if (f) { const url = await uploadFile(f, 'founder'); setFounder({...founder, photo_url: url}); }
                  }} />
                </label>
              </div>
            </div>
            <div className="md:col-span-2 space-y-6">
              <div><label className={labelClass}>Founder Name</label><input className={`${inputClass} !text-lg !font-black`} value={founder.founder_name} onChange={e => setFounder({...founder, founder_name: e.target.value})} /></div>
              <div><label className={labelClass}>Mission Statement</label><textarea className={textareaClass} value={founder.mission} onChange={e => setFounder({...founder, mission: e.target.value})} /></div>
              <div><label className={labelClass}>Featured Quote</label><textarea className={`${textareaClass} !italic !font-serif !bg-slate-50 border-blue-100`} value={founder.quote} onChange={e => setFounder({...founder, quote: e.target.value})} /></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t">
            <div><label className={labelClass}>The Journey</label><textarea className={textareaClass} value={founder.story_journey} onChange={e => setFounder({...founder, story_journey: e.target.value})} /></div>
            <div><label className={labelClass}>The Vision</label><textarea className={textareaClass} value={founder.story_vision} onChange={e => setFounder({...founder, story_vision: e.target.value})} /></div>
            <div><label className={labelClass}>The "Why"</label><textarea className={textareaClass} value={founder.story_why} onChange={e => setFounder({...founder, story_why: e.target.value})} /></div>
          </div>
        </div>
      )}

      {/* TESTIMONIALS TAB */}
      {!loading && tab === 'testimonials' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Testimonials</h2>
              <p className="text-xs text-slate-400 font-medium">Manage social proof and credibility links.</p>
            </div>
            <button className={primaryBtn} onClick={() => setEditingTestimonial({ 
              type: 'text', name: '', feedback: '', rating: 5, is_visible: true, thumbnail_url: '', video_url: '', source_url: '' 
            })}>
              <Plus size={18} /> New Testimonial
            </button>
          </div>

          {editingTestimonial && (
            <div className="bg-white border-2 border-[#0A2540] rounded-3xl p-8 space-y-8 shadow-2xl animate-in fade-in zoom-in duration-300">
               <div className="flex justify-between items-center border-b pb-4">
                  <h3 className="text-xl font-bold text-[#0A2540]">{editingTestimonial.id ? 'Modify Testimonial' : 'Create Social Proof'}</h3>
                  <button onClick={() => setEditingTestimonial(null)} className="text-slate-400 hover:text-red-500"><X/></button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                  <div className="space-y-6">
                     <div>
                        <label className={labelClass}>Reviewer Avatar</label>
                        <div className="relative w-28 h-28 mx-auto rounded-full border-4 border-slate-50 overflow-hidden bg-slate-100 shadow-md group">
                           {editingTestimonial.thumbnail_url ? <img src={editingTestimonial.thumbnail_url} className="w-full h-full object-cover" /> : <div className="m-auto mt-10 text-center text-[10px] font-black text-slate-300 uppercase">No Image</div>}
                           <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                              <Upload size={16} className="text-white"/>
                              <input type="file" className="hidden" accept="image/*" onChange={async e => {
                                 if(e.target.files?.[0]) {
                                    const url = await uploadFile(e.target.files[0], 'testimonials');
                                    setEditingTestimonial({...editingTestimonial, thumbnail_url: url});
                                 }
                              }} />
                           </label>
                        </div>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-center">
                        <label className="flex items-center justify-center gap-3 cursor-pointer">
                           <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" checked={editingTestimonial.is_visible} onChange={e => setEditingTestimonial({...editingTestimonial, is_visible: e.target.checked})}/>
                           <span className="text-sm font-bold text-slate-700">Display on Site</span>
                        </label>
                     </div>
                  </div>

                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div><label className={labelClass}>Client Name</label><input className={inputClass} value={editingTestimonial.name} onChange={e => setEditingTestimonial({...editingTestimonial, name: e.target.value})}/></div>
                     <div><label className={labelClass}>Type</label>
                        <select className={inputClass} value={editingTestimonial.type} onChange={e => setEditingTestimonial({...editingTestimonial, type: e.target.value as any})}>
                           <option value="text">TEXT REVIEW</option>
                           <option value="video">VIDEO REVIEW</option>
                        </select>
                     </div>
                     <div className="md:col-span-2"><label className={labelClass}>Source URL (Google Review, Instagram, etc.)</label>
                        <div className="relative">
                           <LinkIcon size={14} className="absolute left-3 top-3 text-slate-400" />
                           <input className={`${inputClass} pl-10 font-mono text-xs`} placeholder="Link to original review..." value={editingTestimonial.source_url || ''} onChange={e => setEditingTestimonial({...editingTestimonial, source_url: e.target.value})}/>
                        </div>
                     </div>
                     {editingTestimonial.type === 'video' && <div className="md:col-span-2"><label className={labelClass}>Video URL</label><input className={inputClass} value={editingTestimonial.video_url || ''} onChange={e => setEditingTestimonial({...editingTestimonial, video_url: e.target.value})}/></div>}
                     <div className="md:col-span-2"><label className={labelClass}>Review Feedback</label><textarea className={textareaClass} value={editingTestimonial.feedback || ''} onChange={e => setEditingTestimonial({...editingTestimonial, feedback: e.target.value})}/></div>
                  </div>
               </div>

               <div className="flex justify-end gap-3 pt-6 border-t">
                  <button className={secondaryBtn} onClick={() => setEditingTestimonial(null)}>Discard</button>
                  <button className={primaryBtn + " px-10 py-3"} onClick={async () => {
                     setIsSaving(true);
                     const { data, error } = await supabase.from('testimonials').upsert(editingTestimonial).select().single();
                     if(!error && data) {
                        setTestimonials(prev => prev.find(t => t.id === editingTestimonial.id) ? prev.map(t => t.id === editingTestimonial.id ? data : t) : [data, ...prev]);
                        setEditingTestimonial(null);
                     }
                     setIsSaving(false);
                  }} disabled={isSaving}>
                    {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16}/>} Finalize Testimonial
                  </button>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.id} className={`group bg-white p-6 border rounded-2xl shadow-sm relative transition-all hover:shadow-lg ${!t.is_visible ? 'opacity-50 grayscale border-dashed bg-slate-50' : 'border-slate-100'}`}>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 overflow-hidden border border-slate-50 shadow-sm">
                    {t.thumbnail_url ? <img src={t.thumbnail_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-slate-300">AV</div>}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 leading-tight">{t.name}</h4>
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${t.type === 'video' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{t.type}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 italic line-clamp-3 mb-4 leading-relaxed">"{t.feedback}"</p>
                
                {t.source_url && (
                  <a href={t.source_url} target="_blank" className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:underline">
                    <Globe size={10} /> View Source
                  </a>
                )}

                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => toggleTestimonialVisibility(t)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors" title={t.is_visible ? "Hide" : "Show"}>
                    {t.is_visible ? <Eye size={16} className="text-slate-400"/> : <EyeOff size={16} className="text-amber-500"/>}
                  </button>
                  <button onClick={() => setEditingTestimonial(t)} className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-500 transition-colors"><Edit2 size={16}/></button>
                  <button onClick={async () => {
                    if(confirm("Delete this testimonial?")) {
                       await supabase.from('testimonials').delete().eq('id', t.id);
                       setTestimonials(ts => ts.filter(x => x.id !== t.id));
                    }
                  }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"><Trash2 size={16}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}