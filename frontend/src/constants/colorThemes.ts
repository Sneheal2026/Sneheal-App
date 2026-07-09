export type ColorThemeId = 'blue' | 'teal' | 'purple' | 'coral' | 'green';

export interface ColorThemeOption {
  id: ColorThemeId;
  label: string;
  primary: string;
  description: string;
}

export const DEFAULT_COLOR_THEME_ID: ColorThemeId = 'blue';

export const COLOR_THEME_OPTIONS: ColorThemeOption[] = [
  {
    id: 'blue',
    label: 'Classic Blue',
    primary: '#1A73E8',
    description: 'Sneheal default healthcare blue',
  },
  {
    id: 'teal',
    label: 'Wellness Teal',
    primary: '#0D9488',
    description: 'Fresh pharmacy teal tone',
  },
  {
    id: 'purple',
    label: 'Royal Purple',
    primary: '#7C3AED',
    description: 'Premium violet accent',
  },
  {
    id: 'coral',
    label: 'Warm Coral',
    primary: '#EA580C',
    description: 'Energetic warm orange',
  },
  {
    id: 'green',
    label: 'Fresh Green',
    primary: '#16A34A',
    description: 'Natural health green',
  },
];

export const getColorThemeOption = (id: ColorThemeId): ColorThemeOption =>
  COLOR_THEME_OPTIONS.find((option) => option.id === id) ?? COLOR_THEME_OPTIONS[0];
