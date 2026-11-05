import type { ImageSourcePropType } from 'react-native';
import type { HomeScreenImageType } from '@/types/homeScreenImages.types';

export const HOME_SCREEN_IMAGE_FALLBACKS: Record<
  HomeScreenImageType,
  ImageSourcePropType
> = {
  festive_banner: require('../../assets/images/DiwaliBanner.webp'),
  home_border: require('../../assets/images/DiwaliBorder.webp'),
  header_lantern: require('../../assets/images/LanternDesign.webp'),
  header_flower: require('../../assets/images/FlowerDesignn.webp'),
};

/** Layout defaults when API omits aspect_ratio */
export const HOME_SCREEN_IMAGE_DEFAULT_ASPECT: Partial<
  Record<HomeScreenImageType, number>
> = {
  festive_banner: 2.15,
  home_border: 375 / 48,
};
