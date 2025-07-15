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
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';

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
  const {t} = useTranslation();
  const navigation = useNavigation<ManageRolesScreenNavigationProp>();
  
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);

  useEffect(() => {
    setRoles([
      {
        id: '1',
        name: t('userManagement.roles.administrator'),
        permissions: [
          {id: '1', name: t('userManagement.roles.permissions.createUsers'), enabled: true},
          {id: '2', name: t('userManagement.roles.permissions.editUsers'), enabled: true},
          {id: '3', name: t('userManagement.roles.permissions.deleteUsers'), enabled: false},
          {id: '4', name: t('userManagement.roles.permissions.viewReports'), enabled: true},
        ],
      },
      {
        id: '2',
        name: t('userManagement.roles.employee'),
        permissions: [
          {id: '1', name: t('userManagement.roles.permissions.createUsers'), enabled: false},
          {id: '2', name: t('userManagement.roles.permissions.editUsers'), enabled: false},
          {id: '3', name: t('userManagement.roles.permissions.deleteUsers'), enabled: false},
          {id: '4', name: t('userManagement.roles.permissions.viewReports'), enabled: false},
        ],
      },
    ]);
  }, [t]);

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
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
  };

  const handleSaveChanges = () => {
    // TODO: Implement actual role saving logic here
    Alert.alert(
      t('common.success'),
      t('userManagement.roles.permissionsUpdatedSuccess'),
      [
        {
          text: t('common.ok'),
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('userManagement.manageRoles')}</Text>
        <Text style={styles.headerSubtitle}>{t('userManagement.manageRolesDesc')}</Text>
      </View>

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
          <Text style={styles.saveButtonText}>{t('common.save')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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