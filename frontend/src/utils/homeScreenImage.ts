import type { ImageSourcePropType } from 'react-native';
import {
  HOME_SCREEN_IMAGE_DEFAULT_ASPECT,
  HOME_SCREEN_IMAGE_FALLBACKS,
} from '@/constants/homeScreenImages';
import type {
  HomeScreenImageEntry,
  HomeScreenImageType,
} from '@/types/homeScreenImages.types';

export const resolveHomeScreenImageSource = (
  imageType: HomeScreenImageType,
  remote?: HomeScreenImageEntry | null,
): ImageSourcePropType => {
  const trimmed =
    typeof remote?.imageUrl === 'string' ? remote.imageUrl.trim() : '';

  if (trimmed.length > 0 && /^https:\/\//i.test(trimmed)) {
    return { uri: trimmed };
  }

  return HOME_SCREEN_IMAGE_FALLBACKS[imageType];
};

export const resolveHomeScreenAspectRatio = (
  imageType: HomeScreenImageType,
  remote?: HomeScreenImageEntry | null,
): number | undefined => {
  const fromApi = remote?.aspectRatio;
  if (typeof fromApi === 'number' && fromApi > 0) {
    return fromApi;
  }
  return HOME_SCREEN_IMAGE_DEFAULT_ASPECT[imageType];
};

export const resolveHomeScreenAltText = (
  imageType: HomeScreenImageType,
  remote: HomeScreenImageEntry | null | undefined,
  fallback: string,
): string => {
  const alt = remote?.altText?.trim();
  return alt && alt.length > 0 ? alt : fallback;
};
