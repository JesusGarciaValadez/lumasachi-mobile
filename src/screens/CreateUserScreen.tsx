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
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';

type CreateUserScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'CreateUser'
>;

const CreateUserScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<CreateUserScreenNavigationProp>();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    company: '',
    phoneNumber: '',
  });

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      Alert.alert(t('common.error'), t('userManagement.createUserForm.errors.missingFields'));
      return;
    }
    
    // TODO: Implement actual user creation logic here
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
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.lastName')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.lastName}
            onChangeText={(text) => setFormData({...formData, lastName: text})}
            placeholder={t('userManagement.createUserForm.placeholders.lastName')}
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
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.role')} *</Text>
          <TextInput
            style={styles.input}
            value={formData.role}
            onChangeText={(text) => setFormData({...formData, role: text})}
            placeholder={t('userManagement.createUserForm.placeholders.role')}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('userManagement.createUserForm.company')}</Text>
          <TextInput
            style={styles.input}
            value={formData.company}
            onChangeText={(text) => setFormData({...formData, company: text})}
            placeholder={t('userManagement.createUserForm.placeholders.company')}
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
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t('common.create')}</Text>
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
  saveButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateUserScreen; 