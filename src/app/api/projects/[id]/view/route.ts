// src/app/api/projects/[id]/view/route.ts — 조회수 증가 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  if (!projectId) {
    return NextResponse.json({ error: '잘못된 프로젝트 ID' }, { status: 400 });
  }

  try {
    await prisma.projects.update({
      where: { id: projectId },
      data: { views_count: { increment: 1 } },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // 프로젝트가 없을 수 있음 — 조용히 무시
    console.error('[API/View] Error:', error.message);
    return NextResponse.json({ success: false });
  }
}
