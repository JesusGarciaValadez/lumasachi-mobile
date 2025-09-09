/**
 * Custom hook for handling multiple file uploads with progress tracking
 */

import { useState, useCallback } from 'react';
import { Alert, InteractionManager, AppState } from 'react-native';
import Toast from 'react-native-toast-message';
import { FileService } from '../services/fileService';
import { 
  FileSelection, 
  FileUploadProgress, 
  MultipleFileUploadResult,
  Attachment 
} from '../types';
import { errorService } from '../services/errorService';
import { retryService } from '../services/retryService';
import { networkService } from '../services/networkService';
import { useTranslationSafe } from './useTranslationSafe';

export interface UseFileUploadOptions {
  entityType?: string;
  entityId?: string;
  onUploadComplete?: (result: MultipleFileUploadResult) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  allowMultiple?: boolean;
  allowedFileTypes?: string[]; // Added allowedFileTypes prop
  isScreenFocused?: boolean; // New: helps avoid Android activity errors
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
    allowedFileTypes, // Destructure allowedFileTypes
    isScreenFocused,
  } = options;

  const [selectedFiles, setSelectedFiles] = useState<FileSelection[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<MultipleFileUploadResult | null>(null);
  const { t } = useTranslationSafe();

  const waitForUIReady = async (timeoutMs: number = 2000) => {
    if (__DEV__) console.log('DEBUG useFileUpload: waiting UI ready...');
    // Ensure interactions are done
    await new Promise<void>((resolve) => InteractionManager.runAfterInteractions(() => resolve()));
    // Ensure app is active
    if (AppState.currentState !== 'active') {
      if (__DEV__) console.log('DEBUG useFileUpload: AppState not active, waiting...');
      await new Promise<void>((resolve) => setTimeout(resolve, Math.min(250, timeoutMs)));
    }
    // Ensure current screen is focused (Android)
    if (isScreenFocused === false) {
      const started = Date.now();
      if (__DEV__) console.log('DEBUG useFileUpload: screen not focused, polling focus...');
      while (Date.now() - started < timeoutMs && isScreenFocused === false) {
        await new Promise<void>((r) => setTimeout(r, 100));
      }
    }
  };

  const pickMultipleWithRetry = async (): Promise<FileSelection[] | null> => {
    try {
      await waitForUIReady();
      const files = await FileService.pickMultipleFiles(allowedFileTypes);
      return files;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (__DEV__) console.log('DEBUG useFileUpload: pickMultipleFiles error', msg);
      if (msg.includes('Current activity does not exist')) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          if (__DEV__) console.log('DEBUG useFileUpload: retry pickMultipleFiles, attempt', attempt);
          await new Promise((r) => setTimeout(r, 300 * attempt));
          await waitForUIReady(2500);
          try {
            const files = await FileService.pickMultipleFiles(allowedFileTypes);
            return files;
          } catch (e: any) {
            const again = String(e?.message || '');
            if (!again.includes('Current activity does not exist')) throw e;
          }
        }
      }
      throw err;
    }
  };

  const pickSingleWithRetry = async (): Promise<FileSelection | null> => {
    try {
      await waitForUIReady();
      const file = await FileService.pickSingleFile(allowedFileTypes);
      return file;
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (__DEV__) console.log('DEBUG useFileUpload: pickSingleFile error', msg);
      if (msg.includes('Current activity does not exist')) {
        for (let attempt = 1; attempt <= 2; attempt++) {
          if (__DEV__) console.log('DEBUG useFileUpload: retry pickSingleFile, attempt', attempt);
          await new Promise((r) => setTimeout(r, 300 * attempt));
          await waitForUIReady(2500);
          try {
            const file = await FileService.pickSingleFile(allowedFileTypes);
            return file;
          } catch (e: any) {
            const again = String(e?.message || '');
            if (!again.includes('Current activity does not exist')) throw e;
          }
        }
      }
      throw err;
    }
  };

  const selectFiles = useCallback(async () => {
    if (!allowMultiple) {
      await selectSingleFile();
      return;
    }

    try {
      const result = await retryService.executeWithRetry(
        async () => {
          const files = await pickMultipleWithRetry();
          
          if (!files || files.length === 0) {
            return null; // User cancelled
          }

          // Check file limit
          if (files.length > maxFiles) {
            throw new Error(t('fileUpload.errors.maxFilesExceeded', { maxFiles }) as string);
          }

          return files;
        },
        {
          maxRetries: 2,
          baseDelay: 500,
        }
      );

      if (result.success && result.result) {
        setSelectedFiles(result.result);
        setUploadProgress([]);
        setUploadResult(null);
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (t('fileUpload.errors.unknownError') as string);
      
      await errorService.logError(error as Error, {
        context: 'selectFiles',
        action: 'file-selection',
        maxFiles,
        allowMultiple,
      });

      // Use Toast to avoid Android Activity issues with Alert during background/transition
      InteractionManager.runAfterInteractions(() => {
        Toast.show({ type: 'error', text1: t('common.error') as string, text2: errorMessage, visibilityTime: 3000 });
      });
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [allowMultiple, maxFiles, onUploadError, allowedFileTypes, t]);

  const selectSingleFile = useCallback(async () => {
    try {
      const result = await retryService.executeWithRetry(
        async () => {
          const file = await pickSingleWithRetry();
          
          if (!file) {
            return null; // User cancelled
          }

          return file;
        },
        {
          maxRetries: 2,
          baseDelay: 500,
        }
      );

      if (result.success && result.result) {
        setSelectedFiles([result.result]);
        setUploadProgress([]);
        setUploadResult(null);
      } else if (result.error) {
        throw result.error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (t('fileUpload.errors.unknownError') as string);
      
      await errorService.logError(error as Error, {
        context: 'selectSingleFile',
        action: 'single-file-selection',
      });

      InteractionManager.runAfterInteractions(() => {
        Toast.show({ type: 'error', text1: t('common.error') as string, text2: errorMessage, visibilityTime: 3000 });
      });
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  }, [onUploadError, allowedFileTypes, t]);

  const uploadFiles = useCallback(async (entityType: string, entityId: string) => {
    if (selectedFiles.length === 0) {
      Alert.alert(t('common.error') as string, t('fileUpload.errors.noFilesSelected') as string);
      return;
    }

    // Check network connectivity
    if (networkService.isOffline()) {
      Alert.alert(t('common.error') as string, t('fileUpload.errors.noInternetConnection') as string);
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await retryService.executeWithRetry(
        async () => {
          // Wait for network connection if needed
          if (networkService.isOffline()) {
            const connected = await networkService.waitForConnection(10000);
            if (!connected) {
              throw new Error(t('fileUpload.errors.couldNotEstablishConnection'));
            }
          }

          return await FileService.uploadMultipleFiles(
            selectedFiles,
            entityType,
            entityId,
            (progress) => {
              setUploadProgress(progress);
            }
          );
        },
        {
          maxRetries: 3,
          baseDelay: 2000,
          backoffFactor: 2,
          retryCondition: (error) => {
            // Retry on network errors but not on validation errors
            return networkService.shouldTriggerOfflineHandling(error) ||
                   error.message?.includes('server') ||
                   error.message?.includes('timeout');
          },
        }
      );

      if (result.success && result.result) {
        setUploadResult(result.result);

        if (result.result.failedCount > 0) {
          const failedNames = result.result.failedFiles.map(f => f.name).join(', ');
          Alert.alert(
            t('fileUpload.success.partiallySuccessful') as string,
            t('fileUpload.success.uploadedPartial', { 
              successfulFiles: result.result.successfulFiles, 
              totalFiles: result.result.totalFiles, 
              failedNames 
            }) as string
          );
        } else {
          Alert.alert(
            t('fileUpload.success.uploadSuccessful') as string,
            t('fileUpload.success.uploadedFiles', { successfulFiles: result.result.successfulFiles }) as string
          );
        }

        if (onUploadComplete) {
          onUploadComplete(result.result);
        }
      } else {
        throw result.error || new Error(t('hooks.errors.uploadFailed') as string);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : (t('fileUpload.errors.unknownError') as string);
      
      await errorService.logError(error as Error, {
        context: 'uploadFiles',
        action: 'file-upload',
        entityType,
        entityId,
        fileCount: selectedFiles.length,
        totalSize: selectedFiles.reduce((sum, f) => sum + f.size, 0),
      });

      Alert.alert(t('common.error') as string, t('fileUpload.errors.uploadError', { errorMessage }) as string);
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    } finally {
      setUploading(false);
    }
  }, [selectedFiles, onUploadComplete, onUploadError, t]);

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
        // Check network connectivity
        if (networkService.isOffline()) {
          Alert.alert(t('common.error') as string, t('fileUpload.errors.noInternetConnection') as string);
          return;
        }

        setUploading(true);
        
        try {
          const result = await retryService.executeWithRetry(
            async () => {
              // Wait for network connection if needed
              if (networkService.isOffline()) {
                const connected = await networkService.waitForConnection(10000);
                if (!connected) {
                  throw new Error(t('fileUpload.errors.couldNotEstablishConnection') as string);
                }
              }

              return await FileService.uploadMultipleFiles(
                filesToRetry,
                entityType,
                entityId,
                (progress) => {
                  setUploadProgress(progress);
                }
              );
            },
            {
              maxRetries: 5,
              baseDelay: 3000,
              backoffFactor: 2,
              retryCondition: (error) => {
                // More aggressive retry for retry attempts
                return networkService.shouldTriggerOfflineHandling(error) ||
                       error.message?.includes('server') ||
                       error.message?.includes('timeout') ||
                       error.message?.includes('failed');
              },
            }
          );

          if (result.success && result.result) {
            // Merge results
            const mergedResult: MultipleFileUploadResult = {
              attachments: [...(uploadResult.attachments || []), ...result.result.attachments],
              failedFiles: result.result.failedFiles,
              totalFiles: uploadResult.totalFiles,
              successfulFiles: (uploadResult.successfulFiles || 0) + result.result.successfulFiles,
              failedCount: result.result.failedCount,
            };

            setUploadResult(mergedResult);

            if (result.result.failedCount === 0) {
              Alert.alert(t('fileUpload.success.retrySuccessful') as string, t('fileUpload.success.allFilesUploaded') as string);
            } else {
              Alert.alert(
                t('fileUpload.success.retryPartiallySuccessful') as string,
                t('fileUpload.success.additionalFilesUploaded', { successfulFiles: result.result.successfulFiles }) as string
              );
            }

            if (onUploadComplete) {
              onUploadComplete(mergedResult);
            }
          } else {
            throw result.error || new Error(t('hooks.errors.retryUploadFailed') as string);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : (t('fileUpload.errors.unknownError') as string);
          
          await errorService.logError(error as Error, {
            context: 'retryUpload',
            action: 'file-upload-retry',
            entityType,
            entityId,
            failedFileCount: filesToRetry.length,
            originalFailedCount: uploadResult.failedCount,
          });

          Alert.alert(t('common.error') as string, t('fileUpload.errors.retryError', { errorMessage }) as string);
          
          if (onUploadError) {
            onUploadError(errorMessage);
          }
        } finally {
          setUploading(false);
        }
      }
    }
  }, [selectedFiles, uploadResult, onUploadComplete, onUploadError, t]);

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