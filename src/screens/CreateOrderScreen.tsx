import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';

const CreateOrderScreen: React.FC = () => {
  const navigation = useNavigation();
  const {t} = useTranslation();
  const [formData, setFormData] = useState({
    customer: '',
    description: '',
    priority: t('orders.priorities.normal'),
    category: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
  };

  const handleSubmit = () => {
    if (!formData.customer || !formData.description) {
      Alert.alert(t('common.error'), t('createOrder.errors.missingFields'));
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
            // Aquí iría la lógica para crear la orden
            console.log('Orden creada:', formData);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const priorities = [
    {key: 'low', label: t('orders.priorities.low')},
    {key: 'normal', label: t('orders.priorities.normal')},
    {key: 'high', label: t('orders.priorities.high')},
    {key: 'urgent', label: t('orders.priorities.urgent')},
  ];

  return (
    <ScrollView style={styles.container}>
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
          <Text style={styles.submitButtonText}>{t('createOrder.title')}</Text>
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

export default CreateOrderScreen; 