import React, {useState, useEffect, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '@/types';
import {useTranslationSafe} from '@hooks/useTranslationSafe';
import {orderService, RawOrder} from '@services/orderService';
import type {OrderServiceEntry} from '@/types';
import {ORDER_LIFECYCLE_STATUSES} from '@/constants';
import ErrorBoundary from '../components/ErrorBoundary';
import Toast from 'react-native-toast-message';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'OrderWorkCompleted'>;
  route: RouteProp<RootStackParamList, 'OrderWorkCompleted'>;
}

const fmtCurrency = (n: number) => `$${n.toFixed(2)}`;

const OrderWorkCompletedScreen: React.FC<Props> = ({navigation, route}) => {
  const {orderUuid} = route.params;
  const {t} = useTranslationSafe();

  const [order, setOrder] = useState<RawOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedIds, setCompletedIds] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const data = await orderService.fetchOrderDetail(orderUuid);
        if (data.status !== ORDER_LIFECYCLE_STATUSES.READY_FOR_WORK && data.status !== 'In Progress') {
          Alert.alert('', t('workCompleted.statusGuard') as string, [{text: t('common.ok') as string, onPress: () => navigation.goBack()}]);
          return;
        }
        setOrder(data);
      } catch (err: any) {
        setError(err?.message || 'Error');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [orderUuid, navigation, t]);

  const authorizedServices: OrderServiceEntry[] = useMemo(
    () => ((order as any)?.services ?? []).filter((s: OrderServiceEntry) => s.is_authorized),
    [order],
  );

  const toggleService = (id: number) => {
    setCompletedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    if (error) setError(null);
  };

  const completedTotal = useMemo(
    () => authorizedServices.filter(s => completedIds.has(s.id)).reduce((a, s) => a + parseFloat(s.net_price || '0'), 0),
    [authorizedServices, completedIds],
  );

  const handleSubmit = async () => {
    if (completedIds.size === 0) {
      setError(t('workCompleted.atLeastOneRequired') as string);
      return;
    }
    try {
      setIsSubmitting(true);
      await orderService.markWorkCompleted(orderUuid, {completed_service_ids: Array.from(completedIds)});
      Toast.show({type: 'success', text1: t('common.success') as string, text2: t('workCompleted.success') as string});
      navigation.goBack();
    } catch (err: any) {
      Toast.show({type: 'error', text1: t('common.error') as string, text2: err?.response?.data?.message || err?.message || ''});
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{t('workCompleted.title') as string}</Text>
        <Text style={styles.description}>{t('workCompleted.description') as string}</Text>

        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={[styles.cell, styles.cellName]}>{t('workCompleted.serviceName') as string}</Text>
            <Text style={[styles.cell, styles.cellPrice]}>{t('workCompleted.netPrice') as string}</Text>
            <Text style={styles.cellCheck}>{t('workCompleted.completed') as string}</Text>
          </View>
          {authorizedServices.map(s => {
            const checked = completedIds.has(s.id);
            return (
              <TouchableOpacity key={s.id} style={styles.row} onPress={() => toggleService(s.id)}>
                <Text style={[styles.cell, styles.cellName]} numberOfLines={2}>{s.service_name || s.service_key.replace(/_/g, ' ')}</Text>
                <Text style={[styles.cell, styles.cellPrice]}>{`$${s.net_price || '0.00'}`}</Text>
                <View style={styles.cellCheck}>
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.card}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('workCompleted.selectedTotal') as string}</Text>
            <Text style={styles.summaryValue}>{fmtCurrency(completedTotal)}</Text>
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={[styles.submitButton, isSubmitting && styles.submitDisabled]} onPress={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>{t('workCompleted.submit') as string}</Text>}
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
  headerRow: {flexDirection: 'row', borderBottomWidth: 2, borderBottomColor: '#e0e0e0', paddingBottom: 8, marginBottom: 4, alignItems: 'center'},
  row: {flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems: 'center'},
  cell: {fontSize: 13, color: '#333'},
  cellName: {flex: 2.5, fontWeight: '500'},
  cellPrice: {flex: 1.2, textAlign: 'right'},
  cellCheck: {width: 50, alignItems: 'center', justifyContent: 'center'},
  checkbox: {width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center'},
  checkboxChecked: {backgroundColor: '#30B0C7', borderColor: '#30B0C7'},
  checkmark: {color: '#fff', fontSize: 15, fontWeight: 'bold'},
  summaryRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  summaryLabel: {fontSize: 15, fontWeight: '600', color: '#333'},
  summaryValue: {fontSize: 18, fontWeight: '700', color: '#007AFF'},
  errorText: {color: '#FF3B30', fontSize: 13, marginBottom: 12, textAlign: 'center'},
  submitButton: {backgroundColor: '#30B0C7', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8},
  submitDisabled: {backgroundColor: '#ccc'},
  submitText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});

export default OrderWorkCompletedScreen;
