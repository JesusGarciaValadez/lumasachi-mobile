import React, {useState} from 'react';
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
import {Picker} from '@react-native-picker/picker';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';
import {UserRole} from '../types';
import {httpClient} from '../utils/httpClient';
import {API_ENDPOINTS, USER_ROLES} from '../constants';

type CreateUserScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateUser'
>;

interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  company: string;
  phoneNumber: string;
  address: string;
}

const CreateUserScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<CreateUserScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: UserRole.EMPLOYEE,
    company: '',
    phoneNumber: '',
    address: '',
  });

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const createUser = async (userData: CreateUserRequest) => {
    const response = await httpClient.post(API_ENDPOINTS.USERS.CREATE, userData);
    return response.data;
  };

  const handleSave = async () => {
    // Enhanced validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      Alert.alert(t('common.error'), t('userManagement.createUserForm.errors.missingFields'));
      return;
    }

    if (!formData.email.trim() || !validateEmail(formData.email)) {
      Alert.alert(t('common.error'), t('userManagement.createUserForm.errors.invalidEmail'));
      return;
    }

    if (formData.phoneNumber && !validatePhoneNumber(formData.phoneNumber)) {
      Alert.alert(t('common.error'), t('userManagement.createUserForm.errors.invalidPhone'));
      return;
    }

    if (!formData.role) {
      Alert.alert(t('common.error'), t('userManagement.createUserForm.errors.missingFields'));
      return;
    }

    setIsLoading(true);
    try {
      const userData: CreateUserRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        role: formData.role,
        company: formData.company.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        address: formData.address.trim(),
      };

      await createUser(userData);
      
      Alert.alert(
        t('common.success'),
        t('userManagement.createUserForm.userCreatedSuccess'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert(t('common.error'), t('userManagement.createUserForm.errors.createFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleOptions = () => {
    return Object.values(USER_ROLES).map(role => ({
      label: role.displayName,
      value: role.key,
    }));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('userManagement.createUser')}</Text>
        <Text style={styles.headerSubtitle}>{t('userManagement.createUserDesc')}</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.firstName')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.firstName}
            onChangeText={(text) => setFormData({...formData, firstName: text})}
            placeholder={t('userManagement.createUserForm.placeholders.firstName')}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.lastName')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => setFormData({...formData, lastName: text})}
            placeholder={t('userManagement.createUserForm.placeholders.lastName')}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.email')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            placeholder={t('userManagement.createUserForm.placeholders.email')}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.role')} *</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.role}
              style={styles.picker}
              onValueChange={(itemValue: UserRole) => setFormData({...formData, role: itemValue})}
              enabled={!isLoading}
            >
              {getRoleOptions().map((option) => (
                <Picker.Item
                  key={option.value}
                  label={option.label}
                  value={option.value}
                />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.company')}</Text>
          <TextInput
            style={styles.input}
            value={formData.company}
            onChangeText={(text) => setFormData({...formData, company: text})}
            placeholder={t('userManagement.createUserForm.placeholders.company')}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.phoneNumber')}</Text>
          <TextInput
            style={styles.input}
            value={formData.phoneNumber}
            onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
            placeholder={t('userManagement.createUserForm.placeholders.phoneNumber')}
            keyboardType="phone-pad"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.address')}</Text>
          <TextInput
            style={styles.input}
            value={formData.address}
            onChangeText={(text) => setFormData({...formData, address: text})}
            placeholder={t('userManagement.createUserForm.placeholders.address')}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.saveButtonText}>{t('common.create')}</Text>
          )}
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
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e0e0',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateUserScreen; 