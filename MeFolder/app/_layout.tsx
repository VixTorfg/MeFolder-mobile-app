import { Stack } from "expo-router";
import { ThemeProvider, DatabaseProvider, AppBootstrap, AlertProvider } from "@/providers";
import { useFonts } from "expo-font";
import { fontAssets } from "@/constants/fonts";
import { ActivityIndicator, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

/** Pantalla de carga durante el arranque */
function LoadingScreen() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" />
      <Text style={styles.loadingText}>Iniciando MeFolder...</Text>
    </View>
  );
}

/** Pantalla de error con opción de reintento */
function ErrorScreen({ error, onRetry }: { error: Error; onRetry: () => void }) {
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
  const [fontsLoaded] = useFonts(fontAssets);

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DatabaseProvider>
          <AppBootstrap
            loadingFallback={<LoadingScreen />}
            errorFallback={(error, retry) => <ErrorScreen error={error} onRetry={retry} />}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e53935',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4A90D9',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
