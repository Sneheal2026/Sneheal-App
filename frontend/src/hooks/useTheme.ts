import { useMemo } from 'react';
import { useThemeContext } from '@/context/ThemeContext';
import staticTheme from '@/styles/theme';

export const useTheme = () => {
  const { colors, gradients, colorThemeId, setColorTheme, isThemeReady } = useThemeContext();

  return useMemo(
    () => ({
      ...staticTheme,
      colors,
      gradients,
      colorThemeId,
      setColorTheme,
      isThemeReady,
    }),
    [colorThemeId, colors, gradients, isThemeReady, setColorTheme],
  );
};
