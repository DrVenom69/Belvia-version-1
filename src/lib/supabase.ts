import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

console.log("🔑 [supabase.ts] Initialization check:", {
  supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  isPlaceholder: supabaseUrl === "https://your-project.supabase.co"
});

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://your-project.supabase.co");

export const supabase = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "belvia-supabase-auth-token"
      }
    })
  : null;

/** True when real Supabase credentials are present in env vars */
export const isSupabaseConfigured = isConfigured;
