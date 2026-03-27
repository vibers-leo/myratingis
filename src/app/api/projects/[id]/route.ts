// src/app/api/projects/[id]/route.ts — 개별 프로젝트 CRUD (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser, isAdmin, ADMIN_EMAILS } from '@/lib/auth/helpers';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const user = await getAuthUser(request);

    const project = await prisma.projects.findUnique({
      where: { id },
      include: {
        profiles: {
          select: { id: true, username: true, avatar_url: true, nickname: true, profile_image: true },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 접근 권한 확인
    const isOwner = user && user.id === project.author_id;
    const isPublic = !project.visibility || project.visibility === 'public';

    if (!isPublic && !isOwner) {
      return NextResponse.json({ error: '접근 권한이 없습니다. (비공개 프로젝트)' }, { status: 403 });
    }

    // 평가 수 조회
    const ratingCount = await prisma.evaluations.count({
      where: { project_id: id },
    });

    let hasRated = false;
    if (user) {
      const existing = await prisma.evaluations.findFirst({
        where: { project_id: id, user_id: user.id },
      });
      hasRated = !!existing;
    }

    // 조회수 증가
    await prisma.projects.update({
      where: { id },
      data: { views_count: (project.views_count || 0) + 1 },
    });

    // 응답 (기존 API 호환)
    const data: any = {
      ...project,
      project_id: project.id,
      user_id: project.author_id,
      rating_count: ratingCount,
      has_rated: hasRated,
      User: project.profiles ? {
        user_id: project.profiles.id,
        username: project.profiles.username || project.profiles.nickname || 'Unknown',
        profile_image_url: project.profiles.avatar_url || project.profiles.profile_image || '/globe.svg',
      } : null,
    };

    return NextResponse.json({ project: data });
  } catch (error: any) {
    console.error('[API/GET] Project error:', error);
    return NextResponse.json({ error: '서버 오류', details: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const project = await prisma.projects.findUnique({
      where: { id },
      select: { author_id: true, custom_data: true },
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const isAuthorizedAdmin = await isAdmin(authUser.id, authUser.email);
    if (!isAuthorizedAdmin && project.author_id !== authUser.id) {
      return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title, content_text, content, body: bodyContent, text,
      description, summary, alt_description,
      thumbnail_url, category_id, rendering_type, custom_data,
      scheduled_at, visibility, assets,
    } = body;

    const finalContent = content_text || content || bodyContent || text;

    // custom_data 병합
    let finalCustomData: any = undefined;
    if (custom_data !== undefined || assets !== undefined) {
      try {
        let baseData: any = {};
        if (project.custom_data) {
          baseData = typeof project.custom_data === 'string'
            ? JSON.parse(project.custom_data)
            : project.custom_data;
        }
        if (custom_data) {
          const newCustom = typeof custom_data === 'string' ? JSON.parse(custom_data) : custom_data;
          baseData = { ...baseData, ...newCustom };
        }
        if (assets) baseData.assets = assets;
        finalCustomData = baseData;
      } catch {
        if (assets) finalCustomData = { assets };
      }
    }

    const updatePayload: any = { updated_at: new Date() };
    if (title !== undefined) updatePayload.title = title;
    if (finalContent !== undefined) updatePayload.content_text = finalContent;
    if (description !== undefined) updatePayload.description = description;
    if (summary !== undefined) updatePayload.summary = summary;
    if (alt_description !== undefined) updatePayload.alt_description = alt_description;
    if (thumbnail_url !== undefined) updatePayload.thumbnail_url = thumbnail_url;
    if (category_id !== undefined) updatePayload.category_id = category_id;
    if (rendering_type !== undefined) updatePayload.rendering_type = rendering_type;
    if (finalCustomData !== undefined) {
      updatePayload.custom_data = finalCustomData;
      updatePayload.site_url = finalCustomData?.audit_config?.mediaA || '';
    }
    if (scheduled_at !== undefined) updatePayload.scheduled_at = scheduled_at ? new Date(scheduled_at) : null;
    if (visibility !== undefined) updatePayload.visibility = visibility;

    const updated = await prisma.projects.update({
      where: { id },
      data: updatePayload,
    });

    return NextResponse.json({
      message: '프로젝트가 수정되었습니다.',
      data: { ...updated, project_id: updated.id, user_id: updated.author_id },
    });
  } catch (error: any) {
    console.error('[API/PUT] Project error:', error);
    return NextResponse.json({ error: '서버 오류', details: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const project = await prisma.projects.findUnique({
      where: { id },
      select: { author_id: true },
    });

    if (!project) {
      return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 });
    }

    const isAuthorizedAdmin = await isAdmin(authUser.id, authUser.email);
    if (!isAuthorizedAdmin && project.author_id !== authUser.id) {
      return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 });
    }

    await prisma.projects.delete({ where: { id } });

    return NextResponse.json({ message: '프로젝트가 삭제되었습니다.' });
  } catch (error: any) {
    console.error('[API/DELETE] Project error:', error);
    return NextResponse.json({ error: '서버 오류', details: error.message }, { status: 500 });
  }
}
