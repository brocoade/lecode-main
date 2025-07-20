# Plan d'implémentation du backend Meducare

## Objectifs
- Implémenter une architecture backend robuste pour gérer les quiz médicaux
- Organiser et structurer les données des questions dans Firebase
- Créer un système d'authentification des utilisateurs
- Développer des services pour la gestion des quiz et le suivi des progrès des utilisateurs

## Structure de données Firebase

### Collection `users`
```
users/
  |- userId/
     |- displayName: string
     |- email: string
     |- photoURL: string (optionnel)
     |- createdAt: timestamp
     |- lastLogin: timestamp
     |- points: number
     |- hearts: number
     |- level: number
     |- streakDays: number
     |- dailyObjectives: {
         quizDone: boolean,
         readingDone: boolean,
         lastUpdated: timestamp
       }
```

### Collection `quizzes`
```
quizzes/
  |- difficulty/
     |- categoryId/
        |- quizId/
           |- title: string
           |- description: string
           |- totalQuestions: number
           |- timeLimit: number (en secondes)
           |- pointsToEarn: number
           |- heartsToEarn: number
           |- questions: [
              {
                id: string,
                question: string,
                options: array,
                correctAnswer: string,
                explanation: string,
                points: number
              }
             ]
```

### Collection `userProgress`
```
userProgress/
  |- userId/
     |- quizAttempts/
        |- attemptId/
           |- quizId: string
           |- categoryId: string
           |- difficulty: string
           |- score: number
           |- earnedPoints: number
           |- earnedHearts: number
           |- completedAt: timestamp
           |- answers: [
              {
                questionId: string,
                selectedAnswer: string,
                correct: boolean,
                timeSpent: number
              }
             ]
     |- categoryProgress/
        |- difficulty/
           |- categoryId: {
               completed: boolean,
               progress: number,
               bestScore: number,
               attemptsCount: number
             }
```

## Plan d'implémentation

### Phase 1: Configuration et structure de base
1. **Configuration de Firebase**
   - Finaliser la configuration de Firebase
   - Mettre en place les règles de sécurité Firestore
   - Configurer Authentication

2. **Implémentation des services de base**
   - Service d'authentification (création de compte, connexion, récupération de mot de passe)
   - Service de gestion des utilisateurs (profil, données utilisateur)
   - Service de base de quiz (récupération des catégories et niveaux)

### Phase 2: Import et organisation des questions
1. **Traitement des données existantes**
   - Créer un script pour convertir les questions du dossier `backend/questions_organisees` en format JSON
   - Organiser les questions en quiz structurés selon la difficulté et la catégorie

2. **Implémentation de l'upload vers Firebase**
   - Créer un script pour uploader toutes les questions vers Firebase
   - Vérifier l'intégrité des données

### Phase 3: Développement des services de quiz
1. **Service de gestion des quiz**
   - Récupération des quiz par difficulté et catégorie
   - Logique pour démarrer, suivre et terminer un quiz
   - Calcul des scores et attribution des points/cœurs

2. **Service de progression utilisateur**
   - Suivi de la progression par catégorie et niveau
   - Enregistrement des tentatives et résultats
   - Calcul des statistiques de performance

3. **Service d'objectifs quotidiens**
   - Gestion des objectifs quotidiens
   - Calcul et mise à jour des streaks
   - Récompenses pour complétion d'objectifs

### Phase 4: Intégration avec le frontend
1. **Connexion des écrans de quiz**
   - Intégrer les services backend avec les écrans de quiz existants
   - Implémenter la récupération dynamique des questions
   - Gérer l'affichage des résultats et récompenses

2. **Mise en place de l'écran de quiz interactif**
   - Écran de quiz avec minuteur
   - Animation pour les bonnes/mauvaises réponses
   - Affichage des explications après réponse

3. **Écrans de récapitulation**
   - Écran de résumé après complétion d'un quiz
   - Affichage des statistiques de performance
   - Options pour revoir les erreurs ou recommencer

## Spécifications pour les quiz

### Structure d'un quiz
- **Facile**: 5 questions, limite de temps 30 secondes par question, 100 points au total (20 points par question)
- **Moyen**: 7 questions, limite de temps 25 secondes par question, 175 points au total (25 points par question)
- **Difficile**: 10 questions, limite de temps 20 secondes par question, 300 points au total (30 points par question)

### Système de points
- Points de base pour une bonne réponse selon le niveau
- Bonus pour réponse rapide: jusqu'à 30% de points supplémentaires
- Malus pour utilisation d'indices: -50% des points de la question
- Cœurs gagnés: 1 cœur pour chaque 300 points accumulés

### Progression
- Niveau facile: débloqué par défaut
- Niveau moyen: débloqué après avoir complété 5 quiz faciles
- Niveau difficile: débloqué après avoir complété 5 quiz moyens
- Une catégorie est considérée comme "complétée" à 100% quand tous ses quiz sont terminés avec au moins 70% de bonnes réponses

## Prochaines étapes

1. **Développer les services backend**
   - Commencer par `auth.service.ts` pour gérer l'authentification
   - Implémenter `quiz.service.ts` pour la gestion des quiz
   - Développer `user.service.ts` pour la gestion des profils et progrès

2. **Créer les scripts d'importation**
   - Script pour traiter les questions existantes
   - Script pour l'upload des données vers Firebase

3. **Implémenter l'interface de quiz interactive**
   - Développer l'écran de quiz dynamique
   - Ajouter les animations et les transitions
   - Intégrer le système de points et récompenses 