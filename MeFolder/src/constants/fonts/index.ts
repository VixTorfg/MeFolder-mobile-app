/**
 * Font Configuration
 * 
 * Este módulo centraliza la carga y el mapeo de fuentes para toda la app.
 */

/**
 * Pesos de fuente disponibles
 */
export type FontWeight = 'regular' | 'medium' | 'semiBold' | 'bold';

/**
 * Mapeo de archivos de fuentes para carga con expo-font.
 * Las keys son los nombres con los que se registran las fuentes.
 */
export const fontAssets = {
  // Inter (primary - cuerpo de texto)
  'Inter-Regular':    require('@/assets/fonts/inter/Inter_28pt-Regular.ttf'),
  'Inter-Medium':     require('@/assets/fonts/inter/Inter_28pt-Medium.ttf'),
  'Inter-SemiBold':   require('@/assets/fonts/inter/Inter_28pt-SemiBold.ttf'),
  'Inter-Bold':       require('@/assets/fonts/inter/Inter_28pt-Bold.ttf'),

  // Montserrat (title - títulos y encabezados)
  'Montserrat-Regular':   require('@/assets/fonts/montserrat/Montserrat-Regular.ttf'),
  'Montserrat-Medium':    require('@/assets/fonts/montserrat/Montserrat-Medium.ttf'),
  'Montserrat-SemiBold':  require('@/assets/fonts/montserrat/Montserrat-SemiBold.ttf'),
  'Montserrat-Bold':      require('@/assets/fonts/montserrat/Montserrat-Bold.ttf'),
} as const;

export const fonts = {
  primary: {
    regular:  'Inter-Regular',
    medium:   'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold:     'Inter-Bold',
  },
  title: {
    regular:  'Montserrat-Regular',
    medium:   'Montserrat-Medium',
    semiBold: 'Montserrat-SemiBold',
    bold:     'Montserrat-Bold',
  },
} as const;

/**
 * Tipo para las familias de fuentes disponibles
 */
export type FontFamily = keyof typeof fonts;
