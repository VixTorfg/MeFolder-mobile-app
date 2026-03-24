import { ViewDropDown, ViewCards, ItemCreator, MultiActionButton, ContextMenu, Breadcrumb, OptionDropDown, PropertyMenu } from '@/components';
import React, { useMemo, useRef, useState } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { useNavigationStore } from '@/stores';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FileModel, FolderModel } from '@/models';
import { useLibraryStyles } from '@/screenStyles/libraryStyle';
import EmptyFolder from '@/components/svgIcons/emptyFolder';
import { SortDropDown } from '@/components/SortDropDown';
import { useLibraryContent, useLibrarySelection, useLibraryActions } from '@/hooks/library';

export default function LibraryScreen() {
  const [creatorVisible, setCreatorVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [clickedItem, setClickedItem] = useState<FileModel | FolderModel | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [showPropertyMenu, setShowPropertyMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const itemRefs = useRef<Map<string, View>>(new Map());

  const {
    items,
    sortedItems,
    isEmpty,
    selectedView,
    orderBy,
    sortValue,
    gridConfig,
    folderService,
    fileService,
    handleSortItems,
    handleViewModeChange,
  } = useLibraryContent();

  const {
    itemsSelected,
    selectionMode,
    toggleSelection,
    clearSelection,
    handleOnSelectOption,
  } = useLibrarySelection(items);

  const {
    handleShare,
    handleDeleteElements,
    handleSaveFile,
    handleSaveFolder,
    handleRename,
    handleCopy,
    handleCut,
    handlePaste,
  } = useLibraryActions({
    folderService,
    fileService,
    clickedItem,
    itemsSelected,
    clearSelection,
    setIsRenaming,
  });

  const { currentFolderId, navigateTo, currentFolderName, navigateBack } = useNavigationStore();
  const styles = useLibraryStyles();

  const handleElementPress = (item: FileModel | FolderModel) => {
    if (item instanceof FolderModel) {
      clearSelection();
      navigateTo(item.id, item.name);
    } else {
      setClickedItem(item);
      const ref = itemRefs.current.get(item.id);
      ref?.measureInWindow((x, y, width, height) => {
        setMenuPosition({ x, y, width, height });
        setShowMenu(true);
      });
    }
  };

  const menuOptions = useMemo(() => [
    { hierarchy: '1', label: 'Abrir', onPress: () => {}, disabled: false, icon: <MaterialCommunityIcons name="open-in-app" size={20} color="black" /> },
    { hierarchy: '2', label: 'Abrir con', onPress: () => {}, disabled: false, icon: <MaterialCommunityIcons name="folder" size={20} color="black" /> },
    { hierarchy: '3', label: 'Compartir con', onPress: () => { clickedItem && handleShare(clickedItem); }, disabled: false, icon: <MaterialCommunityIcons name="share" size={20} color="black" /> },
    { hierarchy: '4', label: 'Agregar a favoritos', onPress: () => {}, disabled: false, icon: <MaterialCommunityIcons name="star" size={20} color="black" /> },
    { hierarchy: '5', label: 'Renombrar', onPress: () => {
      setShowMenu(false);
      setIsRenaming(true);
    }, disabled: false, icon: <MaterialCommunityIcons name="pencil" size={20} color="black" /> },
    { hierarchy: '6', label: 'Copiar', onPress: () => { clickedItem && handleCopy([clickedItem]); }, disabled: false, icon: <MaterialCommunityIcons name="content-copy" size={20} color="black" /> },
    { hierarchy: '7', label: 'Cortar', onPress: () => { clickedItem && handleCut([clickedItem]); }, disabled: false, icon: <MaterialCommunityIcons name="content-cut" size={20} color="black" /> },
    { hierarchy: '8', label: 'Pegar', onPress: () => { handlePaste(); }, disabled: false, icon: <MaterialCommunityIcons name="content-paste" size={20} color="black" /> },
    { hierarchy: '9', label: 'Eliminar', onPress: () => { clickedItem && handleDeleteElements([clickedItem]); }, disabled: false, icon: <MaterialCommunityIcons name="delete" size={20} color="black" /> },
    { hierarchy: '10', label: 'Propiedades', onPress: () => {
      setShowPropertyMenu(true);
      setShowMenu(false);
    }, disabled: false, icon: <MaterialCommunityIcons name="information" size={20} color="black" /> },
  ], [clickedItem]);

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
          <ViewDropDown size={42} onChange={async (selectedMode) => await handleViewModeChange(selectedMode.id)} defaultValue={selectedView} />
          <OptionDropDown size={42} onSelect={handleOnSelectOption} />
        </>
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {currentFolderId !== 'sys_root' && (
            <MultiActionButton
              icon={"chevron-back"}
              backgroundColor="transparent"
              iconColor={styles.iconColor.color}
              size={42}
              onPress={() => navigateBack()}
            />
          )}
        </View>

        <View style={styles.buttonsGroup}>
          {renderGroupButtons()}
        </View>
      </View>

      <View style={styles.headerBreadcrumb}>
        <Text style={styles.headerBreadcrumbText}>
          {currentFolderName}
        </Text>
        <Breadcrumb />
      </View>

      <ItemCreator
        visible={creatorVisible}
        onClose={() => setCreatorVisible(false)}
        currentFolderId={currentFolderId}
        onSaveFile={handleSaveFile}
        onSaveFolder={handleSaveFolder}
      />
      {isEmpty ? (
        <View style={styles.footerEmptyContainer}>
          <View style={styles.emptyFolderIconContainer}>
            <EmptyFolder strokeWidth={0.35} width={120} height={120} folderColor={styles.iconColor.color} crossColor={styles.iconColor.primaryColor} />
            <Text style={styles.emptyFolderText}>La carpeta está vacía</Text>
          </View>

          <TouchableOpacity style={styles.volverButton} onPress={() => navigateBack()}>
            <Text style={styles.volverText}>Volver</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item) => item.id}
          key={`${selectedView}-${gridConfig.columns}`}
          numColumns={gridConfig.columns}
          onScroll={() => setShowMenu(false)}
          renderItem={({ item }) => (
            <View ref={(el) => { if (el) itemRefs.current.set(item.id, el); }}>
              <ViewCards
                data={item}
                viewConfig={selectedView}
                selected={itemsSelected.some(i => i.id === item.id)}
                isRenaming={clickedItem?.id === item.id ? isRenaming : false}
                onRename={handleRename}
                onRenameCancel={() => setIsRenaming(false)}
                onPress={() => { selectionMode ? toggleSelection(item) : handleElementPress(item); }}
                onDoublePress={() => { setClickedItem(item); }}
                onLongPress={() => toggleSelection(item)}
              />
            </View>
          )}
          columnWrapperStyle={gridConfig.columns > 1 ? styles.gridRow : undefined}
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
    </View>
  );
}
