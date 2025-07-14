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

const OrdersScreen: React.FC<OrdersScreenProps> = ({navigation}) => {
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
        <Text style={styles.orderId}>Orden #{item.id}</Text>
        <Text style={styles.orderDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={styles.orderDetails}>
        <Text style={styles.orderCustomer}>Cliente: {item.customerId}</Text>
        <Text style={styles.orderStatus}>Estado: En Progreso</Text>
      </View>
    </TouchableOpacity>
  );

  const EmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No hay órdenes disponibles</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={handleCreateOrder}>
        <Text style={styles.createButtonText}>Crear Primera Orden</Text>
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
      
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={handleCreateOrder}>
        <Text style={styles.floatingButtonText}>+</Text>
      </TouchableOpacity>
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
    marginTop: 5,
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
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default OrdersScreen; 