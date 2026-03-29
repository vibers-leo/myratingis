'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, X, Share2, AlertTriangle, Home } from 'lucide-react';

interface TossNavBarProps {
  serviceName: string;
  onClose: () => void;
}

export default function TossNavBar({ serviceName, onClose }: TossNavBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isMenuOpen]);

  const handleShare = () => {
    setIsMenuOpen(false);
    if (navigator.share) {
      navigator.share({ url: window.location.href, title: serviceName });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('링크가 복사되었습니다.');
    }
  };

  const handleReport = () => {
    setIsMenuOpen(false);
    alert('신고가 접수되었습니다.');
  };

  const handleGoHome = () => {
    setIsMenuOpen(false);
    window.location.href = '/toss';
  };

  return (
    <nav className="sticky top-0 z-50 flex h-12 items-center justify-between bg-white px-4"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      {/* 좌측: 서비스명 */}
      <span className="text-[16px] font-bold text-gray-900">{serviceName}</span>

      {/* 우측: 더보기 + 닫기 */}
      <div className="flex items-center gap-1">
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors active:bg-gray-100"
            aria-label="더보기"
          >
            <MoreHorizontal className="h-5 w-5 text-gray-700" />
          </button>

          {/* 드롭다운 메뉴 */}
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-gray-100">
              <button
                onClick={handleShare}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors active:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                공유
              </button>
              <button
                onClick={handleReport}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors active:bg-gray-50"
              >
                <AlertTriangle className="h-4 w-4" />
                신고
              </button>
              <button
                onClick={handleGoHome}
                className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[14px] text-gray-700 transition-colors active:bg-gray-50"
              >
                <Home className="h-4 w-4" />
                홈으로
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors active:bg-gray-100"
          aria-label="닫기"
        >
          <X className="h-5 w-5 text-gray-700" />
        </button>
      </div>
    </nav>
  );
}
