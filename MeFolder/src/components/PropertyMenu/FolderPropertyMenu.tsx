import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAlert, useServices, useTheme } from "@/providers";
import {
  useFilePropertyMenuStyles,
  useFolderPropertyMenuStyles,
} from "./styles";
import { FOLDER_ICONS } from "@/constants/folderIcons";
import { FolderModel } from "@/models";
import { formatDate } from "@/utils";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useColors } from "@/hooks/useColors";
import { ColorInfo } from "@/types/common/colors";
import { ColorList } from "../ColorPicker";

const VISIBILITY_LABELS: Record<string, string> = {
  private: "Privado",
  public: "Público",
  shared: "Compartido",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activa",
  archived: "Archivada",
  deleted: "Eliminada",
};

const TYPE_LABELS: Record<string, string> = {
  regular: "Regular",
  system: "Sistema",
  shared: "Compartida",
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

export const FolderPropertyMenu = ({
  item,
  section,
}: {
  item: FolderModel;
  section: "details" | "customize";
}) => {
  const { theme } = useTheme();
  const { services } = useServices();
  const folderService = services.folderService;
  const { showAlert } = useAlert();
  const { updateItem } = useLibraryStore();
  const styles = useFilePropertyMenuStyles();
  const folderStyles = useFolderPropertyMenuStyles();
  const {
    colors,
    showColorPicker,
    setShowColorPicker,
    handleSaveColor,
    handleDeleteColor,
  } = useColors();

  const [folderName, setFolderName] = useState(item.name);
  const [folderDescription, setFolderDescription] = useState(
    item.description ?? "",
  );
  const [folder, setFolder] = useState(item);
  const [selectedColor, setSelectedColor] = useState<ColorInfo | null>(
    item.color ?? null,
  );
  const [focused, setFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [contentCount, setContentCount] = useState<{
    files: number;
    folders: number;
  } | null>(null);

  useEffect(() => {
    setFolder(item);
    setFolderName(item.name);
    setFolderDescription(item.description ?? "");
    setSelectedColor(item.color ?? null);
  }, [item]);

  const isSystemFolder = folder.isSystemFolder;
  const isRenaming = folderName !== folder.name;
  const isEditingDescription = folderDescription !== (folder.description ?? "");
  const folderColor = folder.color?.hex ?? theme.colors.folderColor;
  const folderIcon = folder.icon ?? "folder";

  useEffect(() => {
    const loadContentCount = async () => {
      const count = await folderService.getFolderContentCount(folder.id);
      setContentCount(count);
    };
    loadContentCount();
  }, [folder.id]);

  const handleRenameFolder = () => {
    showAlert({
      title: "Renombrar carpeta",
      message: `¿Renombrar la carpeta a "${folderName}"?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Renombrar",
          onPress: async () => {
            if (!folderName.trim()) {
              showAlert({
                title: "Error",
                message: "El nombre no puede estar vacío",
              });
              return;
            }

            if (isSystemFolder) {
              showAlert({
                title: "Error",
                message: "No se puede modificar una carpeta del sistema",
              });
              return;
            }

            const result = await folderService.renameFolder(
              folder.id,
              folderName,
            );
            setFolder(result);
            updateItem(result);
          },
        },
      ],
    });
  };

  const handleColorChange = async (color: ColorInfo) => {
    try {
      setSelectedColor(color);

      const updated = await folderService.updateFolderColor(folder.id, color);
      setFolder(updated);
      setSelectedColor(updated.color ?? color);
      updateItem(updated);
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

  const handleIconChange = async (icon: string) => {
    const selectedIcon = icon === folderIcon ? undefined : icon;

    if (!selectedIcon) return;

    const updated = await folderService.updateFolderIcon(
      folder.id,
      selectedIcon,
    );
    setFolder(updated);
    updateItem(updated);
  };

  const handleUpdateDescription = async () => {
    try {
      const description = folderDescription.trim();
      if (description?.length > 200) {
        showAlert({
          title: "Error",
          message: "La descripción no puede exceder los 200 caracteres",
        });
        return;
      }
      const updated = await folderService.updateFolderDescription(
        folder.id,
        description,
      );
      setFolder(updated);
      setFolderDescription(updated.description ?? "");
      updateItem(updated);
    } catch (error) {
      console.error("Error actualizando descripción de carpeta:", error);
      showAlert({
        title: "Error",
        message: "No se pudo actualizar la descripción",
      });
    }
  };

  if (section === "customize") {
    return (
      <View style={styles.container}>
        {/* Preview */}
        <View style={folderStyles.previewContainer}>
          <View
            style={[
              folderStyles.previewIcon,
              { backgroundColor: folderColor + "20" },
            ]}
          >
            <Ionicons
              name={folderIcon as keyof typeof Ionicons.glyphMap}
              size={48}
              color={folderColor}
            />
          </View>
          <Text style={folderStyles.previewName}>{folder.name}</Text>
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

        {/* Icon picker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Icono</Text>

          <View style={folderStyles.iconGridWrapper}>
            <View style={[folderStyles.iconGrid]}>
              {FOLDER_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    folderStyles.iconOption,
                    folderIcon === icon && folderStyles.iconOptionSelected,
                  ]}
                  onPress={() => handleIconChange(icon)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={icon}
                    size={24}
                    color={
                      folderIcon === icon
                        ? theme.colors.primary
                        : theme.colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header: icono + nombre editable */}
      <View style={styles.nameSection}>
        <View
          style={[
            styles.fileIconContainer,
            { backgroundColor: folderColor + "20" },
          ]}
        >
          <Ionicons
            name={folderIcon as keyof typeof Ionicons.glyphMap}
            size={28}
            color={folderColor}
          />
        </View>

        <View style={styles.nameInputWrapper}>
          <TextInput
            style={[
              styles.fileNameInput,
              focused && styles.fileNameInputFocused,
              isSystemFolder && { opacity: 0.7 },
            ]}
            value={folderName}
            onBlur={() => setFocused(false)}
            onFocus={() => setFocused(true)}
            onChangeText={setFolderName}
            placeholder="Nombre de la carpeta"
            placeholderTextColor={theme.colors.textMuted}
            selectTextOnFocus
            numberOfLines={1}
            scrollEnabled
            textAlignVertical="center"
            editable={!isSystemFolder}
          />
        </View>

        {isRenaming && !isSystemFolder && (
          <TouchableOpacity
            style={styles.renameButton}
            onPress={handleRenameFolder}
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
          value={folderDescription}
          onChangeText={setFolderDescription}
          onFocus={() => setDescFocused(true)}
          onBlur={() => setDescFocused(false)}
          placeholder="Sin descripción"
          placeholderTextColor={theme.colors.textMuted}
          multiline
          numberOfLines={3}
          maxLength={200}
          textAlignVertical="top"
        />
      </View>

      {/* Información */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.infoGrid}>
          <InfoRow
            label="Tipo"
            value={TYPE_LABELS[folder.type] ?? folder.type}
            icon="folder-outline"
          />
          <InfoRow
            label="Visibilidad"
            value={VISIBILITY_LABELS[folder.visibility] ?? folder.visibility}
            icon={
              folder.visibility === "private"
                ? "lock-closed-outline"
                : "globe-outline"
            }
          />
          <InfoRow
            label="Estado"
            value={STATUS_LABELS[folder.status] ?? folder.status}
            icon="radio-button-on-outline"
          />
          <InfoRow
            label="Nivel"
            value={`${folder.level}`}
            icon="layers-outline"
          />
          <InfoRow
            label="Ubicación"
            value={folder.path || "-"}
            icon="navigate-outline"
            scrollable={true}
          />
        </View>
      </View>

      {/* Contenido */}
      {contentCount && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contenido</Text>
          <View style={styles.infoGrid}>
            <InfoRow
              label="Carpetas"
              value={`${contentCount.folders}`}
              icon="folder-outline"
            />
            <InfoRow
              label="Archivos"
              value={`${contentCount.files}`}
              icon="document-outline"
            />
            <InfoRow
              label="Total"
              value={`${contentCount.files + contentCount.folders} elementos`}
              icon="grid-outline"
            />
          </View>
        </View>
      )}

      {/* Fechas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fechas</Text>
        <View style={styles.infoGrid}>
          <InfoRow
            label="Creada"
            value={formatDate(folder.createdAt)}
            icon="calendar-outline"
          />
          <InfoRow
            label="Modificada"
            value={formatDate(folder.updatedAt)}
            icon="create-outline"
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
              folder.isFavorite && folderStyles.attributeBadgeActive,
            ]}
          >
            <Ionicons
              name={folder.isFavorite ? "star" : "star-outline"}
              size={16}
              color={
                folder.isFavorite
                  ? theme.colors.primary
                  : theme.colors.textMuted
              }
            />
            <Text
              style={[
                folderStyles.attributeText,
                folder.isFavorite && folderStyles.attributeTextActive,
              ]}
            >
              Favorita
            </Text>
          </View>

          <View
            style={[
              folderStyles.attributeBadge,
              folder.isProtected && folderStyles.attributeBadgeActive,
            ]}
          >
            <Ionicons
              name={folder.isProtected ? "shield" : "shield-outline"}
              size={16}
              color={
                folder.isProtected
                  ? theme.colors.primary
                  : theme.colors.textMuted
              }
            />
            <Text
              style={[
                folderStyles.attributeText,
                folder.isProtected && folderStyles.attributeTextActive,
              ]}
            >
              Protegida
            </Text>
          </View>

          {folder.isSystemFolder && (
            <View
              style={[
                folderStyles.attributeBadge,
                folderStyles.attributeBadgeActive,
              ]}
            >
              <Ionicons name="cog" size={16} color={theme.colors.primary} />
              <Text
                style={[
                  folderStyles.attributeText,
                  folderStyles.attributeTextActive,
                ]}
              >
                Sistema
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
