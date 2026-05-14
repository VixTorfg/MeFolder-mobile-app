import { useStyles } from "@/hooks";
import { cardShadow } from "@/constants/styles/shadows";

export const useViewDropDownStyles = (responsive: {
  iconSize: number;
  padding: number;
  tabPadding: number;
}) => {
  return useStyles((theme) => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.effects.shadowColor.default,
    },
    dropdownContainer: {
      position: "absolute",
      top: "10%",
      right: 16,
      zIndex: 1000,
    },
    dropdown: {
      ...cardShadow(theme),
      borderWidth: theme.effects.borderWidth.xs,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.effects.radius.lg,
      minWidth: 228,
      maxWidth: 292,
      borderColor: theme.colors.borderSoft,
      paddingVertical: theme.spacing.xs,
      overflow: "hidden",
    },

    dropdownHeader: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: theme.effects.borderWidth.xs,
      borderBottomColor: theme.colors.borderSoft,
    },
    headerBackButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    headerTextGroup: {
      flex: 1,
    },
    dropdownTitle: {
      fontFamily: theme.typography.fontFamily.title.semiBold,
      fontSize: responsive.iconSize * 0.56,
      color: theme.colors.textPrimary,
    },
    dropdownItem: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: theme.spacing.xs,
      marginVertical: 2,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.sm,
      gap: theme.spacing.sm,
      minHeight: 54,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.background,
    },
    switchItem: {
      minHeight: 66,
    },
    selectedItem: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    selectedIconColor: {
      color: theme.colors.textOnColor,
    },
    IconColor: {
      color: theme.colors.textPrimary,
    },
    itemIconWrapper: {
      width: 34,
      height: 34,
      borderRadius: theme.effects.radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    selectedItemIconWrapper: {
      backgroundColor: theme.colors.primary,
    },
    itemTextGroup: {
      flex: 1,
    },
    itemText: {
      fontSize: responsive.iconSize / 2,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily.primary.medium,
    },
    selectedItemText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.primary.medium,
    },
    checkmark: {
      color: theme.colors.primary,
    },
    trailingIcon: {
      color: theme.colors.textMuted,
    },
    primary: {
      color: theme.colors.textPrimary,
    },
  }));
};
