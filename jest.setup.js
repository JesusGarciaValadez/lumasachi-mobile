// Jest Setup for React Native project
// This file sets up mocks for native modules used in tests

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key) => {
    // Mock storage
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
  setItem: jest.fn((key, value) => Promise.resolve()),
  removeItem: jest.fn((key) => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiGet: jest.fn((keys) => Promise.resolve(keys.map(key => [key, null]))),
  multiSet: jest.fn((keyValuePairs) => Promise.resolve()),
  multiRemove: jest.fn((keys) => Promise.resolve()),
}));

// Mock React Native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock Alert
jest.mock('react-native/Libraries/Alert/Alert', () => ({
  alert: jest.fn(),
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
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
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
}));

// Global test environment setup
global.console = {
  ...console,
  // Suppress console.warn for tests
  warn: jest.fn(),
};

// Mock timers
jest.useFakeTimers();

// Setup for React Native elements
import {NativeModules} from 'react-native';
NativeModules.RNGestureHandlerModule = {
  attachGestureHandler: jest.fn(),
  createGestureHandler: jest.fn(),
  dropGestureHandler: jest.fn(),
  updateGestureHandler: jest.fn(),
};

// Mock Platform Constants
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  select: jest.fn((obj) => obj.ios || obj.default),
  constants: {
    isDisableAnimations: false,
  },
}));

// Mock NativePlatformConstantsIOS
jest.mock('react-native/Libraries/Utilities/NativePlatformConstantsIOS', () => ({
  default: {
    getConstants: jest.fn(() => ({
      isDisableAnimations: false,
    })),
  },
}));

NativeModules.PlatformConstants = {
  OS: 'ios',
  select: jest.fn(),
  getConstants: jest.fn(() => ({
    isDisableAnimations: false,
  })),
}; 