import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import SplashScreen from '../screens/SplashScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import CreateOrderScreen from '../screens/CreateOrderScreen';
import EditOrderScreen from '../screens/EditOrderScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import CreateUserScreen from '../screens/CreateUserScreen';
import ManageRolesScreen from '../screens/ManageRolesScreen';
import ViewReportsScreen from '../screens/ViewReportsScreen';
import ExportDataScreen from '../screens/ExportDataScreen';
import {useAuth} from '../hooks/useAuth';
import {usePermissions} from '../hooks/usePermissions';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {PERMISSIONS} from '../services/permissionsService';
import {View, Text, StyleSheet} from 'react-native';
import {navigationRef} from './navigationRef';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Stack = createStackNavigator<RootStackParamList>();

// Componente para mostrar cuando el usuario no tiene permisos
const UnauthorizedScreen: React.FC = () => {
  const {t} = useTranslationSafe();
  
  return (
    <View style={styles.unauthorizedContainer}>
      <Icon name="security" size={64} color="#ccc" />
      <Text style={styles.unauthorizedTitle}>
        {t('common.unauthorized') as string}
      </Text>
      <Text style={styles.unauthorizedMessage}>
        {t('common.unauthorizedMessage') as string}
      </Text>
    </View>
  );
};

// HOC para proteger screens con validación de permisos usando el nuevo sistema
const withPermissionCheck = <P extends object>(
  Component: React.ComponentType<P>,
  checkPermission: (permissions: ReturnType<typeof usePermissions>) => boolean
) => {
  return (props: P) => {
    const {user} = useAuth();
    const permissions = usePermissions();
    
    if (!user) {
      return <UnauthorizedScreen />;
    }
    
    if (!checkPermission(permissions)) {
      return <UnauthorizedScreen />;
    }
    
    return <Component {...props} />;
  };
};

// Funciones de validación de permisos usando el nuevo sistema
const canCreateOrder = (permissions: ReturnType<typeof usePermissions>) => permissions.canCreateOrders;
const canManageUsers = (permissions: ReturnType<typeof usePermissions>) => permissions.hasAnyPermission([
  PERMISSIONS.USERS.CREATE,
  PERMISSIONS.USERS.READ,
  PERMISSIONS.USERS.UPDATE,
]);
const canEditAllOrders = (permissions: ReturnType<typeof usePermissions>) => permissions.canEditOrders;
const canViewReports = (permissions: ReturnType<typeof usePermissions>) => permissions.canViewReports;
const canExportData = (permissions: ReturnType<typeof usePermissions>) => permissions.canExportData;

// Aplicar protección a las screens
const ProtectedCreateOrderScreen = withPermissionCheck(CreateOrderScreen, canCreateOrder);
const ProtectedEditOrderScreen = withPermissionCheck(EditOrderScreen, canEditAllOrders);
const ProtectedUserManagementScreen = withPermissionCheck(UserManagementScreen, canManageUsers);
const ProtectedCreateUserScreen = withPermissionCheck(CreateUserScreen, canManageUsers);
const ProtectedManageRolesScreen = withPermissionCheck(ManageRolesScreen, canManageUsers);
const ProtectedViewReportsScreen = withPermissionCheck(ViewReportsScreen, canViewReports);
const ProtectedExportDataScreen = withPermissionCheck(ExportDataScreen, canExportData);

const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading} = useAuth();
  const {t} = useTranslationSafe();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="OrderDetails"
              component={OrderDetailsScreen}
              options={{
                headerShown: true,
                title: t('orders.orderDetails') as string,
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="CreateOrder"
              component={ProtectedCreateOrderScreen}
              options={{
                headerShown: true,
                title: t('createOrder.title') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="EditOrder"
              component={ProtectedEditOrderScreen}
              options={{
                headerShown: true,
                title: t('editOrder.title') as string,
                headerStyle: { backgroundColor: '#007AFF' },
                headerTintColor: '#ffffff',
                headerTitleStyle: { color: '#ffffff' },
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="UserManagement"
              component={ProtectedUserManagementScreen}
              options={{
                headerShown: true,
                title: t('userManagement.title') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="CreateUser"
              component={ProtectedCreateUserScreen}
              options={{
                headerShown: true,
                title: t('userManagement.createUser') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="ManageRoles"
              component={ProtectedManageRolesScreen}
              options={{
                headerShown: true,
                title: t('userManagement.manageRoles') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="ViewReports"
              component={ProtectedViewReportsScreen}
              options={{
                headerShown: true,
                title: t('userManagement.viewReports') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="ExportData"
              component={ProtectedExportDataScreen}
              options={{
                headerShown: true,
                title: t('userManagement.exportData') as string,
                headerBackTitle: '',
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Auth" component={AuthNavigator} />
            <Stack.Screen name="Splash" component={SplashScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  unauthorizedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  unauthorizedMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default RootNavigator; 