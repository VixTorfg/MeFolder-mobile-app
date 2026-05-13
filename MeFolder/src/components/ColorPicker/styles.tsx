import { useStyles } from "@/hooks";

export const useColorPickerStyles = () => {
  return useStyles((theme) => ({
    /* ─── Color map ─── */
    colorMapSection: {
      marginBottom: theme.spacing.lg,
    },
    colorMapRow: {
      flexDirection: "row" as const,
      gap: theme.spacing.sm,
    },
    colorMapContainer: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: theme.effects.radius.md,
      overflow: "hidden" as const,
    },
    colorMapGradient: {
      flex: 1,
    },
    colorMapCursor: {
      position: "absolute" as const,
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 4,
    },
    grayscaleStrip: {
      width: 36,
      borderRadius: theme.effects.radius.md,
      overflow: "hidden" as const,
      justifyContent: "space-between" as const,
    },
    grayscaleCell: {
      flex: 1,
      borderRadius: 0,
    },

    /* ─── Hue slider ─── */
    hueSliderSection: {
      marginBottom: theme.spacing.lg,
    },
    hueSliderTrack: {
      height: 28,
      borderRadius: theme.effects.radius.md,
      overflow: "hidden" as const,
    },
    hueSliderGradient: {
      flex: 1,
      flexDirection: "row" as const,
    },
    hueSliderCursor: {
      position: "absolute" as const,
      top: -2,
      width: 8,
      height: 32,
      borderRadius: 4,
      borderWidth: 2.5,
      borderColor: "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 4,
    },

    buttonBottomRow: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      width: "100%",
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xxl,
    },

    /* ─── Preview ─── */
    previewSection: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    previewCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: theme.effects.borderWidth.lg,
      borderColor: theme.colors.borderSoft,
    },
    previewInfo: {
      flex: 1,
    },
    previewLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    previewHex: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.primary.bold,
      color: theme.colors.textPrimary,
    },

    /* ─── Input fields ─── */
    inputSection: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    inputRow: {
      flexDirection: "row" as const,
      gap: theme.spacing.sm,
    },
    inputGroup: {
      flex: 1,
    },
    inputLabel: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textMuted,
      marginBottom: theme.spacing.xs,
      textAlign: "center" as const,
    },
    textInput: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
      textAlign: "center" as const,
    },
    textInputFocused: {
      borderColor: theme.colors.primary,
    },
    hexInput: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    hexInputFocused: {
      borderColor: theme.colors.primary,
    },

    /* ─── Name input ─── */
    nameSection: {
      marginBottom: theme.spacing.lg,
    },

    /* ─── Favorite toggle ─── */
    favoriteSection: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      justifyContent: "space-between" as const,
      marginBottom: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
    },
    favoriteLabel: {
      flexDirection: "row" as const,
      alignItems: "center" as const,
      gap: theme.spacing.sm,
    },
    favoriteLabelText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
    },

    deleteButton: {
      width: "100%",
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.error,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },

    /* ─── Save button ─── */
    saveButton: {
      width: "100%",
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      paddingHorizontal: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      alignItems: "center" as const,
      justifyContent: "center" as const,
    },
    actionButtonCompact: {
      flex: 1,
      width: undefined,
    },
    buttonText: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.primary.bold,
      color: theme.colors.textOnColor,
    },
  }));
};

export const useColorListStyles = () => {
  return useStyles((theme) => ({
    gridWidth: {
      width: 40 * 7 + theme.spacing.sm * 6,
      maxWidth: "100%",
    },
    paginationFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: theme.spacing.sm,
      alignSelf: "center",
    },
    paginationButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    paginationButtonDisabled: {
      opacity: 0.25,
    },
    paginationText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    paginationIcon: {
      color: theme.colors.textPrimary,
    },
    container: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
    },
    colorList: {
      alignSelf: "center",
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "flex-start",
      gap: theme.spacing.sm,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: theme.effects.borderWidth.lg,
      borderColor: "transparent",
    },
    colorOptionSelected: {
      borderColor: theme.colors.textPrimary,
    },
    colorOptionInner: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    favoriteIcon: {
      position: "absolute",
      top: 20,
      right: 0,
    },
    favoriteIconColor: {
      color: theme.colors.primary,
    },
    addButtonInner: {
      width: 30,
      height: 30,
      borderRadius: 15,
      borderWidth: 1.5,
      borderColor: theme.colors.borderSoft,
      borderStyle: "dashed",
      alignItems: "center",
      justifyContent: "center",
    },
    addIconColor: {
      color: theme.colors.textSecondary,
    },
  }));
};
