import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useAlert, useTheme } from "@/providers";
import { useServices } from "@/providers";
import { TagModel } from "@/models/tag";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "@/hooks";
import { MultiActionButton } from "@/components";
import { SYSTEM_TAG_IDS, SystemTagId } from "@/database/seeds/systemTags";
import { PRIORITY_CONFIG } from "@/types/ui/components";
import { cardShadow } from "@/constants/styles/shadows";

const AUTO_TAG_IDS = new Set<SystemTagId>([
  SYSTEM_TAG_IDS.album,
  SYSTEM_TAG_IDS.photo,
  SYSTEM_TAG_IDS.audio,
  SYSTEM_TAG_IDS.video,
  SYSTEM_TAG_IDS.document,
]);

export default function TagAdderScreen() {
  const { theme } = useTheme();
  const styles = useTagAdderStyles();
  const insets = useSafeAreaInsets();

  const { fileIds: fileIdsParam } = useLocalSearchParams<{
    fileIds: string;
  }>();

  const fileIds = useMemo(
    () => (fileIdsParam ? fileIdsParam.split(",") : []),
    [fileIdsParam],
  );

  const { services } = useServices();
  const { showAlert } = useAlert();
  const tagService = services?.tagService;

  const [tags, setTags] = useState<TagModel[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadTags = async () => {
      if (!tagService) return;
      setLoading(true);
      try {
        const allTags = await tagService.getAllTagsWithoutAlbum();
        const filteredTags = allTags.filter(
          (t) => !AUTO_TAG_IDS.has(t.id as SystemTagId) && t.isActive,
        );
        setTags(filteredTags);
      } catch {
        setTags([]);
      } finally {
        setLoading(false);
      }
    };
    loadTags();
  }, [tagService]);

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedTagIds.size === 0 || !tagService || fileIds.length === 0)
      return;
    setSaving(true);
    try {
      const tagIdsArray = Array.from(selectedTagIds);
      for (const fileId of fileIds) {
        await tagService.addTagsToFile(fileId, tagIdsArray);
      }

      showAlert({
        title: "Éxito",
        message: `Se han añadido ${selectedTagIds.size} ${selectedTagIds.size === 1 ? "etiqueta" : "etiquetas"} a ${fileIds.length} ${fileIds.length === 1 ? "archivo" : "archivos"}.`,
      });

      router.back();
    } catch {
      setSaving(false);
    }
  }, [selectedTagIds, tagService, fileIds]);

  const canSave = selectedTagIds.size > 0 && !saving;

  const renderTagItem = useCallback(
    ({ item }: { item: TagModel }) => {
      const isSelected = selectedTagIds.has(item.id);
      const priorityCfg = PRIORITY_CONFIG[item.priority];

      return (
        <TouchableOpacity
          style={[styles.tagCard, isSelected && styles.tagCardSelected]}
          onPress={() => toggleTag(item.id)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.tagIconContainer,
              { backgroundColor: item.color.hex + "18" },
            ]}
          >
            <MaterialCommunityIcons
              name="tag"
              size={22}
              color={item.color.hex}
            />
          </View>

          <View style={styles.tagCardContent}>
            <Text style={styles.tagCardName}>{item.name}</Text>
            <View style={styles.tagCardMeta}>
              {item.usageCount > 0 ? (
                <Text style={styles.tagCardCount}>
                  {item.usageCount} archivos
                </Text>
              ) : (
                <Text style={styles.tagCardCount}>Sin archivos</Text>
              )}
              {(item.priority === "high" || item.priority === "critical") && (
                <Text
                  style={[
                    styles.tagCardPriority,
                    {
                      backgroundColor: priorityCfg.bg,
                      color: priorityCfg.color,
                    },
                  ]}
                >
                  {priorityCfg.label}
                </Text>
              )}
              {item.isFavorite && (
                <Ionicons name="star" size={12} color={theme.colors.primary} />
              )}
            </View>
          </View>

          <View style={styles.tagCardRight}>
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={isSelected ? theme.colors.primary : theme.colors.textMuted}
            />
          </View>
        </TouchableOpacity>
      );
    },
    [selectedTagIds, toggleTag],
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.emptyStateText}>Cargando etiquetas&hellip;</Text>
        </View>
      );
    }

    if (tags.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="tag-off-outline"
            size={48}
            color={theme.colors.textMuted}
          />
          <Text style={styles.emptyStateText}>
            No hay etiquetas disponibles
          </Text>
        </View>
      );
    }

    return (
      <FlashList
        data={tags}
        renderItem={renderTagItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
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
          <Text style={styles.headerTitleText}>Añadir etiquetas</Text>
          <Text style={styles.headerSubtitle}>
            {fileIds.length} {fileIds.length === 1 ? "archivo" : "archivos"}
          </Text>
        </View>
        <View style={{ width: 42 }} />
      </View>

      <View style={styles.listContainer}>{renderContent()}</View>

      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        {canSave && (
          <Text style={styles.selectionCount}>
            {selectedTagIds.size}{" "}
            {selectedTagIds.size === 1
              ? "etiqueta seleccionada"
              : "etiquetas seleccionadas"}
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
              : selectedTagIds.size > 0
                ? `Añadir ${selectedTagIds.size} ${selectedTagIds.size === 1 ? "etiqueta" : "etiquetas"}`
                : "Selecciona etiquetas"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const useTagAdderStyles = () => {
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
    listContainer: {
      flex: 1,
    },
    listContent: {
      paddingVertical: theme.spacing.sm,
    },
    tagCard: {
      ...cardShadow(theme),
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.effects.radius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: "transparent",
    },
    tagCardSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    tagIconContainer: {
      width: 42,
      height: 42,
      borderRadius: theme.effects.radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    tagCardContent: {
      flex: 1,
    },
    tagCardName: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
    },
    tagCardMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    tagCardCount: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
    },
    tagCardPriority: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.medium,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.effects.radius.xxs,
      overflow: "hidden",
    },
    tagCardRight: {
      alignItems: "center",
      justifyContent: "center",
    },
    footer: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderTopWidth: theme.effects.borderWidth.xs,
      borderTopColor: theme.colors.borderSoft,
    },
    selectionCount: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
      textAlign: "center",
      paddingVertical: theme.spacing.xs,
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
