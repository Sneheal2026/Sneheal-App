import type { AppLanguage } from '@/navigation/types';

export interface LanguageOption {
  value: AppLanguage;
  label: string;
  nativeLabel: string;
  description: string;
  scriptSample: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: 'ENGLISH',
    label: 'English',
    nativeLabel: 'English',
    description: 'Default app language',
    scriptSample: 'Aa',
  },
  {
    value: 'HINDI',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    description: 'Hindi language',
    scriptSample: 'अ',
  },
  {
    value: 'MARATHI',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    description: 'Marathi language',
    scriptSample: 'अ',
  },
];

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'ENGLISH';

export const getLanguageLabel = (value: AppLanguage): string =>
  LANGUAGE_OPTIONS.find((option) => option.value === value)?.label ?? 'English';
