import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAlert, useServices, useTheme } from "@/providers";
import { useFilePropertyMenuStyles } from "./styles";
import { formatFileSize } from "@/utils/format/bytes";
import { FileModel } from "@/models/file";
import { formatDate, formatVideoDuration, formatAudioDuration } from "@/utils";
import { useLibraryStore } from "@/stores/useLibraryStore";
import { router } from "expo-router";
import { TagCreator } from "../TagCreator";
import { useTagsActions } from "@/hooks/tags/useTagsActions";
import { TagModel } from "@/models";

const FILE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  image: "image-outline",
  video: "videocam-outline",
  audio: "musical-notes-outline",
  document: "document-outline",
  code: "code-slash-outline",
  archive: "file-tray-stacked-outline",
  spreadsheet: "grid-outline",
};

const VISIBILITY_LABELS: Record<string, string> = {
  private: "Privado",
  public: "Público",
  shared: "Compartido",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Activo",
  archived: "Archivado",
  deleted: "Eliminado",
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

export const FilePropertyMenu = ({
  item,
  section,
}: {
  item: FileModel;
  section: "details" | "customize";
}) => {
  const { theme } = useTheme();
  const { services } = useServices();
  const { showAlert } = useAlert();
  const { updateItem } = useLibraryStore();
  const { handleSaveTag } = useTagsActions();
  const styles = useFilePropertyMenuStyles();

  const [fileName, setFileName] = useState(item.name);
  const [file, setFile] = useState(item);
  const [tags, setTags] = useState<TagModel[]>([]);
  const [focused, setFocused] = useState(false);
  const [createTagModalVisible, setCreateTagModalVisible] = useState(false);

  const isRenaming = fileName !== file.name;
  const { metadata } = file;

  useEffect(() => {
    const loadTags = async () => {
      const result = await services.tagService.getTagsByIds(file.tagIds);
      setTags(result ?? []);
    };
    loadTags();
  }, [file.id]);

  const mediaStats = useMemo(() => {
    const rows: InfoRowProps[] = [];
    const { imageMetadata, videoMetadata, audioMetadata } = metadata;

    if (imageMetadata) {
      rows.push({
        label: "Resolución",
        value: `${imageMetadata.width} × ${imageMetadata.height}`,
        icon: "resize-outline",
      });
      if (imageMetadata.orientation) {
        rows.push({
          label: "Orientación",
          value: `${imageMetadata.orientation}°`,
          icon: "phone-portrait-outline",
        });
      }
    }

    if (videoMetadata) {
      rows.push({
        label: "Resolución",
        value: `${videoMetadata.width} × ${videoMetadata.height}`,
        icon: "resize-outline",
      });
      rows.push({
        label: "Duración",
        value: formatVideoDuration(videoMetadata.duration),
        icon: "time-outline",
      });
      if (videoMetadata.framerate) {
        rows.push({
          label: "FPS",
          value: `${videoMetadata.framerate}`,
          icon: "speedometer-outline",
        });
      }
    }

    if (audioMetadata) {
      rows.push({
        label: "Duración",
        value: formatAudioDuration(audioMetadata.duration),
        icon: "time-outline",
      });
      if (audioMetadata.bitrate) {
        rows.push({
          label: "Bitrate",
          value: `${audioMetadata.bitrate} kbps`,
          icon: "pulse-outline",
        });
      }
      if (audioMetadata.sampleRate) {
        rows.push({
          label: "Sample rate",
          value: `${audioMetadata.sampleRate} Hz`,
          icon: "analytics-outline",
        });
      }
    }

    return rows;
  }, [metadata]);

  const handleRenameFile = () => {
    showAlert({
      title: "Renombrar archivo",
      message: `¿Estás seguro de que quieres renombrar el archivo a "${fileName}"?`,
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Renombrar",
          onPress: async () => {
            if (!fileName.trim()) {
              showAlert({
                title: "Error",
                message: "El nombre del archivo no puede estar vacío",
              });
              return;
            }
            const result = await services.fileService.renameFile(
              file.id,
              fileName,
            );
            setFile(result);
            updateItem(result);
          },
        },
      ],
    });
  };

  if (section === "customize") {
    return (
      <View style={styles.container}>
        <View style={styles.placeholderSection}>
          <Ionicons
            name="sparkles-outline"
            size={48}
            color={theme.colors.borderSoft}
          />
          <Text style={styles.placeholderText}>Próximamente</Text>
          <Text style={styles.placeholderSubtext}>
            Personaliza colores, iconos y apariencia
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.nameSection}>
        <View style={styles.fileIconContainer}>
          {(file.category === "video" || file.category === "image") &&
          file.thumbnailUrl ? (
            <Image
              source={{ uri: file.thumbnailUrl }}
              style={{ width: "100%", height: "100%", borderRadius: 4 }}
            />
          ) : (
            <Ionicons
              name={FILE_ICONS[file.category] ?? "document-outline"}
              size={32}
              color={theme.colors.primary}
            />
          )}
        </View>

        <View style={styles.nameInputWrapper}>
          <TextInput
            style={[
              styles.fileNameInput,
              focused && styles.fileNameInputFocused,
            ]}
            value={fileName}
            onBlur={() => setFocused(false)}
            onFocus={() => setFocused(true)}
            onChangeText={setFileName}
            placeholder="Nombre del archivo"
            placeholderTextColor={theme.colors.textMuted}
            selectTextOnFocus
            numberOfLines={1}
            scrollEnabled
            textAlignVertical="center"
          />
          <Text style={styles.extensionBadge}>.{file.extension}</Text>
        </View>

        {isRenaming && (
          <TouchableOpacity
            style={styles.renameButton}
            onPress={handleRenameFile}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Info general */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Información</Text>
        <View style={styles.infoGrid}>
          <InfoRow
            label="Tamaño"
            value={formatFileSize(file.size)}
            icon="cloud-outline"
          />
          <InfoRow label="Tipo" value={file.category} icon="layers-outline" />
          {metadata.mimeType && (
            <InfoRow
              label="MIME"
              value={metadata.mimeType}
              icon="code-outline"
            />
          )}
          <InfoRow
            label="Visibilidad"
            value={VISIBILITY_LABELS[file.visibility] ?? file.visibility}
            icon={
              file.visibility === "private"
                ? "lock-closed-outline"
                : "globe-outline"
            }
          />
          <InfoRow
            label="Estado"
            value={STATUS_LABELS[file.status] ?? file.status}
            icon="radio-button-on-outline"
          />
          <InfoRow
            label="Ubicación"
            value={file.path || "-"}
            icon="folder-outline"
            scrollable={true}
          />
        </View>
      </View>

      {/* Media stats*/}
      {mediaStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Multimedia</Text>
          <View style={styles.infoGrid}>
            {mediaStats.map((row, i) => (
              <InfoRow key={i} {...row} />
            ))}
          </View>
        </View>
      )}

      {/* Fechas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Fechas</Text>
        <View style={styles.infoGrid}>
          <InfoRow
            label="Creado"
            value={formatDate(file.createdAt)}
            icon="calendar-outline"
          />
          <InfoRow
            label="Modificado"
            value={formatDate(file.updatedAt)}
            icon="create-outline"
          />
          {file.accessedAt && (
            <InfoRow
              label="Último acceso"
              value={formatDate(file.accessedAt)}
              icon="eye-outline"
            />
          )}
        </View>
      </View>

      {/* Etiquetas */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Etiquetas</Text>

        {tags.length > 0 ? (
          <View style={styles.tagList}>
            {tags.map((tag) => (
              <View key={tag.id} style={styles.tagChip}>
                <View
                  style={[styles.tagDot, { backgroundColor: tag.color.hex }]}
                />
                <Text style={styles.tagChipText}>{tag.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Sin etiquetas asignadas</Text>
        )}

        <View style={styles.tagActions}>
          <TouchableOpacity
            style={styles.tagButton}
            onPress={() =>
              router.push({
                pathname: "/tag-adder",
                params: { fileIds: file.id },
              })
            }
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="bookmark-plus-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.tagButtonText}>Añadir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tagButton}
            onPress={() => setCreateTagModalVisible(true)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="tag-plus-outline"
              size={20}
              color={theme.colors.textSecondary}
            />
            <Text style={styles.tagButtonText}>Crear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {createTagModalVisible && (
        <TagCreator
          visible={createTagModalVisible}
          onSave={async (data) => {
            const newTag = await handleSaveTag(data);
            setCreateTagModalVisible(false);
            if (newTag) {
              const updatedFile = await services.fileService.addTagsToFile(
                file.id,
                [newTag.id],
              );
              setFile(updatedFile);
              updateItem(updatedFile);
              setTags((prev) => [...prev, newTag]);
            }
          }}
          onClose={() => setCreateTagModalVisible(false)}
        />
      )}
    </View>
  );
};
