import { useStyles } from '@/hooks';
import { cardShadow } from '@/constants/styles/shadows';

export const useLibraryStyles = () => {
  return useStyles(theme => ({
    container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 24,
    },
    breadcrumb: {
        flexDirection: 'row',
        alignItems: 'center',
  
        padding: theme.spacing.xs,
        backgroundColor: theme.colors.card,
        borderBottomWidth: theme.effects.borderWidth.md,
        borderBottomColor: theme.colors.borderSoft,
    },
    section: {
        padding: 16,
    },
    cardsGrid: {
        flexDirection: 'column',
        flexWrap: 'wrap',
        gap: 10,
    },
    gridRow: {
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#212529',
        marginBottom: 12,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        marginBottom: 8,
        shadowColor: '#000',
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
        fontWeight: '500',
        color: '#212529',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#6c757d',
    },
    fab: {
        position: 'absolute',
        bottom: 120,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: theme.colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        shadowColor: '#0000005d',
        shadowOffset: theme.effects.shadowsOffset.slightDown,
        shadowOpacity: theme.effects.shadowsOpacity.lg,
        shadowRadius: 8,
        elevation: theme.effects.elevation.lg,
    },
    buttonsGroup: {
        flexDirection:'row',
        justifyContent: 'space-between', 
        gap: 8      
    },
    iconColor: {
        color: theme.colors.textPrimary,
        primaryColor: theme.colors.primary,
    },
    volverButton: {
        ...cardShadow(theme),
      backgroundColor: theme.colors.primary,
      borderRadius: 16,
      alignSelf: 'center',
      justifyContent: 'flex-end',
      paddingVertical: theme.spacing.md,
      marginBottom: 126,
      width: '80%',
    },
    volverText: {
      fontFamily: theme.typography.fontFamily.primary.semiBold,
      color: theme.colors.textPrimary,
      textAlign: 'center',
    }
  }));
};