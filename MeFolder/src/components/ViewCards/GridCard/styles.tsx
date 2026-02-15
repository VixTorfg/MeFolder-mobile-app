import { useStyles } from '@/hooks';
import { basicCard } from '@/constants/styles';

export const useGridCardStyles = () => {
    return useStyles(theme => ({
        cardContainer:{
            ...basicCard(theme),
            flex: 1,
            padding: theme.spacing.md,

            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 24,
            alignItems: 'center',
        },
        fileNameText: {
            fontFamily: theme.typography.fontFamily.title.semiBold,
            fontSize: theme.typography.fontSize.sm,
            color: theme.colors.textPrimary,
            flexShrink: 1,
        },
        fileDetails: {
            flex: 1,
        },
        fileDetailsText: {
            fontFamily: theme.typography.fontFamily.primary.regular,
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textSecondary,
        },
    }));
};