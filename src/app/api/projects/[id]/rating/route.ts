// src/app/api/projects/[id]/rating/route.ts — 평가 API (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const guestId = req.nextUrl.searchParams.get('guest_id');
  const authUser = await getAuthUser(req);
  const userId = authUser?.id || null;

  try {
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: { id: true, title: true, custom_data: true, author_id: true },
    });

    // 모든 평가 조회
    const allRatings = await prisma.evaluations.findMany({
      where: { project_id: projectId },
    });

    // 카테고리 설정
    let rawCustom: any = project?.custom_data || {};
    if (typeof rawCustom === 'string') {
      try { rawCustom = JSON.parse(rawCustom); } catch { rawCustom = {}; }
    }

    const categories = rawCustom?.audit_config?.categories || rawCustom?.categories || [
      { id: 'score_1', label: '기획력' }, { id: 'score_2', label: '독창성' },
      { id: 'score_3', label: '심미성' }, { id: 'score_4', label: '완성도' },
      { id: 'score_5', label: '상업성' }, { id: 'score_6', label: '편의성' },
    ];

    const count = allRatings.length;
    let averages: Record<string, number> = {};
    let totalAvg = 0;

    if (count > 0) {
      // custom_answers에서 점수 추출
      allRatings.forEach(r => {
        const answers: any = r.custom_answers || {};
        categories.forEach((cat: any) => {
          averages[cat.id] = (averages[cat.id] || 0) + (Number(answers[cat.id]) || 0);
        });
      });
      categories.forEach((cat: any) => {
        averages[cat.id] = Number((averages[cat.id] / count).toFixed(1));
      });
      const sumAvgs = Object.values(averages).reduce((a, b) => a + b, 0);
      totalAvg = Number((sumAvgs / categories.length).toFixed(1));
    }

    // 내 평가 찾기
    let myRating = null;
    if (userId) {
      const mine = allRatings.find(r => r.user_id === userId);
      if (mine) myRating = { ...mine, ...(mine.custom_answers as any || {}) };
    }

    const isOwner = userId && project?.author_id === userId;

    return NextResponse.json({
      success: true,
      project,
      averages: isOwner ? averages : {},
      totalAvg: isOwner ? totalAvg : 0,
      totalCount: count,
      myRating,
      isAuthorized: isOwner || false,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  try {
    const authUser = await getAuthUser(req);
    const userId = authUser?.id || null;
    const body = await req.json();
    const { score, proposal, custom_answers, guest_id, scores } = body;

    if (!userId && !guest_id) {
      return NextResponse.json({ error: 'Guest ID or Login required' }, { status: 400 });
    }

    // 기존 평가 확인
    const existing = userId
      ? await prisma.evaluations.findFirst({ where: { project_id: projectId, user_id: userId } })
      : null;

    const avgScore = score !== undefined ? Number(score) : 3.0;

    if (existing) {
      // 업데이트
      await prisma.evaluations.update({
        where: { id: existing.id },
        data: {
          score: avgScore,
          proposal: proposal || existing.proposal,
          custom_answers: custom_answers || scores || existing.custom_answers,
          updated_at: new Date(),
        },
      });
    } else {
      // 새 평가 생성
      const profile = userId
        ? await prisma.profiles.findUnique({ where: { id: userId }, select: { email: true, username: true, nickname: true, occupation: true } })
        : null;

      await prisma.evaluations.create({
        data: {
          project_id: projectId,
          user_id: userId,
          user_email: profile?.email || authUser?.email || null,
          user_nickname: profile?.nickname || profile?.username || null,
          username: profile?.username || null,
          user_job: profile?.occupation || null,
          score: avgScore,
          proposal: proposal || null,
          custom_answers: custom_answers || scores || {},
        },
      });

      // evaluations_count 증가
      await prisma.projects.update({
        where: { id: projectId },
        data: { evaluations_count: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Rating POST] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
