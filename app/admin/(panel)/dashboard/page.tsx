// src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function Admin() {
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/admin/login");
  }

  return (
    <section>
      <h1>Admin Dashboard</h1>

      <ul>
        <li>Total Services</li>
        <li>Active Services</li>
        <li>Last Updated</li>
      </ul>
    </section>
  );
}
