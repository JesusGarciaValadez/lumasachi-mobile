import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';

// Error Types
export type ErrorType = 
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'SERVER_ERROR'
  | 'CLIENT_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'UNKNOWN_ERROR';

// Error Log Interface
interface ErrorLog {
  id: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  errorType: ErrorType;
  context?: Record<string, any>;
  userAgent?: string;
  url?: string;
  userId?: string;
  sessionId?: string;
  retryCount?: number;
  isResolved?: boolean;
}

// Error Report Interface
interface ErrorReport {
  errorId: string;
  timestamp: number;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  context?: Record<string, any>;
  deviceInfo: {
    platform: string;
    version: string;
    userAgent?: string;
  };
  networkInfo?: {
    isConnected: boolean;
    connectionType?: string;
  };
  userInfo?: {
    userId?: string;
    sessionId?: string;
  };
}

// Network Status Interface
interface NetworkStatus {
  isConnected: boolean;
  connectionType?: string;
  isInternetReachable?: boolean;
}

class ErrorService {
  private static instance: ErrorService;
  private errorLogs: ErrorLog[] = [];
  private networkStatus: NetworkStatus = {
    isConnected: true,
    connectionType: 'unknown',
  };
  private readonly MAX_LOGS = 100;
  private readonly STORAGE_KEY = 'error_logs';

  constructor() {
    this.initializeNetworkListener();
    this.loadErrorLogs();
  }

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Initialize network status listener
   */
  private async initializeNetworkListener(): Promise<void> {
    try {
      // Get initial network state
      const initialState = await NetInfo.fetch();
      this.networkStatus = {
        isConnected: initialState.isConnected ?? false,
        connectionType: initialState.type,
        isInternetReachable: initialState.isInternetReachable ?? false,
      };

      // Listen for network changes
      NetInfo.addEventListener(state => {
        this.networkStatus = {
          isConnected: state.isConnected ?? false,
          connectionType: state.type,
          isInternetReachable: state.isInternetReachable ?? false,
        };
      });
    } catch (error) {
      console.warn('Failed to initialize network listener:', error);
    }
  }

