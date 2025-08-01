import React, { useEffect } from 'react';
import { Stack, Slot } from 'expo-router';
import { useColorScheme, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '@/context/AuthContext';
import { XPProvider } from '@/context/XPContext';
import { HeartsProvider } from '@/context/HeartsContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '@/context/ThemeContext';
import { TranslatorProvider } from 'react-native-translator';
import { LanguageProvider } from '../context/LanguageContext';
// Import de la configuration Firebase
import './config/firebase';

// Ignorer les avertissements liés à Reanimated et Firebase
import { LogBox } from 'react-native';
LogBox.ignoreLogs([
  'Reanimated 2',
  'AsyncStorage has been extracted from react-native core',
  'Setting a timer',
  'It appears that you are using old version of firebase',
  '[FirebaseError',
  'Non-serializable values were found in the navigation state',
  'The navigation state contains ambiguous routes'
]);

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    console.log('Application initialisée');
    // Précharger les ressources pour une navigation plus fluide
    return () => {
      console.log('Application terminée');
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LanguageProvider>
        <TranslatorProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <AuthProvider>
                <XPProvider>
                  <HeartsProvider>
                    <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
                    <Stack 
                      initialRouteName="index"
                      screenOptions={{
                        contentStyle: { backgroundColor: colorScheme === 'dark' ? '#121212' : '#f5f5f5' },
                        headerShown: false,
                        gestureEnabled: false,
                        animation: 'fade', // Animation en fondu pour transitions plus fluides
                        animationDuration: 150, // Réduire la durée d'animation
                      }}
                    >
                      {/* Route index disponible pour la redirection initiale */}
                      <Stack.Screen name="index" />
                      
                      {/* Routes d'authentification avec des animations spécifiques */}
                      <Stack.Screen
                        name="(auth)"
                        options={{
                          animation: 'fade',
                          presentation: 'transparentModal',
                        }}
                      />
                      
                      {/* Routes principales avec layout partagé */}
                      <Stack.Screen 
                        name="(app)" 
                        options={{
                          headerShown: false,
                          animation: 'none'
                        }}
                      />

                      {/* Autres routes nécessitant une animation standard */}
                      <Stack.Screen 
                        name="quiz/[difficulty]/[category]/[quizId]/results" 
                        options={{ 
                          animation: 'slide_from_right',
                          headerShown: false 
                        }}
                      />
                      <Stack.Screen 
                        name="quiz/[difficulty]/[category]/question" 
                        options={{ 
                          animation: 'slide_from_right',
                          headerShown: false 
                        }}
                      />
                    </Stack>
                  </HeartsProvider>
                </XPProvider>
              </AuthProvider>
            </ThemeProvider>
          </SafeAreaProvider>
        </TranslatorProvider>
      </LanguageProvider>
    </GestureHandlerRootView>
  );
}
