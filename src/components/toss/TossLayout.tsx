'use client';

import { useState, useEffect } from 'react';
import TossNavBar from './TossNavBar';
import TossExitModal from './TossExitModal';
import { closeTossApp } from '@/lib/toss-bridge';

interface TossLayoutProps {
  serviceName: string;
  children: React.ReactNode;
}

export default function TossLayout({ serviceName, children }: TossLayoutProps) {
  const [showExitModal, setShowExitModal] = useState(false);

  // 라이트 모드 강제 + 핀치 줌 방지
  useEffect(() => {
    // dark 클래스 제거
    document.documentElement.classList.remove('dark');
    document.documentElement.style.colorScheme = 'light';

    // 핀치 줌 방지
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    // 뒤로가기 시 종료 모달
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      setShowExitModal(true);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleExit = () => {
    setShowExitModal(false);
    closeTossApp();
  };

  return (
    <div
      className="flex min-h-[100dvh] flex-col bg-white text-gray-900"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <TossNavBar
        serviceName={serviceName}
        onClose={() => setShowExitModal(true)}
      />

      <main className="flex-1">{children}</main>

      <TossExitModal
        isOpen={showExitModal}
        serviceName={serviceName}
        onCancel={() => setShowExitModal(false)}
        onConfirm={handleExit}
      />
    </div>
  );
}
