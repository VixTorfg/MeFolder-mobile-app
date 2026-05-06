import React from "react";
import { View, Text, ActivityIndicator } from "react-native";
import type { MediaImportProgress } from "@/types/media";
import { useStyles } from "@/hooks";

interface MediaImportProgressOverlayProps {
  visible: boolean;
  title: string;
  progress: MediaImportProgress;
}

export function MediaImportProgressOverlay({
  visible,
  title,
  progress,
}: MediaImportProgressOverlayProps) {
  const styles = useMediaImportProgressOverlayStyles();

  if (!visible) {
    return null;
  }

  const ratio = progress.total > 0 ? progress.completed / progress.total : 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={styles.spinnerColor.color} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          {progress.completed} / {progress.total || 0}
        </Text>
        {progress.currentFileName ? (
          <Text style={styles.currentFile} numberOfLines={1}>
            {progress.currentFileName}
          </Text>
        ) : null}
        <View style={styles.track}>
          <View
            style={[styles.fill, { width: `${Math.min(ratio * 100, 100)}%` }]}
          />
        </View>
      </View>
    </View>
  );
}

const useMediaImportProgressOverlayStyles = () => {
  return useStyles((theme) => ({
    overlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
      zIndex: 50,
    },
    card: {
      width: "100%",
      maxWidth: 360,
      borderRadius: theme.effects.radius.lg,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.xl,
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    title: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    subtitle: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    currentFile: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      textAlign: "center",
    },
    track: {
      width: "100%",
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.colors.borderSoft,
      overflow: "hidden",
      marginTop: theme.spacing.sm,
    },
    fill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    spinnerColor: {
      color: theme.colors.primary,
    },
  }));
};
