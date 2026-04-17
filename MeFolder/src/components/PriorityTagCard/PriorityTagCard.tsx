import { TagModel } from "@/models/tag";
import { PRIORITY_CONFIG } from "@/types/ui/components";
import { TouchableOpacity, View, Text } from "react-native";
import { usePriorityTagCardStyles } from "./styles";
import { router } from "expo-router";

export const PriorityTagCard = ({ tag }: { tag: TagModel }) => {
  const styles = usePriorityTagCardStyles();
  const priorityCfg = PRIORITY_CONFIG[tag.priority];

  return (
    <TouchableOpacity
      style={styles.priorityTagCard}
      onPress={() =>
        router.push(`/tags-content?tagId=${tag.id}&tagName=${tag.name}`)
      }
      activeOpacity={0.7}
    >
      <View
        style={[styles.priorityTagDot, { backgroundColor: tag.color.hex }]}
      />
      <Text style={styles.priorityTagName} numberOfLines={1}>
        {tag.name}
      </Text>
      <Text
        style={[
          styles.priorityTagBadge,
          { backgroundColor: priorityCfg.bg, color: priorityCfg.color },
        ]}
      >
        {priorityCfg.label}
      </Text>
      <Text style={styles.priorityTagCount}>{tag.usageCount}</Text>
    </TouchableOpacity>
  );
};
