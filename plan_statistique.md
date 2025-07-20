
# Donc  pour conclure comment je fais pour afficher ces stats a l'utilisateur dans l'application sur l'écrans statistique sans passer  par google analytique: 
A. Nombre de jours consécutifs joués

À chaque connexion, enregistre la date du jour dans Firestore ou ta base.

Compare la date à la précédente : si c'est le lendemain, incrémente le compteur de streak ; sinon, remets à 1.

B. Nombre de quiz complétés

Incrémente un compteur à chaque quiz terminé (événement personnalisé "quiz_completed").

C. Précision (nombre de bonnes réponses)

À chaque réponse correcte, incrémente un compteur "good_answers".

Calcule la précision : bonnes réponses / total de questions.

D. Temps moyen par quiz

Enregistre l'heure de début et de fin de chaque quiz.

Calcule la différence pour chaque session, puis fais la moyenne.

Voici comment implémenter chaque statistique **directement dans ton application** pour les afficher à l'utilisateur, sans passer par Google Analytics :

---

## Solution globale

**Stocke toutes les données dans Firestore** (gratuit jusqu'à 1 Go/mois) ou **localement via AsyncStorage** (si pas besoin de synchronisation multi-appareils).

---

## A. Nombre de jours consécutifs joués (`currentStreak`)

### Code Firestore

```javascript
// Dans ton composant de connexion ou écran principal
const updateStreak = async (userId) => {
  const userRef = doc(firestore, 'users', userId);
  const userDoc = await getDoc(userRef);
  const lastPlayed = userDoc.data().lastPlayed?.toDate() || null;
  const today = new Date();

  if (!lastPlayed || !isYesterday(lastPlayed)) {
    await updateDoc(userRef, {
      currentStreak: 1,
      lastPlayed: today
    });
  } else if (isYesterday(lastPlayed)) {
    await updateDoc(userRef, {
      currentStreak: userDoc.data().currentStreak + 1,
      lastPlayed: today
    });
  }
};

// Helper pour vérifier si une date est hier
const isYesterday = (date) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return date.toDateString() === yesterday.toDateString();
};
```


---

## B. Nombre de quiz complétés (`totalQuizzes`)

### Code

```javascript
// Quand l'utilisateur termine un quiz
const handleQuizCompleted = async (userId) => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    totalQuizzes: increment(1)
  });
};
```


---

## C. Précision (`accuracy`)

### Code

```javascript
// À chaque bonne réponse
const handleGoodAnswer = async (userId, totalQuestions) => {
  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    totalGoodAnswers: increment(1),
    totalQuestionsAttempted: increment(totalQuestions)
  });
};

// Calcul de la précision (à afficher)
const accuracy = (userData) => {
  return userData.totalQuestionsAttempted > 0 
    ? (userData.totalGoodAnswers / userData.totalQuestionsAttempted * 100).toFixed(1) + '%'
    : '0%';
};
```


---

## D. Temps moyen par quiz (`averageTime`)

### Code

```javascript
// Début du quiz
let quizStartTime;

const startQuiz = () => {
  quizStartTime = new Date();
};

// Fin du quiz
const endQuiz = async (userId) => {
  const quizEndTime = new Date();
  const duration = Math.round((quizEndTime - quizStartTime) / 1000); // en secondes

  const userRef = doc(firestore, 'users', userId);
  await updateDoc(userRef, {
    quizDurations: arrayUnion(duration) // Stocke chaque durée dans un tableau
  });
};

// Calcul du temps moyen
const averageTime = (userData) => {
  if (!userData.quizDurations?.length) return '0s';
  
  const total = userData.quizDurations.reduce((a, b) => a + b, 0);
  return Math.round(total / userData.quizDurations.length) + 's';
};
```


---

## Affichage dans l'écran Statistiques

```javascript
const StatsScreen = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      const docSnap = await getDoc(doc(firestore, 'users', user.uid));
      setUserData(docSnap.data());
    };
    fetchData();
  }, []);

  return (
    <View>
      <Text>Jours consécutifs : {userData?.currentStreak || 0}</Text>
      <Text>Quiz complétés : {userData?.totalQuizzes || 0}</Text>
      <Text>Précision : {accuracy(userData)}</Text>
      <Text>Temps moyen : {averageTime(userData)}</Text>
    </View>
  );
};
```


---

## Structure Firestore recommandée

```plaintext
Collection "users" > Document utilisateur :
{
  currentStreak: number,
  lastPlayed: Timestamp,
  totalQuizzes: number,
  totalGoodAnswers: number,
  totalQuestionsAttempted: number,
  quizDurations: number[] // [45, 32, 58] en secondes
}
```


---

### Avantages de cette approche :

1. **Aucun coût** (Firestore gratuit jusqu'à 1 Go/mois)
2. **Contrôle total** sur les données
3. **Données en temps réel** avec `onSnapshot` de Firestore
4. **Pas besoin de SDK tiers** (tout est natif avec Expo + Firebase)

Tu peux tester cette implémentation dès aujourd'hui avec Expo Go et Firebase Emulator Suite si tu veux éviter même le compte Firebase !

