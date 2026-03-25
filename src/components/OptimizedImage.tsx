"use client";

import React, { Suspense, useState, useEffect, useCallback } from "react";
import Image from 'next/image';
import { ImageOff } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  fallbackSrc?: string;
  unoptimized?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  className = '',
  fill = false,
  width,
  height,
  priority = false,
  fallbackSrc = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
  unoptimized = false
}: OptimizedImageProps) {
  // Utility to proxy Supabase images for resizing (to save Egress traffic)
  const getOptimizedUrl = useCallback((originalUrl: string) => {
    if (!originalUrl) return originalUrl;
    
    // Only proxy images from Supabase storage or external high-res sources
    if (originalUrl.includes('supabase.co/storage/v1/object/public')) {
        // wsrv.nl is a free, open-source image proxy and resizer
        // Adjust width to 800px and quality to 80 for optimal balance
        return `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=800&q=80&output=webp`;
    }
    return originalUrl;
  }, []);

  const [imgSrc, setImgSrc] = useState(getOptimizedUrl(src));
  const [error, setError] = useState(false);

  // Sync state with src prop (fix for infinite scroll/stale images)
  useEffect(() => {
    setImgSrc(getOptimizedUrl(src));
    setError(false);
  }, [src, getOptimizedUrl]);

  const handleError = () => {
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
    } else {
      setError(true);
    }
  };

  if (error) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <ImageOff className="w-12 h-12 text-gray-300" />
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={className}
        onError={handleError}
        priority={priority}
        unoptimized={unoptimized}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={width || 800}
      height={height || 600}
      className={className}
      onError={handleError}
      priority={priority}
      unoptimized={unoptimized}
    />
  );
}
