const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccount = require('../config/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function backupCurrentQuizzes() {
  try {
    console.log('💾 Sauvegarde des quiz actuels...');
    
    const db = admin.firestore();
    const snapshot = await db.collection('quizzes').get();
    
    const backup = {};
    snapshot.forEach(doc => {
      backup[doc.id] = doc.data();
    });
    
    const backupFile = `quizzes_backup_${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`✅ Sauvegarde créée: ${backupFile}`);
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error);
  }
}

backupCurrentQuizzes().then(() => process.exit(0));