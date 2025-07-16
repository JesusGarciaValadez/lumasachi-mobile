import React, {Component, ReactNode} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import {useTranslation} from 'react-i18next';
import {errorService} from '../services/errorService';

// Error Boundary State Interface
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  errorId: string | null;
}

// Error Boundary Props Interface
interface ErrorBoundaryProps {
  children: ReactNode;
  maxRetries?: number;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// Error Fallback Props Interface
interface ErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  maxRetries: number;
  onRetry: () => void;
  onReset: () => void;
}

// Default Error Fallback Component
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  retryCount,
  maxRetries,
  onRetry,
  onReset,
}) => {
  const {t} = useTranslation();
  
  const canRetry = retryCount < maxRetries;
  const errorType = errorService.classifyError(error);
  
  const getErrorMessage = () => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return t('common.errors.networkError');
      case 'PERMISSION_ERROR':
        return t('common.errors.permissionError');
      case 'VALIDATION_ERROR':
        return t('common.errors.validationError');
      case 'TIMEOUT_ERROR':
        return t('common.errors.timeoutError');
      case 'SERVER_ERROR':
        return t('common.errors.serverError');
      case 'CLIENT_ERROR':
        return t('common.errors.clientError');
      default:
        return t('common.errors.unexpectedError');
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case 'NETWORK_ERROR':
        return t('common.errors.connectionTitle');
      case 'PERMISSION_ERROR':
        return t('common.errors.permissionTitle');
      case 'VALIDATION_ERROR':
        return t('common.errors.validationTitle');
      case 'TIMEOUT_ERROR':
        return t('common.errors.timeoutTitle');
      case 'SERVER_ERROR':
        return t('common.errors.serverTitle');
      case 'CLIENT_ERROR':
        return t('common.errors.clientTitle');
      default:
        return t('common.errors.errorTitle');
    }
  };

  const handleRetry = () => {
    if (canRetry) {
      onRetry();
    } else {
      Alert.alert(
        t('common.errors.maxRetriesTitle'),
        t('common.errors.maxRetriesMessage'),
        [
          {
            text: t('common.cancel'),
            style: 'cancel',
          },
          {
            text: t('common.resetAndRetry'),
            onPress: onReset,
          },
        ]
      );
    }
  };

  const handleReportError = () => {
    const errorReport = errorService.generateErrorReport(error, errorInfo);
    // In a real app, you would send this to your error reporting service
    console.log('Error Report:', errorReport);
    
    Alert.alert(
      t('common.errors.reportTitle'),
      t('common.errors.reportSent'),
      [
        {
          text: t('common.ok'),
          onPress: () => {},
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>⚠️</Text>
      </View>
      
      <Text style={styles.title}>{getErrorTitle()}</Text>
      
      <Text style={styles.message}>{getErrorMessage()}</Text>

      {retryCount > 0 && (
        <Text style={styles.retryText}>
          {t('common.errors.retryAttempt', {count: retryCount, max: maxRetries})}
        </Text>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.retryButton]}
          onPress={handleRetry}
        >
          <Text style={styles.buttonText}>
            {canRetry ? t('common.retry') : t('common.resetAndRetry')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.reportButton]}
          onPress={handleReportError}
        >
          <Text style={styles.buttonText}>
            {t('common.errors.reportError')}
          </Text>
        </TouchableOpacity>
      </View>

      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Info:</Text>
          <Text style={styles.debugText}>
            {error.name}: {error.message}
          </Text>
          <Text style={styles.debugText}>
            Stack: {error.stack?.substring(0, 200)}...
          </Text>
          {errorInfo && (
            <Text style={styles.debugText}>
              Component Stack: {errorInfo.componentStack?.substring(0, 200)}...
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

// Error Boundary Class Component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log error to error service
    errorService.logError(error, {
      component: 'ErrorBoundary',
      errorInfo,
      retryCount: this.state.retryCount,
      errorId: this.state.errorId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
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
        errorInfo: null,
        retryCount: 0,
        errorId: null,
      });
    } else {
      // Increment retry count and reset error
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
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

  handleReset = () => {
    // Complete reset of error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      errorId: null,
    });
  };

  render() {
    const {hasError, error, errorInfo, retryCount, errorId} = this.state;
    const {children, maxRetries = 3, fallback: FallbackComponent} = this.props;

    if (hasError && error) {
      const FallbackToRender = FallbackComponent || DefaultErrorFallback;
      
      return (
        <FallbackToRender
          error={error}
          errorInfo={errorInfo}
          retryCount={retryCount}
          maxRetries={maxRetries}
          onRetry={this.handleRetry}
          onReset={this.handleReset}
        />
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconText: {
    fontSize: 64,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#dc3545',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryText: {
    fontSize: 14,
    color: '#ffc107',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  retryButton: {
    backgroundColor: '#007AFF',
  },
  reportButton: {
    backgroundColor: '#FF9500',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f1f3f4',
    borderRadius: 8,
    width: '100%',
    maxHeight: 250,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});

export default ErrorBoundary;
export {ErrorBoundaryProps, ErrorFallbackProps};
