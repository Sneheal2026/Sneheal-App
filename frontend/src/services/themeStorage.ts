import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DEFAULT_COLOR_THEME_ID,
  type ColorThemeId,
} from '@/constants/colorThemes';

const COLOR_THEME_KEY = '@sneheal/color_theme';

const isColorThemeId = (value: string | null): value is ColorThemeId =>
  value === 'blue' ||
  value === 'teal' ||
  value === 'purple' ||
  value === 'coral' ||
  value === 'green';

export const getColorThemeId = async (): Promise<ColorThemeId> => {
  const stored = await AsyncStorage.getItem(COLOR_THEME_KEY);
  return isColorThemeId(stored) ? stored : DEFAULT_COLOR_THEME_ID;
};

export const saveColorThemeId = async (themeId: ColorThemeId): Promise<void> => {
  await AsyncStorage.setItem(COLOR_THEME_KEY, themeId);
};
