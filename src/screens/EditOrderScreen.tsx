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
  Modal,
  FlatList,
} from 'react-native';
import {EditOrderScreenProps} from '../types/navigation';
import {useTranslation} from 'react-i18next';
import {User, UserRole, Order} from '../types';
import {validateOrderForm} from '../utils/orderValidation';

const EditOrderScreen: React.FC<EditOrderScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;
  const {t} = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    title: '',
    description: '',
    priority: 'Normal' as 'Low' | 'Normal' | 'High' | 'Urgent',
    category: '',
    status: 'Open' as any,
  });
  const [customers, setCustomers] = useState<User[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [originalOrder, setOriginalOrder] = useState<Order | null>(null);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        // TODO: Uncomment when backend is implemented
        // const order = await fetchOrder(orderId);
        // const customersData = await fetchUsers({ role: UserRole.CUSTOMER });
        // setCustomers(customersData);
        
        // Temporary placeholder data until backend is ready
        const mockCustomers: User[] = [
          {
            id: '1',
            firstName: 'Juan',
            lastName: 'Pérez',
            email: 'juan@example.com',
            role: UserRole.CUSTOMER,
            company: 'Empresa ABC',
            phoneNumber: '+1234567890',
            isActive: true,
            languagePreference: 'es',
            customerType: 'corporate',
            customerNotes: 'Cliente frecuente',
            isCustomer: true,
            isEmployee: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            firstName: 'María',
            lastName: 'González',
            email: 'maria@example.com',
            role: UserRole.CUSTOMER,
            company: 'Empresa XYZ',
            phoneNumber: '+0987654321',
            isActive: true,
            languagePreference: 'es',
            customerType: 'individual',
            isCustomer: true,
            isEmployee: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        setCustomers(mockCustomers);
        
        // Mock order data
        const mockOrder: Order = {
          id: orderId,
          customerId: '1',
          customer: mockCustomers[0],
          title: 'Orden de Reparación',
          description: 'Reparación de equipo industrial',
          status: 'In Progress',
          priority: 'High',
          category: 'Reparación',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin',
          updatedBy: 'admin',
        };
        
        setOriginalOrder(mockOrder);
        setFormData({
          customerId: mockOrder.customerId,
          customerName: mockOrder.customer ? `${mockOrder.customer.firstName} ${mockOrder.customer.lastName}` : '',
          title: mockOrder.title,
          description: mockOrder.description,
          priority: mockOrder.priority,
          category: mockOrder.category || '',
          status: mockOrder.status,
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

  const handleCustomerSelect = (customer: User) => {
    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: `${customer.firstName} ${customer.lastName}`,
    }));
    setShowCustomerModal(false);
  };

  const handleReset = () => {
    if (!originalOrder) return;
    
    Alert.alert(
      t('editOrder.resetChanges'),
      t('editOrder.confirmReset'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: () => {
            setFormData({
              customerId: originalOrder.customerId,
              customerName: originalOrder.customer ? `${originalOrder.customer.firstName} ${originalOrder.customer.lastName}` : '',
              title: originalOrder.title,
              description: originalOrder.description,
              priority: originalOrder.priority,
              category: originalOrder.category || '',
              status: originalOrder.status,
            });
          },
        },
      ]
    );
  };

  const handleSubmit = () => {
    const validationResult = validateOrderForm(formData);
    if (!validationResult.isValid) {
      Alert.alert(t('common.error'), t(`editOrder.errors.${validationResult.errorMessage}`));
      return;
    }

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
                console.log('Order updated:', formData);
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

  const statuses = [
    {key: 'open', label: t('orders.statuses.open'), value: 'Open'},
    {key: 'inProgress', label: t('orders.statuses.inProgress'), value: 'In Progress'},
    {key: 'readyForDelivery', label: t('orders.statuses.readyForDelivery'), value: 'Ready for delivery'},
    {key: 'delivered', label: t('orders.statuses.delivered'), value: 'Delivered'},
    {key: 'paid', label: t('orders.statuses.paid'), value: 'Paid'},
    {key: 'returned', label: t('orders.statuses.returned'), value: 'Returned'},
    {key: 'notPaid', label: t('orders.statuses.notPaid'), value: 'Not paid'},
    {key: 'cancelled', label: t('orders.statuses.cancelled'), value: 'Cancelled'},
  ];

  const priorities: Array<{key: string; label: string; value: 'Low' | 'Normal' | 'High' | 'Urgent'}> = [
    {key: 'low', label: t('orders.priorities.low'), value: 'Low'},
    {key: 'normal', label: t('orders.priorities.normal'), value: 'Normal'},
    {key: 'high', label: t('orders.priorities.high'), value: 'High'},
    {key: 'urgent', label: t('orders.priorities.urgent'), value: 'Urgent'},
  ];

  const renderCustomerItem = ({item}: {item: User}) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleCustomerSelect(item)}>
      <Text style={styles.customerName}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={styles.customerDetails}>
        {item.email} • {item.company || 'Sin empresa'}
      </Text>
      {item.customerType && (
        <Text style={styles.customerType}>
          {item.customerType === 'corporate' ? 'Corporativo' : 'Individual'}
        </Text>
      )}
    </TouchableOpacity>
  );

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
          <TouchableOpacity
            style={styles.customerSelector}
            onPress={() => setShowCustomerModal(true)}>
            <Text style={[styles.customerSelectorText, !formData.customerName && styles.placeholder]}>
              {formData.customerName || t('createOrder.selectCustomer')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('createOrder.orderDetails')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('orders.title')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder={t('createOrder.orderTitle')}
          />

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
                  formData.status === status.value && styles.statusButtonActive,
                ]}
                onPress={() => handleInputChange('status', status.value)}>
                <Text
                  style={[
                    styles.statusButtonText,
                    formData.status === status.value && styles.statusButtonTextActive,
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
                  formData.priority === priority.value && styles.priorityButtonActive,
                ]}
                onPress={() => handleInputChange('priority', priority.value)}>
                <Text
                  style={[
                    styles.priorityButtonText,
                    formData.priority === priority.value && styles.priorityButtonTextActive,
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
          style={styles.resetButton}
          onPress={handleReset}>
          <Text style={styles.resetButtonText}>{t('editOrder.resetChanges')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>{t('editOrder.saveChanges')}</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('createOrder.selectCustomer')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCustomerModal(false)}>
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={customers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            style={styles.customerList}
          />
        </View>
      </Modal>
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
  customerSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  customerSelectorText: {
    fontSize: 16,
    color: '#333333',
  },
  placeholder: {
    color: '#999999',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  resetButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  customerList: {
    flex: 1,
  },
  customerItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  customerDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  customerType: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
});

export default EditOrderScreen; 