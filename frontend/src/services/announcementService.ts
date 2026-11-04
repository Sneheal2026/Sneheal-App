import type {
  InAppAnnouncement,
  InAppAnnouncementsResponse,
} from '@/types/announcement.types';
import { authenticatedApiRequest } from './authTokenManager';
import { getAnnouncementPlatform, getNativeVersionCode } from '@/utils/appVersion';

const buildQuery = (): string => {
  const platform = getAnnouncementPlatform();
  const versionCode = getNativeVersionCode();
  return `/api/announcements?platform=${encodeURIComponent(platform)}&version_code=${versionCode}`;
};

export const fetchInAppAnnouncements = (): Promise<InAppAnnouncementsResponse> =>
  authenticatedApiRequest<InAppAnnouncementsResponse>(buildQuery());

export const markAnnouncementRead = (id: string): Promise<{ id: string; unread: boolean }> =>
  authenticatedApiRequest<{ id: string; unread: boolean }>(
    `/api/announcements/${encodeURIComponent(id)}/read`,
    { method: 'POST' },
  );

export const markAllAnnouncementsRead = (): Promise<{ marked: number }> => {
  const platform = getAnnouncementPlatform();
  const versionCode = getNativeVersionCode();
  return authenticatedApiRequest<{ marked: number }>('/api/announcements/read-all', {
    method: 'POST',
    body: { platform, version_code: versionCode },
  });
};

export type { InAppAnnouncement };
