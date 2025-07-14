import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {EditOrderScreenProps} from '../types/navigation';
import {useTranslation} from 'react-i18next';

const EditOrderScreen: React.FC<EditOrderScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;
  const {t} = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    customer: '',
    description: '',
    priority: t('orders.priorities.normal'),
    category: '',
    status: t('orders.statuses.open'),
  });

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        // TODO: Uncomment when backend is implemented
        // const order = await fetchOrder(orderId);
        // setFormData({
        //   customer: order.customer,
        //   description: order.description,
        //   priority: order.priority,
        //   category: order.category,
        //   status: order.status,
        // });
        
        // Temporary placeholder data until backend is ready
        setFormData({
          customer: 'Cliente Demo',
          description: 'Descripción de la orden existente',
          priority: t('orders.priorities.normal'),
          category: 'Reparación',
          status: t('orders.statuses.inProgress'),
        });
      } catch (error) {
        Alert.alert(t('common.error'), t('editOrder.loadError'));
      } finally {
        setIsLoading(false);
      }
    };
    loadOrderData();
  }, [orderId, t]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleSubmit = () => {
    Alert.alert(
      t('editOrder.saveChanges'),
      t('editOrder.confirmSave'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.save'),
          onPress: () => {
            const updateOrder = async () => {
              try {
                // TODO: Uncomment when backend is implemented
                // await updateOrderAPI(orderId, formData);
                Alert.alert(t('common.success'), t('editOrder.updateSuccess'));
                navigation.goBack();
              } catch (error) {
                Alert.alert(t('common.error'), t('editOrder.updateError'));
              }
            };
            updateOrder();
          },
        },
      ]
    );
  };

  const statuses = Object.keys(t('orders.statuses', {returnObjects: true})).map(key => ({
    key,
    label: t(`orders.statuses.${key}`),
  }));

  const priorities = [
    {key: 'low', label: t('orders.priorities.low')},
    {key: 'normal', label: t('orders.priorities.normal')},
    {key: 'high', label: t('orders.priorities.high')},
    {key: 'urgent', label: t('orders.priorities.urgent')},
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('editOrder.loadingOrder')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>{t('orders.editingOrder')} #{orderId}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('createOrder.customerInfo')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('orders.customer')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.customer}
            onChangeText={(value) => handleInputChange('customer', value)}
            placeholder={t('createOrder.customerName')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('createOrder.orderDetails')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('orders.description')} *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder={t('createOrder.orderDescription')}
            multiline
            numberOfLines={4}
          />

          <Text style={styles.label}>{t('orders.category')}</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(value) => handleInputChange('category', value)}
            placeholder={t('createOrder.workCategory')}
          />

          <Text style={styles.label}>{t('orders.status')}</Text>
          <View style={styles.statusContainer}>
            {statuses.map((status) => (
              <TouchableOpacity
                key={status.key}
                style={[
                  styles.statusButton,
                  formData.status === status.label && styles.statusButtonActive,
                ]}
                onPress={() => handleInputChange('status', status.label)}>
                <Text
                  style={[
                    styles.statusButtonText,
                    formData.status === status.label && styles.statusButtonTextActive,
                  ]}>
                  {status.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>{t('orders.priority')}</Text>
          <View style={styles.priorityContainer}>
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority.key}
                style={[
                  styles.priorityButton,
                  formData.priority === priority.label && styles.priorityButtonActive,
                ]}
                onPress={() => handleInputChange('priority', priority.label)}>
                <Text
                  style={[
                    styles.priorityButtonText,
                    formData.priority === priority.label && styles.priorityButtonTextActive,
                  ]}>
                  {priority.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{t('editOrder.saveChanges')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    marginBottom: 20,
  },
  orderId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 2,
    marginVertical: 2,
    alignItems: 'center',
    minWidth: '45%',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  statusButtonTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  priorityButtonTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  buttonContainer: {
    margin: 20,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditOrderScreen; 