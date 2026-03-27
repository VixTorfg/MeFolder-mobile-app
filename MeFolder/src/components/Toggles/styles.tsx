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

export const usePrioritySelectorStyles = () => {
  return useStyles(theme => ({
    container: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    option: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: theme.spacing.sm + 2,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
      gap: theme.spacing.xs,
    },
    iconCircle: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconCircleInactive: {
      backgroundColor: theme.colors.subCard,
    },
    iconActive: {
      color: theme.colors.textOnColor,
    },
    iconInactive: {
      color: theme.colors.textMuted,
    },
    label: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    // Low (success)
    lowOption: {
      borderColor: theme.colors.success,
      backgroundColor: theme.colors.successSoft,
    },
    lowIcon: {
      backgroundColor: theme.colors.success,
    },
    lowLabel: {
      color: theme.colors.success,
      fontFamily: theme.typography.fontFamily.primary.bold,
    },
    lowDot: {
      backgroundColor: theme.colors.success,
    },

    // Normal (primary)
    normalOption: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    normalIcon: {
      backgroundColor: theme.colors.primary,
    },
    normalLabel: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.primary.bold,
    },
    normalDot: {
      backgroundColor: theme.colors.primary,
    },

    // High (warning)
    highOption: {
      borderColor: theme.colors.warning,
      backgroundColor: theme.colors.warningSoft,
    },
    highIcon: {
      backgroundColor: theme.colors.warning,
    },
    highLabel: {
      color: theme.colors.warning,
      fontFamily: theme.typography.fontFamily.primary.bold,
    },
    highDot: {
      backgroundColor: theme.colors.warning,
    },

    // Critical (error)
    criticalOption: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorSoft,
    },
    criticalIcon: {
      backgroundColor: theme.colors.error,
    },
    criticalLabel: {
      color: theme.colors.error,
      fontFamily: theme.typography.fontFamily.primary.bold,
    },
    criticalDot: {
      backgroundColor: theme.colors.error,
    },
  }));
};
