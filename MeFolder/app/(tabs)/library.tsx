import { ViewDropDown, ViewCards, ItemCreator, SearchBox, MultiActionButton, ContextMenu, Breadcrumb, OptionDropDown } from '@/components';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert,  Text, useWindowDimensions } from 'react-native';
import { useNavigationStore, useClipboardStore } from '@/stores';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FileModel, FolderModel } from '@/models';
import type { CreateFileInput, FileCategory, FileMetadata, FSFileInfo, OptionsType } from '@/types';
import { modeView, OptionsIds } from '@/types';
import { useAlert, useDatabase, useServices  } from '@/providers';
import { useFileSystem, useMedia } from '@/hooks';
import type { NewFile } from '@/components/ItemCreator/FileCreator';
import type { NewFolder } from '@/components/ItemCreator/FolderCreator';
import mime from 'mime';
import { useLibraryStyles } from '@/screenStyles/libraryStyle';
import EmptyFolder from '@/components/svgIcons/emptyFolder';
import { getGridConfig, ViewMode } from '@/utils/ui/responsive';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';

export default function LibraryScreen() {
  const { isReady } = useDatabase();
  const { services } = useServices();
  const [selectedView, setSelectedView] = useState<modeView>('list');
  const [items, setItems] = useState<(FileModel | FolderModel)[]>([]);
  const [itemsSelected, setItemsSelected] = useState<(FileModel | FolderModel)[]>([]);
  const [creatorVisible, setCreatorVisible] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenuItem, setContextMenuItem] = useState<FileModel | FolderModel | null>(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const buttonRef = useRef<View>(null);

  const menuOptions = [
    { hierarchy: '1', label: 'Abrir', onPress: () => {}, disabled: false, icon: <MaterialCommunityIcons name="open-in-app" size={20} color="black" /> },
    { hierarchy: '2', label: 'Abrir con', onPress: () => {}, disabled: false, icon: <MaterialCommunityIcons name="folder" size={20} color="black" /> },
    { hierarchy: '3', label: 'Compartir con', onPress: () => {contextMenuItem && handleShare(contextMenuItem)}, disabled: false, icon: <MaterialCommunityIcons name="share" size={20} color="black" /> },
    { hierarchy: '4', label: 'Agregar a favoritos', onPress: () => {}, disabled: false, icon: <MaterialCommunityIcons name="star" size={20} color="black" /> },
    { hierarchy: '5', label: 'Renombrar', onPress: () => {}, disabled: false, icon: <MaterialCommunityIcons name="pencil" size={20} color="black" /> },
    { hierarchy: '6', label: 'Copiar', onPress: () => {contextMenuItem && handleCopy([contextMenuItem])}, disabled: false, icon: <MaterialCommunityIcons name="content-copy" size={20} color="black" /> },
    { hierarchy: '7', label: 'Cortar', onPress: () => {contextMenuItem && handleCut([contextMenuItem])}, disabled: false, icon: <MaterialCommunityIcons name="content-cut" size={20} color="black" /> },
    { hierarchy: '8', label: 'Pegar', onPress: () => {contextMenuItem && handlePaste()}, disabled: false, icon: <MaterialCommunityIcons name="content-paste" size={20} color="black" /> },
    { hierarchy: '9', label: 'Eliminar', onPress: () => {contextMenuItem && handleDeleteElements([contextMenuItem])}, disabled: false, icon: <MaterialCommunityIcons name="delete" size={20} color="black" /> },
    { hierarchy: '10', label: 'Propiedades', onPress: () => {console.log(JSON.stringify(contextMenuItem, null, 2))}, disabled: false, icon: <MaterialCommunityIcons name="information" size={20} color="black" /> },
  ];
  const selectionMode = itemsSelected.length > 0;
  const isEmpty = items.length === 0;

  const styles = useLibraryStyles();
  const fs = useFileSystem();
  const media = useMedia();

  const { copy, cut, paste, clear, hasItems, isCopy, isCut, clipboardItems } = useClipboardStore();
  const { currentFolderId, navigateTo, currentFolderName, navigateBack } = useNavigationStore();
  const { showAlert } = useAlert();
  const { width } = useWindowDimensions();
  const gridConfig = getGridConfig(selectedView as ViewMode, width);


  let folders: FolderModel[] = [];
  let files: FileModel[] = [];

   useFocusEffect(
       useCallback(() => {
        if (!isReady) return;

        const loadContent = async () => {
          const folderService = services?.folderService;
          const fileService = services?.fileService;

          if(currentFolderId) {
            folders = await folderService.getSubfolders(currentFolderId);
            files = await fileService.getFilesInFolder(currentFolderId);
          }else{
            folders = await folderService.getSubfolders();
            files = await fileService.getFilesInFolder();
          }

          setItems([...folders, ...files]);
          setItemsSelected([]);
        };

        loadContent();
  }, [isReady, currentFolderId])
  );

  const handleOnPress = (selectedMode: any) => {
    setSelectedView(selectedMode.id);
    console.log('Modo seleccionado:', selectedMode.id);
  }

  const handleElementPress = (item: FileModel | FolderModel) => {
    if (item instanceof FolderModel) {
      setItemsSelected([]);
      navigateTo(item.id, item.name);
    } else {
      setContextMenuItem(item);
      buttonRef.current?.measureInWindow((x, y, width, height) => {
        setMenuPosition({ x, y, width, height });
        setShowMenu(true)
      });
    }
  };

  const toggleSelection = (item: FileModel | FolderModel) => {
    setItemsSelected(prev =>
      prev.some(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleShare = (item: FileModel | FolderModel) => {
    if(!Sharing.isAvailableAsync()) {
      showAlert({ title: 'Compartir no disponible', message: 'La función de compartir no está disponible en este dispositivo.' });
      return;
    }
    
    if(item instanceof FileModel) {
      const fileUri = item.storageUrl;

      if (!fileUri){
        showAlert({ title: 'Ruta no disponible', message: 'La ubicación del archivo no está disponible.' });
        return
      } 

      Sharing.shareAsync(fileUri)
        .then(() => showAlert({ title: 'Compartir', message: 'Archivo compartido exitosamente.' }))
        .catch(error => showAlert({ title: 'Error al compartir', message: `No se pudo compartir el archivo: ${error.message}` }));
    } else {
      showAlert({ title: 'Compartir carpeta', message: 'La función de compartir carpetas no está implementada aún.' });
    }
  }

  const handleOnSelectOption = (option: OptionsType) => {
    switch (option.id) {
      case OptionsIds.SELECT_ALL:
        setItemsSelected([...items]);
        break;
      case OptionsIds.NO_SELECT:
        setItemsSelected([]);
        break;
      case OptionsIds.INVERT_SELECT:
        setItemsSelected(prev => {
          const selectedIds = new Set(prev.map(item => item.id));
          return items.filter(item => !selectedIds.has(item.id));
        });
        break;
      case OptionsIds.PROPERTIES:
        console.log('Seleccionaste Propiedades');
        break;
      case OptionsIds.SETTINGS:
        console.log('Seleccionaste Configuración');
        break;
    }
  };

  const handleDeleteElements = (items?: (FileModel | FolderModel)[]) => {
    const targetItems = items ?? itemsSelected;
    
    showAlert({
      title: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar ${targetItems.length} elemento(s)?`,
      buttons: [
        { text: 'Cancelar', style: 'cancel'},
        { text: 'Eliminar', style: 'destructive', onPress: () => {
            const folderService = services?.folderService;
            const fileService = services?.fileService;

            const folderIdsToDelete = targetItems.filter(i => i instanceof FolderModel).map(f => f.id);
            const fileIdsToDelete = targetItems.filter(i => i instanceof FileModel).map(f => f.id);

            const successFolders = folderIdsToDelete.map(folderId => folderService.deleteFolder(folderId, true));
            const successFiles = fileIdsToDelete.map(fileId => fileService.deleteFile(fileId));

              if(successFolders.every(s => s) && successFiles.every(s => s)){
                setItems(prev => prev.filter(i => !targetItems.some(s => s.id === i.id)));
                if (!items) setItemsSelected([]);
              } else {
                showAlert({ title: 'Error', message: 'No se pudieron eliminar todos los elementos seleccionados' });
              }
        }}, 
      ]
    });
  };

  const buildFileMetadata = async (category: FileCategory, uri: string, fsInfo: FSFileInfo | null, fileMimeType?: string): Promise<FileMetadata> => {
    const mimeType = fileMimeType || fsInfo?.mimeType || '';
    const base: FileMetadata = {
      size: fsInfo?.size ?? 0,
      ...(mimeType && { mimeType }),
      ...(fsInfo?.md5 && { checksum: fsInfo.md5 }),
    };

    switch (category) {
      case 'video': {
        const videoMeta = await media.getVideoMetadata(uri);
        if (videoMeta) {
          return { ...base, videoMetadata: videoMeta };
        }
        return base;
      }
      case 'audio': {
        const audioMeta = await media.getAudioMetadata(uri);
        if (audioMeta) {
          return { ...base, audioMetadata: audioMeta };
        }
        return base;
      }
      case 'image': {
        const imageMeta = await media.getImageMetadata(uri);
        if (imageMeta) {
          return { ...base, imageMetadata: imageMeta };
        }
        return base;
      }
      default:
        return base;
    }
  }

  const handleSaveFile = async (data: NewFile): Promise<void> => {
    const { files, tags, folderId } = data;

    const fileService = services?.fileService;
    const resolvedFolderId = folderId ?? currentFolderId;

    // El servicio resuelve el path completo de la carpeta
    const targetPath = await fileService.resolveStoragePath(resolvedFolderId);

    const failed: { name: string; error: string }[] = [];

    for (const file of files) {
      let copiedUri: string | null = null;

      try {
        const resolvedExt = (
          (file.mimeType && mime.getExtension(file.mimeType)) ||
          ''
        );

        const fileNameWithExt = resolvedExt && !file.name.endsWith(`.${resolvedExt}`)
          ? `${file.name}.${resolvedExt}`
          : file.name;

        const destinationUri = fs.resolveUri(`${targetPath}/${fileNameWithExt}`);
        const copyResult = fs.copyFile(file.uri, destinationUri);

        if (!copyResult.toUri) {
          failed.push({ name: file.name, error: 'Error al copiar el archivo' });
          continue;
        }

        copiedUri = copyResult.toUri;

        const metadata = fs.getFileInfo(copiedUri);

        if (!metadata) {
          throw new Error('No se pudo obtener información del archivo');
        }

        const fileMetadata = await buildFileMetadata(file.type, copiedUri, metadata, file.mimeType);

        const fileResult = await fileService?.createFile({
          name: file.name,
          originalName: file.originalName,
          extension: (resolvedExt || metadata.extension || '') as CreateFileInput['extension'],
          folderId: resolvedFolderId ?? undefined,
          visibility: 'private',
          metadata: fileMetadata,
          tagIds: tags,
          storageUrl: copiedUri,
        } as CreateFileInput);
      
      setItems(prev => [...prev, fileResult]);
      } catch (error) {
        if (copiedUri) {
          try {
            fs.deleteFile(copiedUri);
            console.warn(`Archivo temporal eliminado: ${copiedUri}`);
          } catch (cleanupError) {
            console.warn(`Rollback fallido para ${file.name}:`, cleanupError);
          }
        }
        failed.push({ name: file.name, error: String(error) });
      }
    }

    if (failed.length > 0) {
      console.warn('Archivos que no se pudieron guardar:', failed);
      // TODO: Mostrar notificación al usuario con los archivos fallidos
    }
  };

  const handleSaveFolder = async (data: NewFolder): Promise<void> => {
    const { name, description, color, icon, tags, parentId } = data;

    const folderService = services?.folderService;
    const resolvedParentId = parentId ?? currentFolderId;

    const folderResult = await folderService.createFolder({
      name,
      ...(description && { description }),
      ...(color && { color }),
      ...(icon && { icon }),
      tagIds: tags,
      ...(resolvedParentId && { parentId: resolvedParentId }),
    });

    console.log('[handleSaveFolder] folderResult.path:', folderResult.path);
    const destinationUri = fs.resolveUri(folderResult.path);
    console.log('[handleSaveFolder] destinationUri:', destinationUri);
    const success = fs.makeDirectory(destinationUri, { intermediates: true });
    console.log('[handleSaveFolder] makeDirectory success:', success, '| fs.error:', fs.error);

    if (!success) {
      await folderService.deleteFolder(folderResult.id, true);
      Alert.alert('Error', 'No se pudo crear la carpeta en el sistema de archivos');
      return;
    }
    setItems(prev => [...prev, folderResult]);
  }

  const handleRename = (item: FileModel | FolderModel, newName: string) => {
  
  }

  const handleCopy = (items: (FileModel | FolderModel)[]) => {
    copy(items);
    console.log('Elementos copiados al portapapeles:', clipboardItems);
  }

  const handleCut = (items: (FileModel | FolderModel)[]) => {
    cut(items);
  }

  const handlePaste = async () => {
    if (!hasItems()) {
      showAlert({ title: 'Portapapeles vacío', message: 'No hay elementos para pegar.' });
      return;
    }
    const { createdFolders, createdFiles } = await paste(currentFolderId);

    setItems(prev => [prev.filter(i => i instanceof FolderModel), ...createdFolders, prev.filter(i => i instanceof FileModel), ...createdFiles].flat());
  }

  const renderGroupButtons = () => {
    if (selectionMode) {
      return (
        <>
          <MultiActionButton
                icon={"search-outline"}
                backgroundColor="transparent"
                iconColor={styles.iconColor.color}
                size={42}
                onPress={() => console.log(itemsSelected)}
            />
          <MultiActionButton
              icon={"trash-outline"}
              backgroundColor="transparent"
              iconColor={styles.iconColor.color}
              size={42}
              onPress={() => handleDeleteElements()}
            />
            <OptionDropDown size={42} onSelect={handleOnSelectOption}/>
        </>
      );
    }else{
      return(
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
            <ViewDropDown size={42} onChange={handleOnPress} defaultValue='list'/>
            <OptionDropDown size={42} onSelect={handleOnSelectOption}/>
        </>
      )
    }
  }

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
        <Breadcrumb/>
      </View>

      <ItemCreator
        visible={creatorVisible}
        onClose={() => setCreatorVisible(false)}
        currentFolderId={currentFolderId}
        onSaveFile={(data) => {handleSaveFile(data)}}
        onSaveFolder={(data) => {handleSaveFolder(data)}}
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
          data={items}
          keyExtractor={(item) => item.id}
          key={`${selectedView}-${gridConfig.columns}`}
          numColumns={gridConfig.columns}
          onScroll={() => setShowMenu(false)}
          renderItem={({ item }) => (
            <View ref={buttonRef}>
              <ViewCards
                data={item}
                viewConfig={selectedView}
                selected={itemsSelected.some(i => i.id === item.id)}
                onPress={() => {selectionMode ? toggleSelection(item) : handleElementPress(item)}}
                onDoublePress={() => console.log(JSON.stringify(item, null, 2))}
                onLongPress={() => toggleSelection(item)}
              />
            </View>
          )}
          columnWrapperStyle={gridConfig.columns > 1 ? styles.gridRow : undefined}
          contentContainerStyle={{ paddingBottom: 120, gap: 10, padding: 16 }}
        />
      )}

      <ContextMenu
        options={menuOptions}
        visible={showMenu}
        onDismiss={() => setShowMenu(false)}
        position={menuPosition}
      />
    </View>
  );
}
