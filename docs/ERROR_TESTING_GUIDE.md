# Guide de Test de la Gestion des Erreurs

Ce guide décrit comment tester manuellement le système de gestion des erreurs amélioré dans l'application Meducare.

## Tests de Validation - Formulaire de Connexion

### Test 1: Email vide
1. Aller sur la page de connexion
2. Laisser le champ email vide
3. Entrer un mot de passe
4. Cliquer sur "Se connecter"
5. **Résultat attendu**: Message d'erreur "Veuillez remplir tous les champs obligatoires"

### Test 2: Mot de passe vide
1. Entrer un email valide
2. Laisser le champ mot de passe vide
3. Cliquer sur "Se connecter"
4. **Résultat attendu**: Message d'erreur "Veuillez remplir tous les champs obligatoires"

### Test 3: Format d'email invalide
1. Entrer un email invalide (ex: "test@")
2. Entrer un mot de passe
3. Cliquer sur "Se connecter"
4. **Résultat attendu**: Message d'erreur "Veuillez entrer une adresse email valide (exemple: nom@domaine.com)"

### Test 4: Email invalide (sans @)
1. Entrer un email sans @ (ex: "testexample.com")
2. Entrer un mot de passe
3. Cliquer sur "Se connecter"
4. **Résultat attendu**: Message d'erreur "Veuillez entrer une adresse email valide (exemple: nom@domaine.com)"

### Test 5: Identifiants incorrects
1. Entrer un email valide mais inexistant
2. Entrer un mot de passe
3. Cliquer sur "Se connecter"
4. **Résultat attendu**: Message d'erreur "Aucun compte ne correspond à ces identifiants" avec bouton "Créer un compte"

## Tests de Validation - Formulaire d'Inscription

### Test 6: Nom vide
1. Aller sur la page d'inscription
2. Laisser le champ nom vide
3. Remplir les autres champs correctement
4. Cliquer sur "S'inscrire"
5. **Résultat attendu**: Message d'erreur "Veuillez remplir tous les champs obligatoires"

### Test 7: Email invalide
1. Entrer un nom valide
2. Entrer un email invalide (ex: "test")
3. Remplir les autres champs correctement
4. Cliquer sur "S'inscrire"
5. **Résultat attendu**: Message d'erreur "Veuillez entrer une adresse email valide (exemple: nom@domaine.com)"

### Test 8: Mot de passe trop court
1. Remplir nom et email correctement
2. Entrer un mot de passe de moins de 6 caractères (ex: "123")
3. Confirmer avec le même mot de passe
4. Remplir les autres champs
5. Cliquer sur "S'inscrire"
6. **Résultat attendu**: Message d'erreur "Le mot de passe doit contenir au moins 6 caractères"

### Test 9: Mots de passe différents
1. Remplir nom et email correctement
2. Entrer un mot de passe valide
3. Entrer une confirmation différente
4. Remplir les autres champs
5. Cliquer sur "S'inscrire"
6. **Résultat attendu**: Message d'erreur "Les mots de passe ne correspondent pas"

### Test 10: Groupe sanguin non sélectionné
1. Remplir tous les champs correctement
2. Ne pas sélectionner de groupe sanguin
3. Cliquer sur "S'inscrire"
4. **Résultat attendu**: Message d'erreur "Veuillez sélectionner un groupe sanguin valide"

### Test 11: Âge invalide
1. Remplir tous les champs correctement
2. Sélectionner une date de naissance récente (moins de 5 ans)
3. Cliquer sur "S'inscrire"
4. **Résultat attendu**: Message d'erreur "Vous devez avoir au moins 5 ans pour vous inscrire"

### Test 12: Email déjà utilisé
1. Remplir tous les champs correctement avec un email existant
2. Cliquer sur "S'inscrire"
3. **Résultat attendu**: Message d'erreur "Un compte existe déjà avec cette adresse email" avec bouton "Se connecter"

## Tests de Mot de Passe Oublié

### Test 13: Email vide pour mot de passe oublié
1. Sur la page de connexion, laisser l'email vide
2. Cliquer sur "Mot de passe oublié ?"
3. **Résultat attendu**: Message d'erreur "Veuillez remplir tous les champs obligatoires"

### Test 14: Email invalide pour mot de passe oublié
1. Entrer un email invalide
2. Cliquer sur "Mot de passe oublié ?"
3. **Résultat attendu**: Message d'erreur "Veuillez entrer une adresse email valide (exemple: nom@domaine.com)"

### Test 15: Email valide pour mot de passe oublié
1. Entrer un email valide et existant
2. Cliquer sur "Mot de passe oublié ?"
3. **Résultat attendu**: Message de succès et alerte "Email de réinitialisation envoyé ! Vérifiez votre boîte de réception."

## Tests d'Erreurs Réseau

### Test 16: Erreur de connexion
1. Désactiver la connexion internet
2. Essayer de se connecter avec des identifiants valides
3. **Résultat attendu**: Message d'erreur "Vérifiez votre connexion internet et réessayez"

## Vérifications Visuelles

### Cohérence de l'affichage
- [ ] Les messages d'erreur s'affichent dans un style cohérent (couleur rouge, icône d'erreur)
- [ ] Les messages d'erreur sont dismissibles (bouton X)
- [ ] Les messages de succès s'affichent en vert avec une icône de succès
- [ ] Les boutons d'action sont visibles quand appropriés
- [ ] Les messages d'erreur disparaissent quand l'utilisateur corrige l'erreur

### Accessibilité
- [ ] Les messages d'erreur sont lisibles et compréhensibles
- [ ] Les actions suggérées sont claires
- [ ] Les couleurs respectent les contrastes d'accessibilité

## Résultats Attendus Généraux

1. **Messages spécifiques**: Chaque erreur doit afficher un message spécifique et descriptif
2. **Actions suggérées**: Les erreurs actionables doivent proposer des solutions
3. **Cohérence visuelle**: Tous les messages d'erreur doivent avoir le même style
4. **Feedback utilisateur**: L'utilisateur doit toujours savoir ce qui ne va pas et comment le corriger
5. **Pas de messages génériques**: Éviter les messages comme "Erreur inattendue, veuillez réessayer"

## Commandes de Test Automatisé

Pour exécuter les tests automatisés :

```bash
# Tests unitaires de la gestion des erreurs
npm test __tests__/error-handling-integration.test.ts

# Tests de tous les composants d'erreur
npm test -- --testPathPattern=error
```

## Rapport de Bug

Si vous trouvez des problèmes lors des tests, veuillez documenter :
1. Étapes pour reproduire
2. Résultat attendu vs résultat obtenu
3. Capture d'écran si applicable
4. Appareil/navigateur utilisé
