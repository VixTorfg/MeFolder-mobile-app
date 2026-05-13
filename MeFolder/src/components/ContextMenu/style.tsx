import { StyleSheet } from "react-native";
import { useStyles } from "@/hooks";
import { cardShadow } from "@/constants/styles/shadows";

export const useContextMenuStyles = () => {
  return useStyles((theme) => ({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
    },
    dismissPressable: {
      flex: 1,
    },
    labelText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    labelTextWithIcon: {
      marginLeft: theme.spacing.md,
    },
    labelTextDestructive: {
      color: theme.colors.error,
    },
    menuContainer: {
      ...cardShadow(theme),
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.effects.radius.lg,
      paddingVertical: theme.spacing.xs,
      minWidth: 214,
      overflow: "hidden" as const,
    },
    menuItem: {
      paddingVertical: theme.spacing.sm + 1,
      paddingHorizontal: theme.spacing.md,
      width: "100%",
    },
    menuItemDivider: {
      borderTopWidth: theme.effects.borderWidth.xs,
      borderTopColor: theme.colors.borderSoft,
    },
    menuItemDisabled: {
      opacity: 0.45,
    },
    menuItemDestructive: {
      backgroundColor: theme.colors.error + "10",
    },
    itemsRow: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 22,
    },
    iconSlot: {
      width: 22,
      alignItems: "center",
      justifyContent: "center",
    },
  }));
};
