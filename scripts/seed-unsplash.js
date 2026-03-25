// Unsplash에서 이미지를 가져와 Supabase에 저장하는 스크립트
// 사용법: node scripts/seed-unsplash.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const UNSPLASH_ACCESS_KEY = 'YOUR_UNSPLASH_ACCESS_KEY'; // Unsplash Access Key 필요

const categories = [
  { id: 1, name: '포토', query: 'photography' },
  { id: 2, name: '애니메이션', query: 'animation' },
  { id: 3, name: '그래픽', query: 'graphic design' },
  { id: 4, name: '디자인', query: 'design' },
  { id: 5, name: '영상', query: 'video' },
  { id: 6, name: '영화·드라마', query: 'cinema' },
  { id: 7, name: '오디오', query: 'music' },
  { id: 8, name: '3D', query: '3d render' },
];

async function fetchUnsplashImages(query, count = 10) {
  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&client_id=${UNSPLASH_ACCESS_KEY}`
  );
  
  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  return data.results;
}

async function getOrCreateUser() {
  // 기존 사용자 확인
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .limit(1)
    .single();
  
  if (existingUser) {
    return existingUser.id;
  }
  
  // 없으면 더미 사용자 생성
  const { data: newUser, error } = await supabase
    .from('profiles')
    .insert({
      username: 'demo_user',
      email: 'demo@vibefolio.net',
      role: 'user'
    })
    .select()
    .single();
  
  if (error) {
    console.error('사용자 생성 실패:', error);
    throw error;
  }
  
  return newUser.id;
}

async function seedProjects() {
  console.log('🌱 Unsplash 데이터 시딩 시작...');
  
  try {
    const userId = await getOrCreateUser();
    console.log(`✅ 사용자 ID: ${userId}`);
    
    let totalInserted = 0;
    
    for (const category of categories) {
      console.log(`\n📸 카테고리: ${category.name} (${category.query})`);
      
      try {
        const images = await fetchUnsplashImages(category.query, 5);
        
        for (const img of images) {
          const projectData = {
            user_id: userId,
            category_id: category.id,
            title: img.description || img.alt_description || `${category.name} 작품`,
            content_text: img.description || img.alt_description || '',
            thumbnail_url: img.urls.regular,
            image_url: img.urls.full,
            rendering_type: 'image',
            field: 'it',
            likes_count: img.likes || 0,
            views_count: Math.floor(Math.random() * 1000),
            created_at: new Date().toISOString(),
          };
          
          const { error } = await supabase
            .from('Project')
            .insert(projectData);
          
          if (error) {
            console.error(`  ❌ 삽입 실패:`, error.message);
          } else {
            totalInserted++;
            console.log(`  ✅ ${projectData.title.substring(0, 30)}...`);
          }
        }
        
        // API Rate Limit 방지
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`  ❌ ${category.name} 카테고리 실패:`, error.message);
      }
    }
    
    console.log(`\n🎉 완료! 총 ${totalInserted}개 프로젝트 추가됨`);
    
  } catch (error) {
    console.error('❌ 시딩 실패:', error);
    process.exit(1);
  }
}

// 실행
seedProjects();
