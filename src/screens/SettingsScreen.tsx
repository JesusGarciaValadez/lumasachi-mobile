import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {changeLanguage} from '../i18n';
import {version} from '../../package.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {queryClient} from '../services/queryClient';
import {STORAGE_KEYS} from '../constants';
import {SettingRow} from '../components';

const SettingsScreen: React.FC = () => {
  const {t, i18n} = useTranslation();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
  };

  const handleLanguageChange = () => {
    const currentLanguage = i18n.language;
    const newLanguage = currentLanguage === 'es' ? 'en' : 'es';
    const languageName = newLanguage === 'es' ? 'Español' : 'English';
    
    Alert.alert(
      t('settings.language'),
      `${t('settings.languageDesc')} ${languageName}?`,
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.confirm'),
          onPress: () => {
            changeLanguage(newLanguage);
          },
        },
      ]
    );
  };

  const handleClearCache = () => {
    Alert.alert(
      t('settings.clearCache'),
      t('settings.clearCacheConfirm'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('settings.clearCache'), 
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
              
              Alert.alert(
                t('common.success'),
                t('settings.clearCacheSuccess')
              );
            } catch (error) {
              console.error('Error clearing cache:', error);
              Alert.alert(
                t('common.error'),
                t('settings.clearCacheError')
              );
            }
          }
        },
      ]
    );
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'es' ? 'Español' : 'English';
  };



  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.card}>
          <SettingRow
            title={t('settings.pushNotifications')}
            subtitle={t('settings.pushNotificationsDesc')}
            showSwitch={true}
            switchValue={notificationsEnabled}
            onSwitchToggle={handleNotificationToggle}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.appearance')}</Text>
        <View style={styles.card}>
          <SettingRow
            title={t('settings.darkMode')}
            subtitle={t('settings.darkModeDesc')}
            showSwitch={true}
            switchValue={darkModeEnabled}
            onSwitchToggle={handleDarkModeToggle}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.card}>
          <SettingRow
            title={t('settings.language')}
            subtitle={t('settings.languageDesc')}
            onPress={handleLanguageChange}
            showValue={getCurrentLanguageLabel()}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.data')}</Text>
        <View style={styles.card}>
          <SettingRow
            title={t('settings.clearCache')}
            subtitle={t('settings.clearCacheDesc')}
            onPress={handleClearCache}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('settings.information')}</Text>
        <View style={styles.card}>
          <SettingRow
            title={t('settings.version')}
            subtitle={version}
          />
          <SettingRow
            title={t('settings.termsAndConditions')}
            onPress={() => console.log('Terms pressed')}
          />
          <SettingRow
            title={t('settings.privacyPolicy')}
            onPress={() => console.log('Privacy pressed')}
          />
        </View>
      </View>
    </ScrollView>
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