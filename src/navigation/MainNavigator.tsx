import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UsersScreen from '../screens/UsersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import {useAuth} from '../hooks/useAuth';
import {usePermissions} from '../hooks/usePermissions';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {PERMISSIONS} from '../services/permissionsService';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {View, Text, StyleSheet} from 'react-native';

const Tab = createBottomTabNavigator<MainTabParamList>();

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

const MainNavigator: React.FC = () => {
  const {user} = useAuth();
  const permissions = usePermissions();
  const {t} = useTranslationSafe();
  
  if (!user) {
    // Este caso no debería ocurrir ya que MainNavigator solo se renderiza para usuarios autenticados
    throw new Error('MainNavigator rendered without authenticated user');
  }
  
  // Función para validar si el usuario puede acceder a una screen usando el nuevo sistema
  const canAccessScreen = (screenName: keyof MainTabParamList): boolean => {
    switch (screenName) {
      case 'Home':
        return true; // Todos los usuarios pueden acceder a Home
      case 'Orders':
        return true; // Todos los usuarios pueden ver órdenes (filtradas por rol)
      case 'Users':
        return permissions.hasPermission(PERMISSIONS.USERS.READ);
      case 'Profile':
        return true; // Todos los usuarios pueden acceder a su perfil
      case 'Settings':
        return true; // Todos los usuarios pueden acceder a configuración
      default:
        return false;
    }
  };

  // Función para obtener el componente correcto basado en permisos
  const getScreenComponent = (screenName: keyof MainTabParamList) => {
    if (!canAccessScreen(screenName)) {
      return UnauthorizedScreen;
    }
    
    switch (screenName) {
      case 'Home':
        return HomeScreen;
      case 'Orders':
        return OrdersScreen;
      case 'Users':
        return UsersScreen;
      case 'Profile':
        return ProfileScreen;
      case 'Settings':
        return SettingsScreen;
      default:
        return UnauthorizedScreen;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({color, size}) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Orders':
              iconName = 'assignment';
              break;
            case 'Users':
              iconName = 'people';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Settings':
              iconName = 'settings';
              break;
            default:
              iconName = 'circle';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: '#007AFF',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        // Ocultar el tab si el usuario no tiene permisos
        tabBarButton: canAccessScreen(route.name) ? undefined : () => null,
      })}>
      
      {/* Home - Todos los usuarios */}
      <Tab.Screen
        name="Home"
        component={getScreenComponent('Home')}
        options={{
          title: t('navigation.home.title') as string,
          tabBarLabel: t('navigation.home.tab') as string,
        }}
      />
      
      {/* Orders - Todos los usuarios (filtradas por rol) */}
      <Tab.Screen
        name="Orders"
        component={getScreenComponent('Orders')}
        options={{
          title: t('navigation.orders.title') as string,
          tabBarLabel: t('navigation.orders.tab') as string,
        }}
      />
      
      {/* Users - Solo Admin y Super Admin */}
      {permissions.hasPermission(PERMISSIONS.USERS.READ) && (
        <Tab.Screen
          name="Users"
          component={getScreenComponent('Users')}
          options={{
            title: t('navigation.users.title') as string,
            tabBarLabel: t('navigation.users.tab') as string,
          }}
        />
      )}
      
      {/* Profile - Todos los usuarios */}
      <Tab.Screen
        name="Profile"
        component={getScreenComponent('Profile')}
        options={{
          title: t('navigation.profile.title') as string,
          tabBarLabel: t('navigation.profile.tab') as string,
        }}
      />
      
      {/* Settings - Todos los usuarios */}
      <Tab.Screen
        name="Settings"
        component={getScreenComponent('Settings')}
        options={{
          title: t('navigation.settings.title') as string,
          tabBarLabel: t('navigation.settings.tab') as string,
        }}
      />
    </Tab.Navigator>
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

export default MainNavigator; 