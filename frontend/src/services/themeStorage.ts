import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  COLOR_THEME_OPTIONS,
  DEFAULT_COLOR_THEME_ID,
  type ColorThemeId,
} from '@/constants/colorThemes';

const COLOR_THEME_KEY = '@sneheal/color_theme';

const COLOR_THEME_IDS: ColorThemeId[] = COLOR_THEME_OPTIONS.map((option) => option.id);

const isColorThemeId = (value: string | null): value is ColorThemeId =>
  value !== null && COLOR_THEME_IDS.includes(value as ColorThemeId);

export const getColorThemeId = async (): Promise<ColorThemeId> => {
  const stored = await AsyncStorage.getItem(COLOR_THEME_KEY);
  return isColorThemeId(stored) ? stored : DEFAULT_COLOR_THEME_ID;
};

export const saveColorThemeId = async (themeId: ColorThemeId): Promise<void> => {
  await AsyncStorage.setItem(COLOR_THEME_KEY, themeId);
};
