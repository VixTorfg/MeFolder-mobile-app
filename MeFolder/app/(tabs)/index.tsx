import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
  StatusBar
} from 'react-native';

import { FileService, FolderService } from '../../src/services';
import { Database } from '../../src/database/sqlite/Database';
import { createFilesTable } from '../../src/database/migrations/files';
import { createFoldersTable } from '../../src/database/migrations/folders';
import { createTagsTable, createTagTriggers } from '../../src/database/migrations/tags';
import { File } from '../../src/types/entities/file';
import { Folder } from '../../src/types/entities/folder';
import { UUID } from '../../src/types/common/base';

// Iconos simples usando emojis
const ICONS = {
  folder: '📁',
  file: '📄',
  back: '⬅️',
  add: '➕',
  home: '🏠'
};

interface NavigationItem {
  id: UUID | 'back';
  name: string;
  type: 'folder' | 'file' | 'back';
  data?: File | Folder;
}

export default function HomeScreen() {
  // Estados principales
  const [currentFolderId, setCurrentFolderId] = useState<UUID | null>(null);
  const [items, setItems] = useState<NavigationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>(['Inicio']);
  
  // Modal para crear archivo
  const [modalVisible, setModalVisible] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  // Modal para crear carpeta
  const [folderModalVisible, setFolderModalVisible] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Servicios
  const fileService = new FileService();
  const folderService = new FolderService();

  // DEMO: Inicialización completa de la base de datos
  const initializeEverything = async () => {
    try {
      console.log('🚀 DEMO: Inicializando todo...');
      
      // 1. Inicializar base de datos
      const db = Database.getInstance();
      await db.initialize();
      
      // 2. Ejecutar migraciones
      console.log('📋 Ejecutando migraciones...');
      await createFoldersTable();
      await createFilesTable();
      await createTagsTable();
      await createTagTriggers();
      
      console.log('✅ Base de datos lista!');
      
      // 3. Cargar contenido inicial
      await loadFolderContent(null);
    } catch (error) {
      console.error('❌ Error inicializando:', error);
      Alert.alert('Error', 'No se pudo inicializar la base de datos');
    }
  };

  // Cargar contenido de la carpeta actual
  const loadFolderContent = async (folderId: UUID | null) => {
    try {
      setLoading(true);
      
      const [folders, files] = await Promise.all([
        folderService.getSubfolders(folderId || undefined),
        fileService.getFilesInFolder(folderId || undefined)
      ]);

      const navigationItems: NavigationItem[] = [];

      // Añadir botón "Atrás" si no estamos en la raíz
      if (folderId !== null) {
        navigationItems.push({
          id: 'back',
          name: '.. Volver',
          type: 'back'
        });
      }

      // Añadir carpetas
      folders.forEach(folder => {
        navigationItems.push({
          id: folder.id,
          name: folder.name,
          type: 'folder',
          data: folder
        });
      });

      // Añadir archivos
      files.forEach(file => {
        navigationItems.push({
          id: file.id,
          name: file.name,
          type: 'file',
          data: file
        });
      });

      setItems(navigationItems);
    } catch (error) {
      console.error('Error cargando contenido:', error);
      Alert.alert('Error', 'No se pudo cargar el contenido de la carpeta');
    } finally {
      setLoading(false);
    }
  };

  // Navegar a una carpeta
  const navigateToFolder = async (folderId: UUID | null, folderName?: string) => {
    setCurrentFolderId(folderId);
    
    if (folderId === null) {
      setBreadcrumbs(['Inicio']);
    } else if (folderName) {
      setBreadcrumbs(prev => [...prev, folderName]);
    }
    
    await loadFolderContent(folderId);
  };

  // Volver a la carpeta padre
  const goBack = async () => {
    if (currentFolderId === null) return;
    
    try {
      // Obtener carpeta actual para saber su padre
      const currentFolder = await folderService.getFolder(currentFolderId);
      const parentId = currentFolder.parentId || null;
      
      setBreadcrumbs(prev => prev.slice(0, -1));
      setCurrentFolderId(parentId);
      await loadFolderContent(parentId);
    } catch (error) {
      console.error('Error al volver:', error);
      // Si hay error, ir a la raíz
      navigateToFolder(null);
    }
  };

  // Crear archivo demo
  const createDemoFile = async () => {
    if (!newFileName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para el archivo');
      return;
    }

    try {
      const createFileInput: any = {
        name: newFileName.trim(),
        originalName: newFileName.trim(),
        extension: 'txt',
        category: 'document',
        path: `/${newFileName.trim()}`,
        metadata: {
          size: 1024,
          mimeType: 'text/plain'
        }
      };

      // Solo agregar folderId si no es null
      if (currentFolderId) {
        createFileInput.folderId = currentFolderId;
        // Actualizar path para incluir la ruta de la carpeta
        const folderPath = breadcrumbs.length > 1 
          ? `/${breadcrumbs.slice(1).join('/')}/` 
          : '/';
        createFileInput.path = `${folderPath}${newFileName.trim()}`;
      }

      await fileService.createFile(createFileInput);

      setModalVisible(false);
      setNewFileName('');
      Alert.alert('Éxito', 'Archivo creado correctamente');
      
      // Recargar contenido
      await loadFolderContent(currentFolderId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error creando archivo:', errorMessage);
      
      // Mostrar mensaje más específico al usuario
      if (errorMessage.includes('ya existe')) {
        Alert.alert('Error', 'Ya existe un archivo con ese nombre en esta carpeta');
      } else if (errorMessage.includes('columnas')) {
        Alert.alert('Error', 'Error de configuración de base de datos. Por favor reinicia la app.');
      } else {
        Alert.alert('Error', `No se pudo crear el archivo: ${errorMessage}`);
      }
    }
  };

  // Crear carpeta demo
  const createDemoFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la carpeta');
      return;
    }

    try {
      let createFolderInput: any = {
        name: newFolderName.trim(),
        description: `Carpeta ${newFolderName.trim()}`,    
      };

      if(currentFolderId) {
        createFolderInput = {...createFolderInput, parentId: currentFolderId };
      }

      await folderService.createFolder(createFolderInput);

      setFolderModalVisible(false);
      setNewFolderName('');
      Alert.alert('Éxito', 'Carpeta creada correctamente');
      
      // Recargar contenido
      await loadFolderContent(currentFolderId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error creando carpeta:', errorMessage);
      
      if (errorMessage.includes('ya existe')) {
        Alert.alert('Error', 'Ya existe una carpeta con ese nombre');
      } else {
        Alert.alert('Error', `No se pudo crear la carpeta: ${errorMessage}`);
      }
    }
  };

  // Manejar clic en item
  const handleItemPress = (item: NavigationItem) => {
    if (item.type === 'back') {
      goBack();
    } else if (item.type === 'folder') {
      navigateToFolder(item.id as UUID, item.name);
    } else if (item.type === 'file') {
      Alert.alert('Archivo', `Seleccionaste: ${item.name}`);
    }
  };

  // Renderizar item de la lista
  const renderItem = ({ item }: { item: NavigationItem }) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={() => handleItemPress(item)}
    >
      <Text style={styles.icon}>
        {item.type === 'back' ? ICONS.back : 
         item.type === 'folder' ? ICONS.folder : ICONS.file}
      </Text>
      <View style={styles.itemContent}>
        <Text style={[styles.itemName, item.type === 'back' && styles.backText]}>
          {item.name}
        </Text>
        {item.type !== 'back' && (
          <Text style={styles.itemType}>
            {item.type === 'folder' ? 'Carpeta' : 'Archivo'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  // DEMO: Inicializar todo al arrancar
  useEffect(() => {
    initializeEverything();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header con breadcrumbs y botones de acción */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>{ICONS.home}</Text>
          <Text style={styles.headerText}>
            {breadcrumbs.join(' / ')}
          </Text>
        </View>
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={[styles.headerButton, styles.folderButton]}
            onPress={() => setFolderModalVisible(true)}
          >
            <Text style={styles.headerButtonText}>📁</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.headerButton, styles.fileButton]}
            onPress={() => setModalVisible(true)}
          >
            <Text style={styles.headerButtonText}>📄</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de contenido */}
      {loading ? (
        <View style={styles.centered}>
          <Text>Cargando...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={{ paddingBottom: 120 }} // Espacio para el tab bar flotante
        />
      )}

      {/* Modal para crear archivo */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Crear Nuevo Archivo</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre del archivo"
              value={newFileName}
              onChangeText={setNewFileName}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewFileName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.createButton]}
                onPress={createDemoFile}
              >
                <Text style={styles.createButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para crear carpeta */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={folderModalVisible}
        onRequestClose={() => setFolderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🗂️ Nueva Carpeta</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Nombre de la carpeta"
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setFolderModalVisible(false);
                  setNewFolderName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.createButton]}
                onPress={createDemoFolder}
              >
                <Text style={styles.createButtonText}>Crear</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  folderButton: {
    backgroundColor: '#ffc107',
  },
  fileButton: {
    backgroundColor: '#28a745',
  },
  headerButtonText: {
    fontSize: 18,
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
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  icon: {
    fontSize: 24,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 2,
  },
  itemType: {
    fontSize: 14,
    color: '#6c757d',
  },
  backText: {
    color: '#007bff',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#212529',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  createButton: {
    backgroundColor: '#007bff',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});