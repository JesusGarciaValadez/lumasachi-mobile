import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../hooks/useAuth';
import {useTranslation} from 'react-i18next';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {useNetworkStatus} from '../hooks/useNetworkStatus';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import OfflineIndicator from '../components/OfflineIndicator';
import LogoImage from '../components/LogoImage';
import {useNavigation} from '@react-navigation/native';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const {login} = useAuth();
  const {t} = useTranslation();
  const {handleError} = useErrorHandler();
  const {isOffline} = useNetworkStatus();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('common.error'), t('auth.errors.missingFields'));
      return;
    }

    // Check network connectivity
    if (isOffline) {
      const offlineError = new Error(t('common.errors.networkError'));
      setError(offlineError);
      handleError(offlineError);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await login(email, password);
      // RootNavigator renders 'Main' when authenticated, which contains the 'Home' tab
      navigation.navigate('Main' as never);
    } catch (error) {
      const loginError = error instanceof Error 
        ? error 
        : new Error(t('auth.errors.invalidCredentials'));
      
      setError(loginError);
      handleError(loginError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      t('auth.forgotPasswordTitle'),
      t('auth.forgotPasswordMessage')
    );
  };

  return (
    <ErrorBoundary>
      <KeyboardAvoidingView
        testID="login-screen"
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <OfflineIndicator />
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <LogoImage />
            <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
            
            {error && (
              <ErrorMessage
                error={error}
                onRetry={handleLogin}
                onDismiss={() => setError(null)}
                style={styles.errorMessage}
              />
            )}

          <View style={styles.inputContainer}>
            <TextInput
              testID="login-email-input"
              style={[styles.input, isLoading && styles.inputDisabled]}
              placeholder={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              testID="login-password-input"
              style={[styles.input, isLoading && styles.inputDisabled]}
              placeholder={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <TouchableOpacity
            testID="login-submit-button"
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}>
            <View style={styles.buttonContent}>
              {isLoading && (
                <ActivityIndicator
                  size="small"
                  color="#ffffff"
                  style={styles.spinner}
                />
              )}
              <Text style={styles.buttonText}>
                {isLoading ? t('auth.loggingIn') : t('auth.login')}
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={isLoading}>
            <Text style={styles.forgotPasswordText}>
              {t('auth.forgotPassword')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>
              {t('auth.loggingIn')}
            </Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#007AFF',
  },
  errorMessage: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  inputDisabled: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999999',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spinner: {
    marginRight: 10,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  forgotPasswordButton: {
    marginTop: 20,
    alignItems: 'center',
    padding: 10,
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginScreen; 