import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Alert } from 'react-native';
import { supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  display_name?: string;
  full_name?: string;
  avatar_url?: string;
  toss_user_id?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  loading: boolean;
  loginWithToss: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userProfile: null,
  isAuthenticated: false,
  loading: true,
  loginWithToss: async () => {},
  loginWithEmail: async () => {},
  logout: async () => {},
});

/**
 * 앱인토스 환경인지 감지
 * 앱인토스 내에서 실행될 때는 @apps-in-toss/framework가 사용 가능
 */
function isAppsInTossEnvironment(): boolean {
  try {
    // 앱인토스 SDK가 설치되어 있으면 true
    require('@apps-in-toss/framework');
    return true;
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setUserProfile(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data } = await (supabase as any)
        .from('profiles')
        .select('id, display_name, full_name, avatar_url, toss_user_id')
        .eq('id', userId)
        .single();
      setUserProfile(data);
    } catch (e) {
      console.error('Failed to fetch profile:', e);
    }
  };

  /**
   * 토스 로그인 (앱인토스 환경)
   *
   * 플로우:
   * 1. appLogin() → authorizationCode 획득
   * 2. Supabase Edge Function에 code 전송 → JWT 발급
   * 3. supabase.auth.setSession()으로 세션 설정
   *
   * 인가 코드는 10분 내 만료, 1회만 사용 가능
   */
  const loginWithToss = async () => {
    try {
      if (isAppsInTossEnvironment()) {
        // 앱인토스 실제 로그인
        const { appLogin } = require('@apps-in-toss/framework');
        const { authorizationCode, referrer } = await appLogin();

        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const res = await fetch(`${supabaseUrl}/functions/v1/toss-auth`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: authorizationCode,
            referrer,
          }),
        });

        if (!res.ok) {
          throw new Error(`Auth failed: ${res.status}`);
        }

        const { access_token, refresh_token } = await res.json();
        await supabase.auth.setSession({ access_token, refresh_token });
      } else {
        // 개발 환경: 이메일/비밀번호 로그인 안내
        Alert.alert(
          '토스 로그인',
          '앱인토스 환경에서만 사용 가능합니다.\n\n개발 중에는 아래 테스트 계정으로 로그인하세요:\n\n이메일: test@myratingis.kr\n비밀번호: test1234',
        );
      }
    } catch (e: any) {
      console.error('Toss login failed:', e);
      Alert.alert('로그인 실패', e?.message || '다시 시도해주세요.');
    }
  };

  /**
   * 이메일 로그인 (개발/독립 앱 환경)
   */
  const loginWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (e: any) {
      console.error('Email login failed:', e);
      Alert.alert('로그인 실패', e?.message || '이메일 또는 비밀번호를 확인해주세요.');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      isAuthenticated: !!user,
      loading,
      loginWithToss,
      loginWithEmail,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
