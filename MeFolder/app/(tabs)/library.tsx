import { ViewDropDown } from '@/src/components/ViewDropDown';
import { ContentCard } from '@/src/components/ViewCards';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FileModel } from '@/src/models/file';
import { FolderModel } from '@/src/models/folder';
import type { File } from '@/src/types/entities/file';
import type { Folder } from '@/src/types/entities/folder';

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
];

export default function LibraryScreen() {
  const handleOnPress = (selectedMode: any) => {
    console.log('Modo seleccionado:', selectedMode.id);
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>📚</Text>
        <Text style={styles.headerText}>Biblioteca</Text>
        <View style={{justifyContent: 'flex-end'}}>
          <ViewDropDown onChange={handleOnPress}/>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📂 Contenido (Mock)</Text>
          <View style={styles.cardsGrid}>
            {mockItems.map((item) => (
              <ContentCard
                key={item.id}
                data={item}
                onPress={() => console.log('Pressed:', item.name)}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👁️ showCard=false</Text>
          <ContentCard
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
      </ScrollView>

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