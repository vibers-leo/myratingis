// src/hooks/useAdmin.ts
// 관리자 권한 확인 훅 (AuthContext 기반으로 간소화)

import { useAuth } from "@/lib/auth/AuthContext";

interface AdminState {
  isAdmin: boolean;
  isLoading: boolean;
  userId: string | null;
  userRole: string | null;
}

export function useAdmin(): AdminState {
  const { isAdmin, loading, user, userProfile } = useAuth();

  return {
    isAdmin,
    isLoading: loading,
    userId: user?.id || null,
    userRole: userProfile?.role || (isAdmin ? 'admin' : 'user'),
  };
}

export default useAdmin;
