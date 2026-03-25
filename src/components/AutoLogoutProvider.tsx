"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const THROTTLE_MS = 30_000; // 30초에 한 번만 타이머 리셋

export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();
  const inactivityTimer = useRef<NodeJS.Timeout>();
  const lastResetTime = useRef(0);

  const handleSignOut = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.auth.signOut();
      toast("30분 동안 활동이 없어 자동 로그아웃되었습니다.");
      router.push("/login");
    }
  }, [router]);

  const resetTimer = useCallback(() => {
    // 30초 이내 중복 리셋 방지
    const now = Date.now();
    if (now - lastResetTime.current < THROTTLE_MS) return;
    lastResetTime.current = now;

    if (inactivityTimer.current) {
      clearTimeout(inactivityTimer.current);
    }
    inactivityTimer.current = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
  }, [handleSignOut]);

  useEffect(() => {
    // 비로그인 상태면 리스너 등록 안 함
    if (!user) return;

    const events = ["keydown", "click", "touchstart"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      if (inactivityTimer.current) {
        clearTimeout(inactivityTimer.current);
      }
    };
  }, [user, resetTimer]);

  return <>{children}</>;
}
