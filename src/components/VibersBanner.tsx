'use client';

import { useEffect, useState, useCallback } from 'react';

/**
 * Vibers 크로스 프로모션 배너 컴포넌트
 *
 * ai-recipe API에서 랜덤 배너를 가져와 표시한다.
 * 다른 프로젝트에 복사해서 사용할 수 있다.
 *
 * 사용법:
 * <VibersBanner size="leaderboard" currentProject="vibefolio" />
 */

type BannerSize = 'leaderboard' | 'medium' | 'wide' | 'mobile' | 'square';

interface VibersBannerProps {
  /** 배너 사이즈 */
  size?: BannerSize;
  /** 현재 프로젝트 ID (자기 자신 배제) */
  currentProject?: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 자동 로테이션 간격 (밀리초, 기본 30000) */
  rotateInterval?: number;
  /** API 베이스 URL */
  apiBaseUrl?: string;
}

interface BannerProject {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  url: string;
  color: string;
}

interface BannerResponse {
  success: boolean;
  banners: Array<{
    project: BannerProject;
    size: { name: string; width: number; height: number };
    cta: string;
    imageUrl: string;
    html: string;
  }>;
}

const BANNER_DIMENSIONS: Record<BannerSize, { width: number; height: number }> = {
  leaderboard: { width: 728, height: 90 },
  medium: { width: 300, height: 250 },
  wide: { width: 970, height: 90 },
  mobile: { width: 320, height: 50 },
  square: { width: 250, height: 250 },
};

const API_BASE = 'https://ai.vibers.co.kr';

export default function VibersBanner({
  size = 'leaderboard',
  currentProject,
  className = '',
  rotateInterval = 30000,
  apiBaseUrl,
}: VibersBannerProps) {
  const [banner, setBanner] = useState<BannerResponse['banners'][0] | null>(null);
  const [loading, setLoading] = useState(true);

  const baseUrl = apiBaseUrl || API_BASE;
  const dimensions = BANNER_DIMENSIONS[size];

  const fetchBanner = useCallback(async () => {
    try {
      const params = new URLSearchParams({ size, count: '1' });
      if (currentProject) params.set('exclude', currentProject);

      const res = await fetch(`${baseUrl}/api/banners?${params.toString()}`);
      if (!res.ok) return;

      const data: BannerResponse = await res.json();
      if (data.success && data.banners.length > 0) {
        setBanner(data.banners[0]);
      }
    } catch {
      // 배너 로딩 실패 시 조용히 무시
    } finally {
      setLoading(false);
    }
  }, [baseUrl, size, currentProject]);

  useEffect(() => {
    fetchBanner();

    if (rotateInterval > 0) {
      const timer = setInterval(fetchBanner, rotateInterval);
      return () => clearInterval(timer);
    }
  }, [fetchBanner, rotateInterval]);

  if (loading || !banner) {
    return (
      <div
        className={className}
        style={{
          width: dimensions.width,
          maxWidth: '100%',
          height: dimensions.height,
          borderRadius: 8,
          background: '#f5f5f5',
        }}
      />
    );
  }

  const { project, cta } = banner;
  const isVertical = size === 'medium' || size === 'square';
  const isSmall = dimensions.height <= 50;

  return (
    <a
      href={`${project.url}?utm_source=vibers_banner&utm_medium=display&utm_campaign=cross_promo`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isVertical ? 'center' : 'space-between',
        width: dimensions.width,
        maxWidth: '100%',
        height: dimensions.height,
        background: `linear-gradient(${isVertical ? '135deg' : '90deg'}, ${project.color}14, ${project.color}28)`,
        border: `1px solid ${project.color}33`,
        borderRadius: isSmall ? 6 : 10,
        textDecoration: 'none',
        fontFamily: 'Pretendard, -apple-system, sans-serif',
        padding: isVertical ? 16 : isSmall ? '0 12px' : '0 20px',
        boxSizing: 'border-box',
        gap: isVertical ? 8 : isSmall ? 8 : 14,
        overflow: 'hidden',
        transition: 'opacity 0.2s',
      }}
    >
      {isVertical ? (
        <>
          <span style={{ fontSize: 10, color: project.color, fontWeight: 600, letterSpacing: 1.5 }}>
            VIBERS
          </span>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#222' }}>
            {project.nameKo}
          </span>
          <span style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
            {project.description}
          </span>
          <span
            style={{
              marginTop: 4,
              padding: '7px 18px',
              background: project.color,
              color: '#fff',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {cta}
          </span>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? 8 : 12, minWidth: 0 }}>
            <span
              style={{
                fontSize: isSmall ? 8 : 10,
                color: project.color,
                fontWeight: 600,
                letterSpacing: 1.5,
                flexShrink: 0,
              }}
            >
              VIBERS
            </span>
            <span
              style={{
                fontSize: isSmall ? 13 : 16,
                fontWeight: 700,
                color: '#222',
                flexShrink: 0,
              }}
            >
              {project.nameKo}
            </span>
            <span
              style={{
                fontSize: isSmall ? 10 : 12,
                color: '#666',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {project.description}
            </span>
          </div>
          <span
            style={{
              padding: isSmall ? '4px 10px' : '6px 14px',
              background: project.color,
              color: '#fff',
              borderRadius: 6,
              fontSize: isSmall ? 10 : 12,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cta}
          </span>
        </>
      )}
    </a>
  );
}
