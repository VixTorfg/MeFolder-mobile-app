import {
  useGalleryContent,
  useStyles,
  usePinchColumns,
  useSelection,
  usePressScaleAnimation,
  useAlert,
  useServices,
} from "@/hooks";
import {
  CustomPopup,
  MediaImportProgressOverlay,
  MultiActionButton,
  MediaHost,
  OptionDropDown,
  PropertyMenu,
} from "@/components";
import { FileModel } from "@/models/file";
import type { MediaHostItem } from "@/types/media/viewers";
import { OptionsIds, type ArchiveSourceFile, type OptionsType } from "@/types";
import { useTagContentStore } from "@/stores/useTagContentStore";
import { useLocalSearchParams, router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import * as Sharing from "expo-sharing";
import {
  ActivityIndicator,
  Animated as RNAnimated,
  View,
  Text,
  Pressable,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatVideoDuration } from "@/utils/format/date";
import EmptyFolder from "@/components/svgIcons/emptyFolder";
import { cardShadow } from "@/constants/styles/shadows";
import {
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, { LinearTransition, FadeIn } from "react-native-reanimated";

const SPACING_HORIZONTAL_SM = 10;
const DELETE_DIALOG_CLOSE_DELAY_MS = 180;
const DELETE_LOADING_SHOW_DELAY_MS = 80;
const DELETE_LOADING_MIN_VISIBLE_MS = 140;

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const galleryOptions: OptionsType[] = [
  {
    id: OptionsIds.EXPORT_ALBUM,
    name: "Exportar álbum",
    icon: "share-outline",
  },
  {
    id: OptionsIds.DELETE_ALBUM,
    name: "Eliminar álbum",
    icon: "trash-outline",
  },
  {
    id: OptionsIds.PROPERTIES,
    name: "Propiedades",
    icon: "build-outline",
  },
  {
    id: OptionsIds.SETTINGS,
    name: "Configuración",
    icon: "settings-outline",
  },
];

interface GalleryTileProps {
  item: FileModel;
  itemSize: number;
  isSelected: boolean;
  selectionMode: boolean;
  onOpenItem: (item: FileModel) => void;
  onToggleSelection: (item: FileModel) => void;
  styles: ReturnType<typeof useGalleryStyles>;
}

interface DeleteDialogState {
  isVisible: boolean;
  fileIds: FileModel["id"][];
  deleteFromAlbum: boolean;
  deleteFromSystem: boolean;
}

function GalleryTile({
  item,
  itemSize,
  isSelected,
  selectionMode,
  onOpenItem,
  onToggleSelection,
  styles,
}: GalleryTileProps) {
  const { animatedStyle, handlePressIn, handlePressOut } =
    usePressScaleAnimation();

  return (
    <Animated.View
      style={{
        width: itemSize,
        height: itemSize,
        padding: 1,
        overflow: "hidden",
      }}
      layout={LinearTransition.duration(300)}
      entering={FadeIn.duration(250)}
    >
      <RNAnimated.View style={[styles.thumbAnimatedWrapper, animatedStyle]}>
        <Pressable
          onPress={() => {
            if (selectionMode) {
              onToggleSelection(item);
              return;
            }

            onOpenItem(item);
          }}
          onLongPress={() => onToggleSelection(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.thumbPressable,
            isSelected && styles.thumbPressableSelected,
          ]}
        >
          {item.thumbnailUrl && (
            <Image
              source={{ uri: item.thumbnailUrl }}
              recyclingKey={item.id}
              style={styles.thumb}
              contentFit="cover"
              transition={200}
            />
          )}
          {isSelected ? (
            <View style={styles.selectionBadge}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            </View>
          ) : null}
          {item.category === "video" ? (
            <View style={styles.videoInfo}>
              <MaterialCommunityIcons
                name="play-circle"
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.videoDurationText}>
                {formatVideoDuration(item.metadata.videoMetadata?.duration)}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </RNAnimated.View>
    </Animated.View>
  );
}

export default function GalleryScreen() {
  const { tagId, albumName } = useLocalSearchParams();
  const styles = useGalleryStyles();
  const insets = useSafeAreaInsets();
  const { services } = useServices();
  const { showAlert } = useAlert();

  const { items, loadMore, isLoading } = useGalleryContent({
    tagId: tagId as string,
    pageSize: 100,
  });
  const {
    itemsSelected,
    selectionMode,
    toggleSelection,
    clearSelection,
    currentData,
    showPropertyMenu,
    closePropertyMenu,
    handleOnSelectOption,
  } = useSelection(items, tagId as string, "tag");

  const { columns, pinchGesture } = usePinchColumns({
    initialColumns: 4,
    minColumns: 2,
    maxColumns: 6,
  });

  const { width: screenWidth } = useWindowDimensions();
  const itemSize = Math.trunc(
    (screenWidth - 2 * SPACING_HORIZONTAL_SM) / columns,
  );

  const [selectedMediaId, setSelectedMediaId] = useState<
    FileModel["id"] | null
  >(null);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    isVisible: false,
    fileIds: [],
    deleteFromAlbum: true,
    deleteFromSystem: false,
  });
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isArchiveLoading, setIsArchiveLoading] = useState(false);
  const [archiveLoadingTitle, setArchiveLoadingTitle] =
    useState("Exportando álbum");
  const [archiveLoadingText, setArchiveLoadingText] = useState(
    "Preparando el ZIP del álbum...",
  );

  const mediaItems = useMemo<MediaHostItem[]>(
    () =>
      items.flatMap((item) => {
        if (!item.storageUrl) return [];
        if (item.category !== "image" && item.category !== "video") {
          return [];
        }

        return [
          {
            uri: item.storageUrl,
            fileId: item.id,
            ...(item.metadata.mimeType != null && {
              mimeType: item.metadata.mimeType,
            }),
            ...(item.thumbnailUrl != null && {
              thumbnailUrl: item.thumbnailUrl,
            }),
            ...(item.metadata.imageMetadata != null && {
              mediaWidth: item.metadata.imageMetadata.width,
              mediaHeight: item.metadata.imageMetadata.height,
            }),
            ...(item.metadata.videoMetadata != null && {
              mediaWidth: item.metadata.videoMetadata.width,
              mediaHeight: item.metadata.videoMetadata.height,
            }),
            displayName: item.name,
            category: item.category,
          },
        ];
      }),
    [items],
  );

  const handleOpenItem = useCallback((file: FileModel) => {
    if (!file.storageUrl) return;
    if (file.category !== "image" && file.category !== "video") return;

    setSelectedMediaId(file.id);
  }, []);

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      const distanceFromEnd =
        contentSize.height - layoutMeasurement.height - contentOffset.y;
      if (distanceFromEnd < 200) {
        loadMore();
      }
    },
    [loadMore],
  );

  const handleBackPress = useCallback(() => {
    clearSelection();
    router.back();
  }, [clearSelection]);

  const selectedFileIds = useMemo(
    () => itemsSelected.map((item) => item.id),
    [itemsSelected],
  );

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialog((prev) => ({
      ...prev,
      isVisible: false,
      fileIds: [],
      deleteFromAlbum: true,
      deleteFromSystem: false,
    }));
  }, []);

  const openDeleteDialog = useCallback((fileIds: FileModel["id"][]) => {
    setDeleteDialog({
      isVisible: true,
      fileIds,
      deleteFromAlbum: true,
      deleteFromSystem: false,
    });
  }, []);

  const toggleDeleteFromAlbum = useCallback(() => {
    setDeleteDialog((prev) => {
      if (prev.deleteFromSystem) {
        return prev;
      }

      return {
        ...prev,
        deleteFromAlbum: !prev.deleteFromAlbum,
      };
    });
  }, []);

  const toggleDeleteFromSystem = useCallback(() => {
    setDeleteDialog((prev) => {
      const nextDeleteFromSystem = !prev.deleteFromSystem;

      return {
        ...prev,
        deleteFromSystem: nextDeleteFromSystem,
        deleteFromAlbum: nextDeleteFromSystem ? true : prev.deleteFromAlbum,
      };
    });
  }, []);

  const confirmDelete = useCallback(async () => {
    const { fileIds, deleteFromAlbum, deleteFromSystem } = deleteDialog;

    if (fileIds.length === 0) {
      closeDeleteDialog();
      return;
    }

    if (!deleteFromAlbum && !deleteFromSystem) {
      showAlert({
        title: "Selecciona una acción",
        message:
          "Debes indicar si deseas quitar el archivo del álbum o borrarlo del sistema.",
      });
      return;
    }

    try {
      closeDeleteDialog();
      await wait(DELETE_DIALOG_CLOSE_DELAY_MS);

      setIsDeleteLoading(true);
      await wait(DELETE_LOADING_SHOW_DELAY_MS);

      if (deleteFromSystem) {
        await services.fileService.permanentDeleteFiles(fileIds);
      } else {
        for (const fileId of fileIds) {
          await services.tagService.removeTagFromFile(fileId, tagId as string);
        }
      }

      useTagContentStore.getState().removeItems(fileIds);
      clearSelection();
      await wait(DELETE_LOADING_MIN_VISIBLE_MS);
    } catch (error) {
      showAlert({
        title: "Error al borrar",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo completar el borrado de los archivos seleccionados.",
      });
    } finally {
      setIsDeleteLoading(false);
    }
  }, [
    clearSelection,
    closeDeleteDialog,
    deleteDialog,
    services.fileService,
    services.tagService,
    showAlert,
    tagId,
  ]);

  const handleExportAlbum = useCallback(async () => {
    if (!(await Sharing.isAvailableAsync())) {
      showAlert({
        title: "Compartir no disponible",
        message:
          "La función de compartir no está disponible en este dispositivo.",
      });
      return;
    }

    let temporaryArchiveId: string | null = null;

    try {
      setArchiveLoadingTitle("Exportando álbum");
      setArchiveLoadingText("Preparando el ZIP del álbum...");
      setIsArchiveLoading(true);

      const exportResult = await services.albumArchiveService.exportAlbum({
        albumId: tagId as string,
      });

      if (!exportResult.success || !exportResult.data) {
        throw new Error(
          exportResult.error?.message ?? "No se pudo exportar el álbum.",
        );
      }

      temporaryArchiveId = exportResult.data.archiveFile.id;

      await Sharing.shareAsync(exportResult.data.archiveUri, {
        mimeType: "application/zip",
        dialogTitle: `Exportar ${exportResult.data.albumName}`,
      });
    } catch (error) {
      showAlert({
        title: "Error al exportar",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo exportar el álbum.",
      });
    } finally {
      setIsArchiveLoading(false);

      if (temporaryArchiveId) {
        try {
          await services.fileService.permanentDeleteFile(temporaryArchiveId);
        } catch (cleanupError) {
          console.warn(
            "No se pudo limpiar el ZIP temporal del álbum:",
            cleanupError,
          );
        }
      }
    }
  }, [services, showAlert, tagId]);

  const handleDeleteAlbum = useCallback(() => {
    if (!tagId) {
      showAlert({
        title: "Error al eliminar álbum",
        message: "No se pudo identificar el álbum actual.",
      });
      return;
    }

    showAlert({
      title: "Eliminar álbum",
      message:
        "Se eliminará el álbum, pero los archivos seguirán existiendo. Solo se quitará la etiqueta del álbum.",
      buttons: [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await services.tagService.deleteTag(tagId as string);
                clearSelection();
                router.back();
              } catch (error) {
                showAlert({
                  title: "Error al eliminar álbum",
                  message:
                    error instanceof Error
                      ? error.message
                      : "No se pudo eliminar el álbum.",
                });
              }
            })();
          },
        },
      ],
    });
  }, [clearSelection, services.tagService, showAlert, tagId]);

  const handleShareSelected = useCallback(async () => {
    if (!(await Sharing.isAvailableAsync())) {
      showAlert({
        title: "Compartir no disponible",
        message:
          "La función de compartir no está disponible en este dispositivo.",
      });
      return;
    }

    const shareableItems = itemsSelected.filter((item) =>
      Boolean(item.storageUrl),
    );
    if (shareableItems.length === 0) {
      showAlert({
        title: "Nada que compartir",
        message:
          "Los elementos seleccionados no tienen una ruta de archivo válida.",
      });
      return;
    }

    if (shareableItems.length === 1) {
      const fileUri = shareableItems[0]?.storageUrl;
      if (!fileUri) {
        showAlert({
          title: "Ruta no disponible",
          message: "No se pudo resolver la ubicación del archivo seleccionado.",
        });
        return;
      }

      try {
        await Sharing.shareAsync(fileUri, {
          ...(shareableItems[0]?.metadata.mimeType
            ? { mimeType: shareableItems[0].metadata.mimeType }
            : {}),
          dialogTitle: `Compartir ${shareableItems[0]?.name ?? "archivo"}`,
        });
      } catch (error) {
        showAlert({
          title: "Error al compartir",
          message:
            error instanceof Error
              ? error.message
              : "No se pudo compartir el archivo seleccionado.",
        });
      }
      return;
    }

    let temporaryArchiveId: string | null = null;

    try {
      setArchiveLoadingTitle("Compartiendo selección");
      setArchiveLoadingText("Preparando el ZIP de la selección...");
      setIsArchiveLoading(true);

      const archiveResult =
        await services.archiveService.createArchiveFromFiles({
          files: shareableItems.map<ArchiveSourceFile>((item) => ({
            id: item.id,
            name: item.name,
            originalName: item.originalName,
            extension: item.extension,
            path: item.path,
            metadata: item.metadata,
            ...(item.storageUrl ? { storageUrl: item.storageUrl } : {}),
            ...(item.folderId ? { folderId: item.folderId } : {}),
            ...(item.visibility ? { visibility: item.visibility } : {}),
          })),
          outputName:
            shareableItems.length > 1
              ? `${(albumName as string) ?? "seleccion"}_seleccion`
              : (shareableItems[0]?.name ?? "seleccion"),
          rootFolderName: (albumName as string) ?? "seleccion",
        });

      if (!archiveResult.success || !archiveResult.data) {
        throw new Error(
          archiveResult.error?.message ??
            "No se pudo preparar la selección para compartir.",
        );
      }

      temporaryArchiveId = archiveResult.data.archiveFile.id;
      const archiveFile =
        await services.fileService.getFile(temporaryArchiveId);
      const archiveUri = archiveFile.storageUrl ?? archiveFile.path;

      await Sharing.shareAsync(archiveUri, {
        mimeType: "application/zip",
        dialogTitle: "Compartir selección",
      });
    } catch (error) {
      showAlert({
        title: "Error al compartir",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo compartir la selección.",
      });
    } finally {
      setIsArchiveLoading(false);
      setArchiveLoadingTitle("Exportando álbum");
      setArchiveLoadingText("Preparando el ZIP del álbum...");

      if (temporaryArchiveId) {
        try {
          await services.fileService.permanentDeleteFile(temporaryArchiveId);
        } catch (cleanupError) {
          console.warn(
            "No se pudo limpiar el ZIP temporal de la selección:",
            cleanupError,
          );
        }
      }
    }
  }, [
    albumName,
    itemsSelected,
    services.archiveService,
    services.fileService,
    showAlert,
  ]);

  const handleGalleryOptionSelect = useCallback(
    (option: OptionsType) => {
      if (option.id === OptionsIds.EXPORT_ALBUM) {
        void handleExportAlbum();
        return;
      }

      if (option.id === OptionsIds.DELETE_ALBUM) {
        handleDeleteAlbum();
        return;
      }

      handleOnSelectOption(option);
    },
    [handleDeleteAlbum, handleExportAlbum, handleOnSelectOption],
  );

  const selectionActionBarOffset = insets.bottom + 12;
  const scrollBottomPadding = selectionMode
    ? selectionActionBarOffset + 92
    : 16;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <MultiActionButton
            icon="chevron-back"
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={handleBackPress}
          />
          <View style={styles.headerTitle}>
            <Text
              style={styles.headerTitleText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {(albumName as string) ?? "Galería"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <MultiActionButton
              icon="add"
              backgroundColor="transparent"
              iconColor={styles.iconColor.color}
              size={42}
              onPress={() =>
                router.push({
                  pathname: "/album-adder",
                  params: {
                    albumId: tagId as string,
                    albumName: (albumName as string) ?? "",
                  },
                })
              }
            />
            <OptionDropDown
              size={42}
              options={galleryOptions}
              onSelect={handleGalleryOptionSelect}
            />
          </View>
        </View>

        {isLoading && items.length === 0 ? (
          <View style={styles.emptyAlbumContainer}>
            <ActivityIndicator size="large" color={styles.primaryColor.color} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyAlbumContainer}>
            <View style={styles.emptyFolderIconContainer}>
              <EmptyFolder
                strokeWidth={0.35}
                width={120}
                height={120}
                folderColor={styles.iconColor.color}
                crossColor={styles.primaryColor.color}
              />
              <Text style={styles.emptyFolderText}>El álbum está vacío</Text>
            </View>
            <TouchableOpacity
              style={styles.volverButton}
              onPress={() => router.back()}
            >
              <Text style={styles.volverText}>Volver</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <GestureDetector gesture={pinchGesture}>
            <Animated.ScrollView
              onScroll={handleScroll}
              scrollEventThrottle={16}
              contentContainerStyle={[
                styles.gridContainer,
                { paddingBottom: scrollBottomPadding },
              ]}
            >
              {items.map((item) => (
                <GalleryTile
                  key={item.id}
                  item={item}
                  itemSize={itemSize}
                  isSelected={itemsSelected.some(
                    (selectedItem) => selectedItem.id === item.id,
                  )}
                  selectionMode={selectionMode}
                  onOpenItem={handleOpenItem}
                  onToggleSelection={toggleSelection}
                  styles={styles}
                />
              ))}
            </Animated.ScrollView>
          </GestureDetector>
        )}

        {selectionMode ? (
          <View
            style={[
              styles.selectionActionBar,
              { bottom: selectionActionBarOffset },
            ]}
          >
            <TouchableOpacity
              style={styles.selectionActionButton}
              activeOpacity={0.85}
              onPress={() => {
                void handleShareSelected();
              }}
            >
              <MaterialCommunityIcons
                name="share-variant-outline"
                size={24}
                color={styles.primaryColor.color}
              />
              <Text style={styles.selectionActionLabel}>Compartir</Text>
            </TouchableOpacity>

            <View style={styles.selectionActionDivider} />

            <TouchableOpacity
              style={styles.selectionActionButton}
              activeOpacity={0.85}
              onPress={() => openDeleteDialog(selectedFileIds)}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={24}
                color={styles.primaryColor.color}
              />
              <Text style={styles.selectionActionLabel}>Borrar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <CustomPopup
          title="Confirmar borrado"
          isVisible={deleteDialog.isVisible}
          onDismiss={closeDeleteDialog}
        >
          <Text style={styles.popupMessage}>
            {deleteDialog.fileIds.length > 1
              ? `Se va a proceder a borrar ${deleteDialog.fileIds.length} archivos.`
              : "Se va a proceder a borrar el archivo seleccionado."}
          </Text>

          <Pressable
            style={[
              styles.popupCheckboxRow,
              deleteDialog.deleteFromSystem && styles.popupCheckboxRowDisabled,
            ]}
            onPress={toggleDeleteFromAlbum}
          >
            <MaterialCommunityIcons
              name={
                deleteDialog.deleteFromAlbum
                  ? "checkbox-marked-outline"
                  : "checkbox-blank-outline"
              }
              size={22}
              color={styles.primaryColor.color}
            />
            <Text style={styles.popupCheckboxLabel}>Quitar del álbum</Text>
          </Pressable>

          <Pressable
            style={styles.popupCheckboxRow}
            onPress={toggleDeleteFromSystem}
          >
            <MaterialCommunityIcons
              name={
                deleteDialog.deleteFromSystem
                  ? "checkbox-marked-outline"
                  : "checkbox-blank-outline"
              }
              size={22}
              color={styles.primaryColor.color}
            />
            <Text style={styles.popupCheckboxLabel}>Borrar del sistema</Text>
          </Pressable>

          <View style={styles.popupFooterButtons}>
            <TouchableOpacity
              style={styles.popupCancelButton}
              onPress={closeDeleteDialog}
            >
              <Text style={styles.popupCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.popupConfirmButton,
                !deleteDialog.deleteFromAlbum &&
                  !deleteDialog.deleteFromSystem &&
                  styles.popupConfirmButtonDisabled,
              ]}
              onPress={() => {
                void confirmDelete();
              }}
              disabled={
                !deleteDialog.deleteFromAlbum && !deleteDialog.deleteFromSystem
              }
            >
              <Text style={styles.popupConfirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </CustomPopup>

        <CustomPopup
          title="Borrando"
          isVisible={isDeleteLoading}
          onDismiss={() => undefined}
          dismissOnBackdropPress={false}
        >
          <View style={styles.popupLoadingContent}>
            <ActivityIndicator size="large" color={styles.primaryColor.color} />
            <Text style={styles.popupLoadingText}>
              Eliminando los archivos seleccionados&hellip;
            </Text>
            <Text style={styles.popupLoadingHint}>
              La operación puede tardar unos segundos.
            </Text>
          </View>
        </CustomPopup>

        <MediaImportProgressOverlay
          visible={isArchiveLoading}
          title={archiveLoadingTitle}
          progress={{
            completed: 0,
            total: 1,
            currentFileName: archiveLoadingText,
          }}
          showProgress={false}
        />

        {selectedMediaId && (
          <MediaHost
            items={mediaItems}
            initialFileId={selectedMediaId}
            onClose={() => setSelectedMediaId(null)}
          />
        )}

        {currentData && (
          <PropertyMenu
            item={currentData}
            visible={showPropertyMenu}
            onClose={closePropertyMenu}
          />
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const useGalleryStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: SPACING_HORIZONTAL_SM,
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
      paddingHorizontal: theme.spacing.sm,
    },
    headerActions: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerTitleText: {
      fontSize: 24,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    iconColor: {
      color: theme.colors.textPrimary,
    },
    gridContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    thumbPressable: {
      flex: 1,
      borderRadius: theme.effects.radius.md,
      overflow: "hidden",
      backgroundColor: theme.colors.subCard,
      borderWidth: 2,
      borderColor: "transparent",
    },
    thumbPressableSelected: {
      borderColor: theme.colors.primary,
    },
    thumbAnimatedWrapper: {
      flex: 1,
    },
    thumb: {
      flex: 1,
      borderRadius: 4,
    },
    selectionBadge: {
      position: "absolute",
      top: theme.spacing.xs,
      right: theme.spacing.xs,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 2,
    },
    videoInfo: {
      position: "absolute",
      display: "flex",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      bottom: 4,
      left: 8,
    },
    videoDurationText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: theme.typography.fontSize.sm,
      color: "#FFFFFF",
    },
    emptyAlbumContainer: {
      flex: 1,
      alignItems: "center",
    },
    emptyFolderIconContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xxl,
    },
    emptyFolderText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: 16,
    },
    volverButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      alignSelf: "center",
      justifyContent: "flex-end",
      paddingVertical: theme.spacing.md,
      marginBottom: 126,
      width: "80%",
    },
    volverText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    primaryColor: {
      color: theme.colors.primary,
    },
    selectionActionBar: {
      ...cardShadow(theme),
      position: "absolute",
      left: theme.spacing.md,
      right: theme.spacing.md,
      flexDirection: "row",
      alignItems: "stretch",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.effects.radius.lg,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      overflow: "hidden",
    },
    selectionActionButton: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
    },
    selectionActionLabel: {
      fontFamily: theme.typography.fontFamily.primary.medium,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    selectionActionDivider: {
      width: theme.effects.borderWidth.xs,
      backgroundColor: theme.colors.borderSoft,
    },
    popupMessage: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    popupCheckboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    popupCheckboxRowDisabled: {
      opacity: 0.6,
    },
    popupCheckboxLabel: {
      fontFamily: theme.typography.fontFamily.primary.medium,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    popupFooterButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    popupCancelButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
    },
    popupCancelButtonText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textSecondary,
    },
    popupConfirmButton: {
      backgroundColor: theme.colors.error,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
    },
    popupConfirmButtonDisabled: {
      opacity: 0.5,
    },
    popupConfirmButtonText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textOnColor,
    },
    popupLoadingContent: {
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    popupLoadingText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 15,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    popupLoadingProgress: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 14,
      color: theme.colors.primary,
      textAlign: "center",
    },
    popupLoadingHint: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  }));
};
