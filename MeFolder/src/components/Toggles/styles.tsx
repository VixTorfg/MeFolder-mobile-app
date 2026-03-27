import { useStyles } from "@/hooks/useStyles"

export const useTogglesStyles = () => {
    return useStyles(theme => ({
         optionRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.effects.radius.md,
            borderWidth: theme.effects.borderWidth.md,
            borderColor: theme.colors.borderSoft,
            backgroundColor: theme.colors.surface,
        },
            optionRowActive: {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primarySoft,
        },
    }))
}

export const useTogglesChildrenStyles = () => {
    return useStyles(theme => ({
         textPrimary: {
            color: theme.colors.textPrimary,
        },
        textOnColor: {
            color: theme.colors.textOnColor,
        },
        optionIconActive: {
            backgroundColor: theme.colors.primary,
        },
        optionTitleActive: {
            color: theme.colors.primary,
        },
        optionLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
            flex: 1,
        },
        optionTitle: {
            fontSize: theme.typography.fontSize.md,
            fontFamily: theme.typography.fontFamily.primary.semiBold,
            color: theme.colors.textPrimary,
        },
        optionIcon: {
            width: 40,
            height: 40,
            borderRadius: theme.effects.radius.xs,
            backgroundColor: theme.colors.subCard,
            alignItems: 'center',
            justifyContent: 'center',
        },   
        optionToggle: {
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: theme.colors.borderSoft,
            justifyContent: 'center',
            paddingHorizontal: theme.spacing.xs - 2,
        },
        optionToggleActive: {
            backgroundColor: theme.colors.primary,
        },
        optionToggleKnob: {
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: theme.colors.surface,
        },
        optionToggleKnobActive: {
            alignSelf: 'flex-end',
        },       
        optionDescription: {
            fontSize: theme.typography.fontSize.xs,
            fontFamily: theme.typography.fontFamily.primary.regular,
            color: theme.colors.textMuted,
            marginTop: theme.spacing.xs - 2,
        },      
    }))
}
