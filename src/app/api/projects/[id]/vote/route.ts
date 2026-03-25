import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// UUID 형식 감지
const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// GET: 투표 현황 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const searchParams = req.nextUrl.searchParams;
  const guestId = searchParams.get('guest_id');

  const authHeader = req.headers.get('authorization');
  let currentUserId: string | null = null;

  if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) currentUserId = user.id;
  }

  try {
    // 1. Get Vote Counts (project_id를 문자열로 전달)
    const { data: countsData, error: countsError } = await supabaseAdmin
      .from('ProjectPoll')
      .select('vote_type')
      .eq('project_id', projectId);

    if (countsError) throw countsError;

    const counts: Record<string, number> = {};
    countsData?.forEach((item: any) => {
        counts[item.vote_type] = (counts[item.vote_type] || 0) + 1;
    });

    // 2. Get Project Data (UUID면 projects 테이블, 정수면 Project 테이블)
    let project: any = null;
    if (isUUID(projectId)) {
        const { data } = await supabaseAdmin
            .from('projects')
            .select('custom_data')
            .eq('id', projectId)
            .single();
        project = data;
    } else {
        const { data } = await supabaseAdmin
            .from('Project')
            .select('custom_data')
            .eq('project_id', Number(projectId))
            .single();
        project = data;
    }

    // 3. Get My Vote (User or Guest)
    let myVote = null;

    if (currentUserId) {
        const { data: myData } = await supabaseAdmin
            .from('ProjectPoll')
            .select('vote_type')
            .eq('project_id', projectId)
            .eq('user_id', currentUserId)
            .single();
        if (myData) myVote = myData.vote_type;
    } else if (guestId) {
        const { data: myData } = await supabaseAdmin
            .from('ProjectPoll')
            .select('vote_type')
            .eq('project_id', projectId)
            .eq('guest_id', guestId)
            .single();
        if (myData) myVote = myData.vote_type;
    }

    return NextResponse.json({ counts, myVote, project });

  } catch (error) {
    console.error("Poll Error:", error);
    return NextResponse.json({ error: "Failed to fetch poll" }, { status: 500 });
  }
}

// POST: 투표하기
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;

  const authHeader = req.headers.get('authorization');
  let userId: string | null = null;

  if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
  }

  try {
    const { voteType, guest_id } = await req.json();
    const targetUserId = userId;
    const targetGuestId = !userId ? guest_id : null;

    if (!targetUserId && !targetGuestId) {
         return NextResponse.json({ error: '로그인 또는 게스트 식별이 필요합니다.' }, { status: 400 });
    }

    if (!voteType) {
        // Cancel Vote (Delete)
        let query = supabaseAdmin
            .from('ProjectPoll')
            .delete()
            .eq('project_id', projectId);

        if (targetUserId) query = query.eq('user_id', targetUserId);
        else query = query.eq('guest_id', targetGuestId);

        const { error } = await query;
        if (error) throw error;
        return NextResponse.json({ success: true, action: 'deleted' });
    } else {
        // Upsert Vote
        const upsertData: any = {
            project_id: projectId,
            vote_type: voteType,
            updated_at: new Date().toISOString()
        };

        let conflictTarget = '';

        if (targetUserId) {
            upsertData.user_id = targetUserId;
            upsertData.guest_id = null;
            conflictTarget = 'project_id, user_id';
        } else {
            upsertData.user_id = null;
            upsertData.guest_id = targetGuestId;
            conflictTarget = 'project_id, guest_id';
        }

        const { error } = await supabaseAdmin
            .from('ProjectPoll')
            .upsert(upsertData, { onConflict: conflictTarget });

        if (error) throw error;

        // [Point System] Reward for Voting (Users Only)
        if (targetUserId) {
            try {
                const { count } = await supabaseAdmin
                  .from('point_logs')
                  .select('*', { count: 'exact', head: true })
                  .eq('user_id', targetUserId)
                  .eq('reason', `스티커 투표 보상 (Project ${projectId})`);

                if ((count || 0) === 0) {
                    const REWARD = 50;
                    const { data: profile } = await supabaseAdmin.from('profiles').select('points').eq('id', targetUserId).single();
                    await supabaseAdmin.from('profiles').update({ points: (profile?.points || 0) + REWARD }).eq('id', targetUserId);
                    await supabaseAdmin.from('point_logs').insert({
                        user_id: targetUserId,
                        amount: REWARD,
                        reason: `스티커 투표 보상 (Project ${projectId})`
                    });
                }
            } catch (e) {
                console.error('[Point System] Failed to reward vote points:', e);
            }
        }

        return NextResponse.json({ success: true, action: 'upserted' });
    }

  } catch (error) {
    console.error("Vote Error:", error);
    return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }
}
