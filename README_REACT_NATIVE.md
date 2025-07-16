# React Native Development Guide - Lumasachi Control

This document provides React Native specific information for the Lumasachi Control application.

## 📋 Table of Contents

- [Environment Setup](#environment-setup)
- [Project Architecture](#project-architecture)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Strategy](#testing-strategy)
- [Performance Optimization](#performance-optimization)
- [Troubleshooting](#troubleshooting)

## 🔧 Environment Setup

### Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 or **Yarn**: >= 1.22.0
- **React Native CLI**: Latest version
- **Watchman**: For file watching (macOS)

### iOS Development

- **Xcode**: 12.0 or later
- **iOS Simulator**: iOS 11.0 or later
- **CocoaPods**: Latest version

```bash
# Install CocoaPods
sudo gem install cocoapods

# Install iOS dependencies
cd ios
pod install
cd ..
```

### Android Development

- **Android Studio**: 4.1 or later
- **Android SDK**: API level 21 or higher
- **Java Development Kit**: JDK 11 or higher

```bash
# Set environment variables (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

## 🏗️ Project Architecture

### Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components
│   ├── forms/           # Form-specific components
│   └── index.ts         # Component exports
├── screens/             # Screen components
├── navigation/          # Navigation configuration
│   ├── AuthNavigator.tsx
│   ├── MainNavigator.tsx
│   └── RootNavigator.tsx
├── services/            # API services and business logic
│   ├── apiPermissionsService.ts
│   ├── permissionsService.ts
│   ├── fileService.ts
│   └── exportService.ts
├── hooks/               # Custom React hooks
│   ├── useAuth.tsx
│   ├── usePermissions.ts
│   └── useFileUpload.ts
├── types/               # TypeScript type definitions
│   ├── index.ts
│   └── navigation.ts
├── utils/               # Utility functions
│   ├── httpClient.ts
│   └── validation.ts
├── constants/           # Application constants
├── i18n/               # Internationalization
│   ├── locales/
│   └── index.ts
└── assets/             # Static assets
```

### Key Patterns

#### 1. Component Architecture

```typescript
// Component structure example
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';

interface ComponentProps {
  title: string;
  onPress: () => void;
}

const Component: React.FC<ComponentProps> = ({ title, onPress }) => {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
      <Button onPress={onPress}>Action</Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
});

export default Component;
```

#### 2. Custom Hooks Pattern

```typescript
// Custom hook example
import { useState, useEffect } from 'react';

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const useApi = <T>(url: string): UseApiResult<T> => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // API call logic
  }, [url]);

  return { data, loading, error };
};

export default useApi;
```

#### 3. Service Layer Pattern

```typescript
// Service layer example
class ApiService {
  private baseUrl = 'https://api.example.com';

  async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}

export default new ApiService();
```

## 🚀 Development Workflow

### Starting Development

1. **Start Metro bundler**:
```bash
npm start
```

2. **Run on iOS**:
```bash
npm run ios
```

3. **Run on Android**:
```bash
npm run android
```

### Debug Mode

- **iOS**: Cmd + D in simulator
- **Android**: Cmd + M in emulator
- **Physical device**: Shake device

### Hot Reloading

- Enabled by default in development
- Automatically reloads on file changes
- Preserves component state

### Development Tools

- **React Native Debugger**: Chrome DevTools for React Native
- **Flipper**: Platform for debugging mobile apps
- **React Native Log**: Real-time logging

## 📏 Code Standards

### TypeScript Guidelines

```typescript
// Use interfaces for props
interface ScreenProps {
  navigation: NavigationProp<any>;
  route: RouteProp<any>;
}

// Use type unions for constants
type OrderStatus = 'pending' | 'approved' | 'rejected';

// Use generics for reusable components
interface ListItemProps<T> {
  item: T;
  onPress: (item: T) => void;
}
```

### Component Guidelines

```typescript
// Functional components with React.FC
const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
  // Use hooks at the top
  const [state, setState] = useState<Type>(initialValue);
  
  // Use useCallback for functions
  const handlePress = useCallback(() => {
    // Handle press
  }, [dependencies]);

  // Use useMemo for expensive calculations
  const computedValue = useMemo(() => {
    return expensiveCalculation(data);
  }, [data]);

  return (
    <View>
      {/* Component JSX */}
    </View>
  );
};
```

### Styling Guidelines

```typescript
// Use StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});

// Use consistent spacing
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};
```

### Error Handling

```typescript
// Consistent error handling
const handleApiCall = async () => {
  try {
    const result = await apiService.getData();
    setData(result);
  } catch (error) {
    console.error('API Error:', error);
    setError(error instanceof Error ? error.message : 'Unknown error');
  }
};
```

## 🧪 Testing Strategy

### Test Structure

```
__tests__/
├── components/          # Component tests
├── hooks/              # Hook tests
├── services/           # Service tests
├── navigation/         # Navigation tests
└── utils/             # Utility tests
```

### Component Testing

```typescript
// Component test example
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <MyComponent title="Test" onPress={() => {}} />
    );
    expect(getByText('Test')).toBeTruthy();
  });

  it('calls onPress when button is pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <MyComponent title="Test" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Action'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

### Hook Testing

```typescript
// Hook test example
import { renderHook, act } from '@testing-library/react-hooks';
import useCounter from '../useCounter';

describe('useCounter', () => {
  it('should increment counter', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- MyComponent.test.tsx
```

## ⚡ Performance Optimization

### Component Optimization

```typescript
// Use React.memo for components
const MyComponent = React.memo<Props>(({ data }) => {
  return <View>{/* Component content */}</View>;
});

// Use useCallback for functions
const handlePress = useCallback(() => {
  // Handle press
}, [dependencies]);

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => processItem(item));
}, [data]);
```

### List Performance

```typescript
// Use FlatList for large lists
<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={item => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
/>
```

### Image Optimization

```typescript
// Use optimized images
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
  cache="force-cache"
/>
```

### Bundle Optimization

```bash
# Analyze bundle size
npx react-native-bundle-visualizer

# Enable Hermes engine (Android)
# android/app/build.gradle
project.ext.react = [
  enableHermes: true
]
```

## 🔍 Debugging

### Common Debug Commands

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clean build directories
npx react-native clean

# Rebuild for iOS
cd ios && xcodebuild clean && cd ..

# Rebuild for Android
cd android && ./gradlew clean && cd ..
```

### Network Debugging

```typescript
// Enable network debugging
if (__DEV__) {
  require('react-native-network-logger').startNetworkLogging();
}
```

### Performance Monitoring

```typescript
// Performance monitoring
import { Performance } from 'react-native-performance';

const performanceMonitor = new Performance();
performanceMonitor.start();
```

## 🚨 Troubleshooting

### Common Issues

#### Metro Bundler Issues

```bash
# Solution 1: Reset Metro cache
npx react-native start --reset-cache

# Solution 2: Clear npm cache
npm cache clean --force

# Solution 3: Restart development server
pkill -f "react-native" && npm start
```

#### iOS Build Issues

```bash
# Solution 1: Clean and rebuild
cd ios && pod deintegrate && pod install && cd ..

# Solution 2: Clear derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Solution 3: Reset simulator
xcrun simctl erase all
```

#### Android Build Issues

```bash
# Solution 1: Clean gradle
cd android && ./gradlew clean && cd ..

# Solution 2: Reset ADB
adb kill-server && adb start-server

# Solution 3: Clear React Native cache
npx react-native clean
```

### Performance Issues

1. **Check bundle size**: Use bundle analyzer
2. **Optimize images**: Use appropriate formats and sizes
3. **Profile components**: Use React DevTools Profiler
4. **Monitor memory**: Use development tools

### Debug Checklist

- [ ] Clear Metro cache
- [ ] Clean build directories
- [ ] Check device/simulator connection
- [ ] Verify environment variables
- [ ] Check for conflicting packages
- [ ] Review recent code changes
- [ ] Check log files for errors

## 📚 Additional Resources

### React Native Documentation

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)

### Tools and Libraries

- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [React Native Performance](https://github.com/oblador/react-native-performance)

### Best Practices

- [React Native Best Practices](https://github.com/react-native-community/best-practices)
- [TypeScript Best Practices](https://typescript-eslint.io/docs/linting/typed-linting/)
- [Testing Best Practices](https://testing-library.com/docs/react-native-testing-library/intro/)

---

*Last updated: December 2024*
*Version: 1.0.0*
