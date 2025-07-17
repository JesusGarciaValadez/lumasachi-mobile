// Jest Setup for React Native project
// This file sets up mocks for native modules used in tests

// Load navigation mocks first (before any imports)
require('./__tests__/setup/navigationMocks');

// Setup @testing-library/react-native matchers (after React Native mocks)
// import '@testing-library/jest-native/extend-expect';

// Mock React Native Platform first (before anything else)
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
    select: (objs) => objs.ios || objs.default,
  },
  Alert: {
    alert: jest.fn(),
  },
  NativeModules: {},
  NativeEventEmitter: jest.fn(),
  Dimensions: {
    get: jest.fn(() => ({ width: 375, height: 812 })),
  },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
    absoluteFillObject: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    },
  },
  View: 'View',
  Text: 'Text',
  TouchableOpacity: 'TouchableOpacity',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Image: 'Image',
  TextInput: 'TextInput',
  ActivityIndicator: 'ActivityIndicator',
  StatusBar: 'StatusBar',
  Modal: 'Modal',
  SafeAreaView: 'SafeAreaView',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  requireNativeComponent: jest.fn(),
  DeviceEventEmitter: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
  },
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key) => {
    const storage = {
      'userToken': 'mock-token',
      'user': JSON.stringify({
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        role: 'EMPLOYEE',
        isActive: true,
        languagePreference: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    };
    return Promise.resolve(storage[key] || null);
  }),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map(key => [key, null]))),
  multiSet: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mocked/documents',
  writeFile: jest.fn(() => Promise.resolve()),
  readFile: jest.fn(() => Promise.resolve('')),
  exists: jest.fn(() => Promise.resolve(true)),
  mkdir: jest.fn(() => Promise.resolve()),
  unlink: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');
jest.mock('react-native-vector-icons/Ionicons', () => 'Ionicons');
jest.mock('react-native-vector-icons/FontAwesome', () => 'FontAwesome');

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }) => children,
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({ params: {} }),
  useFocusEffect: jest.fn(),
  useTheme: () => ({ dark: false, colors: {} }),
}));

// Mock @react-navigation/stack
jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
  initReactI18next: {
    type: '3rdParty',
    init: jest.fn(),
  },
}));

// Mock react-native-document-picker
jest.mock('react-native-document-picker', () => ({
  pick: jest.fn(() => Promise.resolve([])),
  isCancel: jest.fn(() => false),
  types: {
    allFiles: 'public.data',
    images: 'public.image',
    pdf: 'com.adobe.pdf',
  },
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  useNetInfo: () => ({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  }),
  addEventListener: jest.fn(),
  fetch: jest.fn(() => Promise.resolve({
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi',
  })),
}));

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  PaperProvider: ({ children }) => children,
  useTheme: () => ({
    dark: false,
    roundness: 4,
    colors: {},
    fonts: {},
    animation: {},
  }),
  Button: 'Button',
  Text: 'Text',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const inset = { top: 0, right: 0, bottom: 0, left: 0 };
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaConsumer: ({ children }) => children(inset),
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => inset,
    initialWindowMetrics: {
      insets: inset,
      frame: { x: 0, y: 0, width: 375, height: 812 },
    },
  };
});

// Mock TranslationProvider
jest.mock('./src/i18n/TranslationProvider', () => ({
  __esModule: true,
  TranslationProvider: ({ children }) => children,
  useTranslationContext: () => ({
    isReady: true,
    currentLanguage: 'es',
  }),
}));

