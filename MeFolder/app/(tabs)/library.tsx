import { ViewDropDown, ViewCards } from '@/components';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { FileModel, FolderModel } from '@/models';
import type { File, Folder } from '@/types';
import { modeView } from '@/types';
import { useDatabase } from '@/providers/DatabaseProvider';
import { useServices } from '@/src/providers';

/** Segmento del breadcrumb: guarda ID para navegación y nombre para display */
interface PathSegment {
  id: string | null;  // null = raíz
  name: string;
}

const now = new Date();

const mockFolder = new FolderModel({
  id: 'folder_mock_001',
  name: 'Documentos Recientes largosssssssssssssssssssssssssssssss',
  path: 'Documentos Recientes',
  level: 0,
  status: 'active',
  type: 'regular',
  visibility: 'private',
  tagIds: [],
  viewSettings: {
    sortBy: 'name',
    sortOrder: 'asc',
    viewMode: 'list',
    showHiddenFiles: false,
  },
  isFavorite: true,
  isProtected: false,
  isSystemFolder: false,
  createdAt: now,
  updatedAt: now,
} as Folder);

const mockFile = new FileModel({
  id: 'file_mock_001',
  name: 'informe-2026.pdf',
  originalName: 'informe-2026.pdf',
  extension: 'pdf',
  category: 'document',
  path: 'Documentos Recientes/informe-2026.pdf',
  folderId: 'folder_mock_001',
  status: 'active',
  visibility: 'private',
  metadata: {
    size: 2_400_000,
    mimeType: 'application/pdf',
  },
  tagIds: [],
  createdAt: now,
  updatedAt: now,
} as File);

const mockItems: (FileModel | FolderModel)[] = [
  mockFolder,
  new FolderModel({
    id: 'folder_mock_002',
    name: 'Favoritos',
    path: 'Favoritos',
    level: 0,
    status: 'active',
    type: 'favorite',
    visibility: 'private',
    tagIds: [],
    viewSettings: { sortBy: 'date', sortOrder: 'desc', viewMode: 'grid', showHiddenFiles: false },
    isFavorite: true,
    isProtected: false,
    isSystemFolder: false,
    createdAt: now,
    updatedAt: now,
  } as Folder),
  mockFile,
  new FileModel({
    id: 'file_mock_002',
    name: 'foto-vacaciones.jpg',
    originalName: 'IMG_20260101.jpg',
    extension: 'jpg',
    category: 'image',
    path: 'foto-vacaciones.jpg',
    status: 'active',
    visibility: 'private',
    metadata: { size: 5_800_000, mimeType: 'image/jpeg' },
    tagIds: [],
    createdAt: now,
    updatedAt: now,
  } as File),
  new FileModel({
    id: 'file_mock_003',
    name: 'notas.txt',
    originalName: 'notas.txt',
    extension: 'txt',
    category: 'document',
    path: 'notas.txt',
    status: 'active',
    visibility: 'private',
    metadata: { size: 1_200, mimeType: 'text/plain' },
    tagIds: [],
    createdAt: now,
    updatedAt: now,
  } as File),
  new FileModel({
    id: 'file_mock_004',
    name: 'vacaciones-playa.mp4',
    originalName: 'VID_20260110.mp4',
    extension: 'mp4',
    category: 'video',
    path: 'vacaciones-playa.mp4',
    status: 'active',
    visibility: 'private',
    metadata: { size: 150_000_000, mimeType: 'video/mp4', videoMetadata: { duration: 225, width: 1920, height: 1080 } },
    tagIds: [],
    createdAt: now,
    updatedAt: now,
  } as File),
];

export default function LibraryScreen() {
  const { isReady } = useDatabase();
  const { services } = useServices();
  const [selectedView, setSelectedView] = useState<modeView>('list');
  const [items, setItems] = useState<(FileModel | FolderModel)[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  
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

      setItems([...folders, ...files]); // carpetas primero, luego archivos
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
      console.log('Abrir archivo:', item.name);
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
  // Dropdown Styles
  
});