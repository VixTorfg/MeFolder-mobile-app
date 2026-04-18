import { View, TouchableOpacity, Text, TextInput } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useGridCardStyles } from "./styles";
import { EXTENSION_LABELS, CommunCardProps } from "@/types";
import { FileModel } from "@/models/file";
import {
  formatFileSize,
  formatVideoDuration,
  getIconByCategory,
  isIoniconsIcon,
  removeExtension,
} from "@/utils";
import type { FileExtensionWithoutVideo } from "@/types/common/file-extensions";
import { useEffect, useRef, useState } from "react";
import { Image } from "expo-image";

export default function GridCard({
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
  selectionMode = false,
}: CommunCardProps) {
  const styles = useGridCardStyles();
  const isFile = data instanceof FileModel;
  const lastTap = useRef(0);
  const tapTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<View>(null);

  const [renameValue, setRenameValue] = useState(data.name);

  const showExtension = viewOptions?.showExtension;
  const showHiddenFiles = true; //viewOptions?.showHiddenFiles;

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

    if (selectionMode) {
      await onPress?.();
      return;
    }

    const now = Date.now();
    const isDoubleTap = now - lastTap.current < 200;
    lastTap.current = now;

    if (isDoubleTap) {
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
        tapTimeout.current = null;
      }
      cardRef.current?.measureInWindow((x, y, width, height) => {
        onDoublePress?.({ x, y, width, height });
      });
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

  const renderExtensionLabel = (
    extension: FileExtensionWithoutVideo,
  ): string => {
    return EXTENSION_LABELS[extension] ?? "Archivo";
  };

  return (
    <TouchableOpacity
      ref={cardRef}
      style={selected ? styles.cardContainerSelected : styles.cardContainer}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      onLongPress={handleLongPress}
    >
      {isFile ? (
        renderThumbnail(data)
      ) : (
        <View style={styles.folderContainer}>
          {isIoniconsIcon(data.icon ?? "folder") ? (
            <Ionicons
              name={(data.icon ?? "folder") as keyof typeof Ionicons.glyphMap}
              size={32}
              color={data.color?.hex || styles.iconColor.color}
            />
          ) : (
            <MaterialCommunityIcons
              name={data.icon as keyof typeof MaterialCommunityIcons.glyphMap}
              size={32}
              color={data.color?.hex || styles.iconColor.color}
            />
          )}
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
            onBlur={() => {
              onRenameCancel?.();
            }}
            returnKeyType="done"
          />
        ) : (
          <Text
            style={styles.fileNameText}
            numberOfLines={isFile ? 2 : 1}
            ellipsizeMode="tail"
          >
            {isFile
              ? showExtension
                ? data.name
                : removeExtension(data.name, data.extension)
              : data.name}
          </Text>
        )}

        {isFile && (
          <View>
            <Text style={styles.fileDetailsText}>
              {data.category === "video"
                ? formatVideoDuration(data.metadata.videoMetadata?.duration)
                : renderExtensionLabel(
                    data.extension as FileExtensionWithoutVideo,
                  )}
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
