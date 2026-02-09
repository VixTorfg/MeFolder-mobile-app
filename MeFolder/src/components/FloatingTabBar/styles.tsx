import { useStyles } from '@/hooks';
import { cardShadow, glowEffect } from '@/constants/styles/shadows';
import { Platform } from 'react-native';

export const useFloatingTabBarStyles = (responsive: 
{
    iconSize: number, 
    padding: number, 
    tabPadding: number
}) => {
    return useStyles(theme => ({
      floatingTabContainer: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 20,
        left: theme.spacing.lg,  //20,
        right: theme.spacing.lg,  //20,
        alignItems: 'center',
        pointerEvents: 'box-none',
        zIndex: 1000,
      },
      floatingTabBar: {
        ...cardShadow(theme),
        flexDirection: 'row',
        paddingHorizontal: responsive.padding,
        paddingVertical: theme.spacing.sm, //8
      },
      tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', 
        paddingVertical: responsive.tabPadding,
        paddingHorizontal: theme.spacing.xs, //4
        borderRadius: theme.effects.radius.lg,
        marginHorizontal: theme.spacing.xs - 2, //2
        minHeight: 44,
        position: 'relative', 
      },
      topBorder: {
        position: 'absolute',
        top: '-32%',
        left: '20%', 
        right: '20%', 
        height: theme.spacing.xs, //4
        borderRadius: theme.effects.radius.exs,
        zIndex: 2,
      },
      glowEffect: {
        ...glowEffect(theme),
        position: 'absolute',
        top: '-32%',
        left: '20%',
        right: '20%',
        height: theme.spacing.sm, //8
        zIndex: 1,
      },
    }));
};