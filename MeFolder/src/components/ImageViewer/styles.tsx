import { useStyles } from "@/hooks/useStyles";

export const useImageViewerStyles = () => {
  return useStyles((theme) => ({
    overlay: {
      flex: 1,
      backgroundColor: "#000",
    },
    header: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingTop: 50,
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    headerTitle: {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: "#FFFFFF",
      textAlign: "center" as const,
      marginHorizontal: theme.spacing.sm,
    },
    imageContainer: {
      flex: 1,
      overflow: "hidden" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    image: {
      width: "100%" as const,
      height: "100%" as const,
    },
    loadingContainer: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    errorContainer: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      paddingHorizontal: theme.spacing.xl,
    },
    errorText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.error,
      textAlign: "center" as const,
      marginTop: theme.spacing.md,
    },
  }));
};
