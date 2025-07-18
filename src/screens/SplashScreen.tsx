import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Image} from 'react-native';
import {useTranslation} from 'react-i18next';
import LumasachiLogoImage from '../assets/images/lumasachi-logo.png';

const PRIMARY_COLOR = '#007AFF';

const LumasachiLogo = () => (
  <View style={styles.logoContainer}>
    <Image 
      source={LumasachiLogoImage}
      style={{ width: 400, height: 200 }}
      resizeMode="contain"
    />
  </View>
);

const SplashScreen: React.FC = () => {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      <LumasachiLogo />
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  carContainer: {
    width: 140,
    height: 60,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carBody: {
    width: 140,
    height: 35,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
  },
  carRoof: {
    width: 90,
    height: 25,
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    position: 'absolute',
    top: 5,
  },
  carWindshield: {
    width: 70,
    height: 20,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    top: 8,
    borderWidth: 3,
    borderColor: '#1a1a1a',
    borderBottomWidth: 0,
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
