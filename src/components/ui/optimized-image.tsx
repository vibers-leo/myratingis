"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
}

// 기본 blur placeholder
const DEFAULT_BLUR = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PC9zdmc+";

/**
 * 최적화된 이미지 컴포넌트
 * - Next.js Image 기반
 * - 자동 lazy loading
 * - 에러 시 폴백 이미지
 * - 로딩 상태 표시
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  priority = false,
  sizes,
  placeholder = "blur",
  blurDataURL = DEFAULT_BLUR,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 외부 URL인지 확인
  const isExternalUrl = src?.startsWith("http") || src?.startsWith("//");

  // 에러 시 폴백 이미지
  const fallbackSrc = "/placeholder-image.svg";

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  // src가 없거나 에러인 경우
  if (!src || hasError) {
    return (
      <div
        className={cn(
          "bg-gray-100 dark:bg-gray-800 flex items-center justify-center",
          className
        )}
        style={fill ? undefined : { width, height }}
      >
        <svg
          className="w-1/4 h-1/4 max-w-12 max-h-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    className: cn(
      "transition-opacity duration-300",
      isLoading ? "opacity-0" : "opacity-100",
      className
    ),
    onLoad: handleLoad,
    onError: handleError,
    priority,
    sizes: sizes || "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    ...(placeholder === "blur" && { placeholder, blurDataURL }),
  };

  if (fill) {
    return (
      <div className="relative w-full h-full">
        {isLoading && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
        )}
        <Image
          {...imageProps}
          fill
          style={{ objectFit: "cover" }}
          unoptimized={isExternalUrl}
        />
      </div>
    );
  }

  return (
    <div className="relative" style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse rounded" />
      )}
      <Image
        {...imageProps}
        width={width || 400}
        height={height || 300}
        unoptimized={isExternalUrl}
      />
    </div>
  );
}

/**
 * 아바타 이미지 컴포넌트
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          "rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center",
          className
        )}
        style={{ width: size, height: size }}
      >
        <svg
          className="w-1/2 h-1/2 text-gray-400"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn("rounded-full object-cover", className)}
      onError={() => setHasError(true)}
      unoptimized={src.startsWith("http")}
    />
  );
}
