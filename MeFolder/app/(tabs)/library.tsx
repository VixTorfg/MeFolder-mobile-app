import { ViewDropDown, ViewCards, ItemCreator } from '@/components';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FileModel, FolderModel } from '@/models';
import type { CreateFileInput, FileCategory, FileMetadata, FSFileInfo } from '@/types';
import { modeView } from '@/types';
import { useDatabase, useServices  } from '@/providers';
import { useFileSystem, useMedia } from '@/hooks';
import type { NewFile } from '@/components/ItemCreator/FileCreator';
import type { NewFolder } from '@/components/ItemCreator/FolderCreator';
import mime from 'mime';

/** Segmento del breadcrumb: guarda ID para navegación y nombre para display */
interface PathSegment {
  id: string | null;  // null = raíz
  name: string;
}

export default function LibraryScreen() {
  const { isReady } = useDatabase();
  const { services } = useServices();
  const [selectedView, setSelectedView] = useState<modeView>('list');
  const [items, setItems] = useState<(FileModel | FolderModel)[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [creatorVisible, setCreatorVisible] = useState(false);

  const fs = useFileSystem();
  const media = useMedia();

  // Cada segmento guarda id (para navegación) y name (para display)
  // Así al renombrar una carpeta solo actualizas el segmento, sin recargar el árbol
  const [path, setPath] = useState<PathSegment[]>([
    { id: null, name: 'Biblioteca' }
  ]);

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
      setCurrentFolderId(item.id);
      setPath(prev => [...prev, { id: item.id, name: item.name }]);
    } else {
      Alert.alert(
        `📄 ${item.name}`,
        JSON.stringify(item.toJSON(), null, 2),
      );
    }
  };

  /** Navegar a un segmento anterior del breadcrumb */
  const handlePressPath = (index: number) => {
    const segment = path[index];
    if (!segment) return;
    setPath(prev => prev.slice(0, index + 1));
    setCurrentFolderId(segment.id);
  };

  /** Útil cuando se renombre una carpeta: actualiza solo el nombre en el path */
  const updatePathSegmentName = (folderId: string, newName: string) => {
    setPath(prev =>
      prev.map(seg => (seg.id === folderId ? { ...seg, name: newName } : seg))
    );
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
    const targetFolderId = folderId ?? currentFolderId ?? 'root';
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

        const destinationUri = fs.resolveUri(`${targetFolderId}/${fileNameWithExt}`);
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
          folderId: folderId,
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
        <Text style={styles.headerIcon}>📚</Text>
        <Text style={styles.headerText}>Biblioteca</Text>
        <View style={{justifyContent: 'flex-end'}}>
          <ViewDropDown onChange={handleOnPress} defaultValue='list'/>
        </View>
      </View>

      <View style={styles.breadcrumb}>
        {path.map((segment, index) => (
          <TouchableOpacity
            key={segment.id ?? 'root'}
            onPress={() => handlePressPath(index)}
            disabled={index === path.length - 1} // último segmento no es clickeable
          >
            <Text style={[
              styles.breadcrumbText,
              index === path.length - 1 && styles.breadcrumbActive,
            ]}>
              {segment.name}{index < path.length - 1 && ' / '}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* FAB para añadir elemento */}
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
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>📂 Contenido (Mock)</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 30,
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  breadcrumb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  breadcrumbText: {
    fontSize: 14,
    color: '#007bff',
  },
  breadcrumbActive: {
    color: '#495057',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  cardsGrid: {
    flexDirection: 'column',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridRow: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F2C94C',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 100,
  },
});