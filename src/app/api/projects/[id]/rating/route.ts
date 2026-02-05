import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    const { data: project } = await supabaseAdmin
      .from('Project')
      .select('*')
      .eq('project_id', Number(projectId))
      .single();

    // 2. Fetch All Ratings
    const { data: allRatings, error } = await supabaseAdmin
      .from('ProjectRating')
      .select('*')
      .eq('project_id', Number(projectId));

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
    const count = allRatings.length;

    if (count > 0) {
      const sums: Record<string, number> = {};
      catIds.forEach((id: string) => sums[id] = 0);

      allRatings.forEach((curr: any) => {
        catIds.forEach((id: string, idx: number) => {
          // Map score_1...6 columns to category ids by order
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

    // 3. Map My Rating to include category ids
    let myRating: any = null;
    let rawMyRating = null;
    if (userId) {
      rawMyRating = allRatings.find((r: any) => r.user_id === userId) || null;
    } else if (guestId) {
      rawMyRating = allRatings.find((r: any) => r.guest_id === guestId) || null;
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
        if (project && project.user_id === userId) isAuthorized = true;
        if (!isAuthorized) {
            const { data: collaborator } = await supabaseAdmin
                .from('project_collaborators')
                .select('id')
                .eq('project_id', Number(projectId))
                .eq('user_id', userId)
                .single();
            if (collaborator) isAuthorized = true;
        }
    }

    return NextResponse.json({
      success: true,
      project, // 반환 데이터에 프로젝트 정보 포함
      // [Security] 작성자(isAuthorized)일 때만 통계 데이터 반환
      // isAuthorized가 false면 null 또는 빈 값을 주어 클라이언트가 "비공개" 처리하도록 함
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
  
  if (!projectId || isNaN(Number(projectId))) {
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

      // Guest Check: If no userId, require guest_id
      if (!userId && !guest_id) {
          console.error('[API/ProjectRating] No User ID and No Guest ID provided');
          return NextResponse.json({ error: 'Guest ID or Login required' }, { status: 400 });
      }

      // 1. Fetch existing rating to merge data
      const { data: existingRating } = await supabaseAdmin
        .from('ProjectRating')
        .select('*')
        .eq('project_id', Number(projectId))
        .filter(userId ? 'user_id' : 'guest_id', 'eq', userId || guest_id)
        .maybeSingle();

      // 2. Prepare Balanced Update Data (Merge)
      const { data: project } = await supabaseAdmin.from('Project').select('custom_data').eq('project_id', Number(projectId)).single();
      
      let rawCustom = project?.custom_data || {};
      if (typeof rawCustom === 'string') {
        try { rawCustom = JSON.parse(rawCustom); } catch (e) { rawCustom = {}; }
      }

      const categories = rawCustom?.audit_config?.categories || rawCustom?.categories || rawCustom?.custom_categories || [
        { id: 'score_1' }, { id: 'score_2' }, { id: 'score_3' }, { id: 'score_4' }
      ];

      const mappedScores: any = {};
      categories.forEach((cat: any, idx: number) => {
          // Look in: nestedScores[cat.id], body[cat.id], body[score_N]
          const val = (nestedScores && nestedScores[cat.id]) ?? body[cat.id] ?? body[`score_${idx+1}`];
          if (val !== undefined) {
              mappedScores[`score_${idx+1}`] = parseFloat(val);
          }
      });

      const updateData: any = {
          project_id: Number(projectId),
          user_id: userId,
          guest_id: userId ? null : guest_id,
          // Default to 3.0 instead of 0.0 for new ratings to match UX intent
          score_1: mappedScores.score_1 ?? existingRating?.score_1 ?? 3,
          score_2: mappedScores.score_2 ?? existingRating?.score_2 ?? 3,
          score_3: mappedScores.score_3 ?? existingRating?.score_3 ?? 3,
          score_4: mappedScores.score_4 ?? existingRating?.score_4 ?? 3,
          score_5: mappedScores.score_5 ?? existingRating?.score_5 ?? 3,
          score_6: mappedScores.score_6 ?? existingRating?.score_6 ?? 3,
          proposal: proposal !== undefined ? proposal : existingRating?.proposal,
          custom_answers: custom_answers !== undefined ? custom_answers : existingRating?.custom_answers,
          updated_at: new Date().toISOString()
      };

      // Recalculate average score
      const activeScores = [updateData.score_1, updateData.score_2, updateData.score_3, updateData.score_4, updateData.score_5, updateData.score_6]
        .filter(s => s > 0);
      updateData.score = score !== undefined ? score : (activeScores.length > 0 
        ? Number((activeScores.reduce((a, b) => a + b, 0) / activeScores.length).toFixed(1)) 
        : 3.0);

      console.log(`[API/ProjectRating] Final updateData:`, {
        project_id: updateData.project_id,
        user_id: updateData.user_id,
        guest_id: updateData.guest_id,
        score: updateData.score
      });

      const { error: ratingError } = await supabaseAdmin
        .from('ProjectRating')
        .upsert(updateData, { 
            onConflict: userId ? 'project_id,user_id' : 'project_id,guest_id' 
        });

      if (ratingError) {
          console.error('[API/ProjectRating] Postgres Error:', {
              message: ratingError.message,
              details: ratingError.details,
              hint: ratingError.hint,
              code: ratingError.code
          });
          return NextResponse.json({ 
              success: false, 
              error: ratingError.message, 
              code: ratingError.code 
          }, { status: 500 });
      }
      
      console.log(`[API/ProjectRating] Successfully saved rating for ${userId ? 'User '+userId : 'Guest '+guest_id}`);

      // 2. Check if first time rating? 
      // User asked for comment when feed back is left.
      
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
      
      // Check if system comment already exists (Only for logged in users to prevent spam)
      if (userId) {
          const { data: existingComments } = await supabaseAdmin
            .from('Comment')
            .select('comment_id')
            .eq('project_id', Number(projectId))
            .eq('user_id', userId)
            .eq('content', commentContent);
            
          if (!existingComments || existingComments.length === 0) {
              // Insert Comment
              await supabaseAdmin
                .from('Comment')
                .insert({
                    project_id: Number(projectId),
                    user_id: userId, 
                    content: commentContent,
                });
          }
      }

      // [New] 3. Notification for Project Owner
      // Send only if userId exists (logged in user) or handle guest notification differently
      const { data: projectData } = await supabaseAdmin
        .from('Project')
        .select('user_id, title')
        .eq('project_id', Number(projectId))
        .single();
        
      if (projectData && (userId ? projectData.user_id !== userId : true)) {
          try {
              await supabaseAdmin
                .from('notifications')
                .insert({
                    user_id: projectData.user_id,
                    type: 'rating',
                    title: '새로운 미슐랭 평가 도착! 📊',
                    message: `${maskedName}님이 '${projectData.title}' 프로젝트를 평가했습니다. (평균 ${score}점)`,
                    link: `/projects/${projectId}`,
                    read: false, 
                    sender_id: userId 
                });
          } catch (notiError) {
              console.warn('[API] Failed to send notification:', notiError);
          }
      }

      // [Point System] Reward for Evaluating (100 Points)
      // Only for logged-in users
      if (userId) {
          try {
              // Check if this is the first time rating this project (upsert check)
              // Actually, we can check if a point log for this project rating exists.
              const { count } = await supabaseAdmin
                .from('point_logs')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .eq('reason', `심사 평가 보상 (Project ${projectId})`);
              
              if ((count || 0) === 0) {
                  const REWARD = 100;
                  // 1. Add Points
                  const { data: profile } = await supabaseAdmin.from('profiles').select('points').eq('id', userId).single();
                  await supabaseAdmin.from('profiles').update({ points: (profile?.points || 0) + REWARD }).eq('id', userId);
                  // 2. Log
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
