// src/app/api/visit/route.ts — 방문 기록 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    let body: any = {};
    try { body = await request.json(); } catch {}
    const { path } = body;

    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // 일별 집계 업데이트
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    const today = kstDate.toISOString().split('T')[0];

    try {
      await prisma.daily_stats.upsert({
        where: { date: new Date(today) },
        update: { count: { increment: 1 }, updated_at: new Date() },
        create: { date: new Date(today), count: 1 },
      });
    } catch {}

    // 방문 로그 저장
    try {
      await prisma.visits.create({
        data: { page: path || '/', user_agent: userAgent, ip },
      });
    } catch {}

    return NextResponse.json({ success: true, date: today });
  } catch (err: any) {
    console.error('[API/Visit] Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
