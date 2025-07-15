import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {HomeScreenProps} from '../types/navigation';
import {useAuth} from '../hooks/useAuth';
import {useOrderStats} from '../hooks/useOrderStats';
import {useTranslation} from 'react-i18next';
import {translateRole} from '../utils/roleTranslations';

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const {user} = useAuth();
  const {stats, isLoading: statsLoading, error: statsError} = useOrderStats();
  const {t} = useTranslation();

  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder');
  };

  const handleViewOrders = () => {
    navigation.navigate('Orders');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.greeting.morning');
    if (hour < 18) return t('home.greeting.afternoon');
    return t('home.greeting.evening');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          {getWelcomeMessage()}, {user?.firstName || t('home.user')}
        </Text>
        <Text style={styles.roleText}>
          {user?.role ? translateRole(user.role, t) : t('home.user')}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCreateOrder}>
          <Text style={styles.actionButtonText}>{t('home.createOrder')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewOrders}>
          <Text style={styles.actionButtonText}>{t('home.viewOrders')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewProfile}>
          <Text style={styles.actionButtonText}>{t('home.viewProfile')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>{t('home.summary')}</Text>
        
        {statsLoading ? (
          <View style={[styles.summaryCard, styles.loadingCard]}>
            <ActivityIndicator size="small" color="#007AFF" />
            <Text style={styles.loadingText}>{t('app.loading')}</Text>
          </View>
        ) : statsError ? (
          <View style={styles.summaryCard}>
            <Text style={styles.errorText}>{t('home.error.generic')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('home.activeOrders')}</Text>
              <Text style={styles.summaryValue}>{stats.activeOrders}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{t('home.completedOrders')}</Text>
              <Text style={styles.summaryValue}>{stats.completedOrders}</Text>
            </View>
          </>
        )}
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
    padding: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  roleText: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  quickActions: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
  },
  actionButton: {
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
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
    textAlign: 'center',
  },
  summary: {
    margin: 20,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  summaryLabel: {
    fontSize: 16,
    color: '#333333',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  loadingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
    marginLeft: 10,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
});

export default HomeScreen; 