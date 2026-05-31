import React, { useState } from "react";
import { View, Text, TextInput } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAlert, useTheme } from "@/providers";
import { useColors } from "@/hooks";
import { useTagCreatorFormStyles } from "./styles";
import type { TagType, TagPriority } from "@/types/entities/tag";
import type { ColorInfo } from "@/types/common/colors";
import { ToggleAlbum, ToggleFavourite, PrioritySelector } from "../Toggles";
import { ColorList } from "@/components/ColorPicker";
import { TagPreview } from "./TagPreview";
import {
  MAX_ITEM_DESCRIPTION_LENGTH,
  MAX_WINDOWS_ITEM_NAME_LENGTH,
} from "@/constants/validation";
import { stripInvalidNameCharacters } from "@/utils/format/name";

export type AlbumCreationMode = "empty";

export interface NewTag {
  name: string;
  description: string | null;
  color: ColorInfo;
  type: TagType;
  priority: TagPriority;
  isFavorite: boolean;
  albumCreationMode: AlbumCreationMode;
}

interface TagCreatorFormProps {
  onSave: (data: NewTag) => Promise<void> | void;
  onImportZipAlbum?: () => Promise<void> | void;
}

export default function TagCreatorForm({
  onSave,
  onImportZipAlbum,
}: TagCreatorFormProps) {
  const { theme } = useTheme();
  const { showAlert } = useAlert();
  const styles = useTagCreatorFormStyles();
  const {
    colors,
    selectedColor,
    showColorPicker,
    setSelectedColor,
    setShowColorPicker,
    handleSaveColor,
    handleDeleteColor,
  } = useColors();

  const [tagName, setTagName] = useState("");
  const [description, setDescription] = useState("");
  const [isAlbum, setIsAlbum] = useState(false);
  const [albumCreationMode, setAlbumCreationMode] =
    useState<AlbumCreationMode>("empty");
  const [isFavorite, setIsFavorite] = useState(false);
  const [priority, setPriority] = useState<TagPriority>("normal");
  const [nameFocused, setNameFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const canSave = tagName.trim().length > 0;

  const handleSave = async (): Promise<void> => {
    if (!canSave) return;

    const trimmedDescription = description.trim();

    if (trimmedDescription.length > MAX_ITEM_DESCRIPTION_LENGTH) {
      showAlert({
        title: "Descripción demasiado larga",
        message: `No se puede crear o modificar la descripción si supera los ${MAX_ITEM_DESCRIPTION_LENGTH} caracteres.`,
      });
      return;
    }

    await onSave({
      name: tagName.trim(),
      description: trimmedDescription || null,
      color: selectedColor,
      type: isAlbum ? "album" : "user",
      priority,
      isFavorite,
      albumCreationMode: isAlbum ? albumCreationMode : "empty",
    });
  };

  const handleToggleAlbum = (): void => {
    setIsAlbum((prev) => {
      const next = !prev;

      if (!next) {
        setAlbumCreationMode("empty");
      }

      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.importRow}>
        <Text style={styles.label}>Importar álbum</Text>
        <TouchableOpacity
          style={styles.importIconButton}
          onPress={() => {
            void onImportZipAlbum?.();
          }}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Importar álbum desde ZIP"
        >
          <MaterialCommunityIcons
            name="archive-arrow-up-outline"
            size={20}
            color={styles.importIconColor.color}
          />
        </TouchableOpacity>
      </View>

      {/* Nombre */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre</Text>
        <View style={styles.nameInputAndPreview}>
          <TextInput
            style={[
              styles.textInput,
              styles.nameInput,
              nameFocused && styles.textInputFocused,
            ]}
            value={tagName}
            onChangeText={(text) =>
              setTagName(
                stripInvalidNameCharacters(text).slice(
                  0,
                  MAX_WINDOWS_ITEM_NAME_LENGTH,
                ),
              )
            }
            placeholder="Nombre de la etiqueta"
            placeholderTextColor={theme.colors.textMuted}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
            maxLength={MAX_WINDOWS_ITEM_NAME_LENGTH}
          />
          <View style={styles.namePreview}>
            <TagPreview
              name={tagName}
              color={selectedColor}
              isAlbum={isAlbum}
              isFavorite={isFavorite}
            />
          </View>
        </View>
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
          maxLength={MAX_ITEM_DESCRIPTION_LENGTH}
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
          onDeletePickerColor={handleDeleteColor}
        />
      </View>

      <View style={styles.optionsSection}>
        <Text style={styles.label}>Prioridad</Text>
        <PrioritySelector selected={priority} onSelect={setPriority} />
      </View>

      <View style={styles.optionsSection}>
        <Text style={styles.label}>Opciones</Text>
        <ToggleAlbum onToggle={handleToggleAlbum} isActive={isAlbum} />
        <ToggleFavourite
          onToggle={() => setIsFavorite(!isFavorite)}
          isActive={isFavorite}
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>
          {isAlbum ? "Crear álbum" : "Crear etiqueta"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
