import type { ImageSourcePropType } from 'react-native';

/** Shared placeholder shown until real product/category images are added. */
export const PRODUCT_IMAGE_PLACEHOLDER: ImageSourcePropType = require('../../assets/images/Default-medicine-image.png');

/**
 * Resolves a catalog image URL to a React Native image source.
 * Falls back to the bundled placeholder when the URL is empty/invalid.
 */
export const resolveCatalogImage = (
  imageUrl?: string | null,
): ImageSourcePropType => {
  const trimmed = typeof imageUrl === 'string' ? imageUrl.trim() : '';

  if (trimmed.length > 0 && /^https?:\/\//i.test(trimmed)) {
    return { uri: trimmed };
  }

  return PRODUCT_IMAGE_PLACEHOLDER;
};
