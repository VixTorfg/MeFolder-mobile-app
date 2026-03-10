import { StyleSheet } from 'react-native';
import { useStyles } from '@/hooks';
import { basicCard } from '@/constants/styles/cards';

export const useItemCreatorStyles = () => {
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
      paddingBottom: theme.spacing.xxl,
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
    typeSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    typeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    typeOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    typeOptionText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    typeOptionTextActive: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.primary.bold,
    },
  }));
};

export const useFileCreatorStyles = () => {
  return useStyles(theme => ({
    container: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    sourceSelector: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    sourceOption: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    sourceOptionActive: {
      borderColor: theme.colors.secondary,
      backgroundColor: theme.colors.secondarySoft,
    },
    sourceIcon: {
      width: 44,
      height: 44,
      borderRadius: theme.effects.radius.xs,
      backgroundColor: theme.colors.subCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sourceIconActive: {
      backgroundColor: theme.colors.secondary,
    },
    sourceOptionText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    sourceOptionTextActive: {
      color: theme.colors.secondary,
      fontFamily: theme.typography.fontFamily.primary.bold,
    },
    selectedFilesContainer: {
      marginTop: theme.spacing.sm,
    },
    selectedFileCard: {
      ...basicCard(theme),
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.sm,
      marginBottom: theme.spacing.sm,
      gap: theme.spacing.sm,
    },
    fileThumbnail: {
      width: 48,
      height: 48,
      borderRadius: theme.effects.radius.xs,
      backgroundColor: theme.colors.subCard,
      alignItems: 'center',
      justifyContent: 'center',
    },
    fileInfo: {
      flex: 1,
    },
    fileNameInput: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.xxs,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    fileSize: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.xs,
    },
    removeFileButton: {
      width: 32,
      height: 32,
      borderRadius: theme.effects.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectButton: {
      ...basicCard(theme),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
      borderStyle: 'dashed',
      borderWidth: theme.effects.borderWidth.lg,
      borderColor: theme.colors.borderSoft,
    },
    selectButtonText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    tagSection: {
      marginTop: theme.spacing.lg,
    },
    tagList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.lg,
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    tagChipSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    tagDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    tagChipText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    tagChipTextSelected: {
      color: theme.colors.primary,
    },
    saveButton: {
      marginTop: theme.spacing.xl,
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
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.xxl,
    },
    emptyStateText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      marginTop: theme.spacing.sm,
    },
  }));
};

export const useFolderCreatorStyles = () => {
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
    iconSection: {
      marginBottom: theme.spacing.lg,
    },
    iconGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    iconOption: {
      width: 48,
      height: 48,
      borderRadius: theme.effects.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    iconOptionSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    tagSection: {
      marginBottom: theme.spacing.lg,
    },
    tagList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
    },
    tagChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.lg,
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    tagChipSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    tagDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    tagChipText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    tagChipTextSelected: {
      color: theme.colors.primary,
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
