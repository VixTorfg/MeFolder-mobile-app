import { useStyles } from "@/hooks/useStyles";
import { cardShadow } from "@/constants/styles/shadows";
import { StyleSheet } from "react-native";

export const useAlbumCardStyles = () => {
  return useStyles((theme) => ({
    albumCard: {
      ...cardShadow(theme),
      flex: 1,
      height: 88,
      borderRadius: theme.effects.radius.lg,
      padding: theme.spacing.md,
      justifyContent: "flex-end",
      overflow: "hidden",
      position: "relative",
    },
    albumCoverImage: {
      ...StyleSheet.absoluteFillObject,
    },
    albumCoverTint: {
      ...StyleSheet.absoluteFillObject,
    },
    albumCoverOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10, 10, 16, 0.28)",
    },
    albumCardIcon: {
      position: "absolute",
      top: 10,
      right: 10,
      opacity: 0.55,
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
