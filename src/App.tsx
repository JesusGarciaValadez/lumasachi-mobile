/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import { queryClient } from './services/queryClient';
import { RootStackParamList } from './types/navigation';
import { COLORS } from './constants';

// Placeholder screens - these will be created in future phases
import { LoginScreen } from './screens/LoginScreen';
import { HomeScreen } from './screens/HomeScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <StatusBar
              backgroundColor={COLORS.PRIMARY}
              barStyle="light-content"
            />
            <Stack.Navigator
              initialRouteName="Login"
              screenOptions={{
                headerStyle: {
                  backgroundColor: COLORS.PRIMARY,
                },
                headerTintColor: COLORS.WHITE,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}>
              <Stack.Screen
                name="Login"
                component={LoginScreen}
                options={{
                  title: 'Iniciar Sesión',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="App"
                component={HomeScreen}
                options={{
                  title: 'Lumasachi Control',
                  headerShown: false,
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </QueryClientProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

export default App;
