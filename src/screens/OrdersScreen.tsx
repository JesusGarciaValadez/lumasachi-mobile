import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import {OrdersScreenProps} from '../types/navigation';
import {Order} from '../types/index';
import {useTranslation} from 'react-i18next';

const OrdersScreen: React.FC<OrdersScreenProps> = ({navigation}) => {
  const {t} = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleOrderPress = (orderId: string) => {
    navigation.navigate('OrderDetails', {orderId});
  };

  const handleCreateOrder = () => {
    navigation.navigate('CreateOrder');
  };

  const renderOrderItem = ({item}: {item: Order}) => (
    <TouchableOpacity
      style={styles.orderItem}
      onPress={() => handleOrderPress(item.id)}>
      <View style={styles.orderHeader}>
        <Text style={styles.orderId}>{t('orders.order')} #{item.id}</Text>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.orderDetails}>
        <Text style={styles.orderCustomer}>{t('orders.customer')}: {item.customerId}</Text>
        <Text style={styles.orderStatus}>{t('orders.status')}: {t(`orders.statuses.${item.status}`)}</Text>
      </View>
    </TouchableOpacity>
  );

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
    <View style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : undefined}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  orderItem: {
    backgroundColor: '#ffffff',
    margin: 10,
    padding: 15,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
  },
  orderDetails: {
    flexDirection: 'column',
  },
  orderCustomer: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  orderStatus: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
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
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default OrdersScreen; 