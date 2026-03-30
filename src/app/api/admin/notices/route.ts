import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser, isAdmin } from '@/lib/auth/helpers';

export async function GET() {
  try {
    const notices = await prisma.$queryRaw<any[]>`
      SELECT * FROM notices ORDER BY created_at DESC
    `;
    return NextResponse.json({ notices });
  } catch (error) {
    console.error('[API/Notices] GET error:', error);
    return NextResponse.json({ notices: [] });
  }
}

export async function POST(request: NextRequest) {
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const admin = await isAdmin(authUser.id, authUser.email);
  if (!admin) return NextResponse.json({ error: '관리자 권한 필요' }, { status: 403 });

  try {
    const body = await request.json();
    const { title, content, category, version, tags, is_important, is_visible, is_popup, image_url, link_url, link_text } = body;

    const [notice] = await prisma.$queryRaw<any[]>`
      INSERT INTO notices (title, content, category, version, tags, is_important, is_visible, is_popup, image_url, link_url, link_text, created_at, updated_at)
      VALUES (${title}, ${content}, ${category ?? 'notice'}, ${version ?? null}, ${tags ?? null}, ${is_important ?? false}, ${is_visible ?? true}, ${is_popup ?? false}, ${image_url ?? null}, ${link_url ?? null}, ${link_text ?? null}, NOW(), NOW())
      RETURNING *
    `;
    return NextResponse.json({ notice });
  } catch (error) {
    console.error('[API/Notices] POST error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
