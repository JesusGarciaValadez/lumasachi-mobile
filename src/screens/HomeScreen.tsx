import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {HomeScreenProps} from '../types/navigation';
import {useAuth} from '../hooks/useAuth';

const HomeScreen: React.FC<HomeScreenProps> = ({navigation}) => {
  const {user} = useAuth();

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
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          {getWelcomeMessage()}, {user?.firstName || 'Usuario'}
        </Text>
        <Text style={styles.roleText}>
          {user?.role || 'Usuario'}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleCreateOrder}>
          <Text style={styles.actionButtonText}>Crear Nueva Orden</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewOrders}>
          <Text style={styles.actionButtonText}>Ver Mis Órdenes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewProfile}>
          <Text style={styles.actionButtonText}>Ver Perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summary}>
        <Text style={styles.sectionTitle}>Resumen</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Órdenes Activas</Text>
          <Text style={styles.summaryValue}>0</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Órdenes Completadas</Text>
          <Text style={styles.summaryValue}>0</Text>
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
});

export default HomeScreen; 