import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { useFileCreatorStyles } from './styles';
import { getDocumentAsync } from 'expo-document-picker';
import { formatFileSize } from '@/utils/format/bytes';
import { FileCategory, MIME_PREFIX_CATEGORIES, MIME_TO_CATEGORY_MAP } from '@/types/common/file-extensions';

type FileSource = 'gallery' | 'document' | 'camera';

interface SelectedFile {
  id: string;
  name: string;
  originalName: string;
  uri: string;
  size?: number;
  mimeType?: string;
  type: FileCategory;
}

export type NewFile = {
  files: SelectedFile[];
  tags: string[];
  folderId: string | undefined;
}

interface MockTag {
  id: string;
  name: string;
  color: string;
}

interface FileCreatorProps {
  onSave: (data: NewFile) => Promise<void> | void;
  currentFolderId?: string;
}

// Tags de ejemplo para la parte visual
const MOCK_TAGS: MockTag[] = [
  { id: '1', name: 'Personal', color: '#F2C94C' },
  { id: '2', name: 'Trabajo', color: '#5DA9C7' },
  { id: '3', name: 'Importante', color: '#EB5757' },
  { id: '4', name: 'Proyecto', color: '#6FCF97' },
  { id: '5', name: 'Referencia', color: '#F2994A' },
];

