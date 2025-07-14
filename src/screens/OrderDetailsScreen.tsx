import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {OrderDetailsScreenProps} from '../types/navigation';

const OrderDetailsScreen: React.FC<OrderDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderId} = route.params;

  const handleEditOrder = () => {
    navigation.navigate('EditOrder', {orderId});
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.orderId}>Orden #{orderId}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditOrder}>
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información General</Text>
        <View style={styles.card}>
          <DetailRow label="Estado" value="En Progreso" />
          <DetailRow label="Cliente" value="Cliente Demo" />
          <DetailRow label="Fecha de Creación" value="2024-01-15" />
          <DetailRow label="Última Actualización" value="2024-01-20" />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Descripción</Text>
        <View style={styles.card}>
          <Text style={styles.description}>
            Esta es una descripción de ejemplo para la orden. Aquí se mostraría
            información detallada sobre lo que se solicita en la orden.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.card}>
          <TimelineItem
            title="Orden Creada"
            date="2024-01-15 10:00"
            description="La orden fue creada por el cliente"
          />
          <TimelineItem
            title="En Revisión"
            date="2024-01-16 14:30"
            description="La orden está siendo revisada"
          />
          <TimelineItem
            title="En Progreso"
            date="2024-01-17 09:15"
            description="Se comenzó el trabajo en la orden"
          />
        </View>
      </View>
    </ScrollView>
  );
};

const DetailRow = ({label, value}: {label: string; value: string}) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const TimelineItem = ({
  title,
  date,
  description,
}: {
  title: string;
  date: string;
  description: string;
}) => (
  <View style={styles.timelineItem}>
    <View style={styles.timelineMarker} />
    <View style={styles.timelineContent}>
      <Text style={styles.timelineTitle}>{title}</Text>
      <Text style={styles.timelineDate}>{date}</Text>
      <Text style={styles.timelineDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderId: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333333',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
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
  description: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    paddingVertical: 10,
  },
  timelineMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
    marginRight: 15,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
  },
  timelineDate: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  timelineDescription: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
  },
});

export default OrderDetailsScreen; 