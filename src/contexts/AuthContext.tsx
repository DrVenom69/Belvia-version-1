import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ success: boolean; message: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // ── Loud Production Guard ──
  if (import.meta.env.PROD && !isSupabaseConfigured) {
    throw new Error(
      "[FATAL] Supabase configuration is missing in production build! " +
      "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be properly configured in your production environment variables."
    );
  }

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Dev mode fallback: store email in memory + localStorage ──
  const [devEmail, setDevEmail] = useState<string | null>(() =>
    localStorage.getItem("belvia_dev_email")
  );

  useEffect(() => {
    // Log the current window location on mount
    console.log("🔑 [AuthContext] useEffect mount. URL:", window.location.href);
    console.log("🔑 [AuthContext] Hash:", window.location.hash);
    console.log("🔑 [AuthContext] Search:", window.location.search);
    console.log("🔑 [AuthContext] isSupabaseConfigured:", isSupabaseConfigured);

    if (window.location.hash) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get("access_token");
        if (accessToken) {
          console.log("🔑 [AuthContext] Found access_token in URL hash! Length:", accessToken.length);
          const base64Url = accessToken.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          console.log("🔑 [AuthContext] Decoded access_token payload:", payload);
        }
      } catch (e) {
        console.error("🔑 [AuthContext] Failed to decode access_token from hash:", e);
      }
    }

    if (!isSupabaseConfigured || !supabase) {
      console.log("🔑 [AuthContext] Supabase NOT configured in useEffect.");
      setIsLoading(false);
      return;
    }

    console.log("🔑 [AuthContext] Subscribed to auth states. Checking getSession...");

    // Check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log("🔑 [AuthContext] getSession resolved. Session user:", s?.user?.email, "session:", !!s);
      if (s) {
        console.log("🔑 [AuthContext] getSession found session metadata:", s.user?.user_metadata);
      }
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    }).catch(err => {
      console.error("🔑 [AuthContext] getSession error:", err);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      console.log("🔑 [AuthContext] onAuthStateChange event fired:", _event, "user:", s?.user?.email, "session:", !!s);
      if (s) {
        console.log("🔑 [AuthContext] onAuthStateChange session metadata:", s.user?.user_metadata);
      }
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      console.log("🔑 [AuthContext] Cleaning up auth subscription.");
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      if (!email.trim()) {
        return { success: false, message: "Email is required." };
      }

      try {
        if (isSupabaseConfigured && supabase) {
          // ── Real Supabase magic link flow ──
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { shouldCreateUser: true },
          });

          if (error) {
            return { success: false, message: error.message };
          }

          return {
            success: true,
            message: "Magic link sent! Check your email to sign in.",
          };
        } else {
          // ── Dev mode fallback ──
          localStorage.setItem("belvia_dev_email", email.trim());
          setDevEmail(email.trim());
          return { success: true, message: "Signed in (dev mode)." };
        }
      } catch (err: any) {
        return { success: false, message: err.message || "Failed to send magic link." };
      }
    },
    []
  );

  const signInWithGoogle = useCallback(
    async (): Promise<{ success: boolean; message: string }> => {
      try {
        if (isSupabaseConfigured && supabase) {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: window.location.origin,
            },
          });

          if (error) {
            return { success: false, message: error.message };
          }

          return { success: true, message: "Redirecting to Google..." };
        } else {
          // ── Dev mode fallback ──
          const emailStr = "google-demo@belvia.app";
          localStorage.setItem("belvia_dev_email", emailStr);
          setDevEmail(emailStr);
          return { success: true, message: "Signed in with Google (dev mode)." };
        }
      } catch (err: any) {
        return { success: false, message: err.message || "Google OAuth redirect failed." };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("belvia_dev_email");
    localStorage.removeItem("belvia_admin_key"); // Double-logout safety
    setDevEmail(null);
    setUser(null);
    setSession(null);
  }, []);

  // In dev mode (no Supabase), treat the stored email as the "user"
  const effectiveUser: User | null =
    user ?? (!isSupabaseConfigured && devEmail ? ({ email: devEmail, id: "dev-user" } as unknown as User) : null);

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        session,
        isLoading,
        signIn,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
