// src/lib/admin/checkAdmin.ts
import { createSupabaseServer } from "@/lib/supabase/server";

export async function adminExists() {
  const supabase = await createSupabaseServer();

  const { data } = await supabase
    .from("admin_lock")
    .select("admin_email")
    .single();

  return Boolean(data);
}
