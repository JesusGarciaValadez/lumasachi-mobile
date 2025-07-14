import {useState, useEffect, useCallback} from 'react';
import {useAuth} from './useAuth';
import {UserRole} from '../types';

export interface OrderStats {
  activeOrders: number;
  completedOrders: number;
  totalOrders: number;
  pendingOrders: number;
}

export const useOrderStats = () => {
  const {user} = useAuth();
  const [stats, setStats] = useState<OrderStats>({
    activeOrders: 0,
    completedOrders: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrderStats = useCallback(async (controller?: AbortController) => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const signal = controller?.signal;
    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await httpClient.get(`/orders/stats/${user.id}`, { signal });
      // setStats(response.data);
      
      // Mock data for now - simulating different stats based on user role
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (signal?.aborted) {
            reject(new Error('Operation aborted'));
          } else {
            resolve(undefined);
          }
        }, 500);
        signal?.addEventListener('abort', () => clearTimeout(timeout));
      });
      
      if (!signal?.aborted) {
        const mockStats: OrderStats = {
          activeOrders: user.role === UserRole.ADMINISTRATOR ? 5 : 2,
          completedOrders: user.role === UserRole.ADMINISTRATOR ? 12 : 4,
          totalOrders: user.role === UserRole.ADMINISTRATOR ? 17 : 6,
          pendingOrders: user.role === UserRole.ADMINISTRATOR ? 3 : 1,
        };
        setStats(mockStats);
      }
    } catch (err) {
      if (err instanceof Error && err.message !== 'Operation aborted') {
        setError(err.message);
        console.error('Error fetching order stats:', err);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    fetchOrderStats(controller);
    return () => controller.abort();
  }, [fetchOrderStats]);

  const refresh = useCallback(() => {
    if (user) {
      setStats({
        activeOrders: 0,
        completedOrders: 0,
        totalOrders: 0,
        pendingOrders: 0,
      });
      setIsLoading(true);
      setError(null);
      // Trigger re-fetch by calling fetchOrderStats
      const controller = new AbortController();
      fetchOrderStats(controller);
    }
  }, [user, fetchOrderStats]);

  return {
    stats,
    isLoading,
    error,
    refresh,
  };
}; 