import { useStyles } from "@/hooks";
import { cardShadow } from "@/constants/styles/shadows";

export const useTagsStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 24,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingLeft: theme.spacing.sm,
    },
    headerTitleText: {
      fontSize: 28,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    buttonsGroup: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
    },
    iconColor: {
      color: theme.colors.textPrimary,
      primaryColor: theme.colors.primary,
    },

    favoriteSection: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    favoriteScrollContent: {
      gap: theme.spacing.sm,
    },
    favoriteChip: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: theme.effects.radius.lg,
      gap: 8,
    },
    favoriteChipIcon: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    favoriteChipText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
    },
    favoriteChipCount: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.medium,
      opacity: 0.7,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    sectionAction: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.primary,
    },

    albumsGrid: {
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    albumsRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
    },
    albumCard: {
      ...cardShadow(theme),
      flex: 1,
      height: 88,
      borderRadius: theme.effects.radius.lg,
      padding: theme.spacing.md,
      justifyContent: "flex-end",
    },
    albumCardPlaceholder: {
      flex: 1,
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

    prioritySection: {
      paddingHorizontal: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    priorityTagCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.card,
      borderRadius: theme.effects.radius.xs,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm + 2,
      gap: theme.spacing.sm,
    },
    priorityTagDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    priorityTagName: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
    },
    priorityTagBadge: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.medium,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.effects.radius.xxs,
      overflow: "hidden",
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
    tagCardPriority: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.medium,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: theme.effects.radius.xxs,
      overflow: "hidden",
    },
    priorityTagCount: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      minWidth: 24,
      textAlign: "right",
    },
    divider: {
      height: 1,
      backgroundColor: theme.colors.divider,
      marginHorizontal: theme.spacing.md,
      marginVertical: theme.spacing.sm,
    },

    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.xxl,
    },
    emptyText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: theme.spacing.md,
    },

    listContent: {
      paddingBottom: 120,
    },
  }));
};
