import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
// date-fns format not needed; using custom formatter
import { formatDateTimeLocal } from '../utils/datetime';
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
import { orderService, RawOrderHistoryEntry, PaginatedResponse } from '../services/orderService';
import { Attachment } from '../types';

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const { orders, ensureLoaded } = useOrders();
  const [history, setHistory] = useState<RawOrderHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

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

  useEffect(() => {
    if (!order) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        setIsLoadingHistory(true);
        const resp = await orderService.fetchOrderHistory(String(order.id), controller.signal) as PaginatedResponse<RawOrderHistoryEntry>;
        const items = Array.isArray(resp?.data) ? resp.data : [];
        setHistory(items);
      } catch (err) {
        await errorService.logError(err as Error, {
          component: 'OrderDetailsScreen',
          operation: 'fetchOrderHistory',
          orderId,
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };
    load();
    return () => controller.abort();
  }, [order, orderId]);

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

  // customer name utility not needed currently

  const translateOrFallback = (key: string, fallback: string) => {
    const translated = t(key) as string;
    return translated === key ? fallback : translated;
  };

  const renderAttachments = (attachments: Attachment[]) => {
    if (!attachments || attachments.length === 0) {
      return null;
    }

    return (
      <View style={styles.attachmentsContainer}>
        <Text style={styles.attachmentsTitle}>{translateOrFallback('orders.attachments', 'Archivos adjuntos')}:</Text>
        {attachments.map((attachment, index) => (
          <View key={attachment.id || index} style={styles.attachmentItem}>
            <View style={styles.attachmentIcon}>
              <Text style={styles.attachmentIconText}>
                {attachment.isImage ? '📷' : attachment.isDocument ? '📄' : '📎'}
              </Text>
            </View>
            <View style={styles.attachmentInfo}>
              <Text style={styles.attachmentName}>{attachment.fileName}</Text>
              <Text style={styles.attachmentSize}>
                {formatFileSize(attachment.fileSize)} • {attachment.mimeType}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const formatDateTime = (dateString?: string | null) => formatDateTimeLocal(dateString);

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
                    <Text style={styles.detailValue}>{t(getStatusTranslation(order?.status || 'Open')) as string}</Text>
                    {!!statusLedColor && renderLed(getLedTone(statusLedColor))}
                  </View>
                </View>
                <DetailRow label={t('orders.orderTitle') as string} value={order?.title || ''} />
                <DetailRow label={t('orders.category') as string} value={order?.category || ''} />
                <View style={styles.detailRowCustom}>
                  <Text style={styles.detailLabel}>{t('orders.priority') as string}:</Text>
                  <View style={styles.inlineRight}>
                    <Text style={styles.detailValue}>{t(priorityTranslationKey(order?.priority)) as string}</Text>
                    {renderLed(getPriorityColor(order?.priority))}
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{translateOrFallback('orders.history', 'Historial')}</Text>
              {isLoadingHistory && (
                <View style={[styles.card, styles.historyLoadingCard]}>
                  <Text style={styles.historyLoadingText}>{t('common.loading') as string}</Text>
                </View>
              )}
              {!isLoadingHistory && !history.length && (
                <View style={styles.card}><Text style={styles.description}>{translateOrFallback('orders.noHistory', 'No hay actividad aún')}</Text></View>
              )}
              {!!history.length && (
                <View style={styles.timeline}>
                  {history.map((h, index) => {
                    const actor = h.creator || null;
                    const first = (actor?.first_name || actor?.full_name?.split(' ')?.[0] || '?').toString();
                    const last = (actor?.last_name || actor?.full_name?.split(' ')?.slice(-1)[0] || '?').toString();
                    const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
                    const message = h.comment || h.description || '';
                    const when = formatDateTime(h.created_at);
                    const hasAttachments = h.field_changed === 'attachments' && h.attachments && h.attachments.length > 0;
                    return (
                      <View key={String(h.id ?? index)} style={{position: 'relative'}}>
                        <View style={styles.timelineAvatar}>
                          <Text style={styles.timelineAvatarText}>{initials}</Text>
                        </View>
                        <View style={styles.historyCard}>
                          <View style={styles.historyHeader}>
                            <View style={styles.historyHeaderText}>
                              <Text style={styles.historyActor}>{actor?.full_name || `${first} ${last}`}</Text>
                            </View>
                            <Text style={styles.historyWhen}>{when}</Text>
                          </View>
                          {!!message && (
                            <View style={styles.historyBody}>
                              <Text style={styles.historyMessage}>{message}</Text>
                            </View>
                          )}
                          {hasAttachments && renderAttachments(h.attachments!)}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
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
  historyLoadingCard: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyLoadingText: {
    fontSize: 16,
    color: '#666666',
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  ledOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ledInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginLeft: 16,
    marginRight: 0,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  historyHeaderText: {
    flex: 1,
    marginLeft: 0,
  },
  historyActor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111111',
  },
  historyAction: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyWhen: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 12,
    textAlign: 'right',
  },
  historyBody: {
    marginTop: 10,
  },
  historyMessage: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
  timeline: {
    paddingLeft: 24,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
  },
  timelineAvatar: {
    position: 'absolute',
    left: -18,
    top: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  timelineAvatarText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
  },
  attachmentsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attachmentsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    marginBottom: 6,
  },
  attachmentIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e5e5ea',
  },
  attachmentIconText: {
    fontSize: 16,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: '#666666',
  },
});

export default OrderDetailsScreen; 

// Helpers
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getLedTone(color: string): string {
  const lower = color.toLowerCase();
  if (lower === '#34c759' || lower === '#66d17a') {
    return '#22C55E';
  }
  if (lower === '#ff3b30' || lower === '#ff6b6b') {
    return '#EF4444';
  }
  return color;
}

function renderLed(color: string) {
  return (
    <View style={[styles.ledOuter, { backgroundColor: withAlpha(color, 0.15) }]}
    >
      <View
        style={[
          styles.ledInner,
          { backgroundColor: color, borderColor: withAlpha(color, 0.35) },
        ]}
      />
    </View>
  );
} 