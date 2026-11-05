import { apiRequest } from './apiClient';
import type { ApiHomeScreenImagesPayload } from '@/types/homeScreenImages.types';

export const fetchHomeScreenImages = async (): Promise<ApiHomeScreenImagesPayload> => {
  const data = await apiRequest<ApiHomeScreenImagesPayload>('/api/home/images');
  return {
    updatedAt: data?.updatedAt ?? null,
    images: data?.images ?? {},
  };
};
