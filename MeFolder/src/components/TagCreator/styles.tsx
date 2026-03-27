import { StyleSheet } from 'react-native';
import { useStyles } from '@/hooks';

export const useTagCreatorSheetStyles = () => {
  return useStyles(theme => ({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    containerWrapper: {
      position: 'absolute',
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
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.borderSoft,
      borderRadius: theme.effects.radius.exs,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));
};

export const useTagCreatorFormStyles = () => {
  return useStyles(theme => ({
    container: {
      flex: 1,
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
    colorSection: {
      marginBottom: theme.spacing.lg,
    },
    colorList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: theme.effects.borderWidth.lg,
      borderColor: 'transparent',
    },
    colorOptionSelected: {
      borderColor: theme.colors.textPrimary,
    },
    colorOptionInner: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    optionsSection: {
      marginBottom: theme.spacing.lg,
      gap: theme.spacing.sm,
    },
   
    previewSection: {
      marginBottom: theme.spacing.lg,
    },
    previewContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
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
  }));
};
