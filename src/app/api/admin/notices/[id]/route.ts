import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser, isAdmin } from '@/lib/auth/helpers';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const admin = await isAdmin(authUser.id, authUser.email);
  if (!admin) return NextResponse.json({ error: '관리자 권한 필요' }, { status: 403 });

  try {
    const body = await request.json();
    const { title, content, category, version, tags, is_important, is_visible, is_popup, image_url, link_url, link_text } = body;

    const [notice] = await prisma.$queryRaw<any[]>`
      UPDATE notices SET
        title = ${title},
        content = ${content},
        category = ${category ?? 'notice'},
        version = ${version ?? null},
        tags = ${tags ?? null},
        is_important = ${is_important ?? false},
        is_visible = ${is_visible ?? true},
        is_popup = ${is_popup ?? false},
        image_url = ${image_url ?? null},
        link_url = ${link_url ?? null},
        link_text = ${link_text ?? null},
        updated_at = NOW()
      WHERE id = ${Number(id)}
      RETURNING *
    `;
    return NextResponse.json({ notice });
  } catch (error) {
    console.error('[API/Notices/id] PUT error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authUser = await getAuthUser(request);
  if (!authUser) return NextResponse.json({ error: '로그인 필요' }, { status: 401 });

  const admin = await isAdmin(authUser.id, authUser.email);
  if (!admin) return NextResponse.json({ error: '관리자 권한 필요' }, { status: 403 });

  try {
    await prisma.$executeRaw`DELETE FROM notices WHERE id = ${Number(id)}`;
    return NextResponse.json({ message: '삭제완료' });
  } catch (error) {
    console.error('[API/Notices/id] DELETE error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
