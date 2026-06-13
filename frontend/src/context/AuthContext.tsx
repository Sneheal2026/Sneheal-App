import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { NavigationState, PartialState } from '@react-navigation/native';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
  type AuthSession,
} from '@/services/tokenStorage';
import { buildAuthInitialState } from '@/navigation/buildAuthInitialState';
import { resolveAuthRoute } from '@/navigation/resolveAuthRoute';
import { isTokenExpired } from '@/utils/jwt';
import { devLog } from '@/utils/devLogger';
import type { AuthUser, VerifyOtpResponse } from '@/types/auth';

type AuthContextValue = {
  isBootstrapping: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  initialNavState: PartialState<NavigationState> | undefined;
  signIn: (data: VerifyOtpResponse) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: AuthUser) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [initialNavState, setInitialNavState] = useState<
    PartialState<NavigationState> | undefined
  >(undefined);

  const applySession = useCallback((next: AuthSession | null) => {
    setSession(next);

    if (!next) {
      setInitialNavState(undefined);
      return;
    }

    const { route, params } = resolveAuthRoute(next.user);
    setInitialNavState(buildAuthInitialState(route, params));
    devLog('Auth', 'Resolved startup route', { route, params });
  }, []);

  const bootstrap = useCallback(async () => {
    devLog('Auth', 'Bootstrapping session...');

    try {
      const stored = await loadAuthSession();

      if (!stored) {
        devLog('Auth', 'No stored session');
        applySession(null);
        return;
      }

      if (isTokenExpired(stored.accessToken)) {
        devLog('Auth', 'Stored token expired, clearing session');
        await clearAuthSession();
        applySession(null);
        return;
      }

      devLog('Auth', 'Restored session', {
        userId: stored.user.id,
        profileCompleted: stored.user.profileCompleted,
        role: stored.user.role,
      });
      applySession(stored);
    } catch (error) {
      devLog('Auth', 'Bootstrap failed', error);
      await clearAuthSession();
      applySession(null);
    } finally {
      setIsBootstrapping(false);
    }
  }, [applySession]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signIn = useCallback(async (data: VerifyOtpResponse) => {
    await saveAuthSession(data.accessToken, data.refreshToken, data.user);
    applySession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
    devLog('Auth', 'Signed in', {
      userId: data.user.id,
      profileCompleted: data.user.profileCompleted,
    });
  }, [applySession]);

  const signOut = useCallback(async () => {
    await clearAuthSession();
    applySession(null);
    devLog('Auth', 'Signed out');
  }, [applySession]);

  const updateUser = useCallback(async (user: AuthUser) => {
    if (!session) return;

    const nextSession = { ...session, user };
    await saveAuthSession(nextSession.accessToken, nextSession.refreshToken, user);
    applySession(nextSession);
    devLog('Auth', 'User updated', {
      userId: user.id,
      profileCompleted: user.profileCompleted,
    });
  }, [applySession, session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isBootstrapping,
      isAuthenticated: Boolean(session?.accessToken && session?.user),
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      initialNavState,
      signIn,
      signOut,
      updateUser,
    }),
    [isBootstrapping, session, initialNavState, signIn, signOut, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
