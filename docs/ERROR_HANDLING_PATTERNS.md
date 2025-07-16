# Error Handling Patterns - Lumasachi Control

This document describes the comprehensive error handling system implemented in the Lumasachi Control React Native application.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Core Components](#core-components)
- [Error Types](#error-types)
- [Usage Patterns](#usage-patterns)
- [Network Error Handling](#network-error-handling)
- [Retry Mechanisms](#retry-mechanisms)
- [Best Practices](#best-practices)
- [Testing](#testing)

## 🏗️ Architecture Overview

The error handling system is built around several key components:

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Handling System                    │
├─────────────────────────────────────────────────────────────┤
│  ErrorBoundary → ErrorService → NetworkService → RetryService │
│       ↓              ↓              ↓              ↓       │
│  React Error    Log & Classify   Network State   Retry Logic │
│   Recovery       Error Types      Detection      Strategies │
└─────────────────────────────────────────────────────────────┘
```

### Key Features

- **Centralized Error Management**: All errors are processed through a single service
- **Automatic Classification**: Errors are automatically classified by type
- **Network-Aware**: Handles offline scenarios gracefully
- **Retry Mechanisms**: Automatic retry with exponential backoff
- **User-Friendly**: Clear error messages with actionable options
- **Persistent Logging**: Errors are logged for debugging purposes

## 🔧 Core Components

### 1. ErrorService (`src/services/errorService.ts`)

The central error handling service that classifies, logs, and manages errors.

```typescript
import { errorService } from '../services/errorService';

// Log an error
const errorId = await errorService.logError(error, { context: 'user-action' });

// Classify error type
const errorType = errorService.classifyError(error);

// Get error logs with filters
const logs = errorService.getErrorLogs({
  errorType: 'NETWORK_ERROR',
  isResolved: false,
});
```

### 2. ErrorBoundary (`src/components/ErrorBoundary.tsx`)

React error boundary component that catches and handles React errors.

```typescript
import ErrorBoundary from '../components/ErrorBoundary';

const MyComponent = () => {
  return (
    <ErrorBoundary>
      <ChildComponent />
    </ErrorBoundary>
  );
};
```

### 3. ErrorMessage (`src/components/ErrorMessage.tsx`)

Standardized error message component with retry functionality.

```typescript
import ErrorMessage from '../components/ErrorMessage';

const MyScreen = () => {
  const [error, setError] = useState<Error | null>(null);

  return (
    <View>
      {error && (
        <ErrorMessage
          error={error}
          onRetry={() => refetch()}
          onDismiss={() => setError(null)}
        />
      )}
    </View>
  );
};
```

### 4. NetworkService (`src/services/networkService.ts`)

Handles network connectivity monitoring and offline detection.

```typescript
import { networkService } from '../services/networkService';

// Check network status
const isOnline = networkService.isOnline();
const isOffline = networkService.isOffline();

// Wait for connection
const connected = await networkService.waitForConnection(30000);

// Listen for network changes
const unsubscribe = networkService.addListener((state) => {
  console.log('Network state changed:', state);
});
```

### 5. RetryService (`src/services/retryService.ts`)

Provides retry mechanisms with different backoff strategies.

```typescript
import { retryService } from '../services/retryService';

// Simple retry with exponential backoff
const result = await retryService.executeWithExponentialBackoff(
  () => apiCall(),
  3,  // max retries
  1000  // initial delay
);

// Custom retry configuration
const customResult = await retryService.executeWithRetry(
  () => apiCall(),
  {
    maxRetries: 5,
    baseDelay: 2000,
    backoffFactor: 2,
    jitter: true,
  }
);
```

## 🏷️ Error Types

The system classifies errors into the following types:

### 1. Network Errors (`NETWORK_ERROR`)
- Connection failures
- DNS resolution errors
- Network timeouts

### 2. Timeout Errors (`TIMEOUT_ERROR`)
- Request timeouts
- Connection timeouts
- Operation timeouts

### 3. Server Errors (`SERVER_ERROR`)
- 5xx HTTP status codes
- Internal server errors
- Service unavailable

### 4. Client Errors (`CLIENT_ERROR`)
- 4xx HTTP status codes (except 401, 403)
- Bad requests
- Validation errors

### 5. Authentication Errors (`AUTHENTICATION_ERROR`)
- 401 Unauthorized
- 403 Forbidden
- Invalid credentials

### 6. Permission Errors (`PERMISSION_ERROR`)
- Access denied
- Insufficient permissions
- Role-based restrictions

### 7. Validation Errors (`VALIDATION_ERROR`)
- Input validation failures
- Schema validation errors
- Format errors

### 8. Unknown Errors (`UNKNOWN_ERROR`)
- Unclassified errors
- Unexpected exceptions
- System errors

## 📱 Usage Patterns

### 1. Basic Error Handling

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, showError } = useErrorHandler();

  const handleAction = async () => {
    try {
      await performAction();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Button onPress={handleAction}>
      Perform Action
    </Button>
  );
};
```

### 2. Network-Aware Operations

```typescript
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { isOnline } = useNetworkStatus();
  const { handleError } = useErrorHandler();

  const handleNetworkOperation = async () => {
    if (!isOnline) {
      handleError(new Error('No internet connection'));
      return;
    }

    try {
      await networkOperation();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <Button 
      onPress={handleNetworkOperation}
      disabled={!isOnline}
    >
      {isOnline ? 'Perform Action' : 'Offline'}
    </Button>
  );
};
```

### 3. Retry with User Feedback

```typescript
import { retryService } from '../services/retryService';
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError } = useErrorHandler();
  const [retryCount, setRetryCount] = useState(0);

  const handleActionWithRetry = async () => {
    try {
      const result = await retryService.executeWithRetry(
        () => apiCall(),
        {
          maxRetries: 3,
          onRetry: (error, attempt) => {
            setRetryCount(attempt);
            // Show retry feedback to user
          }
        }
      );

      if (result.success) {
        // Handle success
      } else {
        handleError(result.error);
      }
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <View>
      <Button onPress={handleActionWithRetry}>
        Perform Action
      </Button>
      {retryCount > 0 && (
        <Text>Retrying... Attempt {retryCount}</Text>
      )}
    </View>
  );
};
```

## 🌐 Network Error Handling

### Offline Detection

```typescript
import { OfflineIndicator } from '../components/OfflineIndicator';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const App = () => {
  return (
    <View>
      <OfflineIndicator />
      <MainContent />
    </View>
  );
};
```

### Network-Aware API Calls

```typescript
import { networkService } from '../services/networkService';
import { retryService } from '../services/retryService';

const apiCall = async () => {
  // Wait for network connection if offline
  if (networkService.isOffline()) {
    const connected = await networkService.waitForConnection(10000);
    if (!connected) {
      throw new Error('No network connection available');
    }
  }

  // Perform API call with retry
  return retryService.executeWithRetry(
    () => fetch('/api/data'),
    {
      retryCondition: (error) => networkService.shouldTriggerOfflineHandling(error)
    }
  );
};
```

## 🔄 Retry Mechanisms

### Exponential Backoff

```typescript
import { retryService } from '../services/retryService';

const result = await retryService.executeWithExponentialBackoff(
  () => apiCall(),
  3,    // max retries
  1000  // initial delay (ms)
);
```

### Linear Backoff

```typescript
const result = await retryService.executeWithLinearBackoff(
  () => apiCall(),
  3,    // max retries
  2000  // delay between retries (ms)
);
```

### Immediate Retry

```typescript
const result = await retryService.executeWithImmediateRetry(
  () => apiCall(),
  3  // max retries
);
```

### Custom Retry Logic

```typescript
const result = await retryService.executeWithRetry(
  () => apiCall(),
  {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    jitter: true,
    retryCondition: (error) => {
      // Custom retry condition
      return error.response?.status >= 500;
    },
    onRetry: (error, attempt) => {
      // Custom retry callback
      console.log(`Retrying... Attempt ${attempt}`);
    }
  }
);
```

## 📋 Best Practices

### 1. Error Classification

Always let the system classify errors automatically:

```typescript
// ✅ Good
const errorType = errorService.classifyError(error);

// ❌ Avoid manual classification
const errorType = 'NETWORK_ERROR';
```

### 2. Context Information

Always provide context when logging errors:

```typescript
// ✅ Good
await errorService.logError(error, {
  userId: user.id,
  action: 'create-order',
  orderId: order.id,
});

// ❌ Missing context
await errorService.logError(error);
```

### 3. User-Friendly Messages

Use the translation system for error messages:

```typescript
// ✅ Good
const message = t('common.errors.networkError');

// ❌ Hardcoded messages
const message = 'Network error occurred';
```

### 4. Retry Strategy Selection

Choose appropriate retry strategies:

```typescript
// ✅ Good - Network operations
await retryService.executeWithExponentialBackoff(networkCall);

// ✅ Good - Quick operations
await retryService.executeWithImmediateRetry(quickCall);

// ❌ Wrong - Don't retry user input errors
await retryService.executeWithRetry(validateUserInput); // This should not retry
```

### 5. Error Boundary Placement

Place error boundaries at appropriate levels:

```typescript
// ✅ Good - Screen level
const MyScreen = () => (
  <ErrorBoundary>
    <ScreenContent />
  </ErrorBoundary>
);

// ✅ Good - Component level for critical components
const CriticalComponent = () => (
  <ErrorBoundary>
    <ComplexComponent />
  </ErrorBoundary>
);
```

## 🧪 Testing

### Unit Tests

```typescript
import { errorService } from '../services/errorService';
import { retryService } from '../services/retryService';

describe('Error Handling', () => {
  test('should classify network errors', () => {
    const error = new Error('Network request failed');
    const type = errorService.classifyError(error);
    expect(type).toBe('NETWORK_ERROR');
  });

  test('should retry on network errors', async () => {
    const mockFn = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('success');

    const result = await retryService.executeWithRetry(mockFn);
    
    expect(result.success).toBe(true);
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
```

### Integration Tests

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../components/ErrorBoundary';

describe('Error Boundary Integration', () => {
  test('should catch and display errors', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(getByText(/something went wrong/i)).toBeTruthy();
  });
});
```

## 📊 Monitoring and Debugging

### Error Logs

View error logs in development:

```typescript
const logs = errorService.getErrorLogs({
  errorType: 'NETWORK_ERROR',
  limit: 50,
});

console.log('Recent network errors:', logs);
```

### Error Metrics

Track error patterns:

```typescript
const errorStats = errorService.getErrorStats();
console.log('Error statistics:', errorStats);
```

### Debug Mode

Enable debug mode for detailed logging:

```typescript
if (__DEV__) {
  errorService.enableDebugMode();
}
```

## 🔧 Configuration

### Error Service Configuration

```typescript
// Configure error service
errorService.configure({
  maxLogs: 1000,
  autoCleanup: true,
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours
});
```

### Retry Configuration

```typescript
// Set default retry options
retryService.setDefaultOptions({
  maxRetries: 3,
  baseDelay: 1000,
  backoffFactor: 2,
  jitter: true,
});
```

## 🚀 Advanced Usage

### Custom Error Types

```typescript
// Extend error types
type CustomErrorType = ErrorType | 'BUSINESS_LOGIC_ERROR';

// Custom error classification
const customClassifyError = (error: any): CustomErrorType => {
  if (error.code === 'BUSINESS_ERROR') {
    return 'BUSINESS_LOGIC_ERROR';
  }
  return errorService.classifyError(error);
};
```

### Error Recovery Strategies

```typescript
// Custom error recovery
const recoverFromError = async (error: Error) => {
  switch (errorService.classifyError(error)) {
    case 'AUTHENTICATION_ERROR':
      return await refreshAuthToken();
    case 'NETWORK_ERROR':
      return await waitForConnection();
    default:
      return null;
  }
};
```

---

This error handling system provides a robust foundation for managing errors in the Lumasachi Control application. It ensures a consistent user experience while providing developers with the tools needed to debug and resolve issues effectively.

*Last updated: December 2024* 