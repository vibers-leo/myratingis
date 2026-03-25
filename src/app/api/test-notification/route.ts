
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
        }

        console.log('[Test Notification] Sending to user:', user.id);

        const { error } = await supabaseAdmin
            .from('notifications')
            .insert({
                user_id: user.id,
                type: 'system',
                title: '🔔 서버 연결 테스트 성공!',
                message: '서버에서 발송된 실시간 알림입니다. 연결 상태가 아주 좋습니다.',
                link: '/mypage?tab=notifications',
                read: false,
                created_at: new Date().toISOString()
            });

        if (error) {
            console.error('[Test Notification] Insert Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: '알림이 전송되었습니다.' });
    } catch (e: any) {
        console.error('[Test Notification] Server Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
