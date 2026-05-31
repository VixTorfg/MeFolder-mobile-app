import { Stack } from "expo-router";
import {
  ThemeProvider,
  DatabaseProvider,
  AppBootstrap,
  AlertProvider,
} from "@/providers";
import { useFonts } from "expo-font";
import { fontAssets } from "@/constants/fonts";
import { darkTheme, lightTheme, typography } from "@/constants/themes";
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  useColorScheme,
} from "react-native";
import { TouchableOpacity } from "@/components/TouchableOpacity";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import SplashLogo from "@/components/svgIcons/splashLogo";

const SPLASH_BACKGROUND = "#f1f2eb";
const SPLASH_BACKGROUND_DARK = "#000000";

/** Pantalla de carga durante el arranque */
function LoadingScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const spinnerColor = isDark
    ? darkTheme.colors.primary
    : lightTheme.colors.primary;

  return (
    <View style={[styles.center, isDark && styles.centerDark]}>
      <SplashLogo width={200} height={164} style={styles.logo} />
      <ActivityIndicator size="large" color={spinnerColor} />
      <Text style={[styles.loadingText, isDark && styles.loadingTextDark]}>
        Cargando informacion&hellip;
      </Text>
    </View>
  );
}

/** Pantalla de error con opción de reintento */
function ErrorScreen({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text style={styles.errorTitle}>Error al iniciar</Text>
      <Text style={styles.errorMessage}>{error.message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Reintentar</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
    ...fontAssets,
  });

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DatabaseProvider>
          <AppBootstrap
            loadingFallback={<LoadingScreen />}
            errorFallback={(error, retry) => (
              <ErrorScreen error={error} onRetry={retry} />
            )}
          >
            <AlertProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </AlertProvider>
          </AppBootstrap>
        </DatabaseProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

//TODO - Mejorar diseño de LoadingScreen y ErrorScreen (colores, tipografía, iconos)
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: SPLASH_BACKGROUND,
  },
  centerDark: {
    backgroundColor: SPLASH_BACKGROUND_DARK,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: typography.fontSize.md,
    color: "#666",
    fontFamily: typography.fontFamily.primary.regular,
  },
  loadingTextDark: {
    color: "#fff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#e53935",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#4A90D9",
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
});
