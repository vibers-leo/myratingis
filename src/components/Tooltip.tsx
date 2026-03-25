// src/components/Tooltip.tsx

"use client"; // 🚨 Tooltip은 클라이언트 상호작용 컴포넌트입니다.

import React from "react";
// 🚨 Alias 경로를 사용하도록 수정
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 🚨 AppTooltip의 Props를 TypeScript 인터페이스로 정의
interface TooltipWrapperProps {
  children: React.ReactNode; // 툴팁의 대상이 되는 컴포넌트
  description: string; // 툴팁에 표시될 내용
}

/**
 * AppTooltip.jsx를 마이그레이션한 Tooltip Wrapper 컴포넌트입니다.
 * TooltipProvider는 src/app/layout.tsx에 정의되어 있어야 합니다.
 */
export function TooltipWrapper({ children, description }: TooltipWrapperProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>
        <p>{description}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// 🚨 기존 index.ts 및 다른 파일과의 호환성을 위해
// 'AppTooltip'으로 내보냅니다.
export { TooltipWrapper as AppTooltip };
