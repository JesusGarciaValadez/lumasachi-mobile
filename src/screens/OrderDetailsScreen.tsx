import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
import {OrderDetailsScreenProps} from '../types/navigation';
import {Order, Status, User, UserRole} from '../types';
import {useTranslation} from 'react-i18next';
import DetailRow from '../components/DetailRow';

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;
  const {t} = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderStatus, setOrderStatus] = useState<Status | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        setLoading(true);
        // TODO: Uncomment when backend is implemented
        // const orderData = await fetchOrder(orderId);
        // const statusData = await fetchOrderStatus(orderData.statusId);
        // const customerData = await fetchUser(orderData.customerId);
        // setOrder(orderData);
        // setOrderStatus(statusData);
        // setCustomer(customerData);
        
        // Temporary placeholder data until backend is ready
        setOrder({
          id: orderId,
          customerId: 'customer-123',
          customer: {
            id: 'customer-123',
            firstName: 'Cliente',
            lastName: 'Demo',
            email: 'demo@example.com',
            role: UserRole.CUSTOMER,
            address: '123 Demo Street',
            phoneNumber: '+1234567890',
            company: 'Demo Company',
            isActive: true,
            languagePreference: 'es',
            customerNotes: 'Cliente VIP',
            customerType: 'corporate',
            isCustomer: true,
            isEmployee: false,
            createdAt: new Date('2024-01-10T10:00:00Z'),
            updatedAt: new Date('2024-01-15T14:30:00Z'),
          },
          title: 'Orden de Prueba',
          description: 'Descripción de la orden de prueba',
          status: 'In Progress',
          priority: 'Normal',
          createdAt: new Date('2024-01-15T10:30:00Z'),
          updatedAt: new Date('2024-01-20T14:45:00Z'),
          createdBy: 'admin',
          updatedBy: 'admin',
        });
        setOrderStatus({
          id: 'status-1',
          statusName: 'In Progress',
        });
        setCustomer({
          id: 'customer-123',
          firstName: 'Cliente',
          lastName: 'Demo',
          email: 'demo@example.com',
          role: UserRole.CUSTOMER,
          address: '123 Demo Street',
          phoneNumber: '+1234567890',
          company: 'Demo Company',
          isActive: true,
          languagePreference: 'es',
          customerNotes: 'Cliente VIP',
          customerType: 'corporate',
          isCustomer: true,
          isEmployee: false,
          createdAt: new Date('2024-01-10T10:00:00Z'),
          updatedAt: new Date('2024-01-15T14:30:00Z'),
        });
      } catch (error) {
        console.error('Error loading order data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId]);

  const handleEditOrder = () => {
    navigation.navigate('EditOrder', {orderId});
  };

  const getStatusTranslation = (statusName: string) => {
    switch (statusName) {
      case 'Open':
        return t('orders.statuses.open');
      case 'In Progress':
        return t('orders.statuses.inProgress');
      case 'Ready for delivery':
        return t('orders.statuses.readyForDelivery');
      case 'Delivered':
        return t('orders.statuses.delivered');
      case 'Paid':
        return t('orders.statuses.paid');
      case 'Returned':
        return t('orders.statuses.returned');
      case 'Not paid':
        return t('orders.statuses.notPaid');
      case 'Cancelled':
        return t('orders.statuses.cancelled');
      default:
        return statusName;
    }
  };

  const getCustomerName = () => {
    if (!customer) return '-';
    return `${customer.firstName} ${customer.lastName}`;
  };

  const getCustomerInfo = () => {
    if (!customer) return null;
    return {
      name: `${customer.firstName} ${customer.lastName}`,
      email: customer.email,
      company: customer.company,
      phone: customer.phoneNumber,
      type: customer.customerType,
      notes: customer.customerNotes,
    };
  };

  const formatDate = (date: Date) => {
    return format(date, 'dd/MM/yyyy');
  };

  const customerInfo = getCustomerInfo();

  return (
    <ScrollView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <>
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
              <DetailRow 
                label={t('orders.status')} 
                value={orderStatus ? getStatusTranslation(orderStatus.statusName) : '-'} 
              />
              <DetailRow 
                label={t('orders.customer')} 
                value={getCustomerName()} 
              />
              <DetailRow 
                label={t('orders.priority')} 
                value={order?.priority || '-'} 
              />
              <DetailRow 
                label={t('orders.createdAt')} 
                value={order?.createdAt ? formatDate(order.createdAt) : '-'} 
              />
              <DetailRow 
                label={t('orders.updatedAt')} 
                value={order?.updatedAt ? formatDate(order.updatedAt) : '-'} 
              />
            </View>
          </View>

          {customerInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('orders.customerInfo')}</Text>
              <View style={styles.card}>
                <DetailRow 
                  label={t('common.name')} 
                  value={customerInfo.name} 
                />
                <DetailRow 
                  label={t('common.email')} 
                  value={customerInfo.email} 
                />
                {customerInfo.company && (
                  <DetailRow 
                    label={t('common.company')} 
                    value={customerInfo.company} 
                  />
                )}
                {customerInfo.phone && (
                  <DetailRow 
                    label={t('common.phone')} 
                    value={customerInfo.phone} 
                  />
                )}
                {customerInfo.type && (
                  <DetailRow 
                    label={t('orders.customerType')} 
                    value={customerInfo.type} 
                  />
                )}
                {customerInfo.notes && (
                  <DetailRow 
                    label={t('orders.customerNotes')} 
                    value={customerInfo.notes} 
                  />
                )}
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('orders.description')}</Text>
            <View style={styles.card}>
              <Text style={styles.description}>
                {order?.description || t('orders.descriptionPlaceholder')}
              </Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
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
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
});

export default OrderDetailsScreen; 