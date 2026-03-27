import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://myratingis.kr';
const SITE_TITLE = '제 평가는요? (MyRatingIs)';
const SITE_DESCRIPTION = '전문평가위원과 참여고객의 날카로운 시선으로 여러분의 프로젝트가 가진 진짜 가치를 증명해 드립니다.';

export async function GET() {
  let items = '';

  try {
    const projects = await prisma.projects.findMany({
      where: { visibility: 'public' },
      select: { id: true, title: true, summary: true, description: true, created_at: true, thumbnail_url: true },
      orderBy: { created_at: 'desc' },
      take: 50,
    });

    items = projects.map((p) => {
      const title = escapeXml(p.title || '제목 없음');
      const desc = escapeXml(p.summary || p.description || '');
      const link = `${BASE_URL}/project/${p.id}`;
      const pubDate = p.created_at ? new Date(p.created_at).toUTCString() : new Date().toUTCString();
      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`;
    }).join('\n');
  } catch (e) {
    console.error('[rss] Error generating RSS:', e);
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${BASE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}
