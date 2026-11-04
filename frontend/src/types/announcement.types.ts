export type InAppAnnouncementKind = 'app_update' | 'general';

export type InAppAnnouncement = {
  id: string;
  kind: InAppAnnouncementKind;
  title: string;
  body: string;
  actionUrl: string | null;
  targetAndroidVersionCode: number | null;
  unread: boolean;
  createdAt: string;
};

export type InAppAnnouncementsResponse = {
  items: InAppAnnouncement[];
  unreadCount: number;
};
