import { Theme } from "@/themes";
import { cardShadow } from "./shadows";

export const basicCard = (theme: Theme) => ({
    ...cardShadow(theme),
    backgroundColor: theme.colors.card,
    borderRadius: theme.effects.radius.xs,
    borderWidth: theme.effects.borderWidth.xs,
    borderColor: theme.colors.borderSoft,
});