export const isTokenExpired = (token: string): boolean => {
  try {
    const segment = token.split('.')[1];
    if (!segment) return true;

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (!payload.exp) return true;
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

/** True if token is expired or will expire within the buffer window. */
export const isTokenExpiringSoon = (token: string, bufferMs = 60_000): boolean => {
  try {
    const segment = token.split('.')[1];
    if (!segment) return true;

    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded)) as { exp?: number };

    if (!payload.exp) return true;
    return payload.exp * 1000 <= Date.now() + bufferMs;
  } catch {
    return true;
  }
};
