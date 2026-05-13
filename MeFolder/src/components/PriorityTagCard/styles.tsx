import { useStyles } from "@/hooks/useStyles";

export const usePriorityTagCardStyles = () => {
  return useStyles((theme) => ({
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
    priorityTagCount: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      minWidth: 24,
      textAlign: "right",
    },
  }));
};
