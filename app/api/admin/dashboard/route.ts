// src/app/api/admin/dashboard/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServer();

  const { count } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({
    services: count ?? 0,
  });
}
