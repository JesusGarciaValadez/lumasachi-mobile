/**
 * Custom hook for handling multiple file uploads with progress tracking
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { FileService } from '../services/fileService';
import { 
  FileSelection, 
  FileUploadProgress, 
  MultipleFileUploadResult,
  Attachment 
} from '../types';

export interface UseFileUploadOptions {
  entityType?: string;
  entityId?: string;
  onUploadComplete?: (result: MultipleFileUploadResult) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  allowMultiple?: boolean;
}

export interface UseFileUploadReturn {
  // State
  selectedFiles: FileSelection[];
  uploadProgress: FileUploadProgress[];
  uploading: boolean;
  uploadResult: MultipleFileUploadResult | null;
  
  // Actions
  selectFiles: () => Promise<void>;
  selectSingleFile: () => Promise<void>;
  uploadFiles: (entityType: string, entityId: string) => Promise<void>;
  removeFile: (fileName: string) => void;
  clearFiles: () => void;
  retryUpload: (entityType: string, entityId: string) => Promise<void>;
  
  // Utilities
  getTotalSize: () => number;
  getFormattedTotalSize: () => string;
  hasValidFiles: () => boolean;
  canUpload: () => boolean;
}

export const useFileUpload = (options: UseFileUploadOptions = {}): UseFileUploadReturn => {
  const {
    onUploadComplete,
    onUploadError,
    maxFiles = 10,
    allowMultiple = true,
  } = options;

  const [selectedFiles, setSelectedFiles] = useState<FileSelection[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<MultipleFileUploadResult | null>(null);

  const selectFiles = useCallback(async () => {
    if (!allowMultiple) {
      await selectSingleFile();
      return;
    }

    try {
      const files = await FileService.pickMultipleFiles();
      
      if (files.length === 0) {
        return; // User cancelled
      }

      // Check file limit
      if (files.length > maxFiles) {
        Alert.alert(
          'Límite de archivos',
          `Solo se pueden seleccionar hasta ${maxFiles} archivos`
        );
        return;
      }

      setSelectedFiles(files);
      setUploadProgress([]);
      setUploadResult(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', errorMessage);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [allowMultiple, maxFiles, onUploadError]);

  const selectSingleFile = useCallback(async () => {
    try {
      const file = await FileService.pickSingleFile();
      
      if (!file) {
        return; // User cancelled
      }

      setSelectedFiles([file]);
      setUploadProgress([]);
      setUploadResult(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', errorMessage);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [onUploadError]);

  const uploadFiles = useCallback(async (entityType: string, entityId: string) => {
    if (selectedFiles.length === 0) {
      Alert.alert('Error', 'No hay archivos seleccionados');
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await FileService.uploadMultipleFiles(
        selectedFiles,
        entityType,
        entityId,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setUploadResult(result);

      if (result.failedCount > 0) {
        const failedNames = result.failedFiles.map(f => f.name).join(', ');
        Alert.alert(
          'Upload parcialmente exitoso',
          `Se subieron ${result.successfulFiles} de ${result.totalFiles} archivos.\n\nArchivos fallidos: ${failedNames}`
        );
      } else {
        Alert.alert(
          'Upload exitoso',
          `Se subieron ${result.successfulFiles} archivos correctamente`
        );
      }

      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      Alert.alert('Error', `Error subiendo archivos: ${errorMessage}`);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, onUploadComplete, onUploadError]);

  const removeFile = useCallback((fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
    setUploadProgress(prev => prev.filter(progress => progress.name !== fileName));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
    setUploadProgress([]);
    setUploadResult(null);
  }, []);

  const retryUpload = useCallback(async (entityType: string, entityId: string) => {
    if (uploadResult && uploadResult.failedCount > 0) {
      // Get files that failed
      const failedFileNames = uploadResult.failedFiles.map(f => f.name);
      const filesToRetry = selectedFiles.filter(file => 
        failedFileNames.includes(file.name)
      );

      if (filesToRetry.length > 0) {
        setUploading(true);
        
        try {
          const result = await FileService.uploadMultipleFiles(
            filesToRetry,
            entityType,
            entityId,
            (progress) => {
              setUploadProgress(progress);
            }
          );

          // Merge results
          const mergedResult: MultipleFileUploadResult = {
            attachments: [...(uploadResult.attachments || []), ...result.attachments],
            failedFiles: result.failedFiles,
            totalFiles: uploadResult.totalFiles,
            successfulFiles: (uploadResult.successfulFiles || 0) + result.successfulFiles,
            failedCount: result.failedCount,
          };

          setUploadResult(mergedResult);

          if (result.failedCount === 0) {
            Alert.alert('Reintento exitoso', 'Todos los archivos se subieron correctamente');
          } else {
            Alert.alert(
              'Reintento parcialmente exitoso',
              `Se subieron ${result.successfulFiles} archivos adicionales`
            );
          }

          if (onUploadComplete) {
            onUploadComplete(mergedResult);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
          Alert.alert('Error', `Error reintentando upload: ${errorMessage}`);
          
          if (onUploadError) {
            onUploadError(errorMessage);
          }
        } finally {
          setUploading(false);
        }
      }
    }
  }, [selectedFiles, uploadResult, onUploadComplete, onUploadError]);

  const getTotalSize = useCallback(() => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  }, [selectedFiles]);

  const getFormattedTotalSize = useCallback(() => {
    return FileService.formatFileSize(getTotalSize());
  }, [getTotalSize]);

  const hasValidFiles = useCallback(() => {
    return selectedFiles.length > 0;
  }, [selectedFiles]);

  const canUpload = useCallback(() => {
    return hasValidFiles() && !uploading;
  }, [hasValidFiles, uploading]);

  return {
    // State
    selectedFiles,
    uploadProgress,
    uploading,
    uploadResult,
    
    // Actions
    selectFiles,
    selectSingleFile,
    uploadFiles,
    removeFile,
    clearFiles,
    retryUpload,
    
    // Utilities
    getTotalSize,
    getFormattedTotalSize,
    hasValidFiles,
    canUpload,
  };
};

export default useFileUpload; 