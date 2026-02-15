import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// UUID 형식 감지
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const authHeader = req.headers.get('Authorization');
  let userId: string | null = null;

  if (authHeader) {
      const token = authHeader.replace(/^Bearer\s+/i, '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
  }

  try {
    // 1. Fetch Project (UUID면 projects 테이블, 정수면 Project 테이블)
    let project: any = null;
    if (isUUID(projectId)) {
        const { data } = await supabaseAdmin
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();
        if (data) {
            project = { ...data, user_id: data.author_id };
        }
    } else {
        const { data } = await supabaseAdmin
            .from('Project')
            .select('*')
            .eq('project_id', Number(projectId))
            .single();
        project = data;
    }

    if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Access control
    const isOwner = userId && project.user_id === userId;
    let isCollaborator = false;
    if (userId && !isOwner) {
        try {
            const { data: collab } = await supabaseAdmin
                .from('project_collaborators')
                .select('id')
                .eq('project_id', projectId)
                .eq('user_id', userId)
                .single();
            if (collab) isCollaborator = true;
        } catch (e) {}
    }
    const isAuthorized = isOwner || isCollaborator;

    // Parse custom_data
    let rawCustom = project.custom_data || {};
    if (typeof rawCustom === 'string') {
        try { rawCustom = JSON.parse(rawCustom); } catch (e) { rawCustom = {}; }
    }
    const resultVisibility = rawCustom?.result_visibility || 'public';
    const isPublic = resultVisibility === 'public';

    // 2. Fetch Ratings with Profiles via RPC
    const { data: rawRatings, error: ratingError } = await supabaseAdmin
      .rpc('get_ratings_with_profiles', { p_project_id: projectId });

    if (ratingError) throw ratingError;

    const allRatings = (rawRatings || []).map((r: any) => ({
      ...r,
      profile: {
        username: r.profile_username,
        expertise: r.profile_expertise,
        occupation: r.profile_occupation,
        age_group: r.profile_age_group,
        gender: r.profile_gender
      }
    }));

    // Determine which ratings to use based on access
    let targetRatings = allRatings;
    let accessLevel = 'full';

    if (!isPublic && !isAuthorized) {
        const myRating = userId ? allRatings.find((r: any) => r.user_id === userId) : null;
        if (myRating) {
            targetRatings = [myRating];
            accessLevel = 'personal';
        } else {
            return NextResponse.json({
                success: false,
                error: 'Access denied',
                accessLevel: 'denied',
                project: { title: project.title, custom_data: rawCustom }
            }, { status: 403 });
        }
    }

    // 3. Fetch Polls
    const { data: votes } = await supabaseAdmin
      .from("ProjectPoll")
      .select("*")
      .eq("project_id", projectId);

    // 4. Aggregation
    const totalCount = allRatings.length;
    const customConfig = rawCustom?.audit_config || rawCustom?.custom_categories;
    const categories = customConfig?.categories || [
      { id: 'score_1', label: '기획력' },
      { id: 'score_2', label: '독창성' },
      { id: 'score_3', label: '심미성' },
      { id: 'score_4', label: '완성도' },
      { id: 'score_5', label: '상업성' },
      { id: 'score_6', label: '편의성' }
    ];
    const catIds = categories.map((c: any) => c.id || c.label);

    let averages: Record<string, number> = {};
    let totalAvg = 0;
    const expertiseStats: Record<string, number> = {};
    const occupationStats: Record<string, number> = {};
    const voteCounts: Record<string, number> = {};

    if (votes) {
        votes.forEach((v: any) => {
            voteCounts[v.vote_type] = (voteCounts[v.vote_type] || 0) + 1;
        });
    }

    if (targetRatings.length > 0) {
      const sums: Record<string, number> = {};
      catIds.forEach((id: string) => sums[id] = 0);

      targetRatings.forEach((curr: any) => {
          catIds.forEach((id: string, idx: number) => {
              const columnName = `score_${idx + 1}`;
              const val = Number(curr[columnName]) || Number(curr[id]) || 0;
              sums[id] += val;
          });

          if (curr.vote_type) {
              voteCounts[curr.vote_type] = (voteCounts[curr.vote_type] || 0) + 1;
          }

          const profile = curr.profile as any;
          if (profile) {
              const expField = profile.expertise?.fields || profile.expertise || [];
              const expList = Array.isArray(expField) ? expField : [];
              expList.forEach((field: string) => {
                  expertiseStats[field] = (expertiseStats[field] || 0) + 1;
              });
              if (profile.occupation) {
                  occupationStats[profile.occupation] = (occupationStats[profile.occupation] || 0) + 1;
              }
          }
      });

      catIds.forEach((id: string) => {
          averages[id] = Number((sums[id] / targetRatings.length).toFixed(1));
      });

      const sumAvgs = Object.values(averages).reduce((a, b) => a + b, 0);
      totalAvg = Number((sumAvgs / catIds.length).toFixed(1));
    }

    // 5. Build feedbacks with score columns
    const feedbacks = targetRatings.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        guest_id: r.guest_id,
        username: (r.profile as any)?.username || (r.user_id ? "익명의 전문가" : "비회원 게스트"),
        expertise: (() => {
            const profile = r.profile as any;
            if (!profile) return [];
            const expField = profile.expertise?.fields || profile.expertise || [];
            return Array.isArray(expField) ? expField : [];
        })(),
        occupation: (r.profile as any)?.occupation,
        age_group: (r.profile as any)?.age_group,
        gender: (r.profile as any)?.gender,
        score: r.score,
        score_1: r.score_1,
        score_2: r.score_2,
        score_3: r.score_3,
        score_4: r.score_4,
        score_5: r.score_5,
        score_6: r.score_6,
        vote_type: r.vote_type,
        proposal: r.proposal,
        custom_answers: r.custom_answers,
        created_at: r.created_at || r.updated_at
    }));

    return NextResponse.json({
      success: true,
      project: {
        title: project.title,
        custom_data: rawCustom,
        user_id: project.user_id,
        author_id: project.author_id || project.user_id,
        views: project.views || project.view_count || 0,
      },
      report: {
        totalReviewers: totalCount,
        accessLevel,
        michelin: { averages, totalAvg, count: targetRatings.length },
        polls: voteCounts,
        feedbacks,
        expertiseDistribution: expertiseStats,
        occupationDistribution: occupationStats
      }
    });

  } catch (err: any) {
    console.error("Report fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
