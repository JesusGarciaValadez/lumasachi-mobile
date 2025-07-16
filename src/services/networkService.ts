import NetInfo from '@react-native-community/netinfo';
import { errorService } from './errorService';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
  details?: any;
}

class NetworkService {
  private listeners: ((state: NetworkState) => void)[] = [];
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
    type: 'none',
  };

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Get initial network state
    NetInfo.fetch().then(state => {
      this.currentState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        details: state.details,
      };
      
      this.notifyListeners();
         }).catch(error => {
       errorService.logError('NetworkService initialization failed', { error: error as Error });
     });

    // Listen for network state changes
    NetInfo.addEventListener(state => {
      const newState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        details: state.details,
      };

      const wasOffline = !this.currentState.isConnected;
      const isNowOnline = newState.isConnected;

      this.currentState = newState;
      
      // Log network state changes
      if (wasOffline && isNowOnline) {
        errorService.logInfo('Network connection restored');
      } else if (!wasOffline && !isNowOnline) {
        errorService.logInfo('Network connection lost');
      }

      this.notifyListeners();
    });
  }

  /**
   * Get current network state
   */
  getCurrentState(): NetworkState {
    return this.currentState;
  }

  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return this.currentState.isConnected && 
           (this.currentState.isInternetReachable !== false);
  }

  /**
   * Check if device is offline
   */
  isOffline(): boolean {
    return !this.isOnline();
  }

  /**
   * Add listener for network state changes
   */
  addListener(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners = [];
  }

  /**
   * Refresh network state
   */
  async refresh(): Promise<NetworkState> {
    try {
      const state = await NetInfo.refresh();
      
      this.currentState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type,
        details: state.details,
      };
      
      this.notifyListeners();
      return this.currentState;
         } catch (error) {
       errorService.logError('Network refresh failed', { error: error as Error });
       throw error;
     }
  }

  /**
   * Wait for network connection
   */
  async waitForConnection(timeout: number = 30000): Promise<boolean> {
    return new Promise((resolve) => {
      if (this.isOnline()) {
        resolve(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);

      const unsubscribe = this.addListener((state) => {
        if (state.isConnected && state.isInternetReachable !== false) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(true);
        }
      });
    });
  }

  /**
   * Check if network error should trigger offline handling
   */
  shouldTriggerOfflineHandling(error: any): boolean {
    if (this.isOffline()) {
      return true;
    }

    // Check for common network error patterns
    const networkErrorPatterns = [
      /network request failed/i,
      /network error/i,
      /connection failed/i,
      /unable to connect/i,
      /connection timeout/i,
      /no internet/i,
      /offline/i,
    ];

    const errorMessage = error?.message || error?.toString() || '';
    
    return networkErrorPatterns.some(pattern => 
      pattern.test(errorMessage)
    );
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentState);
             } catch (error) {
         errorService.logError('Network listener error', { error: error as Error });
       }
    });
  }
}

export const networkService = new NetworkService(); 