import { useStyles } from "@/hooks";
import { basicCard } from "@/constants/styles";

export const useContentCardStyles = () => {
  return useStyles((theme) => ({
    cardContainer: {
      ...basicCard(theme),
      flex: 1,
      paddingHorizontal: theme.spacing.md - 4,
      paddingVertical: theme.spacing.sm,

      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
      alignItems: "center",
    },
    cardContainerSelected: {
      ...basicCard(theme),
      flex: 1,
      backgroundColor: theme.colors.primarySoft,
      paddingHorizontal: theme.spacing.md - 4,
      paddingVertical: theme.spacing.sm,

      flexDirection: "row",
      justifyContent: "space-between",
      gap: 16,
      alignItems: "center",
    },
    iconNameContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    fileNameText: {
      flex: 1,
      flexShrink: 1,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textPrimary,
    },
    fileDetails: {
      flexShrink: 0,
      alignItems: "flex-end",
      gap: theme.spacing.xs,
    },
    fileDetailsText: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textSecondary,
    },
    fileThumbnailContainer: {
      width: 48,
      height: 48,
      borderRadius: theme.effects.radius.xs,
      backgroundColor: theme.colors.subCard,
      alignItems: "center",
      justifyContent: "center",
    },
    fileThumbnail: {
      width: "100%",
      aspectRatio: 1,
      borderRadius: theme.effects.radius.xxs,
    },
    folderContainer: {
      width: 48,
      alignItems: "center",
    },
    iconColor: {
      color: theme.colors.textSecondary,
    },
    fileNameInput: {
      flex: 1,
      flexShrink: 1,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.xxs,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surface,
    },
    colors: {
      color: theme.colors.textMuted,
    },
  }));
};
