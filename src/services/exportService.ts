import RNFS from 'react-native-fs';
import {Alert, Platform} from 'react-native';
import {UserRole, User} from '../types'

type TranslationFunction = (key: string, options?: any) => string;

export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'excel',
  JSON: 'json',
  PDF: 'pdf',
  TXT: 'txt'
} as const;

export const DATA_TYPES = {
  USER_DATA: '1',
  ORDER_DATA: '2',
  SYSTEM_LOGS: '3',
  ANALYTICS: '4'
} as const;

export interface ExportData {
  userData: User[];
  orderData: any[];
  systemLogs: any[];
  analytics: any[];
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  content?: string;
  error?: string;
}

class ExportService {
  private async getUserData(t: TranslationFunction): Promise<User[]> {
    // Mock user data - replace with actual API call
    return [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: UserRole.ADMINISTRATOR,
        company: 'Lumasachi',
        isActive: true,
        languagePreference: 'en',
        isCustomer: false,
        isEmployee: true,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-15T14:30:00Z'),
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        role: UserRole.CUSTOMER,
        company: 'Customer Corp',
        phoneNumber: '+1234567890',
        address: '123 Main St',
        isActive: true,
        languagePreference: 'en',
        customerType: 'corporate',
        customerNotes: 'VIP customer',
        isCustomer: true,
        isEmployee: false,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-15T14:30:00Z'),
      },
      {
        id: '3',
        firstName: 'Bob',
        lastName: 'Johnson',
        email: 'bob.johnson@example.com',
        role: UserRole.EMPLOYEE,
        company: 'Lumasachi',
        phoneNumber: '+0987654321',
        isActive: true,
        languagePreference: 'es',
        isCustomer: false,
        isEmployee: true,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-15T14:30:00Z'),
      },
    ];
  }

  private async getOrderData(t: TranslationFunction): Promise<any[]> {
    // Mock order data - replace with actual API call
    return [
      {
        id: '1',
        customerId: '2', // Jane Smith (Customer)
        customerName: 'Jane Smith',
        title: 'Equipment Repair',
        description: 'Repair industrial equipment',
        status: 'In Progress',
        priority: 'High',
        category: 'Repair',
        createdAt: new Date('2024-01-15T10:30:00Z').toISOString(),
        updatedAt: new Date('2024-01-20T14:45:00Z').toISOString(),
      },
      {
        id: '2',
        customerId: '2', // Jane Smith (Customer)
        customerName: 'Jane Smith',
        title: 'Part Replacement',
        description: 'Replace damaged part',
        status: 'Delivered',
        priority: 'Normal',
        category: 'Replacement',
        createdAt: new Date('2024-01-10T09:15:00Z').toISOString(),
        updatedAt: new Date('2024-01-18T16:30:00Z').toISOString(),
      },
    ];
  }

  private async getSystemLogs(t: TranslationFunction): Promise<any[]> {
    // Mock system logs - replace with actual API call
    return [
      {
        id: '1',
        level: 'INFO',
        message: 'User logged in successfully',
        userId: '1',
        userEmail: 'john.doe@example.com',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        level: 'ERROR',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
    ];
  }

  private async getAnalytics(): Promise<any[]> {
    // Mock analytics data - replace with actual API call
    return [
      {
        date: '2024-01-01',
        totalOrders: 150,
        totalUsers: 45,
        activeCustomers: 30,
        completedOrders: 120,
        pendingOrders: 30,
      },
      {
        date: '2024-01-02',
        totalOrders: 180,
        totalUsers: 52,
        activeCustomers: 35,
        completedOrders: 145,
        pendingOrders: 35,
      },
    ];
  }

  private convertToCSV(data: any[]): string {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (typeof value === 'string') {
            // Escape quotes by doubling them and wrap in quotes
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  private convertToJSON(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }

  private convertToExcelCompatibleCSV(data: any[]): string {
    // CSV format compatible with Excel import
    // For true Excel (.xlsx) format, consider using a library like xlsx or react-native-xlsx
    return this.convertToCSV(data);
  }

  private convertToPlainText(data: any[]): string {
    // Plain text representation (not actual PDF format)
    // In a real app, you'd use a PDF generation library like react-native-pdf-lib
    const content = data.map(item => 
      Object.entries(item)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    ).join('\n\n');
    
    return content;
  }

  async exportData(format: string, dataType: string, t: TranslationFunction): Promise<ExportResult> {
    try {
      let data: any[] = [];
      
      // Get the appropriate data based on type
      switch (dataType) {
        case DATA_TYPES.USER_DATA: // userData
          data = await this.getUserData(t);
          break;
        case DATA_TYPES.ORDER_DATA: // orderData
          data = await this.getOrderData(t);
          break;
        case DATA_TYPES.SYSTEM_LOGS: // systemLogs
          data = await this.getSystemLogs(t);
          break;
        case DATA_TYPES.ANALYTICS: // analytics
          data = await this.getAnalytics();
          break;
        default:
          throw new Error(t('userManagement.export.errors.invalidDataType'));
      }

      // Convert data to the requested format
      let exportedContent: string;
      
      switch (format.toLowerCase()) {
        case EXPORT_FORMATS.CSV:
          exportedContent = this.convertToCSV(data);
          break;
        case EXPORT_FORMATS.EXCEL:
          exportedContent = this.convertToExcelCompatibleCSV(data);
          break;
        case EXPORT_FORMATS.JSON:
          exportedContent = this.convertToJSON(data);
          break;
        case EXPORT_FORMATS.PDF:
          // Note: This generates plain text, not actual PDF
          exportedContent = this.convertToPlainText(data);
          break;
        case EXPORT_FORMATS.TXT:
          exportedContent = this.convertToPlainText(data);
          break;
        default:
          throw new Error(t('userManagement.export.errors.unsupportedFormat'));
      }

      return {
        success: true,
        content: exportedContent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t('userManagement.export.errors.exportFailed'),
      };
    }
  }

  async saveToDevice(content: string, filename: string, t: TranslationFunction): Promise<ExportResult> {
    try {
      const documentsPath = RNFS.DocumentDirectoryPath;
      const filePath = `${documentsPath}/${filename}`;
      
      await RNFS.writeFile(filePath, content, 'utf8');
      
      return {
        success: true,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : t('userManagement.export.errors.saveFailed'),
      };
    }
  }
}

export const exportService = new ExportService(); 