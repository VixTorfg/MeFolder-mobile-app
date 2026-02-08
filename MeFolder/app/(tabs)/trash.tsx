import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';

const SAMPLE_TRASH_ITEMS = [
  { id: 1, name: 'Documento viejo.pdf', type: 'file', deletedDate: '2024-02-01', size: '2.3 MB' },
  { id: 2, name: 'Carpeta Temporal', type: 'folder', deletedDate: '2024-01-28', size: '5 archivos' },
  { id: 3, name: 'imagen_prueba.jpg', type: 'file', deletedDate: '2024-01-25', size: '856 KB' },
  { id: 4, name: 'notas_borrador.txt', type: 'file', deletedDate: '2024-01-20', size: '1.2 KB' },
];

export default function TrashScreen() {
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>🗑️</Text>
          <Text style={styles.headerText}>Papelera</Text>
        </View>
        
        {SAMPLE_TRASH_ITEMS.length > 0 && (
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={handleEmptyTrash}
          >
            <Text style={styles.emptyButtonText}>Vaciar</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }} // Espacio para el tab bar flotante
      >
        {SAMPLE_TRASH_ITEMS.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗑️</Text>
            <Text style={styles.emptyTitle}>Papelera vacía</Text>
            <Text style={styles.emptyMessage}>
              Los archivos y carpetas eliminados aparecerán aquí.
            </Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Elementos eliminados</Text>
            {SAMPLE_TRASH_ITEMS.map((item) => (
              <View key={item.id} style={styles.trashItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemIcon}>
                    {item.type === 'folder' ? '📁' : '📄'}
                  </Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      Eliminado: {item.deletedDate} • {item.size}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.itemActions}>
                  <TouchableOpacity 
                    style={styles.restoreButton}
                    onPress={() => handleRestore(item.name)}
                  >
                    <Text style={styles.restoreButtonText}>↩️</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handlePermanentDelete(item.name)}
                  >
                    <Text style={styles.deleteButtonText}>❌</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Los elementos en la papelera se eliminarán automáticamente después de 30 días.
              </Text>
            </View>
          </View>
        )}
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
  headerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  emptyButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    opacity: 0.5,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
  },
  trashItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 12,
    opacity: 0.7,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#6c757d',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  restoreButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#28a745',
    alignItems: 'center',
    justifyContent: 'center',
  },
  restoreButtonText: {
    fontSize: 16,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dc3545',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    marginTop: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
});