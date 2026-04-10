import React, {useMemo, useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import {formatDateTimeLocal} from '@utils/datetime';
import {OrderDetailsScreenProps} from '@/types/navigation';
import {useTranslationSafe} from '@hooks/useTranslationSafe';
import DetailRow from '../components/DetailRow';
import {getStatusTranslation} from '@utils/roleTranslations';
import LedIndicator from '../components/ui/LedIndicator';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '@hooks/useErrorHandler';
import {errorService} from '@services/errorService';
import {
  orderService,
  RawOrder,
  RawOrderHistoryEntry,
  PaginatedResponse,
} from '@services/orderService';
import type {OrderServiceEntry, OrderItem, MotorInfo} from '@/types';
import {ORDER_LIFECYCLE_STATUSES} from '@/constants';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {httpClient} from '@utils/httpClient';
import SimpleAttachmentPreviewModal from '../components/SimpleAttachmentPreviewModal';
import RNBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {STORAGE_KEYS, API_BASE_URL_CONFIG} from '@/constants';
import Toast from 'react-native-toast-message';
import {useIsFocused} from '@react-navigation/native';
import {getItemTypeLabel, getComponentLabel} from '../utils/itemLabels';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const LIFECYCLE_LED: Record<string, string> = {
  Received: '#8E8E93',
  'Awaiting Review': '#FFB800',
  Reviewed: '#007AFF',
  'Awaiting Customer Approval': '#FF9500',
  'Ready for Work': '#30B0C7',
  'In Progress': '#007AFF',
  'Ready for Delivery': '#34C759',
  Delivered: '#1B7A2B',
  Open: '#74B9FF',
  Completed: '#34C759',
  Paid: '#66D17A',
};

const fmtCurrency = (n: string | number | null | undefined): string => {
  if (n == null || n === '') return '-';
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return String(n);
  return `$${num.toFixed(2)}`;
};

const boolMark = (v: boolean | undefined) => (v ? '✓' : '—');

const STATUSES_WITH_SERVICES = new Set([
  'Reviewed',
  'Awaiting Customer Approval',
  'Ready for Work',
  'In Progress',
  'Ready for Delivery',
  'Delivered',
]);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({navigation, route}) => {
  const routeParams: any = (route as any)?.params || {};
  const orderUuid: string = String(routeParams.orderUuid ?? routeParams.orderId ?? routeParams.id ?? '');
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const isFocused = useIsFocused();

  const [order, setOrder] = useState<RawOrder | null>(null);
  const [history, setHistory] = useState<RawOrderHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);

  // ---- Fetch order detail on every focus ----

  const loadOrder = useCallback(async () => {
    if (!orderUuid) return;
    try {
      setIsLoading(true);
      clearError();
      const data = await orderService.fetchOrderDetail(orderUuid);
      setOrder(data);
    } catch (err) {
      await errorService.logError(err as Error, {component: 'OrderDetailsScreen', operation: 'fetchOrderDetail', orderId: orderUuid});
      handleError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [orderUuid, handleError, clearError]);

  useEffect(() => {
    if (isFocused) loadOrder();
  }, [isFocused, loadOrder]);

  useEffect(() => {
    if (!order || !isFocused) return;
    const controller = new AbortController();
    (async () => {
      try {
        setIsLoadingHistory(true);
        const resp = (await orderService.fetchOrderHistory(String((order as any).uuid || order.id), controller.signal)) as PaginatedResponse<RawOrderHistoryEntry>;
        setHistory(Array.isArray(resp?.data) ? resp.data : []);
      } catch {} finally {
        setIsLoadingHistory(false);
      }
    })();
    return () => controller.abort();
  }, [order, isFocused]);

  // ---- Derived data ----

  const status = order?.status ?? '';
  const motorInfo: MotorInfo | null = (order as any)?.motor_info ?? null;
  const items: OrderItem[] = (order as any)?.items ?? [];
  const services: OrderServiceEntry[] = (order as any)?.services ?? [];
  const customer: any = order?.customer ?? null;
  const showServices = STATUSES_WITH_SERVICES.has(status) && services.length > 0;

  const statusLedColor = useMemo(() => LIFECYCLE_LED[status] ?? '#8E8E93', [status]);

  const hasTechnicalFields = useMemo(() => {
    if (!motorInfo) return false;
    return !!(motorInfo.center_torque || motorInfo.rod_torque || motorInfo.first_gap || motorInfo.second_gap || motorInfo.third_gap || motorInfo.center_clearance || motorInfo.rod_clearance);
  }, [motorInfo]);

  const budgetedTotal = useMemo(() => services.filter(s => s.is_budgeted).reduce((a, s) => a + parseFloat(s.net_price || '0'), 0), [services]);
  const authorizedTotal = useMemo(() => services.filter(s => s.is_authorized).reduce((a, s) => a + parseFloat(s.net_price || '0'), 0), [services]);
  const completedTotal = useMemo(() => services.filter(s => s.is_completed).reduce((a, s) => a + parseFloat(s.net_price || '0'), 0), [services]);

  const servicesByItem = useMemo(() => {
    const map = new Map<number, OrderServiceEntry[]>();
    for (const s of services) {
      if (!map.has(s.order_item_id)) map.set(s.order_item_id, []);
      map.get(s.order_item_id)!.push(s);
    }
    return map;
  }, [services]);

  // ---- Lifecycle actions ----

  const handleReadyForDelivery = () => {
    Alert.alert(t('orders.actions.readyForDelivery') as string, t('orders.actions.confirmReadyForDelivery') as string, [
      {text: t('common.cancel') as string, style: 'cancel'},
      {text: t('common.confirm') as string, onPress: async () => {
        try {
          setIsActionLoading(true);
          await orderService.markReadyForDelivery(orderUuid);
          Toast.show({type: 'success', text1: t('common.success') as string, text2: t('orders.actions.readyForDeliverySuccess') as string});
          await loadOrder();
        } catch (err: any) {
          Toast.show({type: 'error', text1: t('common.error') as string, text2: err?.response?.data?.message || err?.message || ''});
        } finally { setIsActionLoading(false); }
      }},
    ]);
  };

  const handleDeliver = () => {
    Alert.alert(t('orders.actions.deliverOrder') as string, t('orders.actions.confirmDeliver') as string, [
      {text: t('common.cancel') as string, style: 'cancel'},
      {text: t('common.confirm') as string, onPress: async () => {
        try {
          setIsActionLoading(true);
          await orderService.deliverOrder(orderUuid);
          Toast.show({type: 'success', text1: t('common.success') as string, text2: t('orders.actions.deliverSuccess') as string});
          await loadOrder();
        } catch (err: any) {
          Toast.show({type: 'error', text1: t('common.error') as string, text2: err?.response?.data?.message || err?.message || ''});
        } finally { setIsActionLoading(false); }
      }},
    ]);
  };

  const handleEditOrder = () => {
    navigation.navigate('EditOrder', {orderUuid: String((order as any)?.uuid ?? order?.id ?? orderUuid), orderData: order});
  };

  // ---- Formatting helpers ----

  const formatDateTime = (ds?: string | null) => formatDateTimeLocal(ds);
  const priorityKey = (p?: string) => ({Low: 'orders.priorities.low', Normal: 'orders.priorities.normal', High: 'orders.priorities.high', Urgent: 'orders.priorities.urgent'}[p || ''] || 'orders.priorities.normal');
  const priorityColor = (p?: string) => ({Low: '#34C759', Normal: '#FFD60A', High: '#FF9500', Urgent: '#FF3B30'}[p || ''] || '#FFD60A');

  const getCustomerInfo = () => {
    if (!customer) return null;
    return {
      name: customer.full_name || `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim(),
      email: customer.email,
      company: customer.company?.name || customer.company || '',
      phone: customer.phone_number || '',
      type: (customer.type || '').toString(),
      notes: customer.notes || '',
    };
  };
  const customerInfo = getCustomerInfo();

  // ---- Attachment helpers ----

  const attIcon = (att: any): string => {
    const mime = (att?.mime_type || '').toLowerCase();
    const ext = (att?.extension || '').toLowerCase();
    if (att?.is_image || mime.startsWith('image/')) return 'image';
    if (att?.is_pdf || mime.includes('pdf') || ext === 'pdf') return 'picture-as-pdf';
    if (mime.includes('excel') || mime.includes('spreadsheet') || ['xls','xlsx','csv'].includes(ext)) return 'table-chart';
    if (mime.includes('word') || mime.includes('document') || ['doc','docx','txt','rtf','md'].includes(ext)) return 'description';
    return 'attach-file';
  };

  const handlePreviewAttachment = (att: any) => { setPreviewAttachment(att); setIsPreviewModalVisible(true); };
  const handleClosePreview = () => { setIsPreviewModalVisible(false); setPreviewAttachment(null); };

  const downloadAndShare = async (url: string, fileName: string, _mime: string, headers?: Record<string, string>) => {
    const tmp = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
    const res = await RNBlobUtil.config({path: tmp, fileCache: true}).fetch('GET', url, headers);
    await Share.share({url: 'file://' + res.path(), message: fileName, title: fileName});
    Toast.show({type: 'success', text1: t('common.success') as string, text2: t('downloads.readyToShare') as string});
  };

  const handleDownloadAttachment = async (att: any) => {
    try {
      const resp = await httpClient.get(`/v1/attachments/${att.uuid || att.id}/download`);
      const dlUrl: string | undefined = resp?.data?.downloadUrl || resp?.data?.url || att?.url;
      if (!dlUrl) throw new Error(t('downloads.noDownloadUrl') as string);
      const safeName = decodeURIComponent(att?.file_name || att?.name || 'archivo').replace(/[\\/:*?"<>|]+/g, '_');
      const mime = (att?.mime_type || 'application/octet-stream').toString();
      let headers: Record<string, string> | undefined;
      try {
        if (API_BASE_URL_CONFIG) {
          if (new URL(dlUrl).host === new URL(API_BASE_URL_CONFIG).host) {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (token) headers = {Authorization: `Bearer ${token}`};
          }
        }
      } catch {}
      await downloadAndShare(dlUrl, safeName, mime, headers);
    } catch (err) {
      await errorService.logError(err as Error, {component: 'OrderDetailsScreen', operation: 'downloadAttachment'});
      try { if (att?.url) { await Share.share({url: att.url}); Toast.show({type: 'info', text1: t('common.info') as string, text2: t('downloads.linkShared') as string}); } } catch {}
    }
  };

  // ---- Render helpers ----

  const renderActionButtons = () => {
    const btns: React.ReactNode[] = [];
    if (status === ORDER_LIFECYCLE_STATUSES.AWAITING_REVIEW) {
      btns.push(<TouchableOpacity key="budget" style={styles.actionButton} onPress={() => navigation.navigate('OrderBudget', {orderUuid})}><Icon name="calculate" size={20} color="#fff" /><Text style={styles.actionButtonText}>{t('orders.actions.submitBudget') as string}</Text></TouchableOpacity>);
    }
    if (status === ORDER_LIFECYCLE_STATUSES.AWAITING_CUSTOMER_APPROVAL) {
      btns.push(<TouchableOpacity key="approve" style={[styles.actionButton, {backgroundColor: '#FF9500'}]} onPress={() => navigation.navigate('OrderApproval', {orderUuid})}><Icon name="thumb-up" size={20} color="#fff" /><Text style={styles.actionButtonText}>{t('orders.actions.approveServices') as string}</Text></TouchableOpacity>);
    }
    if (status === ORDER_LIFECYCLE_STATUSES.READY_FOR_WORK) {
      btns.push(
        <TouchableOpacity key="work" style={[styles.actionButton, {backgroundColor: '#30B0C7'}]} onPress={() => navigation.navigate('OrderWorkCompleted', {orderUuid})}><Icon name="build" size={20} color="#fff" /><Text style={styles.actionButtonText}>{t('orders.actions.markWorkCompleted') as string}</Text></TouchableOpacity>,
        <TouchableOpacity key="ready" style={[styles.actionButton, {backgroundColor: '#34C759'}]} onPress={handleReadyForDelivery}><Icon name="local-shipping" size={20} color="#fff" /><Text style={styles.actionButtonText}>{t('orders.actions.readyForDelivery') as string}</Text></TouchableOpacity>,
      );
    }
    if (status === ORDER_LIFECYCLE_STATUSES.READY_FOR_DELIVERY) {
      btns.push(<TouchableOpacity key="deliver" style={[styles.actionButton, {backgroundColor: '#1B7A2B'}]} onPress={handleDeliver}><Icon name="check-circle" size={20} color="#fff" /><Text style={styles.actionButtonText}>{t('orders.actions.deliverOrder') as string}</Text></TouchableOpacity>);
    }
    if (!btns.length) return null;
    return <View style={styles.actionContainer}>{btns}</View>;
  };

  const renderMotorInfo = () => {
    if (!motorInfo) return null;
    if (!(motorInfo.brand || motorInfo.model || motorInfo.year || motorInfo.liters || motorInfo.cylinder_count)) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('orders.motorInfo') as string}</Text>
        <View style={styles.card}>
          {motorInfo.brand && <DetailRow label={t('createOrder.motor.brand') as string} value={motorInfo.brand} />}
          {motorInfo.model && <DetailRow label={t('createOrder.motor.model') as string} value={motorInfo.model} />}
          {motorInfo.year && <DetailRow label={t('createOrder.motor.year') as string} value={motorInfo.year} />}
          {motorInfo.liters && <DetailRow label={t('createOrder.motor.liters') as string} value={motorInfo.liters} />}
          {motorInfo.cylinder_count && <DetailRow label={t('createOrder.motor.cylinderCount') as string} value={motorInfo.cylinder_count} />}
        </View>
      </View>
    );
  };

  const renderItemsReceived = () => {
    if (!items.length) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('orders.itemsReceived') as string}</Text>
        <View style={styles.card}>
          {items.map(item => (
            <View key={item.id} style={styles.itemBlock}>
              <Text style={styles.itemTypeLabel}>{getItemTypeLabel(t as any, item.item_type)}</Text>
              {item.components?.length ? (
                <View style={styles.componentList}>{item.components.map(c => <Text key={c.id} style={styles.componentChip}>{getComponentLabel(t as any, c.component_name)}</Text>)}</View>
              ) : <Text style={styles.mutedText}>—</Text>}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderServicesTable = () => {
    if (!showServices) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('orders.servicesTable') as string}</Text>
        {items.map(item => {
          const svc = servicesByItem.get(item.id) || [];
          if (!svc.length) return null;
          const label = getItemTypeLabel(t as any, item.item_type);
          return (
            <View key={item.id} style={[styles.card, {marginBottom: 12}]}>
              <Text style={styles.serviceGroupTitle}>{label}</Text>
              <View style={styles.serviceHeaderRow}>
                <Text style={[styles.svcCell, styles.svcCellWork]}>{t('orders.workName') as string}</Text>
                <Text style={styles.svcCell}>{t('orders.ppto') as string}</Text>
                <Text style={styles.svcCell}>{t('orders.aut') as string}</Text>
                <Text style={styles.svcCell}>{t('orders.tr') as string}</Text>
                <Text style={[styles.svcCell, styles.svcCellPrice]}>{t('orders.netPrice') as string}</Text>
              </View>
              {svc.map(s => (
                <View key={s.id} style={styles.serviceRow}>
                  <Text style={[styles.svcCell, styles.svcCellWork]} numberOfLines={2}>{s.service_name || s.service_key.replace(/_/g, ' ')}</Text>
                  <Text style={styles.svcCell}>{boolMark(s.is_budgeted)}</Text>
                  <Text style={styles.svcCell}>{boolMark(s.is_authorized)}</Text>
                  <Text style={styles.svcCell}>{boolMark(s.is_completed)}</Text>
                  <Text style={[styles.svcCell, styles.svcCellPrice]}>{fmtCurrency(s.net_price)}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  const renderCostSummary = () => {
    if (!showServices) return null;
    const dp = motorInfo?.down_payment ?? 0;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('orders.costSummary') as string}</Text>
        <View style={styles.card}>
          <DetailRow label={t('orders.budgetedTotal') as string} value={fmtCurrency(budgetedTotal)} />
          <DetailRow label={t('orders.authorizedTotal') as string} value={fmtCurrency(authorizedTotal)} />
          <DetailRow label={t('orders.completedTotal') as string} value={fmtCurrency(completedTotal)} />
          {dp > 0 && <DetailRow label={t('orders.downPayment') as string} value={fmtCurrency(dp)} />}
          {dp > 0 && <DetailRow label={t('orders.balance') as string} value={fmtCurrency(completedTotal - dp)} />}
        </View>
      </View>
    );
  };

  const renderTechnicalFields = () => {
    if (!hasTechnicalFields || !motorInfo) return null;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('orders.technicalFields') as string}</Text>
        <View style={styles.card}>
          {motorInfo.center_torque && <DetailRow label={t('orders.centerTorque') as string} value={motorInfo.center_torque} />}
          {motorInfo.rod_torque && <DetailRow label={t('orders.rodTorque') as string} value={motorInfo.rod_torque} />}
          {motorInfo.first_gap && <DetailRow label={t('orders.firstGap') as string} value={motorInfo.first_gap} />}
          {motorInfo.second_gap && <DetailRow label={t('orders.secondGap') as string} value={motorInfo.second_gap} />}
          {motorInfo.third_gap && <DetailRow label={t('orders.thirdGap') as string} value={motorInfo.third_gap} />}
          {motorInfo.center_clearance && <DetailRow label={t('orders.centerClearance') as string} value={motorInfo.center_clearance} />}
          {motorInfo.rod_clearance && <DetailRow label={t('orders.rodClearance') as string} value={motorInfo.rod_clearance} />}
        </View>
      </View>
    );
  };

  // ---- Main render ----

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>{t('common.loading') as string}</Text>
          </View>
        ) : !order ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('editOrder.orderNotFound') as string}</Text>
          </View>
        ) : (
          <>
            {hasError && <ErrorMessage error={error} onRetry={clearError} onDismiss={clearError} />}

            <View style={styles.header}>
              <Text style={styles.pageTitle}>{t('orders.order') as string}</Text>
              <Text style={styles.orderId}>#{String((order as any)?.uuid || orderUuid)}</Text>
              <TouchableOpacity style={styles.editButton} onPress={handleEditOrder}>
                <Text style={styles.editButtonText}>{t('common.edit') as string}</Text>
              </TouchableOpacity>
            </View>

            {isActionLoading ? <View style={styles.actionContainer}><ActivityIndicator color="#007AFF" /></View> : renderActionButtons()}

            {/* General Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('orders.generalInfo') as string}</Text>
              <View style={styles.card}>
                <View style={styles.detailRowCustom}>
                  <Text style={styles.detailLabel}>{t('orders.status') as string}:</Text>
                  <View style={styles.inlineRight}><LedIndicator color={statusLedColor} /><Text style={styles.detailValue}>{t(getStatusTranslation(status)) as string}</Text></View>
                </View>
                <DetailRow label={t('orders.orderTitle') as string} value={order.title || '-'} />
                <View style={styles.detailRowCustom}>
                  <Text style={styles.detailLabel}>{t('orders.priority') as string}:</Text>
                  <View style={styles.inlineRight}><LedIndicator color={priorityColor(order.priority)} /><Text style={styles.detailValue}>{t(priorityKey(order.priority)) as string}</Text></View>
                </View>
                <DetailRow label={t('orders.createdAt') as string} value={formatDateTime(order.created_at)} />
                <DetailRow label={t('orders.createdBy') as string} value={order.created_by?.full_name || '-'} />
                <DetailRow label={t('orders.assignedTo') as string} value={order.assigned_to?.full_name || '-'} />
                <DetailRow label={t('orders.updatedAt') as string} value={formatDateTime(order.updated_at)} />
                {!!order.estimated_completion && <DetailRow label={t('orders.estimatedCompletion') as string} value={formatDateTime(order.estimated_completion)} />}
                {!!order.actual_completion && <DetailRow label={t('orders.actualCompletion') as string} value={formatDateTime(order.actual_completion)} />}
                <DetailRow label={t('orders.notes') as string} value={order.notes || '-'} valueFlex={2} />
              </View>
            </View>

            {renderMotorInfo()}
            {renderItemsReceived()}

            {customerInfo && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{t('orders.customerInfo') as string}</Text>
                <View style={styles.card}>
                  <DetailRow label={t('common.name') as string} value={customerInfo.name} />
                  <DetailRow label={t('common.email') as string} value={customerInfo.email} />
                  {!!customerInfo.company && <DetailRow label={t('common.company') as string} value={customerInfo.company} />}
                  {!!customerInfo.phone && <DetailRow label={t('common.phone') as string} value={customerInfo.phone} />}
                  {!!customerInfo.type && <DetailRow label={t('orders.customerType') as string} value={customerInfo.type === 'corporate' ? (t('common.customerTypes.corporate') as string) : (t('common.customerTypes.individual') as string)} />}
                  {!!customerInfo.notes && <DetailRow label={t('orders.customerNotes') as string} value={customerInfo.notes} />}
                </View>
              </View>
            )}

            {renderServicesTable()}
            {renderCostSummary()}
            {renderTechnicalFields()}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('orders.description') as string}</Text>
              <View style={styles.card}><Text style={styles.description}>{order.description || (t('orders.descriptionPlaceholder') as string)}</Text></View>
            </View>

            {/* History */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('orders.history') as string}</Text>
              {isLoadingHistory && <View style={[styles.card, styles.historyLoadingCard]}><Text style={styles.historyLoadingText}>{t('common.loading') as string}</Text></View>}
              {!isLoadingHistory && !history.length && <View style={styles.card}><Text style={styles.description}>{t('orders.noHistory') as string}</Text></View>}
              {!!history.length && (
                <View style={styles.timeline}>
                  {history.map((h, idx) => {
                    const actor = h.creator || null;
                    const first = (actor?.first_name || actor?.full_name?.split(' ')?.[0] || '?').toString();
                    const last = (actor?.last_name || actor?.full_name?.split(' ')?.slice(-1)[0] || '?').toString();
                    const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
                    const msg = h.comment || h.description || '';
                    const when = formatDateTime(h.created_at);
                    return (
                      <View key={String(h.id ?? idx)} style={{position: 'relative'}}>
                        <View style={styles.timelineAvatar}><Text style={styles.timelineAvatarText}>{initials}</Text></View>
                        <View style={styles.historyCard}>
                          <View style={styles.historyHeader}>
                            <View style={styles.historyHeaderText}><Text style={styles.historyActor}>{actor?.full_name || `${first} ${last}`}</Text></View>
                            <Text style={styles.historyWhen}>{when}</Text>
                          </View>
                          {!!msg && <View style={styles.historyBody}><Text style={styles.historyMessage}>{msg}</Text></View>}
                          {!!(Array.isArray(h.attachments) && h.attachments.length) && (
                            <View style={styles.attachmentsContainer}>
                              {h.attachments.map((att: any) => (
                                <View key={String(att.id)} style={styles.attachmentRow}>
                                  <View style={styles.attachmentLeft}>
                                    <Icon name={attIcon(att)} size={18} color="#6B7280" />
                                    <Text style={styles.attachmentName} numberOfLines={1}>{att.file_name || att.name || (t('common.file') as string)}</Text>
                                  </View>
                                  <View style={styles.attachmentActions}>
                                    <TouchableOpacity onPress={() => handlePreviewAttachment(att)} style={styles.iconButton}><Icon name="visibility" size={20} color="#007AFF" /></TouchableOpacity>
                                    <TouchableOpacity onPress={() => handleDownloadAttachment(att)} style={styles.iconButton}><Icon name="download" size={20} color="#007AFF" /></TouchableOpacity>
                                  </View>
                                </View>
                              ))}
                            </View>
                          )}
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
      <SimpleAttachmentPreviewModal visible={isPreviewModalVisible} attachment={previewAttachment} onClose={handleClosePreview} onDownload={handleDownloadAttachment} />
    </ErrorBoundary>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  loadingContainer: {flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100},
  loadingText: {marginTop: 10, fontSize: 16, color: '#666666'},
  header: {backgroundColor: '#007AFF', paddingTop: 20, paddingBottom: 16, paddingHorizontal: 20},
  pageTitle: {fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 6},
  orderId: {fontSize: 18, fontWeight: '600', color: '#ffffff', marginBottom: 10},
  editButton: {backgroundColor: '#ffffff', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 6, alignSelf: 'flex-start'},
  editButtonText: {color: '#007AFF', fontSize: 14, fontWeight: '500'},
  actionContainer: {paddingHorizontal: 20, paddingTop: 12, gap: 10},
  actionButton: {backgroundColor: '#007AFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 8, gap: 8},
  actionButtonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  section: {margin: 20},
  sectionTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333333'},
  card: {backgroundColor: '#ffffff', borderRadius: 8, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3},
  description: {fontSize: 16, color: '#333333', lineHeight: 24},
  mutedText: {color: '#999', fontStyle: 'italic', fontSize: 13},
  detailRowCustom: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  detailLabel: {fontSize: 14, color: '#666666', flex: 1},
  detailValue: {fontSize: 14, color: '#333333', fontWeight: '500'},
  inlineRight: {flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'flex-end'},
  itemBlock: {marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  itemTypeLabel: {fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 6},
  componentList: {flexDirection: 'row', flexWrap: 'wrap', gap: 6},
  componentChip: {fontSize: 12, backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, color: '#555', overflow: 'hidden'},
  serviceGroupTitle: {fontSize: 15, fontWeight: '700', color: '#007AFF', marginBottom: 10},
  serviceHeaderRow: {flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#e0e0e0', paddingBottom: 6, marginBottom: 4},
  serviceRow: {flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f5f5f5'},
  svcCell: {flex: 1, fontSize: 12, color: '#333', textAlign: 'center'},
  svcCellWork: {flex: 2.5, textAlign: 'left', fontWeight: '500'},
  svcCellPrice: {flex: 1.2, textAlign: 'right'},
  historyLoadingCard: {paddingVertical: 20, alignItems: 'center', justifyContent: 'center'},
  historyLoadingText: {fontSize: 16, color: '#666666'},
  timeline: {paddingLeft: 24, borderLeftWidth: 1, borderLeftColor: '#E5E5EA'},
  timelineAvatar: {position: 'absolute', left: -18, top: 10, width: 28, height: 28, borderRadius: 14, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', zIndex: 2},
  timelineAvatarText: {fontSize: 11, fontWeight: '700', color: '#007AFF'},
  historyCard: {backgroundColor: '#ffffff', borderRadius: 8, padding: 16, marginLeft: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.12, shadowRadius: 2, elevation: 2, borderWidth: 1, borderColor: '#f0f0f0'},
  historyHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  historyHeaderText: {flex: 1},
  historyActor: {fontSize: 14, fontWeight: '600', color: '#111111'},
  historyWhen: {fontSize: 12, color: '#6B7280', marginLeft: 12, textAlign: 'right'},
  historyBody: {marginTop: 10},
  historyMessage: {fontSize: 14, color: '#333333', lineHeight: 20},
  attachmentsContainer: {marginTop: 12, gap: 8},
  attachmentRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6},
  attachmentLeft: {flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8, gap: 8},
  attachmentName: {fontSize: 13, color: '#333333', flexShrink: 1},
  attachmentActions: {flexDirection: 'row', alignItems: 'center', gap: 8},
  iconButton: {padding: 6},
});

export default OrderDetailsScreen;
