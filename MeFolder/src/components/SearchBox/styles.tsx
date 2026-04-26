import { useStyles } from "@/hooks";
import { cardShadow } from "@/constants/styles/shadows";

export const useSearchBoxStyles = () => {
  return useStyles((theme) => ({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      paddingHorizontal: theme.spacing.xs,
      gap: theme.spacing.xs,
      height: 42,
      ...cardShadow(theme),
    },
    fullWidthContainer: {
      flex: 1,
    },
    collapsibleContainer: {
      flexShrink: 0,
      overflow: "hidden",
    },
    collapsedContainer: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      paddingHorizontal: 0,
      gap: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    searchActivator: {
      alignItems: "center",
      justifyContent: "center",
    },
    searchActivatorCollapsed: {
      width: 42,
      height: 42,
      borderRadius: theme.effects.radius.md,
    },
    searchActivatorExpanded: {
      width: 36,
      height: 36,
      borderRadius: 18,
      marginLeft: theme.spacing.xs,
    },
    inputArea: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingRight: theme.spacing.xs,
    },
    inputDivider: {
      width: theme.effects.borderWidth.xs,
      alignSelf: "stretch",
      marginVertical: theme.spacing.xs,
      backgroundColor: theme.colors.borderSoft,
      opacity: 0.9,
    },
    containerFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    icon: {
      color: theme.colors.textSecondary,
    },
    collapsedIcon: {
      color: theme.colors.textPrimary,
    },
    iconFocused: {
      color: theme.colors.primary,
    },
    placeholder: {
      color: theme.colors.textMuted,
    },
    input: {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
      paddingVertical: 0,
    },
    clearButton: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    clearIcon: {
      color: theme.colors.textSecondary,
    },
  }));
};
