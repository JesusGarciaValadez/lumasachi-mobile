# Development Guide - Lumasachi Control

This guide provides comprehensive information for developers working on the Lumasachi Control React Native application.

## 📋 Table of Contents

- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Code Conventions](#code-conventions)
- [Testing Guide](#testing-guide)
- [Git Workflow](#git-workflow)
- [Performance Guidelines](#performance-guidelines)
- [Security Best Practices](#security-best-practices)
- [Deployment Process](#deployment-process)

---

## 🔧 Environment Setup

### Prerequisites

Ensure you have the following installed:

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0 or **Yarn**: >= 1.22.0
- **Git**: Latest version
- **React Native CLI**: Latest version

### Platform-Specific Setup

#### iOS Development (macOS only)
```bash
# Install Xcode from Mac App Store
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Install iOS simulator
# Available through Xcode
```

#### Android Development
```bash
# Install Android Studio
# Configure Android SDK

# Set environment variables
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/tools/bin' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc

# Reload shell configuration
source ~/.bashrc
```

### Project Setup

```bash
# Clone the repository
git clone https://github.com/your-org/lumasachi-react-native.git
cd lumasachi-react-native

# Install dependencies
npm install

# iOS setup
cd ios
pod install
cd ..

# Verify installation
npx react-native doctor
```

### IDE Configuration

#### VS Code Extensions
- React Native Tools
- ES7+ React/Redux/React-Native snippets
- TypeScript Importer
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer

#### Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.updateImportsOnFileMove.enabled": "always",
  "emmet.includeLanguages": {
    "typescript": "typescriptreact"
  }
}
```

---

## 🚀 Development Workflow

### Daily Development Process

1. **Start Development Server**
   ```bash
   # Start Metro bundler
   npm start
   
   # In separate terminals
   npm run ios     # iOS development
   npm run android # Android development
   ```

2. **Code Changes**
   - Make changes to source files
   - Hot reload automatically updates the app
   - Use React Native Debugger for debugging

3. **Testing**
   ```bash
   # Run tests
   npm test
   
   # Run tests in watch mode
   npm test -- --watch
   
   # Run specific test
   npm test -- UserComponent.test.tsx
   ```

4. **Code Quality**
   ```bash
   # Lint code
   npm run lint
   
   # Fix linting errors
   npm run lint -- --fix
   
   # Type checking
   npx tsc --noEmit
   ```

### Branch Management

```bash
# Create feature branch
git checkout -b feature/user-authentication

# Work on feature
git add .
git commit -m "feat: implement user authentication"

# Push to remote
git push origin feature/user-authentication

# Create pull request
# Code review process
# Merge to main branch
```

### Development Tools

#### React Native Debugger
```bash
# Install React Native Debugger
npm install -g react-native-debugger

# Start debugger
react-native-debugger
```

#### Flipper
```bash
# Install Flipper
# Download from https://fbflipper.com/

# Enable Flipper in development builds
# Already configured in the project
```

---

## 📏 Code Conventions

### TypeScript Standards

#### Interface Definitions
```typescript
// Use PascalCase for interfaces
interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

// Use type for unions
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';

// Use generics for reusable types
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

#### Function Definitions
```typescript
// Use arrow functions for components
const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  // Component logic
};

// Use function declarations for utilities
function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

// Use async/await for promises
const fetchUser = async (id: string): Promise<User> => {
  const response = await httpClient.get(`/users/${id}`);
  return response.data;
};
```

### Component Structure

```typescript
// Import order
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

// Local imports
import { User } from '../types';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/dateUtils';

// Component interface
interface UserProfileProps {
  user: User;
  onUpdate: (user: User) => void;
}

// Component implementation
const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  // Hooks at the top
  const { logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);

  // Effects
  useEffect(() => {
    // Side effects
  }, []);

  // Callbacks
  const handleEdit = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await onUpdate(user);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, [user, onUpdate]);

  // Render
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user.name}</Text>
      <Text style={styles.email}>{user.email}</Text>
      <Text style={styles.date}>
        Joined: {formatDate(user.createdAt)}
      </Text>
      
      <View style={styles.actions}>
        <Button onPress={handleEdit}>Edit</Button>
        <Button onPress={logout}>Logout</Button>
      </View>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default UserProfile;
```

### File Naming

```
# Components
UserProfile.tsx
OrderList.tsx
SettingsScreen.tsx

# Hooks
useAuth.ts
usePermissions.ts
useFileUpload.ts

# Services
apiService.ts
permissionsService.ts
fileService.ts

# Utils
dateUtils.ts
validationUtils.ts
formatUtils.ts

# Types
index.ts
navigation.ts
api.ts
```

### Code Documentation

```typescript
/**
 * Hook for managing user authentication
 * @returns Authentication state and methods
 */
const useAuth = (): UseAuthReturn => {
  // Implementation
};

/**
 * Formats a date for display
 * @param date - The date to format
 * @param format - The format string (optional)
 * @returns Formatted date string
 */
const formatDate = (date: Date, format?: string): string => {
  // Implementation
};

/**
 * User profile component
 * @param user - User object to display
 * @param onUpdate - Callback when user is updated
 */
const UserProfile: React.FC<UserProfileProps> = ({ user, onUpdate }) => {
  // Implementation
};
```

---

## 🧪 Testing Guide

### Testing Structure

```
__tests__/
├── components/
│   ├── UserProfile.test.tsx
│   └── OrderList.test.tsx
├── hooks/
│   ├── useAuth.test.ts
│   └── usePermissions.test.ts
├── services/
│   ├── apiService.test.ts
│   └── fileService.test.ts
├── utils/
│   ├── dateUtils.test.ts
│   └── validationUtils.test.ts
└── setupTests.ts
```

### Component Testing

```typescript
// UserProfile.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { UserProfile } from '../UserProfile';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'ADMIN' as const,
  createdAt: new Date('2023-01-01'),
};

describe('UserProfile', () => {
  it('renders user information correctly', () => {
    const { getByText } = render(
      <UserProfile user={mockUser} onUpdate={jest.fn()} />
    );

    expect(getByText('John Doe')).toBeTruthy();
    expect(getByText('john@example.com')).toBeTruthy();
  });

  it('calls onUpdate when save is pressed', async () => {
    const mockOnUpdate = jest.fn();
    const { getByText } = render(
      <UserProfile user={mockUser} onUpdate={mockOnUpdate} />
    );

    fireEvent.press(getByText('Edit'));
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(mockUser);
    });
  });
});
```

### Hook Testing

```typescript
// useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useAuth } from '../useAuth';

describe('useAuth', () => {
  it('should login user successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(result.current.user).toBeTruthy();
    expect(result.current.loading).toBe(false);
  });

  it('should handle login error', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.login({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.user).toBeNull();
    expect(result.current.error).toBeTruthy();
  });
});
```

### Service Testing

```typescript
// apiService.test.ts
import { apiService } from '../apiService';
import { httpClient } from '../httpClient';

jest.mock('../httpClient');
const mockHttpClient = httpClient as jest.Mocked<typeof httpClient>;

describe('apiService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch users successfully', async () => {
    const mockUsers = [{ id: '1', name: 'John Doe' }];
    mockHttpClient.get.mockResolvedValue({ data: mockUsers });

    const users = await apiService.getUsers();

    expect(users).toEqual(mockUsers);
    expect(mockHttpClient.get).toHaveBeenCalledWith('/users');
  });

  it('should handle API errors', async () => {
    mockHttpClient.get.mockRejectedValue(new Error('Network error'));

    await expect(apiService.getUsers()).rejects.toThrow('Network error');
  });
});
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- UserProfile.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should login"

# Debug tests
npm test -- --debug
```

---

## 🔀 Git Workflow

### Branch Naming Convention

```
feature/user-authentication
feature/order-management
fix/navigation-bug
hotfix/critical-security-patch
refactor/permissions-system
docs/api-documentation
```

### Commit Message Format

```
feat: add user authentication
fix: resolve navigation crash on Android
docs: update API documentation
refactor: improve permissions service
test: add tests for user component
chore: update dependencies
```

### Git Hooks

```bash
# Pre-commit hook
npm run lint
npm run test
npm run build
```

### Pull Request Process

1. **Create Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Follow coding conventions
   - Write tests
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: implement new feature"
   ```

4. **Push Branch**
   ```bash
   git push origin feature/new-feature
   ```

5. **Create Pull Request**
   - Provide clear description
   - Reference related issues
   - Request code review

6. **Code Review**
   - Address feedback
   - Update code as needed
   - Ensure tests pass

7. **Merge**
   - Squash and merge
   - Delete feature branch

---

## ⚡ Performance Guidelines

### Component Optimization

```typescript
// Use React.memo for pure components
const UserCard = React.memo<UserCardProps>(({ user }) => {
  return (
    <View>
      <Text>{user.name}</Text>
    </View>
  );
});

// Use useCallback for functions
const handlePress = useCallback(() => {
  onPress(user.id);
}, [user.id, onPress]);

// Use useMemo for expensive calculations
const sortedUsers = useMemo(() => {
  return users.sort((a, b) => a.name.localeCompare(b.name));
}, [users]);
```

### List Performance

```typescript
// Use FlatList for large lists
<FlatList
  data={items}
  renderItem={({ item }) => <ItemComponent item={item} />}
  keyExtractor={(item) => item.id}
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

### Bundle Size Optimization

```bash
# Analyze bundle size
npx react-native-bundle-visualizer

# Enable Hermes (Android)
# android/app/build.gradle
project.ext.react = [
  enableHermes: true
]
```

---

## 🔒 Security Best Practices

### Authentication

```typescript
// Store tokens securely
import AsyncStorage from '@react-native-async-storage/async-storage';

const storeToken = async (token: string) => {
  await AsyncStorage.setItem('authToken', token);
};

const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem('authToken');
};
```

### API Security

```typescript
// Add token to requests
const httpClient = axios.create({
  baseURL: 'https://api.lumasachi.com',
  timeout: 10000,
});

httpClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Data Validation

```typescript
// Validate user input
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};
```

---

## 🚀 Deployment Process

### Build Process

```bash
# iOS Build
cd ios
xcodebuild -workspace LumasachiControl.xcworkspace -scheme LumasachiControl -configuration Release -destination generic/platform=iOS -archivePath build/LumasachiControl.xcarchive archive

# Android Build
cd android
./gradlew assembleRelease
```

### Release Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Version number updated
- [ ] Changelog updated
- [ ] Build successful on both platforms
- [ ] App tested on devices
- [ ] Performance metrics acceptable

### Environment Variables

```bash
# Development
API_URL=https://api-dev.lumasachi.com
DEBUG=true

# Production
API_URL=https://api.lumasachi.com
DEBUG=false
```

---

## 📚 Additional Resources

### Documentation
- [React Native Documentation](https://reactnative.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [React Query Documentation](https://tanstack.com/query/latest)

### Tools
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [React DevTools](https://react-devtools-experimental.now.sh/)

### Community
- [React Native Community](https://github.com/react-native-community)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)
- [Reddit r/reactnative](https://www.reddit.com/r/reactnative/)

---

*Last updated: December 2024*
*Version: 1.0.0* 