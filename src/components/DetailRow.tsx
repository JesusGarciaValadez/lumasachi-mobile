import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface DetailRowProps {
  label: string;
  value: string;
  valueFlex?: number;
}

const DetailRow: React.FC<DetailRowProps> = ({label, value, valueFlex = 1}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}:</Text>
    <Text style={[styles.detailValue, {flex: valueFlex}]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 16,
    color: '#666666',
    flex: 1,
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
});

export default DetailRow; 