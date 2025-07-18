import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useTranslation} from 'react-i18next';
import LogoImage from '../components/LogoImage';

const PRIMARY_COLOR = '#007AFF';


const SplashScreen: React.FC = () => {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <LogoImage />
      <ActivityIndicator size="large" color={PRIMARY_COLOR} style={styles.loader} />
      <Text style={styles.subtitle}>{t('app.loading')}</Text>
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
    color: PRIMARY_COLOR,
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
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    fontStyle: 'italic',
    color: '#1a1a1a',
    letterSpacing: 1,
  },
});

export default SplashScreen;
