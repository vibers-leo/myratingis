"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// 자체 JWT 인증 시스템용 User 타입
export interface AuthUser {
  id: string;
  email: string;
  username?: string | null;
  nickname?: string | null;
  avatar_url?: string | null;
  role?: string | null;
  profile?: any;
  // Supabase 호환 필드 (기존 코드 호환성)
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithKakao: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  authError: string | null;
  userProfile: any;
  isAdmin: boolean;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// localStorage에서 토큰 관리
const TOKEN_KEY = 'mr_auth_token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // 토큰으로 현재 사용자 조회
  const fetchCurrentUser = useCallback(async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        // 토큰 만료 또는 무효
        removeStoredToken();
        setUser(null);
        setUserProfile(null);
        setToken(null);
        return;
      }

      const data = await res.json();
      const u = data.user;

      const authUser: AuthUser = {
        id: u.id,
        email: u.email,
        username: u.username,
        nickname: u.nickname,
        avatar_url: u.avatar_url,
        role: u.role,
        profile: u.profile,
        // 기존 코드 호환
        user_metadata: {
          nickname: u.nickname || u.username,
          avatar_url: u.avatar_url,
          profile_image_url: u.avatar_url,
        },
        app_metadata: { role: u.role },
      };

      setUser(authUser);
      setUserProfile(u.profile);
      setToken(authToken);
    } catch (e) {
      console.error('[AuthContext] fetchCurrentUser 실패:', e);
      removeStoredToken();
      setUser(null);
      setUserProfile(null);
      setToken(null);
    }
  }, []);

  // 초기화: 저장된 토큰으로 세션 복원
  useEffect(() => {
    const savedToken = getStoredToken();
    if (savedToken) {
      fetchCurrentUser(savedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  // 이메일 로그인
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setAuthError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || '로그인에 실패했습니다.');
      }

      setStoredToken(data.token);
      setToken(data.token);

      const u = data.user;
      const authUser: AuthUser = {
        id: u.id,
        email: u.email,
        username: u.username,
        nickname: u.nickname,
        avatar_url: u.avatar_url,
        role: u.role,
        profile: u.profile,
        user_metadata: {
          nickname: u.nickname || u.username,
          avatar_url: u.avatar_url,
          profile_image_url: u.avatar_url,
        },
        app_metadata: { role: u.role },
      };

      setUser(authUser);
      setUserProfile(u.profile);
      router.replace('/');
    } catch (error: any) {
      console.error('[AuthContext] Email Login Failed:', error);
      setAuthError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Google 로그인 — 현재는 placeholder (향후 Google OAuth 직접 구현)
  const signInWithGoogle = useCallback(async () => {
    toast.info('Google 로그인은 준비 중입니다. 이메일로 로그인해주세요.');
  }, []);

  // Kakao 로그인 — placeholder
  const signInWithKakao = useCallback(async () => {
    toast.info('카카오 로그인은 준비 중입니다. 이메일로 로그인해주세요.');
  }, []);

  // 로그아웃
  const signOut = useCallback(async () => {
    try {
      removeStoredToken();
      setUser(null);
      setUserProfile(null);
      setToken(null);
      router.replace('/login');
    } catch (error: any) {
      console.error('[AuthContext] Logout Failed:', error);
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
    isAdmin,
    token,
  }), [user, loading, signInWithGoogle, signInWithKakao, signInWithEmail, signOut, authError, userProfile, isAdmin, token]);

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
