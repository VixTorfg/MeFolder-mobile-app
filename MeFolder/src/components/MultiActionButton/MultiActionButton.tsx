import {
  View,
  TouchableOpacity,
  Text,
  useWindowDimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getResponsiveSize,
  getMultiActionButtonDimensions,
} from "@/utils/ui/responsive";
import { useMultiActionButtonStyles } from "../MultiActionButton/styles";
import { defaultColor } from "@/themes/colors";
import { isIoniconsIcon } from "@/utils/ui/icons";
import { ColorInfo } from "@/types/common/colors";

interface MultiActionButtonProps {
  onPress: () => Promise<void> | void;
  icon?:
    | keyof typeof Ionicons.glyphMap
    | keyof typeof MaterialCommunityIcons.glyphMap;
  backgroundColor?: ColorInfo | string;
  label?: string;
  disabled?: boolean;
  borderRadius?: number;
  size?: number;
  iconColor?: string;
}

export default function MultiActionButton({
  backgroundColor = defaultColor,
  icon = "help-outline",
  label = "",
  disabled = false,
  borderRadius,
  iconColor = "#FFFFFF",
  size = 38,
  onPress,
}: MultiActionButtonProps) {
  const { width: screenWidth } = useWindowDimensions();
  const responsive = getResponsiveSize(screenWidth);
  const dimensions = getMultiActionButtonDimensions(size, responsive);
  const styles = useMultiActionButtonStyles(dimensions);
  const isIonicons = isIoniconsIcon(icon);

  /**
   * Maneja el evento de presión del botón
   */
  const handlePress = async (): Promise<void> => {
    if (onPress && !disabled) {
      await onPress();
    }
  };

  const resolvedBackgroundColor =
    typeof backgroundColor === "string" ? backgroundColor : backgroundColor.hex;

  return (
    <TouchableOpacity
      style={styles.buttonContainer}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: resolvedBackgroundColor,
            borderRadius: borderRadius ?? dimensions.borderRadius,
          },
        ]}
      >
        {isIonicons ? (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={dimensions.iconSize}
            color={iconColor}
          />
        ) : (
          <MaterialCommunityIcons
            name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={dimensions.iconSize}
            color={iconColor}
          />
        )}
        {label && <Text style={styles.labelText}>{label}</Text>}
      </View>
    </TouchableOpacity>
  );
}
