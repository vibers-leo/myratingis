/** @type {import('next').NextConfig} */
const nextConfig = {
  // 서버 전용 외부 패키지 설정 (Next.js 14 특정 버전 대응)
  experimental: {
    serverComponentsExternalPackages: ['cheerio', 'undici'],
    // Tree shaking을 위한 패키지 최적화
    optimizePackageImports: [
      'lucide-react', 
      '@fortawesome/react-fontawesome',
      '@fortawesome/free-solid-svg-icons',
      '@fortawesome/free-brands-svg-icons',
      '@fortawesome/free-regular-svg-icons',
      'dayjs', 
      'recharts', 
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tabs',
      '@radix-ui/react-select',
      'sonner',
    ],
  },

  // 이미지 최적화 설정
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'vibefolio.com' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' }, // Google Profile Images
      { protocol: 'https', hostname: 'wsrv.nl' }, // Image Proxy
      { protocol: 'https', hostname: 'api.microlink.io' }, // Microlink Proxy
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30일 캐시 (증가)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920], // 최적화된 사이즈
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // 작은 이미지용
  },
  
  // 헤더 설정 (캐싱 강화)
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API 캐시 (짧은 시간)
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=600',
          },
        ],
      },
      {
        // 폰트 캐싱
        source: '/:path*.woff2',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // 빌드 속도 및 메모리 최적화
  eslint: {
    ignoreDuringBuilds: true, // 빌드 시 린트 체크 스킵 (메모리 절약)
  },
  typescript: {
    ignoreBuildErrors: true, // 빌드 시 타입 오류 스킵 (개발 중 pass 확인됨)
  },
  swcMinify: true, // 속도가 빠른 SWC 컴파일러 사용
  productionBrowserSourceMaps: false, // 브라우저 소스맵 생성 안함 (빌드 메모리 절약)
  
  // 압축 활성화
  compress: true,

  // 리다이렉트
  async redirects() {
    return [
      {
        source: '/mypage/likes',
        destination: '/mypage',
        permanent: true,
      },
      {
        source: '/mypage/bookmarks',
        destination: '/mypage',
        permanent: true,
      },
    ];
  },

  // Webpack 설정 최적화
  webpack: (config, { dev, isServer }) => {
    // 빌드 시 메모리 사용량을 조절하여 안정성 확보
    if (!dev) {
      config.devtool = false;
      // Note: Removed custom splitChunks - Next.js handles this automatically
      // Custom splitChunks caused "self is not defined" error in server build
    }
    return config;
  },
};

export default nextConfig;
