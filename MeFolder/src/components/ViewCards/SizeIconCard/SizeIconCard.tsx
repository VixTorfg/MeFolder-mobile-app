import { FileModel } from "@/models";
import { CommunCardProps } from "@/types/ui/components";
import { useSizeIconCardStyles } from "./styles";
import { TouchableOpacity, View, Text, TextInput } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { getIconByCategory } from "@/utils/ui/icons";
import { useEffect, useRef, useState } from "react";
import { removeExtension } from "@/utils/format/name";
import { Image } from "expo-image";

interface SizeIconCardProps extends CommunCardProps {
  size: number;
}

export const SizeIconCard = ({
  viewOptions,
  onPress,
  onDoublePress,
  onLongPress,
  onRenameCancel,
  isRenaming = false,
  onRename,
  disabled = false,
  data,
  showCard = true,
  selected = false,
  size,
}: SizeIconCardProps) => {
  const styles = useSizeIconCardStyles(size);
  const isFile = data instanceof FileModel;
  const lastTap = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [renameValue, setRenameValue] = useState(data.name);

  const showExtension = viewOptions?.showExtension;
  const showHiddenFiles = true; //viewOptions?.showHiddenFiles;

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(data.name);
    }
  }, [isRenaming, data.name]);

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

  const renderThumbnail = (file: FileModel) => {
    const iconName = getIconByCategory(file.category);
    const isImageOrVideo =
      file.category === "image" || file.category === "video";
    if (isImageOrVideo && file.thumbnailUrl) {
      return (
        <View style={styles.fileThumbnailContainer}>
          <Image
            source={{ uri: file.thumbnailUrl }}
            style={styles.fileThumbnail}
            contentFit="cover"
            transition={150}
          />
        </View>
      );
    } else {
      return (
        <View style={styles.fileThumbnailContainer}>
          <Ionicons
            name={iconName}
            size={32}
            color={data.color?.hex || styles.iconColor.color}
          />
        </View>
      );
    }
  };

  if (!showCard) return null;
  if (!showHiddenFiles && data.visibility === "private") return null;

  return (
    <TouchableOpacity
      style={selected ? styles.cardContainerSelected : styles.cardContainer}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      onLongPress={handleLongPress}
    >
      <View style={styles.iconContainer}>
        {isFile ? (
          renderThumbnail(data)
        ) : (
          <MaterialCommunityIcons
            name={data.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={size}
            color={data.color?.hex || styles.iconColor.color}
          />
        )}

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
            onBlur={() => {
              onRenameCancel?.();
            }}
            returnKeyType="done"
          />
        ) : (
          <Text
            style={styles.fileNameText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isFile
              ? showExtension
                ? data.name
                : removeExtension(data.name, data.extension)
              : data.name}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
