import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

const SAMPLE_TAGS = [
  { id: 1, name: 'Trabajo', color: '#007bff', count: 23 },
  { id: 2, name: 'Personal', color: '#28a745', count: 15 },
  { id: 3, name: 'Importante', color: '#dc3545', count: 8 },
  { id: 4, name: 'Documentos', color: '#ffc107', count: 31 },
  { id: 5, name: 'Imágenes', color: '#fd7e14', count: 12 },
  { id: 6, name: 'Proyectos', color: '#6f42c1', count: 6 },
];

export default function TagsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🏷️</Text>
        <Text style={styles.headerText}>Tags</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }} // Espacio para el tab bar flotante
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 Todos los Tags</Text>
          <View style={styles.tagsGrid}>
            {SAMPLE_TAGS.map((tag) => (
              <TouchableOpacity 
                key={tag.id} 
                style={[styles.tagCard, { borderLeftColor: tag.color }]}
              >
                <View style={styles.tagHeader}>
                  <View style={[styles.colorDot, { backgroundColor: tag.color }]} />
                  <Text style={styles.tagName}>{tag.name}</Text>
                </View>
                <Text style={styles.tagCount}>{tag.count} archivos</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⭐ Más Usados</Text>
          <View style={styles.popularTagsContainer}>
            {SAMPLE_TAGS.slice(0, 3).map((tag) => (
              <TouchableOpacity 
                key={`popular-${tag.id}`}
                style={[styles.popularTag, { backgroundColor: tag.color + '20' }]}
              >
                <Text style={[styles.popularTagText, { color: tag.color }]}>
                  {tag.name}
                </Text>
                <Text style={styles.popularTagCount}>{tag.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Acciones Rápidas</Text>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>Buscar por tag</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Estadísticas de tags</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
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
    flex: 1,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  tagsGrid: {
    gap: 8,
  },
  tagCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tagName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    flex: 1,
  },
  tagCount: {
    fontSize: 14,
    color: '#6c757d',
  },
  popularTagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  popularTag: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  popularTagText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  popularTagCount: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionCard: {
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
  actionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  actionText: {
    fontSize: 16,
    color: '#212529',
  },
});