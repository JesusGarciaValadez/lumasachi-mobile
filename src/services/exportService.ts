import RNFS from 'react-native-fs';
import {Alert, Platform} from 'react-native';
import {UserRole} from '../types'

type TranslationFunction = (key: string, options?: any) => string;

export interface ExportData {
  userData: any[];
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
  private async getUserData(t: TranslationFunction): Promise<any[]> {
    // Mock user data - replace with actual API call
    return [
      {
        id: '1',
        name: t('userManagement.export.mockData.users.johnDoe'),
        email: t('userManagement.export.mockData.users.johnEmail'),
        role: UserRole.ADMINISTRATOR,
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: t('userManagement.export.mockData.users.janeSmith'),
        email: t('userManagement.export.mockData.users.janeEmail'),
        role: UserRole.CUSTOMER,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private async getOrderData(t: TranslationFunction): Promise<any[]> {
    // Mock order data - replace with actual API call
    return [
      {
        id: '1',
        customerId: '1',
        amount: 99.99,
        status: t('userManagement.export.mockData.orders.statusCompleted'),
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        customerId: '2',
        amount: 149.99,
        status: t('userManagement.export.mockData.orders.statusPending'),
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private async getSystemLogs(t: TranslationFunction): Promise<any[]> {
    // Mock system logs - replace with actual API call
    return [
      {
        id: '1',
        level: t('userManagement.export.mockData.systemLogs.levelInfo'),
        message: t('userManagement.export.mockData.systemLogs.userLoggedIn'),
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        level: t('userManagement.export.mockData.systemLogs.levelError'),
        message: t('userManagement.export.mockData.systemLogs.databaseConnectionFailed'),
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
        revenue: 12500,
        activeUsers: 45,
      },
      {
        date: '2024-01-02',
        totalOrders: 180,
        revenue: 15200,
        activeUsers: 52,
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
        case '1': // userData
          data = await this.getUserData(t);
          break;
        case '2': // orderData
          data = await this.getOrderData(t);
          break;
        case '3': // systemLogs
          data = await this.getSystemLogs(t);
          break;
        case '4': // analytics
          data = await this.getAnalytics();
          break;
        default:
          throw new Error(t('userManagement.export.errors.invalidDataType'));
      }

      // Convert data to the requested format
      let exportedContent: string;
      
      switch (format.toLowerCase()) {
        case 'csv':
          exportedContent = this.convertToCSV(data);
          break;
        case 'excel':
          exportedContent = this.convertToExcelCompatibleCSV(data);
          break;
        case 'json':
          exportedContent = this.convertToJSON(data);
          break;
        case 'pdf':
          // Note: This generates plain text, not actual PDF
          exportedContent = this.convertToPlainText(data);
          break;
        case 'txt':
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