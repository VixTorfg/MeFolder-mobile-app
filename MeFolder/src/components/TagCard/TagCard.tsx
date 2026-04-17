import { TagModel } from "@/models/tag";
import { PRIORITY_CONFIG } from "@/types/ui/components";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";
import { useTagCardStyles } from "./styles";

export const TagCard = ({
  tag,
  onPress,
}: {
  tag: TagModel;
  onPress?: () => Promise<void> | void;
}) => {
  const styles = useTagCardStyles();
  const priorityCfg = PRIORITY_CONFIG[tag.priority];
  return (
    <TouchableOpacity
      style={styles.tagCard}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View
        style={[
          styles.tagIconContainer,
          { backgroundColor: tag.color.hex + "18" },
        ]}
      >
        <MaterialCommunityIcons name="tag" size={22} color={tag.color.hex} />
      </View>

      <View style={styles.tagCardContent}>
        <Text style={styles.tagCardName}>{tag.name}</Text>
        <View style={styles.tagCardMeta}>
          {tag.usageCount > 0 ? (
            <Text style={styles.tagCardCount}>{tag.usageCount} archivos</Text>
          ) : (
            <Text style={styles.tagCardCount}>Sin archivos</Text>
          )}
          {(tag.priority === "high" || tag.priority === "critical") && (
            <Text
              style={[
                styles.tagCardPriority,
                { backgroundColor: priorityCfg.bg, color: priorityCfg.color },
              ]}
            >
              {priorityCfg.label}
            </Text>
          )}
          {tag.isFavorite && (
            <Ionicons
              name="star"
              size={12}
              color={styles.iconColor.primaryColor}
            />
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
