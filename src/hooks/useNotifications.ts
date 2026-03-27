"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { toast } from "sonner";

export interface Notification {
  id: string;
  type: "like" | "comment" | "follow" | "mention" | "system";
  title: string;
  message: string;
  link?: string;
  read: boolean;
  action_label?: string;
  action_url?: string;
  createdAt: string;
  sender?: {
    id: string;
    nickname: string;
    profileImage?: string;
  };
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearAll: () => void;
}

/**
 * 알림 훅 (API 기반, Supabase Realtime 제거)
 */
export function useNotifications(): UseNotificationsReturn {
  const { user, token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!user || !token) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    // TODO: 알림 API 구현 시 연동
    // 현재는 빈 배열 반환
    setNotifications([]);
    setIsLoading(false);
  }, [user, token]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  useEffect(() => {
    loadNotifications();
    // 폴링으로 알림 새로고침 (30초마다)
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, clearAll };
}

export async function createNotification(params: {
  userId: string;
  type: Notification["type"];
  title: string;
  message: string;
  link?: string;
  senderId?: string;
  actionLabel?: string;
  actionUrl?: string;
}) {
  // TODO: 알림 생성 API 연동
  console.log('[Notifications] createNotification:', params);
}
