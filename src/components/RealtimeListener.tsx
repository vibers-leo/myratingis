"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";

// 알림 설정 인터페이스 (전역 관리를 위해 localStorage 사용)
export interface NotificationSettings {
  projects: boolean;
  recruit: boolean;
  likes: boolean;
  proposals: boolean;
  notices: boolean;
  adminInquiries: boolean;
  adminSignups: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  projects: true,
  recruit: true,
  likes: true,
  proposals: true,
  notices: true,
  adminInquiries: true,
  adminSignups: true,
};

/**
 * 실시간 DB 알림 리스너 (UI 없음)
 */
export default function RealtimeListener() {
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { isAdmin } = useAdmin();
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);

  // 설정 로드
  useEffect(() => {
    const loadSettings = () => {
      const saved = localStorage.getItem("notification_settings");
      if (saved) {
        try {
          setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) });
        } catch (e) {
          console.error("Failed to parse settings", e);
        }
      }
    };

    loadSettings();
    // 설정 변경 감지를 위해 storage 이벤트 리스너 추가
    window.addEventListener("storage", loadSettings);
    // 커스텀 이벤트 감지 (동일 탭 내 변경)
    window.addEventListener("notificationSettingsChanged", loadSettings);
    
    return () => {
      window.removeEventListener("storage", loadSettings);
      window.removeEventListener("notificationSettingsChanged", loadSettings);
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('myratingis_user_notifications')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          const newNoti = payload.new as any;
          
          // 알림 수신 (Toast 표시)
          toast(newNoti.title, {
            description: newNoti.message,
            action: newNoti.link ? { label: "보기", onClick: () => router.push(newNoti.link) } : undefined,
          });
          
          // 전역 이벤트나 상태 업데이트 트리거가 필요하면 여기서 처리
          // useNotifications 훅이 실시간 갱신을 지원하지 않는다면 여기서 강제 리로드 신호를 줄 수 있음
        }
      )
      // ... (기타 공지사항      // 1. 공지사항 (전체 수신)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notices' },
        (payload) => {
          if (!settings.notices) return;
          toast.info("📢 신규 공지", {
            description: payload.new.title,
            action: { label: "보기", onClick: () => router.push('/notices') }
          });
        }
      );

    // 6. 관리자 알림
    if (isAdmin) {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'inquiries' },
          (payload) => {
            if (!settings.adminInquiries) return;
            toast("✉️ [Admin] 새 문의", {
              description: payload.new.message?.substring(0, 20),
              action: { label: "이동", onClick: () => router.push('/admin/inquiries') }
            });
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'profiles' },
          (payload) => {
            if (!settings.adminSignups) return;
            toast("👤 [Admin] 신규 가입", {
              description: `${payload.new.username}님`,
              action: { label: "관리", onClick: () => router.push('/admin/users') }
            });
          }
        );
    }

    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [router, user, userProfile, isAdmin, settings]);

  return null; // UI는 NotificationBell로 통합
}
