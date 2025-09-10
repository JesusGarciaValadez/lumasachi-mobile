import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Chip, Text } from 'react-native-paper';
import { useTranslationSafe } from '../../hooks/useTranslationSafe';
import { formatDateLocal } from '../../utils/datetime';
import type { EmployeeListItem } from '../../services/userService';

interface Props {
  item: EmployeeListItem;
}

const UserCard: React.FC<Props> = React.memo(({ item }) => {
  const { t } = useTranslationSafe();

  return (
    <Card style={styles.card} accessible accessibilityLabel={`${item.fullName}, ${item.email}, ${item.role}`}>
      <Card.Title
        title={item.fullName}
        subtitle={item.email}
        style={styles.titleRow}
        right={() => (
          <View style={styles.badges}>
            <Chip
              compact
              icon={item.isEmailVerified ? 'check-circle' : 'alert-circle'}
              style={[styles.chip, item.isEmailVerified ? styles.chipOk : styles.chipWarn]}
              textStyle={styles.chipText}
            >
              {item.isEmailVerified ? (t('users.verified') as string || 'Verificado') : (t('users.unverified') as string || 'No verificado')}
            </Chip>
          </View>
        )}
      />
      <Card.Content>
        <View style={styles.row}><Text variant="labelSmall" style={styles.label}>{t('users.role') as string || 'Rol'}: </Text><Text variant="bodySmall" style={styles.value}>{item.role}</Text></View>
        <View style={styles.row}><Text variant="labelSmall" style={styles.label}>{t('users.type') as string || 'Tipo'}: </Text><Text variant="bodySmall" style={styles.value}>{item.type}</Text></View>
        <View style={styles.row}><Text variant="labelSmall" style={styles.label}>{t('users.active') as string || 'Activo'}: </Text><Text variant="bodySmall" style={styles.value}>{item.isActive ? (t('users.active') as string || 'Activo') : (t('users.inactive') as string || 'Inactivo')}</Text></View>
        {!!item.phone && (
          <View style={styles.row}><Text variant="labelSmall" style={styles.label}>{t('users.phone') as string || 'Teléfono'}: </Text><Text variant="bodySmall" style={styles.value}>{item.phone}</Text></View>
        )}
        {!!item.createdAt && (
          <View style={styles.row}><Text variant="labelSmall" style={styles.label}>{t('users.createdAt') as string || 'Creado'}: </Text><Text variant="bodySmall" style={styles.value}>{formatDateLocal(item.createdAt)}</Text></View>
        )}
        {!!item.notes && (
          <Text variant="bodySmall" style={styles.notes} numberOfLines={3}>{item.notes}</Text>
        )}
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    margin: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  titleRow: {
    paddingVertical: 6,
    paddingRight: 8,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingRight: 4,
    paddingLeft: 8,
  },
  chip: {
    height: 28,
    alignSelf: 'center',
  },
  chipText: {
    lineHeight: 16,
  },
  chipOk: { backgroundColor: '#E8F5E8' },
  chipWarn: { backgroundColor: '#FFEBEE' },
  row: { flexDirection: 'row', marginTop: 2, alignItems: 'center', flexWrap: 'wrap' },
  label: { color: '#666' },
  value: { color: '#333' },
  notes: { marginTop: 8, color: '#666' },
});

export default UserCard;
