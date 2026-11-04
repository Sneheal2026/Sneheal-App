export function getAnnouncementSection(createdAt: string): 'today' | 'earlier' {
  const date = new Date(createdAt);
  const now = new Date();
  if (Number.isNaN(date.getTime())) {
    return 'earlier';
  }
  return date.toDateString() === now.toDateString() ? 'today' : 'earlier';
}

export function formatAnnouncementTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
