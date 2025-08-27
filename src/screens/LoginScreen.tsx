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
// import ErrorMessage from '../components/ErrorMessage';
import OfflineIndicator from '../components/OfflineIndicator';
import LogoImage from '../components/LogoImage';
import Toast from 'react-native-toast-message';
// import {useNavigation} from '@react-navigation/native';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [_error, setError] = useState<Error | null>(null);
  const {login} = useAuth();
  const {t} = useTranslation();
  const {handleError} = useErrorHandler({ showAlert: false });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const {isOffline} = useNetworkStatus();
  const [ephemeralError, setEphemeralError] = useState<string | null>(null);
  const [ephemeralVisible, setEphemeralVisible] = useState(false);
  const showEphemeral = (() => {
    let hideTimer: NodeJS.Timeout | null = null;
    return (message: string) => {
      // reset previous timer if any
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      setEphemeralError(message);
      // force toggle to ensure re-render when same message repeats
      setEphemeralVisible(false);
      setTimeout(() => setEphemeralVisible(true), 0);
      hideTimer = setTimeout(() => setEphemeralVisible(false), 6000);
    };
  })();
  // const _navigation = useNavigation();

  const localizeAuthError = (err: any): string => {
    const errors = (err?.errors || {}) as Record<string, string[] | string>;
    const rawMsg = String(err?.serverMessage || err?.message || '').toLowerCase();

    // Field-specific
    if (errors.email || rawMsg.includes('email field is required')) {
      return t('auth.errors.emailRequired');
    }
    if (errors.password || rawMsg.includes('password field is required')) {
      return t('auth.errors.passwordRequired');
    }

    // Invalid credentials
    if (err?.code === 'INVALID_CREDENTIALS' || rawMsg.includes('provided credentials are incorrect')) {
      return t('auth.errors.invalidCredentials');
    }

    return t('common.errors.unexpectedError');
  };

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
    setFieldErrors({});
    
    try {
      await login(email, password);
    } catch (error) {
      const err = error as any;
      const errors = (err?.errors || {}) as Record<string, string[] | string>;

      // Prefer field-level errors if present
      const nextFieldErrors: { email?: string; password?: string; general?: string } = {};
      if (errors.email) {
        nextFieldErrors.email = t('auth.errors.emailRequired');
      }
      if (errors.password) {
        nextFieldErrors.password = t('auth.errors.passwordRequired');
      }
      // Always capture backend/general message
      const backendMessage = err?.serverMessage || (err instanceof Error ? err.message : '') || '';
      const friendlyGeneral = localizeAuthError(err) || backendMessage || undefined;
      if (friendlyGeneral) {
        nextFieldErrors.general = friendlyGeneral;
      }
      setFieldErrors(nextFieldErrors);

      // Build banner message from field or general errors
      const fieldsMessage = [nextFieldErrors.email, nextFieldErrors.password]
        .filter(Boolean)
        .join('\n');
      const bannerMessage = fieldsMessage || nextFieldErrors.general || backendMessage || t('auth.errors.invalidCredentials');

      // Show banner first (ensure visible even if loader overlay is present)
      showEphemeral(bannerMessage);
      Toast.show({ type: 'error', text1: bannerMessage, position: 'bottom', visibilityTime: 6000 });

      const loginError = new Error(bannerMessage);
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
            
            {/* Removed inline ErrorMessage to avoid LogBox and centralize errors in banner/fields */}

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
            {!!fieldErrors.email && (
              <Text style={styles.inputErrorText}>{fieldErrors.email}</Text>
            )}
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
            {!!fieldErrors.password && (
              <Text style={styles.inputErrorText}>{fieldErrors.password}</Text>
            )}
          </View>

          {ephemeralVisible && !!ephemeralError && (
            <View style={styles.ephemeralCard}>
              <Text style={styles.ephemeralIcon}>⚠️</Text>
              <Text style={styles.ephemeralText}>{ephemeralError}</Text>
            </View>
          )}

          {!!fieldErrors.general && (
            <Text style={styles.generalErrorText}>{fieldErrors.general}</Text>
          )}

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
  inputErrorText: {
    color: '#dc3545',
    marginTop: 6,
    fontSize: 13,
  },
  generalErrorText: {
    color: '#dc3545',
    marginBottom: 8,
    textAlign: 'center',
  },
  ephemeralContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
  },
  inlineBannerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  ephemeralCard: {
    backgroundColor: '#FFF5F5',
    borderLeftColor: '#FF6B6B',
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  ephemeralIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  ephemeralText: {
    flex: 1,
    color: '#2D3748',
    fontSize: 14,
    lineHeight: 20,
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