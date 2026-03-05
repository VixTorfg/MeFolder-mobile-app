import { useStyles } from '@/hooks';

export const useSearchBoxStyles = () => {
  return useStyles(theme => ({
    container: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.backgroundSoft,
      borderRadius: theme.effects.radius.xs,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      paddingHorizontal: theme.spacing.md - 4,
      gap: 8,
      height: 42,
    },
    containerFocused: {
      borderColor: theme.colors.primary,
    },
    icon: {
      color: theme.colors.textMuted,
    },
    iconFocused: {
      color: theme.colors.primary,
    },
    input: {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textPrimary,
      paddingVertical: 0,
    },
    clearButton: {
      padding: 4,
    },
    clearIcon: {
      color: theme.colors.textMuted,
    },
  }));
};
