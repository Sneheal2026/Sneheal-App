const decodeJwtPayload = (token: string): { exp?: number } | null => {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = globalThis.atob?.(padded);
    if (!binary) return null;

    return JSON.parse(binary) as { exp?: number };
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 < Date.now();
};

/** True if token is expired or will expire within the buffer window. */
export const isTokenExpiringSoon = (token: string, bufferMs = 60_000): boolean => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return payload.exp * 1000 <= Date.now() + bufferMs;
};
