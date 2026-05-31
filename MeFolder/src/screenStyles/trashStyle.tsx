import { useStyles } from "@/hooks";

export const useTrashStyles = () => {
  return useStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      paddingHorizontal: 8,
      paddingVertical: 24,
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
    cardWrapper: {
      flex: 1,
      alignItems: "center",
      paddingBottom: theme.spacing.sm,
    },
    gridCardWrapper: {
      paddingHorizontal: 5,
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
    emptyFolderIconContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: theme.spacing.xxl,
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
