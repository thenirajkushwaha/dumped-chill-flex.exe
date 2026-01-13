// app/admin/layout.tsx
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
    <body>
      <AdminSidebar />
      <main>{children}</main>
    </body>
  );
}
