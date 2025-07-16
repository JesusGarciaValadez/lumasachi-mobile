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
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {User, UserRole, Order, FileSelection, MultipleFileUploadResult} from '../types';
import {validateOrderForm} from '../utils/orderValidation';
import {FileUploader} from '../components/ui';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';

const EditOrderScreen: React.FC<EditOrderScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
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
  const [selectedFiles, setSelectedFiles] = useState<FileSelection[]>([]);
  const [uploadResults, setUploadResults] = useState<MultipleFileUploadResult | null>(null);

  useEffect(() => {
    const loadOrderData = async () => {
      try {
        clearError();
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
            company: t('common.mockData.companyABC') as string,
            phoneNumber: '+1234567890',
            isActive: true,
            languagePreference: 'es',
            customerType: 'corporate',
            customerNotes: t('common.mockData.frequentCustomer') as string,
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
            company: t('common.mockData.companyXYZ') as string,
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
          title: t('common.mockData.repairOrder') as string,
          description: t('common.mockData.industrialRepair') as string,
          status: 'In Progress',
          priority: 'High',
          category: t('common.mockData.repair') as string,
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
        
        await errorService.logError(null, {
          component: 'EditOrderScreen',
          operation: 'loadOrderData',
          success: true,
          orderId,
          customerCount: mockCustomers.length,
        });
      } catch (error) {
        const errorMessage = t('editOrder.loadError') as string;
        await errorService.logError(error as Error, {
          component: 'EditOrderScreen',
          operation: 'loadOrderData',
          orderId,
        });
        handleError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadOrderData();
  }, [orderId, t, handleError, clearError]);

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

  const handleFilesChanged = (files: FileSelection[]) => {
    setSelectedFiles(files);
  };

  const handleFileUploadComplete = (result: MultipleFileUploadResult) => {
    setUploadResults(result);
    console.log('Files uploaded:', result);
  };

  const handleFileUploadError = (error: string) => {
    console.error('File upload error:', error);
    handleError(new Error(error));
  };

  const handleReset = () => {
    if (!originalOrder) return;
    
    Alert.alert(
      t('editOrder.resetChanges') as string,
      t('editOrder.confirmReset') as string,
      [
        {text: t('common.cancel') as string, style: 'cancel'},
        {
          text: t('common.reset') as string,
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
            clearError();
            errorService.logError(null, {
              component: 'EditOrderScreen',
              operation: 'resetForm',
              success: true,
              orderId: originalOrder.id,
            });
          },
        },
      ]
    );
  };

  const handleSubmit = () => {
    const translateString = (key: string) => t(key) as string;
    const validationResult = validateOrderForm(formData, translateString);
    if (!validationResult.isValid) {
      let errorMessage = t(`editOrder.errors.${validationResult.errorMessage}`) as string;
      
      // Add specific missing fields information
      if (validationResult.errorMessage === 'missingFields' && validationResult.missingFields) {
        errorMessage = `${errorMessage}: ${validationResult.missingFields.join(', ')}`;
      }
      
              const validationError = new Error(errorMessage);
        errorService.logError(validationError, {
          component: 'EditOrderScreen',
          operation: 'formValidation',
          orderId,
          validationResult,
          formData,
        });
        handleError(validationError);
      return;
    }

    Alert.alert(
      t('editOrder.saveChanges') as string,
      t('editOrder.confirmSave') as string,
      [
        {text: t('common.cancel') as string, style: 'cancel'},
        {
          text: t('common.save') as string,
          onPress: () => {
            const updateOrder = async () => {
              try {
                clearError();
                // TODO: Uncomment when backend is implemented
                // await updateOrderAPI(orderId, formData);
                console.log('Order updated:', formData);
                
                await errorService.logError(null, {
                  component: 'EditOrderScreen',
                  operation: 'updateOrder',
                  success: true,
                  orderId,
                  formData,
                });
                
                Alert.alert(
                  t('common.success') as string,
                  t('editOrder.updateSuccess') as string,
                  [
                    {
                      text: t('common.ok') as string,
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              } catch (error) {
                const errorMessage = t('editOrder.updateError') as string;
                await errorService.logError(error as Error, {
                  component: 'EditOrderScreen',
                  operation: 'updateOrder',
                  orderId,
                  formData,
                });
                handleError(error as Error);
              }
            };
            updateOrder();
          },
        },
      ]
    );
  };

  const statuses = [
    {key: 'open', label: t('orders.statuses.open') as string, value: 'Open'},
    {key: 'inProgress', label: t('orders.statuses.inProgress') as string, value: 'In Progress'},
    {key: 'readyForDelivery', label: t('orders.statuses.readyForDelivery') as string, value: 'Ready for delivery'},
    {key: 'delivered', label: t('orders.statuses.delivered') as string, value: 'Delivered'},
    {key: 'paid', label: t('orders.statuses.paid') as string, value: 'Paid'},
    {key: 'returned', label: t('orders.statuses.returned') as string, value: 'Returned'},
    {key: 'notPaid', label: t('orders.statuses.notPaid') as string, value: 'Not paid'},
    {key: 'cancelled', label: t('orders.statuses.cancelled') as string, value: 'Cancelled'},
  ];

  const priorities: Array<{key: string; label: string; value: 'Low' | 'Normal' | 'High' | 'Urgent'}> = [
    {key: 'low', label: t('orders.priorities.low') as string, value: 'Low'},
    {key: 'normal', label: t('orders.priorities.normal') as string, value: 'Normal'},
    {key: 'high', label: t('orders.priorities.high') as string, value: 'High'},
    {key: 'urgent', label: t('orders.priorities.urgent') as string, value: 'Urgent'},
  ];

  const renderCustomerItem = ({item}: {item: User}) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleCustomerSelect(item)}>
      <Text style={styles.customerName}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={styles.customerDetails}>
        {item.email} • {item.company || t('common.noCompany') as string}
      </Text>
      {item.customerType && (
        <Text style={styles.customerType}>
          {item.customerType === 'corporate' 
            ? t('common.customerTypes.corporate') as string 
            : t('common.customerTypes.individual') as string}
        </Text>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('editOrder.loadingOrder') as string}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.orderId}>{t('orders.editingOrder') as string} #{orderId}</Text>
        </View>

        {hasError && (
          <ErrorMessage 
            error={error}
            onRetry={clearError}
            onDismiss={clearError}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createOrder.customerInfo') as string}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>{t('orders.customer') as string} *</Text>
            <TouchableOpacity
              style={styles.customerSelector}
              onPress={() => setShowCustomerModal(true)}>
              <Text style={[styles.customerSelectorText, !formData.customerName && styles.placeholder]}>
                {formData.customerName || t('createOrder.selectCustomer') as string}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createOrder.orderDetails') as string}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>{t('orders.orderTitle') as string} *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder={t('createOrder.orderTitle') as string}
            />

            <Text style={styles.label}>{t('orders.description') as string} *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder={t('createOrder.orderDescription') as string}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>{t('orders.category') as string}</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(value) => handleInputChange('category', value)}
              placeholder={t('createOrder.workCategory') as string}
            />

            <Text style={styles.label}>{t('orders.status') as string}</Text>
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

            <Text style={styles.label}>{t('orders.priority') as string}</Text>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('editOrder.attachments') as string}</Text>
          <FileUploader
            entityType="order"
            entityId={orderId}
            title={t('editOrder.attachments') as string}
            subtitle={t('editOrder.attachmentsDescription') as string}
            maxFiles={10}
            allowMultiple={true}
            showUploadButton={true}
            onFilesChanged={handleFilesChanged}
            onUploadComplete={handleFileUploadComplete}
            onUploadError={handleFileUploadError}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}>
            <Text style={styles.resetButtonText}>{t('editOrder.resetChanges') as string}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>{t('editOrder.saveChanges') as string}</Text>
          </TouchableOpacity>
        </View>

        {/* Customer Selection Modal */}
        <Modal
          visible={showCustomerModal}
          animationType="slide"
          presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectCustomer') as string}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCustomerModal(false)}>
                <Text style={styles.closeButtonText}>{t('common.close') as string}</Text>
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