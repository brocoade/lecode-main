import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app_theme_mode';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  theme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Charger le mode sauvegardé
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  useEffect(() => {
    // Sauvegarder le mode
    AsyncStorage.setItem(THEME_KEY, mode);
    // Déterminer le thème effectif
    if (mode === 'system') {
      const sys = Appearance.getColorScheme();
      setTheme(sys === 'dark' ? 'dark' : 'light');
    } else {
      setTheme(mode);
    }
  }, [mode]);

  // Écoute le changement système si mode = system
  useEffect(() => {
    if (mode !== 'system') return;
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, [mode]);

  const setMode = (m: ThemeMode) => setModeState(m);

  return (
    <ThemeContext.Provider value={{ mode, setMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useThemeMode() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeMode must be used within ThemeProvider');
  return ctx;
} 