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
import { FolderModel } from "@/models";
import { formatDate } from "@/utils";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { useColors } from "@/hooks/useColors";
import { ColorInfo } from "@/types/common/colors";

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

const FOLDER_ICONS: (keyof typeof Ionicons.glyphMap)[] = [
  "folder",
  "star",
  "heart",
  "briefcase",
  "school",
  "camera",
  "musical-notes",
  "game-controller",
  "code-slash",
  "airplane",
  "fitness",
  "home",
  "book",
  "cart",
  "leaf",
  "planet",
];

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
  const { showAlert } = useAlert();
  const { updateItem } = useLibraryStore();
  const styles = useFilePropertyMenuStyles();
  const folderStyles = useFolderPropertyMenuStyles();
  const { colors } = useColors();

  const [folderName, setFolderName] = useState(item.name);
  const [folder, setFolder] = useState(item);
  const [focused, setFocused] = useState(false);
  const [contentCount, setContentCount] = useState<{
    files: number;
    folders: number;
  } | null>(null);

  const isRenaming = folderName !== folder.name;
  const folderColor = folder.color?.hex ?? theme.colors.folderColor;
  const folderIcon = folder.icon ?? "folder";

  useEffect(() => {
    const loadContentCount = async () => {
      const count = await services.folderService.getFolderContentCount(
        folder.id,
      );
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
            const result = await services.folderService.renameFolder(
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

  const handleColorChange = async (color: ColorInfo | undefined) => {
    if (!color) return;

    const updated = await services.folderService.updateFolderColor(
      folder.id,
      color,
    );
    setFolder(updated);
    updateItem(updated);
  };

  const handleIconChange = async (icon: string) => {
    const selectedIcon = icon === folderIcon ? undefined : icon;

    if (!selectedIcon) return;

    const updated = await services.folderService.updateFolderIcon(
      folder.id,
      selectedIcon,
    );
    setFolder(updated);
    updateItem(updated);
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

        {/* Color picker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={folderStyles.colorGrid}>
            {/* Sin color (default) */}
            <TouchableOpacity
              style={[
                folderStyles.colorOption,
                !folder.color && folderStyles.colorOptionSelected,
              ]}
              onPress={() => handleColorChange(undefined)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  folderStyles.colorOptionInner,
                  { backgroundColor: theme.colors.folderColor },
                ]}
              />
            </TouchableOpacity>

            {colors.map((color) => (
              <TouchableOpacity
                key={color.hex}
                style={[
                  folderStyles.colorOption,
                  folder.color?.hex === color.hex &&
                    folderStyles.colorOptionSelected,
                ]}
                onPress={() => handleColorChange(color)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    folderStyles.colorOptionInner,
                    { backgroundColor: color.hex },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Icon picker */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Icono</Text>
          <View style={folderStyles.iconGrid}>
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
          />
        </View>

        {isRenaming && (
          <TouchableOpacity
            style={styles.renameButton}
            onPress={handleRenameFolder}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
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
          {folder.description && (
            <InfoRow
              label="Descripción"
              value={folder.description}
              icon="text-outline"
            />
          )}
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
