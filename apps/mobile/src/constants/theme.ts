import { Ionicons } from '@expo/vector-icons';

export const Colors = {
  // Primary
  primary: '#EA580C',
  primaryLight: '#FFF7ED',
  primaryDark: '#C2410C',
  primaryGlow: 'rgba(234, 88, 12, 0.15)',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',

  // Category Colors (웹 MichelinRating 6개 카테고리와 동일)
  creativity: '#F59E0B',    // 기획력 (Amber)
  originality: '#10B981',   // 독창성 (Emerald)
  aesthetics: '#8B5CF6',    // 심미성 (Purple)
  completeness: '#3B82F6',  // 완성도 (Blue)
  marketability: '#EF4444', // 상업성 (Red)
  usability: '#EC4899',     // 편의성 (Pink)

  // Text
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  textMuted: '#CBD5E1',

  // Background
  bg: '#FFFFFF',
  bgSecondary: '#F8FAFC',
  bgTertiary: '#F1F5F9',
  bgDark: '#0F172A',

  // Border
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Base
  white: '#FFFFFF',
  black: '#0F172A',

  // Special
  tossBlue: '#3182F6',
  gold: '#D97706',
  indigo: '#6366F1',
  google: '#4285F4',
} as const;

// 6개 평가 카테고리 (웹과 동일)
export const SCORE_LABELS = ['기획력', '독창성', '심미성', '완성도', '상업성', '편의성'] as const;
export const SCORE_DESCS = [
  '논리적 구조와 의도',
  '차별화된 컨셉',
  '시각적 아름다움',
  '구현 품질과 마감',
  '시장 경쟁력',
  '사용자 경험',
] as const;
export const SCORE_KEYS = ['score_1', 'score_2', 'score_3', 'score_4', 'score_5', 'score_6'] as const;
export const SCORE_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'bulb-outline',
  'navigate-outline',
  'sparkles-outline',
  'flash-outline',
  'trending-up-outline',
  'information-circle-outline',
];
export const CATEGORY_COLORS = [
  Colors.creativity,    // 기획력
  Colors.originality,   // 독창성
  Colors.aesthetics,    // 심미성
  Colors.completeness,  // 완성도
  Colors.marketability, // 상업성
  Colors.usability,     // 편의성
] as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
} as const;

export const FontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  title: 24,
  hero: 32,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

// Typography 프리셋 (웹의 반복 패턴 대응)
export const Typography = {
  heroTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    letterSpacing: -1.5,
    fontStyle: 'italic' as const,
    textTransform: 'uppercase' as const,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900' as const,
    letterSpacing: -0.8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900' as const,
    letterSpacing: 2.5,
    textTransform: 'uppercase' as const,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '900' as const,
    letterSpacing: 3,
    textTransform: 'uppercase' as const,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900' as const,
    letterSpacing: -0.3,
  },
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  orange: {
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  bevelCta: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;
