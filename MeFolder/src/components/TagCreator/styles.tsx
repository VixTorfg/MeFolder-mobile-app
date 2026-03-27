import { useStyles } from '@/hooks/useStyles';

export const useTagCreatorFormStyles = () => {
  return useStyles(theme => ({
    container: {
      flex: 1,
    },
    colorSection: {
      marginBottom: theme.spacing.lg,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    textInput: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    textInputFocused: {
      borderColor: theme.colors.primary,
    },
    descriptionInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },  
    optionsSection: {
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
    saveButton: {
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.borderSoft,
    },
    saveButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.primary.bold,
      color: theme.colors.textOnColor,
    },
    nameInputAndPreview: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    nameInput: {
      width: '60%',
    },
    namePreview: {
      width: '32%',
    },
  }));
};

export const useTagPreviewStyles = () => {
  return useStyles(theme => ({
     previewContainer: {
      flexDirection: 'row',
    },
    previewSection: {
      marginBottom: theme.spacing.lg,
    },
    previewTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs + 2,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.lg,
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.md,
      maxWidth: '100%',
    },
    previewDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    previewTagText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
      flexShrink: 1,
    },
    isAlbum: {
        color: theme.colors.textSecondary,
    },
    isFavorite: {
        color: theme.colors.primary,
    }
  }))
}
