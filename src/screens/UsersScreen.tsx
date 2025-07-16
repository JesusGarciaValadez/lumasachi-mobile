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
import {UsersScreenProps} from '../types/navigation';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {translateRole} from '../utils/roleTranslations';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';

const UsersScreen: React.FC<UsersScreenProps> = ({navigation}) => {
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const [users, setUsers] = useState<User[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    try {
      clearError();
      setRefreshing(true);
      
      // TODO: Implement actual data loading when backend is ready
      // loadUsers().then(setUsers).finally(() => setRefreshing(false));
      
      // Simular carga de datos - remove when backend is implemented
      setTimeout(() => {
        setRefreshing(false);
      }, 1000);
      
      await errorService.logError(null, {
        component: 'UsersScreen',
        operation: 'refreshUsers',
        success: true,
        usersCount: users.length,
      });
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'UsersScreen',
        operation: 'refreshUsers',
      });
      handleError(error as Error);
      setRefreshing(false);
    }
  };

  // TODO: Implement data loading function when backend is ready
  // const loadUsers = async () => {
  //   try {
  //     const response = await httpClient.get('/users');
  //     setUsers(response.data);
  //   } catch (error) {
  //     console.error('Error loading users:', error);
  //   }
  // };

  // TODO: Call loadUsers on component mount when backend is ready
  // useEffect(() => {
  //   loadUsers();
  // }, []);

  const handleEditUser = async (userId: string) => {
    try {
      clearError();
      navigation.navigate('UserManagement', {userId});
      
      await errorService.logError(null, {
        component: 'UsersScreen',
        operation: 'navigateToEditUser',
        success: true,
        userId,
      });
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'UsersScreen',
        operation: 'navigateToEditUser',
        userId,
      });
      handleError(error as Error);
    }
  };

  const renderUserItem = ({item}: {item: User}) => {
    const translatedRole = translateRole(item.role, (key: string) => t(key) as string);
    
    return (
      <TouchableOpacity 
        style={styles.userItem}
        accessibilityRole="button"
        accessibilityLabel={`User: ${item.firstName} ${item.lastName}, Email: ${item.email}, Role: ${translatedRole}`}
        onPress={() => handleEditUser(item.id)}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userRole}>{translatedRole}</Text>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditUser(item.id)}>
            <Text style={styles.actionButtonText}>{t('users.edit') as string}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('users.noUsers') as string}</Text>
    </View>
  );

  return (
    <ErrorBoundary>
      <View style={styles.container}>
        {hasError && (
          <ErrorMessage 
            error={error}
            onRetry={clearError}
            onDismiss={clearError}
          />
        )}
        
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
    </ErrorBoundary>
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