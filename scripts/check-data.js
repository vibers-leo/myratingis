// scripts/check-data.js
// DB에 추가된 데이터 확인 스크립트

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

async function checkData() {
  console.log('🔍 recruit_items 테이블 데이터 확인 중...\n');

  try {
    // 모든 항목 조회
    const { data: allItems, error: allError } = await supabase
      .from('recruit_items')
      .select('*')
      .order('id', { ascending: true });

    if (allError) {
      console.error('❌ 조회 실패:', allError.message);
      return;
    }

    console.log(`📊 전체 항목: ${allItems?.length || 0}개\n`);

    if (allItems && allItems.length > 0) {
      allItems.forEach((item, index) => {
        console.log(`${index + 1}. [${item.type}] ${item.title}`);
        console.log(`   - ID: ${item.id}`);
        console.log(`   - 승인 여부: ${item.is_approved ? '✅ 승인됨' : '⏳ 대기 중'}`);
        console.log(`   - 활성화: ${item.is_active ? '✅' : '❌'}`);
        console.log(`   - 크롤링 시간: ${item.crawled_at || 'N/A'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ 데이터가 없습니다!');
    }

    // 승인 대기 항목만 조회
    const { data: pendingItems, error: pendingError } = await supabase
      .from('recruit_items')
      .select('*')
      .eq('is_approved', false);

    if (!pendingError) {
      console.log(`\n⏳ 승인 대기 중인 항목: ${pendingItems?.length || 0}개`);
    }

  } catch (error) {
    console.error('💥 오류 발생:', error);
  }
}

checkData();
