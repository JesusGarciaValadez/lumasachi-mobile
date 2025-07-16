import React from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useTranslationSafe } from '../hooks/useTranslationSafe';

const { width } = Dimensions.get('window');

interface OfflineIndicatorProps {
  style?: any;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ style }) => {
  const { isOffline, refresh } = useNetworkStatus();
  const { t } = useTranslationSafe();
  const [animatedValue] = React.useState(new Animated.Value(0));

  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: isOffline ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, animatedValue]);

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error) {
      console.warn('Failed to refresh network status:', error);
    }
  };

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: animatedValue,
          transform: [
            {
              translateY: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.title}>
          {String(t('common.errors.offlineTitle'))}
        </Text>
        <Text style={styles.message}>
          {String(t('common.errors.offlineMessage'))}
        </Text>
        <Button
          mode="contained"
          onPress={handleRefresh}
          style={styles.refreshButton}
          contentStyle={styles.refreshButtonContent}
        >
          {String(t('common.retry'))}
        </Button>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#f44336',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 4,
  },
  refreshButtonContent: {
    paddingHorizontal: 12,
  },
});

export default OfflineIndicator; 