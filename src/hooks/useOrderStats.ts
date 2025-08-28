import {useState, useEffect, useCallback} from 'react';
import {useAuth} from './useAuth';
// import {useTranslationSafe} from './useTranslationSafe';
import { useOrders } from './useOrders';

export interface OrderStats {
  activeOrders: number;
  completedOrders: number;
  totalOrders: number;
  pendingOrders: number;
}

export const useOrderStats = () => {
  const { user } = useAuth();
  const { orders, isLoading, error } = useOrders();
  const [stats, setStats] = useState<OrderStats>({
    activeOrders: 0,
    completedOrders: 0,
    totalOrders: 0,
    pendingOrders: 0,
  });

  const compute = useCallback(() => {
    const total = orders.length;
    const active = orders.filter(o => o.status === 'Open' || o.status === 'In Progress').length;
    const completed = orders.filter(o => o.status === 'Delivered' || o.status === 'Paid').length;
    const pending = orders.filter(o => o.status === 'Ready for delivery' || o.status === 'Not paid').length;
    setStats({ activeOrders: active, completedOrders: completed, totalOrders: total, pendingOrders: pending });
  }, [orders]);

  useEffect(() => {
    compute();
  }, [compute]);

  const refresh = useCallback(() => {
    // Stats are derived; no-op here. Could trigger store refresh via a dedicated hook if needed.
    compute();
  }, [compute]);

  return { stats, isLoading: user ? isLoading : false, error, refresh };
};