import type { RefreshSessionResponse } from '@/types/auth';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  type AuthSession,
} from './tokenStorage';
import { apiRequest, ApiError, getApiBaseUrl } from './apiClient';
import { isTokenExpiringSoon } from '@/utils/jwt';
import { devLog } from '@/utils/devLogger';

type SessionListener = (session: AuthSession | null) => void;

let refreshInFlight: Promise<string | null> | null = null;
let sessionListener: SessionListener | null = null;

export const setAuthSessionListener = (listener: SessionListener | null) => {
  sessionListener = listener;
};

const notifySessionChange = (session: AuthSession | null) => {
  sessionListener?.(session);
};

const persistSession = async (data: RefreshSessionResponse): Promise<AuthSession> => {
  const nextSession: AuthSession = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  };

  await saveAuthSession(data.accessToken, data.refreshToken, data.user);
  notifySessionChange(nextSession);
  return nextSession;
};

const clearSession = async () => {
  await clearAuthSession();
  notifySessionChange(null);
};

export const refreshAuthSession = async (): Promise<string | null> => {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const stored = await loadAuthSession();

    if (!stored?.refreshToken) {
      devLog('Auth', 'No refresh token available');
      await clearSession();
      return null;
    }

    try {
      devLog('Auth', 'Refreshing access token');
      const data = await apiRequest<RefreshSessionResponse>('/api/auth/refresh', {
        method: 'POST',
        body: { refreshToken: stored.refreshToken },
      });

      const nextSession = await persistSession(data);
      devLog('Auth', 'Access token refreshed');
      return nextSession.accessToken;
    } catch (error) {
      devLog('Auth', 'Refresh failed', error);
      await clearSession();
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
};

/**
 * Returns a valid access token, refreshing silently when needed.
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  const stored = await loadAuthSession();

  if (!stored?.accessToken || !stored.refreshToken) {
    return null;
  }

  if (!isTokenExpiringSoon(stored.accessToken)) {
    return stored.accessToken;
  }

  return refreshAuthSession();
};

/**
 * Attempt to restore session on app startup when access token expired.
 */
export const restoreSessionIfNeeded = async (): Promise<AuthSession | null> => {
  const stored = await loadAuthSession();

  if (!stored) {
    return null;
  }

  if (!isTokenExpiringSoon(stored.accessToken)) {
    return stored;
  }

  if (!stored.refreshToken) {
    await clearSession();
    return null;
  }

  const accessToken = await refreshAuthSession();
  if (!accessToken) {
    return null;
  }

  return loadAuthSession();
};

export const handleUnauthorized = async (): Promise<string | null> => {
  return refreshAuthSession();
};

type AuthenticatedRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
};

export const authenticatedApiRequest = async <T>(
  path: string,
  options: AuthenticatedRequestOptions = {},
): Promise<T> => {
  let token = await getValidAccessToken();

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  try {
    return await apiRequest<T>(path, { ...options, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      token = await handleUnauthorized();
      if (!token) {
        throw error;
      }
      return apiRequest<T>(path, { ...options, token });
    }
    throw error;
  }
};

type AuthenticatedFetchInit = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

export const authenticatedFetch = async (
  path: string,
  init: AuthenticatedFetchInit = {},
): Promise<Response> => {
  let token = await getValidAccessToken();

  if (!token) {
    throw new ApiError(401, 'Authentication required');
  }

  const url = `${getApiBaseUrl()}${path}`;
  const headers: Record<string, string> = {
    ...init.headers,
    Authorization: `Bearer ${token}`,
  };

  let response = await fetch(url, { ...init, headers });

  if (response.status === 401) {
    token = await handleUnauthorized();
    if (!token) {
      return response;
    }

    response = await fetch(url, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    });
  }

  return response;
};
