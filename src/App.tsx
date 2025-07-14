/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {AuthProvider} from './hooks/useAuth';
import RootNavigator from './navigation/RootNavigator';

const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </>
  );
};

export default App;
