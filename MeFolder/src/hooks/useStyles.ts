import { StyleSheet } from 'react-native';
import { useTheme } from '@/providers/ThemeProvider';
import type { Theme } from '@/constants/themes/types';

export const useStyles = <T extends StyleSheet.NamedStyles<T>>(
  styleFactory: (theme: Theme) => T
) => {
  const { theme } = useTheme();
  return StyleSheet.create(styleFactory(theme));
};