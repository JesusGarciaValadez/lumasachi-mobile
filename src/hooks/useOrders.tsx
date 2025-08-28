import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { orderService, RawOrder } from '../services/orderService';
import { retryService } from '../services/retryService';
import { networkService } from '../services/networkService';
import { errorService } from '../services/errorService';
import { useAuth } from './useAuth';

interface OrdersContextType {
  orders: RawOrder[];
  isLoading: boolean;
  error: string | null;
  ensureLoaded: () => Promise<void>;
  refresh: () => Promise<void>;
  setOrders: React.Dispatch<React.SetStateAction<RawOrder[]>>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export const useOrders = (): OrdersContextType => {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return ctx;
};

export const OrdersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<RawOrder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef<AbortController | null>(null);

  const loadOrders = useCallback(async (controller: AbortController) => {
    const signal = controller.signal;
    const result = await retryService.executeWithRetry(
      async () => {
        if (networkService.isOffline()) {
          const connected = await networkService.waitForConnection(5000);
          if (!connected) {
            throw new Error('No hay conexión a internet');
          }
        }

        const data = await orderService.fetchOrders(signal);
        return data;
      },
      {
        maxRetries: 2,
        baseDelay: 500,
        retryCondition: (err) => err?.message !== 'Operation aborted' && networkService.shouldTriggerOfflineHandling(err),
      }
    );

    if (result.success && result.result) {
      setOrders(result.result);
      return;
    }
    if (result.error) {
      throw result.error;
    }
  }, []);

  const ensureLoaded = useCallback(async () => {
    if (!isAuthenticated) return;
    if (orders.length > 0 || isLoading) return;

    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    inFlightRef.current = controller;
    try {
      await loadOrders(controller);
    } catch (err) {
      if ((err as Error).message !== 'Operation aborted') {
        setError((err as Error).message);
        await errorService.logError(err as Error, { context: 'OrdersProvider', action: 'ensureLoaded' });
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
      inFlightRef.current = null;
    }
  }, [isAuthenticated, orders.length, isLoading, loadOrders]);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    if (inFlightRef.current) inFlightRef.current.abort();
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    inFlightRef.current = controller;
    try {
      await loadOrders(controller);
    } catch (err) {
      if ((err as Error).message !== 'Operation aborted') {
        setError((err as Error).message);
        await errorService.logError(err as Error, { context: 'OrdersProvider', action: 'refresh' });
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
      inFlightRef.current = null;
    }
  }, [isAuthenticated, loadOrders]);

  useEffect(() => {
    return () => {
      inFlightRef.current?.abort();
    };
  }, []);

  const value = useMemo<OrdersContextType>(() => ({ orders, isLoading, error, ensureLoaded, refresh, setOrders }), [orders, isLoading, error, ensureLoaded, refresh]);

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
};

export default OrdersProvider;
