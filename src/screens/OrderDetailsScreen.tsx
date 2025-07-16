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
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import DetailRow from '../components/DetailRow';
import {getStatusTranslation} from '../utils/roleTranslations';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderStatus, setOrderStatus] = useState<Status | null>(null);
  const [customer, setCustomer] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        clearError();
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
            firstName: t('common.mockData.customerFirstName') as string,
            lastName: t('common.mockData.customerLastName') as string,
            email: t('common.mockData.customerEmail') as string,
            role: UserRole.CUSTOMER,
            address: t('common.mockData.customerAddress') as string,
            phoneNumber: '+1234567890',
            company: t('common.mockData.demoCompany') as string,
            isActive: true,
            languagePreference: 'es',
            customerNotes: t('common.mockData.vipCustomer') as string,
            customerType: 'corporate',
            isCustomer: true,
            isEmployee: false,
            createdAt: new Date('2024-01-10T10:00:00Z'),
            updatedAt: new Date('2024-01-15T14:30:00Z'),
          },
          title: t('common.mockData.testOrder') as string,
          description: t('common.mockData.testOrderDescription') as string,
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
          firstName: t('common.mockData.customerFirstName') as string,
          lastName: t('common.mockData.customerLastName') as string,
          email: t('common.mockData.customerEmail') as string,
          role: UserRole.CUSTOMER,
          address: t('common.mockData.customerAddress') as string,
          phoneNumber: '+1234567890',
          company: t('common.mockData.demoCompany') as string,
          isActive: true,
          languagePreference: 'es',
          customerNotes: t('common.mockData.vipCustomer') as string,
          customerType: 'corporate',
          isCustomer: true,
          isEmployee: false,
          createdAt: new Date('2024-01-10T10:00:00Z'),
          updatedAt: new Date('2024-01-15T14:30:00Z'),
        });
        
        await errorService.logError(null, {
          component: 'OrderDetailsScreen',
          operation: 'loadOrderData',
          success: true,
          orderId,
        });
      } catch (error) {
        await errorService.logError(error as Error, {
          component: 'OrderDetailsScreen',
          operation: 'loadOrderData',
          orderId,
        });
        handleError(error as Error);
      } finally {
        setLoading(false);
      }
    };

    loadOrderData();
  }, [orderId, t, handleError, clearError]);

  const handleEditOrder = () => {
    try {
      navigation.navigate('EditOrder', {orderId});
      errorService.logError(null, {
        component: 'OrderDetailsScreen',
        operation: 'navigateToEdit',
        success: true,
        orderId,
      });
    } catch (error) {
      errorService.logError(error as Error, {
        component: 'OrderDetailsScreen',
        operation: 'navigateToEdit',
        orderId,
      });
      handleError(error as Error);
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
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{t('common.loading') as string}</Text>
          </View>
        ) : (
          <>
            {hasError && (
              <ErrorMessage 
                error={error}
                onRetry={clearError}
                onDismiss={clearError}
              />
            )}

            <View style={styles.header}>
              <Text style={styles.orderId}>{t('orders.order') as string} #{orderId}</Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditOrder}>
                <Text style={styles.editButtonText}>{t('common.edit') as string}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('orders.generalInfo') as string}</Text>
              <View style={styles.card}>
                <DetailRow 
                  label={t('orders.status') as string} 
                  value={orderStatus ? t(getStatusTranslation(orderStatus.statusName)) as string : '-'} 
                />
                <DetailRow 
                  label={t('orders.customer') as string} 
                  value={getCustomerName()} 
                />
                <DetailRow 
                  label={t('orders.priority') as string} 
                  value={order?.priority || '-'} 
                />
                <DetailRow 
                  label={t('orders.createdAt') as string} 
                  value={order?.createdAt ? formatDate(order.createdAt) : '-'} 
                />
                <DetailRow 
                  label={t('orders.updatedAt') as string} 
                  value={order?.updatedAt ? formatDate(order.updatedAt) : '-'} 
                />
              </View>
            </View>

            {customerInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('orders.customerInfo') as string}</Text>
                <View style={styles.card}>
                  <DetailRow 
                    label={t('common.name') as string} 
                    value={customerInfo.name} 
                  />
                  <DetailRow 
                    label={t('common.email') as string} 
                    value={customerInfo.email} 
                  />
                  {customerInfo.company && (
                    <DetailRow 
                      label={t('common.company') as string} 
                      value={customerInfo.company} 
                    />
                  )}
                  {customerInfo.phone && (
                    <DetailRow 
                      label={t('common.phone') as string} 
                      value={customerInfo.phone} 
                    />
                  )}
                  {customerInfo.type && (
                    <DetailRow 
                      label={t('orders.customerType') as string} 
                      value={customerInfo.type === 'corporate' 
                        ? t('common.customerTypes.corporate') as string 
                        : t('common.customerTypes.individual') as string} 
                    />
                  )}
                  {customerInfo.notes && (
                    <DetailRow 
                      label={t('orders.customerNotes') as string} 
                      value={customerInfo.notes} 
                    />
                  )}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('orders.description') as string}</Text>
              <View style={styles.card}>
                <Text style={styles.description}>
                  {order?.description || t('orders.descriptionPlaceholder') as string}
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </ErrorBoundary>
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