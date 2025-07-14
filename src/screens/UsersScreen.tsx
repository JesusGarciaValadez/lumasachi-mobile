import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {User} from '../types';
import {useTranslation} from 'react-i18next';

const UsersScreen: React.FC = () => {
  const {t} = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderUserItem = ({item}: {item: User}) => (
    <TouchableOpacity style={styles.userItem}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <Text style={styles.userRole}>{item.role}</Text>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionButtonText}>{t('users.edit')}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('users.noUsers')}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={users.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userItem: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
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