import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const projectId = params.id;

  try {
    // 1. Fetch Ratings with profiles via RPC (PostgREST 스키마 캐시 우회)
    const { data: allRatings, error: ratingError } = await supabaseAdmin
      .rpc('get_ratings_with_profiles', { p_project_id: projectId });

    if (ratingError) throw ratingError;

    // Process Ratings
    let michelinAvg = 0;
    let categoryAvgs = [0, 0, 0, 0, 0];
    let totalRatings = allRatings?.length || 0;
    let scoreDistribution = [0, 0, 0, 0, 0];
    const expertiseStats: Record<string, number> = {};

    if (totalRatings > 0) {
       const sum = allRatings?.reduce((acc, curr) => acc + (Number(curr.score) || 0), 0) || 0;
       michelinAvg = Number((sum / totalRatings).toFixed(1));

       const sums = allRatings?.reduce((acc, curr) => [
          acc[0] + (Number(curr.score) || 0),
          acc[1] + (Number(curr.score_1) || 0),
          acc[2] + (Number(curr.score_2) || 0),
          acc[3] + (Number(curr.score_3) || 0),
          acc[4] + (Number(curr.score_4) || 0),
       ], [0, 0, 0, 0, 0]) || [0, 0, 0, 0, 0];
       categoryAvgs = sums.map(s => Number((s / totalRatings).toFixed(1)));

       allRatings?.forEach(r => {
          const s = Math.round(Number(r.score) || 0);
          if (s >= 1 && s <= 5) scoreDistribution[5 - s]++; 
          
          // Expertise distribution (RPC returns flat profile_expertise field)
          const rawExpertise = r.profile_expertise || (r as any).profile?.expertise;
          const fields = rawExpertise?.fields || (Array.isArray(rawExpertise) ? rawExpertise : []);
          fields.forEach((f: string) => {
              expertiseStats[f] = (expertiseStats[f] || 0) + 1;
          });
       });
    }

    // 2. Fetch Polls (Stickers)
    const { data: polls, error: pollError } = await supabaseAdmin
      .from('ProjectPoll')
      .select('vote_type')
      .eq('project_id', projectId);
    
    if (pollError) throw pollError;

    const pollCounts = {
        launch: 0,
        research: 0,
        more: 0
    };
    polls?.forEach(p => {
        if (p.vote_type === 'launch' || p.vote_type === 'launch_now') pollCounts.launch++;
        else if (p.vote_type === 'research' || p.vote_type === 'need_research') pollCounts.research++;
        else if (p.vote_type === 'more' || p.vote_type === 'develop_more') pollCounts.more++;
    });

    const topStickers = [
        { icon: '🚀', count: pollCounts.launch, label: '당장 쓸게요' },
        { icon: '💎', count: pollCounts.more, label: '더 개발해주세요' },
        { icon: '🧪', count: pollCounts.research, label: '연구 필요' }
    ].sort((a, b) => b.count - a.count);

    // 3. Fetch Secret Comments (Proposals)
    const { count: secretCount, error: secretError } = await supabaseAdmin
       .from('Comment')
       .select('*', { count: 'exact', head: true })
       .eq('project_id', projectId)
       .eq('is_secret', true);

    const { count: totalComments, error: commentError } = await supabaseAdmin
       .from('Comment')
       .select('*', { count: 'exact', head: true })
       .eq('project_id', projectId);

    if (secretError || commentError) console.error(secretError || commentError);

    return NextResponse.json({
        success: true,
        stats: {
            michelinAvg,
            categoryAvgs,
            totalRatings,
            scoreDistribution,
            topStickers,
            secretProposals: secretCount || 0,
            totalComments: totalComments || 0,
            expertiseDistribution: expertiseStats
        }
    });

  } catch (error: any) {
    console.error("Report Fetch Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
