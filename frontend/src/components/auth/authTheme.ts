import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/** Layout constants — colors come from `@/styles/theme` */
export const AUTH_HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.4);
/** How far the white form sheet overlaps the hero (closes gap under illustration) */
export const AUTH_CARD_OVERLAP = 42;
export const AUTH_CARD_RADIUS = 28;
export const AUTH_HORIZONTAL_PADDING = 24;

/** Max height for bottom illustration as a ratio of hero height */
export const AUTH_HERO_ILLUSTRATION_RATIO = 0.52;

export const AUTH_SCREEN_WIDTH = SCREEN_WIDTH;

/** Tagline shown below the logo */
export const AUTH_HERO_TAGLINE = 'Healthcare Delivered with Trust and Care';

export const AUTH_HERO_IMAGES = {
  logo: require('../../../assets/images/Sneheal-Logoo.png'),
  illustration: require('../../../assets/images/Sneheal-Illustration.png'),
} as const;
