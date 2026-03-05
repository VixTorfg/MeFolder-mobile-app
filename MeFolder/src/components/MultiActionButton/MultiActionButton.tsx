import { View, TouchableOpacity, Dimensions, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { MultiActionButtonProps } from '@/types';
import { getResponsiveSize, getMultiActionButtonDimensions } from '@/utils/ui/responsive';
import { useMultiActionButtonStyles } from '../MultiActionButton/styles';
import { defaultColor } from '@/themes/colors';

const { width: screenWidth } = Dimensions.get('window'); 
const responsive = getResponsiveSize(screenWidth);

export default function MultiActionButton({
  backgroundColor = defaultColor,
  icon = 'help-outline',
  label = '',
  disabled = false,
  borderRadius,
  iconColor = '#FFFFFF',
  size = 38,
  onPress,
}: MultiActionButtonProps) {
  
  const dimensions = getMultiActionButtonDimensions(size, responsive);
  const styles = useMultiActionButtonStyles(dimensions);
 
  /**
   * Maneja el evento de presión del botón
   */
  const handlePress = async (): Promise<void> => {
    if (onPress && !disabled) {
      await onPress();
    }
  };
  
  const resolvedBackgroundColor = typeof backgroundColor === 'string'
    ? backgroundColor
    : backgroundColor.hex;

  return (
    <TouchableOpacity 
      style={styles.buttonContainer} 
      onPress={handlePress} 
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={[
        styles.iconContainer,
        { 
          backgroundColor: resolvedBackgroundColor,
          borderRadius: borderRadius ?? dimensions.borderRadius,        
        }
      ]}>
        <Ionicons 
          name={icon} 
          size={dimensions.iconSize} 
          color={iconColor}
        />
        {label && (
          <Text style={styles.labelText}>
            {label}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

