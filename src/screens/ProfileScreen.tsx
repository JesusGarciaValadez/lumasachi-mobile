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
import {useTranslation} from 'react-i18next';

const ProfileScreen: React.FC<ProfileScreenProps> = ({navigation}) => {
  const {user, logout, isLoading} = useAuth();
  const {t} = useTranslation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut) return;
    
    Alert.alert(
      t('auth.logout'),
      t('auth.logoutConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('auth.logout'),
          style: 'destructive',
          onPress: async () => {
            setIsLoggingOut(true);
            try {
              await logout();
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const InfoRow = ({label, value}: {label: string; value: string}) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
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
        <Text style={styles.userRole}>{user?.role}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
        <View style={styles.card}>
          <InfoRow label={t('profile.email')} value={user?.email || ''} />
          <InfoRow label={t('profile.phone')} value={user?.phoneNumber || ''} />
          <InfoRow label={t('profile.address')} value={user?.address || ''} />
          <InfoRow label={t('profile.company')} value={user?.company || ''} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('profile.configuration')}</Text>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.actionButtonText}>{t('profile.configuration')}</Text>
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
            {isLoggingOut || isLoading ? t('auth.loggingOut') : t('auth.logout')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#666666',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
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