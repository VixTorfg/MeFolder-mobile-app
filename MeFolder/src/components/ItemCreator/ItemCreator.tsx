import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { useItemCreatorStyles } from './styles';
import FileCreator from './FileCreator';
import FolderCreator from './FolderCreator';

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
  currentFolderId,
}: ItemCreatorProps) {
  const { theme } = useTheme();
  const styles = useItemCreatorStyles();
  const [selectedType, setSelectedType] = useState<CreatorType>('file');

  const handleClose = () => {
    setSelectedType('file');
    onClose();
  };

  const handleSaveFile = async (data: any): Promise<void> => {
    if (onSaveFile) {
      await onSaveFile(data);
    }
    handleClose();
  };

  const handleSaveFolder = async (data: any): Promise<void> => {
    if (onSaveFolder) {
      await onSaveFolder(data);
    }
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Nuevo elemento</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Ionicons
                name="close"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          {/* Selector de tipo: Archivo / Carpeta */}
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

          {/* Contenido dinámico */}
          <ScrollView showsVerticalScrollIndicator={false}>
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
        </View>
      </View>
    </Modal>
  );
}
