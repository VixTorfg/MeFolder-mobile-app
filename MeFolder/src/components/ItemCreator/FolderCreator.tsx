import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAlert, useServices, useTheme } from '@/providers';
import { useFolderCreatorStyles } from './styles';
import { ColorInfo } from '@/types/common/colors';
import { SYSTEM_COLORS } from '@/constants/themes/colors';
import { ColorPicker } from '@/components/ColorPicker';

interface MockTag {
  id: string;
  name: string;
  color: string;
}

export interface NewFolder {
  name: string;
  description: string | null;
  color: ColorInfo;
  icon: keyof typeof Ionicons.glyphMap | undefined ;
  tags: string[];
  parentId: string;
}

interface FolderCreatorProps {
  onSave: (data: NewFolder) => Promise<void> | void;
  currentFolderId?: string;
}

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
  { id: 'add', icon: 'add' },
];

const MOCK_TAGS: MockTag[] = [
  { id: '1', name: 'Personal', color: '#F2C94C' },
  { id: '2', name: 'Trabajo', color: '#5DA9C7' },
  { id: '3', name: 'Importante', color: '#EB5757' },
  { id: '4', name: 'Proyecto', color: '#6FCF97' },
  { id: '5', name: 'Referencia', color: '#F2994A' },
];

function sortColors(colors: ColorInfo[]): ColorInfo[] {
  return colors.sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return 0;
  });
}

export default function FolderCreator({ onSave, currentFolderId }: FolderCreatorProps) {
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const { services: { userColorService } } = useServices();
  const styles = useFolderCreatorStyles();

  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState<ColorInfo>(SYSTEM_COLORS['yellow']);
  const [selectedIcon, setSelectedIcon] = useState<string>(FOLDER_ICONS[0]!.id);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colors, setColors] = useState<ColorInfo[] | []>(SYSTEM_COLORS ? Object.values(SYSTEM_COLORS) : []);

  useEffect(() => {
    async function loadUserColors() {
      if(!userColorService) return;
      try {
        const userColors = await userColorService.getAllColors();

        const allColors = [...colors, ...userColors];
        const sortedColors = sortColors(allColors);

        setColors(sortedColors);
      } catch (error) {
        console.error('Error loading user colors:', error);
        showAlert({ title: 'Error', message: 'No se pudieron cargar los colores personalizados. Inténtalo de nuevo.' });
      }
    }

    loadUserColors();
  }, [userColorService]);

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
    if (!canSave) return
    
    const color = selectedColor
    const icon = FOLDER_ICONS.find(i => i.id === selectedIcon);

    await onSave({
      name: folderName.trim(),
      description: description.trim() || null,
      color: color || SYSTEM_COLORS['yellow'], 
      icon: icon?.icon,
      tags: Array.from(selectedTags),
      parentId: currentFolderId ?? '',
    });
  };

  const handleSelectIcon = (iconId: string): void => {
    if (iconId === 'add') {
      Alert.alert('Icono personalizado', 'Funcionalidad de icono personalizado no implementada en esta demo.');
      return;
    }
    setSelectedIcon(iconId);
  }

  const handleSaveColor = async (data: ColorInfo): Promise<void> => {
    try
    {
      if(!userColorService) return;

      await userColorService.createColor(data);
        
      setColors(prev => [...prev, data]);
      setSelectedColor(data);
      setShowColorPicker(false);
        
    }catch(error){
      showAlert({ title: 'Error', message: 'No se pudo guardar el color personalizado. Inténtalo de nuevo.' });
      return;
    }
  }

  return (
    <View style={styles.container}>
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

      <View style={styles.colorSection}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.colorList}>
          {colors.map((color, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.colorOption,
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.colorOptionInner, { backgroundColor: color.hex }]}
              />
              {color.isFavorite && (
                <Ionicons
                  name="star"
                  size={16}
                  color={theme.colors.primary}
                  style={{ position: 'absolute', top: 20, right: 0 }}
                />
              )}
            </TouchableOpacity>
          ))}
          
          {/* Opción para agregar color personalizado */}
          <TouchableOpacity
            style={styles.colorOption}
            onPress={() => setShowColorPicker(true)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.colorOptionInner,
                {
                  borderWidth: 1.5,
                  borderColor: theme.colors.borderSoft,
                  borderStyle: 'dashed',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
              ]}
            >
              <Ionicons name="add" size={18} color={theme.colors.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>
      </View>

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
              onPress={() => handleSelectIcon(item.id)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={
                  selectedIcon === item.id
                    ? theme.colors.primary
                    : (item.id === 'add' 
                      ? theme.colors.warning
                      : theme.colors.textSecondary)
                }
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

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

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>Crear carpeta</Text>
      </TouchableOpacity>

      <ColorPicker
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        onSave={async (data) => await handleSaveColor(data)}
      />
    </View>
  );
}
