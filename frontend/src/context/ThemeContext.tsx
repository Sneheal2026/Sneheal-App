import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  DEFAULT_COLOR_THEME_ID,
  DEFAULT_CUSTOM_PRIMARY,
  getThemePrimary,
  type ColorThemeId,
} from '@/constants/colorThemes';
import {
  buildBrandPalette,
  buildThemeGradients,
  type BrandPalette,
  type ThemeGradients,
} from '@/styles/brandColors';
import staticColors from '@/styles/colors';
import {
  getColorThemeId,
  getCustomPrimary,
  saveColorThemeId,
  saveCustomPrimary,
} from '@/services/themeStorage';

export type ThemeColors = Omit<typeof staticColors, keyof BrandPalette> & BrandPalette;

export type SetColorThemeOptions = {
  /** When false, updates in-memory theme only (no AsyncStorage). Default true. */
  persist?: boolean;
};

type ThemeContextValue = {
  colorThemeId: ColorThemeId;
  customPrimary: string;
  colors: ThemeColors;
  brand: BrandPalette;
  gradients: ThemeGradients;
  isThemeReady: boolean;
  setColorTheme: (
    themeId: ColorThemeId,
    customHex?: string,
    options?: SetColorThemeOptions,
  ) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const buildThemeColors = (brand: BrandPalette): ThemeColors => ({
  ...staticColors,
  ...brand,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorThemeId, setColorThemeId] = useState<ColorThemeId>(DEFAULT_COLOR_THEME_ID);
  const [customPrimary, setCustomPrimary] = useState(DEFAULT_CUSTOM_PRIMARY);
  const [isThemeReady, setIsThemeReady] = useState(false);

  const brand = useMemo(
    () => buildBrandPalette(getThemePrimary(colorThemeId, customPrimary)),
    [colorThemeId, customPrimary],
  );

  const gradients = useMemo(() => buildThemeGradients(brand.primary), [brand.primary]);
  const colors = useMemo(() => buildThemeColors(brand), [brand]);

  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      const [storedThemeId, storedCustomPrimary] = await Promise.all([
        getColorThemeId(),
        getCustomPrimary(),
      ]);
      if (active) {
        setColorThemeId(storedThemeId);
        setCustomPrimary(storedCustomPrimary);
        setIsThemeReady(true);
      }
    };

    void loadTheme();

    return () => {
      active = false;
    };
  }, []);

  const setColorTheme = useCallback(
    async (
      themeId: ColorThemeId,
      customHex?: string,
      options?: SetColorThemeOptions,
    ) => {
      const shouldPersist = options?.persist !== false;

      setColorThemeId(themeId);

      if (themeId === 'custom' && customHex) {
        setCustomPrimary(customHex.toUpperCase());
      }

      if (!shouldPersist) {
        return;
      }

      await saveColorThemeId(themeId);

      if (themeId === 'custom' && customHex) {
        await saveCustomPrimary(customHex.toUpperCase());
      }
    },
    [],
  );

  const value = useMemo(
    () => ({
      colorThemeId,
      customPrimary,
      colors,
      brand,
      gradients,
      isThemeReady,
      setColorTheme,
    }),
    [brand, colorThemeId, colors, customPrimary, gradients, isThemeReady, setColorTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useThemeContext must be used within ThemeProvider');
  }

  return context;
};
