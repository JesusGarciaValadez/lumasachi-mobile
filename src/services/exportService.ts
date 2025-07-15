import RNFS from 'react-native-fs';
import {Alert, Platform} from 'react-native';

export interface ExportData {
  userData: any[];
  orderData: any[];
  systemLogs: any[];
  analytics: any[];
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

class ExportService {
  private async getUserData(): Promise<any[]> {
    // Mock user data - replace with actual API call
    return [
      {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'admin',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        role: 'user',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private async getOrderData(): Promise<any[]> {
    // Mock order data - replace with actual API call
    return [
      {
        id: '1',
        customerId: '1',
        amount: 99.99,
        status: 'completed',
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        customerId: '2',
        amount: 149.99,
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];
  }

  private async getSystemLogs(): Promise<any[]> {
    // Mock system logs - replace with actual API call
    return [
      {
        id: '1',
        level: 'info',
        message: 'User logged in',
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        level: 'error',
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
          return typeof value === 'string' ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  }

  private convertToJSON(data: any[]): string {
    return JSON.stringify(data, null, 2);
  }

  private convertToExcel(data: any[]): string {
    // For Excel format, we'll use CSV format with .xlsx extension
    // In a real app, you might want to use a library like xlsx
    return this.convertToCSV(data);
  }

  private convertToPDF(data: any[]): string {
    // For PDF format, we'll create a simple text representation
    // In a real app, you'd use a PDF generation library
    const content = data.map(item => 
      Object.entries(item)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n')
    ).join('\n\n');
    
    return content;
  }

  async exportData(format: string, dataType: string): Promise<ExportResult> {
    try {
      let data: any[] = [];
      
      // Get the appropriate data based on type
      switch (dataType) {
        case '1': // userData
          data = await this.getUserData();
          break;
        case '2': // orderData
          data = await this.getOrderData();
          break;
        case '3': // systemLogs
          data = await this.getSystemLogs();
          break;
        case '4': // analytics
          data = await this.getAnalytics();
          break;
        default:
          throw new Error('Invalid data type');
      }

      // Convert data to the requested format
      let exportedContent: string;
      let fileExtension: string;
      
      switch (format.toLowerCase()) {
        case 'csv':
          exportedContent = this.convertToCSV(data);
          fileExtension = 'csv';
          break;
        case 'excel':
          exportedContent = this.convertToExcel(data);
          fileExtension = 'xlsx';
          break;
        case 'json':
          exportedContent = this.convertToJSON(data);
          fileExtension = 'json';
          break;
        case 'pdf':
          exportedContent = this.convertToPDF(data);
          fileExtension = 'pdf';
          break;
        default:
          throw new Error('Unsupported format');
      }

      return {
        success: true,
        filePath: exportedContent,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  async saveToDevice(content: string, filename: string): Promise<ExportResult> {
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
        error: error instanceof Error ? error.message : 'Save failed',
      };
    }
  }
}

export const exportService = new ExportService(); 