import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/providers";
import { useServices } from "@/providers";
import { FileModel } from "@/models/file";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "@/hooks";
import { MultiActionButton } from "@/components";

export default function AlbumAdderScreen() {
  const { theme } = useTheme();
  const styles = useAlbumAdderScreenStyles();
  const insets = useSafeAreaInsets();
  const { albumId, albumName } = useLocalSearchParams<{
    albumId: string;
    albumName?: string;
  }>();
  const { services } = useServices();
  const fileService = services?.fileService;
  const tagService = services?.tagService;

  const [files, setFiles] = useState<FileModel[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadMediaFiles = async () => {
      if (!fileService || !albumId) return;
      setLoading(true);
      try {
        const [images, videos] = await Promise.all([
          fileService.getFilesByCategory("image", albumId),
          fileService.getFilesByCategory("video", albumId),
        ]);
        setFiles([...images, ...videos]);
      } catch {
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };
    loadMediaFiles();
  }, [fileService, albumId]);

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

  const handleSave = useCallback(async () => {
    if (selectedIds.size === 0 || !tagService || !albumId) return;
    setSaving(true);
    try {
      await tagService.bulkAddTagsToFiles(Array.from(selectedIds), albumId);
      router.back();
    } catch {
      setSaving(false);
    }
  }, [selectedIds, tagService, albumId]);

  const canSave = selectedIds.size > 0 && !saving;

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

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.emptyStateText}>Cargando archivos&hellip;</Text>
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
      <FlashList
        data={files}
        renderItem={renderFileItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
      />
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <MultiActionButton
          icon="chevron-back"
          backgroundColor="transparent"
          iconColor={styles.iconColor.color}
          size={42}
          onPress={() => router.back()}
        />
        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText}>Añadir al álbum</Text>
          {albumName && (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {albumName}
            </Text>
          )}
        </View>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.listContainer}>{renderContent()}</View>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
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
            {saving
              ? "Guardando..."
              : selectedIds.size > 1
                ? `Añadir ${selectedIds.size} archivos`
                : selectedIds.size === 1
                  ? "Añadir archivo"
                  : "Selecciona archivos"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const useAlbumAdderScreenStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    headerTitle: {
      flex: 1,
      alignItems: "center",
    },
    headerTitleText: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    iconColor: {
      color: theme.colors.textPrimary,
    },
    selectionCount: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
      textAlign: "center",
      paddingVertical: theme.spacing.xs,
    },
    listContainer: {
      flex: 1,
    },
    grid: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
    },
    fileItem: {
      flex: 1,
      margin: 3,
      borderRadius: theme.effects.radius.xs,
      overflow: "hidden",
      borderWidth: theme.effects.borderWidth.md,
      borderColor: "transparent",
    },
    fileItemSelected: {
      borderColor: theme.colors.primary,
    },
    fileThumbnail: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: theme.effects.radius.xs,
    },
    filePlaceholder: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: theme.effects.radius.xs,
      backgroundColor: theme.colors.subCard,
      alignItems: "center",
      justifyContent: "center",
    },
    selectedOverlay: {
      position: "absolute",
      top: 4,
      right: 4,
      backgroundColor: theme.colors.surface,
      borderRadius: 14,
    },
    fileName: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      paddingHorizontal: 2,
    },
    footer: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderTopWidth: theme.effects.borderWidth.xs,
      borderTopColor: theme.colors.borderSoft,
    },
    saveButton: {
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.borderSoft,
    },
    saveButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.primary.bold,
      color: theme.colors.textOnColor,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.xxl,
    },
    emptyStateText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm,
    },
  }));
};
