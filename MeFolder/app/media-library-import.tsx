import React, { useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { MultiActionButton } from "@/components";
import {
  MediaImportProgressOverlay,
  MediaLibraryAlbumRow,
  MediaLibraryAssetTile,
} from "@/components/MediaLibraryImport";
import { useStyles } from "@/hooks";
import {
  useMediaLibraryAssets,
  useMediaLibraryImport,
} from "@/hooks/mediaLibrary";
import { useAlert } from "@/providers";

export default function MediaLibraryImportScreen() {
  const insets = useSafeAreaInsets();
  const styles = useMediaLibraryImportScreenStyles();
  const { showAlert } = useAlert();
  const { folderId, albumId, initialMode } = useLocalSearchParams<{
    folderId?: string;
    albumId?: string;
    initialMode?: string;
  }>();

  const {
    permission,
    mode,
    assets,
    albums,
    selectedAssets,
    selectedAssetIds,
    selectedAssetCount,
    selectedAlbum,
    hasNextPage,
    isLoadingAssets,
    isLoadingAlbums,
    isRefreshing,
    requestPermission,
    refresh,
    handleModeChange,
    toggleAssetSelection,
    selectAlbum,
    loadMoreAssets,
  } = useMediaLibraryAssets(initialMode === "albums" ? "albums" : "assets");

  const {
    isImporting,
    progressTitle,
    progress,
    importSelectedAssets,
    importAlbum,
  } = useMediaLibraryImport({
    ...(folderId ? { folderId } : {}),
    ...(albumId ? { albumId } : {}),
  });

  useEffect(() => {
    if (permission?.granted) {
      refresh();
    } else {
      void requestPermission();
    }
  }, [permission, refresh]);

  const closeWithSummary = useCallback(
    (title: string, failed: { name: string; error: string }[]) => {
      if (failed.length > 0) {
        showAlert({
          title,
          message: failed
            .slice(0, 5)
            .map((item) => `${item.name}: ${item.error}`)
            .join("\n"),
        });
      }

      router.back();
    },
    [showAlert],
  );

  const handleImportSelectedAssets = useCallback(async () => {
    if (selectedAssets.length === 0 || isImporting) {
      return;
    }

    const result = await importSelectedAssets(selectedAssets);
    closeWithSummary("Importación completada con incidencias", result.failed);
  }, [closeWithSummary, importSelectedAssets, isImporting, selectedAssets]);

  const handleImportAlbum = useCallback(async () => {
    if (!selectedAlbum || isImporting) {
      return;
    }

    const result = await importAlbum(selectedAlbum);
    closeWithSummary("Álbum importado con incidencias", result.failed);
  }, [closeWithSummary, importAlbum, isImporting, selectedAlbum]);

  const renderAssetItem = useCallback(
    ({ item }: { item: (typeof assets)[number] }) => (
      <MediaLibraryAssetTile
        asset={item}
        isSelected={selectedAssetIds.has(item.id)}
        onPress={() => toggleAssetSelection(item)}
      />
    ),
    [selectedAssetIds, toggleAssetSelection],
  );

  const renderAlbumItem = useCallback(
    ({ item }: { item: (typeof albums)[number] }) => (
      <MediaLibraryAlbumRow
        album={item}
        isSelected={selectedAlbum?.id === item.id}
        onPress={() => selectAlbum(item)}
      />
    ),
    [selectedAlbum?.id, selectAlbum],
  );

  const renderPermissionState = () => {
    const canAskAgain = permission?.canAskAgain ?? true;

    return (
      <View style={styles.centerState}>
        <Ionicons
          name="images-outline"
          size={52}
          color={styles.mutedColor.color}
        />
        <Text style={styles.centerTitle}>Acceso a la galería</Text>
        <Text style={styles.centerMessage}>
          Necesitamos permiso para listar los archivos y álbumes disponibles en
          el dispositivo.
        </Text>
        {canAskAgain ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => void requestPermission()}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>Conceder acceso</Text>
          </TouchableOpacity>
        ) : (
          <Text style={styles.centerHint}>
            Activa el permiso desde ajustes del sistema para poder importar.
          </Text>
        )}
      </View>
    );
  };

  const renderAssetsContent = () => {
    if (isLoadingAssets && assets.length === 0) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={styles.primaryColor.color} />
          <Text style={styles.centerMessage}>Cargando archivos&hellip;</Text>
        </View>
      );
    }

    if (assets.length === 0) {
      return (
        <View style={styles.centerState}>
          <Ionicons
            name="image-outline"
            size={48}
            color={styles.mutedColor.color}
          />
          <Text style={styles.centerMessage}>
            No hay fotos o videos disponibles para importar.
          </Text>
        </View>
      );
    }

    return (
      <FlashList
        data={assets}
        renderItem={renderAssetItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.assetsGrid}
        refreshing={isRefreshing}
        onRefresh={refresh}
        onEndReachedThreshold={0.4}
        onEndReached={hasNextPage ? loadMoreAssets : undefined}
      />
    );
  };

  const renderAlbumsContent = () => {
    if (isLoadingAlbums && albums.length === 0) {
      return (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={styles.primaryColor.color} />
          <Text style={styles.centerMessage}>Cargando álbumes&hellip;</Text>
        </View>
      );
    }

    if (albums.length === 0) {
      return (
        <View style={styles.centerState}>
          <Ionicons
            name="folder-open-outline"
            size={48}
            color={styles.mutedColor.color}
          />
          <Text style={styles.centerMessage}>
            No hay álbumes disponibles para importar.
          </Text>
        </View>
      );
    }

    return (
      <FlashList
        data={albums}
        renderItem={renderAlbumItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.albumList}
        refreshing={isRefreshing}
        onRefresh={refresh}
      />
    );
  };

  const manualActionDisabled = selectedAssetCount === 0 || isImporting;
  const albumActionDisabled = !selectedAlbum || isImporting;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <MultiActionButton
          icon="chevron-back"
          backgroundColor="transparent"
          iconColor={styles.backIconColor.color}
          size={42}
          onPress={() => {
            if (!isImporting) {
              router.back();
            }
          }}
        />
        <View style={styles.headerTitleWrapper}>
          <Text style={styles.headerTitle}>Importar desde galería</Text>
          <Text style={styles.headerSubtitle}>
            Elige archivos sueltos o un álbum completo
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {!permission?.granted ? (
        renderPermissionState()
      ) : (
        <>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === "assets" && styles.modeButtonActive,
              ]}
              onPress={() => handleModeChange("assets")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === "assets" && styles.modeButtonTextActive,
                ]}
              >
                Archivos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                mode === "albums" && styles.modeButtonActive,
              ]}
              onPress={() => handleModeChange("albums")}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  mode === "albums" && styles.modeButtonTextActive,
                ]}
              >
                Álbumes
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            {mode === "assets" ? renderAssetsContent() : renderAlbumsContent()}
          </View>

          <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
            {mode === "assets" ? (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  manualActionDisabled && styles.primaryButtonDisabled,
                ]}
                onPress={() => void handleImportSelectedAssets()}
                disabled={manualActionDisabled}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  {selectedAssetCount > 1
                    ? `Importar ${selectedAssetCount} archivos`
                    : selectedAssetCount === 1
                      ? "Importar archivo"
                      : "Selecciona archivos"}
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  albumActionDisabled && styles.primaryButtonDisabled,
                ]}
                onPress={() => void handleImportAlbum()}
                disabled={albumActionDisabled}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryButtonText}>
                  {selectedAlbum
                    ? `Importar álbum ${selectedAlbum.title}`
                    : "Selecciona un álbum"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      <MediaImportProgressOverlay
        visible={isImporting}
        title={progressTitle}
        progress={progress}
      />
    </View>
  );
}

