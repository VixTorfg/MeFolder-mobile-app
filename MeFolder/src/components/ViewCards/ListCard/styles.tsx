import { useStyles } from '@/hooks';
import { basicCard } from '@/constants/styles';

export const useListCardStyles = () => {
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
        iconNameContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.md,
        },
        fileNameText: {
            flex: 1,
            flexShrink: 1,
            fontFamily: theme.typography.fontFamily.title.semiBold,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textPrimary,
        }
    }));
};