import {
  ViewDropDown,
  ViewCards,
  ItemCreator,
  MultiActionButton,
  ContextMenu,
  Breadcrumb,
  OptionDropDown,
  PropertyMenu,
  ImageViewer,
  AudioPlayer,
  VideoPlayer,
} from "@/components";
import React, { useMemo, useState } from "react";
import { View, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { useNavigationStore } from "@/stores";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FileModel, FolderModel } from "@/models";
import type { MediaSource } from "@/types/media/viewers";
import { useLibraryStyles } from "@/screenStyles/libraryStyle";
import EmptyFolder from "@/components/svgIcons/emptyFolder";
import { SortDropDown } from "@/components/SortDropDown";
import { useLibraryContent, useLibraryActions } from "@/hooks/library";
import { useFileSystem, useSelection } from "@/hooks";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";

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
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerSource, setViewerSource] = useState<MediaSource | null>(null);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [audioPlayerSource, setAudioPlayerSource] =
    useState<MediaSource | null>(null);
  const [videoPlayerSource, setVideoPlayerSource] =
    useState<MediaSource | null>(null);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);

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
    handleOnSelectOption,
  } = useSelection(items);

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
  } = useLibraryActions({
    folderService,
    fileService,
    clickedItem,
    itemsSelected,
    clearSelection,
    setIsRenaming,
  });

  const { currentFolderId, navigateTo, currentFolderName, navigateBack } =
    useNavigationStore();
  const styles = useLibraryStyles();
  const fs = useFileSystem();

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

      const source: MediaSource = {
        uri,
        fileId: item.id,
        ...(item.metadata.mimeType != null && {
          mimeType: item.metadata.mimeType,
        }),
        displayName: item.name,
      };

      switch (item.category) {
        case "image":
          setViewerSource(source);
          setViewerVisible(true);
          break;
        case "video":
          setVideoPlayerSource(source);
          setVideoPlayerVisible(true);
          break;
        case "audio":
          setAudioPlayerSource(source);
          setAudioPlayerVisible(true);
          break;
        default:
          break;
      }
    }
  };

  const menuOptions = useMemo(
    () => [
      {
        hierarchy: "1",
        label: "Abrir",
        onPress: () => {
          handleOpenItem(clickedItem!);
          setShowMenu(false);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons name="open-in-app" size={20} color="black" />
        ),
      },
      {
        hierarchy: "2",
        label: "Abrir con",
        onPress: () => {},
        disabled: false,
        visible: true,
        icon: <MaterialCommunityIcons name="folder" size={20} color="black" />,
      },
      {
        hierarchy: "3",
        label: "Compartir con",
        onPress: () => {
          clickedItem && handleShare(clickedItem);
        },
        disabled: false,
        visible: true,
        icon: <MaterialCommunityIcons name="share" size={20} color="black" />,
      },
      {
        hierarchy: "4",
        label: "Agregar a favoritos",
        onPress: () => {
          setShowMenu(false);
          clickedItem && handleMakeFavorite(clickedItem as FileModel);
        },
        disabled: false,
        visible: clickedItem instanceof FileModel,
        icon: <MaterialCommunityIcons name="star" size={20} color="black" />,
      },
      {
        hierarchy: "5",
        label: "Renombrar",
        onPress: () => {
          setShowMenu(false);
          setIsRenaming(true);
        },
        disabled: false,
        visible: true,
        icon: <MaterialCommunityIcons name="pencil" size={20} color="black" />,
      },
      {
        hierarchy: "6",
        label: "Copiar",
        onPress: () => {
          clickedItem && handleCopy([clickedItem]);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons name="content-copy" size={20} color="black" />
        ),
      },
      {
        hierarchy: "7",
        label: "Cortar",
        onPress: () => {
          clickedItem && handleCut([clickedItem]);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons name="content-cut" size={20} color="black" />
        ),
      },
      {
        hierarchy: "8",
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
            color="black"
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
        icon: <MaterialCommunityIcons name="delete" size={20} color="black" />,
      },
      {
        hierarchy: "10",
        label: "Propiedades",
        onPress: () => {
          setShowPropertyMenu(true);
          setShowMenu(false);
        },
        disabled: false,
        visible: true,
        icon: (
          <MaterialCommunityIcons name="information" size={20} color="black" />
        ),
      },
    ],
    [clickedItem],
  );

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
          <MultiActionButton
            icon={"search-outline"}
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => handlePaste()}
          />
          <MultiActionButton
            icon={"add"}
            backgroundColor="transparent"
            iconColor={styles.iconColor.color}
            size={42}
            onPress={() => setCreatorVisible(true)}
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

        <View style={styles.buttonsGroup}>{renderGroupButtons()}</View>
      </View>

      <View style={styles.headerBreadcrumb}>
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
            <Text style={styles.emptyFolderText}>La carpeta está vacía</Text>
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
          visible={showPropertyMenu}
          onClose={() => setShowPropertyMenu(false)}
        />
      )}

      {viewerSource && (
        <ImageViewer
          source={viewerSource}
          visible={viewerVisible}
          onClose={() => {
            setViewerVisible(false);
            setViewerSource(null);
          }}
        />
      )}

      {audioPlayerSource && (
        <AudioPlayer
          source={audioPlayerSource}
          visible={audioPlayerVisible}
          onClose={() => {
            setAudioPlayerVisible(false);
            setAudioPlayerSource(null);
          }}
        />
      )}

      {videoPlayerSource && (
        <VideoPlayer
          source={videoPlayerSource}
          visible={videoPlayerVisible}
          onClose={() => {
            setVideoPlayerVisible(false);
            setVideoPlayerSource(null);
          }}
        />
      )}
    </View>
  );
}
