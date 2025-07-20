import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { FirebaseError } from 'firebase/app';
import { 
  ErrorMessage, 
  getErrorMessage, 
  mapFirebaseError, 
  SUCCESS_MESSAGES 
} from '@/constants/ErrorMessages';

interface UseErrorHandlerReturn {
  error: ErrorMessage | null;
  isLoading: boolean;
  successMessage: string | null;
  setError: (error: ErrorMessage | string | null) => void;
  setLoading: (loading: boolean) => void;
  setSuccess: (message: string | null) => void;
  clearError: () => void;
  clearSuccess: () => void;
  clearAll: () => void;
  handleError: (error: any, showAlert?: boolean) => void;
  handleFirebaseError: (error: FirebaseError, showAlert?: boolean) => void;
  handleValidationError: (errorCode: string) => void;
  handleSuccess: (successCode: string, autoHide?: boolean) => void;
  executeWithErrorHandling: <T>(
    asyncFn: () => Promise<T>,
    options?: {
      showAlert?: boolean;
      successMessage?: string;
      loadingState?: boolean;
    }
  ) => Promise<T | null>;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setErrorState] = useState<ErrorMessage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fonction pour définir une erreur
  const setError = useCallback((error: ErrorMessage | string | null) => {
    if (error === null) {
      setErrorState(null);
    } else if (typeof error === 'string') {
      setErrorState(getErrorMessage(error));
    } else {
      setErrorState(error);
    }
    // Effacer le message de succès quand on affiche une erreur
    setSuccessMessage(null);
  }, []);

  // Fonction pour définir l'état de chargement
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
    // Effacer les messages quand on commence un chargement
    if (loading) {
      setErrorState(null);
      setSuccessMessage(null);
    }
  }, []);

  // Fonction pour définir un message de succès
  const setSuccess = useCallback((message: string | null) => {
    setSuccessMessage(message);
    // Effacer l'erreur quand on affiche un succès
    setErrorState(null);
  }, []);

  // Fonctions pour effacer les messages
  const clearError = useCallback(() => setErrorState(null), []);
  const clearSuccess = useCallback(() => setSuccessMessage(null), []);
  const clearAll = useCallback(() => {
    setErrorState(null);
    setSuccessMessage(null);
    setIsLoading(false);
  }, []);

  // Fonction pour gérer les erreurs génériques
  const handleError = useCallback((error: any, showAlert: boolean = false) => {
    console.error('Error handled:', error);
    
    let errorMessage: ErrorMessage;
    
    if (error instanceof FirebaseError) {
      const mappedCode = mapFirebaseError(error.code);
      errorMessage = getErrorMessage(mappedCode);
    } else if (typeof error === 'string') {
      errorMessage = getErrorMessage(error);
    } else if (error?.message) {
      errorMessage = getErrorMessage('general/unknown');
      errorMessage.message = error.message;
    } else {
      errorMessage = getErrorMessage('general/unknown');
    }

    setErrorState(errorMessage);

    // Afficher une alerte si demandé
    if (showAlert) {
      Alert.alert(
        errorMessage.title,
        errorMessage.message,
        [{ text: 'OK', style: 'default' }]
      );
    }
  }, []);

  // Fonction spécialisée pour les erreurs Firebase
  const handleFirebaseError = useCallback((error: FirebaseError, showAlert: boolean = false) => {
    console.error('Firebase error handled:', error.code, error.message);
    
    const mappedCode = mapFirebaseError(error.code);
    const errorMessage = getErrorMessage(mappedCode);
    
    setErrorState(errorMessage);

    // Afficher une alerte si demandé
    if (showAlert) {
      const buttons = [{ text: 'OK', style: 'default' as const }];
      
      // Ajouter un bouton d'action si l'erreur est actionnable
      if (errorMessage.actionable && errorMessage.actionText) {
        buttons.unshift({
          text: errorMessage.actionText,
          style: 'destructive' as const
        });
      }

      Alert.alert(
        errorMessage.title,
        errorMessage.message,
        buttons
      );
    }
  }, []);

  // Fonction pour gérer les erreurs de validation
  const handleValidationError = useCallback((errorCode: string) => {
    const errorMessage = getErrorMessage(errorCode);
    setErrorState(errorMessage);
  }, []);

  // Fonction pour gérer les messages de succès
  const handleSuccess = useCallback((successCode: string, autoHide: boolean = false) => {
    const message = SUCCESS_MESSAGES[successCode] || 'Opération réussie';
    setSuccessMessage(message);
    setErrorState(null);

    // Auto-hide après 3 secondes si demandé
    if (autoHide) {
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    }
  }, []);

  // Fonction utilitaire pour exécuter une fonction async avec gestion d'erreurs
  const executeWithErrorHandling = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: {
      showAlert?: boolean;
      successMessage?: string;
      loadingState?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { 
      showAlert = false, 
      successMessage, 
      loadingState = true 
    } = options;

    try {
      if (loadingState) {
        setLoading(true);
      }
      
      const result = await asyncFn();
      
      if (successMessage) {
        setSuccess(successMessage);
      }
      
      return result;
    } catch (error) {
      handleError(error, showAlert);
      return null;
    } finally {
      if (loadingState) {
        setIsLoading(false);
      }
    }
  }, [setLoading, setSuccess, handleError]);

  return {
    error,
    isLoading,
    successMessage,
    setError,
    setLoading,
    setSuccess,
    clearError,
    clearSuccess,
    clearAll,
    handleError,
    handleFirebaseError,
    handleValidationError,
    handleSuccess,
    executeWithErrorHandling
  };
};
