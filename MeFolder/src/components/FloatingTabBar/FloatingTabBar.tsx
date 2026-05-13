import React, { useCallback, useEffect } from "react";
import { View, TouchableOpacity, Dimensions } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { lightTheme } from "@/themes/themes";
import type { RouteName } from "@/types";
import { getResponsiveSize } from "@/utils/ui/responsive";
import { useFloatingTabBarStyles } from "./styles";

const { width: screenWidth } = Dimensions.get("window");
const responsive = getResponsiveSize(screenWidth);

interface FloatingTabBarProps {
  backgroundColor?: string;
  activeColor?: string;
  inactiveColor?: string;
  borderRadius?: number;
  borderColor?: string;
}

type FloatingTabBarStyles = ReturnType<typeof useFloatingTabBarStyles>;

const BORDER_TIMING = {
  duration: 300,
  easing: Easing.out(Easing.cubic),
};

const GLOW_TIMING = {
  duration: 400,
  easing: Easing.out(Easing.cubic),
};

const ICON_TIMING = {
  duration: 250,
  easing: Easing.out(Easing.cubic),
};

const PRESS_IN_TIMING = {
  duration: 120,
  easing: Easing.out(Easing.quad),
};

const PRESS_OUT_TIMING = {
  duration: 160,
  easing: Easing.out(Easing.quad),
};

const ICONS = {
  home: "home-outline" as keyof typeof Ionicons.glyphMap,
  library: "folder-open-outline" as keyof typeof Ionicons.glyphMap,
  tags: "pricetags-outline" as keyof typeof Ionicons.glyphMap,
  trash: "trash-outline" as keyof typeof Ionicons.glyphMap,
};

const tabs: {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route: RouteName;
}[] = [
  { name: "index", icon: ICONS.home, label: "Inicio", route: "/" },
  {
    name: "library",
    icon: ICONS.library,
    label: "Biblioteca",
    route: "/library",
  },
  { name: "tags", icon: ICONS.tags, label: "Etiquetas", route: "/tags" },
  { name: "trash", icon: ICONS.trash, label: "Papelera", route: "/trash" },
];

interface FloatingTabBarItemProps {
  tab: (typeof tabs)[number];
  isActive: boolean;
  styles: FloatingTabBarStyles;
  activeColor: string;
  inactiveColor: string;
  onNavigate: (route: RouteName) => void;
}

function FloatingTabBarItem({
  tab,
  isActive,
  styles,
  activeColor,
  inactiveColor,
  onNavigate,
}: FloatingTabBarItemProps) {
  const borderProgress = useSharedValue(isActive ? 1 : 0);
  const glowProgress = useSharedValue(isActive ? 1 : 0);
  const iconProgress = useSharedValue(isActive ? 1 : 0);
  const pressProgress = useSharedValue(0);

  useEffect(() => {
    const toValue = isActive ? 1 : 0;

    borderProgress.value = withTiming(toValue, BORDER_TIMING);
    glowProgress.value = withTiming(toValue, GLOW_TIMING);
    iconProgress.value = withTiming(toValue, ICON_TIMING);

    if (isActive) {
      pressProgress.value = 0;
    }
  }, [borderProgress, glowProgress, iconProgress, isActive, pressProgress]);

  const topBorderStyle = useAnimatedStyle(() => ({
    opacity: borderProgress.value,
    transform: [
      {
        scaleX: interpolate(borderProgress.value, [0, 1], [0.6, 1]),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowProgress.value,
    transform: [
      {
        scale: interpolate(glowProgress.value, [0, 1], [0.8, 1]),
      },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => {
    const activeScale = interpolate(iconProgress.value, [0, 1], [1, 1.1]);
    const pressScale = interpolate(pressProgress.value, [0, 1], [1, 0.92]);

    return {
      transform: [{ scale: activeScale * pressScale }],
    };
  });

  const handlePress = useCallback(() => {
    if (isActive) return;

    pressProgress.value = 0;
    pressProgress.value = withTiming(1, PRESS_IN_TIMING, (finished) => {
      if (!finished) return;

      pressProgress.value = withTiming(0, PRESS_OUT_TIMING);
      scheduleOnRN(onNavigate, tab.route);
    });
  }, [isActive, onNavigate, pressProgress, tab.route]);

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={handlePress}
      activeOpacity={0.85}
      accessible={true}
      accessibilityLabel={`Ir a ${tab.label}`}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
    >
      <Animated.View
        style={[
          styles.topBorder,
          topBorderStyle,
          {
            backgroundColor: activeColor,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.glowEffect,
          glowStyle,
          {
            shadowColor: activeColor,
            backgroundColor: `${activeColor}15`,
          },
        ]}
      />

      <Animated.View style={iconStyle}>
        <Ionicons
          name={tab.icon}
          size={responsive.iconSize}
          color={isActive ? activeColor : inactiveColor}
          aria-label={`Icono de ${tab.label}`}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function FloatingTabBar({
  backgroundColor = lightTheme.colors.background,
  activeColor = lightTheme.colors.primary,
  inactiveColor = lightTheme.colors.textSecondary,
  borderColor = lightTheme.colors.borderSoft,
  borderRadius = 25,
}: FloatingTabBarProps = {}) {
  const pathname = usePathname();
  const { push } = useRouter();
  const styles = useFloatingTabBarStyles(responsive);

  /**
   * Maneja la navegación cuando se presiona una pestaña
   * @param route - La ruta a la que navegar
   */
  const handleTabPress = useCallback(
    (route: RouteName) => {
      push(route);
    },
    [push],
  );

  /**
   * Determina si una pestaña está activa basándose en la ruta actual
   * @param tabRoute - La ruta de la pestaña a verificar
   * @returns boolean - true si la pestaña está activa
   */
  const isActiveTab = useCallback(
    (tabRoute: RouteName): boolean => pathname === tabRoute,
    [pathname],
  );

  return (
    <View style={styles.floatingTabContainer}>
      <View
        style={[
          styles.floatingTabBar,
          {
            backgroundColor,
            borderRadius,
            borderColor,
          },
        ]}
      >
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab.route);

          return (
            <FloatingTabBarItem
              key={tab.name}
              tab={tab}
              isActive={isActive}
              styles={styles}
              activeColor={activeColor}
              inactiveColor={inactiveColor}
              onNavigate={handleTabPress}
            />
          );
        })}
      </View>
    </View>
  );
}
