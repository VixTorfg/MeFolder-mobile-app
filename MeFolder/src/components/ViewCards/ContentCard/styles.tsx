import { useStyles } from '@/hooks';
import { basicCard } from '@/constants/styles';

export const useContentCardStyles = () => {
    return useStyles(theme => ({
        cardContainer:{
            ...basicCard(theme),
            width: '100%',
            padding: theme.spacing.md,

            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 24,
            alignItems: 'center',
        },
        iconNameContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
        },
        fileName: {
            flex: 1,
            flexShrink: 1,
            fontFamily: theme.typography.fontFamily.primary.medium,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textPrimary,
        },
        fileDetails: {
            flexShrink: 0,
            alignItems: 'flex-end',
            gap: theme.spacing.xs,
        },
        fileDetailsText: {
            fontFamily: theme.typography.fontFamily.primary.regular,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textSecondary,
        },
    }));
};