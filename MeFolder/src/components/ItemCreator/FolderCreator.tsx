import React, { useState } from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers";
import { useColors } from "@/hooks";
import { useFolderCreatorStyles } from "./styles";
import { SYSTEM_COLORS } from "@/constants/themes/colors";
import { FOLDER_ICONS } from "@/constants/folderIcons";
import { ColorList } from "@/components/ColorPicker/ColorList";
import type { ColorInfo } from "@/types/common/colors";

export interface NewFolder {
  name: string;
  description: string | null;
  color: ColorInfo;
  icon: keyof typeof Ionicons.glyphMap | undefined;
  parentId: string;
}

interface FolderCreatorProps {
  onSave: (data: NewFolder) => Promise<void> | void;
  currentFolderId?: string;
}

export default function FolderCreator({
  onSave,
  currentFolderId,
}: FolderCreatorProps) {
  const { theme } = useTheme();
  const styles = useFolderCreatorStyles();
  const {
    colors,
    selectedColor,
    showColorPicker,
    setSelectedColor,
    setShowColorPicker,
    handleSaveColor,
  } = useColors();

  const [folderName, setFolderName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<
    keyof typeof Ionicons.glyphMap
  >(FOLDER_ICONS[0]!);
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const canSave = folderName.trim().length > 0;

  const handleSave = async (): Promise<void> => {
    if (!canSave) return;

    const color = selectedColor;

    await onSave({
      name: folderName.trim(),
      description: description.trim() || null,
      color: color || SYSTEM_COLORS["yellow"],
      icon: selectedIcon,
      parentId: currentFolderId ?? "",
    });
  };

  const handleSelectIcon = (
    icon: keyof typeof Ionicons.glyphMap,
  ): void => {
    setSelectedIcon(icon);
  };

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

      <View style={styles.iconSection}>
        <Text style={styles.label}>Icono</Text>
        <View style={styles.iconGridWrapper}>
          <View style={styles.iconGrid}>
            {FOLDER_ICONS.map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconOption,
                selectedIcon === icon && styles.iconOptionSelected,
              ]}
              onPress={() => handleSelectIcon(icon)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={icon}
                size={24}
                color={
                  selectedIcon === icon
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            </TouchableOpacity>
            ))}
          </View>
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
    </View>
  );
}
