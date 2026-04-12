import { useStyles } from "@/hooks";
import { cardShadow, glowEffect } from "@/constants/styles/shadows";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useFloatingTabBarStyles = (responsive: {
  iconSize: number;
  padding: number;
  tabPadding: number;
}) => {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  return useStyles((theme) => ({
    floatingTabContainer: {
      position: "absolute",
      bottom: bottomOffset,
      left: theme.spacing.lg,
      right: theme.spacing.lg,
      alignItems: "center",
      pointerEvents: "box-none",
      zIndex: 1000,
    },
    floatingTabBar: {
      ...cardShadow(theme),
      flexDirection: "row",
      borderWidth: theme.effects.borderWidth.xs,
      paddingHorizontal: responsive.padding,
      paddingVertical: theme.spacing.sm, //8
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: responsive.tabPadding,
      paddingHorizontal: theme.spacing.xs, //4
      borderRadius: theme.effects.radius.lg,
      marginHorizontal: theme.spacing.xs - 2, //2
      minHeight: 44,
      position: "relative",
    },
    topBorder: {
      position: "absolute",
      top: "-32%",
      left: "20%",
      right: "20%",
      height: theme.spacing.xs, //4
      borderRadius: theme.effects.radius.exs,
      zIndex: 2,
    },
    glowEffect: {
      ...glowEffect(theme),
      position: "absolute",
      top: "-32%",
      left: "20%",
      right: "20%",
      height: theme.spacing.sm, //8
      zIndex: 1,
    },
  }));
};
