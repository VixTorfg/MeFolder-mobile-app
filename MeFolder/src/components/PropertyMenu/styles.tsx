import { StyleSheet } from "react-native";
import { useStyles } from "@/hooks";

export const usePropertyMenuStyles = () => {
  return useStyles((theme) => ({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.5)",
    },
    containerWrapper: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      maxHeight: "90%",
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: theme.effects.radius.lg + 8,
      borderTopRightRadius: theme.effects.radius.lg + 8,
      paddingHorizontal: theme.spacing.lg,
    },
    handleZone: {
      alignItems: "center",
      paddingVertical: theme.spacing.md,
    },
    handle: {
      width: 40,
      height: 4,
      backgroundColor: theme.colors.borderSoft,
      borderRadius: theme.effects.radius.exs,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.lg,
    },
    headerTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.title.bold,
      color: theme.colors.textPrimary,
      maxWidth: "80%",
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.subCard,
      alignItems: "center",
      justifyContent: "center",
    },
    sectionSelector: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
    },
    typeOption: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    typeOptionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primarySoft,
    },
    typeOptionText: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    typeOptionTextActive: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamily.primary.bold,
    },
  }));
};

export const useFilePropertyMenuStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      gap: theme.spacing.md,
    },

    /* ── Header: icono + nombre ── */
    nameSection: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
    },
    fileIconContainer: {
      width: 44,
      height: 44,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },
    nameInputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    fileNameInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.xs,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    fileNameInputFocused: {
      borderColor: theme.colors.primary,
    },
    extensionBadge: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textMuted,
      paddingVertical: 2,
      paddingHorizontal: theme.spacing.xs,
      borderRadius: theme.effects.radius.xxs,
      backgroundColor: theme.colors.subCard,
    },
    renameButton: {
      width: 36,
      height: 36,
      borderRadius: theme.effects.radius.xs,
      backgroundColor: theme.colors.primarySoft,
      alignItems: "center",
      justifyContent: "center",
    },

    /* ── Cards / secciones ── */
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    /* ── Info rows ── */
    infoGrid: {
      gap: theme.spacing.xs,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    infoLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      minWidth: 90,
    },
    infoValue: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
      textAlign: "right",
    },

    descriptionValue: {
      flex: 1,
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textPrimary,
    },

    /* ── Tags ── */
    tagList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    tagChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.lg,
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    tagDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    tagChipText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
      fontStyle: "italic",
    },
    tagActions: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    tagButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.effects.radius.xs,
      backgroundColor: theme.colors.surface,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
    },
    tagButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },

    /* ── Placeholder customize ── */
    placeholderSection: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.xxl * 2,
      gap: theme.spacing.sm,
    },
    placeholderText: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textMuted,
    },
    placeholderSubtext: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textMuted,
    },
  }));
};

export const useFolderPropertyMenuStyles = () => {
  return useStyles((theme) => ({
    /* ── Preview (customize) ── */
    previewContainer: {
      alignItems: "center",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.lg,
    },
    previewIcon: {
      width: 80,
      height: 80,
      borderRadius: theme.effects.radius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    previewName: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
    },

    /* ── Color picker ── */
    colorScrollContent: {
      flexDirection: "row",
      gap: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    colorColumn: {
      gap: theme.spacing.sm,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: theme.effects.borderWidth.lg,
      borderColor: "transparent",
    },
    colorOptionSelected: {
      borderColor: theme.colors.textPrimary,
    },
    colorOptionInner: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },

    iconGridWrapper: {
      alignItems: "center",
      width: "100%",
    },
    iconGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm + 4,
    },
    iconOption: {
      width: 48,
      height: 48,
      borderRadius: theme.effects.radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    iconOptionSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },

    /* ── Attributes ── */
    attributeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    attributeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.lg,
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    attributeBadgeActive: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    attributeText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textMuted,
    },
    attributeTextActive: {
      color: theme.colors.primary,
    },

    /* ── Description input ── */
    textInput: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    textInputFocused: {
      borderColor: theme.colors.primary,
    },
    descriptionInput: {
      minHeight: 80,
      textAlignVertical: "top" as const,
    },
  }));
};

export const useFolderCreatorStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
    },
    inputGroup: {
      marginBottom: theme.spacing.lg,
    },
    label: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
      marginBottom: theme.spacing.sm,
    },
    textInput: {
      fontSize: theme.typography.fontSize.md,
      fontFamily: theme.typography.fontFamily.primary.regular,
      color: theme.colors.textPrimary,
      paddingVertical: theme.spacing.sm + 2,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      borderWidth: theme.effects.borderWidth.md,
      borderColor: theme.colors.borderSoft,
      backgroundColor: theme.colors.surface,
    },
    textInputFocused: {
      borderColor: theme.colors.primary,
    },
    descriptionInput: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    colorSection: {
      marginBottom: theme.spacing.lg,
    },
    colorList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: theme.effects.borderWidth.lg,
      borderColor: "transparent",
    },
    colorOptionSelected: {
      borderColor: theme.colors.textPrimary,
    },
    colorOptionInner: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    iconSection: {
      marginBottom: theme.spacing.lg,
    },
    iconGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    iconOption: {
      width: 48,
      height: 48,
      borderRadius: theme.effects.radius.md,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    iconOptionSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    tagSection: {
      marginBottom: theme.spacing.lg,
    },
    tagList: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.sm,
    },
    tagChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.effects.radius.lg,
      backgroundColor: theme.colors.subCard,
      borderWidth: theme.effects.borderWidth.xs,
      borderColor: theme.colors.borderSoft,
    },
    tagChipSelected: {
      backgroundColor: theme.colors.primarySoft,
      borderColor: theme.colors.primary,
    },
    tagDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    tagChipText: {
      fontSize: theme.typography.fontSize.sm,
      fontFamily: theme.typography.fontFamily.primary.medium,
      color: theme.colors.textSecondary,
    },
    tagChipTextSelected: {
      color: theme.colors.primary,
    },
    saveButton: {
      marginTop: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderRadius: theme.effects.radius.md,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    saveButtonDisabled: {
      backgroundColor: theme.colors.borderSoft,
    },
    saveButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontFamily: theme.typography.fontFamily.primary.bold,
      color: theme.colors.textOnColor,
    },
  }));
};
