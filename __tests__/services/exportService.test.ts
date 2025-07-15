import {exportService, EXPORT_FORMATS, DATA_TYPES} from '../../src/services/exportService';

// Mock react-native-fs
jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/mocked/path',
  writeFile: jest.fn().mockResolvedValue(true),
}));

// Mock translation function
const mockTranslationFunction = (key: string, options?: any) => {
  const translations: { [key: string]: string } = {
    'userManagement.export.errors.unsupportedFormat': 'Unsupported format - only PDF is supported',
    'userManagement.export.errors.invalidDataType': 'Invalid data type',
    'userManagement.export.errors.exportFailed': 'Export failed',
    'userManagement.export.errors.saveFailed': 'Save failed',
    'common.email': 'Email',
    'userManagement.role': 'Role',
    'userManagement.company': 'Company',
    'userManagement.phoneNumber': 'Phone Number',
    'userManagement.address': 'Address',
    'userManagement.isActive': 'Is Active',
    'userManagement.lastLoginAt': 'Last Login At',
    'userManagement.languagePreference': 'Language Preference',
    'common.createdAt': 'Created At',
    'common.updatedAt': 'Updated At',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.id': 'ID',
    'orders.customerId': 'Customer ID',
    'orders.title': 'Title',
    'orders.description': 'Description',
    'orders.status': 'Status',
    'orders.priority': 'Priority',
    'common.message': 'Message',
    'common.timestamp': 'Timestamp',
    'userManagement.userId': 'User ID',
    'common.na': 'N/A',
    'userManagement.export.mockData.users.johnDoe': 'Name',
    'userManagement.export.mockData.systemLogs.levelInfo': 'Level',
  };
  return translations[key] || key;
};

describe('ExportService', () => {
  describe('EXPORT_FORMATS', () => {
    test('should only contain PDF format', () => {
      expect(EXPORT_FORMATS).toEqual({
        PDF: 'pdf'
      });
    });

    test('should not contain deprecated formats', () => {
      expect(EXPORT_FORMATS).not.toHaveProperty('CSV');
      expect(EXPORT_FORMATS).not.toHaveProperty('EXCEL');
      expect(EXPORT_FORMATS).not.toHaveProperty('JSON');
      expect(EXPORT_FORMATS).not.toHaveProperty('TXT');
    });
  });

  describe('exportData', () => {
    test('should export user data in PDF format', async () => {
      const result = await exportService.exportData(
        EXPORT_FORMATS.PDF,
        DATA_TYPES.USER_DATA,
        mockTranslationFunction
      );

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('LUMASACHI CONTROL - DATA EXPORT');
      expect(result.content).toContain('Generated:');
      expect(result.content).toContain('End of Report');
    });

    test('should export order data in PDF format', async () => {
      const result = await exportService.exportData(
        EXPORT_FORMATS.PDF,
        DATA_TYPES.ORDER_DATA,
        mockTranslationFunction
      );

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('LUMASACHI CONTROL - DATA EXPORT');
    });

    test('should export system logs in PDF format', async () => {
      const result = await exportService.exportData(
        EXPORT_FORMATS.PDF,
        DATA_TYPES.SYSTEM_LOGS,
        mockTranslationFunction
      );

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('LUMASACHI CONTROL - DATA EXPORT');
    });

    test('should export analytics in PDF format', async () => {
      const result = await exportService.exportData(
        EXPORT_FORMATS.PDF,
        DATA_TYPES.ANALYTICS,
        mockTranslationFunction
      );

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('LUMASACHI CONTROL - DATA EXPORT');
    });

    test('should reject unsupported formats', async () => {
      const result = await exportService.exportData(
        'csv',
        DATA_TYPES.USER_DATA,
        mockTranslationFunction
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported format - only PDF is supported');
    });

    test('should reject invalid data types', async () => {
      const result = await exportService.exportData(
        EXPORT_FORMATS.PDF,
        'invalid_type',
        mockTranslationFunction
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid data type');
    });

    test('should handle Excel format rejection', async () => {
      const result = await exportService.exportData(
        'excel',
        DATA_TYPES.USER_DATA,
        mockTranslationFunction
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported format - only PDF is supported');
    });

    test('should handle JSON format rejection', async () => {
      const result = await exportService.exportData(
        'json',
        DATA_TYPES.USER_DATA,
        mockTranslationFunction
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported format - only PDF is supported');
    });

    test('should handle TXT format rejection', async () => {
      const result = await exportService.exportData(
        'txt',
        DATA_TYPES.USER_DATA,
        mockTranslationFunction
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unsupported format - only PDF is supported');
    });
  });

  describe('saveToDevice', () => {
    test('should save PDF content to device', async () => {
      const mockContent = 'Test PDF content';
      const mockFilename = 'test.pdf';

      const result = await exportService.saveToDevice(
        mockContent,
        mockFilename,
        mockTranslationFunction
      );

      expect(result.success).toBe(true);
      expect(result.filePath).toBe('/mocked/path/test.pdf');
    });
  });

  describe('Integration Tests', () => {
    test('should complete full export workflow for PDF', async () => {
      // Step 1: Export data
      const exportResult = await exportService.exportData(
        EXPORT_FORMATS.PDF,
        DATA_TYPES.USER_DATA,
        mockTranslationFunction
      );

      expect(exportResult.success).toBe(true);
      expect(exportResult.content).toBeDefined();

      // Step 2: Save to device
      const saveResult = await exportService.saveToDevice(
        exportResult.content!,
        'test_export.pdf',
        mockTranslationFunction
      );

      expect(saveResult.success).toBe(true);
      expect(saveResult.filePath).toBeDefined();
    });
  });
}); 