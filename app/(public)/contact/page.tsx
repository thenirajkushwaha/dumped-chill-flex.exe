"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen font-sans text-black pb-24">
      {/* ---------- HERO SECTION ---------- */}
      <section className="pt-24 pb-16 px-6 text-center">
        <div className="max-w-[1080px] mx-auto space-y-4">
          <h1 className="text-[72px] md:text-[82px] leading-tight font-bold tracking-tight">
            Get in <span className="text-[#289BD0]">Touch.</span>
          </h1>
          <p className="text-xl md:text-2xl font-light text-gray-500 max-w-2xl mx-auto pt-4">
            Have questions about protocols or bookings? We&apos;re here to help you thrive.
          </p>
        </div>
      </section>

      <div className="max-w-[1100px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* ---------- LEFT COLUMN: DETAILS & MAP ---------- */}
        <div className="space-y-8">
          <div className="bg-[#F9F9F9] p-10 rounded-[40px] space-y-8">
            <h2 className="text-3xl font-semibold mb-6">Studio Details</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-[#289BD0] p-3 rounded-2xl">
                   <img src="/image/arrow01.svg" className="h-5 w-5 -rotate-45" alt="" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Phone</p>
                  <p className="text-xl font-medium">+91 98765 43210</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-[#5DB4DB] p-3 rounded-2xl">
                   <img src="/image/arrow01.svg" className="h-5 w-5 -rotate-45" alt="" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Email</p>
                  <p className="text-xl font-medium">hello@chillthrive.in</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-black p-3 rounded-2xl">
                   <img src="/image/arrow01.svg" className="h-5 w-5 -rotate-45" alt="" />
                </div>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-gray-400">Location</p>
                  <p className="text-xl font-medium leading-relaxed">
                    Chill Thrive Wellness Studio,<br />
                    Surat, Gujarat, India
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MAP */}
          <div className="overflow-hidden rounded-[40px] border-8 border-[#F9F9F9] grayscale hover:grayscale-0 transition-all duration-500 shadow-sm">
            <iframe
              title="Google Maps"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119066.41709471133!2d72.7398946123447!3d21.159340299232335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be04e59411d1563%3A0xfe4558290938b042!2sSurat%2C%20Gujarat!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              className="w-full h-[350px] border-0"
              loading="lazy"
            />
          </div>
        </div>

        {/* ---------- RIGHT COLUMN: CONTACT FORM ---------- */}
        <div className="bg-white border-2 border-[#F9F9F9] p-10 rounded-[40px] shadow-sm">
          <h2 className="text-3xl font-semibold mb-8">Send a Message</h2>
          <form className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-xs uppercase tracking-widest font-bold text-gray-400">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  className="border-0 border-b-2 border-[#F9F9F9] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#289BD0] transition-colors bg-transparent text-lg"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="phone" className="text-xs uppercase tracking-widest font-bold text-gray-400">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+91 00000 00000"
                  className="border-0 border-b-2 border-[#F9F9F9] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#289BD0] transition-colors bg-transparent text-lg"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="message" className="text-xs uppercase tracking-widest font-bold text-gray-400">Your Inquiry</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us what's on your mind..."
                  rows={4}
                  className="border-0 border-b-2 border-[#F9F9F9] rounded-none px-0 focus-visible:ring-0 focus-visible:border-[#289BD0] transition-colors bg-transparent text-lg resize-none"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#289BD0] hover:bg-black text-white h-16 rounded-2xl text-xl font-semibold transition-all duration-300"
            >
              Send Message
            </Button>
          </form>
          
          <div className="mt-8 flex justify-center opacity-10">
             <img src="/image/icebathhero.png" className="h-16 grayscale" alt="" />
          </div>
        </div>

      </div>
    </div>
  );
}