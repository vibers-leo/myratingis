// src/lib/getUserInfo.ts
// Auth에서 사용자 정보를 가져오는 유틸리티 (캐싱 추가)

const userCache = new Map<string, { username: string; profile_image_url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function getUserInfo(userId: string) {
  // 캐시 확인
  const cached = userCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return { username: cached.username, profile_image_url: cached.profile_image_url };
  }

  try {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    
    if (response.ok && data.user) {
      const userInfo = {
        username: data.user.nickname || data.user.email?.split('@')[0] || 'Unknown',
        profile_image_url: data.user.profile_image_url || '/globe.svg',
      };
      
      // 캐시 저장
      userCache.set(userId, { ...userInfo, timestamp: Date.now() });
      
      return userInfo;
    }
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
  }
  
  return {
    username: 'Unknown',
    profile_image_url: '/globe.svg',
  };
}

// 캐시 초기화
export function clearUserCache() {
  userCache.clear();
}