const useMediaLibraryImportScreenStyles = () => {
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
      gap: theme.spacing.sm,
    },
    headerTitleWrapper: {
      flex: 1,
      alignItems: "center",
    },
    headerTitle: {
      fontSize: 22,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    headerSubtitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    headerSpacer: {
      width: 42,
    },
    modeSelector: {
      flexDirection: "row",
      marginHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.subCard,
      borderRadius: theme.effects.radius.lg,
      padding: 4,
      gap: 4,
    },
    modeButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.effects.radius.md,
    },
    modeButtonActive: {
      backgroundColor: theme.colors.primary,
    },
    modeButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    modeButtonTextActive: {
      color: theme.colors.textOnColor,
    },
    contentContainer: {
      paddingTop: theme.spacing.md,
      flex: 1,
    },
    assetsGrid: {
      paddingHorizontal: theme.spacing.sm,
      paddingBottom: theme.spacing.lg,
    },
    albumList: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
    },
    footer: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      backgroundColor: theme.colors.background,
      borderTopWidth: 1,
      borderTopColor: theme.colors.borderSoft,
    },
    primaryButton: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.effects.radius.lg,
      padding: theme.spacing.md,
    },
    primaryButtonDisabled: {
      backgroundColor: theme.colors.borderSoft,
    },
    primaryButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textOnColor,
      textAlign: "center",
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: theme.spacing.xl,
      gap: theme.spacing.sm,
    },
    centerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    centerMessage: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    centerHint: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
    mutedColor: {
      color: theme.colors.textMuted,
    },
    primaryColor: {
      color: theme.colors.primary,
    },
    backIconColor: {
      color: theme.colors.textPrimary,
    },
  }));
};
