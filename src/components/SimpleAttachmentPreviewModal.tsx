import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import Pdf from 'react-native-pdf';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslationSafe } from '../hooks/useTranslationSafe';
import { httpClient } from '../utils/httpClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';

interface SimpleAttachmentPreviewModalProps {
  visible: boolean;
  attachment: any;
  onClose: () => void;
  onDownload?: (attachment: any) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const SimpleAttachmentPreviewModal: React.FC<SimpleAttachmentPreviewModalProps> = ({
  visible,
  attachment,
  onClose,
  onDownload,
}) => {
  const { t } = useTranslationSafe();
  const [isLoading, setIsLoading] = useState(true);
  const [previewData, setPreviewData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'other'>('other');


  useEffect(() => {
    if (visible && attachment) {
      loadPreview();
    } else {
      // Reset state when modal closes
      setPreviewData(null);
      setError(null);
      setIsLoading(true);
      setFileType('other');
      
      // No cleanup needed for data URI approach
    }
  }, [visible, attachment]);

  const loadPreview = async () => {
    setIsLoading(true);
    setError(null);
    
    console.log('🔍 Loading preview for:', {
      id: attachment?.id,
      uuid: attachment?.uuid,
      fileName: attachment?.file_name || attachment?.name,
      mimeType: attachment?.mime_type,
      size: attachment?.size
    });
    
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const attachmentId = attachment?.uuid || attachment?.id;
      
      if (!attachmentId) {
        throw new Error('No attachment ID found');
      }

      const mimeType = (attachment?.mime_type || '').toLowerCase();
      const isImage = mimeType.startsWith('image/') || attachment?.is_image;
      const isPdf = mimeType.includes('pdf') || attachment?.is_pdf;
      
      console.log('📊 File type detection:', { mimeType, isImage, isPdf });

      // Set file type for rendering
      if (isImage) {
        setFileType('image');
      } else if (isPdf) {
        setFileType('pdf');
      } else {
        setFileType('other');
      }

      console.log('📥 Downloading file...');
      
      // Download file as ArrayBuffer
      const response = await httpClient.get(
        `/v1/attachments/${attachmentId}/preview`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Accept': mimeType || '*/*',
          },
          responseType: 'arraybuffer',
        }
      );

      if (!response.data) {
        throw new Error('No file data received');
      }

      console.log('✅ File downloaded, size:', response.data.byteLength, 'bytes');

      // Debug: Check first few bytes for PDF validation
      if (isPdf && response.data instanceof ArrayBuffer) {
        const firstBytes = new Uint8Array(response.data.slice(0, 20));
        console.log('🔍 First 20 bytes:', Array.from(firstBytes).map(b => b.toString(16).padStart(2, '0')).join(' '));
        
        // Check if it's a valid PDF (should start with %PDF) - using manual conversion instead of TextDecoder
        const headerBytes = new Uint8Array(response.data.slice(0, 4));
        const pdfHeader = String.fromCharCode(...headerBytes);
        console.log('📄 PDF Header check:', pdfHeader, pdfHeader === '%PDF' ? '✅ Valid PDF' : '❌ Invalid PDF');
        
        // Check PDF version - using manual conversion
        const versionBytes = new Uint8Array(response.data.slice(0, 8));
        const pdfVersion = String.fromCharCode(...versionBytes);
        console.log('📄 PDF Version:', pdfVersion);
      }

      // Convert ArrayBuffer to base64
      const base64Data = arrayBufferToBase64(response.data);
      
      // Create data URI for all file types
      const dataUri = `data:${mimeType || 'application/octet-stream'};base64,${base64Data}`;
      
      setPreviewData(dataUri);

      // PDFs use data URI approach only - no temporary files needed
      
    } catch (err: any) {
      console.error('❌ Error loading preview:', err);
      const errorMessage = err?.message || 'Error loading preview';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(attachment);
    }
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Cargando vista previa...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPreview}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!previewData) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="insert-drive-file" size={48} color="#6B7280" />
          <Text style={styles.errorText}>No hay vista previa disponible</Text>
        </View>
      );
    }

    switch (fileType) {
      case 'image':
        return (
          <ScrollView
            style={styles.imageContainer}
            contentContainerStyle={styles.imageContentContainer}
            scrollEnabled={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            bounces={false}
            bouncesZoom={false}
            minimumZoomScale={1}
            maximumZoomScale={1}
          >
            <Image
              source={{ uri: previewData }}
              style={styles.previewImage}
              resizeMode="contain"
              onError={(e) => {
                console.error('Image load error:', e.nativeEvent.error);
                setError('Error cargando imagen');
              }}
            />
          </ScrollView>
        );

      case 'pdf':
        
        // Use react-native-pdf for native PDF rendering
        return (
          <View style={styles.pdfContainer}>
            <Pdf
              source={{ uri: previewData }}
              onLoadComplete={(numberOfPages, filePath) => {
                console.log('✅ PDF loaded successfully:', numberOfPages, 'pages');
                console.log('📁 PDF file path:', filePath);
              }}
              onPageChanged={(page, numberOfPages) => {
                console.log('📄 Current page:', page, 'of', numberOfPages);
              }}
              onError={(error) => {
                console.error('❌ react-native-pdf error:', error);
                setError('Error cargando PDF: ' + error.message);
              }}
              onPressLink={(uri) => {
                console.log('🔗 Link pressed:', uri);
              }}
              style={styles.pdf}
              // PDF display options
              enablePaging={true}
              enableRTL={false}
              enableAnnotationRendering={true}
              enableAntialiasing={true}
              fitPolicy={0} // 0: fit width, 1: fit height, 2: fit both
              spacing={10}
              // Loading and error handling
              activityIndicator={() => (
                <View style={styles.pdfLoading}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingText}>Cargando PDF...</Text>
                </View>
              )}
              activityIndicatorProps={{
                color: '#007AFF',
                progressTintColor: '#007AFF',
              }}
              // Performance options
              enableDoubleTapZoom={true}
              minScale={0.5}
              maxScale={3.0}
              scale={1.0}
              horizontal={false}
            />
          </View>
        );


      default:
        return (
          <View style={styles.unsupportedContainer}>
            <Icon name="insert-drive-file" size={64} color="#6B7280" />
            <Text style={styles.unsupportedText}>Tipo de archivo no soportado para vista previa</Text>
            <Text style={styles.fileInfo}>
              {attachment?.file_name || attachment?.name || 'File'}
            </Text>
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <Icon 
                name={getFileIcon(attachment)} 
                size={24} 
                color="#007AFF" 
              />
              <Text style={styles.fileName} numberOfLines={1}>
                {attachment?.file_name || attachment?.name || 'File'}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#1C1C1E" />
            </TouchableOpacity>
          </View>

          {/* Preview Content */}
          <View style={styles.previewContainer}>
            {renderPreview()}
          </View>

          {/* Footer Actions */}
          {!isLoading && (
            <View style={styles.footer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleDownload}>
                <Icon name="download" size={20} color="#007AFF" />
                <Text style={styles.actionButtonText}>Descargar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

// Helper function to determine file icon
const getFileIcon = (attachment: any): string => {
  const mime = (attachment?.mime_type || '').toLowerCase();
  const ext = (attachment?.extension || '').toLowerCase();
  
  if (attachment?.is_image || mime.startsWith('image/')) return 'image';
  if (attachment?.is_pdf || mime.includes('pdf') || ext === 'pdf') return 'picture-as-pdf';
  if (mime.includes('excel') || mime.includes('spreadsheet') || ['xls', 'xlsx', 'csv'].includes(ext)) return 'table-chart';
  if (mime.includes('word') || mime.includes('document') || ['doc', 'docx', 'txt', 'rtf'].includes(ext)) return 'description';
  
  return 'attach-file';
};

// Helper function to convert ArrayBuffer to base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: screenWidth * 0.95,
    maxWidth: 600,
    height: screenHeight * 0.85,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#F5F5F7',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  imageContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageContentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  pdf: {
    flex: 1,
    width: screenWidth,
    height: screenHeight - 100, // Account for modal header
    backgroundColor: '#F5F5F7',
  },
  pdfLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  unsupportedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unsupportedText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
  },
  fileInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default SimpleAttachmentPreviewModal;
