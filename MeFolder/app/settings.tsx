import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MultiActionButton } from "@/components/MultiActionButton";
import { CustomPopup } from "@/components/CustomAlert/CustomPopup";
import { formatFileSize } from "@/utils/format";
import { useStyles } from "@/hooks/useStyles";
import { useAlert, useServices, useTheme } from "@/providers";
import Constants from "expo-constants";
import { Paths } from "expo-file-system";
import { router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  BackHandler,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const THEME_OPTIONS = [
  {
    value: "light",
    title: "Claro",
    description: "Usa siempre el tema claro.",
    icon: "white-balance-sunny",
  },
  {
    value: "dark",
    title: "Oscuro",
    description: "Usa siempre el tema oscuro.",
    icon: "moon-waning-crescent",
  },
  {
    value: "system",
    title: "Tema del dispositivo",
    description: "Sigue automáticamente la configuración del sistema.",
    icon: "cellphone-cog",
  },
] as const;

type ThemeOptionValue = (typeof THEME_OPTIONS)[number]["value"];

type StorageLegendKey = "image" | "video" | "audio" | "documents" | "other";

interface StorageUsageSummary {
  totalAppBytes: number;
  sizeByGroup: Record<StorageLegendKey, number>;
}

const EMPTY_STORAGE_USAGE: StorageUsageSummary = {
  totalAppBytes: 0,
  sizeByGroup: {
    image: 0,
    video: 0,
    audio: 0,
    documents: 0,
    other: 0,
  },
};

const SettingsOptionRow = ({
  title,
  description,
  selected,
  icon,
  onPress,
}: {
  title: string;
  description: string;
  selected: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
}) => {
  const styles = useSettingsStyles();

  return (
    <TouchableOpacity
      style={[styles.optionRow, selected && styles.optionRowSelected]}
      onPress={onPress}
    >
      <View style={styles.optionRowContent}>
        <View style={styles.optionIconWrapper}>
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={styles.iconColor.color}
          />
        </View>
        <View style={styles.optionTextGroup}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionDescription}>{description}</Text>
        </View>
      </View>

      <MaterialCommunityIcons
        name={selected ? "radiobox-marked" : "radiobox-blank"}
        size={22}
        color={
          selected ? styles.iconColor.primaryColor : styles.iconColor.color
        }
      />
    </TouchableOpacity>
  );
};

