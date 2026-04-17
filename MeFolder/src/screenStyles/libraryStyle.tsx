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
      flex: 1,
    },
    headerBreadcrumb: {
      alignItems: "center",
      marginVertical: theme.spacing.sm,
    },
    headerBreadcrumbText: {
      fontSize: 34,
      fontFamily: theme.typography.fontFamily.title.semiBold,
      color: theme.colors.textPrimary,
    },
    section: {
      padding: 16,
    },
    cardWrapper: {
      flex: 1,
      alignItems: "center",
      paddingBottom: theme.spacing.sm,
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
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 8,
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
  }));
};
