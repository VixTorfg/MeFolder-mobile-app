import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContentCardStyles } from './styles';
import { CommunCardProps } from '@/types';
import { FileModel } from '@/models/file';
import { formatDate, formatFileSize } from '@/utils';


export default function ContentCard({
  onPress,
  disabled = false,
  data,
  showCard = true
}: CommunCardProps) {
  
  const styles = useContentCardStyles();
 
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

        <Text style={styles.fileNameText} numberOfLines={2} ellipsizeMode='tail'>
          {data.name}
        </Text>
      </View>

      <View style={styles.fileDetails}>
        <Text style={styles.fileDetailsText}>
          {formatDate(data.updatedAt)}
        </Text>

        <Text style={styles.fileDetailsText}>
          {data instanceof FileModel ? formatFileSize(data.size) : null}
        </Text>
      </View>
        
    </TouchableOpacity>
  );
}

