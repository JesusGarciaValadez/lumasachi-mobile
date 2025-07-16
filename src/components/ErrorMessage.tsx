import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTranslation} from 'react-i18next';
import {errorService, ErrorType} from '../services/errorService';

interface ErrorMessageProps {
  error?: Error | string | null;
  errorType?: ErrorType;
  visible?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
  showRetryButton?: boolean;
  showDismissButton?: boolean;
  customMessage?: string;
  style?: any;
  testID?: string;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  errorType,
  visible = true,
  onRetry,
  onDismiss,
  showRetryButton = true,
  showDismissButton = true,
  customMessage,
  style,
  testID,
}) => {
  const {t} = useTranslation();

  if (!visible || (!error && !customMessage)) {
    return null;
  }

  // Determine error type if not provided
  const determinedErrorType = errorType || (error instanceof Error ? errorService.classifyError(error) : 'UNKNOWN_ERROR');

  // Get error message
  const getErrorMessage = (): string => {
    if (customMessage) {
      return customMessage;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error instanceof Error) {
      // Use error service to get user-friendly message
      switch (determinedErrorType) {
        case 'NETWORK_ERROR':
          return t('common.errors.networkError');
        case 'TIMEOUT_ERROR':
          return t('common.errors.timeoutError');
        case 'SERVER_ERROR':
          return t('common.errors.serverError');
        case 'CLIENT_ERROR':
          return t('common.errors.clientError');
        case 'VALIDATION_ERROR':
          return error.message || t('common.errors.validationError');
        case 'PERMISSION_ERROR':
          return t('common.errors.permissionError');
        case 'AUTHENTICATION_ERROR':
          return t('common.errors.authenticationError');
        default:
          return error.message || t('common.errors.unexpectedError');
      }
    }

    return t('common.errors.unexpectedError');
  };

  // Get error icon based on type
  const getErrorIcon = (): string => {
    switch (determinedErrorType) {
      case 'NETWORK_ERROR':
        return '📡';
      case 'TIMEOUT_ERROR':
        return '⏱️';
      case 'SERVER_ERROR':
        return '🖥️';
      case 'CLIENT_ERROR':
        return '📱';
      case 'VALIDATION_ERROR':
        return '✏️';
      case 'PERMISSION_ERROR':
        return '🔒';
      case 'AUTHENTICATION_ERROR':
        return '🔐';
      default:
        return '⚠️';
    }
  };

  // Get error color based on type
  const getErrorColor = (): string => {
    switch (determinedErrorType) {
      case 'NETWORK_ERROR':
        return '#FF6B6B';
      case 'TIMEOUT_ERROR':
        return '#FFB347';
      case 'SERVER_ERROR':
        return '#FF8C94';
      case 'CLIENT_ERROR':
        return '#A8E6CF';
      case 'VALIDATION_ERROR':
        return '#FFD93D';
      case 'PERMISSION_ERROR':
        return '#FF8C94';
      case 'AUTHENTICATION_ERROR':
        return '#FFB347';
      default:
        return '#FF6B6B';
    }
  };

  return (
    <View style={[styles.container, {borderLeftColor: getErrorColor()}, style]} testID={testID}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{getErrorIcon()}</Text>
          <Text style={styles.message}>{getErrorMessage()}</Text>
        </View>
        
        {(showRetryButton || showDismissButton) && (
          <View style={styles.buttonContainer}>
            {showRetryButton && onRetry && (
              <TouchableOpacity
                style={[styles.button, styles.retryButton]}
                onPress={onRetry}
                testID={`${testID}-retry`}
              >
                <Text style={styles.retryButtonText}>
                  {t('common.retry')}
                </Text>
              </TouchableOpacity>
            )}
            
            {showDismissButton && onDismiss && (
              <TouchableOpacity
                style={[styles.button, styles.dismissButton]}
                onPress={onDismiss}
                testID={`${testID}-dismiss`}
              >
                <Text style={styles.dismissButtonText}>
                  {t('common.dismiss')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

// Specialized variants for common error types
export const NetworkErrorMessage: React.FC<Omit<ErrorMessageProps, 'errorType'>> = (props) => (
  <ErrorMessage {...props} errorType="NETWORK_ERROR" />
);

export const ValidationErrorMessage: React.FC<Omit<ErrorMessageProps, 'errorType'>> = (props) => (
  <ErrorMessage {...props} errorType="VALIDATION_ERROR" />
);

export const ServerErrorMessage: React.FC<Omit<ErrorMessageProps, 'errorType'>> = (props) => (
  <ErrorMessage {...props} errorType="SERVER_ERROR" />
);

export const AuthenticationErrorMessage: React.FC<Omit<ErrorMessageProps, 'errorType'>> = (props) => (
  <ErrorMessage {...props} errorType="AUTHENTICATION_ERROR" />
);

export const PermissionErrorMessage: React.FC<Omit<ErrorMessageProps, 'errorType'>> = (props) => (
  <ErrorMessage {...props} errorType="PERMISSION_ERROR" />
);

// Hook for managing error message state
export const useErrorMessage = () => {
  const [error, setError] = React.useState<Error | string | null>(null);
  const [visible, setVisible] = React.useState(false);

  const showError = React.useCallback((error: Error | string) => {
    setError(error);
    setVisible(true);
  }, []);

  const hideError = React.useCallback(() => {
    setVisible(false);
    // Clear error after animation
    setTimeout(() => setError(null), 300);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setVisible(false);
  }, []);

  return {
    error,
    visible,
    showError,
    hideError,
    clearError,
  };
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderLeftWidth: 4,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  message: {
    flex: 1,
    fontSize: 16,
    color: '#2D3748',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 80,
  },
  retryButton: {
    backgroundColor: '#4299E1',
  },
  dismissButton: {
    backgroundColor: '#E2E8F0',
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  dismissButtonText: {
    color: '#4A5568',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ErrorMessage;
export {ErrorMessageProps};
