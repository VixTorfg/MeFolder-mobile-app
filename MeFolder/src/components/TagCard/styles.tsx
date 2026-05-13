import { cardShadow } from "@/constants/styles/shadows";
import { useStyles } from "@/hooks/useStyles";

export const useTagCardStyles = () => {
  return useStyles((theme) => ({
    tagCardRight: {
      alignItems: "flex-end",
      gap: 4,
    },
    tagCardChevron: {
      opacity: 0.3,
    },
    iconColor: {
      color: theme.colors.textPrimary,
      primaryColor: theme.colors.primary,
    },
    tagCardPriority: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.medium,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.effects.radius.xxs,
      overflow: "hidden",
    },
    tagCardName: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
    },
    tagCardMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    tagCardCount: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
    },
    tagCard: {
      ...cardShadow(theme),
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      borderRadius: theme.effects.radius.md,
      padding: theme.spacing.md,
      gap: theme.spacing.md,
    },
    tagIconContainer: {
      width: 42,
      height: 42,
      borderRadius: theme.effects.radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    tagCardContent: {
      flex: 1,
    },
  }));
};
