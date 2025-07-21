const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;

// Ignorer les fichiers de services dans les routes Expo Router
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;
