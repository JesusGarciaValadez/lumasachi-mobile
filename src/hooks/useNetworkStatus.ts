import { useState, useEffect, useCallback } from 'react';
import { networkService, NetworkState } from '../services/networkService';

export interface UseNetworkStatusReturn {
  isOnline: boolean;
  isOffline: boolean;
  networkState: NetworkState;
  refresh: () => Promise<NetworkState>;
  waitForConnection: (timeout?: number) => Promise<boolean>;
}

export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [networkState, setNetworkState] = useState<NetworkState>(() => 
    networkService.getCurrentState()
  );

  useEffect(() => {
    // Subscribe to network changes
    const unsubscribe = networkService.addListener((state) => {
      setNetworkState(state);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const refresh = useCallback(async (): Promise<NetworkState> => {
    const state = await networkService.refresh();
    setNetworkState(state);
    return state;
  }, []);

  const waitForConnection = useCallback(
    (timeout: number = 30000): Promise<boolean> => {
      return networkService.waitForConnection(timeout);
    },
    []
  );

  return {
    isOnline: networkService.isOnline(),
    isOffline: networkService.isOffline(),
    networkState,
    refresh,
    waitForConnection,
  };
}; 