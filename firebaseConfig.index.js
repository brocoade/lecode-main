// Ce fichier importe automatiquement la bonne configuration selon la plateforme
// Renommez-le en firebaseConfig.js après avoir supprimé l'ancien fichier firebaseConfig.js

// Pour les applications web, React Native utilisera firebaseConfig.web.js
// Pour les applications mobiles, React Native utilisera firebaseConfig.native.js
export * from './firebaseConfig.platform';
export { default } from './firebaseConfig.platform'; 