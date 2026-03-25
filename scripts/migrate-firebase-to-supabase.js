/**
 * Firebase → Supabase 데이터 마이그레이션 스크립트
 *
 * 실행 방법:
 * 1. npm install (의존성 설치)
 * 2. .env.local 파일에 Firebase, Supabase 설정 확인
 * 3. node scripts/migrate-firebase-to-supabase.js
 *
 * 주의: 이 스크립트는 한 번만 실행하세요!
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');

// ========================================
// 설정
// ========================================

// Firebase Admin 초기화
const serviceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'myratingis-29082',
  // Firebase Admin SDK 서비스 계정 키가 필요합니다
  // https://console.firebase.google.com/project/myratingis-29082/settings/serviceaccounts/adminsdk
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestore = admin.firestore();

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role Key 필요!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 설정이 없습니다. .env.local 파일을 확인하세요.');
  console.error('필요한 환경 변수:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ========================================
// 유틸리티 함수
// ========================================

/**
 * Firebase Timestamp를 ISO 문자열로 변환
 */
function convertTimestamp(timestamp) {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000).toISOString();
  }
  return timestamp;
}

/**
 * 이메일로 Supabase User ID 찾기
 */
async function findSupabaseUserIdByEmail(email) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();

  if (error || !data) {
    console.warn(`⚠️  이메일 ${email}에 해당하는 Supabase 사용자를 찾을 수 없습니다.`);
    return null;
  }

  return data.id;
}

/**
 * 이메일 → UUID 매핑 캐시
 */
const emailToUuidCache = new Map();

async function getSupabaseUserId(email) {
  if (!email) return null;

  // 캐시 확인
  if (emailToUuidCache.has(email)) {
    return emailToUuidCache.get(email);
  }

  // DB 조회
  const userId = await findSupabaseUserIdByEmail(email);
  if (userId) {
    emailToUuidCache.set(email, userId);
  }

  return userId;
}

// ========================================
// 1. Users → Profiles 마이그레이션
// ========================================

async function migrateUsers() {
  console.log('\n📦 1/5: Users → Profiles 마이그레이션 시작...');

  const usersSnapshot = await firestore.collection('users').get();
  console.log(`   총 ${usersSnapshot.size}개의 사용자 문서 발견`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const doc of usersSnapshot.docs) {
    const userData = doc.data();
    const email = userData.email;

    if (!email) {
      console.warn(`   ⚠️  이메일 없는 사용자 건너뛰기: ${doc.id}`);
      skipCount++;
      continue;
    }

    try {
      // Supabase Auth 사용자가 이미 있는지 확인
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        // 기존 프로필 업데이트
        const { error } = await supabase
          .from('profiles')
          .update({
            username: userData.username || null,
            nickname: userData.nickname || null,
            profile_image: userData.profile_image || userData.photoURL || null,
            bio: userData.bio || null,
            role: userData.role || 'user',
            is_public: userData.is_public !== undefined ? userData.is_public : true,
            cover_image_url: userData.cover_image_url || null,
            social_links: userData.social_links || {},
            interests: userData.interests || {},
            expertise: userData.expertise || {},
            gender: userData.gender || null,
            age_group: userData.age_group || null,
            occupation: userData.occupation || null,
            onboarding_completed: userData.onboardingCompleted || false,
            updated_at: convertTimestamp(userData.updatedAt) || new Date().toISOString(),
          })
          .eq('email', email);

        if (error) throw error;

        emailToUuidCache.set(email, existingUser.id);
        successCount++;
        console.log(`   ✅ 업데이트: ${email}`);
      } else {
        console.warn(`   ⚠️  Supabase Auth에 없는 사용자 (가입 필요): ${email}`);
        skipCount++;
      }
    } catch (error) {
      console.error(`   ❌ 에러 (${email}):`, error.message);
      errorCount++;
    }
  }

  console.log(`\n   결과: 성공 ${successCount}, 건너뜀 ${skipCount}, 에러 ${errorCount}`);
}

// ========================================
// 2. Projects 마이그레이션
// ========================================

