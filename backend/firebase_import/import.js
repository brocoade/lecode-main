// ===============================
// Script d'importation Firebase pour all_diseases.json
// ===============================
// Ce script permet d'importer les maladies et catégories depuis all_diseases.json dans Firestore.
//
// 1. Placez votre fichier all_diseases.json dans ce dossier.
// 2. Assurez-vous d'avoir le fichier serviceAccountKey.json dans backend/config/ (clé admin Firebase).
// 3. Installez les dépendances : npm install firebase-admin
// 4. Exécutez ce script avec : node import.js
//
// Le script va créer une collection 'categories' avec chaque catégorie et ses maladies en sous-collection.
// ===============================

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de configuration Firebase (service account)
const serviceAccount = require('../config/serviceAccountKey.json');

// Initialiser l'application Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// ===============================
// Fonction principale d'importation
// ===============================
async function importDiseases() {
  try {
    // 1. Lire le fichier all_diseases.json
    console.log('Lecture du fichier all_diseases.json...');
    const rawData = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_diseases.json'), 'utf8'));

    // 2. Parcourir les catégories
    const categories = rawData.categories;
    for (const [categoryKey, categoryValue] of Object.entries(categories)) {
      // Préparer l'objet catégorie sans les maladies
      const { diseases, ...categoryData } = categoryValue;
      // Créer un document pour la catégorie
      const categoryRef = db.collection('categories').doc(categoryKey);
      await categoryRef.set(categoryData);
      console.log(`Catégorie importée : ${categoryKey}`);

      // 3. Importer les maladies de la catégorie comme sous-collection
      if (Array.isArray(diseases)) {
        for (const disease of diseases) {
          const diseaseId = disease.id || disease.title.replace(/\s+/g, '_');
          await categoryRef.collection('diseases').doc(diseaseId).set(disease);
          console.log(`  - Maladie importée : ${disease.title}`);
        }
      }
    }
    console.log('\nImportation terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors de l\'importation:', error);
  }
}

// ===============================
// Exécuter l'importation
// ===============================
importDiseases()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
// ===============================
// FIN DU SCRIPT
// =============================== 