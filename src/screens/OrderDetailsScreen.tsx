import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {OrderDetailsScreenProps} from '../types/navigation';
import {useTranslation} from 'react-i18next';

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;
  const {t} = useTranslation();

  const handleEditOrder = () => {
    navigation.navigate('EditOrder', {orderId});
  };

  const DetailRow = ({label, value}: {label: string; value: string}) => (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}:</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>{t('orders.order')} #{orderId}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditOrder}>
          <Text style={styles.editButtonText}>{t('common.edit')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('orders.generalInfo')}</Text>
        <View style={styles.card}>
          <DetailRow label={t('orders.status')} value={t('orders.inProgress')} />
          <DetailRow label={t('orders.customer')} value="Cliente Demo" />
          <DetailRow label={t('orders.createdAt')} value="2024-01-15" />
          <DetailRow label={t('orders.updatedAt')} value="2024-01-20" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('orders.description')}</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Esta es una descripción de ejemplo para la orden. Aquí se mostraría
            información detallada sobre lo que se solicita en la orden.
          </Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});

export default OrderDetailsScreen; 