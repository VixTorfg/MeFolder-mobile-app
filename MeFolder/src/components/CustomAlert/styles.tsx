import { useStyles } from "@/hooks/useStyles";
import { basicCard } from "@/constants/styles/cards";

export const useCustomAlertStyles = () => {
  return useStyles((theme) => ({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.lg,
    },
    container: {
      ...basicCard(theme),
      width: "100%",
      maxWidth: 340,
      padding: theme.spacing.lg,
    },
    title: {
      fontFamily: theme.typography.fontFamily.title.bold,
      fontSize: 18,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    content: {
      gap: theme.spacing.sm,
    },
    message: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    footer: {
      marginTop: theme.spacing.md,
    },
    buttonContainer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: theme.spacing.sm,
    },
    cancelButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 8,
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 8,
    },
    destructiveButton: {
      backgroundColor: theme.colors.error,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 8,
    },
    cancelButtonText: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
    },
    confirmButtonText: {
      color: theme.colors.textOnColor,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
    },
    destructiveButtonText: {
      color: "#FFFFFF",
      fontFamily: theme.typography.fontFamily.primary.semiBold,
    },
  }));
};
