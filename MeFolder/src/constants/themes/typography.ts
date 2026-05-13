import { Typography } from './types';
import { fonts } from '../fonts';

export const typography: Typography = {
  fontFamily: {
    title: fonts.title,
    primary: fonts.primary,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    loose: 1.8,
  },
};