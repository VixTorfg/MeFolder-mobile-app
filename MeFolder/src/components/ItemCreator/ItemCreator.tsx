import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { useItemCreatorStyles } from './styles';
import { BottomSheet } from '@/animations';
import FileCreator from './FileCreator';
import FolderCreator from './FolderCreator';
import { ROOT_FOLDER_ID } from '@/database/seeds/systemFolders';

type CreatorType = 'file' | 'folder';

interface ItemCreatorProps {
  visible: boolean;
  onClose: () => void;
  onSaveFile?: (data: any) => Promise<void> | void;
  onSaveFolder?: (data: any) => Promise<void> | void;
  currentFolderId?: string;
}

export default function ItemCreator({
  visible,
  onClose,
  onSaveFile,
  onSaveFolder,
  currentFolderId = ROOT_FOLDER_ID,
}: ItemCreatorProps) {
  const { theme } = useTheme();
  const styles = useItemCreatorStyles();
  const [selectedType, setSelectedType] = useState<CreatorType>('file');

  const handleResetOnClose = useCallback(() => {
    setSelectedType('file');
  }, []);

  const handleSaveFile = async (data: any): Promise<void> => {
    if (onSaveFile) {
      await onSaveFile(data);
    }
  };

  const handleSaveFolder = async (data: any): Promise<void> => {
    if (onSaveFolder) {
      await onSaveFolder(data);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onBeforeClose={handleResetOnClose}
      title="Nuevo elemento"
    >

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedType === 'file' && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedType('file')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="document-outline"
                  size={22}
                  color={
                    selectedType === 'file'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedType === 'file' && styles.typeOptionTextActive,
                  ]}
                >
                  Archivo
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedType === 'folder' && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedType('folder')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="folder-outline"
                  size={22}
                  color={
                    selectedType === 'folder'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedType === 'folder' && styles.typeOptionTextActive,
                  ]}
                >
                  Carpeta
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ 
                paddingBottom: 4 * theme.spacing.xxl, 
              }}
             >
              {selectedType === 'file' ? (
                <FileCreator
                  onSave={handleSaveFile}
                  currentFolderId={currentFolderId}
                />
              ) : (
                <FolderCreator
                  onSave={handleSaveFolder}
                  currentFolderId={currentFolderId}
                />
              )}
            </ScrollView>
    </BottomSheet>
  );
}
