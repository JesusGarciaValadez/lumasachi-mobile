import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {changeLanguage} from '../i18n';
import {version} from '../../package.json';

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
        {text: t('settings.clearCache'), onPress: () => console.log('Cache cleared')},
      ]
    );
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'es' ? 'Español' : 'English';
  };

  const SettingRow = ({
    title,
    subtitle,
    showSwitch = false,
    switchValue,
    onSwitchToggle,
    onPress,
    showValue,
  }: {
    title: string;
    subtitle?: string;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchToggle?: (value: boolean) => void;
    onPress?: () => void;
    showValue?: string;
  }) => (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      disabled={showSwitch}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showSwitch && (
        <Switch
          value={switchValue}
          onValueChange={onSwitchToggle}
          trackColor={{false: '#767577', true: '#007AFF'}}
          thumbColor={switchValue ? '#ffffff' : '#f4f3f4'}
        />
      )}
      {showValue && (
        <Text style={styles.settingValue}>{showValue}</Text>
      )}
    </TouchableOpacity>
  );

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
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default SettingsScreen; 