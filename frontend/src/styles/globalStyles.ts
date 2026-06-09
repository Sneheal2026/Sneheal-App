import { StyleSheet } from 'react-native';
import theme from './theme';

const { colors, typography, spacing, borderRadius, shadows } = theme;

const globalStyles = StyleSheet.create({
  // ── Containers ──────────────────────────────────────────────
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Layout ──────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  column: {
    flexDirection: 'column',
  },
  columnCenter: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Card ────────────────────────────────────────────────────
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.md,
  },
  cardNoPadding: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },

  // ── Divider ─────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.border,
    width: '100%',
  },

  // ── Text ────────────────────────────────────────────────────
  h1: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  h2: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  h3: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  h4: {
    ...typography.h4,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  body: {
    ...typography.body,
    color: colors.textPrimary,
  },
  bodySmall: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },
  caption: {
    ...typography.caption,
    color: colors.textMuted,
  },
  label: {
    ...typography.label,
    color: colors.textPrimary,
  },

  // ── Utility ─────────────────────────────────────────────────
  fullWidth: {
    width: '100%',
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
});

export default globalStyles;
