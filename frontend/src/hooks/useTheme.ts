import { useMemo } from 'react';
import { useThemeContext } from '@/context/ThemeContext';
import staticTheme from '@/styles/theme';

export const useTheme = () => {
  const {
    colors,
    gradients,
    colorThemeId,
    customPrimary,
    setColorTheme,
    isThemeReady,
  } = useThemeContext();

  return useMemo(
    () => ({
      ...staticTheme,
      colors,
      gradients,
      colorThemeId,
      customPrimary,
      setColorTheme,
      isThemeReady,
    }),
    [colorThemeId, colors, customPrimary, gradients, isThemeReady, setColorTheme],
  );
};
