import React from 'react';
import { View, StyleSheet } from 'react-native';
import { withAlpha } from '../../utils/orderVisuals';

interface LedIndicatorProps {
  color: string;
}

const LedIndicator: React.FC<LedIndicatorProps> = ({ color }) => {
  if (typeof color !== 'string' || !color) {
    return null;
  }
  const styles = StyleSheet.create({
    ledOuter: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginRight: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ledInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
    },
  });

  return (
    <View style={[styles.ledOuter, { backgroundColor: withAlpha(color, 0.15) }]}>
      <View
        style={[
          styles.ledInner,
          { backgroundColor: color, borderColor: withAlpha(color, 0.35) },
        ]}
      />
    </View>
  );
};

export default LedIndicator;
