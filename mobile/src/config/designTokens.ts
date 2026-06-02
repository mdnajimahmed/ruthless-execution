import { Platform } from 'react-native';

export const COLORS = {
  teal50:  '#f0faf9',
  teal100: '#ccfbf1',
  teal200: '#99f6e4',
  teal300: '#5eead4',
  teal400: '#2dd4bf',
  teal500: '#14b8a6',
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal900: '#134e4a',
  neutral0:   '#ffffff',
  neutral100: '#f3f4f6',
  neutral200: '#e5e7eb',
  neutral400: '#9ca3af',
  neutral600: '#4b5563',
  neutral900: '#111827',
  errorDefault: '#ef4444',
  errorBg:      '#fef2f2',
  errorBorder:  '#fca5a5',
  errorText:    '#991b1b',
  successDefault: '#22c55e',
  successBg:      '#f0fdf4',
  successBorder:  '#86efac',
  successText:    '#166534',
  warningDefault: '#f59e0b',
  warningBg:      '#fffbeb',
  warningBorder:  '#fcd34d',
  warningText:    '#92400e',
} as const;

export const SPACING = {
  s1: 4,
  s2: 8,
  s3: 12,
  s4: 16,
  s5: 20,
  s6: 24,
  s8: 32,
  s10: 40,
  s12: 48,
  s16: 64,
} as const;

export const RADIUS = {
  card:    10,
  button:  8,
  input:   8,
  pill:    9999,
  tooltip: 6,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  card: {
    shadowColor: '#14b8a6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

export const TYPE = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    color: COLORS.teal900,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: COLORS.teal700,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 26,
    color: COLORS.teal900,
  },
  small: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 21,
    color: COLORS.neutral600,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    letterSpacing: 1.44,
    color: COLORS.teal600,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 17,
    color: COLORS.neutral400,
  },
  button: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.14,
  },
  mono: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
} as const;

export const QUADRANT_COLORS = {
  'do-first': {
    label: 'DO FIRST',
    border: COLORS.teal700,
    badgeText: COLORS.teal700,
    badgeBg: COLORS.teal100,
  },
  schedule: {
    label: 'SCHEDULE',
    border: COLORS.teal500,
    badgeText: COLORS.teal600,
    badgeBg: COLORS.teal50,
  },
  delegate: {
    label: 'DELEGATE',
    border: COLORS.neutral400,
    badgeText: COLORS.neutral600,
    badgeBg: COLORS.neutral100,
  },
  eliminate: {
    label: 'ELIMINATE',
    border: COLORS.errorDefault,
    badgeText: COLORS.errorText,
    badgeBg: COLORS.errorBg,
  },
} as const;

export type QuadrantKey = keyof typeof QUADRANT_COLORS;
