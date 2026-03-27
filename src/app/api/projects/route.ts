// src/app/api/projects/route.ts — 프로젝트 목록/생성 (Prisma)
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAuthUser } from '@/lib/auth/helpers';

export const revalidate = 0;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search');
    const mode = searchParams.get('mode');
    const offset = (page - 1) * limit;

    // 인증 (선택적)
    const currentUser = await getAuthUser(request);
    const currentUserId = currentUser?.id || null;

    // 기본 필터
    const where: any = {};

    const isOwner = userId && currentUserId === userId;
    if (!isOwner) {
      where.visibility = 'public';
      where.OR = [
        { scheduled_at: null },
        { scheduled_at: { lte: new Date() } },
      ];
    }

    if (search) {
      where.AND = [
        ...(where.AND || []),
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { content_text: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    if (category && category !== 'korea' && category !== 'all') {
      // category_id 매핑은 간단히 처리
      const categoryMap: Record<string, number> = {
        'art': 1, 'design': 2, 'music': 3, 'film': 4, 'photography': 5,
        'writing': 6, 'craft': 7, 'tech': 8, 'game': 9, 'fashion': 10,
      };
      if (categoryMap[category]) where.category_id = categoryMap[category];
    }

    if (mode === 'growth') {
      where.is_growth_requested = true;
    }

    if (userId) where.author_id = userId;

    const [data, total] = await Promise.all([
      prisma.projects.findMany({
        where,
        include: {
          profiles: {
            select: { username: true, avatar_url: true, nickname: true, profile_image: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.projects.count({ where }),
    ]);

    // 소셜 상태 조회 (로그인 시)
    let myLikesSet = new Set<string>();

    if (currentUserId && data.length > 0) {
      const projectIds = data.map(p => p.id);
      const [likes] = await Promise.all([
        prisma.project_likes.findMany({
          where: { user_id: currentUserId, project_id: { in: projectIds } },
          select: { project_id: true },
        }),
      ]);
      likes.forEach(l => { if (l.project_id) myLikesSet.add(l.project_id); });
    }

    // 응답 매핑 (기존 API 호환)
    const projects = data.map(project => ({
      project_id: project.id,
      title: project.title,
      thumbnail_url: project.thumbnail_url,
      views_count: project.views_count || 0,
      likes_count: project.likes_count || 0,
      rating_count: project.evaluations_count || 0,
      created_at: project.created_at,
      user_id: project.author_id,
      category_id: project.category_id,
      summary: project.summary,
      description: project.description,
      custom_data: project.custom_data,
      audit_deadline: project.audit_deadline,
      site_url: project.site_url,
      visibility: project.visibility,
      scheduled_at: project.scheduled_at,
      is_growth_requested: project.is_growth_requested,
      User: project.profiles ? {
        username: project.profiles.username || 'Unknown',
        avatar_url: project.profiles.avatar_url || project.profiles.profile_image || '/globe.svg',
        nickname: project.profiles.nickname,
      } : { username: 'Unknown', avatar_url: '/globe.svg' },
      is_liked: myLikesSet.has(project.id),
      has_rated: false,
      is_bookmarked: false,
    }));

    const duration = Date.now() - startTime;
    return NextResponse.json({
      projects,
      metadata: { total, page, limit, hasMore: data.length === limit, duration_ms: duration },
    });
  } catch (error: any) {
    console.error('[API/GET] Projects error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Authentication Required', code: 'AUTH_REQUIRED' }, { status: 401 });
    }

    const body = await request.json();
    const {
      category_id, title, summary,
      content_text, content, body: bodyContent, text,
      description, alt_description, thumbnail_url, rendering_type, custom_data,
      scheduled_at, visibility, is_growth_requested,
    } = body;

    const finalContent = content_text || content || bodyContent || text || '';

    if (!title) {
      return NextResponse.json({ error: 'Title is required.', code: 'MISSING_TITLE' }, { status: 400 });
    }

    // 프로필 확인/생성
    let profile = await prisma.profiles.findUnique({ where: { id: authUser.id } });
    if (!profile) {
      profile = await prisma.profiles.create({
        data: {
          id: authUser.id,
          email: authUser.email,
          username: authUser.email.split('@')[0],
          nickname: authUser.email.split('@')[0],
          points: 1000,
        },
      });
    }

    let finalCustomData = custom_data;
    try {
      if (typeof finalCustomData === 'string') finalCustomData = JSON.parse(finalCustomData);
      if (!finalCustomData) finalCustomData = {};
    } catch { finalCustomData = {}; }

    const project = await prisma.projects.create({
      data: {
        author_id: authUser.id,
        author_email: authUser.email,
        category_id: category_id || 1,
        title,
        summary: summary || null,
        content_text: finalContent,
        description: description || finalContent,
        alt_description: alt_description || null,
        thumbnail_url: thumbnail_url || null,
        rendering_type: rendering_type || 'rich_text',
        custom_data: finalCustomData,
        site_url: finalCustomData?.audit_config?.mediaA || '',
        visibility: visibility || 'public',
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null,
        is_growth_requested: is_growth_requested ?? false,
        views_count: 0,
        likes_count: 0,
        evaluations_count: 0,
      },
    });

    return NextResponse.json({
      project: {
        ...project,
        project_id: project.id,
        user_id: project.author_id,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('[API/POST] Project creation error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
