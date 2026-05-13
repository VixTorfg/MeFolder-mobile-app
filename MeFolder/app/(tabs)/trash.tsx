import {
  ViewDropDown,
  ViewCards,
  MultiActionButton,
  OptionDropDown,
  SortDropDown,
  ContextMenu,
  MediaHost,
  PropertyMenu,
} from "@/components";
import { FileModel, FolderModel } from "@/models";
import {
  useAlert,
  useFileSystem,
  useSelection,
  useTrashActions,
} from "@/hooks";
import type { MediaHostItem } from "@/types/media/viewers";
import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTrashContent } from "@/hooks/trash/useTrashContent";
import { router } from "expo-router";
import EmptyFolder from "@/components/svgIcons/emptyFolder";
import { FlashList } from "@shopify/flash-list";
import { useTrashStyles } from "@/screenStyles/trashStyle";

export default function TrashScreen() {
  const [showMenu, setShowMenu] = useState(false);
  const [showItemPropertyMenu, setShowItemPropertyMenu] = useState(false);
  const [clickedItem, setClickedItem] = useState<
    FileModel | FolderModel | null
  >(null);
  const [menuPosition, setMenuPosition] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [isRenaming, setIsRenaming] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaHostItem[] | null>(null);

  const { showAlert } = useAlert();
  const fs = useFileSystem();
  const styles = useTrashStyles();

  const {
    items,
    loading,
    viewOptions,
    gridConfig,
    selectedView,
    sortedItems,
    sortValue,
    orderBy,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  } = useTrashContent();

  const {
    itemsSelected,
    selectionMode,
    toggleSelection,
    clearSelection,
    handleOnSelectOption,
  } = useSelection(items);

  const {
    handlePermanentDelete,
    handleRestoreSelected,
    handleEmptyTrash,
    handleRestoreAll,
    handleRename,
    handleShare,
    handleMakeFavorite,
  } = useTrashActions(
    itemsSelected,
    clearSelection,
    clickedItem,
    setIsRenaming,
  );

  const handleOpenItem = (item: FileModel | FolderModel) => {
    if (item instanceof FolderModel) {
      showAlert({
        title: "Restaurar o eliminar",
        message: "¿Desea restaurar o eliminar esta carpeta?",
        buttons: [
          {
            text: "Restaurar",
            onPress: () => {
              handleRestoreSelected();
              clearSelection();
            },
          },
          {
            text: "Eliminar",
            onPress: () => {
              handlePermanentDelete();
              clearSelection();
            },
            style: "destructive",
          },
          {
            text: "Cancelar",
            style: "cancel",
          },
        ],
      });
    } else {
      const uri = item.storageUrl ?? item.path;

      if (!fs.fileExists(uri)) {
        console.error("[handleOpenItem] File not found:", uri);
        console.error("[handleOpenItem] storageUrl:", item.storageUrl);
        console.error("[handleOpenItem] path:", item.path);
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
    }
  };

  const renderTrashItem = useCallback(
    ({ item }: { item: FileModel | FolderModel }) => (
      <View style={styles.cardWrapper}>
        <ViewCards
          data={item}
          viewConfig={selectedView}
          viewOptions={viewOptions}
          selected={itemsSelected.some(
            (selectedItem) => selectedItem.id === item.id,
          )}
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
    ),
    [
      clickedItem?.id,
      handleOpenItem,
      handleRename,
      isRenaming,
      itemsSelected,
      selectedView,
      selectionMode,
      styles.cardWrapper,
      toggleSelection,
      viewOptions,
    ],
  );

  const handleListScrollBeginDrag = useCallback(() => {
    setShowMenu(false);
  }, []);

  const menuOptions = useMemo(
    () => [
      {
        hierarchy: "1",
        label: "Abrir",
        onPress: () => {
          handleOpenItem(clickedItem!);
        },
        disabled: false,
        visible: clickedItem instanceof FileModel,
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
        label: "Compartir con",
        onPress: () => {
          clickedItem && handleShare(clickedItem);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons
            name="share"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "3",
        label: "Agregar a favoritos",
        onPress: () => {
          clickedItem && handleMakeFavorite(clickedItem as FileModel);
        },
        disabled: false,
        visible: clickedItem instanceof FileModel,
        icon: (
          <MaterialCommunityIcons
            name="star"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "4",
        label: "Renombrar",
        onPress: () => {
          setIsRenaming(true);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons
            name="pencil"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "5",
        label: "Eliminar",
        onPress: () => {
          clickedItem && handlePermanentDelete([clickedItem]);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons
            name="delete"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "6",
        label: "Restaurar",
        onPress: () => {
          clickedItem && handleRestoreSelected([clickedItem]);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons
            name="restore"
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
        visible: true,
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

  const renderGroupButtons = () => {
    if (selectionMode) {
      return (
        <>
          {!itemsSelected.some((i) => i instanceof FolderModel) && (
            <MultiActionButton
              icon={"bookmark-plus-outline"}
              backgroundColor="transparent"
              iconColor={styles.iconColor.color}
              size={44}
              onPress={() => {
                const fileIds: string[] = [];

                for (const item of itemsSelected) {
                  if (item instanceof FileModel) {
                    fileIds.push(item.id);
                  }
                }

                router.push({
                  pathname: "/tag-adder",
                  params: { fileIds: fileIds.join(",") },
                });
              }}
            />
          )}

          <MultiActionButton
            icon={"trash-outline"}
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => handlePermanentDelete()}
          />
          <MultiActionButton
            icon={"restore"}
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => handleRestoreSelected()}
          />

          <OptionDropDown
            size={42}
            showProperties={false}
            onSelect={handleOnSelectOption}
          />
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
            onPress={() => {}}
          />
          {itemsSelected.length >= 1 && (
            <>
              <MultiActionButton
                icon={"restore"}
                backgroundColor="transparent"
                iconColor={styles.iconColor.color}
                size={42}
                onPress={() => handleRestoreAll()}
              />
              <MultiActionButton
                icon={"trash-outline"}
                backgroundColor="transparent"
                iconColor={styles.iconColor.color}
                size={42}
                onPress={() => handleEmptyTrash()}
              />{" "}
            </>
          )}
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
          <OptionDropDown
            size={42}
            showProperties={false}
            onSelect={handleOnSelectOption}
          />
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.buttonsGroup}>{renderGroupButtons()}</View>
      </View>

      <View style={styles.headerBreadcrumb}>
        <Text style={styles.headerBreadcrumbText}>Papelera</Text>
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
            <Text style={styles.emptyFolderText}>La papelera está vacía</Text>
          </View>
        </View>
      ) : (
        <FlashList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          key={`${selectedView}-${gridConfig.columns}`}
          numColumns={gridConfig.columns}
          onScrollBeginDrag={handleListScrollBeginDrag}
          renderItem={renderTrashItem}
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

      <MediaHost items={activeMedia} onClose={() => setActiveMedia(null)} />
    </View>
  );
}
