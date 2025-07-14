import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Recursos de traducción
import es from './locales/es.json';
import en from './locales/en.json';

const resources = {
  es: {
    translation: es,
  },
  en: {
    translation: en,
  },
};

// Configuración de i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // idioma por defecto
    fallbackLng: 'es',
    
    interpolation: {
      escapeValue: false, // React ya maneja el escape por defecto
    },
    
    // Configuración más compatible con React 19
    react: {
      useSuspense: false,
    },
    
    // Configuración simplificada
    compatibilityJSON: 'v3',
    
    // Configuración de debug para desarrollo
    debug: __DEV__,
  });

// Función para cambiar idioma y guardarlo en AsyncStorage
export const changeLanguage = async (language: string) => {
  try {
    await AsyncStorage.setItem('language', language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Función para cargar el idioma guardado al iniciar la app
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage && ['es', 'en'].includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
    }
  } catch (error) {
    console.error('Error loading saved language:', error);
  }
};

// Función para inicializar i18n (será llamada desde App.tsx)
export const initializeI18n = async () => {
  // Cargar el idioma guardado
  await loadSavedLanguage();
  
  // Asegurar que i18n esté listo
  if (!i18n.isInitialized) {
    await i18n.init();
  }
};

export default i18n; 