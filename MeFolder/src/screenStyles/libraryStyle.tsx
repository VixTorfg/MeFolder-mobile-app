import { useStyles } from "@/hooks";
import { cardShadow } from "@/constants/styles/shadows";

export const useLibraryStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 8,
      paddingVertical: 24,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      width: 42,
      marginRight: theme.spacing.sm,
    },
    headerBreadcrumb: {
      alignItems: "center",
      marginVertical: theme.spacing.sm,
    },
    headerBreadcrumbText: {
      fontSize: 34,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
      maxWidth: "80%",
      textAlign: "center",
    },
    section: {
      padding: 16,
    },
    cardWrapper: {
      flex: 1,
      alignItems: "center",
      paddingBottom: theme.spacing.sm,
    },
    gridCardWrapper: {
      paddingHorizontal: 5,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: "#212529",
      marginBottom: 12,
    },
    card: {
      backgroundColor: "#fff",
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "500",
      color: "#212529",
      marginBottom: 4,
    },
    cardSubtitle: {
      fontSize: 14,
      color: "#6c757d",
    },
    buttonsGroup: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 8,
    },
    buttonsGroupSearchExpanded: {
      justifyContent: "center",
      paddingRight: 12,
    },
    iconColor: {
      color: theme.colors.textPrimary,
      primaryColor: theme.colors.primary,
    },
    volverButton: {
      ...cardShadow(theme),
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      alignSelf: "center",
      justifyContent: "flex-end",
      paddingVertical: theme.spacing.md,
      marginBottom: 126,
      width: "80%",
    },
    volverText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    emptyFolderIconContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyFolderText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textSecondary,
      textAlign: "center",
      marginTop: 16,
    },
    footerEmptyContainer: {
      flex: 1,
      alignItems: "center",
    },
    flatListContent: {
      paddingBottom: 120,
      gap: 10,
      padding: 16,
    },
    popupMessage: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    popupCheckboxRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.xs,
    },
    popupCheckboxLabel: {
      flex: 1,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 14,
      color: theme.colors.textPrimary,
    },
    popupFooterButtons: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: theme.spacing.sm,
      marginTop: theme.spacing.md,
    },
    popupCancelButton: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 8,
    },
    popupConfirmButton: {
      backgroundColor: theme.colors.primary,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: 8,
    },
    popupCancelButtonText: {
      color: theme.colors.textSecondary,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
    },
    popupConfirmButtonText: {
      color: theme.colors.textOnColor,
      fontFamily: theme.typography.fontFamily.primary.semiBold,
    },
    popupLoadingContent: {
      alignItems: "center",
      gap: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    popupLoadingText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      fontSize: 14,
      color: theme.colors.textPrimary,
      textAlign: "center",
    },
    popupLoadingHint: {
      fontFamily: theme.typography.fontFamily.primary.regular,
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: "center",
    },
  }));
};
