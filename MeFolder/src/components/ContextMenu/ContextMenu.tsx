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
  const [rendered, setRendered] = useState(false);

  console.log("Position:", position);
  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => setRendered(false));
    }
  }, [visible]);

  if (!rendered) return null;

  const renderRow = (option: MenuOption) => {
    if (option.icon) {
      return (
        <View style={styles.itemsRow}>
          {option.icon}
          <Text style={[styles.labelText, { marginLeft: 10 }]}>
            {option.label}
          </Text>
        </View>
      );
    } else {
      return (
        <>
          <Text style={styles.labelText}>{option.label}</Text>
        </>
      );
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity
        style={{ flex: 1 }}
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
          },
          styles.menuContainer,
        ]}
      >
        {options.map((option) => (
          <TouchableOpacity
            key={option.hierarchy}
            onPress={option.onPress}
            disabled={option.disabled}
            style={[
              ["Propiedades", "Renombrar"].includes(option.label)
                ? styles.menuItemsBorder
                : styles.menuItems,
              option.disabled && { opacity: 0.5 },
            ]}
          >
            {renderRow(option)}
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};
