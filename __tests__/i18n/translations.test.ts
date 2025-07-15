import i18n from '../../src/i18n';
import es from '../../src/i18n/locales/es.json';
import en from '../../src/i18n/locales/en.json';

describe('Translations Test', () => {
  beforeAll(async () => {
    await i18n.init();
  });

  describe('Required translation keys exist', () => {
    const requiredKeys = [
      'common.name',
      'common.email', 
      'common.phone',
      'common.company',
      'common.as',
      'orders.customerType',
      'orders.customerNotes',
      'userManagement.export.exportOption'
    ];

    test.each(requiredKeys)('Spanish translation exists for %s', (key) => {
      const keys = key.split('.');
      let current: any = es;
      
      for (const k of keys) {
        expect(current).toHaveProperty(k);
        current = current[k];
      }
      
      expect(typeof current).toBe('string');
      expect(current).toBeTruthy();
    });

    test.each(requiredKeys)('English translation exists for %s', (key) => {
      const keys = key.split('.');
      let current: any = en;
      
      for (const k of keys) {
        expect(current).toHaveProperty(k);
        current = current[k];
      }
      
      expect(typeof current).toBe('string');
      expect(current).toBeTruthy();
    });
  });

  describe('Translation consistency', () => {
    test('Email translations are consistent in Spanish', () => {
      expect(es.auth.email).toBe('Email');
      expect(es.profile.email).toBe('Email');
      expect(es.common.email).toBe('Email');
      expect(es.userManagement.createUserForm.email).toBe('Email');
    });

    test('User translations are consistent in Spanish', () => {
      expect(es.home.user).toBe('Usuario');
      expect(es.userManagement.reports.filters.user).toBe('Usuario');
    });

    test('Order translations are consistent in Spanish', () => {
      expect(es.orders.order).toBe('Orden');
      expect(es.navigation.orders.title).toBe('Órdenes');
    });
  });

  describe('i18n functionality', () => {
    test('i18n can switch languages', async () => {
      await i18n.changeLanguage('es');
      expect(i18n.language).toBe('es');
      expect(i18n.t('common.save')).toBe('Guardar');
      
      await i18n.changeLanguage('en');
      expect(i18n.language).toBe('en');
      expect(i18n.t('common.save')).toBe('Save');
    });

    test('New translations work in Spanish', async () => {
      await i18n.changeLanguage('es');
      
      expect(i18n.t('common.name')).toBe('Nombre');
      expect(i18n.t('common.email')).toBe('Email');
      expect(i18n.t('common.phone')).toBe('Teléfono');
      expect(i18n.t('common.company')).toBe('Empresa');
      expect(i18n.t('common.as')).toBe('como');
      expect(i18n.t('orders.customerType')).toBe('Tipo de Cliente');
      expect(i18n.t('orders.customerNotes')).toBe('Notas del Cliente');
      expect(i18n.t('userManagement.export.exportOption')).toBe('Opción de exportación');
    });

    test('New translations work in English', async () => {
      await i18n.changeLanguage('en');
      
      expect(i18n.t('common.name')).toBe('Name');
      expect(i18n.t('common.email')).toBe('Email');
      expect(i18n.t('common.phone')).toBe('Phone');
      expect(i18n.t('common.company')).toBe('Company');
      expect(i18n.t('common.as')).toBe('as');
      expect(i18n.t('orders.customerType')).toBe('Customer Type');
      expect(i18n.t('orders.customerNotes')).toBe('Customer Notes');
      expect(i18n.t('userManagement.export.exportOption')).toBe('Export option');
    });
  });
}); 