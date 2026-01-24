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

  // Basic security check
  if (!data.user) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <AdminSidebar />
      <main className="flex-1 ml-64 min-w-0 overflow-hidden">
        <div className="h-full w-full">
          {children}
        </div>
      </main>
    </div>
  );
}