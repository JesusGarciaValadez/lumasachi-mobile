import {useTranslation} from 'react-i18next';
import {useCallback, useMemo} from 'react';

// Hook personalizado para manejar traducciones de manera más segura
export const useTranslationSafe = () => {
  const {t, i18n} = useTranslation();

  // Create a stable translation function
  const translate = useCallback((key: string, options?: any) => {
    try {
      return t(key, options);
    } catch (error) {
      console.error('Translation error:', error);
      return key; // Return the key if there's an error
    }
  }, [t]);

  // Proporcionar información sobre el estado de i18n
  const i18nInfo = useMemo(() => ({
    language: i18n.language,
    isInitialized: i18n.isInitialized,
    isReady: i18n.isInitialized && i18n.hasLoadedNamespace('translation'),
  }), [i18n.language, i18n.isInitialized, i18n]);

  return {
    t: translate,
    i18n: i18nInfo,
  };
};

export default useTranslationSafe; 