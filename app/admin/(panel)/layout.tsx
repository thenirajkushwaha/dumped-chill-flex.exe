import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import AdminSidebar from "../components/adminsidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <AdminSidebar />
      {/* ml-0 on mobile, ml-64 on desktop. 
          pt-16 on mobile to account for the fixed Top Bar. 
      */}
      <main className="flex-1 transition-all duration-300 lg:ml-64 pt-16 lg:pt-0 min-w-0 overflow-hidden">
        <div className="h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}