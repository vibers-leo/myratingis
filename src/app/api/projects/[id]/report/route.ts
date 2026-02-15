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

  if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Verify Ownership (UUID면 projects 테이블, 정수면 Project 테이블)
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

    if (!project || project.user_id !== userId) {
        return NextResponse.json({ error: "Forbidden: You are not the owner." }, { status: 403 });
    }

    // 2. Fetch Ratings with Profiles
    const { data: ratings, error: ratingError } = await supabaseAdmin
      .from("ProjectRating")
      .select("*, profile:profiles(username, expertise, occupation, age_group, gender)")
      .eq("project_id", projectId);

    if (ratingError) throw ratingError;

    // 3. Fetch Polls
    const { data: votes } = await supabaseAdmin
      .from("ProjectPoll")
      .select("*")
      .eq("project_id", projectId);

    // 4. Aggregation Logic
    const totalCount = ratings?.length || 0;
    
    // Dynamic Categories from Project Config
    let rawCustom = project.custom_data || {};
    if (typeof rawCustom === 'string') {
        try { rawCustom = JSON.parse(rawCustom); } catch (e) { rawCustom = {}; }
    }
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

    // Expertise Distribution & Votes
    const expertiseStats: Record<string, number> = {};
    const occupationStats: Record<string, number> = {};
    const voteCounts: Record<string, number> = {};

    // Seed from separate poll table if exists
    if (votes) {
        votes.forEach((v: any) => {
            voteCounts[v.vote_type] = (voteCounts[v.vote_type] || 0) + 1;
        });
    }

    if (totalCount > 0) {
      const sums: Record<string, number> = {};
      catIds.forEach((id: string) => sums[id] = 0);

      ratings?.forEach((curr: any) => {
          catIds.forEach((id: string, idx: number) => {
              // Map score_1...6 columns to category ids by order
              const columnName = `score_${idx + 1}`;
              // Fallback priority: Specific column -> Category ID key -> Global average score -> 0
              const val = Number(curr[columnName]) || Number(curr[id]) || Number(curr.score) || 0;
              sums[id] += val;
          });

          // Aggregate vote_type from Rating table
          if (curr.vote_type) {
              voteCounts[curr.vote_type] = (voteCounts[curr.vote_type] || 0) + 1;
          }

          // Aggregate Expertise
          const profile = curr.profile as any;
          if (profile) {
              const expField = profile.expertise?.fields || profile.expertise || [];
              const expList = Array.isArray(expField) ? expField : [];
              expList.forEach((field: string) => {
                  expertiseStats[field] = (expertiseStats[field] || 0) + 1;
              });

              // Aggregate Occupation
              const occ = profile.occupation;
              if (occ) {
                  occupationStats[occ] = (occupationStats[occ] || 0) + 1;
              }
          }
      });

      catIds.forEach((id: string) => {
          averages[id] = Number((sums[id] / totalCount).toFixed(1));
      });
      
      const sumAvgs = Object.values(averages).reduce((a, b) => a + b, 0);
      totalAvg = Number((sumAvgs / catIds.length).toFixed(1));
    }

    // Feedbacks list

    // Feedback Comments (Proposal & Custom Answers)
    // Feedback Comments (Proposal & Custom Answers)
    const feedbacks = ratings?.map((r: any) => ({
        id: r.id,
        user_id: r.user_id,
        guest_id: r.guest_id,
        username: (r.profile as any)?.nickname || (r.profile as any)?.username || (r.user_id ? "익명의 전문가" : "비회원 게스트"),
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
        vote_type: r.vote_type,
        proposal: r.proposal,
        custom_answers: r.custom_answers,
        created_at: r.created_at
    })) || [];

    return NextResponse.json({
      success: true,
      report: {
        totalReviewers: totalCount,
        michelin: {
          averages,
          totalAvg,
          count: totalCount
        },
        polls: voteCounts,
        feedbacks: feedbacks,
        expertiseDistribution: expertiseStats,
        occupationDistribution: occupationStats
      }
    });

  } catch (err: any) {
    console.error("Report fetch error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
