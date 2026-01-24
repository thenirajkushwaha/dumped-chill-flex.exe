'use server';

import { createSupabaseServer } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function logoutAction() {
  const supabase = await createSupabaseServer();
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  
  // Redirect to login page
  redirect('/admin/login');
}