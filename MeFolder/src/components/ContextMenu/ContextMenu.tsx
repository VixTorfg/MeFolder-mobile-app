import { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  Animated,
  LayoutChangeEvent,
  useWindowDimensions,
} from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContextMenuStyles } from "./style";

const MENU_MIN_WIDTH = 214;
const MENU_SCREEN_MARGIN = 12;
const MENU_ANCHOR_GAP = 8;
const MENU_ESTIMATED_ITEM_HEIGHT = 44;
const MENU_ESTIMATED_VERTICAL_PADDING = 8;
const FLOATING_TAB_BAR_MIN_HEIGHT = 60;

const clamp = (value: number, min: number, max: number) => {
  if (min > max) return min;

  return Math.min(Math.max(value, min), max);
};

type MenuOption = {
  /** The hierarchy level of the option */
  hierarchy: string;
  /** Label of the option */
  label: string;
  /** Icon to render */
  icon?: React.ReactNode;
  /** Action to perform when the option is pressed */
  onPress: () => void | Promise<void>;
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
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-8)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const [rendered, setRendered] = useState(false);
  const [menuSize, setMenuSize] = useState({ width: 0, height: 0 });

  const visibleOptions = options.filter((option) => option.visible !== false);
  const measuredMenuWidth = Math.max(menuSize.width, MENU_MIN_WIDTH);
  const estimatedMenuHeight =
    menuSize.height ||
    visibleOptions.length * MENU_ESTIMATED_ITEM_HEIGHT +
      MENU_ESTIMATED_VERTICAL_PADDING;
  const floatingTabBarBottomOffset = Math.max(insets.bottom, 12) + 8;
  const bottomBoundary =
    windowHeight -
    floatingTabBarBottomOffset -
    FLOATING_TAB_BAR_MIN_HEIGHT -
    MENU_SCREEN_MARGIN;

  const topSpace = position.y - insets.top - MENU_SCREEN_MARGIN;
  const bottomSpace = bottomBoundary - (position.y + position.height);
  const shouldOpenAbove =
    bottomSpace < estimatedMenuHeight + MENU_ANCHOR_GAP &&
    topSpace > bottomSpace;

  const desiredTop = shouldOpenAbove
    ? position.y - estimatedMenuHeight - MENU_ANCHOR_GAP
    : position.y + position.height + MENU_ANCHOR_GAP;
  const desiredLeft = position.x + position.width - measuredMenuWidth;

  const minTop = insets.top + MENU_SCREEN_MARGIN;
  const maxTop = bottomBoundary - estimatedMenuHeight;
  const minLeft = insets.left + MENU_SCREEN_MARGIN;
  const maxLeft =
    windowWidth - insets.right - measuredMenuWidth - MENU_SCREEN_MARGIN;

  const resolvedTop = clamp(desiredTop, minTop, maxTop);
  const resolvedLeft = clamp(desiredLeft, minLeft, maxLeft);

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
      setMenuSize({ width: 0, height: 0 });
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

  const handleMenuLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;

    setMenuSize((currentSize) => {
      if (currentSize.width === width && currentSize.height === height) {
        return currentSize;
      }

      return { width, height };
    });
  };

  const handleOptionPress = (option: MenuOption) => {
    onDismiss();
    void option.onPress();
  };

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
        onPress={() => handleOptionPress(option)}
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
        onLayout={handleMenuLayout}
        style={[
          {
            position: "absolute",
            top: resolvedTop,
            left: resolvedLeft,
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
