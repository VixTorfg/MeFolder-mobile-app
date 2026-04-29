import { VideoPlayer, AudioPlayer, ImageViewer } from "@/components/media";
import { MediaSource } from "@/types/media/viewers";
import { useStyles, useSelection, useFileSystem, useAlert } from "@/hooks";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useRef, useState } from "react";
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

export default function tagsContent() {
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
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerSource, setViewerSource] = useState<MediaSource | null>(null);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [videoPlayerSource, setVideoPlayerSource] =
    useState<MediaSource | null>(null);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [audioPlayerSource, setAudioPlayerSource] =
    useState<MediaSource | null>(null);
  const itemRefs = useRef<Map<string, View>>(new Map());

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
          setShowMenu(false);
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
          setShowMenu(false);
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
          setShowMenu(false);
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
          setShowMenu(false);
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

  const handleElementPress = (item: FileModel) => {
    setClickedItem(item);
    const ref = itemRefs.current.get(item.id);
    ref?.measureInWindow((x, y, width, height) => {
      setMenuPosition({ x, y, width, height });
      setShowMenu(true);
    });
  };

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
            <View
              style={styles.cardWrapper}
              ref={(el) => {
                if (el) itemRefs.current.set(item.id, el);
              }}
            >
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
                onDoublePress={() => {
                  setClickedItem(item);
                  const ref = itemRefs.current.get(item.id);
                  ref?.measureInWindow((x, y, width, height) => {
                    setMenuPosition({ x, y, width, height });
                    setShowMenu(true);
                  });
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
