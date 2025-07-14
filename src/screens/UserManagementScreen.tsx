import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

const UserManagementScreen: React.FC = () => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleCreateUser = () => {
    Alert.alert('Crear Usuario', 'Funcionalidad para crear nuevo usuario');
  };

  const handleManageRoles = () => {
    Alert.alert('Gestionar Roles', 'Funcionalidad para gestionar roles');
  };

  const handleViewReports = () => {
    Alert.alert('Ver Reportes', 'Funcionalidad para ver reportes');
  };

  const handleExportData = () => {
    Alert.alert('Exportar Datos', 'Funcionalidad para exportar datos');
  };

  const ActionCard = ({
    title,
    description,
    onPress,
    color = '#007AFF',
  }: {
    title: string;
    description: string;
    onPress: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      style={[styles.actionCard, {borderLeftColor: color}]}
      onPress={onPress}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestión de Usuarios</Text>
        <Text style={styles.headerSubtitle}>
          Administra usuarios, roles y permisos
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones Principales</Text>
        
        <ActionCard
          title="Crear Usuario"
          description="Agregar un nuevo usuario al sistema"
          onPress={handleCreateUser}
          color="#28a745"
        />

        <ActionCard
          title="Gestionar Roles"
          description="Configurar roles y permisos de usuarios"
          onPress={handleManageRoles}
          color="#ffc107"
        />

        <ActionCard
          title="Ver Reportes"
          description="Generar reportes de actividad de usuarios"
          onPress={handleViewReports}
          color="#17a2b8"
        />

        <ActionCard
          title="Exportar Datos"
          description="Exportar información de usuarios"
          onPress={handleExportData}
          color="#6f42c1"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Usuarios Totales</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Usuarios Activos</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>Roles Disponibles</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e0e0',
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
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
});

export default UserManagementScreen; 