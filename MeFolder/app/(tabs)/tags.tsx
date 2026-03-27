import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { MultiActionButton, TagCreator } from '@/components';
import { useTagsStyles } from '@/screenStyles/tagsStyle';
import TagCreatorForm from '@/components/TagCreator/TagCreatorForm';

// ── Datos de ejemplo para maquetar ──

type SampleTag = {
  id: string;
  name: string;
  color: string;
  count: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  favorite: boolean;
  type: 'system' | 'user' | 'album';
};

const SAMPLE_TAGS: SampleTag[] = [
  { id: '1',  name: 'Importante',    color: '#EB5757', count: 8,  priority: 'high',     favorite: true,  type: 'system' },
  { id: '2',  name: 'Trabajo',       color: '#9A9A90', count: 23, priority: 'normal',   favorite: true,  type: 'system' },
  { id: '3',  name: 'Personal',      color: '#F06292', count: 15, priority: 'normal',   favorite: false, type: 'system' },
  { id: '4',  name: 'Urgente',       color: '#EB5757', count: 3,  priority: 'high',     favorite: true,  type: 'system' },
  { id: '5',  name: 'Documentos',    color: '#5DA9C7', count: 31, priority: 'low',      favorite: false, type: 'system' },
  { id: '6',  name: 'Imágenes',      color: '#6FCF97', count: 12, priority: 'low',      favorite: false, type: 'system' },
  { id: '7',  name: 'Música',        color: '#9B51E0', count: 45, priority: 'low',      favorite: false, type: 'system' },
  { id: '8',  name: 'Favoritos',     color: '#F2C94C', count: 7,  priority: 'normal',   favorite: true,  type: 'system' },
  { id: '9',  name: 'Para después',  color: '#F2994A', count: 19, priority: 'low',      favorite: false, type: 'user' },
  { id: '10', name: 'Recetas',       color: '#4DB6AC', count: 5,  priority: 'normal',   favorite: false, type: 'user' },
  { id: '11', name: 'Universidad',   color: '#5DA9C7', count: 14, priority: 'high',     favorite: false, type: 'user' },
];

const SAMPLE_ALBUMS: SampleTag[] = [
  { id: 'a1', name: 'Vacaciones 2026', color: '#6FCF97', count: 34, priority: 'normal', favorite: false, type: 'album' },
  { id: 'a2', name: 'Familia',         color: '#F06292', count: 89, priority: 'normal', favorite: false, type: 'album' },
  { id: 'a3', name: 'Trabajo fotos',   color: '#9A9A90', count: 12, priority: 'normal', favorite: false, type: 'album' },
  { id: 'a4', name: 'Screenshots',     color: '#5DA9C7', count: 56, priority: 'low',    favorite: false, type: 'album' },
];

const PRIORITY_CONFIG = {
  critical: { label: 'Crítica', bg: '#EB575720', color: '#EB5757' },
  high:     { label: 'Alta',    bg: '#F2994A20', color: '#F2994A' },
  normal:   { label: 'Normal',  bg: '#5DA9C720', color: '#5DA9C7' },
  low:      { label: 'Baja',    bg: '#9A9A9020', color: '#9A9A90' },
};

