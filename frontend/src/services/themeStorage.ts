import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COLOR_THEME_OPTIONS,
  DEFAULT_COLOR_THEME_ID,
  DEFAULT_CUSTOM_PRIMARY,
  type ColorThemeId,
} from '@/constants/colorThemes';

const COLOR_THEME_KEY = '@sneheal/color_theme';
const CUSTOM_PRIMARY_KEY = '@sneheal/custom_primary';

const COLOR_THEME_IDS: ColorThemeId[] = COLOR_THEME_OPTIONS.map((option) => option.id);

const isColorThemeId = (value: string | null): value is ColorThemeId =>
  value !== null && COLOR_THEME_IDS.includes(value as ColorThemeId);

const isHexColor = (value: string | null): value is string =>
  value !== null && /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(value);

export const getColorThemeId = async (): Promise<ColorThemeId> => {
  const stored = await AsyncStorage.getItem(COLOR_THEME_KEY);
  return isColorThemeId(stored) ? stored : DEFAULT_COLOR_THEME_ID;
};

export const saveColorThemeId = async (themeId: ColorThemeId): Promise<void> => {
  await AsyncStorage.setItem(COLOR_THEME_KEY, themeId);
};

export const getCustomPrimary = async (): Promise<string> => {
  const stored = await AsyncStorage.getItem(CUSTOM_PRIMARY_KEY);
  return isHexColor(stored) ? stored.toUpperCase() : DEFAULT_CUSTOM_PRIMARY;
};

export const saveCustomPrimary = async (hex: string): Promise<void> => {
  await AsyncStorage.setItem(CUSTOM_PRIMARY_KEY, hex.toUpperCase());
};
