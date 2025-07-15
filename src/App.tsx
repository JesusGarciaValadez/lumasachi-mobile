/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {StatusBar, ActivityIndicator, View, StyleSheet, Text, TouchableOpacity} from 'react-native';
import {QueryClientProvider} from '@tanstack/react-query';
import {AuthProvider} from './hooks/useAuth';
import RootNavigator from './navigation/RootNavigator';
import './i18n'; // Importar configuración de i18n
import {initializeI18n} from './i18n';
import {TranslationProvider} from './i18n/TranslationProvider';
import {queryClient} from './services/queryClient';

type AppState = 'loading' | 'ready' | 'error';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('loading');
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const MAX_RETRY_ATTEMPTS = 3;
  const RETRY_DELAY = 1000; // 1 second

  const initializeApp = async (attempt: number = 1) => {
    try {
      await initializeI18n();
      setAppState('ready');
      setError(null);
    } catch (error) {
      console.error(`Error initializing i18n (attempt ${attempt}/${MAX_RETRY_ATTEMPTS}):`, error);
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        // Retry after delay
        setTimeout(() => {
          setRetryCount(attempt);
          initializeApp(attempt + 1);
        }, RETRY_DELAY * attempt); // Exponential backoff
      } else {
        // Max retries reached - show error state
        setAppState('error');
        setError('Failed to initialize application. Please check your internet connection and try again.');
      }
    }
  };

  useEffect(() => {
    initializeApp();
  }, []);

  const handleRetry = () => {
    setAppState('loading');
    setRetryCount(0);
    setError(null);
    initializeApp();
  };

  const handleContinueWithDefaults = () => {
    // Continue with default configuration
    setAppState('ready');
    setError(null);
  };

  // Loading state
  if (appState === 'loading') {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>
          Initializing application...
          {retryCount > 0 && ` (Attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`}
        </Text>
      </View>
    );
  }

  // Error state
  if (appState === 'error') {
    return (
      <View style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <Text style={styles.errorTitle}>Initialization Failed</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.continueButton} onPress={handleContinueWithDefaults}>
            <Text style={styles.continueButtonText}>Continue with defaults</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Ready state - normal app flow
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TranslationProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </TranslationProvider>
    </QueryClientProvider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF3B30',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
