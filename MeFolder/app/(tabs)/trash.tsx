import { ViewDropDown, ViewCards, SearchBox, MultiActionButton, Breadcrumb, OptionDropDown } from '@/components';
import { FileModel, FolderModel } from '@/models';
import { useServices, useDatabase } from '@/providers';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useLibraryStyles } from '@/src/screenStyles/libraryStyle';
import React, { useEffect, useState } from 'react';
import { View, Alert, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { modeView, OptionsIds, OptionsType } from '@/types';

export default function TrashScreen() {
  const { isReady } = useDatabase();
  const { services } = useServices();
  const [selectedView, setSelectedView] = useState<modeView>('list');
  const [items, setItems] = useState<(FileModel | FolderModel)[]>([]);
  const [itemsSelected, setItemsSelected] = useState<(FileModel | FolderModel)[]>([]);
  const selectionMode = itemsSelected.length > 0;

  const styles = useLibraryStyles();
  const fs = useFileSystem();
  
  let folders: FolderModel[] = [];
  let files: FileModel[] = [];

  useEffect(() => {
    if (!isReady) return;
  
    const loadContent = async () => {
      const folderService = services?.folderService;
      const fileService = services?.fileService;

        folders = await folderService.getDeletedFolders();
        files = await fileService.getDeletedFiles();

      setItems([...folders, ...files]);
    };
  
    loadContent();
  }, [isReady]);

  const handleRestore = (itemName: string) => {
    Alert.alert(
      'Restaurar elemento',
      `¿Deseas restaurar "${itemName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', onPress: () => console.log('Restaurando:', itemName) }
      ]
    );
  };

  const handlePermanentDelete = (itemName: string) => {
    Alert.alert(
      'Eliminar permanentemente',
      `¿Estás seguro de que deseas eliminar permanentemente "${itemName}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: () => console.log('Eliminando permanentemente:', itemName) 
        }
      ]
    );
  };

  const handleEmptyTrash = () => {
    Alert.alert(
      'Vaciar papelera',
      '¿Estás seguro de que deseas vaciar toda la papelera? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Vaciar', 
          style: 'destructive',
          onPress: () => console.log('Vaciando papelera...') 
        }
      ]
    );
  };

  const handleOnPress = (selectedMode: any) => {
      setSelectedView(selectedMode.id);
      console.log('Modo seleccionado:', selectedMode.id);
    }
  
    const handleElementPress = (item: FileModel | FolderModel) => {
      if (item instanceof FolderModel) {
        
      } else {
        /*Alert.alert(
          `📄 ${item.name}`,
          JSON.stringify(item.toJSON(), null, 2),
        );*/
      }
    };
  
    const toggleSelection = (item: FileModel | FolderModel) => {
      setItemsSelected(prev =>
        prev.some(i => i.id === item.id)
          ? prev.filter(i => i.id !== item.id)
          : [...prev, item]
      );
    };
  
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
          onPress={() => console.log("hola")}
        />
      </View>

      <View style={styles.breadcrumb}>
        <View style={styles.buttonsGroup}>
          <OptionDropDown onSelect={handleOnSelectOption}/>
          <ViewDropDown onChange={handleOnPress} defaultValue='list'/>
        </View>
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
            selected={itemsSelected.some(i => i.id === item.id)}
            onPress={() => {selectionMode ? toggleSelection(item) : handleElementPress(item)}}
            onLongPress={() => toggleSelection(item)}
          />
        )}
        columnWrapperStyle={selectedView === 'grid' ? styles.gridRow : undefined}
        contentContainerStyle={{ paddingBottom: 120, gap: 10, padding: 16 }}
      />
    </View>
  );
}
