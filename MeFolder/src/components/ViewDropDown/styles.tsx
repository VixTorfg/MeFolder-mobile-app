import { useStyles } from '@/hooks';
import { cardShadow } from '@/constants/styles/shadows';


export const useViewDropDownStyles = (responsive: {
    iconSize: number, 
    padding: number, 
    tabPadding: number
}) => {
  const horizantalPadding = responsive.padding - 12;
  return useStyles(theme => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: theme.effects.shadowColor.default,
    },
    dropdownContainer: {
      position: 'absolute',
      top: '10%', 
      right: 16,
      zIndex: 1000,
    },
    dropdown: {
      ...cardShadow(theme),
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      minWidth: 200,
      borderColor: theme.colors.borderSoft,
    },

    dropdownHeader: {
      paddingHorizontal: horizantalPadding,
      paddingVertical: responsive.padding / 2,
      borderBottomWidth: theme.effects.borderWidth.md,
      borderBottomColor: theme.colors.borderSoft,
    },
    dropdownTitle: {
      fontFamily: theme.typography.fontFamily.title.semiBold,
      fontSize: responsive.iconSize * 0.55,
      color: theme.colors.textPrimary,
    },
    dropdownItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: horizantalPadding,
      paddingVertical: responsive.padding / 2,
      gap: 12,
    },
    selectedItem: {
      backgroundColor: theme.colors.primarySoft,
    },
    selectedIconColor: {
      color: theme.colors.primary,
    },
    IconColor:{
      color: theme.colors.textPrimary,
    },
    itemText: {
      flex: 1,
      fontSize: responsive.iconSize / 2,
      color: theme.colors.textPrimary,
      fontFamily: theme.typography.fontFamily.primary.regular,
    },
    selectedItemText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.primary.medium,
    },
    checkmark: {
      color: theme.colors.primary,
    },
  }));
};