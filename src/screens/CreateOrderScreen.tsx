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
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {User, UserRole, FileSelection, MultipleFileUploadResult} from '../types';
import {validateOrderForm} from '../utils/orderValidation';
import {FileUploader} from '../components/ui';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';

const CreateOrderScreen: React.FC = () => {
  const navigation = useNavigation();
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
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
  const [selectedFiles, setSelectedFiles] = useState<FileSelection[]>([]);
  const [uploadResults, setUploadResults] = useState<MultipleFileUploadResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load customers (users with CUSTOMER role)
    const loadCustomers = async () => {
      try {
        setIsLoading(true);
        clearError();
        
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
      } catch (error) {
        const errorMessage = t('createOrder.errors.loadCustomersFailed') as string;
        errorService.logError(error, {
          context: 'CreateOrderScreen.loadCustomers',
          action: 'load_customers',
          metadata: {
            timestamp: new Date().toISOString(),
          },
        });
        
        await handleError(error);
        Alert.alert(
          t('common.error') as string,
          errorMessage
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadCustomers();
  }, [handleError, clearError, t]);

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
    Alert.alert(t('common.error') as string, error);
  };

  const handleSubmit = () => {
    const validationResult = validateOrderForm(formData, (key: string) => t(key) as string);
    if (!validationResult.isValid) {
      let errorMessage = t(`createOrder.errors.${validationResult.errorMessage}`) as string;
      
      // Add specific missing fields information
      if (validationResult.errorMessage === 'missingFields' && validationResult.missingFields) {
        errorMessage = `${errorMessage}: ${validationResult.missingFields.join(', ')}`;
      }
      
      Alert.alert(t('common.error') as string, errorMessage);
      return;
    }

    const orderData = {
      ...formData,
      attachments: selectedFiles,
      attachmentCount: selectedFiles.length,
    };

    let confirmMessage = t('createOrder.confirmCreate') as string;
    if (selectedFiles.length > 0) {
      confirmMessage += `\n\n${t('createOrder.attachmentsWillBeUploaded', { count: selectedFiles.length }) as string}`;
    }

    Alert.alert(
      t('createOrder.title') as string,
      confirmMessage,
      [
        {text: t('common.cancel') as string, style: 'cancel'},
        {
          text: t('common.create') as string,
          onPress: () => {
            // TODO: Implement order creation logic
            console.log('Order created:', orderData);
            
            // TODO: After order is created, upload attachments if any
            if (selectedFiles.length > 0) {
              // Upload files to the created order
              // This would be handled by the FileUploader component
              console.log('Files to upload:', selectedFiles);
            }
            
            navigation.goBack();
          },
        },
      ]
    );
  };

  const priorities: Array<{key: string; label: string; value: 'Low' | 'Normal' | 'High' | 'Urgent'}> = [
    {key: 'low', label: t('orders.priorities.low') as string, value: 'Low'},
    {key: 'normal', label: t('orders.priorities.normal') as string, value: 'Normal'},
    {key: 'high', label: t('orders.priorities.high') as string, value: 'High'},
    {key: 'urgent', label: t('orders.priorities.urgent') as string, value: 'Urgent'},
  ];

  const renderCustomerItem = ({item}: {item: User}) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleCustomerSelect(item)}
      accessibilityLabel={t('createOrder.customerItemAccessibility', { 
        customerName: `${item.firstName} ${item.lastName}`, 
        company: item.company || t('common.noCompany') as string 
      }) as string}
      accessibilityRole="button">
      <Text style={styles.customerName}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={styles.customerDetails}>
        {item.email} • {item.company || t('common.noCompany') as string}
      </Text>
      {item.customerType && (
        <Text style={styles.customerType}>
          {item.customerType === 'corporate' ? t('common.customerTypes.corporate') as string : t('common.customerTypes.individual') as string}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <ErrorMessage 
          error={error} 
          visible={hasError} 
          onRetry={clearError}
          style={styles.errorMessage}
        />
        
        <View style={styles.header}>
          <Text style={styles.title}>{t('createOrder.title') as string}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createOrder.customerInfo') as string}</Text>
          
          <TouchableOpacity
            style={styles.customerSelector}
            onPress={() => setShowCustomerModal(true)}
            accessibilityLabel={t('createOrder.selectCustomerAccessibility') as string}
            accessibilityRole="button">
            <Text style={styles.selectorLabel}>{t('createOrder.selectCustomer') as string}</Text>
            <Text style={styles.selectorValue}>
              {formData.customerName || t('createOrder.selectCustomer') as string}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createOrder.orderDetails') as string}</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('createOrder.orderTitle') as string}</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder={t('createOrder.orderTitle') as string}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('createOrder.orderDescription') as string}</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder={t('createOrder.orderDescription') as string}
              multiline
              numberOfLines={4}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('createOrder.workCategory') as string}</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(value) => handleInputChange('category', value)}
              placeholder={t('createOrder.workCategory') as string}
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('orders.priority') as string}</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.key}
                  style={[
                    styles.priorityButton,
                    formData.priority === priority.value && styles.priorityButtonSelected,
                  ]}
                  onPress={() => handleInputChange('priority', priority.value)}
                  accessibilityLabel={t('createOrder.priorityButtonAccessibility', { priority: priority.label }) as string}
                  accessibilityRole="button">
                  <Text
                    style={[
                      styles.priorityButtonText,
                      formData.priority === priority.value && styles.priorityButtonTextSelected,
                    ]}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createOrder.attachments') as string}</Text>
          <Text style={styles.sectionDescription}>{t('createOrder.attachmentsDescription') as string}</Text>
          
          <FileUploader
            onFilesChanged={handleFilesChanged}
            onUploadComplete={handleFileUploadComplete}
            onUploadError={handleFileUploadError}
            maxFiles={5}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
            accessibilityLabel={t('createOrder.submitButtonAccessibility') as string}
            accessibilityRole="button">
            <Text style={styles.submitButtonText}>
              {isLoading ? t('common.loading') as string : t('common.create') as string}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showCustomerModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCustomerModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectCustomer') as string}</Text>
              <TouchableOpacity
                onPress={() => setShowCustomerModal(false)}
                accessibilityLabel={t('common.closeModal') as string}
                accessibilityRole="button">
                <Text style={styles.modalCloseButton}>×</Text>
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
  errorMessage: {
    margin: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  customerSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  selectorLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 16,
    color: '#333',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priorityButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  priorityButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666',
  },
  priorityButtonTextSelected: {
    color: '#fff',
  },
  fileUploader: {
    marginTop: 8,
  },
  actions: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 32,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666',
  },
  customerList: {
    flex: 1,
  },
  customerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  customerType: {
    fontSize: 12,
    color: '#999',
    textTransform: 'capitalize',
  },
});

export default CreateOrderScreen; 