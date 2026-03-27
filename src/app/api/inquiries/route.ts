// src/app/api/inquiries/route.ts — 문의 API (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function GET(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    // mr_inquiries 테이블 사용 (receiver 또는 sender)
    const inquiries = await prisma.mr_inquiries.findMany({
      where: {
        OR: [
          { sender_id: authUser.id },
          { receiver_id: authUser.id },
        ],
      },
      include: {
        projects: { select: { id: true, title: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ inquiries });
  } catch (error) {
    console.error('[API/Inquiries] GET error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const body = await request.json();
    const { title, content, project_id, receiver_id, inquiry_type, contact_name, contact_email, contact_phone } = body;

    const inquiry = await prisma.mr_inquiries.create({
      data: {
        project_id: project_id || null,
        sender_id: authUser.id,
        sender_email: authUser.email,
        sender_name: contact_name || '',
        sender_phone: contact_phone || null,
        receiver_id: receiver_id || null,
        receiver_email: contact_email || null,
        title: title || '',
        content: content || '',
        inquiry_type: inquiry_type || 'general',
        status: 'pending',
      },
    });

    return NextResponse.json({ inquiry });
  } catch (error) {
    console.error('[API/Inquiries] POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
