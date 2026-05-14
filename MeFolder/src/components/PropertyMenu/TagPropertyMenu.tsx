import React, { useState } from "react";
import { View, Text, TextInput, ScrollView } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons } from "@expo/vector-icons";
import { useAlert, useServices, useTheme } from "@/providers";
import {
  useFilePropertyMenuStyles,
  useFolderPropertyMenuStyles,
} from "./styles";
import { TagModel } from "@/models";
import { formatDate } from "@/utils";
import { useColors } from "@/hooks/useColors";
import { useTagsStore } from "@/stores/useTagsStore";
import { ColorInfo } from "@/types/common/colors";
import { PRIORITY_CONFIG } from "@/types";
import { ColorList } from "../ColorPicker";
import { router } from "expo-router";
import {
  MAX_ITEM_DESCRIPTION_LENGTH,
  MAX_WINDOWS_ITEM_NAME_LENGTH,
} from "@/constants/validation";
import { stripInvalidNameCharacters } from "@/utils/format/name";

const TYPE_LABELS: Record<string, string> = {
  system: "Sistema",
  user: "Usuario",
  automatic: "Automática",
  album: "Álbum",
};

const PRIORITY_LABELS: Record<string, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  critical: "Crítica",
};

type InfoRowProps = {
  label: string;
  value: string;
  icon?: keyof typeof Ionicons.glyphMap;
  scrollable?: boolean;
};

const InfoRow = React.memo(
  ({ label, value, icon, scrollable }: InfoRowProps) => {
    const styles = useFilePropertyMenuStyles();
    const { theme } = useTheme();

    return (
      <View style={styles.infoRow}>
        {icon && (
          <Ionicons name={icon} size={16} color={theme.colors.textMuted} />
        )}
        <Text style={styles.infoLabel}>{label}</Text>
        {scrollable ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            <Text style={styles.infoValue}>{value}</Text>
          </ScrollView>
        ) : (
          <Text style={styles.infoValue}>{value}</Text>
        )}
      </View>
    );
  },
);

