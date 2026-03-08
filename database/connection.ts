import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

declare global {
  var __supabase: SupabaseClient | undefined;
  var __supabasePublic: SupabaseClient | undefined;
}

function getSupabase(): SupabaseClient {
  if (!global.__supabase) {
    global.__supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return global.__supabase;
}

function getSupabasePublic(): SupabaseClient {
  if (!global.__supabasePublic) {
    global.__supabasePublic = createClient(supabaseUrl, anonKey);
  }
  return global.__supabasePublic;
}

export const supabase = getSupabase();

export const supabasePublic = getSupabasePublic();
