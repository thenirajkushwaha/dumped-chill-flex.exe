import Link from 'next/link';
import { FileSearch, Home, ChevronRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-6">
      <div className="max-w-xl w-full text-center space-y-10">
        
        {/* Large Visual 404 */}
        <div className="relative inline-block">
          <h1 className="text-[12rem] font-black text-slate-50 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-[#0A2540] p-5 rounded-3xl rotate-12 shadow-2xl shadow-blue-900/20">
              <FileSearch size={48} className="text-white" />
            </div>
          </div>
        </div>

        {/* Messaging */}
        <div className="space-y-4">
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
            Lost in the digital void?
          </h2>
          <p className="text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved to a different coordinate.
          </p>
        </div>

        {/* Smart Navigation Links */}
        <div className="grid grid-cols-1 sm:grid-cols-1 gap-4 max-w-md mx-auto pt-4">
          <Link 
            href="/"
            className="group flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-slate-100 transition-all text-left"
          >
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Homepage</p>
              <p className="font-bold text-slate-700">Back to Start</p>
            </div>
            <Home size={18} className="text-slate-400 group-hover:text-[#0A2540] transition-colors" />
          </Link>

        </div>

        {/* Footer help */}
        <p className="text-xs text-slate-400 font-medium">
          Think this is a mistake? Contact our support team.
        </p>
      </div>
    </div>
  );
}