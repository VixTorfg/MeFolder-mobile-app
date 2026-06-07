import React, { useCallback, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { Ionicons } from "@expo/vector-icons";
import {
  MultiActionButton,
  TagCreator,
  TagCard,
  PriorityTagCard,
  AlbumCard,
  AlbumEmptyState,
  FavoriteTagChip,
  MediaImportProgressOverlay,
} from "@/components";
import { useTagsStyles } from "@/screenStyles/tagsStyle";
import { useAlbumDailyCovers } from "@/hooks/tags/useAlbumDailyCovers";
import { useTagsActions } from "@/hooks/tags/useTagsActions";
import { TagModel } from "@/models/tag";
import { useTagsContent } from "@/hooks/tags/useTagsContent";
import { router } from "expo-router";
import { useAlert } from "@/providers";
import { useSinglePress } from "@/hooks";

export default function TagsScreen() {
  const [showTagCreator, setShowTagCreator] = useState(false);
  const { items, albums } = useTagsContent();
  const { albumDailyCovers } = useAlbumDailyCovers(albums);
  const { handleImportZipAlbum, handleSaveTag, zipImportProgress } =
    useTagsActions();
  const { showAlert } = useAlert();
  const styles = useTagsStyles();
  const { isLocked: isNavigationLocked, run: runSingleNavigation } =
    useSinglePress();

  const favoriteTags = items.filter((t) => t.isFavorite);
  const highPriorityTags = items.filter(
    (t) => t.priority === "high" || t.priority === "critical",
  );
  const allTags = items;

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

      {/*
      <MultiActionButton
        icon="ellipsis-vertical"
        backgroundColor="transparent"
        iconColor={styles.iconColor.color}
        size={42}
        onPress={() => {}}
      />*/}
    </View>
  );

  const renderSectionHeader = (
    title: string,
    action?: string | React.ReactNode,
    onActionPress?: () => void,
    actionDisabled?: boolean,
  ) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action &&
        (typeof action === "string" ? (
          <TouchableOpacity onPress={onActionPress} disabled={actionDisabled}>
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

    let newAlbums = albums;
    if (albums.length > 4) {
      newAlbums = albums.slice(0, 4);
    }

    const rows: TagModel[][] = [];
    for (let i = 0; i < newAlbums.length; i += 2) {
      rows.push(newAlbums.slice(i, i + 2));
    }
    return (
      <View style={styles.albumsGrid}>
        {rows.map((row) => (
          <View
            key={row.map((album) => album.id).join("-")}
            style={styles.albumsRow}
          >
            {row.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                coverUri={albumDailyCovers[album.id]?.coverUri}
              />
            ))}
            {row.length === 1 && <View style={styles.albumCardPlaceholder} />}
          </View>
        ))}
      </View>
    );
  };

  const renderTagItem = useCallback(
    ({ item }: { item: TagModel }) => (
      <TagCard
        tag={item}
        onPress={() =>
          runSingleNavigation(() =>
            router.push(`/tags-content?tagId=${item.id}&tagName=${item.name}`),
          )
        }
      />
    ),
    [runSingleNavigation],
  );

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
        renderItem={renderTagItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {favoriteTags.length > 0 && (
              <>
                {renderSectionHeader("Favoritos")}
                <FlatList
                  horizontal
                  data={favoriteTags}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => <FavoriteTagChip tag={item} />}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.favoriteScrollContent}
                  style={styles.favoriteSection}
                />
              </>
            )}

            {renderSectionHeader(
              "Álbumes",
              albums.length > 0 ? "Ver todos" : undefined,
              albums.length > 0
                ? () =>
                    void runSingleNavigation(() => router.push("/albums-list"))
                : undefined,
              isNavigationLocked,
            )}
            {renderAlbumsGrid()}

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

            <View style={styles.divider} />

            {renderSectionHeader(
              "Todas las etiquetas",
              <TouchableOpacity>
                <Ionicons
                  name="search-outline"
                  size={20}
                  color={styles.iconColor.color}
                  onPress={() =>
                    showAlert({
                      title: "Función no implementada",
                      message:
                        "La función de búsqueda aún no está implementada.",
                    })
                  }
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
          onImportZipAlbum={async () => {
            const result = await handleImportZipAlbum();
            if (result) {
              setShowTagCreator(false);
            }
          }}
          onSave={async (data) => {
            const result = await handleSaveTag(data);
            if (result) {
              setShowTagCreator(false);
            }
          }}
        />
      )}

      <MediaImportProgressOverlay
        visible={zipImportProgress !== null}
        title="Importando Álbum"
        progress={
          zipImportProgress ?? {
            completed: 0,
            total: 1,
          }
        }
      />
    </View>
  );
}
