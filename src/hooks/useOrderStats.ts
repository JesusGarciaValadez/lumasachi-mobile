import {useState, useEffect, useCallback} from 'react';
import {useAuth} from './useAuth';
import {UserRole} from '../types';
import {errorService} from '../services/errorService';
import {retryService} from '../services/retryService';
import {networkService} from '../services/networkService';
import {useTranslationSafe} from './useTranslationSafe';

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
      
      const result = await retryService.executeWithRetry(
        async () => {
          // Check network connection
          if (networkService.isOffline()) {
            const connected = await networkService.waitForConnection(5000);
            if (!connected) {
              throw new Error('No hay conexión a internet');
            }
          }

          // TODO: Replace with actual API call when backend is ready
          // const response = await httpClient.get(`/orders/stats/${user.id}`, { signal });
          // return response.data;
          
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
          
          if (signal?.aborted) {
            throw new Error('Operation aborted');
          }

          const mockStats: OrderStats = {
            activeOrders: user.role === UserRole.ADMINISTRATOR ? 5 : 2,
            completedOrders: user.role === UserRole.ADMINISTRATOR ? 12 : 4,
            totalOrders: user.role === UserRole.ADMINISTRATOR ? 17 : 6,
            pendingOrders: user.role === UserRole.ADMINISTRATOR ? 3 : 1,
          };
          
          return mockStats;
        },
        {
          maxRetries: 3,
          baseDelay: 1000,
          retryCondition: (error) => {
            // Don't retry if operation was aborted
            return error.message !== 'Operation aborted' &&
                   (networkService.shouldTriggerOfflineHandling(error) ||
                    error.message?.includes('server') ||
                    error.message?.includes('timeout'));
          },
        }
      );

      if (result.success && result.result && !signal?.aborted) {
        setStats(result.result);
      } else if (result.error && result.error.message !== 'Operation aborted') {
        throw result.error;
      }
    } catch (err) {
      if (err instanceof Error && err.message !== 'Operation aborted') {
        const errorMessage = err.message;
        setError(errorMessage);
        
        await errorService.logError(err, {
          context: 'fetchOrderStats',
          action: 'fetch-order-stats',
          userId: user.id,
          userRole: user.role,
        });
        
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