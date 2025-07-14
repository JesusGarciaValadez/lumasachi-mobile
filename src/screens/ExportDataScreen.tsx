import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';

type ExportDataScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ExportData'
>;

interface ExportOption {
  id: string;
  title: string;
  description: string;
  format: string;
  color: string;
  icon: string;
}

const ExportDataScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<ExportDataScreenNavigationProp>();
  
  const [isExporting, setIsExporting] = useState(false);
  
  const exportOptions: ExportOption[] = [
    {
      id: '1',
      title: t('userManagement.export.titles.userData'),
      description: t('userManagement.export.descriptions.userData'),
      format: 'CSV',
      color: '#28a745',
      icon: '👥',
    },
    {
      id: '2',
      title: t('userManagement.export.titles.orderData'),
      description: t('userManagement.export.descriptions.orderData'),
      format: 'Excel',
      color: '#17a2b8',
      icon: '📋',
    },
    {
      id: '3',
      title: t('userManagement.export.titles.systemLogs'),
      description: t('userManagement.export.descriptions.systemLogs'),
      format: 'JSON',
      color: '#6f42c1',
      icon: '⚙️',
    },
    {
      id: '4',
      title: t('userManagement.export.titles.analytics'),
      description: t('userManagement.export.descriptions.analytics'),
      format: 'PDF',
      color: '#fd7e14',
      icon: '📊',
    },
  ];

  const handleExport = async (option: ExportOption) => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        t('common.success'),
        t('userManagement.export.exportedSuccessfully', {
          title: option.title,
          format: option.format,
        }),
        [
          {
            text: t('common.ok'),
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('userManagement.export.exportFailed'),
        [
          {
            text: t('common.ok'),
            onPress: () => {},
          },
        ]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderExportOption = (option: ExportOption) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.exportCard, {borderLeftColor: option.color}]}
      onPress={() => handleExport(option)}
      disabled={isExporting}
    >
      <View style={styles.exportHeader}>
        <View style={styles.exportIcon}>
          <Text style={styles.iconText}>{option.icon}</Text>
        </View>
        <View style={styles.exportInfo}>
          <Text style={styles.exportTitle}>{option.title}</Text>
          <Text style={styles.exportDescription}>{option.description}</Text>
        </View>
        <View style={[styles.formatTag, {backgroundColor: option.color}]}>
          <Text style={styles.formatText}>{option.format}</Text>
        </View>
      </View>
      {isExporting && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={option.color} />
          <Text style={styles.loadingText}>{t('userManagement.export.exporting')}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('userManagement.exportData')}</Text>
        <Text style={styles.headerSubtitle}>{t('userManagement.exportDataDesc')}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('userManagement.export.infoTitle')}</Text>
          <Text style={styles.infoText}>
            {t('userManagement.export.infoText')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>{t('userManagement.export.availableOptions')}</Text>
          {exportOptions.map(renderExportOption)}
        </View>

        <View style={styles.footerInfo}>
          <Text style={styles.footerText}>
            {t('userManagement.export.footerText')}
          </Text>
        </View>
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
  content: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  optionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 15,
  },
  exportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  exportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  iconText: {
    fontSize: 20,
  },
  exportInfo: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  exportDescription: {
    fontSize: 14,
    color: '#666666',
  },
  formatTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  formatText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666666',
  },
  footerInfo: {
    backgroundColor: '#e9ecef',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ExportDataScreen; 