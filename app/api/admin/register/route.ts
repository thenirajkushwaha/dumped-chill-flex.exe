// src/app/api/admin/register/route.ts
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { adminExists } from "@/lib/admin/checkAdmin";

export async function POST(req: Request) {
  const { email } = await req.json();

  if (await adminExists()) {
    return NextResponse.json(
      { error: "Admin already registered" },
      { status: 403 }
    );
  }

  const supabase = await createSupabaseServer();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/services`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await supabase.from("admin_lock").insert({
    admin_email: email,
  });

  return NextResponse.json({ success: true });
}
