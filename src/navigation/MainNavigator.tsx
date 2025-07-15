import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList, getNavigationConfig} from '../types/navigation';
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UsersScreen from '../screens/UsersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import {useAuth} from '../hooks/useAuth';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainNavigator: React.FC = () => {
  const {user} = useAuth();
  const {t} = useTranslationSafe();
  
  if (!user) {
    // This shouldn't happen in MainNavigator since it's only rendered for authenticated users
    throw new Error('MainNavigator rendered without authenticated user');
  }
  
  const navigationConfig = getNavigationConfig(user.role);

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
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: t('navigation.home.title') as string,
          tabBarLabel: t('navigation.home.tab') as string,
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: t('navigation.orders.title') as string,
          tabBarLabel: t('navigation.orders.tab') as string,
        }}
      />
      {navigationConfig.showUsersTab && (
        <Tab.Screen
          name="Users"
          component={UsersScreen}
          options={{
            title: t('navigation.users.title') as string,
            tabBarLabel: t('navigation.users.tab') as string,
          }}
        />
      )}
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t('navigation.profile.title') as string,
          tabBarLabel: t('navigation.profile.tab') as string,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: t('navigation.settings.title') as string,
          tabBarLabel: t('navigation.settings.tab') as string,
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigator; 