import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {RootStackParamList} from '../types/navigation';

type ViewReportsScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ViewReports'
>;

interface ReportItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'user' | 'order' | 'system';
}

const ViewReportsScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation<ViewReportsScreenNavigationProp>();
  
  const [selectedType, setSelectedType] = useState<'all' | 'user' | 'order' | 'system'>('all');
  
  const reports: ReportItem[] = [
    {
      id: '1',
      title: t('userManagement.reports.userActivity'),
      description: t('userManagement.reports.descriptions.userActivity'),
      date: '2024-01-15',
      type: 'user',
    },
    {
      id: '2',
      title: t('userManagement.reports.orderProcessing'),
      description: t('userManagement.reports.descriptions.orderProcessing'),
      date: '2024-01-14',
      type: 'order',
    },
    {
      id: '3',
      title: t('userManagement.reports.systemPerformance'),
      description: t('userManagement.reports.descriptions.systemPerformance'),
      date: '2024-01-13',
      type: 'system',
    },
    {
      id: '4',
      title: t('userManagement.reports.userRegistration'),
      description: t('userManagement.reports.descriptions.userRegistration'),
      date: '2024-01-12',
      type: 'user',
    },
  ];

  const filteredReports = reports.filter(report => 
    selectedType === 'all' || report.type === selectedType
  );

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'user': return '#17a2b8';
      case 'order': return '#28a745';
      case 'system': return '#6f42c1';
      default: return '#007AFF';
    }
  };

  const renderReportItem = ({item}: {item: ReportItem}) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <Text style={styles.reportTitle}>{item.title}</Text>
        <View style={[styles.typeTag, {backgroundColor: getReportTypeColor(item.type)}]}>
          <Text style={styles.typeText}>{item.type.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.reportDescription}>{item.description}</Text>
      <Text style={styles.reportDate}>{t('userManagement.reports.generated')} {item.date}</Text>
      <TouchableOpacity style={styles.viewButton}>
        <Text style={styles.viewButtonText}>{t('userManagement.reports.viewReport')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('userManagement.viewReports')}</Text>
        <Text style={styles.headerSubtitle}>{t('userManagement.viewReportsDesc')}</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['all', 'user', 'order', 'system'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterButton,
                selectedType === type && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedType(type as any)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedType === type && styles.filterButtonTextActive,
                ]}
              >
                {t(`userManagement.reports.filters.${type}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredReports}
        renderItem={renderReportItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.reportsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  reportsList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  reportDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 10,
  },
  reportDate: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 15,
  },
  viewButton: {
    backgroundColor: '#17a2b8',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ViewReportsScreen; 