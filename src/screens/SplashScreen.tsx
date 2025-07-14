import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';

const SplashScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lumasachi Control</Text>
      <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      <Text style={styles.subtitle}>Cargando...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 20,
  },
  loader: {
    marginVertical: 20,
  },
});

export default SplashScreen; 