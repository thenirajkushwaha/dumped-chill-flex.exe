"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Package, 
  TicketPercent, 
  FileText, 
  Clock, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Bookings", href: "/admin/booking", icon: CalendarCheck },
  { label: "Services", href: "/admin/services", icon: Package },
  { label: "Promos", href: "/admin/promos", icon: TicketPercent },
  { label: "Content", href: "/admin/content", icon: FileText },
  { label: "Schedule", href: "/admin/schedule", icon: Clock },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen border-r bg-white flex flex-col fixed top-0 left-0 z-50">
      {/* BRANDING */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="bg-[#0A2540] p-2 rounded-lg text-white">
            <ShieldCheck size={20} />
          </div>
          <h1 className="text-xl font-black text-[#0A2540] tracking-tighter uppercase">
            Admin Suite
          </h1>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
          Main Menu
        </p>
        
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold transition-all
                ${active
                  ? "bg-[#0A2540] text-white shadow-lg shadow-blue-900/10"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={active ? "text-blue-400" : "text-slate-400 group-hover:text-slate-900"} />
                {item.label}
              </div>
              {active && <ChevronRight size={14} className="text-white/40" />}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t bg-slate-50/50">
        <div className="flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-slate-900 truncate uppercase">Administrator</p>
            <p className="text-[10px] text-slate-400 truncate">active_session</p>
          </div>
        </div>
      </div>
    </aside>
  );
}