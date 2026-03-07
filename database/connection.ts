/**
 * database/connection.ts
 * Supabase client for Iskolar ng Mariveles.
 *
 * Two clients are exported:
 *  - `supabase`       — uses the Service Role Key, bypasses RLS. Use in API routes only.
 *  - `supabasePublic` — uses the Anon Key, respects RLS. Safe for client-side use.
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ----- Singleton clients (survive HMR in dev) -----
declare global {
  // eslint-disable-next-line no-var
  var __supabase: SupabaseClient | undefined;
  // eslint-disable-next-line no-var
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

/** Server-side Supabase client — bypasses RLS. Use only in API routes. */
export const supabase = getSupabase();

/** Client-side safe Supabase client — respects RLS. */
export const supabasePublic = getSupabasePublic();
