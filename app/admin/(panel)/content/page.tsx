'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  Plus, Trash2, Save, Eye, EyeOff, Loader2, Edit2, Upload, Image as ImageIcon
} from 'lucide-react';

/* ================= TYPES ================= */
interface Testimonial {
    id?: string;
    type: 'text' | 'video'; // Matches DB constraint
    name: string;
    role?: string; // Kept for UI, though optional in your SQL
    feedback: string | null;
    rating: number | null;
    video_url: string | null;
    thumbnail_url: string | null;
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
    updated_at?: string; // Replaces system parameters
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

const input = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const textarea = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';
const label = 'text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block';
const primaryBtn = 'inline-flex items-center gap-2 rounded-md bg-[#0A2540] px-4 py-2 text-sm font-semibold text-white hover:bg-[#081d33] transition-colors disabled:opacity-50';
const secondaryBtn = 'inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors';

/* ================= COMPONENT ================= */

export default function ContentManager() {
  const [tab, setTab] = useState<'gallery' | 'testimonials' | 'founder' | 'awareness'>('gallery');
  const [loading, setLoading] = useState(false);

  // Data States
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [founder, setFounder] = useState<Founder | null>(null);
  const [awarenessRows, setAwarenessRows] = useState<AwarenessRow[]>([]);
  const [events, setEvents] = useState<GalleryEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<GalleryEvent | null>(null);
  const [images, setImages] = useState<GalleryImage[]>([]);

  // Action States
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  /* --- ADD THIS TO YOUR COMPONENT STATES --- */
const [isUploadingImages, setIsUploadingImages] = useState(false);
const [isSavingEvent, setIsSavingEvent] = useState(false);

const [isSaving, setIsSaving] = useState(false);
const [isUploading, setIsUploading] = useState(false);

  /* ================= FETCH DATA ================= */

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      const [tRes, fRes, aRes, eRes] = await Promise.all([
        supabase.from('testimonials').select('*').order('created_at', { ascending: false }),
        supabase.from('founder_content').select('*').maybeSingle(),
        supabase.from('awareness').select('*').order('section_key', { ascending: true }),
        supabase.from('gallery_events').select('*')
      ]);

      setTestimonials(tRes.data || []);
      setFounder(fRes.data);
      setAwarenessRows(aRes.data || []);
      setEvents(eRes.data || []);
      setLoading(false);
    };
    loadAll();
  }, []);

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
      const updated = [...awarenessRows];
      updated[index].media_url = url;
      setAwarenessRows(updated);
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    } finally {
      setUploadingId(null);
    }
  };

  const saveAwareness = async () => {
    setSaving(true);
    const { error } = await supabase.from('awareness').upsert(awarenessRows);
    setSaving(false);
    if (error) alert(error.message);
    else alert("Awareness content updated!");
  };

  /* ================= RENDER ================= */

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-slate-50 p-6 min-h-screen">
      
      {/* TABS */}
      <div className="flex gap-2 rounded-xl border bg-white p-1.5 shadow-sm sticky top-4 z-20">
        {['founder', 'testimonials', 'gallery', 'awareness'].map((t) => (
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

      {loading && <div className="flex flex-col items-center py-20 text-slate-400"><Loader2 className="animate-spin mb-2" /> Loading...</div>}

      {/* AWARENESS TAB */}
      {!loading && tab === 'awareness' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-6 rounded-xl border shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Awareness Management</h2>
              <p className="text-sm text-slate-500">Standardized educational sections for your website.</p>
            </div>
            <button className={primaryBtn} onClick={saveAwareness} disabled={saving}>
              {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save All Changes
            </button>
          </div>

          <div className="grid gap-6">
            {awarenessRows.map((row, idx) => (
              <div key={row.id} className="bg-white border rounded-xl overflow-hidden shadow-sm grid grid-cols-1 lg:grid-cols-12">
                
                {/* Media Column */}
                <div className="lg:col-span-3 bg-slate-50 p-6 border-r flex flex-col items-center justify-center space-y-3">
                  <label className={label}>Section Media</label>
                  <div className="relative group aspect-video lg:aspect-square w-full bg-white rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                    {row.media_url ? (
                      <img src={row.media_url} alt="preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="text-slate-300" size={32} />
                    )}
                    
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <div className="text-white text-xs font-bold flex items-center gap-2">
                        {uploadingId === row.id ? <Loader2 className="animate-spin" /> : <Upload size={14} />}
                        Upload Image
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAwarenessUpload(e.target.files[0], idx)} />
                    </label>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono truncate w-full text-center">{row.section_key}</span>
                </div>

                {/* Content Column */}
                <div className="lg:col-span-5 p-6 space-y-4">
                  <div>
                    <label className={label}>Display Title</label>
                    <input className={input} value={row.title} onChange={e => {
                      const updated = [...awarenessRows];
                      updated[idx].title = e.target.value;
                      setAwarenessRows(updated);
                    }} />
                  </div>
                  <div>
                    <label className={label}>Description</label>
                    <textarea className={textarea} value={row.description} onChange={e => {
                      const updated = [...awarenessRows];
                      updated[idx].description = e.target.value;
                      setAwarenessRows(updated);
                    }} />
                  </div>
                </div>

                {/* Benefits Column */}
                <div className="lg:col-span-4 p-6 bg-slate-50/50">
                  <label className={label}>Benefits (one per line)</label>
                  <textarea 
                    className={`${textarea} min-h-[160px] text-xs font-medium`} 
                    placeholder="Enter benefits..."
                    value={row.benefits?.join('\n')} 
                    onChange={e => {
                      const updated = [...awarenessRows];
                      updated[idx].benefits = e.target.value.split('\n').filter(v => v.trim() !== '');
                      setAwarenessRows(updated);
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GALLERY TAB */}
      {tab === 'gallery' && (
  <div className="bg-white border rounded-xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-8 min-h-[600px]">
    
    {/* LEFT SIDEBAR: EVENT LIST */}
    <div className="space-y-4 border-r pr-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Events</h3>
        <button 
          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          onClick={() => {
            // Fix: Default to a valid category from your SQL constraint
            setActiveEvent({ 
              id: crypto.randomUUID(), 
              title: '', 
              description: '', 
              category: 'ice_bath' 
            });
            setImages([]); 
          }}
        >
          <Plus size={20} />
        </button>
      </div>
      
      <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2">
        {events.length === 0 && <p className="text-xs text-slate-400 italic">No events found.</p>}
        {events.map(ev => (
          <button 
            key={ev.id} 
            onClick={() => { setActiveEvent(ev); loadImages(ev.id); }}
            className={`w-full text-left p-3 rounded-xl border text-sm transition-all
              ${activeEvent?.id === ev.id 
                ? 'bg-[#0A2540] text-white border-[#0A2540] shadow-md' 
                : 'hover:bg-slate-50 border-slate-200 text-slate-600'}`}
          >
            <p className="font-semibold truncate">{ev.title || 'Draft Event'}</p>
            <p className={`text-[10px] uppercase tracking-wider ${activeEvent?.id === ev.id ? 'text-blue-200' : 'text-slate-400'}`}>
               {ev.category.replace('_', ' ')}
            </p>
          </button>
        ))}
      </div>
    </div>

    {/* RIGHT CONTENT: EDITOR & IMAGES */}
    <div className="md:col-span-3 space-y-8">
      {activeEvent ? (
        <>
          {/* Section 1: Event Details */}
          <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={label}>Event Title</label>
                <input 
                  className={`${input} !text-lg !font-bold`} 
                  placeholder="Enter event name..." 
                  value={activeEvent.title} 
                  onChange={e => setActiveEvent({ ...activeEvent, title: e.target.value })} 
                />
              </div>
              <div>
                <label className={label}>Category (Required by DB)</label>
                <select 
                  className={input}
                  value={activeEvent.category}
                  onChange={e => setActiveEvent({ ...activeEvent, category: e.target.value })}
                >
                  <option value="ice_bath">Ice Bath</option>
                  <option value="community_events">Community Events</option>
                  <option value="workshops">Workshops</option>
                  <option value="behind_the_scenes">Behind the Scenes</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className={label}>Event Description</label>
                <textarea 
                  className={textarea} 
                  placeholder="Describe this event..." 
                  value={activeEvent.description} 
                  onChange={e => setActiveEvent({ ...activeEvent, description: e.target.value })} 
                />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button 
                className={`${primaryBtn} min-w-[140px]`} 
                disabled={isSavingEvent || !activeEvent.title}
                onClick={async () => {
                  setIsSavingEvent(true);
                  const { error } = await supabase.from('gallery_events').upsert(activeEvent);
                  
                  if (error) {
                    alert("Database Error: " + error.message);
                  } else {
                    // Update local list
                    setEvents(prev => {
                      const exists = prev.find(e => e.id === activeEvent.id);
                      if (exists) return prev.map(e => e.id === activeEvent.id ? activeEvent : e);
                      return [activeEvent, ...prev];
                    });
                    alert("Event successfully saved!");
                  }
                  setIsSavingEvent(false);
                }}
              >
                {isSavingEvent ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {events.find(e => e.id === activeEvent.id) ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </div>
          
          {/* Section 2: Image Management */}
          <div className={`space-y-4 ${!events.find(e => e.id === activeEvent.id) ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            {!events.find(e => e.id === activeEvent.id) && (
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-amber-700 text-xs font-bold flex items-center gap-2">
                <Upload size={14} /> You must "Create Event" first before uploading photos.
              </div>
            )}
            
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-slate-700">Event Photos ({images.length})</h4>
              
              <label className={`cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
                ${isUploadingImages ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                {isUploadingImages ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                {isUploadingImages ? 'Uploading...' : 'Add Photos'}
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  disabled={isUploadingImages}
                  onChange={async e => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;

                    setIsUploadingImages(true);
                    for (const f of files) {
                      try {
                        const url = await uploadFile(f, 'gallery');
                        await supabase.from('gallery_images').insert({ 
                          event_id: activeEvent.id, 
                          image_url: url 
                        });
                      } catch (err) {
                        console.error("Upload failed", err);
                      }
                    }
                    await loadImages(activeEvent.id);
                    setIsUploadingImages(false);
                  }} 
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {isUploadingImages && (
                <div className="aspect-square rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/50 flex flex-col items-center justify-center text-blue-400 animate-pulse">
                   <Loader2 className="animate-spin mb-1" size={20} />
                   <span className="text-[10px] font-bold uppercase">Processing...</span>
                </div>
              )}

              {images.map(img => (
                <div key={img.id} className="relative aspect-square rounded-xl border border-slate-200 overflow-hidden group bg-slate-100">
                  <img src={img.image_url} className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      className="bg-white/20 hover:bg-red-500 backdrop-blur-md text-white p-2 rounded-full transition-colors"
                      onClick={async () => {
                        await supabase.from('gallery_images').delete().eq('id', img.id);
                        setImages(ims => ims.filter(i => i.id !== img.id));
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
          <ImageIcon size={48} className="text-slate-200 opacity-20" />
          <p className="text-sm font-medium">Select an event or click + to create one.</p>
        </div>
      )}
    </div>
  </div>
)}

      {/* FOUNDER & TESTIMONIALS (Condensed logic) */}
      {!loading && tab === 'founder' && founder && (
  <div className="max-w-4xl mx-auto space-y-6">
    <div className="bg-white border rounded-xl p-8 shadow-sm space-y-8">
      
      {/* HEADER & SAVE BUTTON */}
      <div className="flex justify-between items-end border-b pb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0A2540]">Founder Profile</h2>
          {founder.updated_at && (
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              LAST SYNCED: {new Date(founder.updated_at).toLocaleString()}
            </p>
          )}
        </div>
        <button 
          className={primaryBtn} 
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const { error } = await supabase
              .from('founder_content')
              .update({ 
                ...founder, 
                updated_at: new Date().toISOString() 
              })
              .eq('id', founder.id);
            setSaving(false);
            if (error) alert(error.message); else alert("Founder Profile saved successfully!");
          }}
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Save Profile
        </button>
      </div>

      {/* TOP SECTION: PHOTO & BASIC INFO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4">
          <label className={label}>Portrait Photo</label>
          <div className="relative aspect-[3/4] rounded-2xl border-2 border-dashed overflow-hidden bg-slate-50 group transition-all hover:border-blue-400">
            {founder.photo_url ? (
              <img src={founder.photo_url} className="w-full h-full object-cover" alt="Founder Portrait" />
            ) : (
              <div className="h-full flex items-center justify-center text-slate-300">
                <ImageIcon size={48} />
              </div>
            )}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-xs font-bold">
              <Upload size={20} className="mb-2" />
              CHANGE PHOTO
              <input type="file" className="hidden" accept="image/*" onChange={async e => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await uploadFile(file, 'founder');
                  setFounder({ ...founder, photo_url: url });
                }
              }} />
            </label>
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div>
            <label className={label}>Full Name</label>
            <input 
              className={input} 
              value={founder.founder_name} 
              onChange={e => setFounder({...founder, founder_name: e.target.value})} 
            />
          </div>
          <div>
            <label className={label}>Mission Statement</label>
            <textarea 
              className={`${textarea} min-h-[80px]`} 
              value={founder.mission} 
              onChange={e => setFounder({...founder, mission: e.target.value})} 
            />
          </div>
          <div>
            <label className={label}>Signature Quote</label>
            <textarea 
              className={`${textarea} italic font-serif h-24 bg-slate-50/50 border-blue-100`} 
              placeholder="A powerful quote that defines your philosophy..."
              value={founder.quote} 
              onChange={e => setFounder({...founder, quote: e.target.value})} 
            />
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: THE STORY (Journey, Vision, Why) */}
      <div className="border-t pt-8 space-y-6">
        <h3 className="text-lg font-semibold text-[#0A2540]">Founder Narratives</h3>
        
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className={label}>The Journey (Past)</label>
            <p className="text-[10px] text-slate-400 mb-2 uppercase">How it all started and the path taken.</p>
            <textarea 
              className={`${textarea} min-h-[120px]`} 
              value={founder.story_journey} 
              onChange={e => setFounder({...founder, story_journey: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={label}>The Vision (Future)</label>
              <p className="text-[10px] text-slate-400 mb-2 uppercase">The long-term impact and goal.</p>
              <textarea 
                className={`${textarea} min-h-[150px]`} 
                value={founder.story_vision} 
                onChange={e => setFounder({...founder, story_vision: e.target.value})} 
              />
            </div>
            <div>
              <label className={label}>The "Why" (Purpose)</label>
              <p className="text-[10px] text-slate-400 mb-2 uppercase">The core reason and passion behind the brand.</p>
              <textarea 
                className={`${textarea} min-h-[150px]`} 
                value={founder.story_why} 
                onChange={e => setFounder({...founder, story_why: e.target.value})} 
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
)}

{/* --- TESTIMONIALS SECTION --- */}
{!loading && tab === 'testimonials' && (
  <div className="space-y-8">
    <div className="flex justify-between items-center bg-white p-6 rounded-xl border shadow-sm">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Testimonials</h2>
        <p className="text-sm text-slate-500">Manage client feedback and visibility.</p>
      </div>
      <button 
        className={primaryBtn} 
        onClick={() => setEditingTestimonial({ name: '', role: '', feedback: '', rating: 5, is_visible: true, thumbnail_url: '', video_url: '' })}
      >
        <Plus size={16} /> Add New Testimonial
      </button>
    </div>

    {/* EDITOR MODAL/FORM */}
    {editingTestimonial && (
      <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-8 space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-blue-900">
            {editingTestimonial.id ? 'Edit Testimonial' : 'Create New Testimonial'}
          </h3>
          <button onClick={() => setEditingTestimonial(null)} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <label className={label}>User Image</label>
            <div className="relative aspect-square rounded-full w-32 h-32 mx-auto border-4 border-white shadow-md bg-slate-200 overflow-hidden group">
              {editingTestimonial.thumbnail_url ? (
                <img src={editingTestimonial.thumbnail_url} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="absolute inset-0 m-auto text-slate-400" />
              )}
              <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                <Upload size={16} className="text-white" />
                <input type="file" className="hidden" accept="image/*" onChange={async e => {
                   const file = e.target.files?.[0];
                   if(file) {
                     const url = await uploadFile(file, 'testimonials');
                     setEditingTestimonial({...editingTestimonial, thumbnail_url: url});
                   }
                }} />
              </label>
            </div>
            
            {/* NEW: VISIBILITY TOGGLE IN EDITOR */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="edit_visible"
                checked={editingTestimonial.is_visible}
                onChange={e => setEditingTestimonial({...editingTestimonial, is_visible: e.target.checked})}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="edit_visible" className="text-sm font-semibold text-slate-700">Visible on site</label>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="col-span-1">
              <label className={label}>Client Name</label>
              <input className={input} value={editingTestimonial.name} onChange={e => setEditingTestimonial({...editingTestimonial, name: e.target.value})} />
            </div>
            <div className="col-span-1">
              <label className={label}>Role / Title</label>
              <input className={input} value={editingTestimonial.role} onChange={e => setEditingTestimonial({...editingTestimonial, role: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className={label}>Video URL (Optional)</label>
              <input className={input} placeholder="https://youtube.com/..." value={editingTestimonial.video_url || ''} onChange={e => setEditingTestimonial({...editingTestimonial, video_url: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className={label}>Feedback Content</label>
              <textarea className={textarea} value={editingTestimonial.feedback} onChange={e => setEditingTestimonial({...editingTestimonial, feedback: e.target.value})} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-blue-100 pt-4">
          <button className={secondaryBtn} onClick={() => setEditingTestimonial(null)}>Cancel</button>
          <button className={primaryBtn} onClick={async () => {
            setIsSaving(true);
            const { data, error } = await supabase.from('testimonials').upsert(editingTestimonial).select();
            if(!error) {
              setTestimonials(prev => {
                const exists = prev.find(t => t.id === editingTestimonial.id);
                if (exists) return prev.map(t => t.id === editingTestimonial.id ? data[0] : t);
                return [data[0], ...prev];
              });
              setEditingTestimonial(null);
            }
            setIsSaving(false);
          }}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Save size={16} />} Save Testimonial
          </button>
        </div>
      </div>
    )}

    {/* GRID LISTING */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {testimonials.map(t => (
        <div key={t.id} className={`group bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative ${!t.is_visible ? 'opacity-75 grayscale-[0.5]' : ''}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border bg-slate-100 overflow-hidden">
                {t.thumbnail_url ? <img src={t.thumbnail_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300">?</div>}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 leading-none">{t.name}</h4>
                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{t.role}</p>
              </div>
            </div>
            
            {/* ACTIONS GROUP */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {/* NEW: QUICK VISIBILITY TOGGLE */}
              <button 
                onClick={async () => {
                   const { error } = await supabase.from('testimonials').update({ is_visible: !t.is_visible }).eq('id', t.id);
                   if(!error) setTestimonials(prev => prev.map(x => x.id === t.id ? {...x, is_visible: !x.is_visible} : x));
                }}
                className={`p-2 rounded-lg ${t.is_visible ? 'text-slate-400 hover:bg-slate-100' : 'text-amber-600 bg-amber-50'}`}
                title={t.is_visible ? "Hide" : "Show"}
              >
                {t.is_visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              
              <button onClick={() => setEditingTestimonial(t)} className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg"><Edit2 size={14} /></button>
              <button onClick={async () => {
                if(confirm("Delete this testimonial?")) {
                  await supabase.from('testimonials').delete().eq('id', t.id);
                  setTestimonials(prev => prev.filter(x => x.id !== t.id));
                }
              }} className="p-2 hover:bg-red-50 text-red-600 rounded-lg"><Trash2 size={14} /></button>
            </div>
          </div>

          <p className="text-sm text-slate-600 line-clamp-3 italic">"{t.feedback}"</p>
          
          <div className="mt-4 flex items-center gap-2">
            {t.video_url && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full uppercase">
                <Upload size={10} /> Video included
              </span>
            )}
            {!t.is_visible && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-full uppercase flex items-center gap-1">
                <EyeOff size={10} /> Hidden
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
)}
    </div>
  );
}