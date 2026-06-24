import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabaseUrl = rawUrl?.trim();
export const supabaseAnonKey = rawAnonKey?.trim();

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

const decodedAnon = supabaseAnonKey ? parseJwt(supabaseAnonKey) : null;

console.log("🔑 [supabase.ts] Initialization check:", {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  anonKeyLength: supabaseAnonKey?.length,
  anonKeyStart: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 8)}...${supabaseAnonKey.substring(supabaseAnonKey.length - 8)}` : null,
  decodedAnon,
  isPlaceholder: supabaseUrl === "https://your-project.supabase.co"
});

const isConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== "https://your-project.supabase.co");

if (isConfigured && supabaseAnonKey && !supabaseAnonKey.startsWith("eyJ")) {
  console.error(
    `❌ [CRITICAL] VITE_SUPABASE_ANON_KEY is misconfigured! It must be a JWT starting with 'eyJ', but starts with '${supabaseAnonKey.substring(0, 8)}'. ` +
    `It looks like you might have accidentally configured VITE_SUPABASE_ANON_KEY with your VAPID_PUBLIC_KEY in Railway. ` +
    `Please set VITE_SUPABASE_ANON_KEY in Railway to your Supabase Project's 'anon' public key.`
  );
}

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
