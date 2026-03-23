import { View, TouchableOpacity, Text, TextInput } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useGridCardStyles } from './styles';
import { EXTENSION_LABELS, CommunCardProps } from '@/types';
import { FileModel } from '@/models/file';
import { formatFileSize, formatVideoDuration, getIconByCategory } from '@/utils';
import type { FileExtensionWithoutVideo } from '@/types/common/file-extensions';
import { useEffect, useRef, useState } from 'react';



export default function GridCard({
  onPress,
  onDoublePress,
  onLongPress,
  onRenameCancel,
  isRenaming = false,
  onRename,
  disabled = false,
  data,
  showCard = true,
  selected = false
}: CommunCardProps) {

  const styles = useGridCardStyles();
  const isFile = data instanceof FileModel;
  const lastTap = useRef(0); 
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [renameValue, setRenameValue] = useState(data.name);
  
  useEffect(() => {
      if (isRenaming) {
        setRenameValue(data.name);
      }
    }, [isRenaming, data.name]);
  
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
          <MaterialCommunityIcons 
                name={data.icon as keyof typeof MaterialCommunityIcons.glyphMap} 
                size={32} 
                color={data.color?.hex || styles.iconColor.color}
              />
        </View>
      )}

      <View style={styles.fileDetails}>
        {isRenaming ? (
            <TextInput
                style={styles.fileNameInput}
                value={renameValue}
                onChangeText={setRenameValue}
                placeholder="Nombre del archivo"
                placeholderTextColor={styles.colors.color}
                selectTextOnFocus
                numberOfLines={1}
                scrollEnabled
                textAlignVertical="center"
                autoFocus
                onSubmitEditing={() => {
                  if (renameValue.trim() && renameValue !== data.name) {
                    onRename && onRename(renameValue.trim());
                  }
                }}
                onBlur={() => {onRenameCancel?.()}}
                returnKeyType="done"
          />) : (
        <Text style={styles.fileNameText} numberOfLines={isFile ? 2 : 1} ellipsizeMode='tail'>
          {data.name}
        </Text>
      )}

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