// Mock PermissionsService with complete implementation
jest.mock('./src/services/permissionsService', () => ({
  __esModule: true,
  PERMISSIONS: {
    USERS: {
      CREATE: 'users.create',
      READ: 'users.read',
      UPDATE: 'users.update',
      DELETE: 'users.delete',
    },
    SYSTEM: {
      SETTINGS: 'system.settings',
      LOGS: 'system.logs',
    },
    ORDERS: {
      CREATE: 'orders.create',
      READ: 'orders.read',
      UPDATE: 'orders.update',
      DELETE: 'orders.delete',
      ASSIGN: 'orders.assign',
      STATUS_CHANGE: 'orders.status_change',
    },
    REPORTS: {
      VIEW: 'reports.view',
      EXPORT: 'reports.export',
    },
  },
  PermissionsService: {
    getPermissionsForRole: jest.fn((role) => {
      // Mock implementation that returns appropriate permissions based on role
      const mockPermissions = {
        SUPER_ADMINISTRATOR: [
          'users.create', 'users.read', 'users.update', 'users.delete',
          'orders.create', 'orders.read', 'orders.update', 'orders.delete', 
          'orders.assign', 'orders.status_change',
          'reports.view', 'reports.export',
          'system.settings', 'system.logs'
        ],
        ADMINISTRATOR: [
          'users.create', 'users.read', 'users.update',
          'orders.create', 'orders.read', 'orders.update', 
          'orders.assign', 'orders.status_change',
          'reports.view', 'reports.export'
        ],
        EMPLOYEE: [
          'orders.create', 'orders.read', 'orders.update', 'orders.status_change'
        ],
        CUSTOMER: ['orders.read']
      };
      return mockPermissions[role] || [];
    }),
    hasPermission: jest.fn((role, permission) => {
      const permissions = {
        SUPER_ADMINISTRATOR: [
          'users.create', 'users.read', 'users.update', 'users.delete',
          'orders.create', 'orders.read', 'orders.update', 'orders.delete', 
          'orders.assign', 'orders.status_change',
          'reports.view', 'reports.export',
          'system.settings', 'system.logs'
        ],
        ADMINISTRATOR: [
          'users.create', 'users.read', 'users.update',
          'orders.create', 'orders.read', 'orders.update', 
          'orders.assign', 'orders.status_change',
          'reports.view', 'reports.export'
        ],
        EMPLOYEE: [
          'orders.create', 'orders.read', 'orders.update', 'orders.status_change'
        ],
        CUSTOMER: ['orders.read']
      };
      return (permissions[role] || []).includes(permission);
    }),
    hasAnyPermission: jest.fn((role, permissions) => {
      const rolePerms = {
        SUPER_ADMINISTRATOR: [
          'users.create', 'users.read', 'users.update', 'users.delete',
          'orders.create', 'orders.read', 'orders.update', 'orders.delete', 
          'orders.assign', 'orders.status_change',
          'reports.view', 'reports.export',
          'system.settings', 'system.logs'
        ],
        ADMINISTRATOR: [
          'users.create', 'users.read', 'users.update',
          'orders.create', 'orders.read', 'orders.update', 
          'orders.assign', 'orders.status_change',
          'reports.view', 'reports.export'
        ],
        EMPLOYEE: [
          'orders.create', 'orders.read', 'orders.update', 'orders.status_change'
        ],
        CUSTOMER: ['orders.read']
      };
      const userPerms = rolePerms[role] || [];
      return permissions.some(p => userPerms.includes(p));
    }),
    hasAllPermissions: jest.fn((role, permissions) => {
      const rolePerms = {
        SUPER_ADMINISTRATOR: [
          'users.create', 'users.read', 'users.update', 'users.delete',
          'orders.create', 'orders.read', 'orders.update', 'orders.delete', 
          'orders.assign', 'orders.status_change',
          'reports.view', 'reports.export',
          'system.settings', 'system.logs'
        ],
        ADMINISTRATOR: [
          'users.create', 'users.read', 'users.update',
          'orders.create', 'orders.read', 'orders.update', 
          'orders.assign', 'orders.status_change',
          'reports.view', 'reports.export'
        ],
        EMPLOYEE: [
          'orders.create', 'orders.read', 'orders.update', 'orders.status_change'
        ],
        CUSTOMER: ['orders.read']
      };
      const userPerms = rolePerms[role] || [];
      return permissions.every(p => userPerms.includes(p));
    }),
    getPermissionMetadata: jest.fn(() => ({})),
  },
}));

