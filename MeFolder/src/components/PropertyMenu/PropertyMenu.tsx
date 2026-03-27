import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { usePropertyMenuStyles } from './styles';
import { BottomSheet } from '@/animations';
import { FileModel, FolderModel } from '@/models';
import { FilePropertyMenu } from './FilePropertyMenu';

type SectionType = 'details' | 'customize';

interface PropertyMenuProps {
  item: FileModel | FolderModel;
  visible: boolean;
  onClose: () => void;
}

export const PropertyMenu = ({
  item,
  visible,
  onClose,
}: PropertyMenuProps) => {

  const { theme } = useTheme();
  const styles = usePropertyMenuStyles();
  const [selectedSection, setSelectedSection] = useState<SectionType>('details');

  const isFile = item instanceof FileModel;

  const handleResetOnClose = () => {
    setSelectedSection('details');
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      onBeforeClose={handleResetOnClose}
      title={`Propiedades de ${item.name}`}
    >
            <View style={styles.sectionSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedSection === 'details' && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedSection('details')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="reader-outline"
                  size={22}
                  color={
                    selectedSection === 'details'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedSection === 'details' && styles.typeOptionTextActive,
                  ]}
                >
                  Detalles
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeOption,
                  selectedSection === 'customize' && styles.typeOptionActive,
                ]}
                onPress={() => setSelectedSection('customize')}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={22}
                  color={
                    selectedSection === 'customize'
                      ? theme.colors.primary
                      : theme.colors.textSecondary
                  }
                />
                <Text
                  style={[
                    styles.typeOptionText,
                    selectedSection === 'customize' && styles.typeOptionTextActive,
                  ]}
                >
                  Estilo
                </Text>
              </TouchableOpacity>
            </View>

            {isFile ? (
              <ScrollView 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ 
                  paddingBottom: 4 * theme.spacing.xxl, 
                }}>
                  <FilePropertyMenu item={item} section={selectedSection} />
              </ScrollView>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ 
                  paddingBottom: 4 * theme.spacing.xxl, 
                }}>
                 
              </ScrollView>
            )}
    </BottomSheet>
  );
}
