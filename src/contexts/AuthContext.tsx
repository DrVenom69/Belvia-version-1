import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Dev mode fallback: store email in memory + localStorage ──
  const [devEmail, setDevEmail] = useState<string | null>(() =>
    localStorage.getItem("belvia_dev_email")
  );

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return;
    }

    // Check existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(
    async (email: string): Promise<{ success: boolean; message: string }> => {
      if (!email.trim()) {
        return { success: false, message: "Email is required." };
      }

      if (isSupabaseConfigured && supabase) {
        // ── Real Supabase magic link flow ──
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { shouldCreateUser: true },
        });

        if (error) {
          return { success: false, message: error.message };
        }

        // Dev: also store so the UI can show who's trying to log in
        localStorage.setItem("belvia_dev_email", email.trim());
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
    },
    []
  );

  const signOut = useCallback(async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem("belvia_dev_email");
    setDevEmail(null);
    setUser(null);
    setSession(null);
  }, []);

  // In dev mode (no Supabase), treat the stored email as the "user"
  const effectiveUser: User | null =
    user ?? (devEmail ? ({ email: devEmail, id: "dev-user" } as unknown as User) : null);

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        session,
        isLoading,
        signIn,
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
