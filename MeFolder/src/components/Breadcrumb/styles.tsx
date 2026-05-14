import { useStyles } from "@/hooks";

export const useBreadcrumbStyles = () => {
  return useStyles((theme) => ({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      width: "80%",
    },
    segment: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 1,
    },
    segmentButton: {
      flexShrink: 1,
    },
    segmentText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.primary,
    },
    segmentActive: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
    },
    ellipsis: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textMuted,
    },
    separator: {
      fontSize: theme.typography.fontSize.md,
      color: theme.colors.textMuted,
      marginHorizontal: 4,
    },
  }));
};
