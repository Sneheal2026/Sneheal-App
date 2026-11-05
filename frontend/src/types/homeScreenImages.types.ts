export const HOME_SCREEN_IMAGE_TYPES = [
  'festive_banner',
  'home_border',
  'header_lantern',
  'header_flower',
] as const;

export type HomeScreenImageType = (typeof HOME_SCREEN_IMAGE_TYPES)[number];

export type HomeScreenImageEntry = {
  imageUrl: string;
  aspectRatio: number | null;
  altText: string;
};

export type HomeScreenImagesMap = Partial<
  Record<HomeScreenImageType, HomeScreenImageEntry>
>;

export type ApiHomeScreenImagesPayload = {
  updatedAt: string | null;
  images: HomeScreenImagesMap;
};