const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const styles = useSettingsStyles();
  const { services } = useServices();
  const { showAlert } = useAlert();
  const { currentTheme, isThemeHydrated, setTheme, themePreference } =
    useTheme();
  const appVersion = Constants.expoConfig?.version ?? "Desconocida";
  const [storageUsage, setStorageUsage] =
    useState<StorageUsageSummary>(EMPTY_STORAGE_USAGE);
  const [isStorageLoading, setIsStorageLoading] = useState(true);
  const [isDeletingContent, setIsDeletingContent] = useState(false);

  useEffect(() => {
    const loadStorageUsage = async () => {
      try {
        setIsStorageLoading(true);
        const summary = await services.fileService.getStorageUsageSummary();
        setStorageUsage(summary);
      } catch (error) {
        console.warn("No se pudo cargar el resumen de almacenamiento", error);
        setStorageUsage(EMPTY_STORAGE_USAGE);
      } finally {
        setIsStorageLoading(false);
      }
    };

    void loadStorageUsage();
  }, [services.fileService]);

  const deviceTotalBytes = Math.max(Paths.totalDiskSpace ?? 0, 0);
  const appUsagePercentage =
    deviceTotalBytes > 0
      ? (storageUsage.totalAppBytes / deviceTotalBytes) * 100
      : 0;

  const storageLegend = useMemo(
    () => [
      {
        key: "image" as const,
        title: "Imágenes",
        color: styles.storageSegmentImage.backgroundColor,
      },
      {
        key: "video" as const,
        title: "Vídeo",
        color: styles.storageSegmentVideo.backgroundColor,
      },
      {
        key: "audio" as const,
        title: "Audio",
        color: styles.storageSegmentAudio.backgroundColor,
      },
      {
        key: "documents" as const,
        title: "Documentos",
        color: styles.storageSegmentDocuments.backgroundColor,
      },
      {
        key: "other" as const,
        title: "Otros",
        color: styles.storageSegmentOther.backgroundColor,
      },
    ],
    [
      styles.storageSegmentAudio.backgroundColor,
      styles.storageSegmentDocuments.backgroundColor,
      styles.storageSegmentImage.backgroundColor,
      styles.storageSegmentOther.backgroundColor,
      styles.storageSegmentVideo.backgroundColor,
    ],
  );

  const exitApp = useCallback(() => {
    BackHandler.exitApp();
  }, []);

  const handleDeleteAllContent = useCallback(() => {
    showAlert({
      title: "Borrar todo el contenido",
      message:
        "Se eliminarán todos los archivos, carpetas, tags y datos asociados de MeFolder. Esta acción no se puede deshacer.",
      buttons: [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            try {
              setIsDeletingContent(true);
              await services.fileService.clearAllStoredContent();
              setIsDeletingContent(false);

              showAlert({
                title: "Borrado completado",
                message:
                  "El borrado ha finalizado con exito, es necesario salir de la app",
                buttons: [{ text: "Vale" }],
                onDismiss: exitApp,
              });
            } catch (error) {
              setIsDeletingContent(false);
              showAlert({
                title: "Error al borrar contenido",
                message:
                  error instanceof Error
                    ? error.message
                    : "No se ha podido borrar el contenido de la app.",
              });
            }
          },
        },
      ],
    });
  }, [exitApp, services.fileService, showAlert]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <MultiActionButton
          icon={"chevron-back"}
          backgroundColor="transparent"
          iconColor={styles.iconColor.color}
          size={42}
          onPress={() => {
            router.back();
          }}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: insets.bottom + styles.contentBottomSpacing.height },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Tema</Text>

          <View style={styles.currentThemeSummary}>
            <Text style={styles.currentThemeLabel}>Tema activo</Text>
            <Text style={styles.currentThemeValue}>
              {isThemeHydrated
                ? currentTheme === "dark"
                  ? "Oscuro"
                  : "Claro"
                : "Cargando..."}
            </Text>
          </View>

          {THEME_OPTIONS.map((option) => (
            <SettingsOptionRow
              key={option.value}
              title={option.title}
              description={option.description}
              icon={option.icon}
              selected={themePreference === option.value}
              onPress={() => {
                void setTheme(option.value as ThemeOptionValue);
              }}
            />
          ))}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Almacenamiento</Text>

          <View style={styles.currentThemeSummary}>
            <Text style={styles.currentThemeLabel}>Uso de MeFolder</Text>
            <Text style={styles.currentThemeValue}>
              {isStorageLoading
                ? "Calculando..."
                : `${formatFileSize(storageUsage.totalAppBytes)} de ${formatFileSize(deviceTotalBytes)}`}
            </Text>
          </View>

          <Text style={styles.sectionDescription}>
            {isStorageLoading
              ? "Calculando el espacio ocupado por el contenido de la app..."
              : `El contenido de MeFolder ocupa el ${appUsagePercentage.toFixed(2)}% del almacenamiento total del dispositivo.`}
          </Text>

          <View style={styles.storageBarTrack}>
            {storageLegend.map((item) => {
              const groupBytes = storageUsage.sizeByGroup[item.key];
              const widthPercentage =
                deviceTotalBytes > 0
                  ? (groupBytes / deviceTotalBytes) * 100
                  : 0;

              if (widthPercentage <= 0) {
                return null;
              }

              const segmentStyle =
                item.key === "image"
                  ? styles.storageSegmentImage
                  : item.key === "video"
                    ? styles.storageSegmentVideo
                    : item.key === "audio"
                      ? styles.storageSegmentAudio
                      : item.key === "documents"
                        ? styles.storageSegmentDocuments
                        : styles.storageSegmentOther;

              return (
                <View
                  key={item.key}
                  style={[
                    styles.storageBarSegment,
                    segmentStyle,
                    { width: `${widthPercentage}%` },
                  ]}
                />
              );
            })}
          </View>

          <View style={styles.storageLegendContainer}>
            {storageLegend.map((item) => (
              <View key={item.key} style={styles.optionRow}>
                <View style={styles.optionRowContent}>
                  <View
                    style={[
                      styles.storageLegendSwatch,
                      { backgroundColor: item.color },
                    ]}
                  />
                  <View style={styles.optionTextGroup}>
                    <Text style={styles.optionTitle}>{item.title}</Text>
                    <Text style={styles.optionDescription}>
                      {formatFileSize(storageUsage.sizeByGroup[item.key])}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.optionRow, styles.destructiveOptionRow]}
            onPress={handleDeleteAllContent}
          >
            <View style={styles.optionRowContent}>
              <View
                style={[
                  styles.optionIconWrapper,
                  styles.destructiveOptionIconWrapper,
                ]}
              >
                <MaterialCommunityIcons
                  name="trash-can-outline"
                  size={20}
                  color={styles.destructiveOptionIcon.color}
                />
              </View>
              <View style={styles.optionTextGroup}>
                <Text style={styles.destructiveOptionTitle}>
                  Borrar todo el contenido
                </Text>
                <Text style={styles.optionDescription}>
                  Elimina todos los archivos y carpetas almacenados en MeFolder.
                </Text>
              </View>
            </View>

            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={styles.destructiveOptionChevron.color}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>MeFolder © 2026</Text>
          <Text style={styles.footerText}>Todos los derechos reservados</Text>
          <Text style={[styles.footerText, { marginTop: 8 }]}>
            Versión: {appVersion}
          </Text>
        </View>
      </ScrollView>

      <CustomPopup
        title="Borrando contenido"
        isVisible={isDeletingContent}
        onDismiss={() => undefined}
        dismissOnBackdropPress={false}
      >
        <View style={styles.popupLoadingContent}>
          <ActivityIndicator
            size="large"
            color={styles.iconColor.primaryColor}
          />
          <Text style={styles.popupLoadingText}>
            Eliminando el contenido almacenado de la app&hellip;
          </Text>
          <Text style={styles.popupLoadingHint}>
            La operación puede tardar unos segundos.
          </Text>
        </View>
      </CustomPopup>
    </View>
  );
};

const useSettingsStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    iconColor: {
      color: theme.colors.textPrimary,
      primaryColor: theme.colors.primary,
    },
    content: {
      flex: 1,
    },
    contentContainer: {
      padding: theme.spacing.md,
      gap: theme.spacing.md,
      flexGrow: 1,
    },
    contentBottomSpacing: {
      height: theme.spacing.xl,
    },
    sectionCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.effects.radius.lg,
      padding: theme.spacing.md,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      gap: theme.spacing.md,
    },
    sectionTitle: {
      fontFamily: theme.typography.fontFamily.title.semiBold,
      fontSize: 20,
      color: theme.colors.textPrimary,
    },
    sectionDescription: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 14,
      lineHeight: 20,
      color: theme.colors.textSecondary,
    },
    currentThemeSummary: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.background,
    },
    currentThemeLabel: {
      fontFamily: theme.typography.fontFamily.primary.medium,
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    currentThemeValue: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    optionRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.md,
      padding: theme.spacing.sm,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.background,
    },
    optionRowSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    optionRowContent: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.md,
    },
    optionIconWrapper: {
      width: 36,
      height: 36,
      borderRadius: theme.effects.radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surface,
    },
    optionTextGroup: {
      flex: 1,
      gap: theme.spacing.xs,
    },
    optionTitle: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    optionDescription: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textSecondary,
    },
    storageBarTrack: {
      height: 18,
      borderRadius: theme.effects.radius.md,
      overflow: "hidden",
      flexDirection: "row",
      backgroundColor: theme.colors.background,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    storageBarSegment: {
      height: "100%",
      minWidth: 2,
    },
    storageSegmentImage: {
      backgroundColor: theme.colors.primary,
    },
    storageSegmentVideo: {
      backgroundColor: theme.colors.warning,
    },
    storageSegmentAudio: {
      backgroundColor: theme.colors.success,
    },
    storageSegmentDocuments: {
      backgroundColor: theme.colors.secondary,
    },
    storageSegmentOther: {
      backgroundColor: theme.colors.textMuted,
    },
    storageLegendContainer: {
      gap: theme.spacing.sm,
    },
    storageLegendSwatch: {
      width: 16,
      height: 16,
      borderRadius: theme.effects.radius.xxs,
      alignSelf: "center",
    },
    destructiveOptionRow: {
      borderColor: theme.colors.error,
      backgroundColor: theme.colors.errorSoft,
    },
    destructiveOptionIconWrapper: {
      backgroundColor: theme.colors.errorSoft,
    },
    destructiveOptionIcon: {
      color: theme.colors.error,
    },
    destructiveOptionTitle: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 16,
      color: theme.colors.error,
    },
    destructiveOptionChevron: {
      color: theme.colors.error,
    },
    popupLoadingContent: {
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    popupLoadingText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 15,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    popupLoadingHint: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 13,
      lineHeight: 18,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
    footer: {
      paddingTop: theme.spacing.md,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    footerText: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
  }));
};

export default SettingsScreen;
