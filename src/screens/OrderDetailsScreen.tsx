import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { format } from 'date-fns';
// removed locales; fixed output format to numeric month
import {OrderDetailsScreenProps} from '../types/navigation';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import DetailRow from '../components/DetailRow';
import {getStatusTranslation} from '../utils/roleTranslations';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';
import { useOrders } from '../hooks/useOrders';

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const { orders, ensureLoaded } = useOrders();

  const order = useMemo(() => orders.find(o => String(o.id) === String(orderId)) || null, [orders, orderId]);
  const customer = order?.customer || null;
  const loading = !order;

  React.useEffect(() => {
    const run = async () => {
      try {
        clearError();
        await ensureLoaded();
      } catch (err) {
        await errorService.logError(err as Error, {
          component: 'OrderDetailsScreen',
          operation: 'ensureLoaded',
          orderId,
        });
        handleError(err as Error);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureLoaded, orderId]);

  const handleEditOrder = () => {
    try {
      navigation.navigate('EditOrder', {orderId});
      errorService.logSuccess('navigateToEdit', {
        component: 'OrderDetailsScreen',
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

  const _getCustomerName = () => customer?.full_name || '-';

  const translateOrFallback = (key: string, fallback: string) => {
    const translated = t(key) as string;
    return translated === key ? fallback : translated;
  };

  const getCustomerInfo = () => {
    if (!customer) return null;
    const anyCustomer: any = customer as any;
    return {
      name: customer.full_name,
      email: customer.email,
      company: anyCustomer?.company?.name || anyCustomer?.company || '',
      phone: anyCustomer?.phone_number || '',
      type: (customer.type || '').toString(),
      notes: anyCustomer?.notes || '',
    };
  };

  const formatDateTime = (dateString?: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  };

  const statusLedColor = useMemo(() => {
    switch (order?.status) {
      case 'Open':
        return '#74B9FF';
      case 'In Progress':
        return '#007AFF';
      case 'Ready for delivery':
      case 'Completed':
      case 'Delivered':
        return '#34C759';
      case 'Paid':
        return '#66D17A';
      default:
        return null;
    }
  }, [order?.status]);

  const priorityTranslationKey = (priority?: string) => {
    const map: Record<string, string> = {
      Low: 'orders.priorities.low',
      Normal: 'orders.priorities.normal',
      High: 'orders.priorities.high',
      Urgent: 'orders.priorities.urgent',
    };
    return priority ? map[priority] || 'orders.priorities.normal' : '';
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'Low':
        return '#34C759';
      case 'Normal':
        return '#FFD60A';
      case 'High':
        return '#FF9500';
      case 'Urgent':
        return '#FF3B30';
      default:
        return '#FFD60A';
    }
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
              <Text style={styles.pageTitle}>{translateOrFallback('orders.order', 'Órden')}</Text>
              <Text style={styles.orderId}>#{orderId}</Text>
              <TouchableOpacity style={styles.editButton} onPress={handleEditOrder}>
                <Text style={styles.editButtonText}>{t('common.edit') as string}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('orders.generalInfo') as string}</Text>
              <View style={styles.card}>
                <View style={styles.detailRowCustom}>
                  <Text style={styles.detailLabel}>{t('orders.status') as string}:</Text>
                  <View style={styles.inlineRight}>
                    <Text style={styles.detailValue}>{t(getStatusTranslation(order?.status || 'Open'))}</Text>
                    {!!statusLedColor && <View style={[styles.statusDot, {backgroundColor: statusLedColor}]} />}
                  </View>
                </View>
                <DetailRow label={t('orders.orderTitle') as string} value={order?.title || ''} />
                <DetailRow label={t('orders.description') as string} value={order?.description || ''} />
                <DetailRow label={t('orders.category') as string} value={order?.category || ''} />
                <View style={styles.detailRowCustom}>
                  <Text style={styles.detailLabel}>{t('orders.priority') as string}:</Text>
                  <View style={styles.inlineRight}>
                    <Text style={styles.detailValue}>{t(priorityTranslationKey(order?.priority))}</Text>
                    <View style={[styles.priorityDot, {backgroundColor: getPriorityColor(order?.priority)}]} />
                  </View>
                </View>
                <DetailRow label={t('orders.createdAt') as string} value={formatDateTime(order?.created_at)} />
                <DetailRow label={t('orders.createdBy') as string} value={order?.created_by?.full_name || ''} />
                <DetailRow label={t('orders.assignedTo') as string} value={order?.assigned_to?.full_name || ''} />
                <DetailRow label={t('orders.updatedAt') as string} value={formatDateTime(order?.updated_at)} />
                {!!order?.estimated_completion && (
                  <DetailRow label={t('orders.estimatedCompletion') as string} value={formatDateTime(order?.estimated_completion)} />
                )}
                {!!order?.actual_completion && (
                  <DetailRow label={t('orders.actualCompletion') as string} value={formatDateTime(order?.actual_completion)} />
                )}
                <DetailRow label={t('orders.notes') as string} value={order?.notes || ''} valueFlex={2} />
              </View>
            </View>

            {customerInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{translateOrFallback('orders.customerInfo', 'Información del Cliente')}</Text>
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
    backgroundColor: '#007AFF',
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
  },
  editButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  editButtonText: {
    color: '#007AFF',
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
  detailRowCustom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  inlineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
});

export default OrderDetailsScreen; 