import React from 'react';
import {View, Text, StyleSheet, ActivityIndicator, Image} from 'react-native';
import {useTranslation} from 'react-i18next';

// Opción 1: Con SVG (requiere react-native-svg)
/*
import Svg, {Path, Text as SvgText} from 'react-native-svg';

const LumasachiLogoSVG = () => (
  <Svg width="280" height="70" viewBox="0 0 800 200">
    {/* Tu SVG aquí */}
  </Svg>
);
*/

// Opción 2: Con PNG (nativo, no requiere dependencias)
const LumasachiLogoPNG = () => (
  <Image 
    source={require('../assets/images/lumasachi-logo.png')}
    style={styles.logo}
    resizeMode="contain"
  />
);

// Opción 3: Con diseño usando Views (actual, sin imágenes)
const LumasachiLogoViews = () => (
  <View style={styles.logoContainer}>
    <View style={styles.carShape}>
      <View style={styles.carTop} />
      <View style={styles.carWindshield} />
    </View>
    <Text style={styles.logoText}>LUMASACHI</Text>
  </View>
);

const PRIMARY_COLOR = '#007AFF';

const SplashScreen: React.FC = () => {
  const {t} = useTranslation();

  return (
    <View style={styles.container}>
      {/* Elige una de las tres opciones */}
      <LumasachiLogoViews />
      {/* <LumasachiLogoPNG /> */}
      {/* <LumasachiLogoSVG /> */}
      
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
  logo: {
    width: 280,
    height: 70,
    marginBottom: 20,
  },
  // ... resto de los estilos
});

export default SplashScreen;
