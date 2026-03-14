import { Dimensions } from 'react-native';

export const getResponsiveSize = (screenWidth: number) => {
  const baseWidth = 375;
  const scale = screenWidth / baseWidth;
  
  return {
    iconSize: Math.round(24 + (4 * scale)), 
    padding: Math.round(16 + (8 * scale)),   
    tabPadding: Math.round(12 + (4 * scale)),
    scale, // Exponemos el scale para usar en otros componentes 
  };
};

/**
 * Calcula dimensiones proporcionales para MultiActionButton
 */
export const getMultiActionButtonDimensions = (baseSize: number, responsive: { scale: number }) => {
  const scaledSize = Math.round(baseSize * responsive.scale);
  
  return {
    buttonSize: scaledSize,
    iconSize: Math.round(scaledSize * 0.6),
    fontSize: Math.round(scaledSize * 0.2),  
    borderRadius: Math.round(scaledSize * 0.35), 
    padding: Math.round(scaledSize * 0.15), 
  };
};


export type ViewMode = 'list' | 'grid' | 'content' | 'big_icon' | 'medium_icon' | 'small_icon';

export interface GridConfig {
  columns: number;
}

const BREAKPOINTS = {
  phone: 480,
  tablet: 900,
};

const COLUMNS: Record<ViewMode, Record<'phone' | 'tablet', number>> = {
  big_icon:    { phone: 2, tablet: 3 },
  medium_icon: { phone: 3, tablet: 5 },
  small_icon:  { phone: 4, tablet: 6 },
  grid:        { phone: 2, tablet: 3 },
  list:        { phone: 1, tablet: 1 },
  content:     { phone: 1, tablet: 2 },
};

export const getGridConfig = (viewMode: ViewMode, width?: number): GridConfig => {
  const screenWidth = width ?? Dimensions.get('window').width;

  const breakpoint =
    screenWidth < BREAKPOINTS.phone  ? 'phone' : 'tablet'  

  return {
    columns: COLUMNS[viewMode][breakpoint],
  };
};