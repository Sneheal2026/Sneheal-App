const homeScreenImageRepo = require('../repositories/homeScreenImage.repository');

const ALLOWED_IMAGE_HOSTS = new Set(['res.cloudinary.com']);

const isSafeImageUrl = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_IMAGE_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};

const listForHome = async () => {
  const rows = await homeScreenImageRepo.findActive();
  const images = {};
  let updatedAt = null;

  for (const row of rows) {
    const mapped = homeScreenImageRepo.mapRow(row);
    if (!isSafeImageUrl(mapped.imageUrl)) {
      continue;
    }

    const aspectRatio =
      mapped.aspectRatio != null &&
      Number.isFinite(mapped.aspectRatio) &&
      mapped.aspectRatio > 0
        ? mapped.aspectRatio
        : null;

    images[mapped.imageType] = {
      imageUrl: mapped.imageUrl,
      aspectRatio,
      altText: mapped.altText,
    };

    if (row.updated_at) {
      const rowUpdated = new Date(row.updated_at).toISOString();
      if (!updatedAt || rowUpdated > updatedAt) {
        updatedAt = rowUpdated;
      }
    }
  }

  return { updatedAt, images };
};

module.exports = { listForHome };
