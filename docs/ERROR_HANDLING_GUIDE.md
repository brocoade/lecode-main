# Guide de Gestion des Erreurs - Meducare

## 📋 Vue d'ensemble

Ce guide explique comment utiliser le nouveau système de gestion d'erreurs centralisé de l'application Meducare. Le système offre une approche cohérente et réutilisable pour gérer les erreurs dans toute l'application.

## 🏗️ Architecture

### Composants principaux

1. **ErrorMessages.ts** - Constantes et messages d'erreur centralisés
2. **ErrorService** - Service de gestion d'erreurs centralisé
3. **useErrorHandler** - Hook React pour la gestion d'erreurs
4. **ErrorMessage** - Composant UI pour afficher les erreurs
5. **SuccessMessage** - Composant UI pour afficher les succès

## 🎯 Utilisation

### 1. Dans un composant React

```tsx
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ErrorMessage } from '../components/ui/ErrorMessage';
import { SuccessMessage } from '../components/ui/SuccessMessage';

function MyComponent() {
  const { 
    error, 
    isLoading, 
    successMessage, 
    handleFirebaseError, 
    handleValidationError,
    handleSuccess,
    clearError 
  } = useErrorHandler();

  const handleSubmit = async () => {
    try {
      // Validation
      if (!email) {
        handleValidationError('validation/empty-fields');
        return;
      }

      // Opération async
      await someAsyncOperation();
      handleSuccess('auth/login-success');
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  return (
    <View>
      <ErrorMessage 
        error={error} 
        onDismiss={clearError}
        dismissible={true}
      />
      
      <SuccessMessage 
        message={successMessage || ''}
        visible={!!successMessage}
        autoHide={true}
      />
      
      {/* Votre contenu */}
    </View>
  );
}
```

### 2. Validation de formulaires

```tsx
import { errorService } from '../services/error.service';

// Validation d'email
const emailError = errorService.validateEmail(email);
if (emailError) {
  handleValidationError('validation/invalid-email');
  return;
}

// Validation de mot de passe
const passwordError = errorService.validatePassword(password);
if (passwordError) {
  handleValidationError('validation/weak-password');
  return;
}

// Validation de correspondance des mots de passe
const matchError = errorService.validatePasswordMatch(password, confirmPassword);
if (matchError) {
  handleValidationError('validation/password-mismatch');
  return;
}
```

### 3. Gestion d'erreurs Firebase

```tsx
try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (error) {
  if (error instanceof FirebaseError) {
    handleFirebaseError(error);
  } else {
    handleGenericError(error);
  }
}
```

## 🎨 Composants UI

### ErrorMessage

```tsx
<ErrorMessage 
  error={error}                    // ErrorMessage object
  onActionPress={handleAction}     // Action callback si actionable
  onDismiss={clearError}          // Callback pour fermer
  dismissible={true}              // Peut être fermé
  showIcon={true}                 // Afficher l'icône
  compact={false}                 // Mode compact
/>
```

### SuccessMessage

```tsx
<SuccessMessage 
  message="Opération réussie"
  visible={true}
  onDismiss={clearSuccess}
  dismissible={true}
  autoHide={true}
  autoHideDelay={3000}
/>
```

## 🔧 Service ErrorService

### Méthodes principales

```tsx
import { errorService } from '../services/error.service';

// Validation
errorService.validateEmail(email);
errorService.validatePassword(password);
errorService.validateAge(birthDate);

// Gestion d'erreurs
errorService.handleFirebaseError(firebaseError);
errorService.handleGenericError(error);

// Alertes
errorService.showErrorAlert(errorMessage, onAction);
errorService.showSuccessAlert(message);

// Utilitaires
errorService.isNetworkError(error);
errorService.isAuthError(error);
errorService.createCustomError(title, message, type);
```

## 📝 Types d'erreurs

### ErrorType enum

- `VALIDATION` - Erreurs de validation de formulaire
- `AUTHENTICATION` - Erreurs d'authentification
- `NETWORK` - Erreurs de réseau
- `PERMISSION` - Erreurs de permissions
- `GENERAL` - Erreurs générales
- `HEARTS` - Erreurs liées aux cœurs/vies
- `QUIZ` - Erreurs liées aux quiz

### Codes d'erreur courants

#### Authentification
- `auth/invalid-email` - Email ou mot de passe incorrect
- `auth/user-not-found` - Utilisateur non trouvé
- `auth/wrong-password` - Mot de passe incorrect
- `auth/email-already-in-use` - Email déjà utilisé
- `auth/weak-password` - Mot de passe trop faible
- `auth/too-many-requests` - Trop de tentatives

#### Validation
- `validation/empty-fields` - Champs requis
- `validation/invalid-email` - Email invalide
- `validation/password-mismatch` - Mots de passe différents
- `validation/weak-password` - Mot de passe trop faible

## 🎯 Bonnes pratiques

### 1. Utiliser les hooks dans les composants
```tsx
// ✅ Bon
const { error, handleFirebaseError } = useErrorHandler();

// ❌ Éviter
const [error, setError] = useState('');
```

### 2. Valider avant les opérations async
```tsx
// ✅ Bon
const emailError = errorService.validateEmail(email);
if (emailError) {
  handleValidationError('validation/invalid-email');
  return;
}

// ❌ Éviter
if (!email.includes('@')) {
  setError('Email invalide');
  return;
}
```

### 3. Utiliser les composants UI standardisés
```tsx
// ✅ Bon
<ErrorMessage error={error} onDismiss={clearError} />

// ❌ Éviter
{error && <Text style={styles.error}>{error}</Text>}
```

### 4. Gérer les erreurs Firebase correctement
```tsx
// ✅ Bon
catch (error) {
  if (error instanceof FirebaseError) {
    handleFirebaseError(error);
  }
}

// ❌ Éviter
catch (error) {
  setError(error.message);
}
```

## 🧪 Tests

Le système inclut des tests complets pour :
- Validation des champs
- Gestion des erreurs Firebase
- Mapping des codes d'erreur
- Logging des erreurs

Exécuter les tests :
```bash
npm test __tests__/error-handling.test.ts
```

## 🔄 Migration

Pour migrer du système existant :

1. Remplacer `useState` pour les erreurs par `useErrorHandler`
2. Remplacer les `<Text style={styles.error}>` par `<ErrorMessage>`
3. Utiliser `errorService.validate*` pour les validations
4. Utiliser `handleFirebaseError` pour les erreurs Firebase

## 📚 Exemples complets

Voir les fichiers refactorisés :
- `app/(auth)/login.tsx` - Exemple de connexion
- `app/(auth)/register.tsx` - Exemple d'inscription
- `app/(auth)/email-link.tsx` - Exemple de lien email
