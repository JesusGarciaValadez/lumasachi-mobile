/**
 * ExportService - Servicio de exportación de datos
 * 
 * Este servicio maneja la exportación de datos en formato PDF únicamente.
 * Otros formatos (CSV, Excel, JSON, TXT) fueron removidos para el MVP.
 * 
 * @author Lumasachi Control Team
 * @version 1.0.0
 * @since 2024-01-15
 */
import RNFS from 'react-native-fs';
import {Alert, Platform} from 'react-native';
import {UserRole, User} from '../types'

type TranslationFunction = (key: string, options?: any) => string;

// Only PDF format is supported in MVP
export const EXPORT_FORMATS = {
  PDF: 'pdf'
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
  content?: string;
  error?: string;
  filePath?: string;
}

class ExportService {
  // Mock data for development - in production this would come from API
  private mockData: ExportData = {
    userData: [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: UserRole.EMPLOYEE,
        phoneNumber: '+1234567890',
        address: '123 Main St',
        company: 'Acme Corp',
        isActive: true,
        lastLoginAt: new Date(),
        languagePreference: 'en',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: UserRole.ADMINISTRATOR,
        phoneNumber: '+1234567891',
        address: '456 Oak Ave',
        company: 'Tech Solutions',
        isActive: true,
        lastLoginAt: new Date(),
        languagePreference: 'es',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    orderData: [
      {
        id: '1',
        customerId: '1',
        title: 'Order #1',
        description: 'First order',
        status: 'completed',
        priority: 'normal',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        customerId: '2',
        title: 'Order #2',
        description: 'Second order',
        status: 'pending',
        priority: 'high',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    systemLogs: [
      {
        id: '1',
        level: 'info',
        message: 'User logged in',
        timestamp: new Date().toISOString(),
        userId: '1',
      },
      {
        id: '2',
        level: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
        userId: null,
      },
    ],
    analytics: [
      {
        metric: 'daily_active_users',
        value: 150,
        date: new Date().toISOString(),
      },
      {
        metric: 'orders_processed',
        value: 45,
        date: new Date().toISOString(),
      },
    ],
  };

  private async getUserData(t: TranslationFunction): Promise<any[]> {
    // Mock implementation - in production this would be an API call
    return this.mockData.userData.map(user => ({
      [t('userManagement.export.mockData.users.johnDoe')]: `${user.firstName} ${user.lastName}`,
      [t('common.email')]: user.email,
      [t('userManagement.role')]: user.role,
      [t('userManagement.company')]: user.company,
      [t('userManagement.phoneNumber')]: user.phoneNumber,
      [t('userManagement.address')]: user.address,
      [t('userManagement.isActive')]: user.isActive ? t('common.yes') : t('common.no'),
      [t('userManagement.lastLoginAt')]: user.lastLoginAt,
      [t('userManagement.languagePreference')]: user.languagePreference,
      [t('common.createdAt')]: user.createdAt,
      [t('common.updatedAt')]: user.updatedAt,
    }));
  }

  private async getOrderData(t: TranslationFunction): Promise<any[]> {
    // Mock implementation
    return this.mockData.orderData.map(order => ({
      [t('common.id')]: order.id,
      [t('orders.customerId')]: order.customerId,
      [t('orders.title')]: order.title,
      [t('orders.description')]: order.description,
      [t('orders.status')]: order.status,
      [t('orders.priority')]: order.priority,
      [t('common.createdAt')]: order.createdAt,
      [t('common.updatedAt')]: order.updatedAt,
    }));
  }

  private async getSystemLogs(t: TranslationFunction): Promise<any[]> {
    // Mock implementation
    return this.mockData.systemLogs.map(log => ({
      [t('common.id')]: log.id,
      [t('userManagement.export.mockData.systemLogs.levelInfo')]: log.level,
      [t('common.message')]: log.message,
      [t('common.timestamp')]: log.timestamp,
      [t('userManagement.userId')]: log.userId || t('common.na'),
    }));
  }

  private async getAnalytics(): Promise<any[]> {
    // Mock implementation
    return this.mockData.analytics.map(analytics => ({
      Metric: analytics.metric,
      Value: analytics.value,
      Date: analytics.date,
    }));
  }

  private convertToPDF(data: any[]): string {
    // Generate PDF-compatible text content
    // In production, this would integrate with the Laravel backend PDF generation
    const header = `LUMASACHI CONTROL - DATA EXPORT\n${'='.repeat(50)}\n\n`;
    const timestamp = `Generated: ${new Date().toLocaleString()}\n\n`;
    
    const content = data.map(item => 
      Object.entries(item)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    ).join('\n\n' + '-'.repeat(30) + '\n\n');
    
    const footer = `\n\n${'='.repeat(50)}\nEnd of Report`;
    
    return header + timestamp + content + footer;
  }

  async exportData(format: string, dataType: string, t: TranslationFunction): Promise<ExportResult> {
    try {
      // Validate format - only PDF is supported
      if (format.toLowerCase() !== EXPORT_FORMATS.PDF) {
        throw new Error(t('userManagement.export.errors.unsupportedFormat'));
      }

      let data: any[] = [];
      
      // Get the appropriate data based on type
      switch (dataType) {
        case DATA_TYPES.USER_DATA:
          data = await this.getUserData(t);
          break;
        case DATA_TYPES.ORDER_DATA:
          data = await this.getOrderData(t);
          break;
        case DATA_TYPES.SYSTEM_LOGS:
          data = await this.getSystemLogs(t);
          break;
        case DATA_TYPES.ANALYTICS:
          data = await this.getAnalytics();
          break;
        default:
          throw new Error(t('userManagement.export.errors.invalidDataType'));
      }

      // Convert data to PDF format
      const exportedContent = this.convertToPDF(data);

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