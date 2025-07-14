import React, {useEffect, useState} from 'react';
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
import {useAuth} from '../hooks/useAuth';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading} = useAuth();
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    if (isLoading) {
      setAuthState('loading');
    } else if (isAuthenticated) {
      setAuthState('authenticated');
    } else {
      setAuthState('unauthenticated');
    }
  }, [isAuthenticated, isLoading]);

  if (authState === 'loading') {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        {authState === 'authenticated' ? (
          <>
            <Stack.Screen name="Main" component={MainNavigator} />
            <Stack.Screen
              name="OrderDetails"
              component={OrderDetailsScreen}
              options={{
                headerShown: true,
                title: 'Detalles de Orden',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="CreateOrder"
              component={CreateOrderScreen}
              options={{
                headerShown: true,
                title: 'Crear Orden',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="EditOrder"
              component={EditOrderScreen}
              options={{
                headerShown: true,
                title: 'Editar Orden',
                headerBackTitle: '',
              }}
            />
            <Stack.Screen
              name="UserManagement"
              component={UserManagementScreen}
              options={{
                headerShown: true,
                title: 'Gestión de Usuarios',
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