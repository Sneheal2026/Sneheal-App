const colors = {
  // Brand Colors — clear healthcare blue (not violet)
  primary: '#1A73E8',
  primaryLight: '#4A9CF5',
  primaryDark: '#1558B0',

  // Accent — teal complement for pharmacy / wellness
  secondary: '#0D9488',
  secondaryLight: '#2DD4BF',
  secondaryDark: '#0F766E',

  // Feedback
  success: '#10B981',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Background
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocused: '#1A73E8',

  // Pharmacy / Medicine Delivery
  headerGreenDark: '#0D3B2E',
  headerGreenMid: '#145A3C',
  headerGreenLight: '#1A7A52',
  accentGold: '#F5B942',
  accentPink: '#FFE0EC',
  accentTeal: '#00897B',
  accentPurple: '#5B2E91',
  cardBorder: '#E8E8E8',
  orderBtnBorder: '#D9D9D9',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
} as const;

export type Colors = typeof colors;
export default colors;