// Mock constants/index.ts for PERMISSIONS
jest.mock('./src/constants/index.ts', () => ({
  __esModule: true,
  PERMISSIONS: {
    USERS: {
      CREATE: 'users.create',
      READ: 'users.read',
      UPDATE: 'users.update',
      DELETE: 'users.delete',
    },
    SYSTEM: {
      SETTINGS: 'system.settings',
      LOGS: 'system.logs',
    },
    ORDERS: {
      CREATE: 'orders.create',
      READ: 'orders.read',
      UPDATE: 'orders.update',
      DELETE: 'orders.delete',
      ASSIGN: 'orders.assign',
      STATUS_CHANGE: 'orders.status_change',
    },
    REPORTS: {
      VIEW: 'reports.view',
      EXPORT: 'reports.export',
    },
  },
  API_BASE_URL: 'http://localhost:8000/api',
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    THEME: 'theme',
    LANGUAGE: 'language',
  },
  ORDER_STATUSES: {
    OPEN: 'Open',
    IN_PROGRESS: 'In Progress',
    READY_FOR_DELIVERY: 'Ready for delivery',
    DELIVERED: 'Delivered',
    PAID: 'Paid',
    RETURNED: 'Returned',
    NOT_PAID: 'Not paid',
    CANCELLED: 'Cancelled',
  },
}));


// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(() => ({
    defaultOptions: {},
    setDefaultOptions: jest.fn(),
    getQueryCache: jest.fn(),
    getMutationCache: jest.fn(),
    getDefaultOptions: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
  })),
  QueryClientProvider: ({ children }) => children,
  useQuery: jest.fn(() => ({
    data: undefined,
    error: null,
    isError: false,
    isLoading: false,
    isSuccess: true,
    status: 'success',
    refetch: jest.fn(),
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    mutateAsync: jest.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
    data: undefined,
    error: null,
    reset: jest.fn(),
  })),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    setQueryData: jest.fn(),
    getQueryData: jest.fn(),
  })),
}));

// Global test environment setup
global.console = {
  ...console,
  warn: jest.fn(),
};

// Mock useOrderStats hook
jest.mock('./src/hooks/useOrderStats', () => ({
  useOrderStats: () => ({
    stats: {
      activeOrders: 5,
      completedOrders: 10,
      totalOrders: 15,
      pendingOrders: 3,
    },
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

// Mock useNetworkStatus hook
jest.mock('./src/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isConnected: true,
    isInternetReachable: true,
    isOffline: false,
  }),
}));

// Mock PermissionGuard components
jest.mock('./src/components/PermissionGuard', () => ({
  RequirePermission: ({ children, hideIfUnauthorized }) => {
    // Simple mock that always shows children for testing
    return hideIfUnauthorized ? children : children;
  },
  RequireAdmin: ({ children, hideIfUnauthorized }) => {
    // Simple mock that always shows children for testing
    return hideIfUnauthorized ? children : children;
  },
}));

// Mock ErrorBoundary component
jest.mock('./src/components/ErrorBoundary', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

// Mock ErrorMessage component
jest.mock('./src/components/ErrorMessage', () => ({
  __esModule: true,
  default: ({ message }) => `Error: ${message}`,
}));

// Mock OfflineIndicator component
jest.mock('./src/components/OfflineIndicator', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock roleTranslations utility
jest.mock('./src/utils/roleTranslations', () => ({
  translateRole: (role, t) => role,
}));

// Mock useTranslationSafe hook
jest.mock('./src/hooks/useTranslationSafe', () => ({
  useTranslationSafe: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en',
    },
  }),
}));

// Mock useErrorHandler hook
jest.mock('./src/hooks/useErrorHandler', () => ({
  useErrorHandler: () => ({
    handleError: jest.fn(),
    clearError: jest.fn(),
    error: null,
  }),
}));

// Mock timers
jest.useFakeTimers();
