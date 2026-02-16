import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    // 1. 인증 확인
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (!user || authError) {
      return NextResponse.json({ error: '인증에 실패했습니다.' }, { status: 401 });
    }

    // 2. 요청 파싱
    const { reward_item_id, delivery_info } = await req.json();
    if (!reward_item_id) {
      return NextResponse.json({ error: '상품 ID가 필요합니다.' }, { status: 400 });
    }

    // 3. RPC로 구매 처리 (동시성 안전)
    const { data: result, error } = await supabaseAdmin.rpc('purchase_reward_item', {
      p_user_id: user.id,
      p_item_id: reward_item_id,
      p_delivery_info: delivery_info || {},
    });

    if (error) {
      console.error('[Purchase] RPC error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!result?.success) {
      const errorMessages: Record<string, string> = {
        item_not_found: '상품을 찾을 수 없습니다.',
        out_of_stock: '품절된 상품입니다.',
        insufficient_points: `포인트가 부족합니다. (필요: ${result?.required}P, 보유: ${result?.current}P)`,
      };

      return NextResponse.json({
        success: false,
        error: errorMessages[result?.error] || result?.error,
      }, { status: 400 });
    }

    // 4. 알림
    try {
      await supabaseAdmin.from('notifications').insert({
        user_id: user.id,
        type: 'reward',
        title: '포인트샵 구매 완료! 🛒',
        message: `${result.item_name}을(를) ${result.points_spent}P로 구매했습니다.`,
        link: '/mypage',
        read: false,
      });
    } catch (e) {
      console.warn('[Purchase] Notification failed:', e);
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    console.error('[Purchase] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
