import { getErrorMessage, mapFirebaseError } from '../constants/ErrorMessages';

// Mock Firebase Error class pour les tests
class MockFirebaseError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'FirebaseError';
  }
}

// Mock du service d'erreur pour éviter les imports Firebase
const mockErrorService = {
  validateEmail: (email: string) => {
    if (!email || !email.trim()) {
      return getErrorMessage('validation/empty-fields');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return getErrorMessage('validation/invalid-email');
    }
    return null;
  },

  validatePassword: (password: string) => {
    if (!password || !password.trim()) {
      return getErrorMessage('validation/empty-fields');
    }
    if (password.length < 6) {
      return getErrorMessage('validation/weak-password');
    }
    return null;
  },

  validatePasswordMatch: (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      return getErrorMessage('validation/password-mismatch');
    }
    return null;
  },

  validateAge: (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 5) {
      return getErrorMessage('validation/invalid-age');
    }
    return null;
  },

  validateBloodType: (bloodType: string, validTypes: string[]) => {
    if (!bloodType || !validTypes.includes(bloodType)) {
      return getErrorMessage('validation/invalid-blood-type');
    }
    return null;
  },

  handleFirebaseError: (error: MockFirebaseError) => {
    const mappedCode = mapFirebaseError(error.code);
    return getErrorMessage(mappedCode);
  },

  handleGenericError: (error: any) => {
    if (error instanceof MockFirebaseError) {
      return mockErrorService.handleFirebaseError(error);
    }
    if (typeof error === 'string') {
      const genericError = getErrorMessage('general/unknown');
      genericError.message = error;
      return genericError;
    }
    if (error?.message) {
      const genericError = getErrorMessage('general/unknown');
      genericError.message = error.message;
      return genericError;
    }
    return getErrorMessage('general/unknown');
  }
};

describe('Error Handling System', () => {
  describe('Email Validation', () => {
    test('should return null for valid email', () => {
      const result = mockErrorService.validateEmail('test@example.com');
      expect(result).toBeNull();
    });

    test('should return error for empty email', () => {
      const result = mockErrorService.validateEmail('');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Champs requis');
    });

    test('should return error for invalid email format', () => {
      const result = mockErrorService.validateEmail('invalid-email');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Email invalide');
      expect(result?.message).toContain('adresse email valide');
    });

    test('should return error for email without domain', () => {
      const result = mockErrorService.validateEmail('test@');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Email invalide');
    });
  });

  describe('Password Validation', () => {
    test('should return null for valid password', () => {
      const result = mockErrorService.validatePassword('password123');
      expect(result).toBeNull();
    });

    test('should return error for empty password', () => {
      const result = mockErrorService.validatePassword('');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Champs requis');
    });

    test('should return error for short password', () => {
      const result = mockErrorService.validatePassword('123');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Mot de passe trop faible');
      expect(result?.message).toContain('6 caractères');
    });
  });

  describe('Password Match Validation', () => {
    test('should return null for matching passwords', () => {
      const result = mockErrorService.validatePasswordMatch('password123', 'password123');
      expect(result).toBeNull();
    });

    test('should return error for non-matching passwords', () => {
      const result = mockErrorService.validatePasswordMatch('password123', 'different');
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Mots de passe différents');
      expect(result?.message).toContain('ne correspondent pas');
    });
  });

  describe('Age Validation', () => {
    test('should return null for valid age', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 20); // 20 ans
      const result = mockErrorService.validateAge(birthDate);
      expect(result).toBeNull();
    });

    test('should return error for age under 5', () => {
      const birthDate = new Date();
      birthDate.setFullYear(birthDate.getFullYear() - 3); // 3 ans
      const result = mockErrorService.validateAge(birthDate);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Âge invalide');
      expect(result?.message).toContain('5 ans');
    });
  });

  describe('Blood Type Validation', () => {
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    test('should return null for valid blood type', () => {
      const result = mockErrorService.validateBloodType('A+', validBloodTypes);
      expect(result).toBeNull();
    });

    test('should return error for invalid blood type', () => {
      const result = mockErrorService.validateBloodType('X+', validBloodTypes);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Groupe sanguin requis');
    });

    test('should return error for empty blood type', () => {
      const result = mockErrorService.validateBloodType('', validBloodTypes);
      expect(result).not.toBeNull();
      expect(result?.title).toBe('Groupe sanguin requis');
    });
  });

  describe('Firebase Error Handling', () => {
    test('should handle auth/invalid-email error', () => {
      const firebaseError = new MockFirebaseError('auth/invalid-email', 'Invalid email');
      const result = mockErrorService.handleFirebaseError(firebaseError);

      expect(result.title).toBe('Email ou mot de passe incorrect');
      expect(result.actionable).toBe(true);
      expect(result.actionText).toBe('Mot de passe oublié ?');
    });

    test('should handle auth/email-already-in-use error', () => {
      const firebaseError = new MockFirebaseError('auth/email-already-in-use', 'Email already in use');
      const result = mockErrorService.handleFirebaseError(firebaseError);

      expect(result.title).toBe('Email déjà utilisé');
      expect(result.actionable).toBe(true);
      expect(result.actionText).toBe('Se connecter');
    });

    test('should handle auth/weak-password error', () => {
      const firebaseError = new MockFirebaseError('auth/weak-password', 'Weak password');
      const result = mockErrorService.handleFirebaseError(firebaseError);

      expect(result.title).toBe('Mot de passe trop faible');
      expect(result.message).toContain('6 caractères');
    });

    test('should handle unknown Firebase error', () => {
      const firebaseError = new MockFirebaseError('auth/unknown-error', 'Unknown error');
      const result = mockErrorService.handleFirebaseError(firebaseError);

      expect(result.title).toBe('Erreur inattendue');
    });
  });

  describe('Error Message Mapping', () => {
    test('should map Firebase error codes correctly', () => {
      expect(mapFirebaseError('auth/invalid-email')).toBe('auth/invalid-email');
      expect(mapFirebaseError('auth/user-not-found')).toBe('auth/user-not-found');
      expect(mapFirebaseError('auth/wrong-password')).toBe('auth/wrong-password');
      expect(mapFirebaseError('unknown-error')).toBe('general/unknown');
    });

    test('should get correct error messages', () => {
      const emailError = getErrorMessage('validation/invalid-email');
      expect(emailError.title).toBe('Email invalide');
      expect(emailError.message).toContain('adresse email valide');

      const unknownError = getErrorMessage('unknown-code');
      expect(unknownError.title).toBe('Erreur inattendue');
    });
  });

  describe('Generic Error Handling', () => {
    test('should handle string errors', () => {
      const result = mockErrorService.handleGenericError('Custom error message');
      expect(result.title).toBe('Erreur inattendue');
      expect(result.message).toBe('Custom error message');
    });

    test('should handle error objects with message', () => {
      const error = new Error('Something went wrong');
      const result = mockErrorService.handleGenericError(error);
      expect(result.title).toBe('Erreur inattendue');
      expect(result.message).toBe('Something went wrong');
    });

    test('should handle Firebase errors in generic handler', () => {
      const firebaseError = new MockFirebaseError('auth/invalid-email', 'Invalid email');
      const result = mockErrorService.handleGenericError(firebaseError);
      expect(result.title).toBe('Email ou mot de passe incorrect');
    });
  });
});
