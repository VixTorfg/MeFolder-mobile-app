import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useStyles } from "@/hooks/useStyles";

export const useVideoPlayerStyles = () => {
  const insets = useSafeAreaInsets();

  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: "#000",
    },
    gestureRoot: {
      flex: 1,
    },
    videoWrapper: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "center" as const,
      alignItems: "center" as const,
    },
    video: {
      width: "100%" as const,
      height: "100%" as const,
    },
    tapLayer: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    /* ── Skip indicator (YouTube-style) ─────────────────────── */
    skipIndicator: {
      position: "absolute" as const,
      top: "48.5%" as const,
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    skipLeft: {
      left: "15%" as const,
    },
    skipRight: {
      right: "15%" as const,
    },
    skipText: {
      position: "absolute" as const,
      bottom: 8,
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: "#FFFFFF",
    },

    /* ── Overlays ───────────────────────────────────────────── */
    loadingOverlay: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    controlsOverlay: {
      position: "absolute" as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "space-between" as const,
    },

    /* ── Header ─────────────────────────────────────────────── */
    header: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      paddingTop: Math.max(insets.top + theme.spacing.sm, 50),
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    headerBtn: {
      width: 44,
      height: 44,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    headerBtnDisabled: {
      opacity: 0.45,
    },
    headerActions: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.spacing.xs,
    },
    headerTitle: {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: "#FFFFFF",
      textAlign: "center" as const,
      marginHorizontal: theme.spacing.sm,
    },

    /* ── Center play/pause ──────────────────────────────────── */
    centerRow: {
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    centerPlay: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: "rgba(0,0,0,0.5)",
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },

    /* ── Bottom controls ────────────────────────────────────── */
    bottom: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: insets.bottom + theme.spacing.xl,
      backgroundColor: "rgba(0,0,0,0.4)",
    },
    progressTouchArea: {
      paddingVertical: 14,
      marginVertical: -14,
      justifyContent: "center" as const,
    },
    progressTrack: {
      height: 3,
      backgroundColor: "rgba(255,255,255,0.3)",
      borderRadius: 1.5,
      position: "relative" as const,
    },
    progressFill: {
      height: "100%" as const,
      backgroundColor: "#FFFFFF",
      borderRadius: 1.5,
    },
    progressThumb: {
      position: "absolute" as const,
      top: -6,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: "#FFFFFF",
      marginLeft: -7,
    },
    progressThumbActive: {
      width: 20,
      height: 20,
      borderRadius: 10,
      top: -8.5,
      marginLeft: -10,
    },
    timeRow: {
      flexDirection: "row" as const,
      justifyContent: "space-between" as const,
      marginTop: theme.spacing.xs,
    },
    timeText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: "rgba(255,255,255,0.7)",
    },
    timeTextActive: {
      color: "#FFFFFF",
    },
  }));
};
