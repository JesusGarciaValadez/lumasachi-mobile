import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {ProfileScreenProps} from '../types/navigation';
import {useAuth} from '../hooks/useAuth';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import DetailRow from '../components/DetailRow';
import {translateRole} from '../utils/roleTranslations';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';

const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const {user, logout, isLoading} = useAuth();
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    
    try {
      clearError();
      
      Alert.alert(
        t('auth.logout') as string,
        t('auth.logoutConfirm') as string,
        [
          {
            text: t('common.cancel') as string,
            style: 'cancel',
          },
          {
            text: t('auth.logout') as string,
            style: 'destructive',
            onPress: async () => {
              setIsLoggingOut(true);
              try {
                await logout();
                
                errorService.logSuccess('logout', {
                  component: 'ProfileScreen',
                  userId: user?.id,
                });
              } catch (error) {
                await errorService.logError(error as Error, {
                  component: 'ProfileScreen',
                  operation: 'logout',
                  userId: user?.id,
                });
                handleError(error as Error);
              } finally {
                setIsLoggingOut(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'ProfileScreen',
        operation: 'logoutDialog',
        userId: user?.id,
      });
      handleError(error as Error);
    }
  };

  const handleNavigateToSettings = async () => {
    try {
      clearError();
      navigation.navigate('Settings');
      
      errorService.logSuccess('navigateToSettings', {
        component: 'ProfileScreen',
        userId: user?.id,
      });
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'ProfileScreen',
        operation: 'navigateToSettings',
        userId: user?.id,
      });
      handleError(error as Error);
    }
  };

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user?.firstName} {user?.lastName}
          </Text>
          <Text style={styles.userRole}>{user?.role ? translateRole(user.role, (key: string) => t(key) as string) : ''}</Text>
        </View>

        {hasError && (
          <ErrorMessage 
            error={error}
            onRetry={clearError}
            onDismiss={clearError}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo') as string}</Text>
          <View style={styles.card}>
            <DetailRow label={t('profile.email') as string} value={user?.email || ''} valueFlex={2} />
            <DetailRow label={t('profile.phone') as string} value={user?.phoneNumber || ''} valueFlex={2} />
            <DetailRow label={t('profile.address') as string} value={user?.address || ''} valueFlex={2} />
            <DetailRow label={t('profile.company') as string} value={user?.company || ''} valueFlex={2} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.configuration') as string}</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleNavigateToSettings}>
            <Text style={styles.actionButtonText}>{t('profile.configuration') as string}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              styles.logoutButton,
              (isLoggingOut || isLoading) && styles.disabledButton
            ]}
            onPress={handleLogout}
            disabled={isLoggingOut || isLoading}>
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              {isLoggingOut || isLoading ? t('auth.loggingOut') as string : t('auth.logout') as string}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 30,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  userRole: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },

  actionButton: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
  },
  logoutButtonText: {
    color: '#ffffff',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ProfileScreen; 