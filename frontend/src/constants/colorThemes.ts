export type ColorThemeId =
  | 'blue'
  | 'teal'
  | 'purple'
  | 'coral'
  | 'green'
  | 'rose'
  | 'indigo'
  | 'amber'
  | 'ocean'
  | 'magenta'
  | 'emerald'
  | 'pastel-pink'
  | 'pastel-lavender'
  | 'pastel-mint'
  | 'pastel-peach'
  | 'pastel-sky'
  | 'pastel-lemon';

export interface ColorThemeOption {
  id: ColorThemeId;
  label: string;
  primary: string;
  description: string;
  /** Swatch color shown in settings (defaults to primary). */
  swatch?: string;
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
  {
    id: 'rose',
    label: 'Rose Crimson',
    primary: '#E11D48',
    description: 'Bold rose — vibrant and caring',
  },
  {
    id: 'indigo',
    label: 'Deep Indigo',
    primary: '#4F46E5',
    description: 'Rich indigo — modern and premium',
  },
  {
    id: 'amber',
    label: 'Golden Amber',
    primary: '#D97706',
    description: 'Warm amber gold — energetic glow',
  },
  {
    id: 'ocean',
    label: 'Deep Ocean',
    primary: '#0369A1',
    description: 'Trustworthy navy blue — calm depth',
  },
  {
    id: 'magenta',
    label: 'Berry Magenta',
    primary: '#C026D3',
    description: 'Vivid berry — playful and distinctive',
  },
  {
    id: 'emerald',
    label: 'Emerald Jade',
    primary: '#059669',
    description: 'Jewel-tone emerald — lush and refined',
  },
  {
    id: 'pastel-pink',
    label: 'Pastel Pink',
    primary: '#FFC5D3',
    description: 'Soft blush pink — calm and friendly',
  },
  {
    id: 'pastel-lavender',
    label: 'Pastel Lavender',
    primary: '#E8D5FF',
    description: 'Light lilac with a gentle feel',
  },
  {
    id: 'pastel-mint',
    label: 'Pastel Mint',
    primary: '#C5F0E8',
    description: 'Cool mint green — fresh and soothing',
  },
  {
    id: 'pastel-peach',
    label: 'Pastel Peach',
    primary: '#FFD4C4',
    description: 'Warm peach tone — soft and welcoming',
  },
  {
    id: 'pastel-sky',
    label: 'Pastel Sky',
    primary: '#B8DCFF',
    description: 'Soft sky blue — airy and light',
  },
  {
    id: 'pastel-lemon',
    label: 'Pastel Lemon',
    primary: '#FFF3BF',
    description: 'Sunny lemon cream — bright and cheerful',
  },
];

export const getColorThemeOption = (id: ColorThemeId): ColorThemeOption =>
  COLOR_THEME_OPTIONS.find((option) => option.id === id) ?? COLOR_THEME_OPTIONS[0];

export const getColorThemeSwatch = (option: ColorThemeOption): string =>
  option.swatch ?? option.primary;
