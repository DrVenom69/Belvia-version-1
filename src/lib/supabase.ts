import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://your-project.supabase.co");

export const supabase = isConfigured
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : null;

/** True when real Supabase credentials are present in env vars */
export const isSupabaseConfigured = isConfigured;
