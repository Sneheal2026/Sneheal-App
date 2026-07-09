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
  getColorThemeOption,
  type ColorThemeId,
} from '@/constants/colorThemes';
import {
  buildBrandPalette,
  buildThemeGradients,
  type BrandPalette,
  type ThemeGradients,
} from '@/styles/brandColors';
import staticColors from '@/styles/colors';
import { getColorThemeId, saveColorThemeId } from '@/services/themeStorage';

export type ThemeColors = Omit<typeof staticColors, keyof BrandPalette> & BrandPalette;

type ThemeContextValue = {
  colorThemeId: ColorThemeId;
  colors: ThemeColors;
  brand: BrandPalette;
  gradients: ThemeGradients;
  isThemeReady: boolean;
  setColorTheme: (themeId: ColorThemeId) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const buildThemeColors = (brand: BrandPalette): ThemeColors => ({
  ...staticColors,
  ...brand,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colorThemeId, setColorThemeId] = useState<ColorThemeId>(DEFAULT_COLOR_THEME_ID);
  const [isThemeReady, setIsThemeReady] = useState(false);

  const brand = useMemo(
    () => buildBrandPalette(getColorThemeOption(colorThemeId).primary),
    [colorThemeId],
  );

  const gradients = useMemo(() => buildThemeGradients(brand.primary), [brand.primary]);
  const colors = useMemo(() => buildThemeColors(brand), [brand]);

  useEffect(() => {
    let active = true;

    const loadTheme = async () => {
      const storedThemeId = await getColorThemeId();
      if (active) {
        setColorThemeId(storedThemeId);
        setIsThemeReady(true);
      }
    };

    void loadTheme();

    return () => {
      active = false;
    };
  }, []);

  const setColorTheme = useCallback(async (themeId: ColorThemeId) => {
    setColorThemeId(themeId);
    await saveColorThemeId(themeId);
  }, []);

  const value = useMemo(
    () => ({
      colorThemeId,
      colors,
      brand,
      gradients,
      isThemeReady,
      setColorTheme,
    }),
    [brand, colorThemeId, colors, gradients, isThemeReady, setColorTheme],
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
