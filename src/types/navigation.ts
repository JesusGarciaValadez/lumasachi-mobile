import {StackNavigationProp} from '@react-navigation/stack';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {CompositeNavigationProp, RouteProp} from '@react-navigation/native';

// Stack Navigator Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Splash: undefined;
  Login: undefined;
  OrderDetails: {orderId: string};
  CreateOrder: undefined;
  EditOrder: {orderId: string};
  Profile: undefined;
  UserManagement: undefined;
  Settings: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
};

// Bottom Tab Navigator Types
export type MainTabParamList = {
  Home: undefined;
  Orders: undefined;
  Profile: undefined;
  Users: undefined; // Solo para Admin/Super Admin
  Settings: undefined;
};

// Navigation Props
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;

// Composite Navigation Props
export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  StackNavigationProp<RootStackParamList>
>;

export type OrdersScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Orders'>,
  StackNavigationProp<RootStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  StackNavigationProp<RootStackParamList>
>;

// Route Props
export type OrderDetailsRouteProp = RouteProp<RootStackParamList, 'OrderDetails'>;
export type EditOrderRouteProp = RouteProp<RootStackParamList, 'EditOrder'>;

// Screen Props
export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export interface OrdersScreenProps {
  navigation: OrdersScreenNavigationProp;
}

export interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

export interface OrderDetailsScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'OrderDetails'>;
  route: OrderDetailsRouteProp;
}

export interface EditOrderScreenProps {
  navigation: StackNavigationProp<RootStackParamList, 'EditOrder'>;
  route: EditOrderRouteProp;
}

// Role-based navigation helpers
export type UserRole = 'Super Administrator' | 'Administrator' | 'Employee' | 'Customer';

export interface NavigationConfig {
  showUsersTab: boolean;
  showCreateOrder: boolean;
  showUserManagement: boolean;
  canEditAllOrders: boolean;
  canDeleteOrders: boolean;
}

export const getNavigationConfig = (role: UserRole): NavigationConfig => {
  switch (role) {
    case 'Super Administrator':
      return {
        showUsersTab: true,
        showCreateOrder: true,
        showUserManagement: true,
        canEditAllOrders: true,
        canDeleteOrders: true,
      };
    case 'Administrator':
      return {
        showUsersTab: true,
        showCreateOrder: true,
        showUserManagement: true,
        canEditAllOrders: true,
        canDeleteOrders: false,
      };
    case 'Employee':
      return {
        showUsersTab: false,
        showCreateOrder: true,
        showUserManagement: false,
        canEditAllOrders: false,
        canDeleteOrders: false,
      };
    case 'Customer':
      return {
        showUsersTab: false,
        showCreateOrder: true,
        showUserManagement: false,
        canEditAllOrders: false,
        canDeleteOrders: false,
      };
    default:
      return {
        showUsersTab: false,
        showCreateOrder: false,
        showUserManagement: false,
        canEditAllOrders: false,
        canDeleteOrders: false,
      };
  }
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
} 