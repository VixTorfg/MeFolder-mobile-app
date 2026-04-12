import { useStyles } from "@/hooks/useStyles";

export const useAudioPlayerStyles = () => {
  return useStyles((theme) => ({
    overlay: {
      flex: 1,
      backgroundColor: "#121212",
    },
    header: {
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
    artworkContainer: {
      flex: 1,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    iconCircle: {
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: "#2a2a2a",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    controlsContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxl,
      gap: theme.spacing.md,
    },
    // Área de toque ampliada — hace más fácil pulsar y arrastrar
    progressTouchArea: {
      paddingVertical: 14,
      marginVertical: -14,
      justifyContent: "center" as const,
    },
    progressTrack: {
      height: 4,
      backgroundColor: "#333",
      borderRadius: 2,
      position: "relative" as const,
    },
    progressFill: {
      height: "100%" as const,
      backgroundColor: "#FFFFFF",
      borderRadius: 2,
    },
    progressThumb: {
      position: "absolute" as const,
      top: -7,
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#FFFFFF",
      marginLeft: -9,
    },
    progressThumbDragging: {
      width: 24,
      height: 24,
      borderRadius: 12,
      top: -10,
      marginLeft: -12,
      backgroundColor: "#FFFFFF",
    },
    timeRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
    },
    timeText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: "#999",
    },
    timeTextScrubbing: {
      color: "#FFFFFF",
    },
    buttonsRow: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "center" as const,
      gap: theme.spacing.xl,
      marginVertical: theme.spacing.sm,
    },
    controlButton: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
      width: 56,
      height: 56,
      gap: 2,
    },
    skipLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: "#999",
    },
    playButton: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "#FFFFFF",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    playButtonDisabled: {
      backgroundColor: "#555",
    },
  }));
};
