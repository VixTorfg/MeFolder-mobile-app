import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  MultiActionButton,
  TagCreator,
  TagCard,
  PriorityTagCard,
  AlbumCard,
  AlbumEmptyState,
} from "@/components";
import { useTagsStyles } from "@/screenStyles/tagsStyle";
import { useServices } from "@/providers";
import { useTagsActions } from "@/hooks/tags/useTagsActions";
import { TagModel } from "@/models/tag";
import { useTagsContent } from "@/hooks/tags/useTagsContent";

export default function TagsScreen() {
  const [showTagCreator, setShowTagCreator] = useState(false);
  const {
    services: { tagService },
  } = useServices();
  const { items, albums, loading } = useTagsContent();
  const { handleSaveTag } = useTagsActions({
    tagService,
  });
  const styles = useTagsStyles();

  const favoriteTags = items.filter((t) => t.isFavorite);
  const highPriorityTags = items.filter(
    (t) => t.priority === "high" || t.priority === "critical",
  );
  const allTags = items;

  // ── Header buttons ──
  const renderHeaderButtons = () => (
    <View style={styles.buttonsGroup}>
      <MultiActionButton
        icon="add"
        backgroundColor="transparent"
        iconColor={styles.iconColor.color}
        size={42}
        onPress={() => {
          setShowTagCreator(true);
        }}
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
  const renderFavoriteChip = (tag: TagModel) => (
    <TouchableOpacity
      key={tag.id}
      style={[styles.favoriteChip, { backgroundColor: tag.color.hex + "18" }]}
      activeOpacity={0.7}
    >
      <View
        style={[styles.favoriteChipIcon, { backgroundColor: tag.color.hex }]}
      />
      <Text style={[styles.favoriteChipText, { color: tag.color.hex }]}>
        {tag.name}
      </Text>
      <Text style={[styles.favoriteChipCount, { color: tag.color.hex }]}>
        {tag.usageCount}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = (
    title: string,
    action?: string | React.ReactNode,
  ) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action &&
        (typeof action === "string" ? (
          <TouchableOpacity>
            <Text style={styles.sectionAction}>{action}</Text>
          </TouchableOpacity>
        ) : (
          action
        ))}
    </View>
  );

  const renderAlbumsGrid = () => {
    if (albums.length === 0) {
      return <AlbumEmptyState />;
    }

    const rows: TagModel[][] = [];
    for (let i = 0; i < albums.length; i += 2) {
      rows.push(albums.slice(i, i + 2));
    }
    return (
      <View style={styles.albumsGrid}>
        {rows.map((row, idx) => (
          <View key={idx} style={styles.albumsRow}>
            {row.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
            {row.length === 1 && <View style={styles.albumCardPlaceholder} />}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
        renderItem={({ item }) => <TagCard tag={item} />}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Favorites */}
            {favoriteTags.length > 0 && (
              <>
                {renderSectionHeader("Favoritos")}
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
            {renderSectionHeader(
              "Álbumes",
              albums.length > 0 ? "Ver todos" : undefined,
            )}
            {renderAlbumsGrid()}

            {/* High priority */}
            {highPriorityTags.length > 0 && (
              <>
                {renderSectionHeader("Prioridad alta")}
                <View style={styles.prioritySection}>
                  {highPriorityTags.map((tag) => (
                    <PriorityTagCard key={tag.id} tag={tag} />
                  ))}
                </View>
              </>
            )}

            {/* Divider */}
            <View style={styles.divider} />

            {/* All tags section header with search icon */}
            {renderSectionHeader(
              "Todas las etiquetas",
              <TouchableOpacity>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={styles.iconColor.color}
                />
              </TouchableOpacity>,
            )}
          </>
        }
      />

      {showTagCreator && (
        <TagCreator
          visible={showTagCreator}
          onClose={() => setShowTagCreator(false)}
          onSave={(data) => {
            handleSaveTag(data);
            setShowTagCreator(false);
          }}
        />
      )}
    </View>
  );
}
