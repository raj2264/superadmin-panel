"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SuperadminContextValue {
  username: string;
  loading: boolean;
  signOut: () => Promise<void>;
}

const SuperadminContext = createContext<SuperadminContextValue | null>(null);

export function useSuperadmin() {
  const ctx = useContext(SuperadminContext);
  if (!ctx) throw new Error("useSuperadmin must be used within SuperadminProvider");
  return ctx;
}

export function SuperadminProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Avoid double-fetch in StrictMode / re-renders
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError || !session) {
          router.replace("/auth/login");
          return;
        }

        // Verify superadmin status AND get username in one query
        const { data: superadminData, error: superadminError } = await supabase
          .from("superadmins")
          .select("id, username")
          .eq("id", session.user.id)
          .single();

        if (!mounted) return;

        if (superadminError || !superadminData) {
          await supabase.auth.signOut();
          router.replace("/auth/login");
          return;
        }

        setUsername(superadminData.username || "SuperAdmin");
      } catch (error) {
        console.error("Auth check error:", error);
        if (mounted) {
          router.replace("/auth/login");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAuth();

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/auth/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  }, [router]);

  const value = useMemo<SuperadminContextValue>(
    () => ({ username, loading, signOut }),
    [username, loading, signOut]
  );

  return <SuperadminContext.Provider value={value}>{children}</SuperadminContext.Provider>;
}
