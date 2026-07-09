import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

type ConnectivityStatus = 'checking' | 'online' | 'offline';

function resolveConnectivity(state: NetInfoState): ConnectivityStatus {
  if (state.isConnected === false) {
    return 'offline';
  }

  if (state.isConnected === true && state.isInternetReachable === false) {
    return 'offline';
  }

  if (state.isConnected === true && state.isInternetReachable === true) {
    return 'online';
  }

  return 'checking';
}

export function useNetworkStatus() {
  const [status, setStatus] = useState<ConnectivityStatus>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const applyState = useCallback((state: NetInfoState) => {
    setStatus(resolveConnectivity(state));
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const state = await NetInfo.refresh();
      applyState(state);
    } finally {
      setIsRefreshing(false);
    }
  }, [applyState]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(applyState);

    void NetInfo.fetch().then(applyState);

    const appStateSubscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (nextState === 'active') {
          void NetInfo.fetch().then(applyState);
        }
      },
    );

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [applyState]);

  return {
    isOffline: status === 'offline',
    isChecking: status === 'checking',
    isOnline: status === 'online',
    refresh,
    isRefreshing,
  };
}
