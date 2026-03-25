import { useStyles } from '@/hooks';

export const useColorPickerStyles = () => {
  return useStyles(theme => ({
    overlay: {
      ...({
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      } as const),
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    containerWrapper: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: '90%',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.effects.radius.lg + 8,
      borderTopRightRadius: theme.effects.radius.lg + 8,
      paddingHorizontal: theme.spacing.lg,
    },
    handleZone: {
      alignItems: 'center' as const,
      paddingVertical: theme.spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.borderSoft,
      borderRadius: theme.effects.radius.exs,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: theme.spacing.lg,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.title.bold,
      color: theme.colors.textPrimary,
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.subCard,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },

    /* ─── Color map ─── */
    colorMapSection: {
      marginBottom: theme.spacing.lg,
    },
    colorMapRow: {
      flexDirection: 'row' as const,
      gap: theme.spacing.sm,
    },
    colorMapContainer: {
      flex: 1,
      aspectRatio: 1,
      borderRadius: theme.effects.radius.md,
      overflow: 'hidden' as const,
    },
    colorMapGradient: {
      flex: 1,
    },
    colorMapCursor: {
      position: 'absolute' as const,
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 3,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 4,
    },
    grayscaleStrip: {
      width: 36,
      borderRadius: theme.effects.radius.md,
      overflow: 'hidden' as const,
      justifyContent: 'space-between' as const,
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
      overflow: 'hidden' as const,
    },
    hueSliderGradient: {
      flex: 1,
      flexDirection: 'row' as const,
    },
    hueSliderCursor: {
      position: 'absolute' as const,
      top: -2,
      width: 8,
      height: 32,
      borderRadius: 4,
      borderWidth: 2.5,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 2,
      elevation: 4,
    },

    /* ─── Preview ─── */
    previewSection: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      flexDirection: 'row' as const,
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
      textAlign: 'center' as const,
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
      textAlign: 'center' as const,
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
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
    },
    favoriteLabel: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: theme.spacing.sm,
    },
    favoriteLabelText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
    },

    /* ─── Save button ─── */
    saveButton: {
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.xxl,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    saveButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.primary.bold,
      color: theme.colors.textOnColor,
    },
  }));
};
