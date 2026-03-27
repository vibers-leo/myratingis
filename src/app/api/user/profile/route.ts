// src/app/api/user/profile/route.ts — 프로필 업데이트 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    await prisma.profiles.upsert({
      where: { id: authUser.id },
      update: {
        updated_at: new Date(),
        nickname: body.nickname || undefined,
        username: body.nickname || undefined,
        gender: body.gender || undefined,
        age_group: body.age_group || undefined,
        occupation: body.occupation || undefined,
        expertise: body.expertise ? (typeof body.expertise === 'object' ? body.expertise : { fields: [] }) : undefined,
      },
      create: {
        id: authUser.id,
        email: authUser.email,
        nickname: body.nickname || authUser.email.split('@')[0],
        username: body.nickname || authUser.email.split('@')[0],
        gender: body.gender,
        age_group: body.age_group,
        occupation: body.occupation,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[API/Profile] Error:', e);
    return NextResponse.json({ error: e.message || 'Internal Server Error' }, { status: 500 });
  }
}
