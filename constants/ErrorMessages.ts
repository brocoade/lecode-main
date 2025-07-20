/**
 * Constantes pour les messages d'erreur de l'application
 * Centralise tous les messages d'erreur pour faciliter la maintenance et la traduction
 */

export enum ErrorType {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  NETWORK = 'network',
  PERMISSION = 'permission',
  GENERAL = 'general',
  HEARTS = 'hearts',
  QUIZ = 'quiz'
}

export interface ErrorMessage {
  title: string;
  message: string;
  type: ErrorType;
  actionable?: boolean;
  actionText?: string;
}

/**
 * Messages d'erreur pour l'authentification
 */
export const AUTH_ERRORS: Record<string, ErrorMessage> = {
  // Erreurs de validation
  'validation/empty-fields': {
    title: 'Champs requis',
    message: 'Veuillez remplir tous les champs obligatoires',
    type: ErrorType.VALIDATION
  },
  'validation/invalid-email': {
    title: 'Email invalide',
    message: 'Veuillez entrer une adresse email valide (exemple: nom@domaine.com)',
    type: ErrorType.VALIDATION
  },
  'validation/password-mismatch': {
    title: 'Mots de passe différents',
    message: 'Les mots de passe ne correspondent pas',
    type: ErrorType.VALIDATION
  },
  'validation/weak-password': {
    title: 'Mot de passe trop faible',
    message: 'Le mot de passe doit contenir au moins 6 caractères',
    type: ErrorType.VALIDATION
  },
  'validation/invalid-age': {
    title: 'Âge invalide',
    message: 'Vous devez avoir au moins 5 ans pour vous inscrire',
    type: ErrorType.VALIDATION
  },
  'validation/invalid-blood-type': {
    title: 'Groupe sanguin requis',
    message: 'Veuillez sélectionner un groupe sanguin valide',
    type: ErrorType.VALIDATION
  },

  // Erreurs Firebase Auth
  'auth/invalid-email': {
    title: 'Email ou mot de passe incorrect',
    message: 'Veuillez vérifier vos identifiants et réessayer',
    type: ErrorType.AUTHENTICATION,
    actionable: true,
    actionText: 'Mot de passe oublié ?'
  },
  'auth/user-not-found': {
    title: 'Email ou mot de passe incorrect',
    message: 'Aucun compte ne correspond à ces identifiants',
    type: ErrorType.AUTHENTICATION,
    actionable: true,
    actionText: 'Créer un compte'
  },
  'auth/wrong-password': {
    title: 'Email ou mot de passe incorrect',
    message: 'Le mot de passe saisi est incorrect',
    type: ErrorType.AUTHENTICATION,
    actionable: true,
    actionText: 'Mot de passe oublié ?'
  },
  'auth/email-already-in-use': {
    title: 'Email déjà utilisé',
    message: 'Un compte existe déjà avec cette adresse email',
    type: ErrorType.AUTHENTICATION,
    actionable: true,
    actionText: 'Se connecter'
  },
  'auth/user-disabled': {
    title: 'Compte désactivé',
    message: 'Votre compte a été désactivé. Veuillez contacter le support',
    type: ErrorType.PERMISSION
  },
  'auth/too-many-requests': {
    title: 'Trop de tentatives',
    message: 'Compte temporairement bloqué. Veuillez réinitialiser votre mot de passe ou réessayer plus tard',
    type: ErrorType.AUTHENTICATION,
    actionable: true,
    actionText: 'Réinitialiser le mot de passe'
  },
  'auth/network-request-failed': {
    title: 'Erreur de connexion',
    message: 'Vérifiez votre connexion internet et réessayez',
    type: ErrorType.NETWORK
  },
  'auth/invalid-credential': {
    title: 'Identifiants invalides',
    message: 'Les informations de connexion sont incorrectes',
    type: ErrorType.AUTHENTICATION
  },
  'auth/operation-not-allowed': {
    title: 'Opération non autorisée',
    message: 'Cette méthode de connexion n\'est pas activée',
    type: ErrorType.PERMISSION
  },
  'auth/weak-password': {
    title: 'Mot de passe trop faible',
    message: 'Le mot de passe doit contenir au moins 6 caractères',
    type: ErrorType.VALIDATION
  },
  'auth/requires-recent-login': {
    title: 'Reconnexion requise',
    message: 'Cette opération nécessite une reconnexion récente. Veuillez vous reconnecter.',
    type: ErrorType.AUTHENTICATION,
    actionable: true,
    actionText: 'Se reconnecter'
  },
  'auth/invalid-action-code': {
    title: 'Code invalide',
    message: 'Le code de vérification est invalide ou a expiré',
    type: ErrorType.AUTHENTICATION
  },
  'auth/expired-action-code': {
    title: 'Code expiré',
    message: 'Le code de vérification a expiré. Veuillez en demander un nouveau.',
    type: ErrorType.AUTHENTICATION
  }
};