export const TagPropertyMenu = ({
  item,
  section,
  onClose,
}: {
  item: TagModel;
  section: "details" | "customize";
  onClose: () => void;
}) => {
  const { theme } = useTheme();
  const { services } = useServices();
  const { showAlert } = useAlert();
  const { updateItem: updateTag, removeItem, removeAlbum } = useTagsStore();
  const styles = useFilePropertyMenuStyles();
  const folderStyles = useFolderPropertyMenuStyles();

  const [tagName, setTagName] = useState(item.name);
  const [tagDescription, setTagDescription] = useState(item.description ?? "");
  const [tag, setTag] = useState(item);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(
    item.color ?? null,
  );
  const [focused, setFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);

  const {
    colors,
    showColorPicker,
    setShowColorPicker,
    handleSaveColor,
    handleDeleteColor,
  } = useColors();

  const isSystemTag = tag.isSystemTag();
  const isRenaming = tagName !== tag.name;
  const isEditingDescription = tagDescription !== (tag.description ?? "");
  const tagColor = tag.color?.hex ?? theme.colors.primary;

  const handleRenameTag = () => {
    showAlert({
      title: "Renombrar etiqueta",
      message: `¿Renombrar la etiqueta a "${tagName}"?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Renombrar",
          onPress: async () => {
            if (!tagName.trim()) {
              showAlert({
                title: "Error",
                message: "El nombre no puede estar vacío",
              });
              return;
            }

            if (isSystemTag) {
              showAlert({
                title: "Error",
                message: "No se puede renombrar una etiqueta del sistema",
              });
              return;
            }
            const result = await services.tagService.renameTag(tag.id, tagName);
            setTag(result);
            updateTag(result);
          },
        },
      ],
    });
  };

  const handleColorChange = async (color: ColorInfo) => {
    try {
      if (!color) return;

      const updated = await services.tagService.updateTagColor(tag.id, color);
      setTag(updated);
      setSelectedColor(updated.color ?? color);
      updateTag(updated);
    } catch (error) {
      console.error("Error actualizando color de carpeta:", error);
      showAlert({
        title: "Error",
        message: "No se pudo actualizar el color de la carpeta",
      });
    }
  };

  const handleSavePickerColor = async (color: ColorInfo) => {
    await handleSaveColor(color);
    await handleColorChange(color);
  };

  const handleUpdateDescription = async () => {
    try {
      const description = tagDescription.trim();

      if (description.length > MAX_ITEM_DESCRIPTION_LENGTH) {
        showAlert({
          title: "Error",
          message: `No se puede crear o modificar la descripción si supera los ${MAX_ITEM_DESCRIPTION_LENGTH} caracteres.`,
        });
        return;
      }

      const updated = await services.tagService.updateTagDescription(
        tag.id,
        description,
      );
      setTag(updated);
      setTagDescription(updated.description ?? "");
      updateTag(updated);
    } catch (error) {
      console.error("Error actualizando descripción del tag:", error);
      showAlert({
        title: "Error",
        message: "No se pudo actualizar la descripción",
      });
    }
  };

  const handleDeleteTag = () => {
    showAlert({
      title: tag.isAlbum() ? "Eliminar álbum" : "Eliminar etiqueta",
      message: tag.isAlbum()
        ? `Se eliminará el álbum \"${tag.name}\". Sus archivos no se borrarán.`
        : `Se eliminará la etiqueta \"${tag.name}\".`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await services.tagService.deleteTag(tag.id);

              if (tag.isAlbum()) {
                removeAlbum(tag.id);
              } else {
                removeItem(tag.id);
              }

              onClose();
              router.back();
            } catch (error) {
              showAlert({
                title: "Error",
                message:
                  error instanceof Error
                    ? error.message
                    : "No se pudo eliminar el elemento.",
              });
            }
          },
        },
      ],
    });
  };

  if (section === "customize") {
    return (
      <View style={styles.container}>
        {/* Preview */}
        <View style={folderStyles.previewContainer}>
          <View
            style={[
              folderStyles.previewIcon,
              { backgroundColor: tagColor + "20" },
            ]}
          >
            <Ionicons name="pricetag" size={48} color={tagColor} />
          </View>
          <Text style={folderStyles.previewName}>{tag.name}</Text>
        </View>

        <View style={folderStyles.colorSection}>
          <Text style={folderStyles.label}>Color</Text>
          <ColorList
            colors={colors}
            selectedColor={selectedColor}
            onSelect={handleColorChange}
            onAddColor={() => setShowColorPicker(true)}
            showPicker={showColorPicker}
            onClosePicker={() => setShowColorPicker(false)}
            onSavePickerColor={handleSavePickerColor}
            onDeletePickerColor={handleDeleteColor}
          />
        </View>
      </View>
    );
  }

  const priorityConfig =
    PRIORITY_CONFIG[tag.priority as keyof typeof PRIORITY_CONFIG];

  return (
    <View style={styles.container}>
      {/* Header: icono + nombre editable */}
      <View style={styles.nameSection}>
        <View
          style={[
            styles.fileIconContainer,
            { backgroundColor: tagColor + "20" },
          ]}
        >
          <Ionicons name="pricetag" size={28} color={tagColor} />
        </View>

        <View style={styles.nameInputWrapper}>
          <TextInput
            style={[
              styles.fileNameInput,
              focused && styles.fileNameInputFocused,
              isSystemTag && { opacity: 0.7 },
            ]}
            value={tagName}
            onBlur={() => setFocused(false)}
            onFocus={() => setFocused(true)}
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
            selectTextOnFocus
            numberOfLines={1}
            scrollEnabled
            textAlignVertical="center"
            editable={!isSystemTag}
            maxLength={MAX_WINDOWS_ITEM_NAME_LENGTH}
          />
        </View>

        {isRenaming && !isSystemTag && (
          <TouchableOpacity
            style={styles.renameButton}
            onPress={handleRenameTag}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Descripción */}
      <View style={styles.card}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={styles.sectionTitle}>Descripción</Text>
          {isEditingDescription && (
            <TouchableOpacity
              onPress={handleUpdateDescription}
              activeOpacity={0.7}
            >
              <Ionicons
                name="checkmark"
                size={20}
                color={theme.colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
        <TextInput
          style={[
            folderStyles.textInput,
            folderStyles.descriptionInput,
            descFocused && folderStyles.textInputFocused,
          ]}
          value={tagDescription}
          onChangeText={setTagDescription}
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
          placeholder="Sin descripción"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          maxLength={MAX_ITEM_DESCRIPTION_LENGTH}
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      {/* Información */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.infoGrid}>
          <InfoRow
            label="Tipo"
            value={TYPE_LABELS[tag.type] ?? tag.type}
            icon="pricetag-outline"
          />
          <InfoRow
            label="Prioridad"
            value={PRIORITY_LABELS[tag.priority] ?? tag.priority}
            icon="flag-outline"
          />
          <InfoRow
            label="Archivos asociados"
            value={`${tag.usageCount}`}
            icon="document-outline"
          />
        </View>
      </View>

      {/* Atributos */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Atributos</Text>
        <View style={folderStyles.attributeRow}>
          <View
            style={[
              folderStyles.attributeBadge,
              tag.isFavorite && folderStyles.attributeBadgeActive,
            ]}
          >
            <Ionicons
              name={tag.isFavorite ? "star" : "star-outline"}
              size={16}
              color={
                tag.isFavorite ? theme.colors.primary : theme.colors.textMuted
              }
            />
            <Text
              style={[
                folderStyles.attributeText,
                tag.isFavorite && folderStyles.attributeTextActive,
              ]}
            >
              Favorita
            </Text>
          </View>

          <View
            style={[
              folderStyles.attributeBadge,
              tag.type === "album" && folderStyles.attributeBadgeActive,
            ]}
          >
            <Ionicons
              name={tag.type === "album" ? "albums" : "albums-outline"}
              size={16}
              color={
                tag.type === "album"
                  ? theme.colors.primary
                  : theme.colors.textMuted
              }
            />
            <Text
              style={[
                folderStyles.attributeText,
                tag.type === "album" && folderStyles.attributeTextActive,
              ]}
            >
              Álbum
            </Text>
          </View>

          <View
            style={[
              folderStyles.attributeBadge,
              tag.isActive && folderStyles.attributeBadgeActive,
            ]}
          >
            <Ionicons
              name={
                tag.isActive ? "checkmark-circle" : "checkmark-circle-outline"
              }
              size={16}
              color={
                tag.isActive ? theme.colors.primary : theme.colors.textMuted
              }
            />
            <Text
              style={[
                folderStyles.attributeText,
                tag.isActive && folderStyles.attributeTextActive,
              ]}
            >
              Activa
            </Text>
          </View>

          {priorityConfig && (
            <View
              style={[
                folderStyles.attributeBadge,
                { backgroundColor: priorityConfig.bg },
              ]}
            >
              <Ionicons name="flag" size={16} color={priorityConfig.color} />
              <Text
                style={[
                  folderStyles.attributeText,
                  { color: priorityConfig.color },
                ]}
              >
                {priorityConfig.label}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Fechas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fechas</Text>
        <View style={styles.infoGrid}>
          <InfoRow
            label="Creada"
            value={formatDate(tag.createdAt)}
            icon="calendar-outline"
          />
          <InfoRow
            label="Modificada"
            value={formatDate(tag.updatedAt)}
            icon="create-outline"
          />
        </View>
      </View>

      {!isSystemTag && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          <View style={styles.tagActions}>
            <TouchableOpacity
              style={[
                styles.tagButton,
                {
                  borderColor: theme.colors.error,
                  backgroundColor: theme.colors.errorSoft,
                },
              ]}
              onPress={handleDeleteTag}
              activeOpacity={0.7}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.colors.error}
              />
              <Text
                style={[styles.tagButtonText, { color: theme.colors.error }]}
              >
                {tag.isAlbum() ? "Eliminar álbum" : "Eliminar etiqueta"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};
