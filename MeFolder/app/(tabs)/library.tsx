import {
  ViewDropDown,
  ViewCards,
  ItemCreator,
  MultiActionButton,
  SearchBox,
  ContextMenu,
  Breadcrumb,
  OptionDropDown,
  PropertyMenu,
  MediaHost,
  CustomPopup,
  MediaImportProgressOverlay,
} from "@/components";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Keyboard,
  Pressable,
} from "react-native";
import { useNavigationStore } from "@/stores";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FileModel, FolderModel } from "@/models";
import type { MediaHostItem } from "@/types/media/viewers";
import { useLibraryStyles } from "@/screenStyles/libraryStyle";
import EmptyFolder from "@/components/svgIcons/emptyFolder";
import { SortDropDown } from "@/components/SortDropDown";
import {
  useLibraryContent,
  useLibraryActions,
  useLibraryArchiveActions,
} from "@/hooks/library";
import { useFileSystem, useSearch, useSelection } from "@/hooks";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { ArchiveFormat } from "@/types";

export default function LibraryScreen() {
  const [creatorVisible, setCreatorVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
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
  const [showItemPropertyMenu, setShowItemPropertyMenu] = useState(false);
  const [activeMedia, setActiveMedia] = useState<MediaHostItem[] | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const { currentFolderId, navigateTo, currentFolderName, navigateBack } =
    useNavigationStore();

  const {
    items,
    sortedItems,
    loading,
    selectedView,
    orderBy,
    sortValue,
    viewOptions,
    gridConfig,
    folderService,
    fileService,
    handleSortItems,
    handleViewModeChange,
    handleViewOptionsChange,
  } = useLibraryContent();

  const {
    itemsSelected,
    selectionMode,
    toggleSelection,
    clearSelection,
    currentData: currentFolderData,
    showPropertyMenu,
    closePropertyMenu,
    handleOnSelectOption,
  } = useSelection(items, currentFolderId);

  const {
    handleShare,
    handleDeleteElements,
    handleSaveFile,
    handleSaveFolder,
    handleRename,
    handleCopy,
    handleCut,
    handlePaste,
    handleMakeFavorite,
    hasItems,
  } = useLibraryActions({
    folderService,
    fileService,
    clickedItem,
    itemsSelected,
    clearSelection,
    setIsRenaming,
  });
  const {
    archiveDialog,
    archiveLoading,
    closeArchiveDialog,
    confirmArchiveAction,
    requestCompressItem,
    requestExtractItem,
    setExtractHere,
  } = useLibraryArchiveActions();

  const styles = useLibraryStyles();
  const fs = useFileSystem();
  const { handleSearch, clearSearch, isSearching, isSearchActive } =
    useSearch("");

  const dismissSearchFocus = useCallback(() => {
    if (isSearchExpanded) {
      Keyboard.dismiss();
    }
  }, [isSearchExpanded]);

  useEffect(() => {
    if (selectionMode) {
      if (isSearchExpanded) {
        setIsSearchExpanded(false);
      }

      if (isSearchActive) {
        clearSearch();
      }
    }
  }, [selectionMode, isSearchExpanded, isSearchActive, clearSearch]);

  useEffect(() => {
    clearSearch();
    setIsSearchExpanded(false);
  }, [currentFolderId, clearSearch]);

  const handleOpenItem = (item: FileModel | FolderModel) => {
    if (item instanceof FolderModel) {
      navigateTo(item.id, item.name);
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

  const validarComprimir = useCallback(
    (item: FileModel | FolderModel | null) => {
      if (!item) return false;

      if (item instanceof FolderModel) return true;

      const archiveExtensions: readonly ArchiveFormat[] = [
        "zip",
        "rar",
        "7z",
        "tar",
        "gz",
      ];

      return !archiveExtensions.includes(item.extension as ArchiveFormat);
    },
    [],
  );

  const handleCompressWrapper = useCallback(() => {
    if (!clickedItem) return;

    setShowMenu(false);
    requestCompressItem(clickedItem);
  }, [clickedItem, requestCompressItem]);

  const handleExtractWrapper = useCallback(() => {
    if (!(clickedItem instanceof FileModel)) return;

    setShowMenu(false);
    requestExtractItem(clickedItem);
  }, [clickedItem, requestExtractItem]);

  const handleArchiveMenuAction = useCallback(() => {
    if (!clickedItem) return;

    if (validarComprimir(clickedItem)) {
      handleCompressWrapper();
      return;
    }

    handleExtractWrapper();
  }, [
    clickedItem,
    handleCompressWrapper,
    handleExtractWrapper,
    validarComprimir,
  ]);

  const menuOptions = useMemo(
    () => [
      {
        hierarchy: "1",
        label: "Abrir",
        onPress: () => {
          handleOpenItem(clickedItem!);
        },
        disabled: false,
        visible: true,
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
        label: "Copiar",
        onPress: () => {
          clickedItem && handleCopy([clickedItem]);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons
            name="content-copy"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "6",
        label: "Cortar",
        onPress: () => {
          clickedItem && handleCut([clickedItem]);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons
            name="content-cut"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "7",
        label: "Pegar",
        onPress: () => {
          handlePaste();
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons
            name="content-paste"
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "8",
        label: validarComprimir(clickedItem) ? "Comprimir" : "Descomprimir",
        onPress: handleArchiveMenuAction,
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons
            name={validarComprimir(clickedItem) ? "zip-box" : "folder-download"}
            size={20}
            color={styles.iconColor.primaryColor}
          />
        ),
      },
      {
        hierarchy: "9",
        label: "Eliminar",
        onPress: () => {
          clickedItem && handleDeleteElements([clickedItem]);
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
        hierarchy: "10",
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
    [
      clickedItem,
      handleArchiveMenuAction,
      styles.iconColor.primaryColor,
      validarComprimir,
    ],
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
                const fileIds = itemsSelected
                  .filter((i) => i instanceof FileModel)
                  .map((f) => f.id)
                  .join(",");
                router.push({ pathname: "/tag-adder", params: { fileIds } });
              }}
            />
          )}
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
          <SearchBox
            placeholder="Buscar en biblioteca..."
            iconSize={22}
            collapsible
            onSearch={async (query) => {
              const results = await handleSearch(query);

              return results.map((item) => ({
                id: item.id,
                name: item.name,
                type: item instanceof FolderModel ? "folder" : "file",
              }));
            }}
            onClear={clearSearch}
            onExpandedChange={setIsSearchExpanded}
          />

          {!isSearchExpanded && (
            <>
              <MultiActionButton
                icon={"add"}
                backgroundColor="transparent"
                iconColor={styles.iconColor.color}
                size={42}
                onPress={() => setCreatorVisible(true)}
              />
              {hasItems() === true && (
                <MultiActionButton
                  icon={"content-paste"}
                  backgroundColor="transparent"
                  iconColor={styles.iconColor.color}
                  size={42}
                  onPress={() => handlePaste()}
                />
              )}
              <SortDropDown
                size={42}
                onChangeOrderBy={async (ob) =>
                  await handleSortItems(sortValue, ob)
                }
                onChangeSortValue={async (sv) =>
                  await handleSortItems(sv, orderBy)
                }
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
          )}
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {currentFolderId !== "sys_root" && (
            <MultiActionButton
              icon={"chevron-back"}
              backgroundColor="transparent"
              iconColor={styles.iconColor.color}
              size={42}
              onPress={() => {
                clearSelection();
                navigateBack();
              }}
            />
          )}
        </View>

        <View
          style={[
            styles.buttonsGroup,
            isSearchExpanded && styles.buttonsGroupSearchExpanded,
          ]}
        >
          {renderGroupButtons()}
        </View>
      </View>

      <View style={styles.headerBreadcrumb} onTouchStart={dismissSearchFocus}>
        <Text style={styles.headerBreadcrumbText}>{currentFolderName}</Text>
        <Breadcrumb />
      </View>

      <ItemCreator
        visible={creatorVisible}
        onClose={() => setCreatorVisible(false)}
        currentFolderId={currentFolderId}
        onSaveFile={(data) => {
          handleSaveFile(data);
          setCreatorVisible(false);
        }}
        onSaveFolder={(data) => {
          handleSaveFolder(data);
          setCreatorVisible(false);
        }}
      />
      {loading || isSearching ? (
        <View
          style={[styles.footerEmptyContainer, { justifyContent: "center" }]}
          onTouchStart={dismissSearchFocus}
        >
          <ActivityIndicator
            size="large"
            color={styles.iconColor.primaryColor}
          />
        </View>
      ) : sortedItems.length === 0 ? (
        <View
          style={styles.footerEmptyContainer}
          onTouchStart={dismissSearchFocus}
        >
          <View style={styles.emptyFolderIconContainer}>
            <EmptyFolder
              strokeWidth={0.35}
              width={120}
              height={120}
              folderColor={styles.iconColor.color}
              crossColor={styles.iconColor.primaryColor}
            />
            <Text style={styles.emptyFolderText}>
              {isSearchActive
                ? "No se encontraron resultados"
                : "La carpeta está vacía"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.volverButton}
            onPress={() => {
              clearSelection();
              navigateBack();
            }}
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
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onTouchStart={dismissSearchFocus}
          onScrollBeginDrag={dismissSearchFocus}
          onScroll={() => setShowMenu(false)}
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

      {currentFolderData && (
        <PropertyMenu
          item={currentFolderData}
          visible={showPropertyMenu}
          onClose={closePropertyMenu}
        />
      )}

      <CustomPopup
        title={
          archiveDialog.action === "compress"
            ? "Confirmar compresión"
            : "Confirmar extracción"
        }
        isVisible={archiveDialog.isVisible}
        onDismiss={closeArchiveDialog}
      >
        <Text style={styles.popupMessage}>
          {archiveDialog.action === "compress"
            ? `Se va a comprimir ${archiveDialog.item?.name ?? "el elemento seleccionado"}.`
            : `Se va a proceder a descomprimir ${archiveDialog.item?.name ?? "el archivo seleccionado"}.`}
        </Text>

        {archiveDialog.action === "extract" ? (
          <Pressable
            style={styles.popupCheckboxRow}
            onPress={() => setExtractHere(!archiveDialog.extractHere)}
          >
            <MaterialCommunityIcons
              name={
                archiveDialog.extractHere
                  ? "checkbox-marked-outline"
                  : "checkbox-blank-outline"
              }
              size={22}
              color={styles.iconColor.primaryColor}
            />
            <Text style={styles.popupCheckboxLabel}>Extraer aquí</Text>
          </Pressable>
        ) : null}

        <View style={styles.popupFooterButtons}>
          <TouchableOpacity
            style={styles.popupCancelButton}
            onPress={closeArchiveDialog}
          >
            <Text style={styles.popupCancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.popupConfirmButton}
            onPress={() => {
              void confirmArchiveAction();
            }}
          >
            <Text style={styles.popupConfirmButtonText}>Confirmar</Text>
          </TouchableOpacity>
        </View>
      </CustomPopup>

      <MediaImportProgressOverlay
        visible={archiveLoading.isVisible}
        title={archiveLoading.title}
        progress={{
          completed: archiveLoading.progress?.processedEntries ?? 0,
          total: Math.max(archiveLoading.progress?.totalEntries ?? 0, 1),
          currentFileName:
            archiveLoading.progress?.currentEntryName ?? archiveLoading.message,
        }}
        showProgress={archiveLoading.showProgress}
      />

      <MediaHost items={activeMedia} onClose={() => setActiveMedia(null)} />
    </View>
  );
}
