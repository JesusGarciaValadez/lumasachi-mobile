import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface ActionCardProps {
  title: string;
  description: string;
  onPress: () => void;
  color?: string;
}

const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  onPress,
  color = '#007AFF',
}) => (
  <TouchableOpacity
    style={[styles.actionCard, {borderLeftColor: color}]}
    onPress={onPress}>
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionDescription}>{description}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});

export default ActionCard; 