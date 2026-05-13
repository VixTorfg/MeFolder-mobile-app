import { TagModel } from "@/models/tag";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Text, type StyleProp, type ViewStyle } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { useAlbumCardStyles } from "./styles";
import { router } from "expo-router";
import { Image } from "expo-image";
import { useSinglePress } from "@/hooks";

export const AlbumCard = ({
  album,
  coverUri,
  style,
}: {
  album: TagModel;
  coverUri?: string | null | undefined;
  style?: StyleProp<ViewStyle>;
}) => {
  const styles = useAlbumCardStyles();
  const { isLocked, run } = useSinglePress();

  return (
    <TouchableOpacity
      style={[
        styles.albumCard,
        !coverUri && { backgroundColor: album.color.hex },
        style,
      ]}
      onPress={() =>
        void run(() =>
          router.push(`/gallery?tagId=${album.id}&albumName=${album.name}`),
        )
      }
      activeOpacity={0.8}
      disabled={isLocked}
    >
      {coverUri && (
        <>
          <Image
            source={{ uri: coverUri }}
            style={styles.albumCoverImage}
            contentFit="cover"
            transition={150}
          />
          <View
            style={[
              styles.albumCoverTint,
              { backgroundColor: `${album.color.hex}55` },
            ]}
          />
          <View style={styles.albumCoverOverlay} />
        </>
      )}
      <MaterialCommunityIcons
        name="image-multiple"
        size={20}
        color="#FFFFFF"
        style={styles.albumCardIcon}
      />
      <Text style={styles.albumCardName} numberOfLines={1}>
        {album.name}
      </Text>
      <Text
        style={styles.albumCardCount}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {album.usageCount} archivos
      </Text>
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
