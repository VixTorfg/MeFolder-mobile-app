import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useContentCardStyles } from './styles';
import { CommunCardProps } from '@/types';
import { FileModel } from '@/models/file';
import { formatDate, formatFileSize, getIconByCategory } from '@/utils';


export default function ContentCard({
  onPress,
  onLongPress,
  disabled = false,
  data,
  showCard = true,
  selected = false
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

  const handleLongPress = async (): Promise<void> => {
    if (onLongPress && !disabled) {
      await onLongPress();
    }
  };
  
  if (!showCard) return null;

  return (
    <TouchableOpacity 
      style={selected ? styles.cardContainerSelected : styles.cardContainer} 
      onPress={handlePress} 
      disabled={disabled}
      activeOpacity={0.8}
      onLongPress={handleLongPress}
    >
      <View style={styles.iconNameContainer}>
          {data instanceof FileModel ? (
            <View style={styles.fileThumbnail}>
              <Ionicons 
                name={getIconByCategory(data.category)} 
                size={30} 
                color={data.color?.hex || styles.iconColor.color}
              />
            </View>
          ) : (
            <View style={styles.folderContainer}>
              <Ionicons 
                  name={data.icon as keyof typeof Ionicons.glyphMap} 
                  size={30} 
                  color={data.color?.hex || styles.iconColor.color}
                />
            </View>
          )}

        <Text style={styles.fileNameText} numberOfLines={2} ellipsizeMode='tail'>
          {data.name}
        </Text>
      </View>

      <View style={styles.fileDetails}>
        <Text style={styles.fileDetailsText}>
          {data instanceof FileModel ? formatDate(data.updatedAt) : null}
        </Text>

        <Text style={styles.fileDetailsText}>
          {data instanceof FileModel ? formatFileSize(data.size) : null}
        </Text>
      </View>
        
    </TouchableOpacity>
  );
}

