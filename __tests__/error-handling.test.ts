/**
 * Tests pour le système de gestion d'erreurs
 */

import { errorService } from '../app/services/error.service';
import { getErrorMessage, mapFirebaseError, AUTH_ERRORS } from '../constants/ErrorMessages';
import { FirebaseError } from 'firebase/app';

describe('ErrorService', () => {
  beforeEach(() => {
    errorService.clearErrorLogs();
  });

  describe('validateEmail', () => {
    it('should return null for valid email', () => {
      const result = errorService.validateEmail('test@example.com');
      expect(result).toBeNull();
    });

    it('should return error for empty email', () => {
      const result = errorService.validateEmail('');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('validation');
    });

    it('should return error for invalid email format', () => {
      const result = errorService.validateEmail('invalid-email');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('validation');
    });
  });

  describe('validatePassword', () => {
    it('should return null for valid password', () => {
      const result = errorService.validatePassword('password123');
      expect(result).toBeNull();
    });

    it('should return error for empty password', () => {
      const result = errorService.validatePassword('');
      expect(result).not.toBeNull();
    });

    it('should return error for weak password', () => {
      const result = errorService.validatePassword('123');
      expect(result).not.toBeNull();
    });
  });

  describe('validatePasswordMatch', () => {
    it('should return null for matching passwords', () => {
      const result = errorService.validatePasswordMatch('password123', 'password123');
      expect(result).toBeNull();
    });

    it('should return error for non-matching passwords', () => {
      const result = errorService.validatePasswordMatch('password123', 'different');
      expect(result).not.toBeNull();
    });
  });

  describe('validateAge', () => {
    it('should return null for valid age', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20);
      const result = errorService.validateAge(birthDate);
      expect(result).toBeNull();
    });

    it('should return error for age under 5', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 3);
      const result = errorService.validateAge(birthDate);
      expect(result).not.toBeNull();
    });
  });

  describe('handleFirebaseError', () => {
    it('should handle auth/invalid-email error', () => {
      const firebaseError = {
        code: 'auth/invalid-email',
        message: 'Invalid email'
      } as FirebaseError;

      const result = errorService.handleFirebaseError(firebaseError);
      expect(result.title).toBe('Email ou mot de passe incorrect');
      expect(result.type).toBe('authentication');
    });

    it('should handle unknown Firebase error', () => {
      const firebaseError = {
        code: 'auth/unknown-error',
        message: 'Unknown error'
      } as FirebaseError;

      const result = errorService.handleFirebaseError(firebaseError);
      expect(result.title).toBe('Erreur inattendue');
    });
  });

  describe('error logging', () => {
    it('should log errors', () => {
      const error = new Error('Test error');
      errorService.handleGenericError(error, 'test-context');
      
      const logs = errorService.getErrorLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].context).toBe('test-context');
    });

    it('should clear error logs', () => {
      const error = new Error('Test error');
      errorService.handleGenericError(error);
      
      expect(errorService.getErrorLogs()).toHaveLength(1);
      
      errorService.clearErrorLogs();
      expect(errorService.getErrorLogs()).toHaveLength(0);
    });
  });
});

describe('Error Messages', () => {
  describe('getErrorMessage', () => {
    it('should return correct error message for known code', () => {
      const result = getErrorMessage('auth/invalid-email');
      expect(result.title).toBe('Email ou mot de passe incorrect');
      expect(result.type).toBe('authentication');
    });

    it('should return generic error for unknown code', () => {
      const result = getErrorMessage('unknown/error');
      expect(result.title).toBe('Erreur inattendue');
      expect(result.type).toBe('general');
    });
  });

  describe('mapFirebaseError', () => {
    it('should map known Firebase error codes', () => {
      const result = mapFirebaseError('auth/invalid-email');
      expect(result).toBe('auth/invalid-email');
    });

    it('should return generic code for unknown Firebase error', () => {
      const result = mapFirebaseError('auth/unknown-error');
      expect(result).toBe('general/unknown');
    });
  });

  describe('AUTH_ERRORS', () => {
    it('should have all required authentication error messages', () => {
      const requiredErrors = [
        'auth/invalid-email',
        'auth/user-not-found',
        'auth/wrong-password',
        'auth/email-already-in-use',
        'auth/weak-password',
        'auth/too-many-requests'
      ];

      requiredErrors.forEach(errorCode => {
        expect(AUTH_ERRORS[errorCode]).toBeDefined();
        expect(AUTH_ERRORS[errorCode].title).toBeTruthy();
        expect(AUTH_ERRORS[errorCode].message).toBeTruthy();
      });
    });

    it('should have actionable errors with action text', () => {
      const actionableErrors = Object.values(AUTH_ERRORS).filter(error => error.actionable);
      
      actionableErrors.forEach(error => {
        expect(error.actionText).toBeTruthy();
      });
    });
  });
});

describe('Error Types', () => {
  it('should categorize errors correctly', () => {
    expect(AUTH_ERRORS['auth/invalid-email'].type).toBe('authentication');
    expect(AUTH_ERRORS['validation/empty-fields'].type).toBe('validation');
    expect(AUTH_ERRORS['auth/network-request-failed'].type).toBe('network');
  });
});
