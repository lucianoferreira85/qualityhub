"use client";

import { createContext, useEffect, useState, useRef, useMemo, type ReactNode } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef(createSupabaseBrowserClient());

  useEffect(() => {
    const supabase = supabaseRef.current;
    let mounted = true;

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (mounted) {
        setUser(user);
        setLoading(false);
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabaseRef.current.auth.signOut();
    setUser(null);
    window.location.href = "/";
  };

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signOut }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
