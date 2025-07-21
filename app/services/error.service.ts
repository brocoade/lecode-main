import { Alert } from 'react-native';
import { FirebaseError } from 'firebase/app';
import { 
  ErrorMessage, 
  ErrorType,
  getErrorMessage, 
  mapFirebaseError, 
  SUCCESS_MESSAGES 
} from '@/constants/ErrorMessages';

/**
 * Service centralisé pour la gestion des erreurs dans l'application
 */
export class ErrorService {
  private static instance: ErrorService;
  private errorLog: Array<{ timestamp: Date; error: any; context?: string }> = [];

  private constructor() {}

  public static getInstance(): ErrorService {
    if (!ErrorService.instance) {
      ErrorService.instance = new ErrorService();
    }
    return ErrorService.instance;
  }

  /**
   * Log une erreur pour le debugging
   */
  private logError(error: any, context?: string) {
    // Ne pas logger les erreurs d'authentification courantes
    if (error?.code) {
      const normalAuthErrors = [
        'auth/email-already-in-use',
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/invalid-credential',
        'auth/user-disabled'
      ];

      if (normalAuthErrors.includes(error.code)) {
        return; // Ne pas logger ces erreurs
      }
    }

    this.errorLog.push({
      timestamp: new Date(),
      error,
      context
    });

    // Garder seulement les 100 dernières erreurs
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    // Log dans la console en mode développement
    if (__DEV__) {
      console.error(`[ErrorService${context ? ` - ${context}` : ''}]:`, error);
    }
  }

  /**
   * Traite une erreur Firebase et retourne un message d'erreur formaté
   */
  public handleFirebaseError(error: FirebaseError, context?: string): ErrorMessage {
    this.logError(error, context); // Le logError filtre déjà les erreurs normales

    const mappedCode = mapFirebaseError(error.code);
    return getErrorMessage(mappedCode);
  }

  /**
   * Traite une erreur générique et retourne un message d'erreur formaté
   */
  public handleGenericError(error: any, context?: string): ErrorMessage {
    this.logError(error, context);

    if (error instanceof FirebaseError) {
      return this.handleFirebaseError(error, context);
    }

    if (typeof error === 'string') {
      return getErrorMessage(error);
    }

    if (error?.code && typeof error.code === 'string') {
      return getErrorMessage(error.code);
    }

    // Erreur générique
    const genericError = getErrorMessage('general/unknown');
    if (error?.message) {
      genericError.message = error.message;
    }

    return genericError;
  }

  /**
   * Valide un email
   */
  public validateEmail(email: string): ErrorMessage | null {
    if (!email || !email.trim()) {
      return getErrorMessage('validation/empty-fields');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return getErrorMessage('validation/invalid-email');
    }

    return null;
  }

  /**
   * Valide un mot de passe
   */
  public validatePassword(password: string): ErrorMessage | null {
    if (!password || !password.trim()) {
      return getErrorMessage('validation/empty-fields');
    }

    if (password.length < 6) {
      return getErrorMessage('validation/weak-password');
    }

    return null;
  }

  /**
   * Valide que deux mots de passe correspondent
   */
  public validatePasswordMatch(password: string, confirmPassword: string): ErrorMessage | null {
    if (password !== confirmPassword) {
      return getErrorMessage('validation/password-mismatch');
    }

    return null;
  }

  /**
   * Valide l'âge d'un utilisateur
   */
  public validateAge(birthDate: Date): ErrorMessage | null {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 5) {
      return getErrorMessage('validation/invalid-age');
    }

    return null;
  }

  /**
   * Valide un groupe sanguin
   */
  public validateBloodType(bloodType: string, validTypes: string[]): ErrorMessage | null {
    if (!bloodType || !validTypes.includes(bloodType)) {
      return getErrorMessage('validation/invalid-blood-type');
    }

    return null;
  }

  /**
   * Affiche une alerte d'erreur
   */
  public showErrorAlert(
    error: ErrorMessage, 
    onActionPress?: () => void,
    onDismiss?: () => void
  ) {
    const buttons = [
      {
        text: 'OK',
        style: 'default' as const,
        onPress: onDismiss
      }
    ];

    // Ajouter un bouton d'action si l'erreur est actionnable
    if (error.actionable && error.actionText && onActionPress) {
      buttons.unshift({
        text: error.actionText,
        style: 'destructive' as const,
        onPress: onActionPress
      });
    }

    Alert.alert(
      error.title,
      error.message,
      buttons,
      { cancelable: false }
    );
  }

  /**
   * Affiche une alerte de succès
   */
  public showSuccessAlert(message: string, onDismiss?: () => void) {
    Alert.alert(
      'Succès',
      message,
      [
        {
          text: 'OK',
          style: 'default',
          onPress: onDismiss
        }
      ]
    );
  }

  /**
   * Vérifie si l'erreur est liée à la connectivité réseau
   */
  public isNetworkError(error: any): boolean {
    if (error instanceof FirebaseError) {
      return error.code === 'auth/network-request-failed';
    }

    return false;
  }

  /**
   * Vérifie si l'erreur est liée à l'authentification
   */
  public isAuthError(error: any): boolean {
    if (error instanceof FirebaseError) {
      return error.code.startsWith('auth/');
    }

    return false;
  }

  /**
   * Retourne les logs d'erreurs pour le debugging
   */
  public getErrorLogs(): Array<{ timestamp: Date; error: any; context?: string }> {
    return [...this.errorLog];
  }

  /**
   * Efface les logs d'erreurs
   */
  public clearErrorLogs() {
    this.errorLog = [];
  }

  /**
   * Crée une erreur personnalisée
   */
  public createCustomError(
    title: string, 
    message: string, 
    type: ErrorType = ErrorType.GENERAL,
    actionable: boolean = false,
    actionText?: string
  ): ErrorMessage {
    return {
      title,
      message,
      type,
      actionable,
      actionText
    };
  }

  /**
   * Gère les erreurs de validation de formulaire
   */
  public validateForm(fields: Record<string, any>): ErrorMessage | null {
    for (const [fieldName, value] of Object.entries(fields)) {
      if (!value || (typeof value === 'string' && !value.trim())) {
        return this.createCustomError(
          'Champs requis',
          `Le champ ${fieldName} est obligatoire`,
          ErrorType.VALIDATION
        );
      }
    }

    return null;
  }
}

// Export d'une instance singleton
export const errorService = ErrorService.getInstance();
