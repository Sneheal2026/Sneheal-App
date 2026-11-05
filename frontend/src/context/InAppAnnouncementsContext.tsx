import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import type { InAppAnnouncement } from '@/types/announcement.types';
import {
  fetchInAppAnnouncements,
  markAllAnnouncementsRead,
  markAnnouncementRead,
} from '@/services/announcementService';
import { ApiError } from '@/services/apiClient';

type InAppAnnouncementsContextValue = {
  items: InAppAnnouncement[];
  unreadCount: number;
  refreshAnnouncements: () => void;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const InAppAnnouncementsContext = createContext<InAppAnnouncementsContextValue | null>(
  null,
);

/** Minimum time between automatic GET requests (same session). */
const STALE_AFTER_MS = 30 * 60 * 1000;

/** When Home tab is focused, refresh sooner so new update rows show without waiting for resume TTL. */
const HOME_FOCUS_STALE_MS = 30 * 1000;

/** After 404 / server errors, stop GET until this backoff expires. */
const ERROR_BACKOFF_MS = 6 * 60 * 60 * 1000;

/** After transient network failure. */
const NETWORK_BACKOFF_MS = 15 * 60 * 1000;

export const InAppAnnouncementsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<InAppAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastFetchedAt = useRef(0);
  const backoffUntil = useRef(0);
  const fetchInFlight = useRef<Promise<void> | null>(null);
  const hasLoadedSession = useRef(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const applyPayload = useCallback((nextItems: InAppAnnouncement[], count: number) => {
    setItems(nextItems);
    setUnreadCount(count);
  }, []);

  const resetSession = useCallback(() => {
    applyPayload([], 0);
    lastFetchedAt.current = 0;
    backoffUntil.current = 0;
    fetchInFlight.current = null;
    hasLoadedSession.current = false;
  }, [applyPayload]);

  const loadAnnouncements = useCallback(
    async (reason: 'login' | 'resume' | 'home_focus') => {
      if (!isAuthenticated) {
        resetSession();
        return;
      }

      if (reason === 'login' && hasLoadedSession.current) {
        return;
      }

      const now = Date.now();

      if (now < backoffUntil.current) {
        return;
      }

      if (reason === 'resume') {
        if (!hasLoadedSession.current) {
          return;
        }
        if (now - lastFetchedAt.current < STALE_AFTER_MS) {
          return;
        }
      }

      if (reason === 'home_focus') {
        if (!hasLoadedSession.current) {
          return;
        }
        if (now - lastFetchedAt.current < HOME_FOCUS_STALE_MS) {
          return;
        }
      }

      if (fetchInFlight.current) {
        return fetchInFlight.current;
      }

      const run = (async () => {
        try {
          const data = await fetchInAppAnnouncements();
          lastFetchedAt.current = Date.now();
          backoffUntil.current = 0;
          hasLoadedSession.current = true;
          applyPayload(data.items, data.unreadCount);
        } catch (error) {
          if (error instanceof ApiError) {
            if (error.status === 401) {
              resetSession();
              return;
            }
            if (error.status === 404) {
              backoffUntil.current = now + ERROR_BACKOFF_MS;
              hasLoadedSession.current = true;
              applyPayload([], 0);
              return;
            }
            if (error.status >= 500) {
              backoffUntil.current = now + ERROR_BACKOFF_MS;
              return;
            }
          }
          backoffUntil.current = now + NETWORK_BACKOFF_MS;
        } finally {
          fetchInFlight.current = null;
        }
      })();

      fetchInFlight.current = run;
      return run;
    },
    [applyPayload, isAuthenticated, resetSession],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      resetSession();
      return;
    }
    void loadAnnouncements('login');
  }, [isAuthenticated, loadAnnouncements, resetSession]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const subscription = AppState.addEventListener('change', (nextState) => {
      const wasBackground =
        appState.current === 'background' || appState.current === 'inactive';
      appState.current = nextState;

      if (wasBackground && nextState === 'active') {
        void loadAnnouncements('resume');
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated, loadAnnouncements]);

  const refreshAnnouncements = useCallback(() => {
    void loadAnnouncements('home_focus');
  }, [loadAnnouncements]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markAnnouncementRead(id);
    } catch {
      // Keep optimistic UI; avoid extra GET (cost + load).
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
    setUnreadCount(0);

    try {
      await markAllAnnouncementsRead();
    } catch {
      // Keep optimistic UI; avoid extra GET.
    }
  }, []);

  const value = useMemo<InAppAnnouncementsContextValue>(
    () => ({
      items,
      unreadCount,
      refreshAnnouncements,
      markRead,
      markAllRead,
    }),
    [items, unreadCount, refreshAnnouncements, markRead, markAllRead],
  );

  return (
    <InAppAnnouncementsContext.Provider value={value}>
      {children}
    </InAppAnnouncementsContext.Provider>
  );
};

export const useInAppAnnouncements = (): InAppAnnouncementsContextValue => {
  const context = useContext(InAppAnnouncementsContext);
  if (!context) {
    throw new Error('useInAppAnnouncements must be used within InAppAnnouncementsProvider');
  }
  return context;
};
