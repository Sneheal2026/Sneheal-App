import type { AppLanguage } from '@/navigation/types';

/** i18next language codes used in locale files. */
export type AppLocale = 'en' | 'hi' | 'mr';

export const APP_LANGUAGE_TO_LOCALE: Record<AppLanguage, AppLocale> = {
  ENGLISH: 'en',
  HINDI: 'hi',
  MARATHI: 'mr',
};

export const LOCALE_TO_APP_LANGUAGE: Record<AppLocale, AppLanguage> = {
  en: 'ENGLISH',
  hi: 'HINDI',
  mr: 'MARATHI',
};

export const toAppLocale = (language: AppLanguage): AppLocale =>
  APP_LANGUAGE_TO_LOCALE[language];

export const toAppLanguage = (locale: string): AppLanguage =>
  LOCALE_TO_APP_LANGUAGE[locale as AppLocale] ?? 'ENGLISH';
