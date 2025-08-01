const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;

// Ignorer les fichiers de services dans les routes Expo Router
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Inclure le dossier backend dans le bundling
config.watchFolders = [
  path.resolve(__dirname, 'backend'),
];

// Permettre l'importation de fichiers TypeScript depuis backend
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// Ajouter le dossier backend aux chemins de résolution
config.resolver.alias = {
  ...config.resolver.alias,
  '@backend': path.resolve(__dirname, 'backend'),
};

module.exports = config;
