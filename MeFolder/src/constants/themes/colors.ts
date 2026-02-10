import { ColorInfo } from '@/src/types/common/colors';
import { Colors } from './types';

export const lightColors: Colors = {
  background: '#FAFAF7',
  backgroundSoft: '#F4F4EE',
  surface: '#FFFFFF',

  card: '#FFFFFF',
  subCard: '#F1F2EB',
  borderSoft: '#E2E3DA',

  textPrimary: '#2B2B28',
  textSecondary: '#6B6B63',
  textMuted: '#9A9A90',
  textOnColor: '#FFFFFF',

  primary: '#F2C94C',
  primaryHover: '#E6BC3E',
  primarySoft: '#FFF4CC',

  secondary: '#5DA9C7',
  secondarySoft: '#E6F3F8',

  success: '#6FCF97',
  successSoft: '#E8F6EF',

  warning: '#F2994A',
  warningSoft: '#FDEBD9',

  error: '#EB5757',
  errorSoft: '#FCEAEA',

  divider: '#E8E9E1',
  focusRing: '#F2C94C',
};

export const darkColors: Colors = {
  background: '#161613',       
  backgroundSoft: '#1D1D19',
  surface: '#23231E',

  card: '#25251F',
  subCard: '#2C2C25',
  borderSoft: '#34342C',

  textPrimary: '#F5F5EF',
  textSecondary: '#C7C7BC',
  textMuted: '#9E9E92',
  textOnColor: '#1A1A17',

  primary: '#F2C94C',
  primaryHover: '#FFD970',
  primarySoft: 'rgba(242, 201, 76, 0.15)',

  secondary: '#6FB6D6',
  secondarySoft: 'rgba(111, 182, 214, 0.15)',

  success: '#6FCF97',
  successSoft: 'rgba(111, 207, 151, 0.15)',

  warning: '#F2994A',
  warningSoft: 'rgba(242, 153, 74, 0.18)',

  error: '#EB5757',
  errorSoft: 'rgba(235, 87, 87, 0.18)',

  divider: '#2E2E27',
  focusRing: '#F2C94C',
};

export const defaultColor: ColorInfo = {
  hex: lightColors.primary,
  rgb: 
  {
    r: parseInt(lightColors.primary.slice(1, 3), 16),
    g: parseInt(lightColors.primary.slice(3, 5), 16),
    b: parseInt(lightColors.primary.slice(5, 7), 16),
  },
  name: 'Primary',
  isSystem: false
}
