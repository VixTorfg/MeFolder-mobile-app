import { useStyles } from '@/hooks';
import { basicCard } from '@/constants/styles';

export const useGridCardStyles = () => {
    return useStyles(theme => ({
        cardContainer:{
            ...basicCard(theme),
            flex: 1,
            paddingHorizontal: theme.spacing.md - 4,
            paddingVertical: theme.spacing.sm,

            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 16,
            alignItems: 'center',
        },
        cardContainerSelected:{
            ...basicCard(theme),
            flex: 1,
            backgroundColor: theme.colors.primarySoft,
            paddingHorizontal: theme.spacing.md - 4,
            paddingVertical: theme.spacing.sm,

            flexDirection: 'row',
            justifyContent: 'space-between',
            gap: 16,
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
        fileThumbnail: {
            width: 48,
            height: 48,
            borderRadius: theme.effects.radius.xs,
            backgroundColor: theme.colors.subCard,
            alignItems: 'center',
            justifyContent: 'center',
        },
        folderContainer: {
            width: 48,
            alignItems: 'center', 
        },
        iconColor: {
            color: theme.colors.textSecondary,
        },
    }));
};