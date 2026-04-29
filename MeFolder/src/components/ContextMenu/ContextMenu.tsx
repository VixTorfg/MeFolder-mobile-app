import { useState, useEffect, useRef } from "react";
import { TouchableOpacity, Text, View, Animated } from "react-native";
import { useContextMenuStyles } from "./style";

type MenuOption = {
  /** The hierarchy level of the option */
  hierarchy: string;
  /** Label of the option */
  label: string;
  /** Icon to render */
  icon?: React.ReactNode;
  /** Action to perform when the option is pressed */
  onPress: () => void;
  /** Whether the option is currently visible*/
  visible?: boolean;
  /** Whether the option is disabled */
  disabled?: boolean;
};

interface ContextMenuProps {
  options: MenuOption[];
  visible: boolean;
  onDismiss: () => void;
  position: { x: number; y: number; width: number; height: number };
}

export const ContextMenu = ({
  options,
  visible,
  onDismiss,
  position,
}: ContextMenuProps) => {
  const styles = useContextMenuStyles();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-8)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const [rendered, setRendered] = useState(false);

  const visibleOptions = options.filter((option) => option.visible !== false);

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -6,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
  }, [visible, fadeAnim, scaleAnim, translateYAnim]);

  if (!rendered) return null;

  const renderRow = (option: MenuOption, index: number) => {
    const isDestructive = option.label === "Eliminar";
    const itemDividerStyle = index > 0 ? styles.menuItemDivider : undefined;
    const itemDisabledStyle = option.disabled
      ? styles.menuItemDisabled
      : undefined;
    const itemDestructiveStyle = isDestructive
      ? styles.menuItemDestructive
      : undefined;
    const labelIconStyle = option.icon ? styles.labelTextWithIcon : undefined;
    const labelDestructiveStyle = isDestructive
      ? styles.labelTextDestructive
      : undefined;

    return (
      <TouchableOpacity
        key={option.hierarchy}
        onPress={option.onPress}
        disabled={option.disabled}
        activeOpacity={0.82}
        style={[
          styles.menuItem,
          itemDividerStyle,
          itemDisabledStyle,
          itemDestructiveStyle,
        ]}
      >
        <View style={styles.itemsRow}>
          {option.icon ? (
            <View style={styles.iconSlot}>{option.icon}</View>
          ) : null}
          <Text
            style={[styles.labelText, labelIconStyle, labelDestructiveStyle]}
          >
            {option.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={styles.dismissPressable}
        activeOpacity={1}
        onPress={onDismiss}
      />
      <Animated.View
        style={[
          {
            position: "absolute",
            top: position.y - position.height - 80,
            right: position.x,
            zIndex: 1000,
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          },
          styles.menuContainer,
        ]}
      >
        {visibleOptions.map(renderRow)}
      </Animated.View>
    </View>
  );
};
