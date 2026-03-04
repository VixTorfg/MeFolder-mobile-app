import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { useFolderCreatorStyles } from './styles';

interface MockTag {
  id: string;
  name: string;
  color: string;
}

interface FolderCreatorProps {
  onSave: (data: any) => Promise<void> | void;
  currentFolderId?: string | null | undefined;
}

// Colores predefinidos para carpetas
const FOLDER_COLORS = [
  { id: 'yellow', hex: '#F2C94C' },
  { id: 'blue', hex: '#5DA9C7' },
  { id: 'green', hex: '#6FCF97' },
  { id: 'red', hex: '#EB5757' },
  { id: 'orange', hex: '#F2994A' },
  { id: 'purple', hex: '#9B51E0' },
  { id: 'pink', hex: '#F06292' },
  { id: 'teal', hex: '#4DB6AC' },
];

// Iconos predefinidos para carpetas
const FOLDER_ICONS: Array<{ id: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'folder', icon: 'folder' },
  { id: 'star', icon: 'star' },
  { id: 'heart', icon: 'heart' },
  { id: 'briefcase', icon: 'briefcase' },
  { id: 'school', icon: 'school' },
  { id: 'camera', icon: 'camera' },
  { id: 'musical-notes', icon: 'musical-notes' },
  { id: 'game-controller', icon: 'game-controller' },
  { id: 'code-slash', icon: 'code-slash' },
  { id: 'airplane', icon: 'airplane' },
  { id: 'fitness', icon: 'fitness' },
  { id: 'restaurant', icon: 'restaurant' },
];

const MOCK_TAGS: MockTag[] = [
  { id: '1', name: 'Personal', color: '#F2C94C' },
  { id: '2', name: 'Trabajo', color: '#5DA9C7' },
  { id: '3', name: 'Importante', color: '#EB5757' },
  { id: '4', name: 'Proyecto', color: '#6FCF97' },
  { id: '5', name: 'Referencia', color: '#F2994A' },
];

export default function FolderCreator({ onSave, currentFolderId }: FolderCreatorProps) {
  const { theme } = useTheme();
  const styles = useFolderCreatorStyles();

  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(FOLDER_COLORS[0]!.id);
  const [selectedIcon, setSelectedIcon] = useState<string>(FOLDER_ICONS[0]!.id);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

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

  const canSave = folderName.trim().length > 0;

  const handleSave = async (): Promise<void> => {
    if (!canSave) return;
    const color = FOLDER_COLORS.find(c => c.id === selectedColor);
    const icon = FOLDER_ICONS.find(i => i.id === selectedIcon);

    await onSave({
      name: folderName.trim(),
      description: description.trim() || undefined,
      color: color ? { hex: color.hex, name: color.id } : undefined,
      icon: icon?.icon,
      tags: Array.from(selectedTags),
      parentId: currentFolderId,
    });
  };

  return (
    <View style={styles.container}>
      {/* Nombre de la carpeta */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={[styles.textInput, nameFocused && styles.textInputFocused]}
          value={folderName}
          onChangeText={setFolderName}
          placeholder="Nombre de la carpeta"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Descripción (opcional)</Text>
        <TextInput
          style={[
            styles.textInput,
            styles.descriptionInput,
            descFocused && styles.textInputFocused,
          ]}
          value={description}
          onChangeText={setDescription}
          placeholder="Añade una descripción..."
          placeholderTextColor={theme.colors.textMuted}
          multiline
          numberOfLines={3}
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
          maxLength={300}
        />
      </View>

      {/* Selector de color */}
      <View style={styles.colorSection}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorList}>
          {FOLDER_COLORS.map(color => (
            <TouchableOpacity
              key={color.id}
              style={[
                styles.colorOption,
                selectedColor === color.id && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color.id)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.colorOptionInner, { backgroundColor: color.hex }]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selector de icono */}
      <View style={styles.iconSection}>
        <Text style={styles.label}>Icono</Text>
        <View style={styles.iconGrid}>
          {FOLDER_ICONS.map(item => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.iconOption,
                selectedIcon === item.id && styles.iconOptionSelected,
              ]}
              onPress={() => setSelectedIcon(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={
                  selectedIcon === item.id
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sección de etiquetas */}
      <View style={styles.tagSection}>
        <Text style={styles.label}>Etiquetas</Text>
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

      {/* Botón guardar */}
      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>Crear carpeta</Text>
      </TouchableOpacity>
    </View>
  );
}
