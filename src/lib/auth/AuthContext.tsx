"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  userProfile: any;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
      } else {
        setUserProfile(data);
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    }
  }, []);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser(session.user);
          fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error("[AuthContext] Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AuthContext] Auth State Event: ${event}`);

      if (session) {
        setUser(session.user);
        fetchUserProfile(session.user.id);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const signInWithGoogle = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);

      console.log("[AuthContext] 🔑 Starting Google OAuth login...");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("[AuthContext] ❌ Google OAuth error:", error);
        throw error;
      }

      console.log("[AuthContext] ✅ Google OAuth redirect initiated:", data);
    } catch (error: any) {
      console.error("[AuthContext] ❌ Google Login Failed:", {
        message: error.message,
        status: error.status,
        code: error.code
      });
      setAuthError(error.message);
      toast.error("Google 로그인에 실패했습니다.");
      setLoading(false);
    }
  }, []);

  const signInWithKakao = useCallback(async () => {
    try {
      setLoading(true);
      setAuthError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      console.error("[AuthContext] Kakao Login Failed:", error.message);
      setAuthError(error.message);
      toast.error("카카오 로그인에 실패했습니다.");
      setLoading(false);
    }
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("[AuthContext] Sign-in successful:", data.user?.email);
      router.push("/");
    } catch (error: any) {
       console.error("Email Login Failed", error);
       setAuthError(error.message);
       throw error;
    } finally {
       setLoading(false);
    }
  }, [router]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error: any) {
      console.error("Logout Failed", error);
    }
  }, [router]);

  const isAdmin = useMemo(() =>
    userProfile?.role === 'admin' ||
    (user?.app_metadata as any)?.role === 'admin' ||
    user?.email?.toLowerCase() === 'design@designdlab.co.kr' ||
    user?.email?.toLowerCase() === 'highspringroad@gmail.com' ||
    user?.email?.toLowerCase() === 'juuunoder@gmail.com',
  [userProfile?.role, user?.app_metadata, user?.email]);

  const value = useMemo<AuthContextType>(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signInWithKakao,
    signInWithEmail,
    signOut,
    authError,
    userProfile,
    isAdmin
  }), [user, loading, signInWithGoogle, signInWithKakao, signInWithEmail, signOut, authError, userProfile, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
