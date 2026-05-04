import { MediaHost } from "@/components/media";
import type { MediaHostItem } from "@/types/media/viewers";
import { useStyles, useSelection, useFileSystem, useAlert } from "@/hooks";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, TouchableOpacity, View, Text } from "react-native";
import {
  ContextMenu,
  MultiActionButton,
  OptionDropDown,
  PropertyMenu,
  SortDropDown,
  ViewCards,
  ViewDropDown,
} from "@/components";
import { FileModel } from "@/models/file";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { cardShadow } from "@/constants/styles/shadows";
import EmptyFolder from "@/components/svgIcons/emptyFolder";
import { useFilesInTag } from "@/hooks/tags/useFilesInTag";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContentTagActions } from "@/hooks/tags/useContentTagActions";
import { useTagContentStore } from "@/stores/useTagContentStore";

export default function TagsContent() {
  const [showMenu, setShowMenu] = useState(false);
  const [clickedItem, setClickedItem] = useState<FileModel | null>(null);
  const [menuPosition, setMenuPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [showItemPropertyMenu, setShowItemPropertyMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaHostItem[] | null>(null);

  const { tagId, tagName } = useLocalSearchParams();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const styles = useTagsContentStyles();

  const storeItems = useTagContentStore((s) => s.items);

  const {
    loadMore,
    sortedItems,
    loading,
    selectedView,
    orderBy,
    sortValue,
    viewOptions,
    gridConfig,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  } = useFilesInTag({ tagId: tagId as string });

  const {
    itemsSelected,
    selectionMode,
    toggleSelection,
    clearSelection,
    currentData: currentTagData,
    showPropertyMenu: showTagPropertyMenu,
    closePropertyMenu: closeTagPropertyMenu,
    handleOnSelectOption,
  } = useSelection(storeItems, tagId as string, "tag");

  const { handleRename, handleShare, handleDeleteElements } =
    useContentTagActions({
      tagId: tagId as string,
      clickedItem,
      itemsSelected,
      clearSelection,
      setIsRenaming,
    });

  const fs = useFileSystem();

  const menuOptions = useMemo(
    () => [
      {
        hierarchy: "1",
        label: "Abrir",
        onPress: () => {
          handleOpenItem(clickedItem!);
        },
        disabled: false,
        icon: (
          <MaterialCommunityIcons
            name="open-in-app"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "2",
        label: "Abrir con",
        onPress: () => {},
        disabled: false,
        icon: (
          <MaterialCommunityIcons
            name="folder"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "3",
        label: "Compartir con",
        onPress: () => {
          clickedItem && handleShare(clickedItem);
        },
        disabled: false,
        icon: (
          <MaterialCommunityIcons
            name="share"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "4",
        label: "Agregar a favoritos",
        onPress: () => {},
        disabled: false,
        icon: (
          <MaterialCommunityIcons
            name="star"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "5",
        label: "Renombrar",
        onPress: () => {
          setIsRenaming(true);
        },
        disabled: false,
        icon: (
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },

      {
        hierarchy: "6",
        label: "Eliminar",
        onPress: () => {
          clickedItem && handleDeleteElements([clickedItem]);
        },
        disabled: false,
        icon: (
          <MaterialCommunityIcons
            name="delete"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "7",
        label: "Propiedades",
        onPress: () => {
          setShowItemPropertyMenu(true);
        },
        disabled: false,
        icon: (
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
    ],
    [clickedItem],
  );

  const handleOpenItem = (item: FileModel) => {
    const uri = item.storageUrl ?? item.path;

    if (!fs.fileExists(uri)) {
      console.error("[handleOpenItem] File not found:", uri);
      console.error("[handleOpenItem] storageUrl:", item.storageUrl);
      console.error("[handleOpenItem] path:", item.path);

      showAlert({
        title: "Error",
        message:
          "No se pudo abrir el archivo porque no se encontró en el dispositivo.",
      });
      return;
    }

    if (
      item.category !== "image" &&
      item.category !== "video" &&
      item.category !== "audio"
    ) {
      return;
    }

    const mediaItem: MediaHostItem = {
      uri,
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
    };

    setActiveMedia([mediaItem]);
  };

  const renderGroupButtons = () => {
    if (selectionMode) {
      return (
        <>
          <MultiActionButton
            icon={"search-outline"}
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => {}}
          />
          <MultiActionButton
            icon={"trash-outline"}
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => handleDeleteElements()}
          />
          <OptionDropDown size={42} onSelect={handleOnSelectOption} />
        </>
      );
    } else {
      return (
        <>
          <MultiActionButton
            icon={"search-outline"}
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => /*handlePaste()*/ {}}
          />
          <SortDropDown
            size={42}
            onChangeOrderBy={async (ob) => await handleSortItems(sortValue, ob)}
            onChangeSortValue={async (sv) => await handleSortItems(sv, orderBy)}
            defaultOrderByValue={orderBy}
            defaultSortValue={sortValue}
          />
          <ViewDropDown
            size={42}
            onChange={async (selectedMode) =>
              await handleViewModeChange(selectedMode.id)
            }
            defaultValue={selectedView}
            viewOptions={viewOptions}
            onViewOptionsChange={handleViewOptionsChange}
          />
          <OptionDropDown size={42} onSelect={handleOnSelectOption} />
        </>
      );
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MultiActionButton
            icon={"chevron-back"}
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => {
              clearSelection();
              router.back();
            }}
          />
        </View>

        <View style={styles.buttonsGroup}>{renderGroupButtons()}</View>
      </View>

      <View style={styles.headerBreadcrumb}>
        <Text style={styles.headerBreadcrumbText}>{tagName}</Text>
      </View>

      {loading ? (
        <View
          style={[styles.footerEmptyContainer, { justifyContent: "center" }]}
        >
          <ActivityIndicator
            size="large"
            color={styles.iconColor.primaryColor}
          />
        </View>
      ) : sortedItems.length === 0 ? (
        <View style={styles.footerEmptyContainer}>
          <View style={styles.emptyFolderIconContainer}>
            <EmptyFolder
              strokeWidth={0.35}
              width={120}
              height={120}
              folderColor={styles.iconColor.color}
              crossColor={styles.iconColor.primaryColor}
            />
            <Text style={styles.emptyFolderText}>La etiqueta está vacía</Text>
          </View>
          <TouchableOpacity
            style={styles.volverButton}
            onPress={() => router.back()}
          >
            <Text style={styles.volverText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlashList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          key={`${selectedView}-${gridConfig.columns}`}
          numColumns={gridConfig.columns}
          onScroll={() => setShowMenu(false)}
          onEndReachedThreshold={0.7}
          onEndReached={loadMore}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ViewCards
                data={item}
                viewConfig={selectedView}
                viewOptions={viewOptions}
                selected={itemsSelected.some((i) => i.id === item.id)}
                selectionMode={selectionMode}
                isRenaming={clickedItem?.id === item.id ? isRenaming : false}
                onRename={handleRename}
                onRenameCancel={() => setIsRenaming(false)}
                onPress={() => {
                  selectionMode ? toggleSelection(item) : handleOpenItem(item);
                }}
                onDoublePress={(position) => {
                  setClickedItem(item);
                  setMenuPosition(position);
                  setShowMenu(true);
                }}
                onLongPress={() => toggleSelection(item)}
              />
            </View>
          )}
          contentContainerStyle={styles.flatListContent}
        />
      )}

      <ContextMenu
        options={menuOptions}
        visible={showMenu}
        onDismiss={() => setShowMenu(false)}
        position={menuPosition}
      />

      {clickedItem && (
        <PropertyMenu
          item={clickedItem}
          visible={showItemPropertyMenu}
          onClose={() => setShowItemPropertyMenu(false)}
        />
      )}

      {currentTagData && (
        <PropertyMenu
          item={currentTagData}
          visible={showTagPropertyMenu}
          onClose={closeTagPropertyMenu}
        />
      )}

      <MediaHost items={activeMedia} onClose={() => setActiveMedia(null)} />
    </View>
  );
}

const useTagsContentStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 24,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconColor: {
      color: theme.colors.textPrimary,
      primaryColor: theme.colors.primary,
    },
    buttonsGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    headerBreadcrumb: {
      alignItems: "center",
      marginVertical: theme.spacing.sm,
    },
    cardWrapper: {
      flex: 1,
      alignItems: "center",
      paddingBottom: theme.spacing.sm,
    },
    volverButton: {
      ...cardShadow(theme),
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
    emptyFolderIconContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyFolderText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: 16,
    },
    footerEmptyContainer: {
      flex: 1,
      alignItems: "center",
    },
    flatListContent: {
      paddingBottom: 120,
      gap: 10,
      padding: 16,
    },
    headerBreadcrumbText: {
      fontSize: 34,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
  }));
};
