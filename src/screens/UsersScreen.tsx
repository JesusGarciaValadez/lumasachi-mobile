import React, {useCallback, useEffect, useMemo, useState} from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Searchbar, Chip } from 'react-native-paper';
import { UsersScreenProps } from '../types/navigation';
import { useTranslationSafe } from '../hooks/useTranslationSafe';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { errorService } from '../services/errorService';
import { fetchCompanyEmployees, EmployeeListItem } from '../services/userService';
import UserCard from '../components/users/UserCard';

const UsersScreen: React.FC<UsersScreenProps> = () => {
  const { t } = useTranslationSafe();
  const { handleError, clearError, hasError, error } = useErrorHandler();
  const [users, setUsers] = useState<EmployeeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      clearError();
      setLoading(true);
      const list = await fetchCompanyEmployees(signal);
      setUsers(list);
      errorService.logSuccess('fetchEmployees', { component: 'UsersScreen', count: list.length });
    } catch (e) {
      await errorService.logError(e as Error, { component: 'UsersScreen', operation: 'fetchEmployees' });
      handleError(e as Error);
    } finally {
      setLoading(false);
    }
  }, [clearError, handleError]);

  useEffect(() => {
    const c = new AbortController();
    load(c.signal);
    return () => c.abort();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const c = new AbortController();
      await load(c.signal);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter(u => {
      if (statusFilter === 'active' && !u.isActive) return false;
      if (statusFilter === 'inactive' && u.isActive) return false;
      if (!q) return true;
      const hay = `${u.fullName} ${u.email}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query, statusFilter]);

  const renderUserItem = useCallback(({ item }: { item: EmployeeListItem }) => (
    <UserCard item={item} />
  ), []);

  const ListHeader = () => (
    <View style={styles.header}>
      <Searchbar
        placeholder={t('users.searchPlaceholder') as string || 'Buscar por nombre o email'}
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        inputStyle={styles.searchInput}
      />
      <View style={styles.filtersRow}>
        <Chip
          selected={statusFilter === 'all'}
          onPress={() => setStatusFilter('all')}
          style={[styles.filterChip, statusFilter === 'all' && styles.filterChipSelected]}
        >
          {t('users.filters.all') as string || 'Todos'}
        </Chip>
        <Chip
          selected={statusFilter === 'active'}
          onPress={() => setStatusFilter('active')}
          style={[styles.filterChip, statusFilter === 'active' && styles.filterChipSelected]}
        >
          {t('users.filters.active') as string || 'Activos'}
        </Chip>
        <Chip
          selected={statusFilter === 'inactive'}
          onPress={() => setStatusFilter('inactive')}
          style={[styles.filterChip, statusFilter === 'inactive' && styles.filterChipSelected]}
        >
          {t('users.filters.inactive') as string || 'Inactivos'}
        </Chip>
      </View>
    </View>
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('users.noUsers') as string}</Text>
    </View>
  );

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {hasError && (
          <ErrorMessage error={error} onRetry={() => load()} onDismiss={clearError} />
        )}

        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing || loading} onRefresh={onRefresh} />}
          ListEmptyComponent={!loading ? EmptyComponent : null}
          initialNumToRender={12}
          windowSize={10}
          removeClippedSubviews
          ListHeaderComponent={ListHeader}
          contentContainerStyle={filteredUsers.length === 0 ? styles.emptyList : undefined}
        />
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  search: {
    elevation: 0,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  searchInput: {
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    backgroundColor: '#EFEFF4',
  },
  filterChipSelected: {
    backgroundColor: '#E6F0FF',
  },
  // Old styles for clickable item removed; cards are rendered by UserCard component
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default UsersScreen; 