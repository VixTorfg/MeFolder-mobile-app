import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useListCardStyles } from './styles';
import { CommunCardProps } from '@/types';
import { FileModel } from '@/models/file';

export default function ListCard({
  onPress,
  disabled = false,
  data,
  showCard = true
}: CommunCardProps) {
  
  const styles = useListCardStyles();
 
  /**
   * Maneja el evento de presión del botón
   */
  const handlePress = async (): Promise<void> => {
    if (onPress && !disabled) {
      await onPress();
    }
  };
  
  if (!showCard) return null;

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={handlePress} 
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={styles.iconNameContainer}>
        <Ionicons 
          name={data instanceof FileModel ? 'document-outline' : 'folder-outline'} 
          size={30} 
          color={'red'}
        />

        <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode='tail'>
          {data.name}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

