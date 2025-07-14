/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {StatusBar, ActivityIndicator, View, StyleSheet} from 'react-native';
import {AuthProvider} from './hooks/useAuth';
import RootNavigator from './navigation/RootNavigator';
import './i18n'; // Importar configuración de i18n
import {initializeI18n} from './i18n';
import {TranslationProvider} from './i18n/TranslationProvider';

const App: React.FC = () => {
  const [i18nInitialized, setI18nInitialized] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeI18n();
        setI18nInitialized(true);
      } catch (error) {
        console.error('Error initializing i18n:', error);
        // Continuar con la inicialización por defecto
        setI18nInitialized(true);
      }
    };

    initialize();
  }, []);

  // Mostrar loading mientras se inicializa i18n
  if (!i18nInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TranslationProvider>
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </TranslationProvider>
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});

export default App;
