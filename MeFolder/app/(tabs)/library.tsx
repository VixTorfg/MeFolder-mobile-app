import { ViewDropDown, ViewCards } from '@/components';
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FileModel, FolderModel } from '@/models';
import type { File, Folder } from '@/types';
import { modeView } from '@/types';

// ===== MOCK DATA =====
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
  const [selectedView, setSelectedView] = useState<modeView>('list');
  const handleOnPress = (selectedMode: any) => {
    setSelectedView(selectedMode.id);
    console.log('Modo seleccionado:', selectedMode.id);
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
      
      <FlatList
        data={mockItems}
        keyExtractor={(item) => item.id}
        key={selectedView === 'grid' ? 'grid' : 'list'}
        numColumns={selectedView === 'grid' ? 2 : 1}
        renderItem={({ item }) => (
          <ViewCards
            data={item}
            viewConfig={selectedView}
            onPress={() => console.log('Pressed:', item.name)}
          />
        )}
        columnWrapperStyle={selectedView === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={{ paddingBottom: 120, gap: 10, padding: 16 }}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>📂 Contenido (Mock)</Text>
        }
        ListFooterComponent={
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👁️ showCard=false</Text>
              <ViewCards
                data={mockFile}
                onPress={() => {}}
                showCard={false}
              />
              <Text style={styles.cardSubtitle}>↑ Esta card tiene showCard=false, no se renderiza</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Estadísticas</Text>
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>127</Text>
                  <Text style={styles.statLabel}>Archivos totales</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>45</Text>
                  <Text style={styles.statLabel}>Carpetas</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>2.3 GB</Text>
                  <Text style={styles.statLabel}>Espacio usado</Text>
                </View>
              </View>
            </View>
          </>
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
  content: {
    flex: 1,
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