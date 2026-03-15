import { StyleSheet } from 'react-native';
import { useStyles } from '@/hooks';
import { cardShadow } from '@/constants/styles/shadows';

export const useContextMenuStyles = () => {
  return useStyles(theme => ({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      zIndex: 999,
    },
    labelText: {
        color: theme.colors.textPrimary,
        fontFamily: theme.typography.fontFamily.primary.regular,
        fontSize: theme.typography.fontSize.md
    },
    menuContainer: {
        ...cardShadow(theme),
        borderWidth: theme.effects.borderWidth.xs,
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        borderColor: theme.colors.borderSoft,
        paddingVertical: theme.spacing.xs,
        minWidth: 150
    },
    menuItemsBorder: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      borderTopWidth: theme.effects.borderWidth.md,
      borderTopColor: theme.colors.divider,
      width: '100%',
    },
    menuItems: {
        paddingVertical: theme.spacing.xs,
        paddingHorizontal: theme.spacing.md,
    },
    itemsRow: { 
        flexDirection: 'row', 
        alignItems: 'center' 
    }
  }))
  };
