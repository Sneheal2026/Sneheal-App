import React from 'react';
import NoInternetScreen from '@/components/common/NoInternetScreen';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface NetworkGateProps {
  children: React.ReactNode;
}

const NetworkGate: React.FC<NetworkGateProps> = ({ children }) => {
  const { isOffline, isChecking, refresh, isRefreshing } = useNetworkStatus();

  return (
    <>
      {children}
      {!isChecking && isOffline ? (
        <NoInternetScreen onRetry={refresh} isRetrying={isRefreshing} />
      ) : null}
    </>
  );
};

export default NetworkGate;
