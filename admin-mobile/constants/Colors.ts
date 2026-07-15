// ─────────────────────────────────────────────────────────────────────────────
// Design Tokens — السعيدة Admin Control Panel
// ─────────────────────────────────────────────────────────────────────────────

export const palette = {
  // Brand
  navy: '#1E3A5F',
  navyDark: '#152B47',
  navyLight: '#2A4F7F',
  gold: '#C9A84C',
  goldLight: '#E8C56A',

  // Semantic
  success: '#16A34A',
  successBg: '#DCFCE7',
  warning: '#D97706',
  warningBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FEE2E2',
  info: '#2563EB',
  infoBg: '#DBEAFE',

  // Neutral
  white: '#FFFFFF',
  bgScreen: '#F4F6FA',
  bgCard: '#FFFFFF',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textOnBrand: '#FFFFFF',

  // Tab bar
  tabActive: '#1E3A5F',
  tabInactive: '#94A3B8',
};

const Colors = {
  light: {
    text: palette.textPrimary,
    background: palette.bgScreen,
    tint: palette.navy,
    tabIconDefault: palette.tabInactive,
    tabIconSelected: palette.navy,
    card: palette.bgCard,
    border: palette.border,
  },
  dark: {
    text: palette.textPrimary,
    background: palette.bgScreen,
    tint: palette.navy,
    tabIconDefault: palette.tabInactive,
    tabIconSelected: palette.navy,
    card: palette.bgCard,
    border: palette.border,
  },
};

export default Colors;
