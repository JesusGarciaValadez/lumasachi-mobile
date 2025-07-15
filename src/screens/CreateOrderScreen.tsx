import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import {User, UserRole} from '../types';
import {validateOrderForm} from '../utils/orderValidation';

const CreateOrderScreen: React.FC = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    title: '',
    description: '',
    priority: 'Normal' as 'Low' | 'Normal' | 'High' | 'Urgent',
    category: '',
  });
  const [customers, setCustomers] = useState<User[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    // Load customers (users with CUSTOMER role)
    const loadCustomers = async () => {
      try {
        // TODO: Replace with actual API call
        // const customersData = await fetchUsers({ role: UserRole.CUSTOMER });
        
        // Temporary mock data
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
      } catch (error) {
        console.error('Error loading customers:', error);
      }
    };

    loadCustomers();
  }, []);

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

  const handleSubmit = () => {
    const validationResult = validateOrderForm(formData, t);
    if (!validationResult.isValid) {
      let errorMessage = t(`createOrder.errors.${validationResult.errorMessage}`);
      
      // Add specific missing fields information
      if (validationResult.errorMessage === 'missingFields' && validationResult.missingFields) {
        errorMessage = `${errorMessage}: ${validationResult.missingFields.join(', ')}`;
      }
      
      Alert.alert(t('common.error'), errorMessage);
      return;
    }

    Alert.alert(
      t('createOrder.title'),
      t('createOrder.confirmCreate'),
      [
        {text: t('common.cancel'), style: 'cancel'},
        {
          text: t('common.create'),
          onPress: () => {
            // TODO: Implement order creation logic
            console.log('Order created:', formData);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const priorities: Array<{key: string; label: string; value: 'Low' | 'Normal' | 'High' | 'Urgent'}> = [
    {key: 'low', label: t('orders.priorities.low'), value: 'Low'},
    {key: 'normal', label: t('orders.priorities.normal'), value: 'Normal'},
    {key: 'high', label: t('orders.priorities.high'), value: 'High'},
    {key: 'urgent', label: t('orders.priorities.urgent'), value: 'Urgent'},
  ];

  const renderCustomerItem = ({item}: {item: User}) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleCustomerSelect(item)}
      accessibilityLabel={t('createOrder.customerItemAccessibility', { 
        customerName: `${item.firstName} ${item.lastName}`, 
        company: item.company || 'Sin empresa' 
      })}
      accessibilityRole="button">
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('createOrder.customerInfo')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('orders.customer')} *</Text>
          <TouchableOpacity
            style={styles.customerSelector}
            onPress={() => setShowCustomerModal(true)}
            accessibilityLabel={t('createOrder.selectCustomerAccessibility')}
            accessibilityRole="button"
            accessibilityHint={formData.customerName ? `${t('createOrder.customerName')}: ${formData.customerName}` : undefined}>
            <Text style={[styles.customerSelectorText, !formData.customerName && styles.placeholder]}>
              {formData.customerName || t('createOrder.selectCustomer')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('createOrder.orderDetails')}</Text>
        <View style={styles.card}>
          <Text style={styles.label}>{t('orders.orderTitle')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.title}
            onChangeText={(value) => handleInputChange('title', value)}
            placeholder={t('createOrder.orderTitle')}
            accessibilityLabel={t('orders.orderTitle')}
            accessibilityHint={t('createOrder.orderTitle')}
          />

          <Text style={styles.label}>{t('orders.description')} *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(value) => handleInputChange('description', value)}
            placeholder={t('createOrder.orderDescription')}
            multiline
            numberOfLines={4}
            accessibilityLabel={t('orders.description')}
            accessibilityHint={t('createOrder.orderDescription')}
          />

          <Text style={styles.label}>{t('orders.category')}</Text>
          <TextInput
            style={styles.input}
            value={formData.category}
            onChangeText={(value) => handleInputChange('category', value)}
            placeholder={t('createOrder.workCategory')}
            accessibilityLabel={t('orders.category')}
            accessibilityHint={t('createOrder.workCategory')}
          />

          <Text style={styles.label}>{t('orders.priority')}</Text>
          <View style={styles.priorityContainer} accessibilityRole="radiogroup">
            {priorities.map((priority) => (
              <TouchableOpacity
                key={priority.key}
                style={[
                  styles.priorityButton,
                  formData.priority === priority.value && styles.priorityButtonActive,
                ]}
                onPress={() => handleInputChange('priority', priority.value)}
                accessibilityLabel={t('createOrder.priorityButtonAccessibility', { priority: priority.label })}
                accessibilityRole="button"
                accessibilityState={{ selected: formData.priority === priority.value }}>
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
          style={styles.submitButton}
          onPress={handleSubmit}
          accessibilityLabel={t('createOrder.submitButtonAccessibility')}
          accessibilityRole="button">
          <Text style={styles.submitButtonText}>{t('createOrder.title')}</Text>
        </TouchableOpacity>
      </View>

      {/* Customer Selection Modal */}
      <Modal
        visible={showCustomerModal}
        animationType="slide"
        presentationStyle="pageSheet"
        accessibilityViewIsModal={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('createOrder.selectCustomer')}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCustomerModal(false)}
              accessibilityLabel={t('common.closeModal')}
              accessibilityRole="button">
              <Text style={styles.closeButtonText}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={customers}
            renderItem={renderCustomerItem}
            keyExtractor={(item) => item.id}
            style={styles.customerList}
            accessibilityLabel={t('createOrder.selectCustomer')}
            accessibilityRole="list"
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

export default CreateOrderScreen; 