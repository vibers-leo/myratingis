// src/app/api/proposals/route.ts — 협업 제안 API (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');

    const where: any = {};
    if (type === 'sent') {
      where.sender_id = authUser.id;
    } else if (type === 'received') {
      where.receiver_id = authUser.id;
    } else {
      where.OR = [
        { sender_id: authUser.id },
        { receiver_id: authUser.id },
      ];
    }

    const proposals = await prisma.proposals.findMany({
      where,
      include: {
        projects: {
          select: { id: true, title: true, thumbnail_url: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    // 기존 API 호환 매핑
    const mapped = proposals.map(p => ({
      ...p,
      Project: p.projects ? {
        project_id: p.projects.id,
        title: p.projects.title,
        thumbnail_url: p.projects.thumbnail_url,
      } : null,
    }));

    return NextResponse.json({ proposals: mapped });
  } catch (error: any) {
    console.error('[API/Proposals] GET error:', error);
    return NextResponse.json({ error: '서버 오류', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { project_id, receiver_id, title, content, contact } = body;

    if (!project_id || !receiver_id || !title || !content) {
      return NextResponse.json({ error: '필수 필드 누락', }, { status: 400 });
    }

    if (receiver_id === authUser.id) {
      return NextResponse.json({ error: '본인에게는 제안할 수 없습니다.' }, { status: 400 });
    }

    // 프로젝트 제목 조회
    const project = await prisma.projects.findUnique({
      where: { id: project_id },
      select: { title: true },
    });

    const proposal = await prisma.proposals.create({
      data: {
        project_id,
        project_title: project?.title || '',
        sender_id: authUser.id,
        sender_email: authUser.email,
        receiver_id,
        title,
        content,
        contact: contact || '',
        status: 'pending',
      },
    });

    return NextResponse.json({ proposal, message: '제안이 성공적으로 전송되었습니다.' });
  } catch (error: any) {
    console.error('[API/Proposals] POST error:', error);
    return NextResponse.json({ error: '서버 오류', details: error.message }, { status: 500 });
  }
}
