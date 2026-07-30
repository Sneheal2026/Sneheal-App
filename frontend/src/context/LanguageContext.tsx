import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { AppLanguage } from '@/navigation/types';
import { DEFAULT_APP_LANGUAGE } from '@/constants/languages';
import { getAppLanguage, saveAppLanguage } from '@/services/languageStorage';
import i18n from '@/i18n';
import { toAppLocale } from '@/i18n/localeMap';

type LanguageContextValue = {
  language: AppLanguage;
  isLanguageReady: boolean;
  setLanguage: (language: AppLanguage) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_APP_LANGUAGE);
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  useEffect(() => {
    let active = true;

    const loadLanguage = async () => {
      const stored = await getAppLanguage();
      if (!active) return;

      setLanguageState(stored);
      await i18n.changeLanguage(toAppLocale(stored));
      if (active) {
        setIsLanguageReady(true);
      }
    };

    void loadLanguage();

    return () => {
      active = false;
    };
  }, []);

  const setLanguage = useCallback(async (next: AppLanguage) => {
    setLanguageState(next);
    await saveAppLanguage(next);
    await i18n.changeLanguage(toAppLocale(next));
  }, []);

  const value = useMemo(
    () => ({
      language,
      isLanguageReady,
      setLanguage,
    }),
    [isLanguageReady, language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};
