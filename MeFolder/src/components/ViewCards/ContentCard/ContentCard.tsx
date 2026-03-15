import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useContentCardStyles } from './styles';
import { CommunCardProps } from '@/types';
import { FileModel } from '@/models/file';
import { formatDate, formatFileSize, getIconByCategory } from '@/utils';
import { useRef } from 'react';


export default function ContentCard({
  onPress,
  onDoublePress,
  onLongPress,
  disabled = false,
  data,
  showCard = true,
  selected = false
}: CommunCardProps) {
  
  const styles = useContentCardStyles();
  const isFile = data instanceof FileModel;
  const lastTap = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
 
  /**
   * Maneja el evento de presión del botón
   */
  const handlePress = async (): Promise<void> => { 
    if (disabled) return;
    
    const now = Date.now();
    const isDoubleTap = now - lastTap.current < 200;
    lastTap.current = now;

    if (isDoubleTap) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      await onDoublePress?.();
    } else {
      tapTimeout.current = setTimeout(async () => {
        tapTimeout.current = null;
        await onPress?.();
      }, 200);
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
          {isFile ? (
            <View style={styles.fileThumbnail}>
              <Ionicons 
                name={getIconByCategory(data.category)} 
                size={30} 
                color={data.color?.hex || styles.iconColor.color}
              />
            </View>
          ) : (
            <View style={styles.folderContainer}>
              <MaterialCommunityIcons 
                  name={data.icon as keyof typeof MaterialCommunityIcons.glyphMap} 
                  size={32} 
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
          {isFile ? formatDate(data.updatedAt) : null}
        </Text>

        <Text style={styles.fileDetailsText}>
          {isFile ? formatFileSize(data.size) : null}
        </Text>
      </View>
        
    </TouchableOpacity>
  );
}

