export const Colors = {
  primary: '#F97316',
  primaryLight: '#FFF7ED',
  primaryDark: '#EA580C',

  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',

  text: '#191F28',
  textSecondary: '#8B95A1',
  textTertiary: '#B0B8C1',

  bg: '#FFFFFF',
  bgSecondary: '#F4F6F8',
  bgTertiary: '#E8EBED',

  border: '#E5E8EB',
  borderLight: '#F2F4F6',

  white: '#FFFFFF',
  black: '#191F28',

  tossBlue: '#3182F6',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
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
  hero: 28,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
} as const;
