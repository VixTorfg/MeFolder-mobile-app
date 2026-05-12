import { TagModel } from "@/models/tag";
import { router } from "expo-router";
import { Text, TouchableOpacity, View } from "react-native";
import { useFavoriteTagChipStyles } from "./styles";

export const FavoriteTagChip = ({ tag }: { tag: TagModel }) => {
  const styles = useFavoriteTagChipStyles();

  return (
    <TouchableOpacity
      onPress={() =>
        router.push(`/tags-content?tagId=${tag.id}&tagName=${tag.name}`)
      }
      style={[styles.favoriteChip, { backgroundColor: `${tag.color.hex}18` }]}
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
};
