import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from '@/types/auth';

const ACCESS_TOKEN_KEY = '@sneheal/accessToken';
const REFRESH_TOKEN_KEY = '@sneheal/refreshToken';
const USER_KEY = '@sneheal/user';

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

const parseStoredUser = (raw: string | null): AuthUser | null => {
  if (!raw) return null;

  try {
    const user = JSON.parse(raw) as AuthUser;
    if (!user?.id || !user?.phone) return null;
    return user;
  } catch {
    return null;
  }
};

export const saveAuthSession = async (
  accessToken: string,
  refreshToken: string,
  user: object,
): Promise<void> => {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
    [USER_KEY, JSON.stringify(user)],
  ]);
};

export const loadAuthSession = async (): Promise<AuthSession | null> => {
  const [[, accessToken], [, refreshToken], [, userRaw]] = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
  ]);

  const user = parseStoredUser(userRaw);

  if (!accessToken || !refreshToken || !user) {
    return null;
  }

  return { accessToken, refreshToken, user };
};

export const getAccessToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = async (): Promise<string | null> => {
  return AsyncStorage.getItem(USER_KEY);
};

export const clearAuthSession = async (): Promise<void> => {
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
};

