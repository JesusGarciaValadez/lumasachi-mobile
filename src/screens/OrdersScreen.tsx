import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import {OrdersScreenProps} from '../types/navigation';
import {useTranslation} from 'react-i18next';
import {getStatusTranslation} from '../utils/roleTranslations';
import {useOrders} from '../hooks/useOrders';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { formatDateTimeLocal, formatDateLocal } from '../utils/datetime';

const OrdersScreen: React.FC<OrdersScreenProps> = ({navigation}) => {
  const {t} = useTranslation();
  const {orders, isLoading, ensureLoaded, refresh} = useOrders();
  const insets = useSafeAreaInsets();
  const [fabHeight, setFabHeight] = useState(0);
  const onFabLayout = (e: any) => setFabHeight(e?.nativeEvent?.layout?.height || 0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    void ensureLoaded();
  }, [ensureLoaded]);

  const interItemSpacing = 10; // matches margin in styles.orderItem
  const bottomSpacer = useMemo(() => insets.bottom + (fabHeight ? fabHeight / 2 + interItemSpacing : 72), [insets.bottom, fabHeight]);

  const onRefresh = async () => {
    await refresh();
  };

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetails', {orderId});
  };

  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder');
  };

  const renderOrderItem = ({item}: {item: any}) => {
    const {backgroundColor, textColor, statusLedColor, showPriority} = getCardVisuals(item.status);
    let secondaryColor = getSecondaryTextColor(textColor, isDark);
    if (item.status === 'Cancelled') {
      secondaryColor = DARKEST_GRAY;
    }
    const customerName = item?.customer?.full_name || '-';
    const assignedToName = item?.assigned_to?.full_name || '-';
    const createdAt = formatDateLocal(item?.created_at);
    const completedAt = item?.actual_completion ? formatDateTimeLocal(item.actual_completion) : null;

    return (
      <TouchableOpacity
        style={[
          styles.orderItem,
          isDark ? styles.orderItemDark : styles.orderItemLight,
          {backgroundColor},
        ]}
        onPress={() => handleOrderPress(item.id)}
        accessibilityRole="button"  
        accessibilityLabel={`${t('orders.order')} #${item.id}`}
      >
        <View style={styles.rowBetween}>
          <Text style={[styles.label, {color: secondaryColor}]}> 
            {t('orders.customer')}: <Text style={[styles.valueBold, {color: textColor}]}>{customerName}</Text>
          </Text>
          <View style={styles.statusContainer}>
            <Text style={[styles.label, {color: secondaryColor}]}>
              {t('orders.status')}: <Text style={[styles.value, {color: textColor}]}>{t(getStatusTranslation(item.status))}</Text>
            </Text>
            {!!statusLedColor && <View style={[styles.statusDot, {backgroundColor: statusLedColor}]} />}
          </View>
        </View>

        <View style={styles.rowBetween}>
          <Text style={[styles.label, {color: secondaryColor}]}> 
            {t('orders.subject')}: <Text style={[styles.value, {color: textColor}]}>{item.title}</Text>
          </Text>
          {showPriority && (
            <View style={styles.priorityContainer}>
              <Text style={[styles.label, {color: secondaryColor}]}> {t('orders.priority')}: <Text style={[styles.value, {color: textColor}]}>{t(priorityTranslationKey(item.priority))}</Text></Text>
              <View style={[styles.priorityDot, {backgroundColor: getPriorityColor(item.priority)}]} />
            </View>
          )}
        </View>

        <View style={styles.rowBetween}>
          <Text style={[styles.label, {color: secondaryColor}]}> 
            {t('orders.assignedTo')}: <Text style={[styles.value, {color: textColor}]}>{assignedToName}</Text>
          </Text>
          {!!createdAt && (
            <Text style={[styles.meta, {color: secondaryColor}]}>
              {t('orders.createdAt')}: {createdAt}
            </Text>
          )}
        </View>

        {completedAt && (
          <View style={styles.rowBetween}>
            <Text style={[styles.label, {color: secondaryColor}]}> 
              {t('orders.completed')}: <Text style={[styles.value, {color: textColor}]}>{completedAt}</Text>
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>{t('orders.noOrdersAvailable')}</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateOrder}>
        <Text style={styles.createButtonText}>{t('orders.createFirstOrder')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => String(item.id)}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={[
          orders.length === 0 ? styles.emptyList : undefined,
          {paddingBottom: bottomSpacer},
        ]}
        ListFooterComponent={<View style={{height: bottomSpacer}} />}
      />

      <View style={[styles.fabContainer, {bottom: insets.bottom + 16}]} pointerEvents="box-none" onLayout={onFabLayout}>
        <TouchableOpacity style={[styles.createButton, isDark ? styles.createButtonDark : styles.createButtonLight]} onPress={handleCreateOrder} accessibilityRole="button" activeOpacity={0.85}>
          <Text style={styles.createButtonText}>{t('orders.createNewOrder')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerLight: {
    backgroundColor: '#f5f5f5',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  orderItem: {
    margin: 10,
    padding: 15,
    borderRadius: 8,
    // Shadow and border in theme variants
  },
  orderItemLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#D1D1D6',
  },
  orderItemDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  valueBold: {
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    opacity: 0.9,
  },
  priorityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 8,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignSelf: 'center',
    minWidth: 240,
    alignItems: 'center',
  },
  createButtonLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  createButtonDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#1F1F1F',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
});

export default OrdersScreen; 

// Helpers
const LIGHT_BLUE = '#74B9FF';
const LIGHT_GRAY = '#E5E5EA';
const LIGHTEST_GRAY = '#F5F5F7';
const GRAY = '#8E8E93';
const DARK_GRAY = '#3A3A3C';
const DARKEST_GRAY = '#1C1C1E';
const BLUE = '#007AFF';
const GREEN = '#34C759';
const LIGHT_GREEN = '#66D17A';
const RED = '#FF3B30';
const LIGHT_RED = '#FF6B6B';
const YELLOW = '#FFD60A';
const ORANGE = '#FF9500';

type Visuals = {backgroundColor: string; textColor: string; statusLedColor: string | null; showPriority: boolean};

const statusToVisuals = (status: string): Visuals => {
  switch (status) {
    case 'Open':
      // LED only rule -> background/text fallback
      return {backgroundColor: LIGHTEST_GRAY, textColor: DARKEST_GRAY, statusLedColor: LIGHT_BLUE, showPriority: true};
    case 'In Progress':
      return {backgroundColor: BLUE, textColor: '#FFFFFF', statusLedColor: BLUE, showPriority: false};
    case 'Ready for delivery':
      return {backgroundColor: GREEN, textColor: '#FFFFFF', statusLedColor: GREEN, showPriority: false};
    case 'Completed':
      return {backgroundColor: GREEN, textColor: '#FFFFFF', statusLedColor: GREEN, showPriority: false};
    case 'Delivered':
      return {backgroundColor: GREEN, textColor: '#FFFFFF', statusLedColor: GREEN, showPriority: false};
    case 'Paid':
      return {backgroundColor: LIGHT_GREEN, textColor: '#FFFFFF', statusLedColor: LIGHT_GREEN, showPriority: false};
    case 'Returned':
      return {backgroundColor: LIGHT_RED, textColor: DARK_GRAY, statusLedColor: null, showPriority: false};
    case 'Not paid':
      return {backgroundColor: RED, textColor: '#FFFFFF', statusLedColor: null, showPriority: false};
    case 'On hold':
      return {backgroundColor: LIGHT_GRAY, textColor: DARK_GRAY, statusLedColor: null, showPriority: false};
    case 'Cancelled':
      return {backgroundColor: GRAY, textColor: DARK_GRAY, statusLedColor: null, showPriority: false};
    default:
      return {backgroundColor: '#FFFFFF', textColor: '#333333', statusLedColor: null, showPriority: true};
  }
};

const priorityTranslationKey = (priority: string): string => {
  const map: Record<string, string> = {
    Low: 'orders.priorities.low',
    Normal: 'orders.priorities.normal',
    High: 'orders.priorities.high',
    Urgent: 'orders.priorities.urgent',
  };
  return map[priority] || 'orders.priorities.normal';
};

const getCardVisuals = (status: string): Visuals => statusToVisuals(status);

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'Low':
      return GREEN;
    case 'Normal':
      return YELLOW;
    case 'High':
      return ORANGE;
    case 'Urgent':
      return RED;
    default:
      return YELLOW;
  }
};

function getSecondaryTextColor(primaryColor: string, isDark: boolean): string {
  // If primary text is light (white), make secondary slightly lighter but still readable
  if (primaryColor === '#FFFFFF') {
    return isDark ? '#E5E5EA' : '#F2F2F7';
  }
  // For dark primaries, use a softened variant
  if (primaryColor === DARKEST_GRAY || primaryColor === DARK_GRAY) {
    return isDark ? '#A1A1AA' : '#6B7280';
  }
  // Fallback
  return isDark ? '#C7C7CC' : '#666666';
}