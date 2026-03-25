// scripts/auto-expire.js
// 마감일이 지난 항목 자동 비활성화 스크립트

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ 환경변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function autoExpire() {
  console.log('🕐 자동 만료 처리 시작...\n');

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // 마감일이 지난 활성 항목 조회
    const { data: expiredItems, error: selectError } = await supabase
      .from('recruit_items')
      .select('*')
      .eq('is_active', true)
      .lt('date', todayStr);

    if (selectError) {
      console.error('❌ 조회 실패:', selectError.message);
      return;
    }

    if (!expiredItems || expiredItems.length === 0) {
      console.log('✅ 만료된 항목이 없습니다.');
      return;
    }

    console.log(`📋 만료된 항목: ${expiredItems.length}개\n`);

    // 비활성화 처리
    for (const item of expiredItems) {
      const { error: updateError } = await supabase
        .from('recruit_items')
        .update({ is_active: false })
        .eq('id', item.id);

      if (updateError) {
        console.error(`❌ 비활성화 실패 (ID: ${item.id}):`, updateError.message);
      } else {
        console.log(`✅ 비활성화: ${item.title} (마감: ${item.date})`);
      }
    }

    console.log('\n✨ 자동 만료 처리 완료!');

    // 통계 출력
    const { data: stats } = await supabase
      .from('recruit_items')
      .select('is_active, is_approved');

    if (stats) {
      const active = stats.filter(s => s.is_active && s.is_approved).length;
      const pending = stats.filter(s => !s.is_approved).length;
      const expired = stats.filter(s => !s.is_active).length;

      console.log('\n📊 현재 통계:');
      console.log(`   활성 항목: ${active}개`);
      console.log(`   승인 대기: ${pending}개`);
      console.log(`   만료된 항목: ${expired}개`);
    }

  } catch (error) {
    console.error('💥 오류 발생:', error);
  }
}

autoExpire();
