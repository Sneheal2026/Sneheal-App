import { darken, lighten, mixWithWhite, withAlpha } from '@/utils/colorUtils';
import staticColors from './colors';

export interface BrandPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  borderFocused: string;
  info: string;
  infoLight: string;
  headerGradientStart: string;
  headerGradientMid: string;
  primaryMuted: string;
  primaryMutedMedium: string;
  primarySurface: string;
  primaryBorder: string;
}

export interface ThemeGradients {
  settingsHero: [string, string, string];
  header: [string, string, string];
}

export const buildBrandPalette = (primary: string): BrandPalette => ({
  primary,
  primaryLight: lighten(primary, 16),
  primaryDark: darken(primary, 18),
  borderFocused: primary,
  info: lighten(primary, 10),
  infoLight: mixWithWhite(primary, 0.88),
  headerGradientStart: darken(primary, 6),
  headerGradientMid: mixWithWhite(primary, 0.92),
  primaryMuted: withAlpha(primary, 0.1),
  primaryMutedMedium: withAlpha(primary, 0.14),
  primarySurface: mixWithWhite(primary, 0.96),
  primaryBorder: withAlpha(primary, 0.12),
});

export const buildThemeGradients = (primary: string): ThemeGradients => ({
  settingsHero: [primary, lighten(primary, 18), staticColors.surfaceSecondary],
  header: [darken(primary, 6), lighten(primary, 14), staticColors.headerGradientEnd],
});

export const DEFAULT_BRAND_PALETTE = buildBrandPalette(staticColors.primary);
