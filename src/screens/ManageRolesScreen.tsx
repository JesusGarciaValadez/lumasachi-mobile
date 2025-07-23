import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';

type ManageRolesScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ManageRoles'
>;

interface Permission {
  id: string;
  name: string;
  enabled: boolean;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  permissions: Permission[];
}

const ManageRolesScreen: React.FC = () => {
  const {t} = useTranslationSafe();
  const navigation = useNavigation<ManageRolesScreenNavigationProp>();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        clearError();
        
        setRoles([
          {
            id: '1',
            name: t('userManagement.roles.administrator') as string,
            permissions: [
              {id: '1', name: t('userManagement.roles.permissions.createUsers') as string, enabled: true},
              {id: '2', name: t('userManagement.roles.permissions.editUsers') as string, enabled: true},
              {id: '3', name: t('userManagement.roles.permissions.deleteUsers') as string, enabled: false},
              {id: '4', name: t('userManagement.roles.permissions.viewReports') as string, enabled: true},
            ],
          },
          {
            id: '2',
            name: t('userManagement.roles.employee') as string,
            permissions: [
              {id: '1', name: t('userManagement.roles.permissions.createUsers') as string, enabled: false},
              {id: '2', name: t('userManagement.roles.permissions.editUsers') as string, enabled: false},
              {id: '3', name: t('userManagement.roles.permissions.deleteUsers') as string, enabled: false},
              {id: '4', name: t('userManagement.roles.permissions.viewReports') as string, enabled: false},
            ],
          },
        ]);
        
        errorService.logSuccess('loadRoles', {
          component: 'ManageRolesScreen',
          rolesCount: 2,
        });
      } catch (error) {
        await errorService.logError(error as Error, {
          component: 'ManageRolesScreen',
          operation: 'loadRoles',
        });
        handleError(error as Error);
      }
    };
    
    loadRoles();
  }, [t, handleError, clearError]);

  const handlePermissionToggle = async (roleId: string, permissionId: string) => {
    try {
      clearError();
      
      setRoles(prevRoles =>
        prevRoles.map(role =>
          role.id === roleId
            ? {
                ...role,
                permissions: role.permissions.map(permission =>
                  permission.id === permissionId
                    ? {...permission, enabled: !permission.enabled}
                    : permission
                ),
              }
            : role
        )
      );
      
      errorService.logSuccess('permissionToggle', {
        component: 'ManageRolesScreen',
        roleId,
        permissionId,
      });
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'ManageRolesScreen',
        operation: 'permissionToggle',
        roleId,
        permissionId,
      });
      handleError(error as Error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      clearError();
      
      // TODO: Implement actual role saving logic here
      errorService.logSuccess('saveChanges', {
        component: 'ManageRolesScreen',
        rolesCount: roles.length,
      });
      
      Alert.alert(
        t('common.success') as string,
        t('userManagement.roles.permissionsUpdatedSuccess') as string,
        [
          {
            text: t('common.ok') as string,
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'ManageRolesScreen',
        operation: 'saveChanges',
      });
      handleError(error as Error);
    }
  };

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('userManagement.manageRoles') as string}</Text>
          <Text style={styles.headerSubtitle}>{t('userManagement.manageRolesDesc') as string}</Text>
        </View>

        {hasError && (
          <ErrorMessage 
            error={error}
            onRetry={clearError}
            onDismiss={clearError}
          />
        )}

        <View style={styles.content}>
          {roles.map(role => (
            <View key={role.id} style={styles.roleCard}>
              <Text style={styles.roleTitle}>{role.name}</Text>
              <View style={styles.permissionsContainer}>
                {role.permissions.map(permission => (
                  <View key={permission.id} style={styles.permissionRow}>
                    <Text style={styles.permissionName}>{permission.name}</Text>
                    <Switch
                      value={permission.enabled}
                      onValueChange={() => handlePermissionToggle(role.id, permission.id)}
                      trackColor={{false: '#767577', true: '#81b0ff'}}
                      thumbColor={permission.enabled ? '#007AFF' : '#f4f3f4'}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
            <Text style={styles.saveButtonText}>{t('common.save') as string}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  content: {
    padding: 20,
  },
  roleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  permissionsContainer: {
    marginTop: 10,
  },
  permissionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  permissionName: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#ffc107',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ManageRolesScreen; 