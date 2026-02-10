import { useStyles } from '@/hooks';

interface ButtonDimensions {
  buttonSize: number;
  iconSize: number;
  fontSize: number;
  borderRadius: number;
  padding: number;
}

export const useMultiActionButtonStyles = (
  dimensions: ButtonDimensions
) => {
  return useStyles(theme => ({
    buttonContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: dimensions.buttonSize,
      height: dimensions.buttonSize,
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      width: dimensions.buttonSize,
      height: dimensions.buttonSize,
    },
    labelText: {
      color: theme.colors.secondary,
      fontWeight: theme.typography.fontWeight.semiBold,
      textAlign: 'center',
      maxWidth: dimensions.buttonSize * 0.8, 
      fontSize: dimensions.fontSize,   
    },
  }));
};