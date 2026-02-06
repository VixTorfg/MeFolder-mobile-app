import { Theme } from './types';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

const baseTheme = {
  spacing,
  typography,
  borderRadius: 8,
  shadowOffset: {
    width: 0,
    height: 2,
  },
  shadowOpacity: 0.1,
  shadowRadius: 4,
};

export const lightTheme: Theme = {
  ...baseTheme,
  colors: lightColors,
};

export const darkTheme: Theme = {
  ...baseTheme,
  colors: darkColors,
};