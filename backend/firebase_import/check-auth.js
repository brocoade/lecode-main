const fs = require('fs');
const path = require('path');

// Vérifier si le fichier serviceAccountKey.json existe
const serviceAccountPath = path.join(__dirname, '../config/serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ serviceAccountKey.json trouvé');
  try {
    const serviceAccount = require(serviceAccountPath);
    console.log('✅ Fichier JSON valide');
    console.log('📧 Email:', serviceAccount.client_email);
    console.log('🆔 Project ID:', serviceAccount.project_id);
  } catch (error) {
    console.error('❌ Fichier JSON invalide:', error.message);
  }
} else {
  console.error('❌ serviceAccountKey.json manquant dans backend/config/');
  console.log('📋 Télécharge-le depuis Firebase Console');
}