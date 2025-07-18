import {View, StyleSheet, Image} from 'react-native';
import LumasachiLogoImage from '../assets/images/lumasachi-logo.png';

const LogoImage = () => (
  <View style={styles.logoContainer}>
    <Image 
      source={LumasachiLogoImage}
      style={{ width: 400, height: 200 }}
      resizeMode="contain"
    />
  </View>
);

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
});

export default LogoImage;