export default function FileCreator({ onSave, currentFolderId }: FileCreatorProps) {
  const { theme } = useTheme();
  const styles = useFileCreatorStyles();

  const [selectedSource, setSelectedSource] = useState<FileSource | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());

  const getFileCategoryFromMime = (mimeType?: string): FileCategory => {
    if (!mimeType) return 'other';

    const mime = mimeType.toLowerCase();

    for (const [prefix, category] of Object.entries(MIME_PREFIX_CATEGORIES)) {
      if (mime.startsWith(prefix)) return category;
    }

    return MIME_TO_CATEGORY_MAP[mime] ?? 'other';
  };

  /**
   * Simula la selección de archivos desde la galería (media-library).
   * En el futuro se conectará con expo-media-library.
   */
  const handlePickFromGallery = async (): Promise<void> => {
    // TODO: Conectar con expo-media-library
    const mockFiles: SelectedFile[] = [
      {
        id: `file_${Date.now()}_1`,
        name: 'IMG_20260219_001.jpg',
        originalName: 'IMG_20260219_001.jpg',
        uri: 'mock://gallery/photo1.jpg',
        size: 3456789,
        mimeType: 'image/jpeg',
        type: 'image',
      },
      {
        id: `file_${Date.now()}_2`,
        name: 'VID_20260219_002.mp4',
        originalName: 'VID_20260219_002.mp4',
        uri: 'mock://gallery/video1.mp4',
        size: 15678900,
        mimeType: 'video/mp4',
        type: 'video',
      },
    ];
    setSelectedFiles(mockFiles);
  };

  const handlePickDocument = async (): Promise<void> => {
    const result = await getDocumentAsync({
        multiple: true
      });

    if (result.canceled === true) {
      setSelectedFiles([]);
      return;
    }

    const pickedFiles: SelectedFile[] = result.assets.map((asset, index) => {
      const fileName = asset.name || `archivo_${Date.now()}`;
      return {
        id: `file_${Date.now()}_${index}`,
        name: fileName,
        originalName: fileName,
        uri: asset.uri,
        ...(asset.size != null && { size: asset.size }),
        ...(asset.mimeType != null && { mimeType: asset.mimeType }),
        type: getFileCategoryFromMime(asset.mimeType),
      };
    });
      
    setSelectedFiles(pickedFiles);
  };

  /**
   * Simula la captura desde cámara.
   * En el futuro se conectará con expo-camera o expo-image-picker (launchCameraAsync).
   */
  const handleCaptureFromCamera = async (): Promise<void> => {
    // TODO: Conectar con expo-camera / expo-image-picker
    const captureName = `Captura_${Date.now()}.jpg`;
    const mockFile: SelectedFile = {
      id: `file_${Date.now()}`,
      name: captureName,
      originalName: captureName,
      uri: 'mock://camera/capture.jpg',
      size: 2345678,
      mimeType: 'image/jpeg',
      type: 'image',
    };
    setSelectedFiles([mockFile]);
  };

  const handleSourceSelect = async (source: FileSource): Promise<void> => {
    setSelectedSource(source);
    setSelectedFiles([]);

    switch (source) {
      case 'gallery':
        await handlePickFromGallery();
        break;
      case 'document':
        await handlePickDocument();
        break;
      case 'camera':
        await handleCaptureFromCamera();
        break;
    }
  };

  const handleFileNameChange = (fileId: string, newName: string): void => {
    setSelectedFiles(prev =>
      prev.map(f => (f.id === fileId ? { ...f, name: newName } : f))
    );
  };

  const handleRemoveFile = (fileId: string): void => {
    setSelectedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const toggleTag = (tagId: string): void => {
    setSelectedTags(prev => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  const getFileIcon = (type: SelectedFile['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'image': return 'image-outline';
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-notes-outline';
      case 'document': return 'document-text-outline';
      case 'code': return 'code-slash-outline';
      case 'archive': return 'file-tray-stacked-outline';
      case 'spreadsheet': return 'grid-outline';
      default: return 'document-outline';
    }
  };

  const canSave = selectedFiles.length > 0;

  const handleSave = async (): Promise<void> => {
    if (!canSave) return;
    await onSave({
      files: selectedFiles,
      tags: Array.from(selectedTags),
      folderId: currentFolderId,
    });
  };

  return (
    <View style={styles.container}>
      {/* Sección: Origen del archivo */}
      <Text style={styles.sectionTitle}>¿De dónde quieres importar?</Text>
      <View style={styles.sourceSelector}>
        {/* Galería */}
        <TouchableOpacity
          style={[
            styles.sourceOption,
            selectedSource === 'gallery' && styles.sourceOptionActive,
          ]}
          onPress={() => handleSourceSelect('gallery')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.sourceIcon,
              selectedSource === 'gallery' && styles.sourceIconActive,
            ]}
          >
            <Ionicons
              name="images-outline"
              size={22}
              color={
                selectedSource === 'gallery'
                  ? theme.colors.textOnColor
                  : theme.colors.textSecondary
              }
            />
          </View>
          <Text
            style={[
              styles.sourceOptionText,
              selectedSource === 'gallery' && styles.sourceOptionTextActive,
            ]}
          >
            Galería
          </Text>
        </TouchableOpacity>

        {/* Documentos */}
        <TouchableOpacity
          style={[
            styles.sourceOption,
            selectedSource === 'document' && styles.sourceOptionActive,
          ]}
          onPress={() => handleSourceSelect('document')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.sourceIcon,
              selectedSource === 'document' && styles.sourceIconActive,
            ]}
          >
            <Ionicons
              name="document-outline"
              size={22}
              color={
                selectedSource === 'document'
                  ? theme.colors.textOnColor
                  : theme.colors.textSecondary
              }
            />
          </View>
          <Text
            style={[
              styles.sourceOptionText,
              selectedSource === 'document' && styles.sourceOptionTextActive,
            ]}
          >
            Documentos
          </Text>
        </TouchableOpacity>

        {/* Cámara */}
        <TouchableOpacity
          style={[
            styles.sourceOption,
            selectedSource === 'camera' && styles.sourceOptionActive,
          ]}
          onPress={() => handleSourceSelect('camera')}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.sourceIcon,
              selectedSource === 'camera' && styles.sourceIconActive,
            ]}
          >
            <Ionicons
              name="camera-outline"
              size={22}
              color={
                selectedSource === 'camera'
                  ? theme.colors.textOnColor
                  : theme.colors.textSecondary
              }
            />
          </View>
          <Text
            style={[
              styles.sourceOptionText,
              selectedSource === 'camera' && styles.sourceOptionTextActive,
            ]}
          >
            Cámara
          </Text>
        </TouchableOpacity>
      </View>

      {/* Archivos seleccionados */}
      {selectedFiles.length > 0 ? (
        <View style={styles.selectedFilesContainer}>
          <Text style={styles.sectionTitle}>
            Archivos seleccionados ({selectedFiles.length})
          </Text>
          {selectedFiles.map(file => (
            <View key={file.id} style={styles.selectedFileCard}>
              {/* Thumbnail / Icono */}
              <View style={styles.fileThumbnail}>
                <Ionicons
                  name={getFileIcon(file.type)}
                  size={24}
                  color={theme.colors.textSecondary}
                />
              </View>

              {/* Nombre editable + tamaño */}
              <View style={styles.fileInfo}>
                <TextInput
                  style={styles.fileNameInput}
                  value={file.name}
                  onChangeText={(text) => handleFileNameChange(file.id, text)}
                  placeholder="Nombre del archivo"
                  placeholderTextColor={theme.colors.textMuted}
                  selectTextOnFocus
                />
                <Text style={styles.fileSize}>{formatFileSize(file.size)}</Text>
              </View>

              <TouchableOpacity
                style={styles.removeFileButton}
                onPress={() => handleRemoveFile(file.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="close-circle"
                  size={24}
                  color={theme.colors.error}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : selectedSource === null ? (
        <View style={styles.emptyState}>
          <Ionicons
            name="cloud-upload-outline"
            size={48}
            color={theme.colors.textMuted}
          />
          <Text style={styles.emptyStateText}>
            Selecciona un origen para importar archivos
          </Text>
        </View>
      ) : null}

      {selectedFiles.length > 0 && (
        <View style={styles.tagSection}>
          <Text style={styles.sectionTitle}>Etiquetas</Text>
          <View style={styles.tagList}>
            {MOCK_TAGS.map(tag => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tagChip,
                  selectedTags.has(tag.id) && styles.tagChipSelected,
                ]}
                onPress={() => toggleTag(tag.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[styles.tagDot, { backgroundColor: tag.color }]}
                />
                <Text
                  style={[
                    styles.tagChipText,
                    selectedTags.has(tag.id) && styles.tagChipTextSelected,
                  ]}
                >
                  {tag.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Botón guardar */}
      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>
          {selectedFiles.length > 1
            ? `Guardar ${selectedFiles.length} archivos`
            : 'Guardar archivo'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
