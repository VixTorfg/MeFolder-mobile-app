import { ViewDropDown, ViewCards, ItemCreator, SearchBox, MultiActionButton, Breadcrumb } from '@/components';
import React, { useEffect, useState } from 'react';
import { View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useNavigationStore } from '@/stores';
import { Ionicons } from '@expo/vector-icons';
import { FileModel, FolderModel } from '@/models';
import type { CreateFileInput, FileCategory, FileMetadata, FSFileInfo } from '@/types';
import { modeView } from '@/types';
import { useDatabase, useServices  } from '@/providers';
import { useFileSystem, useMedia } from '@/hooks';
import type { NewFile } from '@/components/ItemCreator/FileCreator';
import type { NewFolder } from '@/components/ItemCreator/FolderCreator';
import mime from 'mime';
import { useLibraryStyles } from '@/screenStyles/libraryStyle';

export default function LibraryScreen() {
  const { isReady } = useDatabase();
  const { services } = useServices();
  const [selectedView, setSelectedView] = useState<modeView>('list');
  const [items, setItems] = useState<(FileModel | FolderModel)[]>([]);
  const [creatorVisible, setCreatorVisible] = useState(false);

  const styles = useLibraryStyles();
  const fs = useFileSystem();
  const media = useMedia();

  const { currentFolderId, navigateTo } = useNavigationStore();

  let folders: FolderModel[] = [];
  let files: FileModel[] = [];

   useEffect(() => {
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
    };

    loadContent();
  }, [isReady, currentFolderId]);

  const handleOnPress = (selectedMode: any) => {
    setSelectedView(selectedMode.id);
    console.log('Modo seleccionado:', selectedMode.id);
  }

  const handleElementPress = (item: FileModel | FolderModel) => {
    if (item instanceof FolderModel) {
      navigateTo(item.id, item.name);
    } else {
      Alert.alert(
        `📄 ${item.name}`,
        JSON.stringify(item.toJSON(), null, 2),
      );
    }
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

    const destinationUri = fs.resolveUri(folderResult.path);
    const success = fs.makeDirectory(destinationUri);

    if (!success) {
      await folderService.deleteFolder(folderResult.id, true);
      Alert.alert('Error', 'No se pudo crear la carpeta en el sistema de archivos');
      return;
    }
    setItems(prev => [...prev, folderResult]);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBox
          onSearch={async (query) => { /* futuro */ return []; }}
          onClear={() => { /* futuro */ }}
        />
        <MultiActionButton
          icon={"settings"}
          size={38}
          onPress={() => console.log(currentFolderId)}
        />
      </View>

      <View style={styles.breadcrumb}>
        <Breadcrumb />
        <View style={styles.buttonsGroup}>
          <MultiActionButton
            icon={"ellipsis-vertical"}
            size={38}
            backgroundColor={'transparent'}
            iconColor={'red'}
            onPress={() => console.log('ellipsis')}
          />
          <ViewDropDown onChange={handleOnPress} defaultValue='list'/>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setCreatorVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Modal de creación */}
      <ItemCreator
        visible={creatorVisible}
        onClose={() => setCreatorVisible(false)}
        currentFolderId={currentFolderId}
        onSaveFile={(data) => {handleSaveFile(data)}}
        onSaveFolder={(data) => {handleSaveFolder(data)}}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        key={selectedView === 'grid' ? 'grid' : 'list'}
        numColumns={selectedView === 'grid' ? 2 : 1}
        renderItem={({ item }) => (
          <ViewCards
            data={item}
            viewConfig={selectedView}
            onPress={() => handleElementPress(item)}
          />
        )}
        columnWrapperStyle={selectedView === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={{ paddingBottom: 120, gap: 10, padding: 16 }}
      />
    </View>
  );
}
