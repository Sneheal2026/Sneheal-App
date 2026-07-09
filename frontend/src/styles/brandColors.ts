import {
  darken,
  ensureReadablePrimary,
  isPastelColor,
  lighten,
  mixWithWhite,
  withAlpha,
} from '@/utils/colorUtils';
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

export const buildBrandPalette = (brandColor: string): BrandPalette => {
  const pastel = isPastelColor(brandColor);
  const primary = ensureReadablePrimary(brandColor);

  return {
    primary,
    primaryLight: pastel ? brandColor : lighten(brandColor, 16),
    primaryDark: darken(primary, 18),
    borderFocused: primary,
    info: pastel ? brandColor : lighten(brandColor, 10),
    infoLight: pastel ? mixWithWhite(brandColor, 0.35) : mixWithWhite(brandColor, 0.88),
    headerGradientStart: pastel ? brandColor : darken(brandColor, 6),
    headerGradientMid: pastel ? mixWithWhite(brandColor, 0.45) : mixWithWhite(brandColor, 0.92),
    primaryMuted: withAlpha(brandColor, pastel ? 0.35 : 0.1),
    primaryMutedMedium: withAlpha(brandColor, pastel ? 0.45 : 0.14),
    primarySurface: pastel ? mixWithWhite(brandColor, 0.25) : mixWithWhite(brandColor, 0.96),
    primaryBorder: withAlpha(brandColor, pastel ? 0.5 : 0.12),
  };
};

export const buildThemeGradients = (brandColor: string): ThemeGradients => {
  const pastel = isPastelColor(brandColor);

  return {
    settingsHero: pastel
      ? [brandColor, mixWithWhite(brandColor, 0.2), staticColors.surfaceSecondary]
      : [brandColor, lighten(brandColor, 18), staticColors.surfaceSecondary],
    header: pastel
      ? [brandColor, mixWithWhite(brandColor, 0.35), staticColors.headerGradientEnd]
      : [darken(brandColor, 6), lighten(brandColor, 14), staticColors.headerGradientEnd],
  };
};

export const DEFAULT_BRAND_PALETTE = buildBrandPalette(staticColors.primary);
