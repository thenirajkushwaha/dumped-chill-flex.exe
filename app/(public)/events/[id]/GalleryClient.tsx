"use client";

import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function GalleryClient({ event, images }: { event: any; images: any[] }) {
  const [activeImage, setActiveImage] = useState<string | null>(null);

  return (
    <div className="bg-white min-h-screen font-sans text-black pb-24">
      <section className="pt-24 pb-12 px-6">
        <div className="max-w-[1080px] mx-auto space-y-6">
          <Link href="/events" className="group inline-flex items-center text-sm font-bold uppercase tracking-widest text-[#289BD0]">
            <ChevronLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" /> Back
          </Link>
          <div className="space-y-4">
            <h1 className="text-[52px] md:text-[72px] leading-tight font-bold tracking-tight">
              {event.title}
            </h1>
            <p className="text-xl font-light text-gray-500 max-w-2xl">{event.description}</p>
          </div>
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-6 grid grid-cols-2 md:grid-cols-3 gap-6">
        {images.map((img) => (
          <div 
            key={img.id}
            className="aspect-square overflow-hidden rounded-[32px] bg-[#F9F9F9] cursor-pointer group shadow-sm"
            onClick={() => setActiveImage(img.image_url)}
          >
            <img
              src={img.image_url}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              alt="Gallery item"
            />
          </div>
        ))}
      </section>

      <Dialog open={!!activeImage} onOpenChange={() => setActiveImage(null)}>
        <DialogContent className="max-w-5xl p-0 bg-transparent border-none flex items-center justify-center">
          <img
            src={activeImage ?? ""}
            className="rounded-[40px] max-h-[90vh] w-auto object-contain shadow-2xl"
            alt="Expanded"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}