async function migrateProjects() {
  console.log('\n📦 2/5: Projects 마이그레이션 시작...');

  const projectsSnapshot = await firestore.collection('projects').get();
  console.log(`   총 ${projectsSnapshot.size}개의 프로젝트 문서 발견`);

  let successCount = 0;
  let errorCount = 0;

  // Firebase Doc ID → Supabase UUID 매핑
  const projectIdMapping = new Map();

  for (const doc of projectsSnapshot.docs) {
    const projectData = doc.data();

    try {
      const authorId = await getSupabaseUserId(projectData.author_email);

      if (!authorId) {
        console.warn(`   ⚠️  작성자를 찾을 수 없어 건너뜀: ${doc.id}`);
        continue;
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          title: projectData.title || '제목 없음',
          summary: projectData.summary || null,
          content_text: projectData.content_text || null,
          description: projectData.description || null,
          category_id: projectData.category_id || null,
          thumbnail_url: projectData.thumbnail_url || null,
          visibility: projectData.visibility || 'public',
          audit_deadline: convertTimestamp(projectData.audit_deadline),
          is_growth_requested: projectData.is_growth_requested || false,
          author_id: authorId,
          author_email: projectData.author_email,
          created_at: convertTimestamp(projectData.created_at || projectData.createdAt) || new Date().toISOString(),
          updated_at: convertTimestamp(projectData.updated_at || projectData.updatedAt) || new Date().toISOString(),
          scheduled_at: convertTimestamp(projectData.scheduled_at),
          views_count: projectData.views || projectData.views_count || projectData.view_count || 0,
          likes_count: projectData.likes || projectData.likes_count || projectData.like_count || 0,
          evaluations_count: projectData.rating_count || projectData.evaluations_count || 0,
          site_url: projectData.site_url || null,
          rendering_type: projectData.rendering_type || null,
          alt_description: projectData.alt_description || null,
          custom_data: projectData.custom_data || {},
        })
        .select()
        .single();

      if (error) throw error;

      // ID 매핑 저장
      projectIdMapping.set(doc.id, data.id);

      successCount++;
      console.log(`   ✅ 마이그레이션: ${projectData.title}`);
    } catch (error) {
      console.error(`   ❌ 에러 (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`\n   결과: 성공 ${successCount}, 에러 ${errorCount}`);

  // 다음 단계를 위해 매핑 반환
  return projectIdMapping;
}

// ========================================
// 3. Evaluations 마이그레이션
// ========================================

async function migrateEvaluations(projectIdMapping) {
  console.log('\n📦 3/5: Evaluations 마이그레이션 시작...');

  const evaluationsSnapshot = await firestore.collection('evaluations').get();
  console.log(`   총 ${evaluationsSnapshot.size}개의 평가 문서 발견`);

  let successCount = 0;
  let errorCount = 0;

  for (const doc of evaluationsSnapshot.docs) {
    const evalData = doc.data();

    try {
      const userId = await getSupabaseUserId(evalData.user_email);
      const projectId = projectIdMapping.get(evalData.projectId);

      if (!userId) {
        console.warn(`   ⚠️  사용자 없음, 건너뜀: ${evalData.user_email}`);
        continue;
      }

      if (!projectId) {
        console.warn(`   ⚠️  프로젝트 없음, 건너뜀: ${evalData.projectId}`);
        continue;
      }

      const { error } = await supabase
        .from('evaluations')
        .insert({
          project_id: projectId,
          user_id: userId,
          user_email: evalData.user_email,
          user_nickname: evalData.user_nickname || null,
          username: evalData.username || null,
          user_job: evalData.user_job || null,
          score: evalData.score || null,
          proposal: evalData.proposal || null,
          expertise: evalData.expertise || [],
          custom_answers: evalData.custom_answers || {},
          created_at: convertTimestamp(evalData.created_at) || new Date().toISOString(),
          updated_at: convertTimestamp(evalData.updated_at) || new Date().toISOString(),
        });

      if (error) throw error;

      successCount++;
      console.log(`   ✅ 평가 마이그레이션: ${evalData.user_email} → 프로젝트`);
    } catch (error) {
      console.error(`   ❌ 에러 (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`\n   결과: 성공 ${successCount}, 에러 ${errorCount}`);
}

// ========================================
// 4. Inquiries 마이그레이션
// ========================================

async function migrateInquiries(projectIdMapping) {
  console.log('\n📦 4/5: Inquiries 마이그레이션 시작...');

  const inquiriesSnapshot = await firestore.collection('inquiries').get();
  console.log(`   총 ${inquiriesSnapshot.size}개의 문의 문서 발견`);

  let successCount = 0;
  let errorCount = 0;

  for (const doc of inquiriesSnapshot.docs) {
    const inquiryData = doc.data();

    try {
      const receiverId = await getSupabaseUserId(inquiryData.receiverEmail);
      const senderId = await getSupabaseUserId(inquiryData.senderEmail);
      const projectId = projectIdMapping.get(inquiryData.projectId);

      if (!receiverId) {
        console.warn(`   ⚠️  수신자 없음, 건너뜀`);
        continue;
      }

      const { error } = await supabase
        .from('inquiries')
        .insert({
          project_id: projectId || null,
          project_title: inquiryData.projectTitle || null,
          receiver_id: receiverId,
          receiver_email: inquiryData.receiverEmail,
          sender_id: senderId || null,
          sender_email: inquiryData.senderEmail,
          sender_name: inquiryData.senderName,
          sender_phone: inquiryData.senderPhone || null,
          title: inquiryData.title,
          content: inquiryData.content,
          inquiry_type: inquiryData.inquiryType || 'general',
          is_private: inquiryData.isPrivate || false,
          status: inquiryData.status || 'pending',
          created_at: convertTimestamp(inquiryData.createdAt) || new Date().toISOString(),
          read_at: convertTimestamp(inquiryData.readAt),
          replied_at: convertTimestamp(inquiryData.repliedAt),
        });

      if (error) throw error;

      successCount++;
      console.log(`   ✅ 문의 마이그레이션`);
    } catch (error) {
      console.error(`   ❌ 에러 (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`\n   결과: 성공 ${successCount}, 에러 ${errorCount}`);
}

// ========================================
// 5. Proposals 마이그레이션
// ========================================

async function migrateProposals(projectIdMapping) {
  console.log('\n📦 5/5: Proposals 마이그레이션 시작...');

  const proposalsSnapshot = await firestore.collection('proposals').get();
  console.log(`   총 ${proposalsSnapshot.size}개의 제안 문서 발견`);

  let successCount = 0;
  let errorCount = 0;

  for (const doc of proposalsSnapshot.docs) {
    const proposalData = doc.data();

    try {
      const receiverId = await getSupabaseUserId(proposalData.receiverEmail);
      const senderId = await getSupabaseUserId(proposalData.senderEmail);
      const projectId = projectIdMapping.get(proposalData.projectId);

      if (!receiverId) {
        console.warn(`   ⚠️  수신자 없음, 건너뜀`);
        continue;
      }

      const { error } = await supabase
        .from('proposals')
        .insert({
          project_id: projectId || null,
          project_title: proposalData.projectTitle || null,
          sender_id: senderId || null,
          sender_email: proposalData.senderEmail,
          sender_name: proposalData.senderName,
          sender_photo: proposalData.senderPhoto || null,
          receiver_id: receiverId,
          receiver_email: proposalData.receiverEmail || null,
          title: proposalData.title,
          content: proposalData.content,
          contact: proposalData.contact,
          status: proposalData.status || 'pending',
          created_at: convertTimestamp(proposalData.createdAt) || new Date().toISOString(),
          read_at: convertTimestamp(proposalData.readAt),
          replied_at: convertTimestamp(proposalData.repliedAt),
        });

      if (error) throw error;

      successCount++;
      console.log(`   ✅ 제안 마이그레이션`);
    } catch (error) {
      console.error(`   ❌ 에러 (${doc.id}):`, error.message);
      errorCount++;
    }
  }

  console.log(`\n   결과: 성공 ${successCount}, 에러 ${errorCount}`);
}

// ========================================
// 6. Project Likes 마이그레이션 (서브컬렉션)
// ========================================

async function migrateProjectLikes(projectIdMapping) {
  console.log('\n📦 6/6: Project Likes 마이그레이션 시작...');

  let successCount = 0;
  let errorCount = 0;
  let totalLikes = 0;

  // 모든 프로젝트의 likes 서브컬렉션 순회
  for (const [firebaseProjectId, supabaseProjectId] of projectIdMapping) {
    try {
      const likesSnapshot = await firestore
        .collection('projects')
        .doc(firebaseProjectId)
        .collection('likes')
        .get();

      totalLikes += likesSnapshot.size;

      for (const likeDoc of likesSnapshot.docs) {
        const likeData = likeDoc.data();
        const userId = await getSupabaseUserId(likeData.user_email);

        if (!userId) {
          console.warn(`   ⚠️  사용자 없음, 건너뜀: ${likeData.user_email}`);
          continue;
        }

        const { error } = await supabase
          .from('project_likes')
          .insert({
            project_id: supabaseProjectId,
            user_id: userId,
            created_at: convertTimestamp(likeData.created_at) || new Date().toISOString(),
          });

        if (error) {
          // 중복 좋아요는 무시 (UNIQUE 제약조건)
          if (error.code === '23505') {
            continue;
          }
          throw error;
        }

        successCount++;
      }
    } catch (error) {
      console.error(`   ❌ 에러 (프로젝트 ${firebaseProjectId}):`, error.message);
      errorCount++;
    }
  }

  console.log(`   총 ${totalLikes}개의 좋아요 발견`);
  console.log(`\n   결과: 성공 ${successCount}, 에러 ${errorCount}`);
}

// ========================================
// 메인 실행 함수
// ========================================

async function main() {
  console.log('🚀 Firebase → Supabase 데이터 마이그레이션 시작\n');
  console.log('⚠️  주의: 이 스크립트는 데이터를 복사합니다. 기존 데이터는 삭제되지 않습니다.');
  console.log('⚠️  중복 실행하면 중복 데이터가 생성될 수 있습니다.\n');

  try {
    // 1. Users → Profiles
    await migrateUsers();

    // 2. Projects
    const projectIdMapping = await migrateProjects();

    // 3. Evaluations
    await migrateEvaluations(projectIdMapping);

    // 4. Inquiries
    await migrateInquiries(projectIdMapping);

    // 5. Proposals
    await migrateProposals(projectIdMapping);

    // 6. Project Likes
    await migrateProjectLikes(projectIdMapping);

    console.log('\n✅ 마이그레이션 완료!');
    console.log('\n다음 단계:');
    console.log('1. Supabase Dashboard에서 데이터 확인');
    console.log('2. 코드에서 Firebase 호출을 Supabase로 변경');
    console.log('3. 테스트 후 Firebase SDK 제거');
  } catch (error) {
    console.error('\n❌ 마이그레이션 중 치명적 에러 발생:', error);
    process.exit(1);
  }
}

// 실행
main();
