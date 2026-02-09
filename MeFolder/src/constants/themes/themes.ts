import { Theme } from './types';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { effects } from './effects';

const baseTheme = {
  spacing,
  typography,
  effects
};

export const lightTheme: Theme = {
  ...baseTheme,
  colors: lightColors,
};

export const darkTheme: Theme = {
  ...baseTheme,
  colors: darkColors,
};