import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "@/hooks/useStyles";

export const useImageViewerStyles = () => {
  const insets = useSafeAreaInsets();

  return useStyles((theme) => ({
    overlay: {
      flex: 1,
      backgroundColor: theme.colors.mediaBackdrop,
    },
    header: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 10,

      paddingTop: Math.max(insets.top + theme.spacing.sm, 50),
      paddingBottom: theme.spacing.sm,
    },
    headerRow: {
      width: "100%",
      paddingHorizontal: theme.spacing.md,
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      backgroundColor: "rgba(80, 80, 80, 0.45)",
    },
    headerButton: {
      width: 44,
      height: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    headerButtonDisabled: {
      opacity: 0.45,
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
