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

  const fetchOrderStats = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call when backend is ready
      // const response = await httpClient.get(`/orders/stats/${user.id}`);
      // setStats(response.data);
      
      // Mock data for now - simulating different stats based on user role
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const mockStats: OrderStats = {
        activeOrders: user.role === UserRole.ADMINISTRATOR ? 5 : 2,
        completedOrders: user.role === UserRole.ADMINISTRATOR ? 12 : 4,
        totalOrders: user.role === UserRole.ADMINISTRATOR ? 17 : 6,
        pendingOrders: user.role === UserRole.ADMINISTRATOR ? 3 : 1,
      };
      
      setStats(mockStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading order statistics');
      console.error('Error fetching order stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrderStats();
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
      fetchOrderStats();
    }
  }, [user, fetchOrderStats]);

  return {
    stats,
    isLoading,
    error,
    refresh,
  };
}; 