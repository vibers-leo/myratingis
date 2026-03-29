'use client';

import { useEffect } from 'react';

interface TossExitModalProps {
  isOpen: boolean;
  serviceName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function TossExitModal({
  isOpen,
  serviceName,
  onCancel,
  onConfirm,
}: TossExitModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  // 스크롤 잠금
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* 모달 */}
      <div className="relative mx-6 w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-xl">
        <p className="mb-6 text-center text-[17px] font-semibold text-gray-900 leading-relaxed">
          {serviceName}을 종료할까요?
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl bg-gray-100 py-3 text-[15px] font-medium text-gray-700 transition-colors active:bg-gray-200"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-blue-500 py-3 text-[15px] font-medium text-white transition-colors active:bg-blue-600"
          >
            종료하기
          </button>
        </div>
      </div>
    </div>
  );
}