/**
 * Messages d'erreur pour les quiz et cœurs
 */
export const QUIZ_ERRORS: Record<string, ErrorMessage> = {
  'hearts/insufficient': {
    title: 'Plus de vies disponibles',
    message: 'Tu n\'as plus de vies. Tu dois attendre 1 heure pour en récupérer une et continuer.',
    type: ErrorType.HEARTS
  },
  'quiz/loading-failed': {
    title: 'Erreur de chargement',
    message: 'Impossible de charger le quiz. Veuillez réessayer.',
    type: ErrorType.QUIZ
  },
  'quiz/no-questions': {
    title: 'Aucune question disponible',
    message: 'Aucune question n\'est disponible pour cette catégorie.',
    type: ErrorType.QUIZ
  }
};

/**
 * Messages d'erreur généraux
 */
export const GENERAL_ERRORS: Record<string, ErrorMessage> = {
  'network/offline': {
    title: 'Pas de connexion',
    message: 'Vérifiez votre connexion internet et réessayez',
    type: ErrorType.NETWORK
  },
  'network/timeout': {
    title: 'Délai d\'attente dépassé',
    message: 'La requête a pris trop de temps. Veuillez réessayer.',
    type: ErrorType.NETWORK
  },
  'general/unknown': {
    title: 'Erreur inattendue',
    message: 'Une erreur inattendue s\'est produite. Veuillez réessayer.',
    type: ErrorType.GENERAL
  },
  'general/maintenance': {
    title: 'Maintenance en cours',
    message: 'L\'application est temporairement indisponible pour maintenance.',
    type: ErrorType.GENERAL
  }
};

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES: Record<string, string> = {
  'auth/password-reset-sent': 'Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.',
  'auth/email-link-sent': 'Lien de connexion envoyé ! Vérifiez votre boîte email.',
  'auth/registration-success': 'Compte créé avec succès ! Bienvenue dans Meducare.',
  'auth/login-success': 'Connexion réussie ! Bon apprentissage.',
  'quiz/completed': 'Quiz terminé avec succès !',
  'profile/updated': 'Profil mis à jour avec succès.'
};

/**
 * Fonction utilitaire pour obtenir un message d'erreur
 */
export const getErrorMessage = (errorCode: string): ErrorMessage => {
  // Chercher dans les erreurs d'authentification
  if (AUTH_ERRORS[errorCode]) {
    return AUTH_ERRORS[errorCode];
  }
  
  // Chercher dans les erreurs de quiz
  if (QUIZ_ERRORS[errorCode]) {
    return QUIZ_ERRORS[errorCode];
  }
  
  // Chercher dans les erreurs générales
  if (GENERAL_ERRORS[errorCode]) {
    return GENERAL_ERRORS[errorCode];
  }
  
  // Retourner une erreur générique si aucune correspondance
  return GENERAL_ERRORS['general/unknown'];
};

/**
 * Fonction pour mapper les codes d'erreur Firebase vers nos codes internes
 */
export const mapFirebaseError = (firebaseErrorCode: string): string => {
  const firebaseToInternalMap: Record<string, string> = {
    'auth/invalid-email': 'auth/invalid-email',
    'auth/user-not-found': 'auth/user-not-found',
    'auth/wrong-password': 'auth/wrong-password',
    'auth/email-already-in-use': 'auth/email-already-in-use',
    'auth/user-disabled': 'auth/user-disabled',
    'auth/too-many-requests': 'auth/too-many-requests',
    'auth/network-request-failed': 'auth/network-request-failed',
    'auth/invalid-credential': 'auth/invalid-credential',
    'auth/operation-not-allowed': 'auth/operation-not-allowed',
    'auth/weak-password': 'auth/weak-password',
    'auth/requires-recent-login': 'auth/requires-recent-login',
    'auth/invalid-action-code': 'auth/invalid-action-code',
    'auth/expired-action-code': 'auth/expired-action-code'
  };

  return firebaseToInternalMap[firebaseErrorCode] || 'general/unknown';
};
