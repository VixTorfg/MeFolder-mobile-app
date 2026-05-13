import { useStyles } from "@/hooks";

export const useFavoriteTagChipStyles = () => {
  return useStyles((theme) => ({
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
  }));
};
