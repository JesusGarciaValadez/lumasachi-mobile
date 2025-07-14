import React, {Component, ReactNode} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import {AuthStackParamList} from '../types/navigation';
import {useTranslation} from 'react-i18next';

const Stack = createStackNavigator<AuthStackParamList>();

// Error Boundary State Interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

// Error Boundary Props Interface
interface ErrorBoundaryProps {
  children: ReactNode;
  maxRetries?: number;
}

// Error Boundary Fallback Component
const ErrorBoundaryFallback: React.FC<{
  error: Error;
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
}> = ({error, onRetry, retryCount, maxRetries}) => {
  const {t} = useTranslation();
  
  const canRetry = retryCount < maxRetries;
  const isNetworkError = error.message?.includes('Network') || 
                         error.message?.includes('fetch') ||
                         error.message?.includes('timeout');

  const getErrorMessage = () => {
    if (isNetworkError) {
      return t('common.errors.networkError');
    }
    return error.message || t('common.errors.unexpectedError');
  };

  const handleRetry = () => {
    if (canRetry) {
      onRetry();
    } else {
      Alert.alert(
        t('common.error'),
        t('common.errors.maxRetriesReached'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // Reset retry count and try again
              onRetry();
            },
          },
        ]
      );
    }
  };

  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorIcon}>
        <Text style={styles.errorIconText}>⚠️</Text>
      </View>
      
      <Text style={styles.errorTitle}>
        {isNetworkError ? t('common.errors.connectionTitle') : t('common.errors.errorTitle')}
      </Text>
      
      <Text style={styles.errorMessage}>
        {getErrorMessage()}
      </Text>

      {retryCount > 0 && (
        <Text style={styles.retryText}>
          {t('common.errors.retryAttempt', {count: retryCount, max: maxRetries})}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.retryButton, !canRetry && styles.retryButtonDisabled]}
        onPress={handleRetry}
        disabled={false} // Always allow retry, but handle max retries in the function
      >
        <Text style={styles.retryButtonText}>
          {canRetry ? t('common.retry') : t('common.resetAndRetry')}
        </Text>
      </TouchableOpacity>

      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>{error.stack}</Text>
        </View>
      )}
    </View>
  );
};

// Error Boundary Class Component
class AuthErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      retryCount: 0,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('AuthErrorBoundary caught an error:', error, errorInfo);
    
    // You can log to crash reporting service here
    // crashlytics().recordError(error);
  }

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  handleRetry = () => {
    const {maxRetries = 3} = this.props;
    const {retryCount} = this.state;

    if (retryCount >= maxRetries) {
      // Reset retry count if max retries reached
      this.setState({
        hasError: false,
        error: null,
        retryCount: 0,
      });
    } else {
      // Increment retry count and reset error
      this.setState({
        hasError: false,
        error: null,
        retryCount: retryCount + 1,
      });
    }

    // Auto-reset retry count after successful operation (5 minutes)
    this.resetTimeoutId = setTimeout(() => {
      this.setState(prevState => ({
        ...prevState,
        retryCount: 0,
      }));
    }, 5 * 60 * 1000);
  };

  render() {
    const {hasError, error, retryCount} = this.state;
    const {children, maxRetries = 3} = this.props;

    if (hasError && error) {
      return (
        <ErrorBoundaryFallback
          error={error}
          onRetry={this.handleRetry}
          retryCount={retryCount}
          maxRetries={maxRetries}
        />
      );
    }

    return children;
  }
}

const AuthNavigator: React.FC = () => {
  return (
    <AuthErrorBoundary maxRetries={3}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            gestureEnabled: false, // Disable swipe back on login
          }}
        />
      </Stack.Navigator>
    </AuthErrorBoundary>
  );
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorIcon: {
    marginBottom: 20,
  },
  errorIconText: {
    fontSize: 48,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  retryText: {
    fontSize: 14,
    color: '#ffc107',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonDisabled: {
    backgroundColor: '#999999',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 30,
    padding: 15,
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
  },
});

export default AuthNavigator; 