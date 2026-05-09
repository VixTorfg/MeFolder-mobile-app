import React from "react";
import { Animated, View, Text, TouchableOpacity } from "react-native";
import * as MediaLibrary from "expo-media-library";
import { Ionicons } from "@expo/vector-icons";
import { usePressScaleAnimation, useStyles } from "@/hooks";

interface MediaLibraryAlbumRowProps {
  album: MediaLibrary.Album;
  isSelected: boolean;
  onPress: () => void;
}

export function MediaLibraryAlbumRow({
  album,
  isSelected,
  onPress,
}: MediaLibraryAlbumRowProps) {
  const styles = useMediaLibraryAlbumRowStyles();
  const { animatedStyle, handlePressIn, handlePressOut } =
    usePressScaleAnimation();

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.container, isSelected && styles.containerSelected]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}
      >
        <View style={styles.iconWrapper}>
          <Ionicons
            name="images-outline"
            size={20}
            color={styles.iconColor.color}
          />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {album.title}
          </Text>
          <Text style={styles.subtitle}>
            {album.assetCount ?? 0} archivos disponibles
          </Text>
        </View>
        {isSelected ? (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={styles.selectedColor.color}
          />
        ) : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

const useMediaLibraryAlbumRowStyles = () => {
  return useStyles((theme) => ({
    container: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.borderSoft,
      gap: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    containerSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    iconWrapper: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.subCard,
    },
    content: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    subtitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textSecondary,
    },
    iconColor: {
      color: theme.colors.textSecondary,
    },
    selectedColor: {
      color: theme.colors.primary,
    },
  }));
};
