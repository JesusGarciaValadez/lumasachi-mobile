import React, {createContext, useContext, useEffect, useState} from 'react';
import {I18nextProvider} from 'react-i18next';
import i18n from './index';

interface TranslationContextType {
  isReady: boolean;
  currentLanguage: string;
}

const TranslationContext = createContext<TranslationContextType>({
  isReady: false,
  currentLanguage: 'es',
});

export const useTranslationContext = () => useContext(TranslationContext);

interface TranslationProviderProps {
  children: React.ReactNode;
}

export const TranslationProvider: React.FC<TranslationProviderProps> = ({
  children,
}) => {
  const [isReady, setIsReady] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('es');

  useEffect(() => {
    const onInitialized = () => {
      setIsReady(true);
      setCurrentLanguage(i18n.language);
    };

    const onLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
    };

    if (i18n.isInitialized) {
      onInitialized();
    }

    i18n.on('initialized', onInitialized);
    i18n.on('languageChanged', onLanguageChanged);

    return () => {
      i18n.off('initialized', onInitialized);
      i18n.off('languageChanged', onLanguageChanged);
    };
  }, []);

  const contextValue = {
    isReady,
    currentLanguage,
  };

  return (
    <TranslationContext.Provider value={contextValue}>
      <I18nextProvider i18n={i18n}>
        {children}
      </I18nextProvider>
    </TranslationContext.Provider>
  );
}; 