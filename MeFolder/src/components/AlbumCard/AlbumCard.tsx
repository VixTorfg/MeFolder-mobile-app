import { TagModel } from "@/models/tag";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";
import { useAlbumCardStyles } from "./styles";
import { router } from "expo-router";

export const AlbumCard = ({ album }: { album: TagModel }) => {
  const styles = useAlbumCardStyles();

  return (
    <TouchableOpacity
      style={[styles.albumCard, { backgroundColor: album.color.hex }]}
      onPress={() =>
        router.push(`/gallery?tagId=${album.id}&albumName=${album.name}`)
      }
      activeOpacity={0.8}
    >
      <MaterialCommunityIcons
        name="image-multiple"
        size={20}
        color="#FFFFFF"
        opacity={0.5}
        style={{ position: "absolute", top: 10, right: 10 }}
      />
      <Text style={styles.albumCardName} numberOfLines={1}>
        {album.name}
      </Text>
      <Text style={styles.albumCardCount}>{album.usageCount} archivos</Text>
    </TouchableOpacity>
  );
};

export const AlbumEmptyState = () => {
  const styles = useAlbumCardStyles();

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        No tienes álbumes creados. Crea uno para organizar tus archivos.
      </Text>
    </View>
  );
};
