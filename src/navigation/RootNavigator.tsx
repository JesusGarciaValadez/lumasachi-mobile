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
import {useTranslationSafe} from '../hooks/useTranslationSafe';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading} = useAuth();
  const {t} = useTranslationSafe();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
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
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="CreateOrder"
              component={CreateOrderScreen}
              options={{
                headerShown: true,
                title: t('createOrder.title') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="EditOrder"
              component={EditOrderScreen}
              options={{
                headerShown: true,
                title: t('editOrder.title') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="UserManagement"
              component={UserManagementScreen}
              options={{
                headerShown: true,
                title: t('userManagement.title') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="CreateUser"
              component={CreateUserScreen}
              options={{
                headerShown: true,
                title: t('userManagement.createUser') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="ManageRoles"
              component={ManageRolesScreen}
              options={{
                headerShown: true,
                title: t('userManagement.manageRoles') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="ViewReports"
              component={ViewReportsScreen}
              options={{
                headerShown: true,
                title: t('userManagement.viewReports') as string,
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="ExportData"
              component={ExportDataScreen}
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

export default RootNavigator; 