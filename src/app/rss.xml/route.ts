import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1시간마다 RSS 재생성
export const revalidate = 3600;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://myratingis.kr';
const SITE_TITLE = '제 평가는요? (MyRatingIs)';
const SITE_DESCRIPTION = '전문평가위원과 참여고객의 날카로운 시선으로 여러분의 프로젝트가 가진 진짜 가치를 증명해 드립니다.';

export async function GET() {
  let items = '';

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data: projects } = await supabase
        .from('projects')
        .select('id, title, summary, description, created_at, updated_at, thumbnail_url')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);

      if (projects) {
        items = projects.map((p) => {
          const title = escapeXml(p.title || '제목 없음');
          const desc = escapeXml(p.summary || p.description || '');
          const link = `${BASE_URL}/project/${p.id}`;
          const pubDate = new Date(p.created_at).toUTCString();
          return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${desc}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${link}</guid>
    </item>`;
        }).join('\n');
      }
    }
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
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
