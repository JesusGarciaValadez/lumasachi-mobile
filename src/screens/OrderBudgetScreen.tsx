import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@/types';
import {useTranslationSafe} from '@hooks/useTranslationSafe';
import {orderService, RawOrder, BudgetServicePayload} from '@services/orderService';
import type {OrderItem, CatalogService, EngineCatalog} from '@/types';
import {ORDER_LIFECYCLE_STATUSES} from '@/constants';
import {getItemTypeLabel} from '../utils/itemLabels';
import ErrorBoundary from '../components/ErrorBoundary';
import Toast from 'react-native-toast-message';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'OrderBudget'>;
  route: RouteProp<RootStackParamList, 'OrderBudget'>;
}

interface ServiceSelection {
  checked: boolean;
  measurement: string;
  notes: string;
}

/** key = `${order_item_id}::${service_key}` */
type SelectionMap = Record<string, ServiceSelection>;

const OrderBudgetScreen: React.FC<Props> = ({navigation, route}) => {
  const {orderUuid} = route.params;
  const {t} = useTranslationSafe();

  const [order, setOrder] = useState<RawOrder | null>(null);
  const [catalog, setCatalog] = useState<EngineCatalog | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selections, setSelections] = useState<SelectionMap>({});
  const [error, setError] = useState<string | null>(null);

  // Load order + catalog
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const [orderData, catalogData] = await Promise.all([
          orderService.fetchOrderDetail(orderUuid),
          orderService.fetchCatalog(),
        ]);

        // Guard
        if (orderData.status !== ORDER_LIFECYCLE_STATUSES.AWAITING_REVIEW) {
          Alert.alert('', t('budget.statusGuard') as string, [{text: t('common.ok') as string, onPress: () => navigation.goBack()}]);
          return;
        }
        setOrder(orderData);
        setCatalog(catalogData);
      } catch (err: any) {
        setError(err?.message || 'Error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [orderUuid, navigation, t]);

  const items: OrderItem[] = useMemo(() => (order as any)?.items ?? [], [order]);

  const key = (itemId: number, svcKey: string) => `${itemId}::${svcKey}`;

  const toggle = (itemId: number, svcKey: string) => {
    const k = key(itemId, svcKey);
    setSelections(prev => ({
      ...prev,
      [k]: {
        checked: !prev[k]?.checked,
        measurement: prev[k]?.measurement ?? '',
        notes: prev[k]?.notes ?? '',
      },
    }));
    if (error) setError(null);
  };

  const updateField = (itemId: number, svcKey: string, field: 'measurement' | 'notes', value: string) => {
    const k = key(itemId, svcKey);
    setSelections(prev => ({
      ...prev,
      [k]: {...(prev[k] || {checked: false, measurement: '', notes: ''}), [field]: value},
    }));
  };

  const handleSubmit = async () => {
    const services: BudgetServicePayload[] = [];
    for (const [k, sel] of Object.entries(selections)) {
      if (!sel.checked) continue;
      const [itemId, serviceKey] = k.split('::');
      services.push({
        order_item_id: parseInt(itemId, 10),
        service_key: serviceKey,
        measurement: sel.measurement || null,
        notes: sel.notes || null,
      });
    }
    if (services.length === 0) {
      setError(t('budget.atLeastOneRequired') as string);
      return;
    }
    try {
      setIsSubmitting(true);
      await orderService.submitBudget(orderUuid, services);
      Toast.show({type: 'success', text1: t('common.success') as string, text2: t('budget.success') as string});
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '';
      Toast.show({type: 'error', text1: t('common.error') as string, text2: msg});
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
  }

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{t('budget.title') as string}</Text>
        <Text style={styles.description}>{t('budget.description') as string}</Text>

        {items.map(item => {
          const catalogServices: CatalogService[] = catalog?.services_by_type?.[item.item_type] ?? [];
          const typeLabel = getItemTypeLabel(t as any, item.item_type);
          if (!catalogServices.length) return null;
          return (
            <View key={item.id} style={styles.card}>
              <Text style={styles.groupTitle}>{typeLabel}</Text>
              {catalogServices.map(svc => {
                const k = key(item.id, svc.service_key);
                const sel = selections[k] || {checked: false, measurement: '', notes: ''};
                return (
                  <View key={svc.service_key} style={styles.serviceBlock}>
                    <TouchableOpacity style={styles.checkboxRow} onPress={() => toggle(item.id, svc.service_key)}>
                      <View style={[styles.checkbox, sel.checked && styles.checkboxChecked]}>
                        {sel.checked && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceName}>{svc.service_name}</Text>
                        <Text style={styles.servicePrice}>{`$${svc.net_price}`}</Text>
                      </View>
                    </TouchableOpacity>
                    {sel.checked && (
                      <View style={styles.fieldsRow}>
                        {svc.requires_measurement && (
                          <TextInput
                            style={styles.fieldInput}
                            placeholder={t('budget.measurementPlaceholder') as string}
                            value={sel.measurement}
                            onChangeText={v => updateField(item.id, svc.service_key, 'measurement', v)}
                            keyboardType="decimal-pad"
                          />
                        )}
                        <TextInput
                          style={[styles.fieldInput, styles.notesInput]}
                          placeholder={t('budget.notesPlaceholder') as string}
                          value={sel.notes}
                          onChangeText={v => updateField(item.id, svc.service_key, 'notes', v)}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('budget.submit') as string}</Text>}
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5', padding: 20},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  title: {fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 4},
  description: {fontSize: 14, color: '#666', marginBottom: 20},
  card: {backgroundColor: '#fff', borderRadius: 8, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2},
  groupTitle: {fontSize: 16, fontWeight: '700', color: '#007AFF', marginBottom: 12},
  serviceBlock: {marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 12},
  checkboxRow: {flexDirection: 'row', alignItems: 'center'},
  checkbox: {width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 12},
  checkboxChecked: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  checkmark: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
  serviceInfo: {flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  serviceName: {fontSize: 14, color: '#333', flex: 1, marginRight: 8},
  servicePrice: {fontSize: 14, fontWeight: '600', color: '#555'},
  fieldsRow: {marginTop: 8, marginLeft: 36, gap: 8},
  fieldInput: {borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 10, fontSize: 14, backgroundColor: '#f9f9f9'},
  notesInput: {minHeight: 40},
  errorText: {color: '#FF3B30', fontSize: 13, marginBottom: 12, textAlign: 'center'},
  submitButton: {backgroundColor: '#007AFF', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8},
  submitDisabled: {backgroundColor: '#ccc'},
  submitText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});

export default OrderBudgetScreen;