export default function TagsScreen() {
  const [showTagCreator, setShowTagCreator] = useState(false);
  const styles = useTagsStyles();

  const favoriteTags = SAMPLE_TAGS.filter(t => t.favorite);
  const highPriorityTags = SAMPLE_TAGS.filter(t => t.priority === 'high' || t.priority === 'critical');
  const allTags = SAMPLE_TAGS;

  // ── Header buttons ──
  const renderHeaderButtons = () => (
    <View style={styles.buttonsGroup}>
      <MultiActionButton
        icon="add"
        backgroundColor="transparent"
        iconColor={styles.iconColor.color}
        size={42}
        onPress={() => {setShowTagCreator(true)}}
      />
      <MultiActionButton
        icon="ellipsis-vertical"
        backgroundColor="transparent"
        iconColor={styles.iconColor.color}
        size={42}
        onPress={() => {}}
      />
    </View>
  );

  // ── Favorite chip ──
  const renderFavoriteChip = (tag: SampleTag) => (
    <TouchableOpacity
      key={tag.id}
      style={[styles.favoriteChip, { backgroundColor: tag.color + '18' }]}
      activeOpacity={0.7}
    >
      <View style={[styles.favoriteChipIcon, { backgroundColor: tag.color }]} />
      <Text style={[styles.favoriteChipText, { color: tag.color }]}>{tag.name}</Text>
      <Text style={[styles.favoriteChipCount, { color: tag.color }]}>{tag.count}</Text>
    </TouchableOpacity>
  );

  const renderAlbumCard = (album: SampleTag) => (
    <TouchableOpacity
      key={album.id}
      style={[styles.albumCard, { backgroundColor: album.color }]}
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name="image-multiple"
        size={20}
        color="#FFFFFF"
        opacity={0.5}
        style={{ position: 'absolute', top: 10, right: 10 }}
      />
      <Text style={styles.albumCardName} numberOfLines={1}>{album.name}</Text>
      <Text style={styles.albumCardCount}>{album.count} archivos</Text>
    </TouchableOpacity>
  );

  // ── Priority tag card (compact) ──
  const renderPriorityTag = (tag: SampleTag) => {
    const priorityCfg = PRIORITY_CONFIG[tag.priority];
    return (
      <TouchableOpacity key={tag.id} style={styles.priorityTagCard} activeOpacity={0.7}>
        <View style={[styles.priorityTagDot, { backgroundColor: tag.color }]} />
        <Text style={styles.priorityTagName} numberOfLines={1}>{tag.name}</Text>
        <Text
          style={[
            styles.priorityTagBadge,
            { backgroundColor: priorityCfg.bg, color: priorityCfg.color },
          ]}
        >
          {priorityCfg.label}
        </Text>
        <Text style={styles.priorityTagCount}>{tag.count}</Text>
      </TouchableOpacity>
    );
  };

  // ── Tag card (list) ──
  const renderTagCard = ({ item: tag }: { item: SampleTag }) => {
    const priorityCfg = PRIORITY_CONFIG[tag.priority];
    return (
      <TouchableOpacity style={styles.tagCard} activeOpacity={0.7}>
        <View style={[styles.tagIconContainer, { backgroundColor: tag.color + '18' }]}>
          <MaterialCommunityIcons name="tag" size={22} color={tag.color} />
        </View>

        <View style={styles.tagCardContent}>
          <Text style={styles.tagCardName}>{tag.name}</Text>
          <View style={styles.tagCardMeta}>
            <Text style={styles.tagCardCount}>{tag.count} archivos</Text>
            {tag.priority !== 'normal' && tag.priority !== 'low' && (
              <Text
                style={[
                  styles.tagCardPriority,
                  { backgroundColor: priorityCfg.bg, color: priorityCfg.color },
                ]}
              >
                {priorityCfg.label}
              </Text>
            )}
            {tag.favorite && (
              <Ionicons name="star" size={12} color={styles.iconColor.primaryColor} />
            )}
          </View>
        </View>

        <View style={styles.tagCardRight}>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={styles.iconColor.color}
            style={styles.tagCardChevron}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = (title: string, action?: string | React.ReactNode) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        typeof action === 'string' ? (
          <TouchableOpacity>
            <Text style={styles.sectionAction}>{action}</Text>
          </TouchableOpacity>
        ) : action
      )}
    </View>
  );

  const renderAlbumsGrid = () => {
    const rows: SampleTag[][] = [];
    for (let i = 0; i < SAMPLE_ALBUMS.length; i += 2) {
      rows.push(SAMPLE_ALBUMS.slice(i, i + 2));
    }
    return (
      <View style={styles.albumsGrid}>
        {rows.map((row, idx) => (
          <View key={idx} style={styles.albumsRow}>
            {row.map(renderAlbumCard)}
            {row.length === 1 && <View style={styles.albumCardPlaceholder} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header: title + buttons in same row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitleText}>Etiquetas</Text>
        </View>
        {renderHeaderButtons()}
      </View>

      {/* Content */}
      <FlatList
        data={allTags}
        keyExtractor={(item) => item.id}
        renderItem={renderTagCard}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Favorites */}
            {favoriteTags.length > 0 && (
              <>
                {renderSectionHeader('Favoritos')}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.favoriteScrollContent}
                  style={styles.favoriteSection}
                >
                  {favoriteTags.map(renderFavoriteChip)}
                </ScrollView>
              </>
            )}

            {/* Albums 2x2 grid */}
            {SAMPLE_ALBUMS.length > 0 && (
              <>
                {renderSectionHeader('Álbumes', 'Ver todos')}
                {renderAlbumsGrid()}
              </>
            )}

            {/* High priority */}
            {highPriorityTags.length > 0 && (
              <>
                {renderSectionHeader('Prioridad alta')}
                <View style={styles.prioritySection}>
                  {highPriorityTags.map(renderPriorityTag)}
                </View>
              </>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* All tags section header with search icon */}
            {renderSectionHeader(
              'Todas las etiquetas',
              <TouchableOpacity>
                <Ionicons name="search-outline" size={20} color={styles.iconColor.color} />
              </TouchableOpacity>
            )}
          </>
        }
      />

      {showTagCreator && (
        <TagCreator 
            visible={showTagCreator}
            onClose={() => setShowTagCreator(false)}
            onSave={()=>(console.log("guardando..."))}//handleSaveTag}
        />
      )}
    </View>
  );
}

