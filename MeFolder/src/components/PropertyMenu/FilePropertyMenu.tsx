import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAlert, useServices, useTheme } from '@/providers';
import { useFilePropertyMenuStyles } from './styles';
import { formatFileSize } from '@/utils/format/bytes';
import { FileCategory, MIME_PREFIX_CATEGORIES, MIME_TO_CATEGORY_MAP } from '@/types/common/file-extensions';
import { FileModel } from '@/models/file';
import { formatFullDateTime } from '@/utils';
import { useLibraryStore } from '@/stores/useLibraryStore';

interface MockTag {
  id: string;
  name: string;
  color: string;
}

const MOCK_TAGS: MockTag[] = [
  { id: '1', name: 'Personal', color: '#F2C94C' },
  { id: '2', name: 'Trabajo', color: '#5DA9C7' },
  { id: '3', name: 'Importante', color: '#EB5757' },
  { id: '4', name: 'Proyecto', color: '#6FCF97' },
  { id: '5', name: 'Referencia', color: '#F2994A' },
];

export const FilePropertyMenu = ({ 
  item, 
  section,
}: { 
  item: FileModel; 
  section: 'details' | 'customize';
}) => {
  const { theme } = useTheme();
  const { services } = useServices();
  const { showAlert } = useAlert();
  const { updateItem } = useLibraryStore();
  const styles = useFilePropertyMenuStyles();

  const [fileName, setFileName] = useState(item.name);
  const [file, setFile] = useState(item);
  const isRenaming = fileName !== file.name;

  const getFileCategoryFromMime = (mimeType?: string): FileCategory => {
    if (!mimeType) return 'other';

    const mime = mimeType.toLowerCase();

    for (const [prefix, category] of Object.entries(MIME_PREFIX_CATEGORIES)) {
      if (mime.startsWith(prefix)) return category;
    }

    return MIME_TO_CATEGORY_MAP[mime] ?? 'other';
  };

 
  const handleFileNameChange = (newName: string): void => {
    setFileName(newName);
  };

  const handleRenameFile = async (): Promise<void> => {
    showAlert({
      title: 'Renombrar archivo',
      message: `¿Estás seguro de que quieres renombrar el archivo a "${fileName}"?`,
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Renombrar', onPress: async () => {
          if(!fileName.trim()){
            showAlert({ title: 'Error', message: 'El nombre del archivo no puede estar vacío' });
            return;
          }
          const fileService = services.fileService;
          
          if (!fileService) return;

          const result = await fileService.renameFile(file.id, fileName);
          setFile(result);

          updateItem(result);
        },
      }] 
    });
  }

  const getFileIcon = (type: FileModel['category']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'image': return 'image-outline';
      case 'video': return 'videocam-outline';
      case 'audio': return 'musical-notes-outline';
      case 'document': return 'document-outline';
      case 'code': return 'code-slash-outline';
      case 'archive': return 'file-tray-stacked-outline';
      case 'spreadsheet': return 'grid-outline';
      default: return 'document-outline';
    }
  };

  const formatVisibility = (visibility: string): string => {
    switch (visibility) {
      case 'private': return 'Privado';
      case 'public': return 'Público';
      case 'shared': return 'Compartido';
      default: return visibility;
    }
  };

  const formatStatus = (status: string): string => {
    switch (status) {
      case 'active': return 'Activo';
      case 'archived': return 'Archivado';
      case 'deleted': return 'Eliminado';
      default: return status;
    }
  };

  const renderDetailsSection = () => {
    return (
        <View style={styles.container}>
        <View style={styles.section}>
          <View style={styles.nameRow}>
              <Ionicons
                name={getFileIcon(getFileCategoryFromMime(file.metadata.mimeType))}
                size={44}
              />
              
              <View style={{flex: 1}}>
                  <TextInput
                      style={styles.fileNameInput} 
                      value={fileName}
                      onChangeText={handleFileNameChange}
                      placeholder="Nombre del archivo"
                      placeholderTextColor={theme.colors.textMuted}     
                      selectTextOnFocus 
                      numberOfLines={1}
                      scrollEnabled
                      textAlignVertical="center"             
                  />                              
              </View>
              
              {isRenaming && (
                  <TouchableOpacity
                    onPress={() => {handleRenameFile()}}
                    activeOpacity={0.7} 
                  >
                    <Ionicons
                      name="create-outline"
                      size={28}
                    />
                  </TouchableOpacity> )}  
          </View>

          <View style={styles.column}>
            <View style={styles.row}>
              <Text style={styles.label}>Se abre con:</Text>
            </View>
          </View>
        </View>

        {/* Size section */}
        <View style={styles.section}>
              <View style={styles.tagRow}>
                <Ionicons
                  name="stats-chart-outline"
                  size={24}
                  color={theme.colors.textPrimary}
                />
                <Text style={styles.sectionTitle}>Tamaño y visibilidad</Text>
              </View>

              <View style={styles.column}>
                <View style={styles.row}>
                  <Text style={styles.label}>Ubicación:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={styles.value} numberOfLines={1}>
                      {file.path ? file.path : '-'}
                    </Text>
                  </ScrollView>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Tamaño:</Text>
                  <Text style={styles.value} numberOfLines={1}>
                    {file.size ? formatFileSize(file.size) : '-'}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Visibilidad:</Text>
                  <Text style={styles.value} numberOfLines={1}>
                    {file.visibility ? formatVisibility(file.visibility) : '-'}
                  </Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.label}>Estado:</Text>
                  <Text style={styles.value} numberOfLines={1}>
                    {file.status ? formatStatus(file.status) : '-'}
                  </Text>
                </View>
              </View>
        </View>

        {/* Creation/Modification/Access section */}
        <View style={styles.section}>
          <View style={styles.tagRow}>
            <Ionicons
              name="calendar-outline"
              size={24}
              color={theme.colors.textPrimary}
            />
            <Text style={styles.sectionTitle}>Fechas</Text>
          </View>

          <View style={styles.column}>
            <View style={styles.row}>
              <Text style={styles.label}>Creación:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.value} numberOfLines={1}>
                  {file.createdAt ? formatFullDateTime(file.createdAt) : '-'}
                </Text>
              </ScrollView>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Último acceso:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.value} numberOfLines={1}>
                  {file.accessedAt ? formatFullDateTime(file.accessedAt) : '-'}
                </Text>
              </ScrollView>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Modificación:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <Text style={styles.value} numberOfLines={1}>
                  {file.updatedAt ? formatFullDateTime(file.updatedAt) : '-'}
                </Text>
              </ScrollView>
            </View>
          </View>
        </View>

          {/* Tag section */}
          <View style={styles.section}>
              <View style={styles.tagRow}>
                <Ionicons
                  name="pricetags-outline"
                  size={24}
                  color={theme.colors.textPrimary}
                />
                <Text style={styles.sectionTitle}>Etiquetas</Text>
              </View>

              <View style={styles.tagList}>
              {MOCK_TAGS.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.tagChip}
                  activeOpacity={0.7}
                >
                  <View
                    style={[styles.tagDot, { backgroundColor: tag.color }]}
                  />
                  <Text style={styles.tagChipText}>
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              ))}
              </View>   

              <View style={styles.tagsButtonRow}>
                  <TouchableOpacity
                      style={[styles.tagButton, {
                        borderColor: theme.colors.primary,
                        backgroundColor: theme.colors.primarySoft
                      }]}
                      onPress={() => {}}
                      activeOpacity={0.7}
                  >
                      <MaterialCommunityIcons
                        name="bookmark-plus-outline"
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Text style={[styles.tagsButtonText, { color: theme.colors.primary }]}>
                          Añadir
                      </Text>
                  </TouchableOpacity>   

                  <TouchableOpacity
                      style={styles.tagButton}
                      onPress={() => {}}
                      activeOpacity={0.7}
                  >
                      <MaterialCommunityIcons
                        name="tag-plus-outline"
                        size={22}
                        color={theme.colors.textSecondary}
                      />
                      <Text style={styles.tagsButtonText}>
                          Crear Etiqueta
                      </Text>
                  </TouchableOpacity>   
              </View>     
          </View>
      </View>
    )
  }

  return (
    <>
      {section === 'details' ? (
        renderDetailsSection()
      ) : (
        null
      )}
    </>
  );
}
