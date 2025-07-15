/**
 * FileUploader component for handling multiple file uploads with progress tracking
 */

import React from 'react';
import { View, StyleSheet, Alert, ScrollView } from 'react-native';
import { 
  Button, 
  Card, 
  Text, 
  IconButton, 
  ProgressBar, 
  Chip, 
  Surface,
  List,
  Divider
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useFileUpload, UseFileUploadOptions } from '../../hooks/useFileUpload';
import { FileService } from '../../services/fileService';
import { FileSelection, FileUploadProgress } from '../../types';

interface FileUploaderProps extends UseFileUploadOptions {
  entityType: string;
  entityId: string;
  title?: string;
  subtitle?: string;
  showUploadButton?: boolean;
  disabled?: boolean;
  compact?: boolean;
  onFilesChanged?: (files: FileSelection[]) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  entityType,
  entityId,
  title = 'Archivos adjuntos',
  subtitle = 'Selecciona archivos para subir',
  showUploadButton = true,
  disabled = false,
  compact = false,
  onFilesChanged,
  ...hookOptions
}) => {
  const { t } = useTranslation();
  
  const {
    selectedFiles,
    uploadProgress,
    uploading,
    uploadResult,
    selectFiles,
    selectSingleFile,
    uploadFiles,
    removeFile,
    clearFiles,
    retryUpload,
    getTotalSize,
    getFormattedTotalSize,
    hasValidFiles,
    canUpload,
  } = useFileUpload({
    ...hookOptions,
    onUploadComplete: (result) => {
      hookOptions.onUploadComplete?.(result);
      if (onFilesChanged) {
        onFilesChanged(selectedFiles);
      }
    },
  });

  const handleSelectFiles = async () => {
    if (hookOptions.allowMultiple === false) {
      await selectSingleFile();
    } else {
      await selectFiles();
    }
  };

  const handleUpload = async () => {
    if (!canUpload()) return;
    await uploadFiles(entityType, entityId);
  };

  const handleRetry = async () => {
    await retryUpload(entityType, entityId);
  };

  const getFileIcon = (mimeType: string) => {
    if (FileService.isImage(mimeType)) {
      return 'image';
    } else if (mimeType.includes('pdf')) {
      return 'picture-as-pdf';
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return 'description';
    } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
      return 'table-chart';
    } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
      return 'slideshow';
    } else if (mimeType.includes('zip') || mimeType.includes('rar')) {
      return 'archive';
    } else {
      return 'attachment';
    }
  };

  const getProgressStatus = (progress: FileUploadProgress) => {
    switch (progress.status) {
      case 'pending':
        return { color: '#666', text: 'Pendiente' };
      case 'uploading':
        return { color: '#2196F3', text: 'Subiendo...' };
      case 'completed':
        return { color: '#4CAF50', text: 'Completado' };
      case 'error':
        return { color: '#F44336', text: 'Error' };
      default:
        return { color: '#666', text: 'Desconocido' };
    }
  };

  const renderFileItem = (file: FileSelection, index: number) => {
    const progress = uploadProgress.find(p => p.name === file.name);
    const progressStatus = progress ? getProgressStatus(progress) : null;
    
    return (
      <Card key={`${file.name}-${index}`} style={styles.fileCard}>
        <List.Item
          title={file.name}
          description={
            <View>
              <Text variant="bodySmall" style={styles.fileSize}>
                {FileService.formatFileSize(file.size)}
              </Text>
              {progress && (
                <View style={styles.progressContainer}>
                  <ProgressBar 
                    progress={progress.progress / 100} 
                    color={progressStatus?.color}
                    style={styles.progressBar}
                  />
                  <Text variant="bodySmall" style={[styles.progressText, { color: progressStatus?.color }]}>
                    {progress.progress}% - {progressStatus?.text}
                  </Text>
                  {progress.error && (
                    <Text variant="bodySmall" style={styles.errorText}>
                      {progress.error}
                    </Text>
                  )}
                </View>
              )}
            </View>
          }
          left={(props) => (
            <List.Icon 
              {...props} 
              icon={getFileIcon(file.type)}
              color={progressStatus?.color || '#666'}
            />
          )}
          right={(props) => (
            <IconButton
              {...props}
              icon="close"
              onPress={() => removeFile(file.name)}
              disabled={uploading}
            />
          )}
        />
      </Card>
    );
  };

  if (compact) {
    return (
      <Surface style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text variant="titleSmall">{title}</Text>
          <Button 
            mode="outlined" 
            onPress={handleSelectFiles}
            disabled={disabled || uploading}
            compact
          >
            {hookOptions.allowMultiple === false ? 'Seleccionar' : 'Seleccionar archivos'}
          </Button>
        </View>
        
        {hasValidFiles() && (
          <View style={styles.compactFiles}>
            <Text variant="bodySmall">
              {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''} 
              ({getFormattedTotalSize()})
            </Text>
            {showUploadButton && (
              <Button 
                mode="contained"
                onPress={handleUpload}
                disabled={!canUpload()}
                loading={uploading}
                compact
              >
                Subir
              </Button>
            )}
          </View>
        )}
      </Surface>
    );
  }

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text variant="titleMedium">{title}</Text>
            <Text variant="bodySmall" style={styles.subtitle}>
              {subtitle}
            </Text>
          </View>
          
          <Button 
            mode="outlined" 
            onPress={handleSelectFiles}
            disabled={disabled || uploading}
            icon="attach-file"
          >
            {hookOptions.allowMultiple === false ? 'Seleccionar' : 'Seleccionar archivos'}
          </Button>
        </View>

        {hasValidFiles() && (
          <>
            <Divider style={styles.divider} />
            
            <View style={styles.summary}>
              <Text variant="bodyMedium">
                {selectedFiles.length} archivo{selectedFiles.length > 1 ? 's' : ''} seleccionado{selectedFiles.length > 1 ? 's' : ''}
              </Text>
              <Text variant="bodySmall" style={styles.totalSize}>
                Tamaño total: {getFormattedTotalSize()}
              </Text>
            </View>

            <ScrollView style={styles.filesList} showsVerticalScrollIndicator={false}>
              {selectedFiles.map(renderFileItem)}
            </ScrollView>

            <View style={styles.actions}>
              <Button 
                mode="outlined" 
                onPress={clearFiles}
                disabled={uploading}
                icon="clear"
              >
                Limpiar
              </Button>
              
              {showUploadButton && (
                <Button 
                  mode="contained"
                  onPress={handleUpload}
                  disabled={!canUpload()}
                  loading={uploading}
                  icon="cloud-upload"
                >
                  Subir archivos
                </Button>
              )}
              
              {uploadResult && uploadResult.failedCount > 0 && (
                <Button 
                  mode="outlined"
                  onPress={handleRetry}
                  disabled={uploading}
                  icon="refresh"
                >
                  Reintentar
                </Button>
              )}
            </View>
          </>
        )}

        {uploadResult && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.results}>
              <Text variant="titleSmall">Resultado del upload:</Text>
              <View style={styles.resultStats}>
                <Chip 
                  icon="check-circle" 
                  style={[styles.chip, { backgroundColor: '#E8F5E8' }]}
                  textStyle={{ color: '#2E7D32' }}
                >
                  {uploadResult.successfulFiles} exitosos
                </Chip>
                {uploadResult.failedCount > 0 && (
                  <Chip 
                    icon="error" 
                    style={[styles.chip, { backgroundColor: '#FFEBEE' }]}
                    textStyle={{ color: '#C62828' }}
                  >
                    {uploadResult.failedCount} fallidos
                  </Chip>
                )}
              </View>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  compactContainer: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactFiles: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  divider: {
    marginVertical: 16,
  },
  summary: {
    marginBottom: 16,
  },
  totalSize: {
    color: '#666',
    marginTop: 4,
  },
  filesList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  fileCard: {
    marginBottom: 8,
  },
  fileSize: {
    color: '#666',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  results: {
    marginTop: 8,
  },
  resultStats: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    elevation: 0,
  },
});

export default FileUploader; 