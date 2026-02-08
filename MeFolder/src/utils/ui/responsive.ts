export const getResponsiveSize = (screenWidth: number) => {
  const baseWidth = 375;
  const scale = screenWidth / baseWidth;
  
  return {
    iconSize: Math.round(24 + (4 * scale)), 
    padding: Math.round(16 + (8 * scale)),   
    tabPadding: Math.round(12 + (4 * scale)), 
  };
};