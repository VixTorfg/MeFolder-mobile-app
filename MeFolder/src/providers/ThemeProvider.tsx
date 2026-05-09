import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { lightTheme, darkTheme } from "../constants/themes";
import type { Theme } from "../constants/themes/types";
import { useColorScheme } from "react-native";

export type ThemePreference = "light" | "dark" | "system";

const THEME_PREFERENCE_STORAGE_KEY = "mefolder:theme-preference";

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: ThemePreference) => Promise<void>;
  currentTheme: "light" | "dark";
  themePreference: ThemePreference;
  isThemeHydrated: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  setTheme: async () => {},
  currentTheme: "light",
  themePreference: "system",
  isThemeHydrated: false,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const scheme = useColorScheme();
  const systemTheme = scheme === "dark" ? "dark" : "light";
  const [themePreference, setThemePreference] =
    useState<ThemePreference>("system");
  const [isThemeHydrated, setIsThemeHydrated] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedPreference = await AsyncStorage.getItem(
          THEME_PREFERENCE_STORAGE_KEY,
        );

        if (
          storedPreference === "light" ||
          storedPreference === "dark" ||
          storedPreference === "system"
        ) {
          setThemePreference(storedPreference);
        }
      } catch (error) {
        console.warn("No se pudo cargar la preferencia de tema", error);
      } finally {
        setIsThemeHydrated(true);
      }
    };

    void loadThemePreference();
  }, []);

  const setTheme = async (themeName: ThemePreference) => {
    setThemePreference(themeName);

    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_STORAGE_KEY, themeName);
    } catch (error) {
      console.warn("No se pudo guardar la preferencia de tema", error);
    }
  };

  const currentTheme =
    themePreference === "system" ? systemTheme : themePreference;

  const theme = currentTheme === "dark" ? darkTheme : lightTheme;

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      currentTheme,
      themePreference,
      isThemeHydrated,
    }),
    [theme, currentTheme, themePreference, isThemeHydrated],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
