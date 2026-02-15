import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGridCardStyles } from './styles';
import { EXTENSION_LABELS, CommunCardProps } from '@/types';
import { FileModel } from '@/models/file';
import { formatFileSize, formatVideoDuration } from '@/utils';
import type { FileExtensionWithoutVideo } from '@/types/common/file-extensions';



export default function GridCard({
  onPress,
  disabled = false,
  data,
  showCard = true
}: CommunCardProps) {
  const styles = useGridCardStyles();
 
  const handlePress = async (): Promise<void> => {
    if (onPress && !disabled) {
      await onPress();
    }
  };
  
  if (!showCard) return null;

  const renderExtensionLabel = (extension: FileExtensionWithoutVideo): string => {
    return EXTENSION_LABELS[extension] ?? 'Archivo';
  };

  return (
    <TouchableOpacity 
      style={styles.cardContainer} 
      onPress={handlePress} 
      disabled={disabled}
      activeOpacity={0.8}
    >
        <Ionicons 
          name={data instanceof FileModel ? 'document-outline' : 'folder-outline'} 
          size={30} 
          color={'red'}
        />

      <View style={styles.fileDetails}>
        <Text style={styles.fileNameText} numberOfLines={2} ellipsizeMode='tail'>
          {data.name}
        </Text>

        {data instanceof FileModel && (
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

