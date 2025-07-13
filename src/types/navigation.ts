import type { NavigationProp, RouteProp } from '@react-navigation/native';

// Tipos para la navegación principal
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

// Tipos para la navegación de la aplicación principal
export type AppStackParamList = {
  Home: undefined;
  Orders: undefined;
  OrderDetail: { orderId: string };
  CreateOrder: undefined;
  EditOrder: { orderId: string };
  Profile: undefined;
  Settings: undefined;
};

// Tipos para la navegación de tabs
export type TabParamList = {
  HomeTab: undefined;
  OrdersTab: undefined;
  ProfileTab: undefined;
};

// Tipos de navegación para usar en los componentes
export type RootStackNavigationProp = NavigationProp<RootStackParamList>;
export type AppStackNavigationProp = NavigationProp<AppStackParamList>;
export type TabNavigationProp = NavigationProp<TabParamList>;

// Tipos de rutas para usar en los componentes
export type RootStackRouteProp<T extends keyof RootStackParamList> = RouteProp<RootStackParamList, T>;
export type AppStackRouteProp<T extends keyof AppStackParamList> = RouteProp<AppStackParamList, T>;
export type TabRouteProp<T extends keyof TabParamList> = RouteProp<TabParamList, T>; 