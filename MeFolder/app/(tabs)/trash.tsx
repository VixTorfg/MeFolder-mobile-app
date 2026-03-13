import { ViewDropDown, ViewCards, SearchBox, MultiActionButton, OptionDropDown } from '@/components';
import { FileModel, FolderModel } from '@/models';
import { useServices, useDatabase } from '@/providers';
import { useAlert } from '@/hooks';
import { useLibraryStyles } from '@/screenStyles/libraryStyle';
import React, { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, FlatList } from 'react-native';
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
  const { showAlert } = useAlert();
  
  let folders: FolderModel[] = [];
  let files: FileModel[] = [];

  useFocusEffect(
    useCallback(() => {
      if (!isReady) return;

      const loadContent = async () => {
        const folderService = services?.folderService;
        const fileService = services?.fileService;

        folders = await folderService.getDeletedFolders();
        files = await fileService.getDeletedFiles();

        setItems([...folders, ...files]);
      };

      loadContent();
    }, [isReady])
  );

  const handleRestore = (itemName: string) => {
    showAlert({
      title: 'Restaurar elemento',
      message: `¿Deseas restaurar "${itemName}"?`,
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Restaurar', onPress: () => console.log('Restaurando:', itemName) }
      ],
    });
  };

  const handlePermanentDelete = () => {
    showAlert({
      title: 'Eliminar permanentemente',
      message: '¿Estás seguro de que deseas eliminar permanentemente los elementos seleccionados? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const fileService = services?.fileService;
            const folderService = services?.folderService;

            for (const item of itemsSelected) {
              if (item instanceof FolderModel) {
                await folderService.permanentDeleteFolder(item.id);
              } else {
                await fileService.permanentDeleteFile(item.id);
              }
            }

            setItems(prev => prev.filter(i => !itemsSelected.includes(i)));
            setItemsSelected([]);
          },
        },
      ],
    });
  };

  const handleEmptyTrash = () => {
    showAlert({
      title: 'Vaciar papelera',
      message: '¿Estás seguro de que deseas vaciar toda la papelera? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Vaciar',
          style: 'destructive',
         onPress: async () => {
            const fileService = services?.fileService;
            const folderService = services?.folderService;

            const filesOnly = items.filter(i => i instanceof FileModel);
            const foldersOnly = items.filter(i => i instanceof FolderModel);

            for (const file of filesOnly) {
              await fileService.permanentDeleteFile(file.id);
            }
            for (const folder of foldersOnly) {
              await folderService.permanentDeleteFolder(folder.id);
            }

            setItems([]);
            setItemsSelected([]);
          },
        },
      ],
    });
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
  
    const handleRestoreSelected = async () => {
      const fileService = services?.fileService;
      const folderService = services?.folderService;

      const allRestoredIds = new Set<string>();

      for (const item of itemsSelected) {
        if (item instanceof FolderModel) {
          const restoredIds = await folderService.restoreFolder(item.id);
          restoredIds.forEach((id: string) => allRestoredIds.add(id));
        } else {
          const restoredIds = await fileService.restoreFile(item.id);
          restoredIds.forEach((id: string) => allRestoredIds.add(id));
        }
      }

      setItems(prev => prev.filter(i => !allRestoredIds.has(i.id)));
      setItemsSelected([]);
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
        {selectionMode && (
          <MultiActionButton
            icon={"refresh-outline"}
            backgroundColor="#4CAF50"
            size={38}
            onPress={handleRestoreSelected}
          />         
        )}

        {selectionMode && (
           <MultiActionButton
            icon={"trash-outline"}
            backgroundColor="red"
            size={38}
            onPress={handlePermanentDelete}
          />    
        )}

        <MultiActionButton
          icon={"settings"}
          size={38}
          onPress={() => console.log("hola")}
        />
      </View>

      <View style={styles.headerBreadcrumb}>
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
