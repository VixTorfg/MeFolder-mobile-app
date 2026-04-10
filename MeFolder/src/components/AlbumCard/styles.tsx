import { useStyles } from "@/hooks/useStyles";
import { cardShadow } from "@/constants/styles/shadows";

export const useAlbumCardStyles = () => {
  return useStyles((theme) => ({
    albumCard: {
      ...cardShadow(theme),
      flex: 1,
      height: 88,
      borderRadius: theme.effects.radius.lg,
      padding: theme.spacing.md,
      justifyContent: "flex-end",
    },
    albumCardName: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: "#FFFFFF",
    },
    albumCardCount: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: "rgba(255,255,255,0.8)",
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
  }));
};
