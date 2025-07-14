import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useRoute, RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../types/navigation';
import {ActionCard} from '../components';

type UserManagementRouteProp = RouteProp<RootStackParamList, 'UserManagement'>;

const UserManagementScreen: React.FC = () => {
  const {t} = useTranslation();
  const route = useRoute<UserManagementRouteProp>();
  const {userId} = route.params || {};

  // TODO: Implement action selection state when adding detailed views
  // const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const handleCreateUser = () => {
    Alert.alert(t('userManagement.createUser'), t('userManagement.createUserDesc'));
  };

  const handleManageRoles = () => {
    Alert.alert(t('userManagement.manageRoles'), t('userManagement.manageRolesDesc'));
  };

  const handleViewReports = () => {
    Alert.alert(t('userManagement.viewReports'), t('userManagement.viewReportsDesc'));
  };

  const handleExportData = () => {
    Alert.alert(t('userManagement.exportData'), t('userManagement.exportDataDesc'));
  };



  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {userId ? t('userManagement.editUser') : t('userManagement.title')}
        </Text>
        <Text style={styles.headerSubtitle}>
          {userId 
            ? t('userManagement.editUserSubtitle', {userId}) 
            : t('userManagement.subtitle')
          }
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('userManagement.mainActions')}</Text>
        
        <ActionCard
          title={t('userManagement.createUser')}
          description={t('userManagement.createUserDesc')}
          onPress={handleCreateUser}
          color="#28a745"
        />

        <ActionCard
          title={t('userManagement.manageRoles')}
          description={t('userManagement.manageRolesDesc')}
          onPress={handleManageRoles}
          color="#ffc107"
        />

        <ActionCard
          title={t('userManagement.viewReports')}
          description={t('userManagement.viewReportsDesc')}
          onPress={handleViewReports}
          color="#17a2b8"
        />

        <ActionCard
          title={t('userManagement.exportData')}
          description={t('userManagement.exportDataDesc')}
          onPress={handleExportData}
          color="#6f42c1"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('userManagement.statistics')}</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t('users.totalUsers')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>{t('users.activeUsers')}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>4</Text>
            <Text style={styles.statLabel}>{t('users.availableRoles')}</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default UserManagementScreen; 