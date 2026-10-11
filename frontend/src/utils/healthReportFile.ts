const PDF_MIME = 'application/pdf';

const normalizeMime = (mimeType?: string | null): string =>
  (mimeType ?? '').trim().toLowerCase();

export const isHealthReportImage = (
  mimeType?: string | null,
  fileUrl?: string | null,
): boolean => {
  const mime = normalizeMime(mimeType);
  if (mime.startsWith('image/')) return true;
  const url = (fileUrl ?? '').toLowerCase();
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(url);
};

export const isHealthReportPdf = (
  mimeType?: string | null,
  fileUrl?: string | null,
): boolean => {
  const mime = normalizeMime(mimeType);
  if (mime === PDF_MIME || mime === 'application/x-pdf') return true;
  const url = (fileUrl ?? '').toLowerCase();
  return url.includes('.pdf') || url.includes('/raw/upload/');
};

/** MIME type safe for Android IntentLauncher (never empty). */
export const resolveHealthReportMime = (
  mimeType?: string | null,
  fileUrl?: string | null,
): string => {
  const mime = normalizeMime(mimeType);
  if (mime.startsWith('image/')) {
    return mime === 'image/jpg' ? 'image/jpeg' : mime;
  }
  if (mime === PDF_MIME || mime === 'application/x-pdf') return PDF_MIME;
  if (isHealthReportPdf(mimeType, fileUrl)) return PDF_MIME;
  if (isHealthReportImage(mimeType, fileUrl)) {
    return /\.png(\?|$)/i.test(fileUrl ?? '') ? 'image/png' : 'image/jpeg';
  }
  if (mime === 'application/octet-stream' && isHealthReportPdf(null, fileUrl)) {
    return PDF_MIME;
  }
  return mime || PDF_MIME;
};

export const resolveHealthReportFileName = (
  title: string,
  mimeType?: string | null,
  fileUrl?: string | null,
): string => {
  const base = (title || 'report').replace(/[^\w.\-]+/g, '_').replace(/\.+$/g, '') || 'report';
  const mime = resolveHealthReportMime(mimeType, fileUrl);
  if (mime.startsWith('image/')) {
    const ext = mime.includes('png') ? 'png' : 'jpg';
    return base.toLowerCase().endsWith(`.${ext}`) ? base : `${base}.${ext}`;
  }
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
};
