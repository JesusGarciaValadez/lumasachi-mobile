import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useState} from 'react';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {changeLanguage} from '../i18n';
import {version} from '../../package.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {queryClient} from '../services/queryClient';
import {STORAGE_KEYS} from '../constants';
import {SettingRow} from '../components';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';

const SettingsScreen: React.FC = () => {
  const {t, i18n} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleNotificationToggle = async (value: boolean) => {
    try {
      clearError();
      setNotificationsEnabled(value);
      
      errorService.logSuccess('notificationToggle', {
        component: 'SettingsScreen',
        value,
      });
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'SettingsScreen',
        operation: 'notificationToggle',
        value,
      });
      handleError(error as Error);
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    try {
      clearError();
      setDarkModeEnabled(value);
      
      errorService.logSuccess('darkModeToggle', {
        component: 'SettingsScreen',
        value,
      });
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'SettingsScreen',
        operation: 'darkModeToggle',
        value,
      });
      handleError(error as Error);
    }
  };

  const handleLanguageChange = async () => {
    try {
      clearError();
      const currentLanguage = i18n.language;
      const newLanguage = currentLanguage === 'es' ? 'en' : 'es';
      const languageName = t(`settings.languageNames.${newLanguage}`) as string;
      
      Alert.alert(
        t('settings.language') as string,
        `${t('settings.languageDesc') as string} ${languageName}?`,
        [
          {text: t('common.cancel') as string, style: 'cancel'},
          {
            text: t('common.confirm') as string,
            onPress: async () => {
              try {
                changeLanguage(newLanguage);
                
                errorService.logSuccess('languageChange', {
                  component: 'SettingsScreen',
                  newLanguage,
                });
              } catch (error) {
                await errorService.logError(error as Error, {
                  component: 'SettingsScreen',
                  operation: 'languageChange',
                  newLanguage,
                });
                handleError(error as Error);
              }
            },
          },
        ]
      );
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'SettingsScreen',
        operation: 'languageChange',
      });
      handleError(error as Error);
    }
  };

  const handleClearCache = async () => {
    try {
      clearError();
      
      Alert.alert(
        t('settings.clearCache') as string,
        t('settings.clearCacheConfirm') as string,
        [
          {text: t('common.cancel') as string, style: 'cancel'},
          {
            text: t('settings.clearCache') as string, 
            onPress: async () => {
              try {
                // Clear TanStack Query cache
                await queryClient.clear();
                
                // Clear AsyncStorage data (excluding theme and language to preserve user preferences)
                const keysToRemove = [
                  STORAGE_KEYS.AUTH_TOKEN,
                  STORAGE_KEYS.REFRESH_TOKEN,
                  STORAGE_KEYS.USER_DATA,
                  'user', // Additional key used by useAuth hook
                ];
                
                await AsyncStorage.multiRemove(keysToRemove);
                
                // Clear axios cache (if any)
                // The HTTP client doesn't have persistent cache, but we clear query cache above
                
                errorService.logSuccess('clearCache', {
                  component: 'SettingsScreen',
                  keysRemoved: keysToRemove.length,
                });
                
                Alert.alert(
                  t('common.success') as string,
                  t('settings.clearCacheSuccess') as string
                );
              } catch (error) {
                await errorService.logError(error as Error, {
                  component: 'SettingsScreen',
                  operation: 'clearCache',
                });
                handleError(error as Error);
              }
            }
          },
        ]
      );
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'SettingsScreen',
        operation: 'clearCache',
      });
      handleError(error as Error);
    }
  };

  const getCurrentLanguageLabel = () => {
    return t(`settings.languageNames.${i18n.language}`) as string;
  };

  const handleTermsPress = async () => {
    try {
      clearError();
      // Terms functionality to be implemented
      
      errorService.logSuccess('termsPress', {
        component: 'SettingsScreen',
      });
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'SettingsScreen',
        operation: 'termsPress',
      });
      handleError(error as Error);
    }
  };

  const handlePrivacyPress = async () => {
    try {
      clearError();
      // Privacy policy functionality to be implemented
      
      errorService.logSuccess('privacyPress', {
        component: 'SettingsScreen',
      });
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'SettingsScreen',
        operation: 'privacyPress',
      });
      handleError(error as Error);
    }
  };

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        {hasError && (
          <ErrorMessage 
            error={error}
            onRetry={clearError}
            onDismiss={clearError}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.notifications') as string}</Text>
          <View style={styles.card}>
            <SettingRow
              title={t('settings.pushNotifications') as string}
              subtitle={t('settings.pushNotificationsDesc') as string}
              showSwitch={true}
              switchValue={notificationsEnabled}
              onSwitchToggle={handleNotificationToggle}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.appearance') as string}</Text>
          <View style={styles.card}>
            <SettingRow
              title={t('settings.darkMode') as string}
              subtitle={t('settings.darkModeDesc') as string}
              showSwitch={true}
              switchValue={darkModeEnabled}
              onSwitchToggle={handleDarkModeToggle}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.language') as string}</Text>
          <View style={styles.card}>
            <SettingRow
              title={t('settings.language') as string}
              subtitle={t('settings.languageDesc') as string}
              onPress={handleLanguageChange}
              showValue={getCurrentLanguageLabel()}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.data') as string}</Text>
          <View style={styles.card}>
            <SettingRow
              title={t('settings.clearCache') as string}
              subtitle={t('settings.clearCacheDesc') as string}
              onPress={handleClearCache}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.information') as string}</Text>
          <View style={styles.card}>
            <SettingRow
              title={t('settings.version') as string}
              subtitle={version}
            />
            <SettingRow
              title={t('settings.termsAndConditions') as string}
              onPress={handleTermsPress}
            />
            <SettingRow
              title={t('settings.privacyPolicy') as string}
              onPress={handlePrivacyPress}
            />
          </View>
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
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },

});

export default SettingsScreen; 