import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 피드백 요청 (프로모션) API
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  
  // 1. Auth Check
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Call RPC to deduct points and promote project
  // 1.5 Parse Body (Get options)
  let options: any = {};
  let calculatedCost = 500; // Base Cost from UI

  try {
    const body = await req.json();
    if (body.options) {
      options = body.options;
      
      /* [Viral Phase] Costs disabled for now
      if (options.isABMode) calculatedCost += 200;
      if (options.targetExpertise && options.targetExpertise.length > 0) {
        calculatedCost += (options.targetExpertise.length * 50);
      }
      */
      calculatedCost = 0; 
    }
  } catch (e) {
    // Ignore parsing error, use default options
  }

  const { data, error } = await supabaseAdmin.rpc('request_project_feedback', {
      p_project_id: Number(projectId),
      p_user_id: user.id,
      p_cost: calculatedCost,
      p_options: options
  });

  if (error) {
      console.error("Promotion failed:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // RPC returns JSONB (success, message, remaining_points)
  const result = data as any;

  if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
  }

  // 3. Notify Target Experts
  if (options.targetExpertise && options.targetExpertise.length > 0) {
    try {
        const { data: projectData } = await supabaseAdmin
            .from('Project')
            .select('title')
            .eq('project_id', projectId)
            .single();

        // Simple intersection check using Postgres JSONB containment/operators or just JS filtering
        // For simplicity and to avoid complex SQL for now, we'll fetch recently active users and filter.
        // In a high-traffic app, use: ...select('id').filter('expertise->fields', 'cs', options.targetExpertise)
        const { data: experts } = await supabaseAdmin
            .from('profiles')
            .select('id, expertise')
            .not('id', 'eq', user.id)
            .limit(100); // Sample limit

        if (experts) {
            const matchedExperts = experts.filter(exp => {
                const fields = (exp.expertise as any)?.fields || [];
                return options.targetExpertise.some((target: string) => fields.includes(target));
            });

            if (matchedExperts.length > 0) {
                const notifications = matchedExperts.map(exp => ({
                    user_id: exp.id,
                    type: 'system',
                    title: '🎯 당신의 전문 지식이 필요합니다!',
                    message: `'${projectData?.title}' 프로젝트에서 '${options.targetExpertise.join(', ')}' 전문가의 피드백을 기다리고 있습니다.`,
                    link: `/review/${projectId}`,
                    action_label: '심사하러 가기',
                    sender_id: user.id
                }));

                await supabaseAdmin.from('notifications').insert(notifications);
                console.log(`[Promotion] Notified ${matchedExperts.length} experts.`);
            }
        }
    } catch (e) {
        console.error("Expert notification failed:", e);
        // Don't fail the whole request
    }
  }

  return NextResponse.json({ 
      success: true, 
      message: "피드백 요청이 등록되었습니다!", 
      remaining_points: result.remaining_points 
  });
}
