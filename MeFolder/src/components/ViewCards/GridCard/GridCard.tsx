import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGridCardStyles } from './styles';
import { EXTENSION_LABELS, CommunCardProps } from '@/types';
import { FileModel } from '@/models/file';
import { formatFileSize, formatVideoDuration, getIconByCategory } from '@/utils';
import type { FileExtensionWithoutVideo } from '@/types/common/file-extensions';



export default function GridCard({
  onPress,
  onLongPress,
  disabled = false,
  data,
  showCard = true,
  selected = false
}: CommunCardProps) {

  const styles = useGridCardStyles();
  const isFile = data instanceof FileModel;
 
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

  const renderExtensionLabel = (extension: FileExtensionWithoutVideo): string => {
    return EXTENSION_LABELS[extension] ?? 'Archivo';
  };

  return (
    <TouchableOpacity 
      style={selected ? styles.cardContainerSelected : styles.cardContainer} 
      onPress={handlePress} 
      disabled={disabled}
      activeOpacity={0.8}
      onLongPress={handleLongPress}
    >
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
          <Ionicons 
              name={data.icon as keyof typeof Ionicons.glyphMap} 
              size={30} 
              color={data.color?.hex || styles.iconColor.color}
            />
        </View>
      )}

      <View style={styles.fileDetails}>
        <Text style={styles.fileNameText} numberOfLines={isFile ? 2 : 1} ellipsizeMode='tail'>
          {data.name}
        </Text>

        {isFile && (
          <View>
            <Text style={styles.fileDetailsText}>
              {data.category === 'video'
                ? formatVideoDuration(data.metadata.videoMetadata?.duration)
                : renderExtensionLabel(data.extension as FileExtensionWithoutVideo)}
            </Text>

            <Text style={styles.fileDetailsText}>
              {formatFileSize(data.size)}
            </Text>
          </View>
        )}
      </View>   
    </TouchableOpacity>
  );
}

