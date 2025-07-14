import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from 'react-native';

interface SettingRowProps {
  title: string;
  subtitle?: string;
  showSwitch?: boolean;
  switchValue?: boolean;
  onSwitchToggle?: (value: boolean) => void;
  onPress?: () => void;
  showValue?: string;
}

const SettingRow: React.FC<SettingRowProps> = ({
  title,
  subtitle,
  showSwitch = false,
  switchValue,
  onSwitchToggle,
  onPress,
  showValue,
}) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={onPress}
    disabled={showSwitch}
    accessibilityRole="button"
    accessibilityLabel={title}
    accessibilityHint={subtitle}>
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
        accessibilityLabel={`${title} toggle`}
      />
    )}
    {!showSwitch && showValue && (
      <Text style={styles.settingValue}>{showValue}</Text>
    )}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
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

export default SettingRow; 