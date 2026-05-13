import { StyleSheet } from 'react-native';
import { useStyles } from '@/hooks';

export const useBottomSheetStyles = () => {
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
      maxWidth: '80%',
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
