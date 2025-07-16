import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {exportService} from '../services/exportService';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';

interface ExportOption {
  id: string;
  title: string;
  description: string;
  format: string;
  color: string;
  icon: string;
}

const ExportDataScreen: React.FC = () => {
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  
  const [exportingId, setExportingId] = useState<string | null>(null);
  
  const exportOptions: ExportOption[] = useMemo(() => [
    {
      id: '1',
      title: t('userManagement.export.titles.userData') as string,
      description: t('userManagement.export.descriptions.userData') as string,
      format: 'PDF',
      color: '#dc3545',
      icon: '👥',
    },
    {
      id: '2',
      title: t('userManagement.export.titles.orderData') as string,
      description: t('userManagement.export.descriptions.orderData') as string,
      format: 'PDF',
      color: '#007bff',
      icon: '📋',
    },
    {
      id: '3',
      title: t('userManagement.export.titles.systemLogs') as string,
      description: t('userManagement.export.descriptions.systemLogs') as string,
      format: 'PDF',
      color: '#6f42c1',
      icon: '⚙️',
    },
    {
      id: '4',
      title: t('userManagement.export.titles.analytics') as string,
      description: t('userManagement.export.descriptions.analytics') as string,
      format: 'PDF',
      color: '#fd7e14',
      icon: '📊',
    },
  ], [t]);

  const handleExport = async (option: ExportOption) => {
    try {
      clearError();
      setExportingId(option.id);
      
      await errorService.logError(null, {
        component: 'ExportDataScreen',
        operation: 'startExport',
        success: true,
        optionId: option.id,
        format: option.format,
      });
      
      // Implement actual export - only PDF format supported
      const translateString = (key: string) => t(key) as string;
      const exportResult = await exportService.exportData(option.format, option.id, translateString);
      
      if (!exportResult.success) {
        throw new Error(exportResult.error || t('userManagement.export.errors.exportFailed') as string);
      }
      
      // Save to device
      if (!exportResult.content) {
        throw new Error(t('userManagement.export.errors.noContentToSave') as string);
      }
      
      const filename = `${option.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      const saveResult = await exportService.saveToDevice(exportResult.content, filename, translateString);
      
      if (!saveResult.success) {
        throw new Error(saveResult.error || t('userManagement.export.errors.saveFailed') as string);
      }
      
      await errorService.logError(null, {
        component: 'ExportDataScreen',
        operation: 'exportComplete',
        success: true,
        optionId: option.id,
        format: option.format,
        filename,
        filePath: saveResult.filePath,
      });
      
      Alert.alert(
        t('common.success') as string,
        `${t('userManagement.export.exportedSuccessfully', {
          title: option.title,
          format: option.format,
        }) as string}\n\n${t('userManagement.export.savedTo') as string}: ${saveResult.filePath}`,
        [
          {
            text: t('common.ok') as string,
            onPress: () => {},
          },
        ]
      );
    } catch (error) {
      await errorService.logError(error as Error, {
        component: 'ExportDataScreen',
        operation: 'exportFailed',
        optionId: option.id,
        format: option.format,
      });
      
      handleError(error as Error);
    } finally {
      setExportingId(null);
    }
  };

  const renderExportOption = (option: ExportOption) => (
    <TouchableOpacity
      key={option.id}
      style={[styles.exportCard, {borderLeftColor: option.color}]}
      onPress={() => handleExport(option)}
      disabled={exportingId !== null}
      accessibilityRole="button"
      accessibilityLabel={`${t('userManagement.export.exportOption') as string} ${option.title} ${t('common.as') as string} ${option.format}`}
      accessibilityHint={option.description}
      accessibilityState={{disabled: exportingId !== null}}
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
      {exportingId === option.id && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={option.color} />
          <Text style={styles.loadingText}>{t('userManagement.export.exporting') as string}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('userManagement.exportData') as string}</Text>
          <Text style={styles.headerSubtitle}>{t('userManagement.exportDataDesc') as string}</Text>
        </View>

        {hasError && (
          <ErrorMessage 
            error={error}
            onRetry={clearError}
            onDismiss={clearError}
          />
        )}

        <View style={styles.content}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t('userManagement.export.infoTitle') as string}</Text>
            <Text style={styles.infoText}>
              {t('userManagement.export.infoText') as string}
            </Text>
          </View>

          <View style={styles.optionsContainer}>
            <Text style={styles.sectionTitle}>{t('userManagement.export.availableOptions') as string}</Text>
            {exportOptions.map(renderExportOption)}
          </View>

          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>
              {t('userManagement.export.footerText') as string}
            </Text>
          </View>
        </View>
      </ScrollView>
    </ErrorBoundary>
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