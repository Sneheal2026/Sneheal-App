import { Platform } from 'react-native';
import type { ApiErrorResponse, ApiSuccessResponse } from '@/types/auth';
import { devLog } from '@/utils/devLogger';

const getDefaultBaseUrl = (): string => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }
  return 'http://localhost:5000';
};

export const getApiBaseUrl = (): string => {
  return process.env.EXPO_PUBLIC_API_URL ?? getDefaultBaseUrl();
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

let apiRequestCounter = 0;

const sanitizeForLog = (path: string, data: unknown): unknown => {
  if (!data || typeof data !== 'object') return data;

  const record = data as Record<string, unknown>;

  if (path.includes('verify-otp')) {
    return {
      user: record.user,
      accessToken: record.accessToken ? '[saved]' : undefined,
      refreshToken: record.refreshToken ? '[saved]' : undefined,
    };
  }

  return data;
};

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const { method = 'GET', body, token } = options;
  const url = `${baseUrl}${path}`;
  const requestId = ++apiRequestCounter;

  devLog('API', `[${requestId}] → ${method} ${path}`, body ?? undefined);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    devLog('API', `[${requestId}] ✗ NETWORK ${method} ${path}`, error);
    throw error;
  }

  let payload: ApiSuccessResponse<T> | ApiErrorResponse | null = null;

  try {
    payload = await response.json();
  } catch {
    devLog('API', `[${requestId}] ✗ INVALID JSON ${response.status} ${path}`);
    throw new ApiError(response.status, 'Invalid server response');
  }

  if (!response.ok || !payload || payload.success === false) {
    const message =
      payload && 'message' in payload ? payload.message : 'Request failed';
    devLog('API', `[${requestId}] ✗ ${response.status} ${method} ${path}`, message);
    throw new ApiError(response.status, message);
  }

  devLog('API', `[${requestId}] ← ${response.status} ${method} ${path}`, sanitizeForLog(path, payload.data));

  return payload.data;
}
