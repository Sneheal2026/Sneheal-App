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
import { Image } from 'expo-image';
import { fetchHomeScreenImages } from '@/services/homeScreenImageService';
import type {
  HomeScreenImageType,
  HomeScreenImagesMap,
} from '@/types/homeScreenImages.types';

type HomeScreenImagesContextValue = {
  images: HomeScreenImagesMap;
  getImage: (type: HomeScreenImageType) => HomeScreenImagesMap[HomeScreenImageType];
};

const HomeScreenImagesContext = createContext<HomeScreenImagesContextValue | null>(
  null,
);

const STALE_AFTER_MS = 60 * 60 * 1000;
const ERROR_BACKOFF_MS = 15 * 60 * 1000;

export const HomeScreenImagesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [images, setImages] = useState<HomeScreenImagesMap>({});
  const lastFetchedAt = useRef(0);
  const backoffUntil = useRef(0);
  const fetchInFlight = useRef<Promise<void> | null>(null);
  const hasLoadedOnce = useRef(false);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const prefetchRemoteImages = useCallback((next: HomeScreenImagesMap) => {
    const urls = Object.values(next)
      .map((entry) => entry?.imageUrl?.trim())
      .filter((url): url is string => Boolean(url && /^https:\/\//i.test(url)));

    if (urls.length === 0) {
      return;
    }

    void Promise.all(urls.map((uri) => Image.prefetch(uri))).catch(() => {});
  }, []);

  const loadImages = useCallback(async (reason: 'mount' | 'resume') => {
    const now = Date.now();

    if (now < backoffUntil.current) {
      return;
    }

    if (reason === 'resume') {
      if (
        hasLoadedOnce.current &&
        now - lastFetchedAt.current < STALE_AFTER_MS
      ) {
        return;
      }
    }

    if (fetchInFlight.current) {
      await fetchInFlight.current;
      return;
    }

    const run = (async () => {
      try {
        const payload = await fetchHomeScreenImages();
        setImages(payload.images ?? {});
        lastFetchedAt.current = Date.now();
        backoffUntil.current = 0;
        hasLoadedOnce.current = true;
        prefetchRemoteImages(payload.images ?? {});
      } catch {
        backoffUntil.current = Date.now() + ERROR_BACKOFF_MS;
      }
    })();

    fetchInFlight.current = run;
    try {
      await run;
    } finally {
      fetchInFlight.current = null;
    }
  }, [prefetchRemoteImages]);

  useEffect(() => {
    void loadImages('mount');
  }, [loadImages]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        void loadImages('resume');
      }
      appState.current = nextState;
    });

    return () => subscription.remove();
  }, [loadImages]);

  const value = useMemo<HomeScreenImagesContextValue>(
    () => ({
      images,
      getImage: (type) => images[type],
    }),
    [images],
  );

  return (
    <HomeScreenImagesContext.Provider value={value}>
      {children}
    </HomeScreenImagesContext.Provider>
  );
};

export const useHomeScreenImages = (): HomeScreenImagesContextValue => {
  const ctx = useContext(HomeScreenImagesContext);
  if (!ctx) {
    throw new Error('useHomeScreenImages must be used within HomeScreenImagesProvider');
  }
  return ctx;
};