  /**
   * Load error logs from storage
   */
  private async loadErrorLogs(): Promise<void> {
    try {
      const storedLogs = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (storedLogs) {
        this.errorLogs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.warn('Failed to load error logs:', error);
    }
  }

  /**
   * Save error logs to storage
   */
  private async saveErrorLogs(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorLogs));
    } catch (error) {
      console.warn('Failed to save error logs:', error);
    }
  }

  /**
   * Classify error type based on error properties
   */
  public classifyError(error: Error | any): ErrorType {
    if (!error) return 'UNKNOWN_ERROR';

    const errorMessage = error.message?.toLowerCase() || '';
    const errorName = error.name?.toLowerCase() || '';

    // Network errors
    if (
      errorMessage.includes('network') ||
      errorMessage.includes('connection') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('offline') ||
      errorName === 'networkerror' ||
      error.code === 'NETWORK_ERROR'
    ) {
      return 'NETWORK_ERROR';
    }

    // Timeout errors
    if (
      errorMessage.includes('timeout') ||
      errorMessage.includes('time out') ||
      errorName === 'timeout' ||
      error.code === 'ECONNABORTED'
    ) {
      return 'TIMEOUT_ERROR';
    }

    // Server errors (5xx)
    if (
      error.response?.status >= 500 ||
      errorMessage.includes('server error') ||
      errorMessage.includes('internal server error') ||
      errorMessage.includes('bad gateway') ||
      errorMessage.includes('service unavailable')
    ) {
      return 'SERVER_ERROR';
    }

    // Client errors (4xx)
    if (
      error.response?.status >= 400 && error.response?.status < 500 &&
      error.response?.status !== 401 && error.response?.status !== 403
    ) {
      return 'CLIENT_ERROR';
    }

    // Authentication errors
    if (
      error.response?.status === 401 ||
      errorMessage.includes('unauthorized') ||
      errorMessage.includes('authentication') ||
      errorMessage.includes('invalid credentials') ||
      error.code === 'INVALID_CREDENTIALS' // Added custom error code check
    ) {
      return 'AUTHENTICATION_ERROR';
    }

    // Permission errors
    if (
      error.response?.status === 403 ||
      errorMessage.includes('permission') ||
      errorMessage.includes('forbidden') ||
      errorMessage.includes('access denied')
    ) {
      return 'PERMISSION_ERROR';
    }

    // Validation errors
    if (
      error.response?.status === 422 ||
      errorMessage.includes('validation') ||
      errorMessage.includes('invalid') ||
      errorMessage.includes('required field') ||
      errorName === 'validationerror'
    ) {
      return 'VALIDATION_ERROR';
    }

    return 'UNKNOWN_ERROR';
  }

  /**
   * Log informational message
   */
  public logInfo(message: string, context?: Record<string, any>): void {
    if (__DEV__) {
      console.log('Info:', message, context);
    }
  }

  /**
   * Log successful operation
   */
  public logSuccess(operation: string, context?: Record<string, any>): void {
    if (__DEV__) {
      console.log('Success:', {
        operation,
        timestamp: Date.now(),
        context,
        success: true
      });
    }
  }

  /**
   * Log error with context
   */
  public async logError(error: Error | any, context?: Record<string, any>): Promise<string> {
    // Handle null or undefined errors
    if (!error) {
      console.warn('logError called with null/undefined error. Use logSuccess for successful operations.');
      error = new Error('Null error passed to logError');
    }
    
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errorType = this.classifyError(error);

    const errorLog: ErrorLog = {
      id: errorId,
      timestamp: Date.now(),
      error: {
        name: error?.name || 'Unknown Error',
        message: error?.message || 'No message provided',
        stack: error?.stack,
      },
      errorType,
      context,
      retryCount: context?.retryCount || 0,
      isResolved: false,
    };

    // Add to logs array
    this.errorLogs.unshift(errorLog);

    // Keep only the most recent logs
    if (this.errorLogs.length > this.MAX_LOGS) {
      this.errorLogs = this.errorLogs.slice(0, this.MAX_LOGS);
    }

    // Save to storage
    await this.saveErrorLogs();

    // Log to console in development
    if (__DEV__) {
      console.log('Error logged:', errorLog);
    }

    return errorId;
  }

  /**
   * Mark error as resolved
   */
  public async markErrorAsResolved(errorId: string): Promise<void> {
    const errorIndex = this.errorLogs.findIndex(log => log.id === errorId);
    if (errorIndex !== -1) {
      this.errorLogs[errorIndex].isResolved = true;
      await this.saveErrorLogs();
    }
  }

  /**
   * Get error logs with optional filtering
   */
  public getErrorLogs(filters?: {
    errorType?: ErrorType;
    isResolved?: boolean;
    limit?: number;
  }): ErrorLog[] {
    let filteredLogs = this.errorLogs;

    if (filters?.errorType) {
      filteredLogs = filteredLogs.filter(log => log.errorType === filters.errorType);
    }

    if (filters?.isResolved !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.isResolved === filters.isResolved);
    }

    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Clear all error logs
   */
  public async clearErrorLogs(): Promise<void> {
    this.errorLogs = [];
    await AsyncStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check if device is online
   */
  public isOnline(): boolean {
    return this.networkStatus.isConnected;
  }

  /**
   * Get current network status
   */
  public getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Generate comprehensive error report
   */
  public generateErrorReport(error: Error | any, errorInfo?: React.ErrorInfo): ErrorReport {
    const Platform = require('react-native').Platform;
    
    const errorReport: ErrorReport = {
      errorId: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      error: {
        name: error.name || 'Unknown Error',
        message: error.message || 'No message provided',
        stack: error.stack,
      },
      context: {
        ...(errorInfo && { errorInfo }),
        networkStatus: this.networkStatus,
      },
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version ? Platform.Version.toString() : 'unknown',
      },
      networkInfo: this.networkStatus,
    };

    return errorReport;
  }

  /**
   * Handle different types of errors with appropriate actions
   */
  public async handleError(error: Error | any, options?: {
    showAlert?: boolean;
    retry?: () => Promise<void>;
    maxRetries?: number;
    retryCount?: number;
  }): Promise<void> {
    const errorType = this.classifyError(error);
    const _errorId = await this.logError(error, options);

    // Handle specific error types
    switch (errorType) {
      case 'NETWORK_ERROR':
        await this.handleNetworkError(error, options);
        break;
      case 'TIMEOUT_ERROR':
        await this.handleTimeoutError(error, options);
        break;
      case 'SERVER_ERROR':
        await this.handleServerError(error, options);
        break;
      case 'CLIENT_ERROR':
        await this.handleClientError(error, options);
        break;
      case 'VALIDATION_ERROR':
        await this.handleValidationError(error, options);
        break;
      case 'PERMISSION_ERROR':
        await this.handlePermissionError(error, options);
        break;
      case 'AUTHENTICATION_ERROR':
        await this.handleAuthenticationError(error, options);
        break;
      default:
        await this.handleUnknownError(error, options);
        break;
    }
  }

  /**
   * Handle network errors
   */
  private async handleNetworkError(error: Error | any, options?: any): Promise<void> {
    if (!this.isOnline()) {
      // Device is offline
      if (options?.showAlert) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection and try again.',
          [
            { text: 'OK', onPress: () => {} },
            ...(options?.retry ? [{ text: 'Retry', onPress: options.retry }] : []),
          ]
        );
      }
    } else {
      // Network error while online
      if (options?.retry && (!options.maxRetries || (options.retryCount || 0) < options.maxRetries)) {
        setTimeout(() => {
          options.retry();
        }, 2000); // Retry after 2 seconds
      } else if (options?.showAlert) {
        Alert.alert(
          'Network Error',
          'Unable to connect to the server. Please try again later.',
          [{ text: 'OK', onPress: () => {} }]
        );
      }
    }
  }

  /**
   * Handle timeout errors
   */
  private async handleTimeoutError(error: Error | any, options?: any): Promise<void> {
    if (options?.retry && (!options.maxRetries || (options.retryCount || 0) < options.maxRetries)) {
      setTimeout(() => {
        options.retry();
      }, 3000); // Retry after 3 seconds for timeout
    } else if (options?.showAlert) {
      Alert.alert(
        'Request Timeout',
        'The request took too long to complete. Please try again.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  }

  /**
   * Handle server errors
   */
  private async handleServerError(error: Error | any, options?: any): Promise<void> {
    if (options?.showAlert) {
      Alert.alert(
        'Server Error',
        'The server is currently experiencing issues. Please try again later.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  }

  /**
   * Handle client errors
   */
  private async handleClientError(error: Error | any, options?: any): Promise<void> {
    if (options?.showAlert) {
      Alert.alert(
        'Invalid Request',
        'There was an issue with your request. Please check your input and try again.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  }

  /**
   * Handle validation errors
   */
  private async handleValidationError(error: Error | any, options?: any): Promise<void> {
    if (options?.showAlert) {
      const message = error.message || 'Please check your input and try again.';
      Alert.alert(
        'Validation Error',
        message,
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  }

  /**
   * Handle permission errors
   */
  private async handlePermissionError(error: Error | any, options?: any): Promise<void> {
    if (options?.showAlert) {
      Alert.alert(
        'Access Denied',
        'You do not have permission to perform this action.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  }

  /**
   * Handle authentication errors
   */
  private async handleAuthenticationError(error: Error | any, options?: any): Promise<void> {
    if (options?.showAlert) {
      Alert.alert(
        'Authentication Required',
        error.message || 'Please log in to continue.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  }

  /**
   * Handle unknown errors
   */
  private async handleUnknownError(error: Error | any, options?: any): Promise<void> {
    if (options?.showAlert) {
      Alert.alert(
        'Unexpected Error',
        'An unexpected error occurred. Please try again.',
        [{ text: 'OK', onPress: () => {} }]
      );
    }
  }

  /**
   * Create retry mechanism with exponential backoff
   */
  public createRetryMechanism<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      let retryCount = 0;

      const attemptOperation = async () => {
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          retryCount++;
          
          if (retryCount <= maxRetries) {
            const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff
            await this.logError(error, { retryCount, maxRetries, delay });
            
            setTimeout(attemptOperation, delay);
          } else {
            await this.logError(error, { retryCount, maxRetries, failed: true });
            reject(error);
          }
        }
      };

      attemptOperation();
    });
  }
}

// Export singleton instance
export const errorService = ErrorService.getInstance();
export default errorService;
export type {ErrorLog, ErrorReport, NetworkStatus};
