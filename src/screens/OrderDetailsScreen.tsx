import React, { useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
  Alert,
  Platform,
} from 'react-native';
// date-fns format not needed; using custom formatter
import { formatDateTimeLocal } from '../utils/datetime';
// removed locales; fixed output format to numeric month
import {OrderDetailsScreenProps} from '../types/navigation';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import DetailRow from '../components/DetailRow';
import {getStatusTranslation} from '../utils/roleTranslations';
import {
  getLedTone,
} from '../utils/orderVisuals';
import LedIndicator from '../components/ui/LedIndicator';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';
import { useOrders } from '../hooks/useOrders';
import { orderService, RawOrderHistoryEntry, PaginatedResponse } from '../services/orderService';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { httpClient } from '../utils/httpClient';
import SimpleAttachmentPreviewModal from '../components/SimpleAttachmentPreviewModal';
import RNBlobUtil from 'react-native-blob-util';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, API_BASE_URL_CONFIG } from '../constants';
import Toast from 'react-native-toast-message';

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const routeParams: any = (route as any)?.params || {};
  const orderKeyParam = routeParams.orderUuid ?? routeParams.orderId ?? routeParams.id;
  const orderKey: string = orderKeyParam ? String(orderKeyParam) : '';
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const { orders, ensureLoaded } = useOrders();
  const [history, setHistory] = useState<RawOrderHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);

  const order = useMemo(
    () => orders.find(o => String((o as any)?.uuid || o.id) === orderKey) || null,
    [orders, orderKey]
  );
  const customer = order?.customer || null;
  const loading = !order;

  useEffect(() => {
    const run = async () => {
      try {
        clearError();
        await ensureLoaded();
      } catch (err) {
        await errorService.logError(err as Error, {
          component: 'OrderDetailsScreen',
          operation: 'ensureLoaded',
          orderId: orderKey,
        });
        handleError(err as Error);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ensureLoaded, orderKey]);

  useEffect(() => {
    if (!order) return;
    const controller = new AbortController();
    const load = async () => {
      try {
        setIsLoadingHistory(true);
        const resp = await orderService.fetchOrderHistory(String((order as any).uuid || order.id), controller.signal) as PaginatedResponse<RawOrderHistoryEntry>;
        const items = Array.isArray(resp?.data) ? resp.data : [];
        setHistory(items);
      } catch (err) {
        await errorService.logError(err as Error, {
          component: 'OrderDetailsScreen',
          operation: 'fetchOrderHistory',
          orderId: orderKey,
        });
      } finally {
        setIsLoadingHistory(false);
      }
    };
    load();
    return () => controller.abort();
  }, [order, orderKey]);

  const handleEditOrder = () => {
    try {
      navigation.navigate('EditOrder', { 
        orderUuid: String((order as any)?.uuid ?? order?.id ?? orderKey),
        orderData: order
      });
      errorService.logSuccess('navigateToEdit', {
        component: 'OrderDetailsScreen',
        orderId: orderKey,
      });
    } catch (error) {
      errorService.logError(error as Error, {
        component: 'OrderDetailsScreen',
        operation: 'navigateToEdit',
        orderId: orderKey,
      });
      handleError(error as Error);
    }
  };

  // customer name utility not needed currently

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

  const getAttachmentIconName = (attachment: any): string => {
    const mime: string = (attachment?.mime_type || '').toString().toLowerCase();
    const ext: string = (attachment?.extension || '').toString().toLowerCase();
    if (attachment?.is_image || mime.startsWith('image/')) return 'image';
    if (attachment?.is_pdf || mime.includes('pdf') || ext === 'pdf') return 'picture-as-pdf';
    if (mime.includes('excel') || mime.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'table-chart';
    if (mime.includes('word') || mime.includes('document') || ['doc', 'docx', 'txt', 'rtf', 'md'].includes(ext)) return 'description';
    return 'attach-file';
  };


  const handlePreviewAttachment = (attachment: any) => {
    console.log('🔍 OrderDetailsScreen: handlePreviewAttachment called with:', {
      id: attachment?.id,
      uuid: attachment?.uuid,
      fileName: attachment?.file_name || attachment?.name,
      mimeType: attachment?.mime_type
    });
    
    setPreviewAttachment(attachment);
    setIsPreviewModalVisible(true);
    
    console.log('✅ OrderDetailsScreen: Modal state set to visible');
  };

  const handleClosePreview = () => {
    setIsPreviewModalVisible(false);
    setPreviewAttachment(null);
  };

  // Descargar a caché y abrir Share sheet
  const downloadAndShare = async (
    url: string,
    fileName: string,
    mime: string,
    headers?: Record<string, string>
  ) => {
    const tempPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
    const res = await RNBlobUtil.config({ path: tempPath, fileCache: true }).fetch('GET', url, headers);
    const localPath = res.path();
    await Share.share({ url: 'file://' + localPath, message: fileName, title: fileName });
    Toast.show({ type: 'success', text1: t('common.success') as string || 'Éxito', text2: t('downloads.readyToShare') as string });
  };

  // Guardar en Descargas mediante DownloadManager (Android, solo con URL pública/firmada)
  const downloadToAndroidDownloads = async (
    url: string,
    fileName: string,
    mime: string
  ) => {
    await RNBlobUtil.config({
      addAndroidDownloads: {
        useDownloadManager: true,
        title: fileName,
        description: 'Descargando adjunto…',
        mime,
        mediaScannable: true,
        notification: true,
        path: `${RNBlobUtil.fs.dirs.DownloadDir}/${fileName}`,
      },
    }).fetch('GET', url);
    Toast.show({ type: 'success', text1: t('downloads.started') as string, text2: t('downloads.savedToDownloadsAs', { fileName }) as string });
  };

  // Guardar como... usando Storage Access Framework (Android)
  const androidSaveAsUsingSAF = async (
    url: string,
    fileName: string,
    mime: string,
    headers?: Record<string, string>
  ) => {
    // Descarga a cache primero
    const tmpPath = `${RNBlobUtil.fs.dirs.CacheDir}/${fileName}`;
    const res = await RNBlobUtil.config({ path: tmpPath, fileCache: true }).fetch('GET', url, headers);
    const localPath = res.path();

    // Carga lib en tiempo de ejecución para evitar fallar si no está instalada
    let SAF: any = null;
    try {
      const mod = require('react-native-saf-x');
      SAF = mod?.default || mod;
    } catch (e) {
      SAF = null;
    }

    if (!SAF) {
      // Fallback elegante
      await downloadAndShare(url, fileName, mime, headers);
Toast.show({ type: 'info', text1: t('common.info') as string, text2: t('downloads.safNotFound') as string });
      return;
    }

    try {
      // Crear documento con nombre sugerido
      const createFn = SAF.createDocument || SAF.createFile || SAF.Document?.createFile;
      let targetUri: string | undefined = undefined;
      if (createFn) {
        try {
          // Algunas implementaciones aceptan objeto, otras (name, mime)
          targetUri = await createFn({ fileName, mimeType: mime });
        } catch (_) {
          try {
            targetUri = await createFn(fileName, mime);
          } catch (e) {
            // Reintentos fallidos
          }
        }
      }

      if (!targetUri) {
        throw new Error('No se pudo crear el documento con SAF');
      }

      // Escribir el archivo
      const base64 = await RNBlobUtil.fs.readFile(localPath, 'base64');
      const writeFn = SAF.writeFile || SAF.Document?.writeFile || SAF.overwriteFile;
      if (writeFn) {
        try {
          await writeFn({ uri: targetUri, base64, mimeType: mime });
        } catch (_) {
          await writeFn(targetUri, base64, mime); // otra firma común
        }
      } else {
        throw new Error('No se encontró método SAF.writeFile');
      }

Toast.show({ type: 'success', text1: t('downloads.saved') as string, text2: t('downloads.savedAs', { fileName }) as string });
      await errorService.logSuccess('downloadAttachmentSaveAs', {
        component: 'OrderDetailsScreen',
        orderId: orderKey,
        attachmentId: String(fileName),
      });
    } catch (e: any) {
      await errorService.logError(e as Error, {
        component: 'OrderDetailsScreen',
        operation: 'androidSaveAsUsingSAF',
        fileName,
      });
Toast.show({ type: 'error', text1: t('common.error') as string, text2: e?.message || (t('downloads.saveError') as string) });
      await downloadAndShare(url, fileName, mime, headers);
    }
  };

  const showAndroidDownloadOptions = async (
    url: string,
    fileName: string,
    mime: string,
    headers?: Record<string, string>
  ) => {
    // Si requiere Authorization, evitar DownloadManager (no pasa headers)
    if (headers && headers.Authorization) {
      await downloadAndShare(url, fileName, mime, headers);
      await errorService.logSuccess('downloadAttachmentSharedForced', {
        component: 'OrderDetailsScreen',
        orderId: orderKey,
        attachmentId: fileName,
        reason: 'auth-required',
      });
      return;
    }

    Alert.alert(
      t('common.download') as string || 'Descargar',
t('downloads.chooseHowToSave') as string,
      [
        {
text: (t('downloads.shareOrSave') as string) || 'Compartir/Guardar',
          onPress: async () => {
            await downloadAndShare(url, fileName, mime);
            await errorService.logSuccess('downloadAttachmentShared', {
              component: 'OrderDetailsScreen',
              orderId: orderKey,
              attachmentId: String(fileName),
            });
          },
        },
        {
text: (t('downloads.saveToDownloads') as string) || 'Guardar en Descargas',
          onPress: async () => {
            await downloadToAndroidDownloads(url, fileName, mime);
            await errorService.logSuccess('downloadAttachmentToDownloads', {
              component: 'OrderDetailsScreen',
              orderId: orderKey,
              attachmentId: String(fileName),
            });
          },
        },
        {
text: (t('downloads.saveAs') as string) || 'Guardar como…',
          onPress: async () => {
            await androidSaveAsUsingSAF(url, fileName, mime, headers);
          },
        },
        { text: t('common.cancel') as string || 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleDownloadAttachment = async (attachment: any) => {
    try {
      // 1) Obtener URL de descarga (idealmente firmada)
      const resp = await httpClient.get(`/v1/attachments/${attachment.uuid || attachment.id}/download`);
      const downloadUrl: string | undefined = resp?.data?.downloadUrl || resp?.data?.url || attachment?.url;
      if (!downloadUrl) {
throw new Error(t('downloads.noDownloadUrl') as string);
      }

      // 2) Preparar nombre de archivo y MIME
      const rawName = decodeURIComponent(attachment?.file_name || attachment?.name || 'archivo');
      const safeName = rawName.replace(/[\\/:*?\"<>|]+/g, '_');
      const mime = (attachment?.mime_type || 'application/octet-stream').toString();

      // 3) Construir headers solo si el host coincide con el API (posible necesidad de Authorization)
      let headers: Record<string, string> | undefined = undefined;
      try {
        if (API_BASE_URL_CONFIG) {
          const urlHost = new URL(downloadUrl).host;
          const apiHost = new URL(API_BASE_URL_CONFIG).host;
          if (urlHost === apiHost) {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (token) {
              headers = { Authorization: `Bearer ${token}` };
            }
          }
        }
      } catch {
        // Si URL parsing falla, continuamos sin headers
      }

      // 4) Android: ofrecer opciones; iOS: compartir directamente
      if (Platform.OS === 'android') {
        await showAndroidDownloadOptions(downloadUrl, safeName, mime, headers);
      } else {
        await downloadAndShare(downloadUrl, safeName, mime, headers);
        await errorService.logSuccess('downloadAttachmentShared', {
          component: 'OrderDetailsScreen',
          orderId: orderKey,
          attachmentId: String(attachment?.id || ''),
          fileName: safeName,
        });
      }
    } catch (err) {
      await errorService.logError(err as Error, {
        component: 'OrderDetailsScreen',
        operation: 'downloadAttachment',
        orderId: orderKey,
      });
      try {
        // Fallback: si existe una URL simple, intentar compartirla (menos ideal, pero evita bloqueo UX)
        const url = attachment?.url;
        if (url) {
          await Share.share({ url });
Toast.show({ type: 'info', text1: t('common.info') as string, text2: t('downloads.linkShared') as string });
          return;
        }
      } catch {}
    }
  };

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
              <Text style={styles.pageTitle}>{t('orders.order') as string}</Text>
              <Text style={styles.orderId}>#{String((order as any)?.uuid || orderKey)}</Text>
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
                    {!!statusLedColor && <LedIndicator color={statusLedColor} />}
                    <Text style={styles.detailValue}>{t(getStatusTranslation(order?.status || 'Open')) as string}</Text>
                  </View>
                </View>
                <DetailRow label={t('orders.orderTitle') as string} value={order?.title || '-'} />
                <DetailRow 
                  label={t('orders.category') as string} 
                  value={(() => {
                    const cats: any[] = Array.isArray((order as any)?.categories) ? (order as any).categories : [];
                    if (cats.length) return cats.map((c: any) => c?.name || c?.title || c?.label || '').filter(Boolean).join(', ');
                    return (order as any)?.category || '';
                  })()} 
                />
                <View style={styles.detailRowCustom}>
                  <Text style={styles.detailLabel}>{t('orders.priority') as string}:</Text>
                  <View style={styles.inlineRight}>
                    <LedIndicator color={getPriorityColor(order?.priority)} />
                    <Text style={styles.detailValue}>{t(priorityTranslationKey(order?.priority)) as string}</Text>
                  </View>
                </View>
                <DetailRow label={t('orders.createdAt') as string} value={formatDateTime(order?.created_at)} />
                <DetailRow label={t('orders.createdBy') as string} value={order?.created_by?.full_name || '-'} />
                <DetailRow label={t('orders.assignedTo') as string} value={order?.assigned_to?.full_name || '-'} />
                <DetailRow label={t('orders.updatedAt') as string} value={formatDateTime(order?.updated_at)} />
                {!!order?.estimated_completion && (
                  <DetailRow label={t('orders.estimatedCompletion') as string} value={formatDateTime(order?.estimated_completion)} />
                )}
                {!!order?.actual_completion && (
                  <DetailRow label={t('orders.actualCompletion') as string} value={formatDateTime(order?.actual_completion)} />
                )}
                <DetailRow label={t('orders.notes') as string} value={order?.notes || '-'} valueFlex={2} />
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('orders.history') as string}</Text>
              {isLoadingHistory && (
                <View style={[styles.card, styles.historyLoadingCard]}>
                  <Text style={styles.historyLoadingText}>{t('common.loading') as string}</Text>
                </View>
              )}
              {!isLoadingHistory && !history.length && (
                <View style={styles.card}><Text style={styles.description}>{t('orders.noHistory') as string}</Text></View>
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
                          {!!(Array.isArray(h.attachments) && h.attachments.length) && (
                            <View style={styles.attachmentsContainer}>
                              {h.attachments.map((att: any) => (
                                <View key={String(att.id)} style={styles.attachmentRow}>
                                  <View style={styles.attachmentLeft}>
                                    <Icon name={getAttachmentIconName(att)} size={18} color="#6B7280" />
                                    <Text style={styles.attachmentName} numberOfLines={1}>
                                      {att.file_name || att.name || t('common.file') as string}
                                    </Text>
                                  </View>
                                  <View style={styles.attachmentActions}>
                                    <TouchableOpacity
                                      onPress={() => handlePreviewAttachment(att)}
                                      style={styles.iconButton}
                                      accessibilityLabel={t('common.preview') as string}
                                    >
                                      <Icon name="visibility" size={20} color="#007AFF" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                      onPress={() => handleDownloadAttachment(att)}
                                      style={styles.iconButton}
                                      accessibilityLabel={t('common.download') as string}
                                    >
                                      <Icon name="download" size={20} color="#007AFF" />
                                    </TouchableOpacity>
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
      
      {/* Simple Attachment Preview Modal */}
      <SimpleAttachmentPreviewModal
        visible={isPreviewModalVisible}
        attachment={previewAttachment}
        onClose={handleClosePreview}
        onDownload={handleDownloadAttachment}
      />
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
  attachmentsContainer: {
    marginTop: 12,
    gap: 8,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  attachmentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 8,
  },
  attachmentName: {
    fontSize: 13,
    color: '#333333',
    flexShrink: 1,
  },
  attachmentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 6,
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
});

export default OrderDetailsScreen; 

// Helpers
function renderLed(color: string, styles: StyleSheet.NamedStyles<any>) {
  return (
    <View style={[styles.ledOuter, { backgroundColor: withAlpha(color, 0.15) }]} >
      <View
        style={[
          styles.ledInner,
          { backgroundColor: color, borderColor: withAlpha(color, 0.35) },
        ]}
      />
    </View>
  );
} 