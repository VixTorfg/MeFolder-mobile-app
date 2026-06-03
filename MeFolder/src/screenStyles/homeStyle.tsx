import { useStyles } from "@/hooks";
import { cardShadow } from "@/constants/styles/shadows";

export const useHomeStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
    },
    headerTitle: {
      fontSize: 28,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    headerSubtitle: {
      marginTop: theme.spacing.xs,
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
    },
    scrollContent: {
      paddingBottom: 120,
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
    favoriteSection: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    favoriteScrollContent: {
      gap: theme.spacing.sm,
    },
    bentoGrid: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      width: "100%",
    },
    bentoCanvas: {
      position: "relative",
      width: "100%",
    },
    bentoCard: {
      position: "absolute",
    },
    loadingContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    helperText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: theme.spacing.xl,
    },
    prioritySection: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      gap: theme.spacing.xs,
    },
    quickStatsGrid: {
      flexDirection: "row",
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    quickStatCard: {
      ...cardShadow(theme),
      flex: 1,
      backgroundColor: theme.colors.card,
      borderRadius: theme.effects.radius.lg,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    quickStatHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    quickStatTitle: {
      flexShrink: 1,
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
    },
    quickStatValue: {
      flexShrink: 1,
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    quickStatHint: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
    },
    primaryColor: {
      color: theme.colors.primary,
      primaryColor: theme.colors.primary,
    },
    iconColor: {
      color: theme.colors.textPrimary,
      primaryColor: theme.colors.primary,
    },
  }));
};
