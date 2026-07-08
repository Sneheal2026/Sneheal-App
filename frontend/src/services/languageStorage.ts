import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppLanguage } from '@/navigation/types';
import { DEFAULT_APP_LANGUAGE } from '@/constants/languages';

const LANGUAGE_KEY = '@sneheal/app_language';

const isAppLanguage = (value: string | null): value is AppLanguage =>
  value === 'ENGLISH' || value === 'HINDI' || value === 'MARATHI';

export const getAppLanguage = async (): Promise<AppLanguage> => {
  const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
  return isAppLanguage(stored) ? stored : DEFAULT_APP_LANGUAGE;
};

export const saveAppLanguage = async (language: AppLanguage): Promise<void> => {
  await AsyncStorage.setItem(LANGUAGE_KEY, language);
};
