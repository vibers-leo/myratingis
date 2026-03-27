// src/app/api/auth/claim-ratings/route.ts — 비회원 평가 연결 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guest_id } = await req.json();
    if (!guest_id) {
      return NextResponse.json({ error: 'Guest ID required' }, { status: 400 });
    }

    // guest_id 기반 평가 연결은 project_ratings 테이블에서 처리
    // 현재 자체 DB에서는 guest rating 시스템이 제한적이므로 기본 응답 반환
    return NextResponse.json({ success: true, merged_count: 0 });
  } catch (error: any) {
    console.error('[API/ClaimRatings] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
