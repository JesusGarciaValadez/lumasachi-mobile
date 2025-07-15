/**
 * File service for handling multiple file uploads and downloads
 */

import axios from 'axios';
import DocumentPicker from 'react-native-document-picker';
import { 
  FileSelection, 
  FileUploadProgress, 
  FileUploadResult, 
  MultipleFileUploadResult,
  Attachment 
} from '../types';
import { httpClient } from '../utils/httpClient';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_UPLOAD = 10;

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/zip',
  'application/x-rar-compressed',
];

export class FileService {
  /**
   * Open document picker to select multiple files
   */
  static async pickMultipleFiles(): Promise<FileSelection[]> {
    try {
      const results = await DocumentPicker.pick({
        allowMultiSelection: true,
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
      });

      const validFiles: FileSelection[] = [];
      const invalidFiles: string[] = [];

      for (const result of results) {
        // Validate file size
        if (result.size && result.size > MAX_FILE_SIZE) {
          invalidFiles.push(`${result.name} (excede 10MB)`);
          continue;
        }

        // Validate MIME type
        if (result.type && !ALLOWED_MIME_TYPES.includes(result.type)) {
          invalidFiles.push(`${result.name} (tipo no permitido)`);
          continue;
        }

        validFiles.push({
          uri: result.fileCopyUri || result.uri,
          type: result.type || 'application/octet-stream',
          name: result.name || 'file',
          size: result.size || 0,
        });
      }

      // Check total files limit
      if (validFiles.length > MAX_FILES_PER_UPLOAD) {
        throw new Error(`Máximo ${MAX_FILES_PER_UPLOAD} archivos permitidos`);
      }

      if (invalidFiles.length > 0) {
        throw new Error(`Archivos inválidos: ${invalidFiles.join(', ')}`);
      }

      return validFiles;
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Open document picker to select a single file
   */
  static async pickSingleFile(): Promise<FileSelection | null> {
    try {
      const result = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
        copyTo: 'documentDirectory',
      });

      // Validate file size
      if (result.size && result.size > MAX_FILE_SIZE) {
        throw new Error(`Archivo excede el tamaño máximo de 10MB`);
      }

      // Validate MIME type
      if (result.type && !ALLOWED_MIME_TYPES.includes(result.type)) {
        throw new Error(`Tipo de archivo no permitido: ${result.type}`);
      }

      return {
        uri: result.fileCopyUri || result.uri,
        type: result.type || 'application/octet-stream',
        name: result.name || 'file',
        size: result.size || 0,
      };
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Upload a single file
   */
  static async uploadSingleFile(
    file: FileSelection,
    entityType: string = 'order',
    entityId: string,
    onProgress?: (progress: number) => void
  ): Promise<FileUploadResult> {
    try {
      const formData = new FormData();
      formData.append('attachment', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);

      const response = await httpClient.post(
        `/api/${entityType}s/${entityId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          },
        }
      );

      return {
        attachment: response.data.attachment,
        success: true,
      };
    } catch (error) {
      return {
        attachment: {} as Attachment,
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(
    files: FileSelection[],
    entityType: string = 'order',
    entityId: string,
    onProgress?: (fileProgress: FileUploadProgress[]) => void
  ): Promise<MultipleFileUploadResult> {
    const result: MultipleFileUploadResult = {
      attachments: [],
      failedFiles: [],
      totalFiles: files.length,
      successfulFiles: 0,
      failedCount: 0,
    };

    const progressMap = new Map<string, FileUploadProgress>();
    
    // Initialize progress tracking
    files.forEach((file, index) => {
      progressMap.set(file.name, {
        id: `${index}`,
        name: file.name,
        progress: 0,
        status: 'pending',
      });
    });

    // Create FormData with all files
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('attachments[]', {
        uri: file.uri,
        type: file.type,
        name: file.name,
      } as any);
    });

    try {
      const response = await httpClient.post(
        `/api/${entityType}s/${entityId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              
              // Update progress for all files
              files.forEach((file) => {
                const fileProgress = progressMap.get(file.name);
                if (fileProgress) {
                  fileProgress.progress = percentCompleted;
                  fileProgress.status = 'uploading';
                }
              });

              if (onProgress) {
                onProgress(Array.from(progressMap.values()));
              }
            }
          },
        }
      );

      // Mark all files as completed
      files.forEach((file) => {
        const fileProgress = progressMap.get(file.name);
        if (fileProgress) {
          fileProgress.progress = 100;
          fileProgress.status = 'completed';
        }
      });

      if (onProgress) {
        onProgress(Array.from(progressMap.values()));
      }

      result.attachments = response.data.attachments || [];
      result.successfulFiles = result.attachments.length;
      
    } catch (error) {
      // Mark all files as failed
      files.forEach((file) => {
        const fileProgress = progressMap.get(file.name);
        if (fileProgress) {
          fileProgress.status = 'error';
          fileProgress.error = error instanceof Error ? error.message : 'Error desconocido';
        }
        
        result.failedFiles.push({
          name: file.name,
          error: error instanceof Error ? error.message : 'Error desconocido',
        });
      });

      result.failedCount = files.length;

      if (onProgress) {
        onProgress(Array.from(progressMap.values()));
      }
    }

    return result;
  }

  /**
   * Delete an attachment
   */
  static async deleteAttachment(attachmentId: string): Promise<boolean> {
    try {
      await httpClient.delete(`/api/attachments/${attachmentId}`);
      return true;
    } catch (error) {
      console.error('Error deleting attachment:', error);
      return false;
    }
  }

  /**
   * Get download URL for an attachment
   */
  static async getDownloadUrl(attachmentId: string): Promise<string> {
    try {
      const response = await httpClient.get(`/api/attachments/${attachmentId}/download`);
      return response.data.downloadUrl;
    } catch (error) {
      throw new Error('Error obteniendo URL de descarga');
    }
  }

  /**
   * Get preview URL for an attachment
   */
  static async getPreviewUrl(attachmentId: string): Promise<string | null> {
    try {
      const response = await httpClient.get(`/api/attachments/${attachmentId}/preview`);
      return response.data.previewUrl || null;
    } catch (error) {
      console.error('Error getting preview URL:', error);
      return null;
    }
  }

  /**
   * Check if file type is supported
   */
  static isFileTypeSupported(mimeType: string): boolean {
    return ALLOWED_MIME_TYPES.includes(mimeType);
  }

  /**
   * Check if file is an image
   */
  static isImage(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Check if file is a document
   */
  static isDocument(mimeType: string): boolean {
    return mimeType.startsWith('application/') || mimeType === 'text/plain';
  }

  /**
   * Format file size in human readable format
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }
}

export default FileService; 