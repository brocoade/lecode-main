/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

const palette = {
  green: '#4CAF50', // couleur principale
  blue: '#2196F3',
  orange: '#FF9800',
  red: '#F44336',
  yellow: '#FFD700',
  white: '#FFFFFF',
  black: '#181818',
  grayLight: '#F5F5F5',
  gray: '#888',
  grayDark: '#232323',
};

export default {
  light: {
    background: palette.grayLight,
    card: palette.white,
    text: '#222',
    textSecondary: '#666',
    border: '#eee',
    button: palette.green,
    buttonText: palette.white,
    inputBackground: palette.white,
    inputText: '#222',
    icon: palette.green,
    ...palette,
  },
  dark: {
    background: palette.black,
    card: palette.grayDark,
    text: palette.white,
    textSecondary: '#BBB',
    border: '#333',
    button: palette.green,
    buttonText: palette.white,
    inputBackground: '#232323',
    inputText: palette.white,
    icon: palette.green,
    ...palette,
  },
  primary: '#4CAF50',
  primaryLight: '#4CAF50', // Vert clair pour les objectifs du jour
  text: {
    primary: '#333333',
    secondary: '#666666',
    light: '#FFFFFF',
  },
  categories: {
    nutrition: '#FF9800', // Orange
    firstAid: '#F44336', // Rouge
    mentalHealth: '#2196F3', // Bleu
    medicalLaw: '#4CAF50', // Vert
  },
  progress: {
    background: '#E0E0E0', // Gris clair pour le fond des barres de progression
  },
  stars: '#FFD700', // Jaune doré pour les étoiles
  hearts: '#FF6B6B', // Rouge clair pour les cœurs
};
