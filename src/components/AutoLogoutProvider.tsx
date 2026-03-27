"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/AuthContext";

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30분
const THROTTLE_MS = 30_000;

export function AutoLogoutProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const inactivityTimer = useRef<NodeJS.Timeout>();
  const lastResetTime = useRef(0);

  const handleSignOut = useCallback(async () => {
    if (user) {
      await signOut();
      toast("30분 동안 활동이 없어 자동 로그아웃되었습니다.");
    }
  }, [user, signOut]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    if (now - lastResetTime.current < THROTTLE_MS) return;
    lastResetTime.current = now;

    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(handleSignOut, INACTIVITY_TIMEOUT);
  }, [handleSignOut]);

  useEffect(() => {
    if (!user) return;

    const events = ["keydown", "click", "touchstart"];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [user, resetTimer]);

  return <>{children}</>;
}
