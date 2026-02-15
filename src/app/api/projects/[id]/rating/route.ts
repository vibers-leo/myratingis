import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// UUID 형식 감지
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// 프로젝트 조회: UUID면 projects 테이블, 정수면 Project 테이블
async function fetchProject(projectId: string) {
  if (isUUID(projectId)) {
    const { data } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();
    if (data) {
      return { ...data, user_id: data.author_id, project_id: data.id };
    }
    return null;
  } else {
    const { data } = await supabaseAdmin
      .from('Project')
      .select('*')
      .eq('project_id', Number(projectId))
      .single();
    return data;
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;
  const searchParams = req.nextUrl.searchParams;
  const guestId = searchParams.get('guest_id');

  const authHeader = req.headers.get('Authorization');
  let userId = null;

  if (authHeader) {
     const token = authHeader.replace(/^Bearer\s+/i, '');
     const { data: { user } } = await supabaseAdmin.auth.getUser(token);
     if (user) userId = user.id;
  }

  try {
    // 1. Fetch Project for categories
    const project = await fetchProject(projectId);

    // 2. Fetch All Ratings via RPC (PostgREST 스키마 캐시 우회)
    const { data: allRatings, error } = await supabaseAdmin
      .rpc('get_ratings_by_project', { p_project_id: projectId });

    if (error) throw error;

    // Determine Categories
    let rawCustom = project?.custom_data || {};
    if (typeof rawCustom === 'string') {
      try { rawCustom = JSON.parse(rawCustom); } catch (e) { rawCustom = {}; }
    }

    const categories = rawCustom?.audit_config?.categories || rawCustom?.categories || rawCustom?.custom_categories || [
      { id: 'score_1', label: '기획력' },
      { id: 'score_2', label: '독창성' },
      { id: 'score_3', label: '심미성' },
      { id: 'score_4', label: '완성도' },
      { id: 'score_5', label: '상업성' },
      { id: 'score_6', label: '편의성' }
    ];
    const catIds = categories.map((c: any) => c.id || c.label);

    // Calculate Average
    let averages: Record<string, number> = {};
    catIds.forEach((id: string) => averages[id] = 0);

    let totalAvg = 0;
    const ratings = allRatings || [];
    const count = ratings.length;

    if (count > 0) {
      const sums: Record<string, number> = {};
      catIds.forEach((id: string) => sums[id] = 0);

      ratings.forEach((curr: any) => {
        catIds.forEach((id: string, idx: number) => {
          const columnName = `score_${idx + 1}`;
          sums[id] += (Number(curr[columnName]) || Number(curr[id]) || 0);
        });
      });

      catIds.forEach((id: string) => {
        averages[id] = Number((sums[id] / count).toFixed(1));
      });

      const sumAvgs = Object.values(averages).reduce((a, b) => a + b, 0);
      totalAvg = Number((sumAvgs / catIds.length).toFixed(1));
    }

    // 3. Map My Rating
    let myRating: any = null;
    let rawMyRating = null;
    if (userId) {
      rawMyRating = ratings.find((r: any) => r.user_id === userId) || null;
    } else if (guestId) {
      rawMyRating = ratings.find((r: any) => r.guest_id === guestId) || null;
    }

    if (rawMyRating) {
        myRating = { ...rawMyRating };
        catIds.forEach((id: string, idx: number) => {
            const columnName = `score_${idx + 1}`;
            myRating[id] = Number(rawMyRating[columnName]) || Number(rawMyRating[id]) || 3;
        });
    }

    // 4. Check Visibility
    let isAuthorized = false;
    if (userId) {
        const projectOwnerId = project?.user_id || project?.author_id;
        if (project && projectOwnerId === userId) isAuthorized = true;
        if (!isAuthorized) {
            try {
                const { data: collaborator } = await supabaseAdmin
                    .from('project_collaborators')
                    .select('id')
                    .eq('project_id', projectId)
                    .eq('user_id', userId)
                    .single();
                if (collaborator) isAuthorized = true;
            } catch (e) {
                // collaborator check failed, skip
            }
        }
    }

    return NextResponse.json({
      success: true,
      project,
      averages: isAuthorized ? averages : {},
      totalAvg: isAuthorized ? totalAvg : 0,
      totalCount: count,
      myRating,
      isAuthorized
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  if (!projectId) {
      return NextResponse.json({ error: 'Invalid Project ID' }, { status: 400 });
  }

  try {
      const authHeader = req.headers.get('Authorization');
      let userId: string | null = null;

      if (authHeader) {
          const token = authHeader.replace(/^Bearer\s+/i, '');
          const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
          if (user && !authError) {
              userId = user.id;
          }
      }

      const body = await req.json();
      const { score, proposal, custom_answers, guest_id, scores: nestedScores } = body;

      console.log(`[API/ProjectRating] POST started for Project ${projectId}. GuestID: ${guest_id}, UserID: ${userId}`);

      if (!userId && !guest_id) {
          console.error('[API/ProjectRating] No User ID and No Guest ID provided');
          return NextResponse.json({ error: 'Guest ID or Login required' }, { status: 400 });
      }

      // 1. Fetch existing rating via RPC
      const { data: existingRatings } = await supabaseAdmin
        .rpc('get_user_rating', {
            p_project_id: projectId,
            p_user_id: userId || null,
            p_guest_id: (!userId && guest_id) ? guest_id : null
        });
      const existingRating = existingRatings?.[0] || null;

      // 2. Prepare scores
      const project = await fetchProject(projectId);

      let rawCustom = project?.custom_data || {};
      if (typeof rawCustom === 'string') {
        try { rawCustom = JSON.parse(rawCustom); } catch (e) { rawCustom = {}; }
      }

      const categories = rawCustom?.audit_config?.categories || rawCustom?.categories || rawCustom?.custom_categories || [
        { id: 'score_1' }, { id: 'score_2' }, { id: 'score_3' }, { id: 'score_4' }
      ];

      const mappedScores: any = {};
      categories.forEach((cat: any, idx: number) => {
          const val = (nestedScores && nestedScores[cat.id]) ?? body[cat.id] ?? body[`score_${idx+1}`];
          if (val !== undefined) {
              mappedScores[`score_${idx+1}`] = parseFloat(val);
          }
      });

      const finalScores = {
          score_1: mappedScores.score_1 ?? existingRating?.score_1 ?? 3,
          score_2: mappedScores.score_2 ?? existingRating?.score_2 ?? 3,
          score_3: mappedScores.score_3 ?? existingRating?.score_3 ?? 3,
          score_4: mappedScores.score_4 ?? existingRating?.score_4 ?? 3,
          score_5: mappedScores.score_5 ?? existingRating?.score_5 ?? 3,
          score_6: mappedScores.score_6 ?? existingRating?.score_6 ?? 3,
      };

      // Recalculate average
      const activeScores = Object.values(finalScores).filter(s => s > 0);
      const avgScore = score !== undefined ? score : (activeScores.length > 0
        ? Number((activeScores.reduce((a, b) => a + b, 0) / activeScores.length).toFixed(1))
        : 3.0);

      console.log(`[API/ProjectRating] Saving via RPC:`, {
        project_id: projectId, user_id: userId, guest_id: guest_id, score: avgScore
      });

      // 3. Upsert via RPC (PostgREST 스키마 캐시 우회)
      const { error: ratingError } = await supabaseAdmin
        .rpc('upsert_rating', {
            p_project_id: projectId,
            p_user_id: userId || null,
            p_guest_id: (!userId && guest_id) ? guest_id : null,
            p_score: avgScore,
            p_score_1: finalScores.score_1,
            p_score_2: finalScores.score_2,
            p_score_3: finalScores.score_3,
            p_score_4: finalScores.score_4,
            p_score_5: finalScores.score_5,
            p_score_6: finalScores.score_6,
            p_proposal: proposal !== undefined ? proposal : (existingRating?.proposal || null),
            p_custom_answers: custom_answers !== undefined ? custom_answers : (existingRating?.custom_answers || {}),
            p_vote_type: null
        });

      if (ratingError) {
          console.error('[API/ProjectRating] RPC Error:', ratingError);
          return NextResponse.json({
              success: false,
              error: ratingError.message,
              code: (ratingError as any).code
          }, { status: 500 });
      }

      console.log(`[API/ProjectRating] Successfully saved rating for ${userId ? 'User '+userId : 'Guest '+guest_id}`);

      // Comment (정수형 project_id 프로젝트만)
      const { data: profile } = userId
          ? await supabaseAdmin.from('profiles').select('username, nickname').eq('id', userId).single()
          : { data: null };

      const nickname = profile?.username || profile?.nickname || 'User';

      const maskedName = userId
        ? (nickname.length > 2
            ? nickname.substring(0, 2) + '*'.repeat(3) + '(가림)'
            : nickname.substring(0, 1) + '*'.repeat(3) + '(가림)')
        : '익명의 심사위원';

      const commentContent = `${maskedName}님이 정성스러운 피드백을 남겼어요`;

      if (userId && !isUUID(projectId)) {
          const { data: existingComments } = await supabaseAdmin
            .from('Comment')
            .select('comment_id')
            .eq('project_id', Number(projectId))
            .eq('user_id', userId)
            .eq('content', commentContent);

          if (!existingComments || existingComments.length === 0) {
              await supabaseAdmin
                .from('Comment')
                .insert({
                    project_id: Number(projectId),
                    user_id: userId,
                    content: commentContent,
                });
          }
      }

      // Notification
      const projectOwnerId = project?.user_id || project?.author_id;
      const projectTitle = project?.title;

      if (projectOwnerId && (userId ? projectOwnerId !== userId : true)) {
          try {
              await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: projectOwnerId,
                    type: 'rating',
                    title: '새로운 미슐랭 평가 도착! 📊',
                    message: `${maskedName}님이 '${projectTitle}' 프로젝트를 평가했습니다. (평균 ${avgScore}점)`,
                    link: `/projects/${projectId}`,
                    read: false,
                    sender_id: userId
                });
          } catch (notiError) {
              console.warn('[API] Failed to send notification:', notiError);
          }
      }

      // Point System
      if (userId) {
          try {
              const { count } = await supabaseAdmin
                .from('point_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('reason', `심사 평가 보상 (Project ${projectId})`);

              if ((count || 0) === 0) {
                  const REWARD = 100;
                  const { data: profile } = await supabaseAdmin.from('profiles').select('points').eq('id', userId).single();
                  await supabaseAdmin.from('profiles').update({ points: (profile?.points || 0) + REWARD }).eq('id', userId);
                  await supabaseAdmin.from('point_logs').insert({
                      user_id: userId,
                      amount: REWARD,
                      reason: `심사 평가 보상 (Project ${projectId})`
                  });
                  console.log(`[Point System] Awarded ${REWARD} points to user ${userId} for rating.`);
              }
          } catch (e) {
              console.error('[Point System] Failed to reward rating points:', e);
          }
      }

      return NextResponse.json({ success: true });

  } catch (error: any) {
     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
