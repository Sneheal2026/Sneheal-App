export const APP_SHARE_URL = 'https://sneheal.com/app';

export const APP_QR_IMAGE_URI = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=14&data=${encodeURIComponent(APP_SHARE_URL)}`;

export const APP_SHARE_MESSAGE = `Hey! I've been using Sneheal for quick medicine delivery & prescription scans. Check it out: ${APP_SHARE_URL}`;

export const WHATSAPP_SHARE_URL = `whatsapp://send?text=${encodeURIComponent(APP_SHARE_MESSAGE)}`;

export const WHATSAPP_WEB_SHARE_URL = `https://wa.me/?text=${encodeURIComponent(APP_SHARE_MESSAGE)}`;
