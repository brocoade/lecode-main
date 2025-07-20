import { useLanguage } from '../context/LanguageContext';
import { useTranslator } from 'react-native-translator';
import { useCallback } from 'react';

/**
 * Hook pour traduire dynamiquement un texte selon la langue sélectionnée.
 * @returns autoTranslate: (text: string) => Promise<string>
 */
export function useAutoTranslate() {
  const { language } = useLanguage();
  const { translate } = useTranslator();

  /**
   * Traduit le texte donné dans la langue sélectionnée.
   * @param text Texte à traduire
   * @param from Langue source (optionnel, défaut 'fr')
   * @returns Promise<string>
   */
  const autoTranslate = useCallback(
    async (text: string, from: string = 'fr') => {
      if (!text) return '';
      if (language === from) return text;
      try {
        return await translate(from, language, text);
      } catch (e) {
        return text;
      }
    },
    [language, translate]
  );

  return { autoTranslate };
} 