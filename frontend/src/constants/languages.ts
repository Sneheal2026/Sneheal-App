import type { AppLanguage } from '@/navigation/types';

export interface LanguageOption {
  value: AppLanguage;
  label: string;
  nativeLabel: string;
  /** i18n key under `language.*` for the option description */
  descriptionKey: 'englishDesc' | 'hindiDesc' | 'marathiDesc';
  scriptSample: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: 'ENGLISH',
    label: 'English',
    nativeLabel: 'English',
    descriptionKey: 'englishDesc',
    scriptSample: 'Aa',
  },
  {
    value: 'HINDI',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    descriptionKey: 'hindiDesc',
    scriptSample: 'अ',
  },
  {
    value: 'MARATHI',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    descriptionKey: 'marathiDesc',
    scriptSample: 'अ',
  },
];

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'ENGLISH';

export const getLanguageLabel = (value: AppLanguage): string =>
  LANGUAGE_OPTIONS.find((option) => option.value === value)?.label ?? 'English';

export const getLanguageNativeLabel = (value: AppLanguage): string =>
  LANGUAGE_OPTIONS.find((option) => option.value === value)?.nativeLabel ?? 'English';