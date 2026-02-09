import { Theme } from "@/themes";

export const cardShadow = (theme: Theme) => ({
    shadowColor: '#0000005d',
    shadowOffset: theme.effects.shadowsOffset.slightDown,
    shadowOpacity: theme.effects.shadowsOpacity.sm,
    shadowRadius: theme.effects.radius.md,
    elevation: theme.effects.elevation.md,
    borderWidth: theme.effects.borderWidth.xs,
});

export const glowEffect = (theme: Theme) => ({
    shadowOffset: theme.effects.shadowsOffset.bitDown,
    shadowOpacity: theme.effects.shadowsOpacity.lg,
    shadowRadius: theme.effects.radius.exs,
    elevation: theme.effects.elevation.xs,
    borderRadius: theme.effects.radius.xxs,
});