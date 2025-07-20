Je vais analyser le projet pour comprendre comment les quiz sont gérés et comment le passage d'un quiz à l'autre est implémenté. Je vais d'abord chercher les fichiers pertinents.


Search files...
D'après l'analyse du code, je peux vous expliquer en détail comment fonctionne le système de progression des quiz :

1. **Système de Progression** :
- Chaque quiz est identifié par un ID unique (par exemple "quiz_1", "quiz_2", etc.)
- Les quiz sont organisés par catégories et niveaux de difficulté
- Un quiz est considéré comme réussi si le score est ≥ 60%

2. **Déblocage du Quiz Suivant** :
- Quand un quiz est terminé avec succès (score ≥ 60%), le système :
  - Marque le quiz actuel comme complété
  - Met à jour la progression de l'utilisateur
  - Débloque automatiquement le quiz suivant dans la même catégorie

3. **Processus de Transition** :
- Après avoir terminé un quiz, l'utilisateur est redirigé vers l'écran de résultats
- Sur l'écran de résultats :
  - Si le quiz est réussi (≥ 60%), un bouton "QUIZ SUIVANT" apparaît
  - Si le quiz n'est pas réussi, seul un bouton "RETOUR" est affiché
  - L'utilisateur gagne des points d'expérience (XP) et des cœurs en fonction de sa performance

4. **Gestion de la Progression** :
- La progression est sauvegardée dans Firebase
- Le système vérifie automatiquement si le quiz suivant existe et le débloque
- La progression est mise à jour en temps réel

5. **Navigation** :
- Quand l'utilisateur clique sur "QUIZ SUIVANT", il est redirigé vers la liste des quiz
- Le quiz suivant apparaîtra comme débloqué dans la liste
- L'utilisateur peut alors commencer le nouveau quiz

Voici un exemple concret du flux :
1. L'utilisateur termine "quiz_1" avec un score de 75%
2. Le système marque "quiz_1" comme complété
3. "quiz_2" est automatiquement débloqué
4. L'utilisateur voit ses résultats et peut accéder à "quiz_2"
5. Le processus se répète pour chaque quiz

Le système est conçu pour être progressif et motivant, avec des récompenses (XP et cœurs) pour encourager la progression.



D'après les logs, le problème vient clairement de la base de données. Voici ce que vous devez vérifier dans Firebase:

1. **Structure de la progression utilisateur** :
   - Dans la collection `userProgress`, ouvrez le document correspondant à votre utilisateur
   - Vérifiez dans `difficulties > facile > categories` s'il existe une catégorie avec `categoryId: "maladies_cardiovasculaires"`
   - Le log montre "Catégorie maladies_cardiovasculaires non trouvée" - c'est la cause principale

2. **Format des ID de quiz** :
   - Je vois que votre quiz a un ID `coeur_quiz_1` au lieu de `quiz_1`
   - Vérifiez la fonction `buildNextQuizId` qui cherche à remplacer `quiz_X` par `quiz_X+1`
   - Ce format inhabituel peut causer des problèmes

3. **Cohérence entre collections** :
   - Dans `quizzes > facile`, vérifiez si la sous-collection est nommée `cardiovasculaires` ou `maladies_cardiovasculaires`
   - Vérifiez si le quiz suivant (`coeur_quiz_2` ou `quiz_2`) existe bien

4. **Solution rapide** :
   - Dans votre base de données, modifiez directement le document de progression utilisateur
   - Changez les `categoryId` pour qu'ils correspondent exactement au format utilisé dans la collection de quiz

Le problème fondamental est que votre progression utilisateur n'a pas la même structure d'ID que vos quiz réels.
