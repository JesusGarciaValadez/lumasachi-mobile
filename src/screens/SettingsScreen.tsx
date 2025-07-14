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

const SettingsScreen: React.FC = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
  };

  const handleClearCache = () => {
    Alert.alert(
      'Limpiar Cache',
      '¿Estás seguro de que quieres limpiar el cache?',
      [
        {text: 'Cancelar', style: 'cancel'},
        {text: 'Limpiar', onPress: () => console.log('Cache cleared')},
      ]
    );
  };

  const SettingRow = ({
    title,
    subtitle,
    showSwitch = false,
    switchValue,
    onSwitchToggle,
    onPress,
  }: {
    title: string;
    subtitle?: string;
    showSwitch?: boolean;
    switchValue?: boolean;
    onSwitchToggle?: (value: boolean) => void;
    onPress?: () => void;
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
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notificaciones</Text>
        <View style={styles.card}>
          <SettingRow
            title="Notificaciones Push"
            subtitle="Recibir notificaciones de nuevas órdenes"
            showSwitch={true}
            switchValue={notificationsEnabled}
            onSwitchToggle={handleNotificationToggle}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apariencia</Text>
        <View style={styles.card}>
          <SettingRow
            title="Modo Oscuro"
            subtitle="Activar tema oscuro"
            showSwitch={true}
            switchValue={darkModeEnabled}
            onSwitchToggle={handleDarkModeToggle}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos</Text>
        <View style={styles.card}>
          <SettingRow
            title="Limpiar Cache"
            subtitle="Eliminar datos temporales"
            onPress={handleClearCache}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.card}>
          <SettingRow
            title="Versión"
            subtitle="1.0.0"
          />
          <SettingRow
            title="Términos y Condiciones"
            onPress={() => console.log('Terms pressed')}
          />
          <SettingRow
            title="Política de Privacidad"
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 5,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
});

export default SettingsScreen; 