import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  updatePassword as firebaseUpdatePassword,
  UserCredential
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { firebaseAuth, firebaseDB } from '../backend/config/firebase.config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { errorService } from '../app/services/error.service';

// Clé pour stocker l'email dans AsyncStorage
const EMAIL_FOR_SIGNIN = 'emailForSignIn';

interface CustomUser extends FirebaseUser {
  name?: string;
  bloodType?: string;
  birthDate?: Date;
  createdAt?: any;
}

interface AuthContextType {
  user: CustomUser | null;
  loading: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, bloodType?: string, birthDate?: Date) => Promise<UserCredential>;
  signOut: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  sendSignInLink: (email: string) => Promise<void>;
  completeSignInWithLink: (email: string, link: string) => Promise<void>;
  checkSignInLink: (link: string) => boolean;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshUserFromFirestore: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);
  const isSignedIn = user !== null;

  // Vérifier l'état d'authentification au chargement
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (firebaseUser) {
        let userData: any = {};
        try {
          const userDoc = await getDoc(doc(firebaseDB, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            userData = userDoc.data();
            console.log('Données utilisateur récupérées depuis Firestore:', userData);
          } else {
            console.log('Aucun document utilisateur trouvé dans Firestore');
          }
        } catch (e) {
          console.error('Erreur lors de la récupération des données Firestore:', e);
        }

        const user = {
          ...firebaseUser,
          ...userData,
          birthDate: userData.birthDate ? new Date(userData.birthDate) : undefined,
        };

        console.log('Utilisateur final configuré:', {
          uid: user.uid,
          name: user.name,
          email: user.email,
          bloodType: user.bloodType,
          birthDate: user.birthDate
        });

        setUser(user);
        setLoading(false);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error: any) {
      // Lancer l'erreur Firebase directement pour que les composants puissent la traiter
      if (error instanceof FirebaseError) {
        throw error;
      }
      // Pour les autres types d'erreurs, les wrapper dans une FirebaseError générique
      throw new Error(error.message || 'Erreur de connexion');
    }
  };

  const signUp = async (email: string, password: string, name: string, bloodType?: string, birthDate?: Date): Promise<UserCredential> => {
    try {
      console.log('Inscription avec:', { name, email, bloodType, birthDate: birthDate?.toISOString() });

      // Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);

      // Mettre à jour le profil dans Firebase Auth
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: name
        });

        // Préparer les données utilisateur
        const userData = {
          name,
          email,
          bloodType: bloodType || 'O+',
          birthDate: birthDate ? birthDate.toISOString() : new Date().toISOString(),
          xpPoints: 0, // XP initiaux
          lives: 5, // Vies initiales
          createdAt: serverTimestamp(),
          lastUpdated: new Date().toISOString()
        };

        console.log('Sauvegarde des données utilisateur:', userData);

        // Stocker des informations supplémentaires dans Firestore
        await setDoc(doc(firebaseDB, 'users', userCredential.user.uid), userData);

        console.log('Données utilisateur sauvegardées avec succès dans Firestore');
      }

      return userCredential;
    } catch (error: any) {
      // Lancer l'erreur Firebase directement pour que les composants puissent la traiter
      if (error instanceof FirebaseError) {
        throw error;
      }
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(firebaseAuth);
      // Nettoyer les données locales
      try {
        await AsyncStorage.removeItem(EMAIL_FOR_SIGNIN);
        // Si vous stockez d'autres données locales, les nettoyer ici
      } catch (storageError) {
        errorService.handleGenericError(storageError, 'AuthContext.signOut.localStorage');
        // Continuer même en cas d'erreur de stockage
      }
      // Le reste sera géré par le subscriber onAuthStateChanged
    } catch (error: any) {
      if (error instanceof FirebaseError) {
        throw error;
      }
      throw new Error(error.message || 'Erreur lors de la déconnexion');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(firebaseAuth, email);
    } catch (error: any) {
      if (error instanceof FirebaseError) {
        throw error;
      }
      throw new Error(error.message || 'Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  };

  // Fonction pour envoyer un lien de connexion par email
  const sendSignInLink = async (email: string) => {
    try {
      // Configuration du lien d'authentification
      const actionCodeSettings = {
        // URL avec le domaine autorisé dans Firebase
        url: 'https://meducare01-ea9c1.firebaseapp.com/finishSignIn',
        handleCodeInApp: true,
        // Information sur l'application Android
        android: {
          packageName: 'com.meducare.app',
          installApp: true,
          minimumVersion: '12'
        },
        // Information sur l'application iOS
        iOS: {
          bundleId: 'com.meducare.app'
        }
      };

      // Envoyer le lien d'authentification
      await sendSignInLinkToEmail(firebaseAuth, email, actionCodeSettings);

      // Sauvegarder l'email dans AsyncStorage pour le récupérer plus tard
      await AsyncStorage.setItem(EMAIL_FOR_SIGNIN, email);
    } catch (error: any) {
      if (error instanceof FirebaseError) {
        throw error;
      }
      throw new Error(error.message || 'Erreur lors de l\'envoi du lien de connexion');
    }
  };

  // Vérifier si un lien est un lien d'authentification
  const checkSignInLink = (link: string): boolean => {
    if (!link) return false;
    return isSignInWithEmailLink(firebaseAuth, link);
  };

  // Terminer l'authentification avec un lien
  const completeSignInWithLink = async (email: string, link: string) => {
    try {
      const result = await signInWithEmailLink(firebaseAuth, email, link);
      
      // Créer ou mettre à jour le profil utilisateur si nécessaire
      if (result.user && !result.user.displayName) {
        const name = email.split('@')[0]; // Utiliser la partie avant @ comme nom par défaut
        
        // Mettre à jour le profil
        await updateProfile(result.user, {
          displayName: name
        });
        
        // Tenter de créer l'utilisateur dans Firestore mais ne pas bloquer l'authentification
        setDoc(doc(firebaseDB, 'users', result.user.uid), {
          name,
          email: result.user.email || email,
          bloodType: 'O+', // Valeur par défaut
          birthDate: result.user.metadata.creationTime ? new Date(result.user.metadata.creationTime).toISOString() : undefined,
          createdAt: serverTimestamp()
        }).catch(error => {
          errorService.handleGenericError(error, 'AuthContext.completeSignInWithLink.firestore');
        });
      }
      
      // Supprimer l'email de AsyncStorage
      await AsyncStorage.removeItem(EMAIL_FOR_SIGNIN);
      
      // Le reste sera géré par le subscriber onAuthStateChanged
    } catch (error: any) {
      if (error instanceof FirebaseError) {
        throw error;
      }
      throw new Error(error.message || 'Erreur lors de la finalisation de la connexion');
    }
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      await firebaseUpdatePassword(user, newPassword);
    } catch (error: any) {
      if (error instanceof FirebaseError) {
        throw error;
      }
      throw new Error(error.message || 'Erreur lors de la mise à jour du mot de passe');
    }
  };

  // Fonction pour rafraîchir les infos utilisateur depuis Firestore
  const refreshUserFromFirestore = async () => {
    if (!user) return;
    try {
      console.log('Rafraîchissement des données utilisateur depuis Firestore...');
      const userDoc = await getDoc(doc(firebaseDB, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Nouvelles données récupérées:', userData);

        const updatedUser = {
          ...user,
          ...userData,
          birthDate: userData.birthDate ? new Date(userData.birthDate) : undefined,
        };

        console.log('Utilisateur mis à jour:', {
          uid: updatedUser.uid,
          name: updatedUser.name,
          email: updatedUser.email,
          bloodType: updatedUser.bloodType,
          birthDate: updatedUser.birthDate
        });

        setUser(updatedUser);
      } else {
        console.log('Aucun document utilisateur trouvé lors du rafraîchissement');
      }
    } catch (e) {
      console.error('Erreur lors du rafraîchissement:', e);
      errorService.handleGenericError(e, 'AuthContext.refreshUserFromFirestore');
    }
  };

  const value = {
    user,
    loading,
    isSignedIn,
    signIn,
    signUp,
    signOut,
    forgotPassword,
    sendSignInLink,
    completeSignInWithLink,
    checkSignInLink,
    updatePassword,
    refreshUserFromFirestore
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 