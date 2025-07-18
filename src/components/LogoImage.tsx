import React from 'react';
import {View, StyleSheet, Image} from 'react-native';
import { useTranslation } from 'react-i18next';
import LumasachiLogoImage from '../assets/images/lumasachi-logo.png';

const LogoImage = () => {
  const {t} = useTranslation();

  return (
    <View style={styles.logoContainer}>
        <Image 
        source={LumasachiLogoImage}
        style={styles.logoImage}
        resizeMode="contain"
        accessibilityLabel={t('auth.logoAltText')}
        />
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logoImage: {
    width: 400,
    height: 200,
  },
});

export default LogoImage;