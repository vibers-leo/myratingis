import { MetadataRoute } from 'next'
import { BASE_URL } from '@/lib/constants'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/mypage/', '/onboarding/'],
      },
      {
        userAgent: 'Yeti', // 네이버 검색봇
        allow: '/',
        disallow: ['/admin/', '/api/', '/mypage/'],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: ['/admin/', '/api/', '/mypage/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
