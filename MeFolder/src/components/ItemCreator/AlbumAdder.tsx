import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers";
import { useAlbumAdderStyles } from "./styles";
import { useServices } from "@/providers";
import { FileModel } from "@/models/file";
import { Image } from "expo-image";

export type AlbumAdderResult = {
  fileIds: string[];
  albumId: string;
};

interface AlbumAdderProps {
  albumId: string;
  onSave: (data: AlbumAdderResult) => Promise<void> | void;
}

export default function AlbumAdder({ albumId, onSave }: AlbumAdderProps) {
  const { theme } = useTheme();
  const styles = useAlbumAdderStyles();
  const { services } = useServices();
  const fileService = services?.fileService;

  const [files, setFiles] = useState<FileModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMediaFiles = async () => {
      if (!fileService) return;
      setLoading(true);
      try {
        const [images, videos] = await Promise.all([
          fileService.getFilesByCategory("image"),
          fileService.getFilesByCategory("video"),
        ]);
        setFiles([...images, ...videos]);
      } catch {
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    loadMediaFiles();
  }, [fileService]);

  const toggleFile = useCallback((fileId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }, []);

  const handleSave = async () => {
    if (selectedIds.size === 0) return;
    await onSave({
      fileIds: Array.from(selectedIds),
      albumId,
    });
  };

  const canSave = selectedIds.size > 0;

  const renderFileItem = useCallback(
    ({ item }: { item: FileModel }) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <TouchableOpacity
          style={[styles.fileItem, isSelected && styles.fileItemSelected]}
          onPress={() => toggleFile(item.id)}
          activeOpacity={0.7}
        >
          {item.thumbnailUrl ? (
            <Image
              source={{ uri: item.thumbnailUrl }}
              style={styles.fileThumbnail}
              contentFit="cover"
              transition={150}
            />
          ) : (
            <View style={styles.filePlaceholder}>
              <Ionicons
                name={
                  item.category === "video"
                    ? "videocam-outline"
                    : "image-outline"
                }
                size={24}
                color={theme.colors.textSecondary}
              />
            </View>
          )}

          {isSelected && (
            <View style={styles.selectedOverlay}>
              <Ionicons
                name="checkmark-circle"
                size={28}
                color={theme.colors.primary}
              />
            </View>
          )}

          <Text style={styles.fileName} numberOfLines={1}>
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [selectedIds, toggleFile, styles, theme],
  );

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>Cargando archivos...</Text>
      </View>
    );
  }

  if (files.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons
          name="images-outline"
          size={48}
          color={theme.colors.textMuted}
        />
        <Text style={styles.emptyStateText}>
          No hay imágenes ni vídeos disponibles
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>
        Selecciona archivos para añadir al álbum
      </Text>

      <FlatList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
      />

      {canSave && (
        <Text style={styles.selectionCount}>
          {selectedIds.size}{" "}
          {selectedIds.size === 1
            ? "archivo seleccionado"
            : "archivos seleccionados"}
        </Text>
      )}

      <TouchableOpacity
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
        activeOpacity={0.8}
      >
        <Text style={styles.saveButtonText}>
          {selectedIds.size > 1
            ? `Añadir ${selectedIds.size} archivos`
            : selectedIds.size === 1
              ? "Añadir archivo"
              : "Selecciona archivos"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
