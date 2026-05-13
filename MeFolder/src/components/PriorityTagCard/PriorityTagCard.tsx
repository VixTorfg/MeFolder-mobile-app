import { TagModel } from "@/models/tag";
import { PRIORITY_CONFIG } from "@/types/ui/components";
import { View, Text } from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { usePriorityTagCardStyles } from "./styles";
import { router } from "expo-router";
import { useSinglePress } from "@/hooks";

export const PriorityTagCard = ({ tag }: { tag: TagModel }) => {
  const styles = usePriorityTagCardStyles();
  const priorityCfg = PRIORITY_CONFIG[tag.priority];
  const { isLocked, run } = useSinglePress();

  return (
    <TouchableOpacity
      style={styles.priorityTagCard}
      onPress={() =>
        void run(() =>
          router.push(`/tags-content?tagId=${tag.id}&tagName=${tag.name}`),
        )
      }
      activeOpacity={0.7}
      disabled={isLocked}
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
