import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useTranslation} from 'react-i18next';

const PRIMARY_COLOR = '#007AFF';

const SplashScreen: React.FC = () => {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('app.name')}</Text>
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
});

export default SplashScreen; 