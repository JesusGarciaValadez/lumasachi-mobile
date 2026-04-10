import React, {useState, useEffect, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {Picker} from '@react-native-picker/picker';
import {useNavigation} from '@react-navigation/native';
import {useTranslationSafe} from '@hooks/useTranslationSafe';
import {User, UserRole, FileSelection, MultipleFileUploadResult, EngineCatalog, CatalogComponent} from '@/types';
import {FileUploader} from '../components/ui';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '@hooks/useErrorHandler';
import {errorService} from '@services/errorService';
import {httpClient} from '@utils/httpClient';
import {orderService} from '@services/orderService';
import {useOrders} from '@hooks/useOrders';
import Toast from 'react-native-toast-message';
import {ProgressBar} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import i18n from '../i18n';
import {API_ENDPOINTS} from '@/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5;

interface BasicFormData {
  customer_id: string;
  title: string;
  description: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  estimated_completion: string;
  notes: string;
  assigned_to: string;
}

interface MotorFormData {
  brand: string;
  liters: string;
  year: string;
  model: string;
  cylinder_count: string;
}

/** item_type → selected component keys */
type SelectedComponents = Record<string, string[]>;

interface FormErrors {
  [key: string]: string | undefined;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CreateOrderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const {setOrders} = useOrders();
  const isFocused = useIsFocused();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);

  // Loading / submitting
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1 — Basic Info
  const initialBasicForm: BasicFormData = {
    customer_id: '',
    title: '',
    description: '',
    priority: 'Normal',
    estimated_completion: '',
    notes: '',
    assigned_to: '',
  };
  const [basicForm, setBasicForm] = useState<BasicFormData>(initialBasicForm);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedCustomerName, setSelectedCustomerName] = useState('');

  // Step 2 — Motor Info
  const initialMotorForm: MotorFormData = {brand: '', liters: '', year: '', model: '', cylinder_count: ''};
  const [motorForm, setMotorForm] = useState<MotorFormData>(initialMotorForm);

  // Step 3 — Items Received
  const [catalog, setCatalog] = useState<EngineCatalog | null>(null);
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<SelectedComponents>({});

  // Step 4 — Attachments
  const [selectedFiles, setSelectedFiles] = useState<FileSelection[]>([]);

  // Reference data
  const [customers, setCustomers] = useState<User[]>([]);
  const [customerUuidById, setCustomerUuidById] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<User[]>([]);

  // Modals
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showEstimatedDatePicker, setShowEstimatedDatePicker] = useState(false);

  // Upload progress
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Date picker states
  const [estimatedYear, setEstimatedYear] = useState('');
  const [estimatedMonth, setEstimatedMonth] = useState('');
  const [estimatedDay, setEstimatedDay] = useState('');
  const [estimatedHour, setEstimatedHour] = useState('');
  const [estimatedMinute, setEstimatedMinute] = useState('');

  // -------------------------------------------------------------------------
  // Load initial data
  // -------------------------------------------------------------------------

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        clearError();

        // Customers
        const customersResp = await httpClient.get('/v1/users/customers');
        const rawCustomers = Array.isArray(customersResp.data)
          ? customersResp.data
          : (Array.isArray((customersResp.data as any)?.data) ? (customersResp.data as any).data : []);
        const uuidMap: Record<string, string> = {};
        const mappedCustomers: User[] = (rawCustomers as any[]).map((u: any) => {
          const fullName: string = (u.full_name || u.name || '').toString();
          const parts = fullName ? fullName.split(' ') : [];
          const firstName = u.first_name || u.firstName || (parts[0] || '');
          const lastName = u.last_name || u.lastName || (parts.slice(1).join(' ') || '');
          const dbId = String(u.id ?? '');
          if (dbId && u.uuid) uuidMap[dbId] = String(u.uuid);
          return {
            id: dbId,
            firstName: String(firstName),
            lastName: String(lastName),
            email: String(u.email || ''),
            role: UserRole.CUSTOMER,
            company: (u.company?.name || u.company || '') as string,
            phoneNumber: String(u.phone_number || u.phone || ''),
            isActive: Boolean(u.is_active ?? u.active ?? true),
            languagePreference: 'es',
            customerType: (u.type || '').toString().toLowerCase() === 'corporate' ? 'corporate' : 'individual',
            isCustomer: true,
            isEmployee: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as User;
        });
        setCustomers(mappedCustomers);
        setCustomerUuidById(uuidMap);

        // Employees
        const employeesResp = await httpClient.get('/v1/users/employees');
        const rawEmployees = Array.isArray(employeesResp.data)
          ? employeesResp.data
          : (Array.isArray((employeesResp.data as any)?.data) ? (employeesResp.data as any).data : []);
        const mappedEmployees: User[] = (rawEmployees as any[]).map((u: any) => {
          const fullName: string = (u.full_name || u.name || '').toString();
          const parts = fullName ? fullName.split(' ') : [];
          const firstName = u.first_name || u.firstName || (parts[0] || '');
          const lastName = u.last_name || u.lastName || (parts.slice(1).join(' ') || '');
          return {
            id: String(u.id ?? ''),
            firstName: String(firstName),
            lastName: String(lastName),
            email: String(u.email || ''),
            role: UserRole.EMPLOYEE,
            company: (u.company?.name || u.company || '') as string,
            phoneNumber: String(u.phone_number || u.phone || ''),
            isActive: Boolean(u.is_active ?? u.active ?? true),
            languagePreference: 'es',
            isCustomer: false,
            isEmployee: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as User;
        });
        setEmployees(mappedEmployees);

        // Catalog (fetch full)
        const catalogData = await orderService.fetchCatalog();
        setCatalog(catalogData);
      } catch (err) {
        await errorService.logError(err as Error, {component: 'CreateOrderScreen', operation: 'loadInitialData'});
        handleError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [handleError, clearError]);

  // -------------------------------------------------------------------------
  // Handlers — Basic form
  // -------------------------------------------------------------------------

  const handleBasicChange = (field: keyof BasicFormData, value: string) => {
    setBasicForm(prev => ({...prev, [field]: value}));
    if (formErrors[field]) setFormErrors(prev => ({...prev, [field]: undefined}));
  };

  const handleCustomerSelect = (customer: User) => {
    handleBasicChange('customer_id', String(customer.id));
    setSelectedCustomerName(`${customer.firstName} ${customer.lastName}`);
    setShowCustomerModal(false);
  };

  const handleEmployeeSelect = (employee: User) => {
    handleBasicChange('assigned_to', employee.id);
    setShowEmployeeModal(false);
  };

  // -------------------------------------------------------------------------
  // Handlers — Motor form
  // -------------------------------------------------------------------------

  const handleMotorChange = (field: keyof MotorFormData, value: string) => {
    setMotorForm(prev => ({...prev, [field]: value}));
  };

  // -------------------------------------------------------------------------
  // Handlers — Items / Components
  // -------------------------------------------------------------------------

  const toggleItemType = (itemType: string) => {
    setSelectedItemTypes(prev => {
      if (prev.includes(itemType)) {
        // Remove it and its components
        setSelectedComponents(sc => {
          const copy = {...sc};
          delete copy[itemType];
          return copy;
        });
        return prev.filter(t => t !== itemType);
      }
      return [...prev, itemType];
    });
    if (formErrors.items) setFormErrors(prev => ({...prev, items: undefined}));
  };

  const toggleComponent = (itemType: string, componentKey: string) => {
    setSelectedComponents(prev => {
      const current = prev[itemType] || [];
      const next = current.includes(componentKey)
        ? current.filter(k => k !== componentKey)
        : [...current, componentKey];
      return {...prev, [itemType]: next};
    });
  };

  // -------------------------------------------------------------------------
  // Attachments
  // -------------------------------------------------------------------------

  const handleFileUploadComplete = (_result: MultipleFileUploadResult) => {};
  const handleFileUploadError = (message: string) => {
    Toast.show({type: 'error', text1: t('common.error') as string, text2: message, visibilityTime: 3000});
  };

  // -------------------------------------------------------------------------
  // Date helpers (carried over)
  // -------------------------------------------------------------------------

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years: {label: string; value: string}[] = [];
    for (let year = currentYear; year <= currentYear + 5; year++) {
      years.push({label: year.toString(), value: year.toString()});
    }
    return years;
  };
  const generateMonths = () => {
    const months: {label: string; value: string}[] = [];
    const lang = i18n.language;
    for (let month = 1; month <= 12; month++) {
      const monthDate = new Date(2000, month - 1, 1);
      let monthLabel = monthDate.toLocaleString(lang, {month: 'long'});
      monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      months.push({label: monthLabel, value: month.toString().padStart(2, '0')});
    }
    return months;
  };
  const generateDays = (year: string, month: string) => {
    const days: {label: string; value: string}[] = [];
    const daysInMonth = year && month ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      days.push({label: dayStr, value: dayStr});
    }
    return days;
  };
  const generateHours = () => {
    const hours: {label: string; value: string}[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      hours.push({label: hourStr, value: hourStr});
    }
    return hours;
  };
  const generateMinutes = () => {
    const minutes: {label: string; value: string}[] = [];
    for (let minute = 0; minute < 60; minute += 15) {
      const minuteStr = minute.toString().padStart(2, '0');
      minutes.push({label: minuteStr, value: minuteStr});
    }
    return minutes;
  };
  const assembleDateFromPickers = (yr: string, mo: string, dy: string, hr: string, mi: string): string => {
    if (!yr || !mo || !dy || !hr || !mi) return '';
    try {
      return new Date(parseInt(yr), parseInt(mo) - 1, parseInt(dy), parseInt(hr), parseInt(mi)).toISOString();
    } catch {
      return '';
    }
  };
  const parseDateToPickers = (dateString: string) => {
    const fallback = () => {
      const now = new Date();
      return {
        year: now.getFullYear().toString(),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        day: now.getDate().toString().padStart(2, '0'),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: '00',
      };
    };
    if (!dateString) return fallback();
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return fallback();
      return {
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString().padStart(2, '0'),
        day: date.getDate().toString().padStart(2, '0'),
        hour: date.getHours().toString().padStart(2, '0'),
        minute: date.getMinutes().toString().padStart(2, '0'),
      };
    } catch {
      return fallback();
    }
  };
  const openEstimatedDatePicker = () => {
    const parsed = parseDateToPickers(basicForm.estimated_completion);
    setEstimatedYear(parsed.year);
    setEstimatedMonth(parsed.month);
    setEstimatedDay(parsed.day);
    setEstimatedHour(parsed.hour);
    setEstimatedMinute(parsed.minute);
    setShowEstimatedDatePicker(true);
  };
  const getEstimatedDatePreview = (): string => {
    if (!estimatedYear || !estimatedMonth || !estimatedDay || !estimatedHour || !estimatedMinute) {
      return t('orders.selectAllFields') as string;
    }
    try {
      const date = new Date(parseInt(estimatedYear), parseInt(estimatedMonth) - 1, parseInt(estimatedDay), parseInt(estimatedHour), parseInt(estimatedMinute));
      const lang = i18n.language;
      const dayFormatted = date.getDate().toString().padStart(2, '0');
      let monthName = date.toLocaleString(lang, {month: 'long'});
      monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const yearFormatted = date.getFullYear();
      const finalDate = lang === 'es' ? `${dayFormatted} de ${monthName} de ${yearFormatted}` : `${monthName} ${dayFormatted}, ${yearFormatted}`;
      const time = date.toLocaleTimeString(lang, {hour: '2-digit', minute: '2-digit', hour12: true});
      return `${finalDate}, ${time}`;
    } catch {
      return t('orders.invalidDate') as string;
    }
  };

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  const validPriorities = useMemo(() => ['Low', 'Normal', 'High', 'Urgent'] as const, []);

  const validateStep = (step: number): boolean => {
    const errors: FormErrors = {};
    let ok = true;

    if (step === 1) {
      if (!basicForm.customer_id.trim()) {errors.customer_id = t('createOrder.errors.customerRequired') as string; ok = false;}
      if (!basicForm.title.trim()) {errors.title = t('createOrder.errors.titleRequired') as string; ok = false;}
      if (basicForm.title.length > 255) {errors.title = t('editOrder.errors.titleTooLong') as string; ok = false;}
      if (!basicForm.description.trim()) {errors.description = t('createOrder.errors.descriptionRequired') as string; ok = false;}
      if (!basicForm.priority || !validPriorities.includes(basicForm.priority as any)) {errors.priority = t('createOrder.errors.priorityRequired') as string; ok = false;}
      if (!basicForm.assigned_to.trim()) {errors.assigned_to = t('createOrder.errors.assignedToRequired') as string; ok = false;}
      if (basicForm.estimated_completion) {
        try {
          const d = new Date(basicForm.estimated_completion);
          if (isNaN(d.getTime())) {errors.estimated_completion = t('createOrder.errors.estimatedDateInvalid') as string; ok = false;}
          const today = new Date(); today.setHours(0,0,0,0);
          if (d <= today) {errors.estimated_completion = t('createOrder.errors.estimatedDateMustBeFuture') as string; ok = false;}
        } catch {errors.estimated_completion = t('createOrder.errors.estimatedDateInvalid') as string; ok = false;}
      }
    }

    if (step === 3) {
      if (selectedItemTypes.length === 0) {errors.items = t('createOrder.items.itemsRequired') as string; ok = false;}
    }

    // Steps 2, 4 have no required fields
    setFormErrors(errors);
    return ok;
  };

  // -------------------------------------------------------------------------
  // Navigation
  // -------------------------------------------------------------------------

  const goNext = () => {
    if (!validateStep(currentStep)) return;
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
  };

  const goBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  const handleSubmit = async () => {
    // Run validation on steps that have required fields
    if (!validateStep(1) || !validateStep(3)) {
      Toast.show({type: 'error', text1: t('common.error') as string, text2: t('createOrder.errors.missingFields') as string, visibilityTime: 3000});
      return;
    }
    try {
      setIsSubmitting(true);
      clearError();

      const hasMotor = Object.values(motorForm).some(v => v.trim() !== '');
      const payload: any = {
        customer_id: parseInt(basicForm.customer_id, 10),
        title: basicForm.title,
        description: basicForm.description,
        priority: basicForm.priority,
        assigned_to: parseInt(basicForm.assigned_to, 10),
        items: selectedItemTypes.map(itemType => ({
          item_type: itemType,
          components: selectedComponents[itemType] || [],
        })),
      };
      if (basicForm.estimated_completion) {
        try {
          const d = new Date(basicForm.estimated_completion);
          if (!isNaN(d.getTime())) payload.estimated_completion = d.toISOString();
        } catch {}
      }
      if (basicForm.notes.trim()) payload.notes = basicForm.notes;
      if (hasMotor) {
        payload.motor_info = {
          brand: motorForm.brand || null,
          liters: motorForm.liters || null,
          year: motorForm.year || null,
          model: motorForm.model || null,
          cylinder_count: motorForm.cylinder_count || null,
          down_payment: 0,
        };
      }

      const resp = await httpClient.post(API_ENDPOINTS.ORDERS.CREATE, payload);

      if (!(resp.status >= 200 && resp.status < 300)) {
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      const orderUuid: string = String(
        resp.data?.order?.uuid || resp.data?.data?.uuid || resp.data?.uuid || resp.data?.order?.id || resp.data?.id,
      );

      // Upload attachments
      if (selectedFiles.length > 0 && orderUuid) {
        setIsUploadingFiles(true);
        setTotalFiles(selectedFiles.length);
        setCurrentFileIndex(0);
        setUploadProgressPercent(0);
        try {
          const fd = new FormData();
          selectedFiles.forEach(file => {
            fd.append('files[]', {uri: file.uri, name: file.name, type: file.type} as any);
          });
          await httpClient.post(`/v1/orders/${orderUuid}/attachments`, fd, {
            timeout: 120000,
            headers: {'Content-Type': 'multipart/form-data'},
            onUploadProgress: (evt: any) => {
              let pct = evt?.total ? Math.round((evt.loaded * 100) / evt.total) : 0;
              pct = Math.min(100, Math.max(0, pct));
              setUploadProgressPercent(pct);
              setCurrentFileIndex(Math.max(1, Math.min(selectedFiles.length, Math.ceil((pct / 100) * selectedFiles.length))));
            },
          });
        } catch {
          // Fallback: single file uploads
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const singleFd = new FormData();
            singleFd.append('file', {uri: file.uri, name: file.name, type: file.type} as any);
            setUploadProgressPercent(Math.round((i / selectedFiles.length) * 100));
            await httpClient.post(`/v1/orders/${orderUuid}/attachments`, singleFd, {
              timeout: 60000,
              headers: {'Content-Type': 'multipart/form-data'},
              onUploadProgress: (evt: any) => {
                let combined = Math.round((i / selectedFiles.length) * 100);
                if (evt?.total) combined = Math.round(((i + evt.loaded / evt.total) / selectedFiles.length) * 100);
                setUploadProgressPercent(Math.min(100, combined));
                setCurrentFileIndex(i + 1);
              },
            });
          }
        } finally {
          setIsUploadingFiles(false);
          setUploadProgressPercent(0);
          setCurrentFileIndex(0);
          setTotalFiles(0);
        }
      }

      Toast.show({
        type: 'success',
        text1: t('common.success') as string,
        text2: (t('createOrder.success.createSuccess') as string) || 'Orden creada correctamente',
        visibilityTime: 3000,
        onHide: () => {
          setOrders([]);
          navigation.navigate('Main', {screen: 'Orders'} as any);
        },
      });
    } catch (err: any) {
      await errorService.logError(err as Error, {component: 'CreateOrderScreen', operation: 'createOrder'});
      const message = (err?.response?.data?.message as string) || err?.message || (t('navigation.errors.serverError') as string);
      Toast.show({type: 'error', text1: t('common.error') as string, text2: message, visibilityTime: 3500});
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      t('common.reset') as string,
      t('editOrder.confirmReset') as string,
      [
        {text: t('common.cancel') as string, style: 'cancel'},
        {
          text: t('common.reset') as string,
          style: 'destructive',
          onPress: () => {
            setBasicForm(initialBasicForm);
            setMotorForm(initialMotorForm);
            setSelectedItemTypes([]);
            setSelectedComponents({});
            setSelectedFiles([]);
            setFormErrors({});
            setSelectedCustomerName('');
            setCurrentStep(1);
          },
        },
      ],
    );
  };

  // -------------------------------------------------------------------------
  // Derived
  // -------------------------------------------------------------------------

  const priorities: Array<{key: string; label: string; value: 'Low' | 'Normal' | 'High' | 'Urgent'}> = [
    {key: 'low', label: t('orders.priorities.low') as string, value: 'Low'},
    {key: 'normal', label: t('orders.priorities.normal') as string, value: 'Normal'},
    {key: 'high', label: t('orders.priorities.high') as string, value: 'High'},
    {key: 'urgent', label: t('orders.priorities.urgent') as string, value: 'Urgent'},
  ];

  const stepLabels = [
    t('createOrder.wizard.step1') as string,
    t('createOrder.wizard.step2') as string,
    t('createOrder.wizard.step3') as string,
    t('createOrder.wizard.step4') as string,
    t('createOrder.wizard.step5') as string,
  ];

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderStepIndicator = () => (
    <View style={styles.stepperContainer}>
      {stepLabels.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;
        return (
          <View key={stepNum} style={styles.stepItem}>
            <View style={[styles.stepCircle, isActive && styles.stepCircleActive, isCompleted && styles.stepCircleCompleted]}>
              <Text style={[styles.stepCircleText, (isActive || isCompleted) && styles.stepCircleTextActive]}>
                {isCompleted ? '✓' : stepNum}
              </Text>
            </View>
            <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]} numberOfLines={1}>{label}</Text>
          </View>
        );
      })}
    </View>
  );

  // Step 1 — Basic Info
  const renderStep1 = () => (
    <View style={styles.card}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('orders.orderTitle') as string}</Text>
        <TextInput
          style={[styles.input, formErrors.title && styles.inputError]}
          value={basicForm.title}
          onChangeText={v => handleBasicChange('title', v)}
          placeholder={t('createOrder.orderTitle') as string}
          editable={!isSubmitting}
        />
        {formErrors.title && <Text style={styles.errorText}>{formErrors.title}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('orders.description') as string}</Text>
        <TextInput
          style={[styles.input, styles.textArea, formErrors.description && styles.inputError]}
          value={basicForm.description}
          onChangeText={v => handleBasicChange('description', v)}
          placeholder={t('createOrder.orderDescription') as string}
          multiline numberOfLines={4}
          editable={!isSubmitting}
        />
        {formErrors.description && <Text style={styles.errorText}>{formErrors.description}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('orders.customer') as string}</Text>
        <TouchableOpacity
          style={[styles.selector, formErrors.customer_id && styles.inputError]}
          onPress={() => setShowCustomerModal(true)}>
          <Text style={[styles.selectorText, !basicForm.customer_id && styles.placeholder]}>
            {selectedCustomerName || (t('createOrder.selectCustomer') as string)}
          </Text>
        </TouchableOpacity>
        {formErrors.customer_id && <Text style={styles.errorText}>{formErrors.customer_id}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('orders.assignedTo') as string}</Text>
        <TouchableOpacity
          style={[styles.selector, formErrors.assigned_to && styles.inputError]}
          onPress={() => setShowEmployeeModal(true)}>
          <Text style={[styles.selectorText, !basicForm.assigned_to && styles.placeholder]}>
            {basicForm.assigned_to
              ? `${employees.find(e => e.id === basicForm.assigned_to)?.firstName ?? ''} ${employees.find(e => e.id === basicForm.assigned_to)?.lastName ?? ''}`
              : (t('createOrder.selectEmployee') as string)}
          </Text>
        </TouchableOpacity>
        {formErrors.assigned_to && <Text style={styles.errorText}>{formErrors.assigned_to}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('orders.estimatedCompletion') as string}</Text>
        <TouchableOpacity
          style={[styles.datePickerButton, formErrors.estimated_completion && styles.inputError]}
          onPress={openEstimatedDatePicker}>
          <Text style={[styles.datePickerText, !basicForm.estimated_completion && styles.placeholder]}>
            {basicForm.estimated_completion ? getEstimatedDatePreview() : (t('orders.selectDate') as string)}
          </Text>
        </TouchableOpacity>
        {formErrors.estimated_completion && <Text style={styles.errorText}>{formErrors.estimated_completion}</Text>}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('orders.notes') as string}</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={basicForm.notes}
          onChangeText={v => handleBasicChange('notes', v)}
          placeholder={t('orders.notesPlaceholder') as string}
          multiline numberOfLines={3}
          editable={!isSubmitting}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>{t('orders.priority') as string}</Text>
        <View style={styles.priorityContainer}>
          {priorities.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.priorityButton, basicForm.priority === p.value && styles.priorityButtonSelected]}
              onPress={() => handleBasicChange('priority', p.value)}>
              <Text style={[styles.priorityButtonText, basicForm.priority === p.value && styles.priorityButtonTextSelected]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {formErrors.priority && <Text style={styles.errorText}>{formErrors.priority}</Text>}
      </View>
    </View>
  );

  // Step 2 — Motor Info
  const renderStep2 = () => {
    const fields: {key: keyof MotorFormData; label: string; placeholder: string}[] = [
      {key: 'brand', label: t('createOrder.motor.brand') as string, placeholder: t('createOrder.motor.brandPlaceholder') as string},
      {key: 'model', label: t('createOrder.motor.model') as string, placeholder: t('createOrder.motor.modelPlaceholder') as string},
      {key: 'year', label: t('createOrder.motor.year') as string, placeholder: t('createOrder.motor.yearPlaceholder') as string},
      {key: 'liters', label: t('createOrder.motor.liters') as string, placeholder: t('createOrder.motor.litersPlaceholder') as string},
      {key: 'cylinder_count', label: t('createOrder.motor.cylinderCount') as string, placeholder: t('createOrder.motor.cylinderCountPlaceholder') as string},
    ];
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('createOrder.motor.title') as string}</Text>
        {fields.map(f => (
          <View key={f.key} style={styles.inputGroup}>
            <Text style={styles.label}>{f.label}</Text>
            <TextInput
              style={styles.input}
              value={motorForm[f.key]}
              onChangeText={v => handleMotorChange(f.key, v)}
              placeholder={f.placeholder}
              editable={!isSubmitting}
              keyboardType={f.key === 'year' || f.key === 'cylinder_count' ? 'number-pad' : 'default'}
            />
          </View>
        ))}
      </View>
    );
  };

  // Step 3 — Items Received
  const renderStep3 = () => {
    const itemTypes = catalog?.item_types ?? [];
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('createOrder.items.title') as string}</Text>
        <Text style={styles.sectionDescription}>{t('createOrder.items.description') as string}</Text>

        {/* Item type chips */}
        <View style={styles.chipContainer}>
          {itemTypes.map(it => {
            const selected = selectedItemTypes.includes(it.key);
            return (
              <TouchableOpacity
                key={it.key}
                style={[styles.chip, selected && styles.chipSelected]}
                onPress={() => toggleItemType(it.key)}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{it.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {formErrors.items && <Text style={styles.errorText}>{formErrors.items}</Text>}

        {/* Components per selected item type */}
        {selectedItemTypes.length === 0 && (
          <Text style={styles.emptyText}>{t('createOrder.items.noItemsSelected') as string}</Text>
        )}
        {selectedItemTypes.map(itemType => {
          const components: CatalogComponent[] = catalog?.components_by_type?.[itemType] ?? [];
          const selected = selectedComponents[itemType] || [];
          const typeLabel = catalog?.item_types.find(it => it.key === itemType)?.label ?? itemType;
          return (
            <View key={itemType} style={styles.componentSection}>
              <Text style={styles.componentSectionTitle}>{typeLabel} — {t('createOrder.items.components') as string}</Text>
              {components.map(comp => {
                const isChecked = selected.includes(comp.key);
                return (
                  <TouchableOpacity
                    key={comp.key}
                    style={styles.checkboxRow}
                    onPress={() => toggleComponent(itemType, comp.key)}>
                    <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                      {isChecked && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{comp.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </View>
    );
  };

  // Step 4 — Attachments
  const renderStep4 = () => (
    <View>
      <Text style={styles.sectionDescription}>{t('createOrder.attachmentsDescription') as string}</Text>
      <FileUploader
        showUploadButton={false}
        allowMultiple={true}
        onFilesChanged={setSelectedFiles}
        onUploadComplete={handleFileUploadComplete}
        onUploadError={handleFileUploadError}
        maxFiles={10}
        isScreenFocused={isFocused}
        allowedFileTypes={[
          'image/jpeg','image/png','image/gif','image/heic','image/webp',
          'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain',
        ]}
      />
    </View>
  );

  // Step 5 — Review
  const renderStep5 = () => {
    const assignedEmployee = employees.find(e => e.id === basicForm.assigned_to);
    const hasMotor = Object.values(motorForm).some(v => v.trim() !== '');
    return (
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('createOrder.review.title') as string}</Text>

        {/* Basic */}
        <Text style={styles.reviewHeading}>{t('createOrder.review.basicInfo') as string}</Text>
        <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('orders.orderTitle') as string}:</Text> {basicForm.title}</Text>
        <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('orders.description') as string}:</Text> {basicForm.description}</Text>
        <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('orders.customer') as string}:</Text> {selectedCustomerName}</Text>
        <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('orders.assignedTo') as string}:</Text> {assignedEmployee ? `${assignedEmployee.firstName} ${assignedEmployee.lastName}` : '-'}</Text>
        <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('orders.priority') as string}:</Text> {basicForm.priority}</Text>
        {basicForm.estimated_completion && <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('orders.estimatedCompletion') as string}:</Text> {getEstimatedDatePreview()}</Text>}
        {basicForm.notes.trim() !== '' && <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('orders.notes') as string}:</Text> {basicForm.notes}</Text>}

        {/* Motor */}
        <Text style={styles.reviewHeading}>{t('createOrder.review.motorInfo') as string}</Text>
        {hasMotor ? (
          <>
            {motorForm.brand ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('createOrder.motor.brand') as string}:</Text> {motorForm.brand}</Text> : null}
            {motorForm.model ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('createOrder.motor.model') as string}:</Text> {motorForm.model}</Text> : null}
            {motorForm.year ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('createOrder.motor.year') as string}:</Text> {motorForm.year}</Text> : null}
            {motorForm.liters ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('createOrder.motor.liters') as string}:</Text> {motorForm.liters}</Text> : null}
            {motorForm.cylinder_count ? <Text style={styles.reviewRow}><Text style={styles.reviewLabel}>{t('createOrder.motor.cylinderCount') as string}:</Text> {motorForm.cylinder_count}</Text> : null}
          </>
        ) : (
          <Text style={styles.reviewMuted}>{t('createOrder.review.noMotorInfo') as string}</Text>
        )}

        {/* Items */}
        <Text style={styles.reviewHeading}>{t('createOrder.review.itemsReceived') as string}</Text>
        {selectedItemTypes.map(itemType => {
          const typeLabel = catalog?.item_types.find(it => it.key === itemType)?.label ?? itemType;
          const comps = selectedComponents[itemType] || [];
          return (
            <View key={itemType} style={styles.reviewItemBlock}>
              <Text style={styles.reviewItemType}>{typeLabel}</Text>
              {comps.length > 0 ? (
                <Text style={styles.reviewMuted}>
                  {comps.length} {comps.length === 1 ? t('createOrder.review.component') as string : t('createOrder.review.components') as string}
                </Text>
              ) : (
                <Text style={styles.reviewMuted}>—</Text>
              )}
            </View>
          );
        })}

        {/* Attachments */}
        <Text style={styles.reviewHeading}>{t('createOrder.review.attachments') as string}</Text>
        <Text style={styles.reviewRow}>
          {selectedFiles.length > 0
            ? `${selectedFiles.length} ${selectedFiles.length === 1 ? t('createOrder.review.file') as string : t('createOrder.review.files') as string}`
            : t('createOrder.review.noAttachments') as string}
        </Text>
      </View>
    );
  };

  // -------------------------------------------------------------------------
  // Main render
  // -------------------------------------------------------------------------

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <ErrorMessage error={error} visible={hasError} onRetry={clearError} style={styles.errorMessage} />

        {renderStepIndicator()}

        <View style={styles.section}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </View>

        {/* Navigation buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 1 ? (
            <TouchableOpacity style={styles.backButton} onPress={goBack} disabled={isSubmitting}>
              <Text style={styles.backButtonText}>{t('createOrder.wizard.back') as string}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.resetButton} onPress={handleReset} disabled={isSubmitting}>
              <Text style={styles.resetButtonText}>{t('common.reset') as string}</Text>
            </TouchableOpacity>
          )}

          {currentStep < TOTAL_STEPS ? (
            <TouchableOpacity style={styles.nextButton} onPress={goNext} disabled={isSubmitting}>
              <Text style={styles.nextButtonText}>{t('createOrder.wizard.next') as string}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.submitButtonText}>{t('createOrder.createOrderButton') as string}</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* ---- Modals ---- */}

        {/* Customer Modal */}
        <Modal visible={showCustomerModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowCustomerModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectCustomer') as string}</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)}><Text style={styles.modalCloseButton}>×</Text></TouchableOpacity>
            </View>
            <FlashList
              data={customers}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.listItem} onPress={() => handleCustomerSelect(item)}>
                  <Text style={styles.listItemTitle}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.listItemSubtitle}>{item.email} • {item.company || (t('common.noCompany') as string)}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
              estimatedItemSize={60}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </Modal>

        {/* Employee Modal */}
        <Modal visible={showEmployeeModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowEmployeeModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectEmployee') as string}</Text>
              <TouchableOpacity onPress={() => setShowEmployeeModal(false)}><Text style={styles.modalCloseButton}>{t('common.close') as string}</Text></TouchableOpacity>
            </View>
            <FlashList
              data={employees}
              renderItem={({item}) => (
                <TouchableOpacity style={styles.listItem} onPress={() => handleEmployeeSelect(item)}>
                  <Text style={styles.listItemTitle}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.listItemSubtitle}>{item.email} • {item.company || (t('common.noCompany') as string)}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.id}
              estimatedItemSize={60}
              contentContainerStyle={styles.listContent}
            />
          </View>
        </Modal>

        {/* Estimated Date Picker Modal */}
        <Modal visible={showEstimatedDatePicker} animationType="slide" transparent>
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalContainer}>
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={() => setShowEstimatedDatePicker(false)}>
                  <Text style={styles.dateModalCancel}>{t('common.cancel') as string}</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>{t('orders.estimatedCompletion') as string}</Text>
                <TouchableOpacity onPress={() => {
                  const iso = assembleDateFromPickers(estimatedYear, estimatedMonth, estimatedDay, estimatedHour, estimatedMinute);
                  if (iso) handleBasicChange('estimated_completion', iso);
                  setShowEstimatedDatePicker(false);
                }}>
                  <Text style={styles.dateModalConfirm}>{t('common.ok') as string}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.datePickerContent}>
                <View style={styles.pickerRow}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.year') as string}</Text>
                    <Picker selectedValue={estimatedYear} onValueChange={setEstimatedYear} style={styles.picker}>
                      {generateYears().map(y => <Picker.Item key={y.value} label={y.label} value={y.value} />)}
                    </Picker>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.month') as string}</Text>
                    <Picker selectedValue={estimatedMonth} onValueChange={setEstimatedMonth} style={styles.picker}>
                      {generateMonths().map(m => <Picker.Item key={m.value} label={m.label} value={m.value} />)}
                    </Picker>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.day') as string}</Text>
                    <Picker selectedValue={estimatedDay} onValueChange={setEstimatedDay} style={styles.picker}>
                      {generateDays(estimatedYear, estimatedMonth).map(d => <Picker.Item key={d.value} label={d.label} value={d.value} />)}
                    </Picker>
                  </View>
                </View>
                <View style={styles.pickerRow}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.hour') as string}</Text>
                    <Picker selectedValue={estimatedHour} onValueChange={setEstimatedHour} style={styles.picker}>
                      {generateHours().map(h => <Picker.Item key={h.value} label={h.label} value={h.value} />)}
                    </Picker>
                  </View>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.minute') as string}</Text>
                    <Picker selectedValue={estimatedMinute} onValueChange={setEstimatedMinute} style={styles.picker}>
                      {generateMinutes().map(min => <Picker.Item key={min.value} label={min.label} value={min.value} />)}
                    </Picker>
                  </View>
                </View>
                <View style={styles.datePreviewContainer}>
                  <Text style={styles.datePreviewLabel}>{t('orders.datePreview') as string}:</Text>
                  <Text style={styles.datePreviewText}>{getEstimatedDatePreview()}</Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Upload Progress Modal */}
        <Modal visible={isUploadingFiles} animationType="fade" transparent>
          <View style={styles.uploadModalOverlay}>
            <View style={styles.uploadModalContainer}>
              <Text style={styles.uploadTitle}>{t('fileUploader.status.uploading') as string}</Text>
              <Text style={styles.uploadSubtitle}>
                {currentFileIndex > 0 && totalFiles > 0
                  ? `${t('common.file') as string} ${currentFileIndex}/${totalFiles}`
                  : `${totalFiles} ${t('fileUploader.files') as string}`}
              </Text>
              <ProgressBar progress={uploadProgressPercent / 100} style={styles.uploadProgressBar} />
              <Text style={styles.uploadPercent}>
                {uploadProgressPercent >= 99 ? (t('common.finalizing') as string) : `${uploadProgressPercent}%`}
              </Text>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ErrorBoundary>
  );
};

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  errorMessage: {margin: 16},
  section: {margin: 20, marginTop: 8},

  // Stepper
  stepperContainer: {flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8},
  stepItem: {alignItems: 'center', flex: 1},
  stepCircle: {width: 30, height: 30, borderRadius: 15, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center'},
  stepCircleActive: {backgroundColor: '#007AFF'},
  stepCircleCompleted: {backgroundColor: '#4CAF50'},
  stepCircleText: {fontSize: 13, fontWeight: '600', color: '#999'},
  stepCircleTextActive: {color: '#fff'},
  stepLabel: {fontSize: 10, color: '#999', marginTop: 4, textAlign: 'center'},
  stepLabelActive: {color: '#007AFF', fontWeight: '600'},

  // Card
  card: {backgroundColor: '#ffffff', borderRadius: 8, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3},
  sectionTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333333'},
  sectionDescription: {fontSize: 14, color: '#666', marginBottom: 16},

  // Inputs
  inputGroup: {marginBottom: 16},
  label: {fontSize: 16, fontWeight: '500', marginBottom: 5, color: '#333333'},
  input: {borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9'},
  textArea: {height: 100, textAlignVertical: 'top'},
  inputError: {borderColor: '#FF3B30', borderWidth: 2},
  errorText: {color: '#FF3B30', fontSize: 12, marginTop: 4},

  // Selectors
  selector: {borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, backgroundColor: '#f9f9f9', marginBottom: 0},
  selectorText: {fontSize: 16, color: '#333333'},
  placeholder: {color: '#999999'},

  // Priority
  priorityContainer: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  priorityButton: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff'},
  priorityButtonSelected: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  priorityButtonText: {fontSize: 14, color: '#666'},
  priorityButtonTextSelected: {color: '#fff'},

  // Chips (item types)
  chipContainer: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16},
  chip: {paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff'},
  chipSelected: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  chipText: {fontSize: 14, color: '#666'},
  chipTextSelected: {color: '#fff', fontWeight: '500'},

  // Components (checkboxes)
  componentSection: {marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee'},
  componentSectionTitle: {fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 10},
  checkboxRow: {flexDirection: 'row', alignItems: 'center', paddingVertical: 8},
  checkbox: {width: 22, height: 22, borderRadius: 4, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center', marginRight: 10},
  checkboxChecked: {backgroundColor: '#007AFF', borderColor: '#007AFF'},
  checkmark: {color: '#fff', fontSize: 14, fontWeight: 'bold'},
  checkboxLabel: {fontSize: 15, color: '#333'},
  emptyText: {color: '#999', fontStyle: 'italic', marginTop: 8},

  // Review
  reviewHeading: {fontSize: 15, fontWeight: '700', color: '#007AFF', marginTop: 16, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 4},
  reviewRow: {fontSize: 14, color: '#333', marginBottom: 4, lineHeight: 20},
  reviewLabel: {fontWeight: '600', color: '#555'},
  reviewMuted: {fontSize: 13, color: '#999', fontStyle: 'italic'},
  reviewItemBlock: {marginLeft: 8, marginBottom: 6},
  reviewItemType: {fontSize: 14, fontWeight: '600', color: '#333'},

  // Date picker
  datePickerButton: {borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, backgroundColor: '#f9f9f9', justifyContent: 'center'},
  datePickerText: {fontSize: 16, color: '#333333'},
  dateModalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center'},
  dateModalContainer: {backgroundColor: '#ffffff', borderRadius: 20, maxHeight: '85%', shadowColor: '#000', shadowOffset: {width: 0, height: -2}, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5},
  dateModalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0', backgroundColor: '#f8f9fa', borderTopLeftRadius: 20, borderTopRightRadius: 20},
  dateModalTitle: {fontSize: 18, fontWeight: '600', color: '#333333', flex: 1, textAlign: 'center'},
  dateModalCancel: {fontSize: 16, color: '#FF3B30', fontWeight: '500'},
  dateModalConfirm: {fontSize: 16, color: '#007AFF', fontWeight: '600'},
  datePickerContent: {padding: 10},
  pickerRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 0},
  pickerContainer: {flex: 1, marginHorizontal: 4, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 2},
  pickerLabel: {fontSize: 11, fontWeight: '600', color: '#007AFF', marginBottom: 3, textAlign: 'center', textTransform: 'uppercase'},
  picker: {height: 50, backgroundColor: 'transparent'},
  datePreviewContainer: {backgroundColor: '#007AFF', borderRadius: 12, padding: 12, margin: 10, marginBottom: 20, alignItems: 'center'},
  datePreviewLabel: {fontSize: 13, fontWeight: '500', color: '#ffffff', marginBottom: 3},
  datePreviewText: {fontSize: 15, fontWeight: '600', color: '#ffffff', textAlign: 'center'},

  // Buttons
  buttonContainer: {margin: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 10},
  backButton: {flex: 1, backgroundColor: '#ffffff', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#007AFF'},
  backButtonText: {color: '#007AFF', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase'},
  nextButton: {flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center'},
  nextButtonText: {color: '#ffffff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase'},
  resetButton: {flex: 1, backgroundColor: '#ffffff', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30'},
  resetButtonText: {color: '#FF3B30', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase'},
  submitButton: {flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center'},
  submitButtonDisabled: {backgroundColor: '#cccccc'},
  submitButtonText: {color: '#ffffff', fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase'},

  // Modals
  modalContainer: {flex: 1, backgroundColor: '#fff'},
  modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0'},
  modalTitle: {fontSize: 18, fontWeight: '600'},
  modalCloseButton: {fontSize: 16, color: '#007AFF'},
  listContent: {flex: 1},
  listItem: {padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0'},
  listItemTitle: {fontSize: 16, fontWeight: '600', marginBottom: 4},
  listItemSubtitle: {fontSize: 14, color: '#666', marginBottom: 4},

  // Upload progress
  uploadModalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center'},
  uploadModalContainer: {width: '80%', backgroundColor: '#ffffff', borderRadius: 10, padding: 20, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, alignItems: 'center'},
  uploadTitle: {fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6},
  uploadSubtitle: {fontSize: 14, color: '#666', marginBottom: 12},
  uploadProgressBar: {width: '100%', height: 6, borderRadius: 3, marginBottom: 8},
  uploadPercent: {fontSize: 14, color: '#333', fontWeight: '500'},
});

export default CreateOrderScreen;
