import { useStyles } from "@/hooks/useStyles";
import { basicCard } from "@/constants/styles/cards";

export const useTutorialPopupStyles = () => {
  return useStyles((theme) => ({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
    },
    container: {
      ...basicCard(theme),
      width: "100%",
      flex: 1,
      padding: 0,
      overflow: "hidden",
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
    },
    stepIndicator: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.borderSoft,
    },
    dotActive: {
      width: 20,
      backgroundColor: theme.colors.primary,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flex: 1,
    },
    slide: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: theme.spacing.lg,
    },
    imageWrapper: {
      flex: 1,
      marginTop: theme.spacing.md,
      borderRadius: theme.effects.radius.lg,
      overflow: "hidden",
      backgroundColor: theme.colors.subCard,
    },
    image: {
      flex: 1,
      width: "100%",
    },
    textBlock: {
      paddingVertical: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    title: {
      fontFamily: theme.typography.fontFamily.title.bold,
      fontSize: 20,
      color: theme.colors.textPrimary,
    },
    description: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 15,
      lineHeight: 22,
      color: theme.colors.textSecondary,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    navButton: {
      width: 52,
      height: 52,
      borderRadius: 26,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    navButtonGhost: {
      backgroundColor: theme.colors.subCard,
    },
    navButtonHidden: {
      opacity: 0,
    },
    counter: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    iconColor: {
      color: theme.colors.textPrimary,
    },
    navIcon: {
      color: theme.colors.textOnColor,
    },
    navGhostIcon: {
      color: theme.colors.textPrimary,
    },
  }));
};
