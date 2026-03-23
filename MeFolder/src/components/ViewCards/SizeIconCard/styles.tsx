import { useStyles } from '@/hooks';
import { basicCard } from '@/constants/styles';

export const useSizeIconCardStyles = (size: number) => {
    const containerSize = size * 1.75;
    return useStyles(theme => ({
        cardContainer:{
            width: containerSize,
            height: containerSize,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cardContainerSelected:{
            width: containerSize,
            height: containerSize,
            backgroundColor: theme.colors.primarySoft,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconContainer: {
            width: containerSize,
            height: containerSize,

            alignItems: 'center',
            justifyContent: 'center',

        },
        iconColor: {
            color: theme.colors.textSecondary,
        },
        fileNameText: {
            fontFamily: theme.typography.fontFamily.title.semiBold,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textPrimary,
            flexShrink: 1,
        },
        fileNameInput: {
            fontSize: theme.typography.fontSize.md,
            fontFamily: theme.typography.fontFamily.title.semiBold,
            color: theme.colors.textPrimary,
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.effects.radius.xxs,
            borderWidth: theme.effects.borderWidth.md,
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.surface,
        },
        colors: {
            color: theme.colors.textMuted,
        }
    }));
};