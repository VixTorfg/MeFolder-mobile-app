import React, { createContext, useContext, useState, ReactNode } from 'react';
import { lightTheme, darkTheme } from '../constants/themes';
import type { Theme } from '../constants/themes/types';
import { useColorScheme } from 'react-native';

type ThemeContextType = {
  theme: Theme;
  setTheme: (theme: 'light' | 'dark') => void;
  currentTheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  setTheme: () => {},
  currentTheme: 'light'
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const scheme = useColorScheme();
  const schemeTyped = scheme === 'dark' ? 'dark' : 'light';
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>(schemeTyped);
  
  const setTheme = (themeName: 'light' | 'dark') => {
    setCurrentTheme(themeName);
  };

  const theme = currentTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};