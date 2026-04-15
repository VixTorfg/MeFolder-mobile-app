import { useStyles } from "@/hooks";

export const useSizeIconCardStyles = (size: number) => {
  const containerSize = size * 1.75;
  return useStyles((theme) => ({
    cardContainer: {
      width: containerSize,
      height: containerSize,
      alignItems: "center",
      justifyContent: "center",
    },
    cardContainerSelected: {
      width: containerSize,
      height: containerSize,
      backgroundColor: theme.colors.primarySoft,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
    },
    iconContainer: {
      width: containerSize,
      height: containerSize,
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
    },
    iconColor: {
      color: theme.colors.textSecondary,
    },
    fileNameText: {
      fontFamily: theme.typography.fontFamily.title.semiBold,
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.textPrimary,
      flexShrink: 1,
      flexWrap: "wrap",
    },
    fileNameInput: {
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
    fileThumbnailContainer: {
      width: containerSize / 1.75,
      height: containerSize / 1.75,
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
    colors: {
      color: theme.colors.textMuted,
    },
  }));
};
