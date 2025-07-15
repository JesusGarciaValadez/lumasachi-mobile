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
    throw new Error(`Failed to change language to ${language}: ${error}`);
  }
};

// Función para cargar el idioma guardado al iniciar la app
export const loadSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem('language');
    if (savedLanguage && ['es', 'en'].includes(savedLanguage)) {
      await i18n.changeLanguage(savedLanguage);
      return savedLanguage;
    }
    return null;
  } catch (error) {
    console.error('Error loading saved language:', error);
    // Don't throw here - this is a fallback operation
    return null;
  }
};

// Función para reinicializar i18n con configuración por defecto
export const reinitializeWithDefaults = async () => {
  try {
    await i18n.changeLanguage('es'); // Fallback to Spanish
    return true;
  } catch (error) {
    console.error('Error reinitializing i18n with defaults:', error);
    return false;
  }
};

// Función para verificar si AsyncStorage está disponible
const isAsyncStorageAvailable = async (): Promise<boolean> => {
  try {
    const testKey = '__test__';
    await AsyncStorage.setItem(testKey, 'test');
    await AsyncStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn('AsyncStorage is not available:', error);
    return false;
  }
};

// Función para inicializar i18n (será llamada desde App.tsx)
export const initializeI18n = async () => {
  try {
    // Verificar si AsyncStorage está disponible
    const storageAvailable = await isAsyncStorageAvailable();
    
    if (storageAvailable) {
      // Intentar cargar el idioma guardado
      const savedLanguage = await loadSavedLanguage();
      if (savedLanguage) {
        console.log(`Loaded saved language: ${savedLanguage}`);
      }
    } else {
      console.warn('AsyncStorage not available, using default language');
    }
    
    // Asegurar que i18n esté inicializado
    if (!i18n.isInitialized) {
      await i18n.init();
    }
    
    // Verificar que el idioma actual esté disponible
    const currentLanguage = i18n.language;
    if (!['es', 'en'].includes(currentLanguage)) {
      console.warn(`Current language ${currentLanguage} not supported, falling back to Spanish`);
      await i18n.changeLanguage('es');
    }
    
    console.log(`i18n initialized successfully with language: ${i18n.language}`);
    
  } catch (error) {
    console.error('Critical error during i18n initialization:', error);
    
    // Intentar reinicializar con configuración por defecto
    const fallbackSuccess = await reinitializeWithDefaults();
    if (!fallbackSuccess) {
      // Si incluso el fallback falla, lanzar el error original
      throw new Error(`Failed to initialize i18n and fallback failed: ${error}`);
    }
    
    console.warn('i18n initialized with default fallback configuration');
  }
};

export default i18n; 