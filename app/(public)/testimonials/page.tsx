"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { CardContent } from "@/components/ui/card";
import FullPageLoader from "../../../components/FullPageLoader";

type Testimonial = {
  id: string;
  type: "text" | "video";
  name: string;
  feedback: string | null;
  rating: number | null;
  video_url: string | null;
  thumbnail_url: string | null; // Used for profile photos
};

export default function TestimonialsPage() {
  const [data, setData] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("is_visible", true)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setData(data);
      }
      setTimeout(() => setLoading(false), 400);
    };

    fetchTestimonials();
  }, []);

  return (
    <>
      <FullPageLoader visible={loading} />
      
      <div className="bg-white min-h-screen font-sans text-black pb-24">
        {/* ---------- HERO ---------- */}
        <section className="pt-24 pb-16 px-6 text-center">
          <div className="max-w-[1080px] mx-auto space-y-4">
            <h1 className="text-[72px] md:text-[82px] leading-tight font-bold tracking-tight">
              Real <span className="text-[#289BD0]">Results.</span><br />
              Real <span className="text-[#5DB4DB]">Stories.</span>
            </h1>
            <p className="text-xl md:text-2xl font-light text-gray-500 max-w-2xl mx-auto pt-6">
              Hear from the community rewriting their recovery protocols at Chill Thrive.
            </p>
          </div>
        </section>

        <div className="max-w-[1100px] mx-auto px-6 space-y-24">
          
          {/* ---------- VIDEO TESTIMONIALS ---------- */}
          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl md:text-4xl font-semibold">Video Stories</h2>
              <div className="h-[1px] flex-grow bg-gray-200" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {data.filter(t => t.type === "video").map((t) => (
                <div key={t.id} className="group">
                  <div className="overflow-hidden rounded-[32px] bg-black aspect-video border-4 border-[#F9F9F9] shadow-sm transition-transform duration-300 group-hover:scale-[1.01]">
                    <iframe
                      src={t.video_url!}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  </div>
                  <div className="mt-5 px-2 flex items-center gap-4">
                    <img 
                      src={t.thumbnail_url || "/image/default-avatar.png"} 
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#289BD0]"
                    />
                    <div className="flex flex-col">
                      <span className="text-xl font-bold">{t.name}</span>
                      <span className="text-xs uppercase tracking-tighter text-gray-400 font-bold">Verified Member</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ---------- TEXT TESTIMONIALS ---------- */}
          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl md:text-4xl font-semibold">Community Feedback</h2>
              <div className="h-[1px] flex-grow bg-gray-200" />
            </div>

            <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
              {data.filter(t => t.type === "text").map((t) => (
                <div 
                  key={t.id} 
                  className="break-inside-avoid bg-[#F9F9F9] p-8 rounded-[32px] flex flex-col space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <img 
                      src={t.thumbnail_url || "/image/default-avatar.png"} 
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover grayscale hover:grayscale-0 transition-all"
                    />
                    <div>
                      <p className="font-bold leading-none">{t.name}</p>
                      <div className="flex text-[#289BD0] text-xs mt-1">
                        {"★".repeat(t.rating ?? 5)}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 leading-relaxed italic text-sm">
                    “{t.feedback}”
                  </p>

                  <div className="flex justify-end opacity-20">
                    <img src="/image/icebathhero.png" className="h-6 w-auto" alt="" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}