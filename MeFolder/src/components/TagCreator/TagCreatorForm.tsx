import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/providers';
import { useColors } from '@/hooks';
import { useTagCreatorFormStyles } from './styles';
import type { TagType, TagPriority } from '@/types/entities/tag';
import type { ColorInfo } from '@/types/common/colors';
import { ToggleAlbum, ToggleFavourite, PrioritySelector } from '../Toggles';
import { ColorList } from '@/components/ColorPicker';

export interface NewTag {
  name: string;
  description: string | null;
  color: ColorInfo;
  type: TagType;
  priority: TagPriority;
  isFavorite: boolean;
}

interface TagCreatorFormProps {
  onSave: (data: NewTag) => Promise<void> | void;
}

export default function TagCreatorForm({ onSave }: TagCreatorFormProps) {
  const { theme } = useTheme();
  const styles = useTagCreatorFormStyles();
  const { colors, selectedColor, showColorPicker, setSelectedColor, setShowColorPicker, handleSaveColor } = useColors();

  const [tagName, setTagName] = useState('');
  const [description, setDescription] = useState('');
  const [isAlbum, setIsAlbum] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [priority, setPriority] = useState<TagPriority>('normal');
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const canSave = tagName.trim().length > 0;

  const handleSave = async (): Promise<void> => {
    if (!canSave) return;

    await onSave({
      name: tagName.trim(),
      description: description.trim() || null,
      color: selectedColor,
      type: isAlbum ? 'album' : 'user',
      priority,
      isFavorite,
    });
  };



  return (
    <View style={styles.container}>
      {/* Nombre */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={[styles.textInput, nameFocused && styles.textInputFocused]}
          value={tagName}
          onChangeText={setTagName}
          placeholder="Nombre de la etiqueta"
          placeholderTextColor={theme.colors.textMuted}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          maxLength={50}
        />
      </View>

      {/* Descripción */}
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
        <ColorList
            colors={colors}
            selectedColor={selectedColor}
            onSelect={setSelectedColor}
            onAddColor={() => setShowColorPicker(true)}
            showPicker={showColorPicker}
            onClosePicker={() => setShowColorPicker(false)}
            onSavePickerColor={handleSaveColor}
        />
    </View>

      <View style={styles.optionsSection}>
        <Text style={styles.label}>Prioridad</Text>
        <PrioritySelector selected={priority} onSelect={setPriority} />
      </View>

      <View style={styles.optionsSection}>
        <Text style={styles.label}>Opciones</Text>
        <ToggleAlbum onToggle={() => setIsAlbum(!isAlbum)} isActive={isAlbum} />
        <ToggleFavourite onToggle={() => setIsFavorite(!isFavorite)} isActive={isFavorite} />
      </View>

      {/* Preview */}
      <View style={styles.previewSection}>
        <Text style={styles.label}>Vista previa</Text>
        <View style={styles.previewContainer}>
          <View style={[styles.previewTag, { borderColor: selectedColor.hex }]}>
            <View style={[styles.previewDot, { backgroundColor: selectedColor.hex }]} />
            <Text style={styles.previewTagText}>
              {tagName.trim() || 'Etiqueta'}
            </Text>
            {isAlbum && (
              <Ionicons name="albums" size={14} color={theme.colors.textSecondary} />
            )}
            {isFavorite && (
              <Ionicons name="star" size={14} color={theme.colors.primary} />
            )}
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>Crear etiqueta</Text>
      </TouchableOpacity>
    </View>
  );
}
