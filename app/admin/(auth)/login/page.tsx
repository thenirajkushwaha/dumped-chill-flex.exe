"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ShieldCheck, Mail, Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, msg: string | null }>({ type: null, msg: null });

  // CHECK SESSION: If a user is already logged in, kick them to dashboard immediately
  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.replace("/admin/dashboard");
        router.refresh();
      }
    };
    checkUser();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: null, msg: null });

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({ type: 'error', msg: data.error ?? "Login failed" });
      } else {
        setStatus({ type: 'success', msg: "Magic link dispatched! Please check your inbox." });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: "Connection error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      {/* DECORATIVE BACKGROUND */}
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />

      <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* HEADER */}
          <div className="bg-[#0A2540] p-8 text-center space-y-4">
            <div className="inline-flex p-3 bg-white/10 rounded-2xl text-white mb-2">
              <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">Admin Access</h1>
            <p className="text-blue-200/60 text-sm font-medium">Verify your credentials to enter the suite</p>
          </div>

          {/* FORM AREA */}
          <div className="p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-[#0A2540] transition-colors" size={18} />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-[#0A2540] focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0A2540] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#081d33] transition-all shadow-lg shadow-blue-900/10 active:scale-[0.98] disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Send Magic Link
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* MESSAGE FEEDBACK */}
            {status.msg && (
              <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-bottom-2 ${
                status.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                : 'bg-red-50 border-red-100 text-red-700'
              }`}>
                {status.type === 'success' ? <CheckCircle2 className="mt-0.5" size={18} /> : <AlertCircle className="mt-0.5" size={18} />}
                <p className="text-sm font-bold leading-tight">{status.msg}</p>
              </div>
            )}
          </div>
          
          {/* FOOTER */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Secure Environment • Alpha Version 1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}