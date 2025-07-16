import {useCallback, useState} from 'react';
import {errorService, ErrorType} from '../services/errorService';
import {useTranslation} from 'react-i18next';

interface ErrorHandlerOptions {
  showAlert?: boolean;
  logError?: boolean;
  onError?: (error: Error | any) => void;
  onRetry?: () => Promise<void>;
  maxRetries?: number;
  autoRetry?: boolean;
  retryDelay?: number;
}

interface ErrorHandlerState {
  error: Error | null;
  errorType: ErrorType | null;
  isRetrying: boolean;
  retryCount: number;
  hasError: boolean;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {t} = useTranslation();
  const [state, setState] = useState<ErrorHandlerState>({
    error: null,
    errorType: null,
    isRetrying: false,
    retryCount: 0,
    hasError: false,
  });

  const {
    showAlert = true,
    logError = true,
    onError,
    onRetry,
    maxRetries = 3,
    autoRetry = false,
    retryDelay = 2000,
  } = options;

  /**
   * Handle error with comprehensive error processing
   */
  const handleError = useCallback(async (error: Error | any) => {
    const errorType = errorService.classifyError(error);
    
    // Update state
    setState(prev => ({
      ...prev,
      error,
      errorType,
      hasError: true,
    }));

    // Log error if enabled
    if (logError) {
      await errorService.logError(error, {
        component: 'useErrorHandler',
        retryCount: state.retryCount,
        maxRetries,
        autoRetry,
      });
    }

    // Call custom error handler if provided
    if (onError) {
      onError(error);
    }

    // Handle error with error service
    await errorService.handleError(error, {
      showAlert,
      retry: onRetry,
      maxRetries,
      retryCount: state.retryCount,
    });

    // Auto-retry if enabled and conditions are met
    if (autoRetry && onRetry && state.retryCount < maxRetries) {
      await retry();
    }
  }, [
    logError,
    onError,
    onRetry,
    showAlert,
    maxRetries,
    autoRetry,
    state.retryCount,
  ]);

  /**
   * Retry mechanism with exponential backoff
   */
  const retry = useCallback(async () => {
    if (!onRetry || state.isRetrying) return;

    setState(prev => ({
      ...prev,
      isRetrying: true,
      retryCount: prev.retryCount + 1,
    }));

    try {
      // Calculate delay with exponential backoff
      const delay = retryDelay * Math.pow(2, state.retryCount);
      await new Promise(resolve => setTimeout(resolve, delay));

      await onRetry();
      
      // Success - clear error state
      clearError();
    } catch (error) {
      // Retry failed
      if (state.retryCount < maxRetries) {
        // Try again
        await handleError(error);
      } else {
        // Max retries reached
        setState(prev => ({
          ...prev,
          isRetrying: false,
          error: new Error(t('common.errors.maxRetriesReached')),
          errorType: 'UNKNOWN_ERROR',
        }));
      }
    } finally {
      setState(prev => ({
        ...prev,
        isRetrying: false,
      }));
    }
  }, [
    onRetry,
    state.isRetrying,
    state.retryCount,
    retryDelay,
    maxRetries,
    handleError,
    t,
  ]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setState({
      error: null,
      errorType: null,
      isRetrying: false,
      retryCount: 0,
      hasError: false,
    });
  }, []);

  /**
   * Reset retry count
   */
  const resetRetryCount = useCallback(() => {
    setState(prev => ({
      ...prev,
      retryCount: 0,
    }));
  }, []);

  /**
   * Check if error is retryable
   */
  const isRetryable = useCallback(() => {
    if (!state.errorType) return false;
    
    const retryableTypes: ErrorType[] = [
      'NETWORK_ERROR',
      'TIMEOUT_ERROR',
      'SERVER_ERROR',
    ];
    
    return retryableTypes.includes(state.errorType) && state.retryCount < maxRetries;
  }, [state.errorType, state.retryCount, maxRetries]);

  /**
   * Get user-friendly error message
   */
  const getErrorMessage = useCallback(() => {
    if (!state.error) return null;

    switch (state.errorType) {
      case 'NETWORK_ERROR':
        return t('common.errors.networkError');
      case 'TIMEOUT_ERROR':
        return t('common.errors.timeoutError');
      case 'SERVER_ERROR':
        return t('common.errors.serverError');
      case 'CLIENT_ERROR':
        return t('common.errors.clientError');
      case 'VALIDATION_ERROR':
        return state.error.message || t('common.errors.validationError');
      case 'PERMISSION_ERROR':
        return t('common.errors.permissionError');
      case 'AUTHENTICATION_ERROR':
        return t('common.errors.authenticationError');
      default:
        return state.error.message || t('common.errors.unexpectedError');
    }
  }, [state.error, state.errorType, t]);

  /**
   * Wrapped function that handles errors automatically
   */
  const withErrorHandling = useCallback(
    <T extends any[], R>(fn: (...args: T) => Promise<R>) => {
      return async (...args: T): Promise<R | undefined> => {
        try {
          clearError();
          const result = await fn(...args);
          return result;
        } catch (error) {
          await handleError(error);
          return undefined;
        }
      };
    },
    [handleError, clearError]
  );

  /**
   * Wrapped function for synchronous operations
   */
  const withErrorHandlingSync = useCallback(
    <T extends any[], R>(fn: (...args: T) => R) => {
      return (...args: T): R | undefined => {
        try {
          clearError();
          const result = fn(...args);
          return result;
        } catch (error) {
          handleError(error);
          return undefined;
        }
      };
    },
    [handleError, clearError]
  );

  return {
    // State
    error: state.error,
    errorType: state.errorType,
    isRetrying: state.isRetrying,
    retryCount: state.retryCount,
    hasError: state.hasError,
    
    // Methods
    handleError,
    clearError,
    retry,
    resetRetryCount,
    
    // Utilities
    isRetryable: isRetryable(),
    errorMessage: getErrorMessage(),
    
    // Wrappers
    withErrorHandling,
    withErrorHandlingSync,
  };
};

export default useErrorHandler;
