// 온보딩 진행 상태 관리

interface OnboardingProgress {
  currentStep: number;
  completedSteps: number[];
  data: {
    nickname?: string;
    profileImage?: string;
    bio?: string;
    interests?: string[];
    fields?: string[];
  };
  startedAt: number;
  lastUpdated: number;
}

const ONBOARDING_KEY = "onboarding_progress";

/**
 * 온보딩 진행 상태 저장
 */
export function saveOnboardingProgress(progress: Partial<OnboardingProgress>) {
  if (typeof window === "undefined") return;

  const existing = getOnboardingProgress();
  const updated: OnboardingProgress = {
    currentStep: progress.currentStep ?? existing?.currentStep ?? 0,
    completedSteps: progress.completedSteps ?? existing?.completedSteps ?? [],
    data: { ...(existing?.data || {}), ...(progress.data || {}) },
    startedAt: existing?.startedAt ?? Date.now(),
    lastUpdated: Date.now(),
  };

  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn("[Onboarding] 저장 실패:", e);
  }
}

/**
 * 온보딩 진행 상태 가져오기
 */
export function getOnboardingProgress(): OnboardingProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const data = localStorage.getItem(ONBOARDING_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * 온보딩 완료
 */
export function completeOnboarding() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (e) {
    console.warn("[Onboarding] 완료 처리 실패:", e);
  }
}

/**
 * 온보딩 건너뛰기
 */
export function skipOnboarding(userId: string) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(`onboarding_skipped_${userId}`, "true");
    localStorage.removeItem(ONBOARDING_KEY);
  } catch (e) {
    console.warn("[Onboarding] 건너뛰기 처리 실패:", e);
  }
}

/**
 * 온보딩 건너뛰기 여부 확인
 */
export function isOnboardingSkipped(userId: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    return localStorage.getItem(`onboarding_skipped_${userId}`) === "true";
  } catch {
    return false;
  }
}

// 온보딩 단계 정의
export const ONBOARDING_STEPS = [
  {
    id: "welcome",
    title: "환영합니다!",
    description: "제 평가는요?에 오신 것을 환영합니다.",
  },
  {
    id: "profile",
    title: "프로필 설정",
    description: "나를 표현하는 프로필을 만들어보세요.",
  },
  {
    id: "interests",
    title: "관심사 선택",
    description: "관심 있는 분야를 선택해주세요.",
  },
  {
    id: "complete",
    title: "완료!",
    description: "시작할 준비가 되었습니다.",
  },
];
