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