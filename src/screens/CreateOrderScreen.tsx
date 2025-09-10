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
  FlatList,
} from 'react-native';
import {Picker} from '@react-native-picker/picker';
import {useNavigation} from '@react-navigation/native';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {User, UserRole, FileSelection, MultipleFileUploadResult} from '../types';
import {FileUploader} from '../components/ui';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';
import {httpClient} from '../utils/httpClient';
import {useOrders} from '../hooks/useOrders';
import {useAuth} from '../hooks/useAuth';
import Toast from 'react-native-toast-message';
import {ProgressBar} from 'react-native-paper';
import {useIsFocused} from '@react-navigation/native';
import i18n from '../i18n';
import { getLedTone, LIGHT_GRAY, LIGHT_BLUE, GRAY, colorNameToHex } from '../utils/orderVisuals';
import LedIndicator from '../components/ui/LedIndicator';

interface Category {
  id: number;
  uuid: string;
  name: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  color: string;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

interface FormData {
  customer_id: string;
  title: string;
  description: string;
  status: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  category_ids: string[];
  estimated_completion: string;
  notes: string;
  assigned_to: string;
  // Optional: we'll send customer_uuid if known (kept in a separate map)
}

interface FormErrors {
  customer_id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category_ids?: string;
  estimated_completion?: string;
  notes?: string;
  assigned_to?: string;
}

const CreateOrderScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const {setOrders} = useOrders();
  const {user} = useAuth();
  const isFocused = useIsFocused();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const initialFormState: FormData = {
    customer_id: '',
    title: '',
    description: '',
    status: 'Open',
    priority: 'Normal',
    category_ids: [],
    estimated_completion: '',
    notes: '',
    assigned_to: '',
  };
  const [formData, setFormData] = useState<FormData>(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [selectedCustomerName, setSelectedCustomerName] = useState<string>('');
  
  const [customers, setCustomers] = useState<User[]>([]);
  const [customerUuidById, setCustomerUuidById] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEstimatedDatePicker, setShowEstimatedDatePicker] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<FileSelection[]>([]);
  
  // Upload progress states
  const [isUploadingFiles, setIsUploadingFiles] = useState<boolean>(false);
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  
  // Date picker component states
  const [estimatedYear, setEstimatedYear] = useState<string>('');
  const [estimatedMonth, setEstimatedMonth] = useState<string>('');
  const [estimatedDay, setEstimatedDay] = useState<string>('');
  const [estimatedHour, setEstimatedHour] = useState<string>('');
  const [estimatedMinute, setEstimatedMinute] = useState<string>('');

  // Load initial data (customers, categories, employees)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        clearError();
        
        // Load customers from API
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
            id: dbId, // Use numeric DB ID to satisfy exists:users,id
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
        
        // Load employees from API
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
            id: String(u.id ?? ''), // Use numeric DB ID only
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
        
        // Load categories from API
        const response = await httpClient.get('/v1/categories');
        const rawCats: any[] = Array.isArray(response.data)
          ? response.data
          : (Array.isArray((response.data as any)?.data) ? (response.data as any).data : []);

        const mappedCats: Category[] = rawCats.map((c: any) => ({
          id: Number(c.id ?? c.uuid ?? c.category_id ?? 0),
          uuid: String(c.uuid ?? c.id ?? ''),
          name: String(c.name ?? c.title ?? ''),
          description: String(c.description ?? ''),
          is_active: Boolean(c.is_active ?? c.active ?? c.enabled ?? true),
          sort_order: Number(c.sort_order ?? c.order ?? 0),
          color: String(c.color ?? '#999999'),
          created_by: Number(c.created_by ?? 0),
          updated_by: Number(c.updated_by ?? 0),
          created_at: String(c.created_at ?? ''),
          updated_at: String(c.updated_at ?? ''),
        }));
        const activeCats = mappedCats.filter(cat => !!cat.is_active);
        setCategories(activeCats);
        
        errorService.logSuccess('loadInitialData', {
          component: 'CreateOrderScreen',
          customerCount: mappedCustomers.length,
          employeeCount: mappedEmployees.length,
          categoryCount: activeCats.length,
        });
      } catch (error) {
        await errorService.logError(error as Error, {
          component: 'CreateOrderScreen',
          operation: 'loadInitialData',
        });
        handleError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [handleError, clearError]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (formErrors[field]) setFormErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleCustomerSelect = (customer: User) => {
    const selectedId = String(customer.id);
    const cuuid = customerUuidById[selectedId];
    console.log('DEBUG CreateOrder: customer selected', { customer_id: selectedId, customer_uuid: cuuid, name: `${customer.firstName} ${customer.lastName}` });
    setFormData(prev => ({ ...prev, customer_id: selectedId }));
    setSelectedCustomerName(`${customer.firstName} ${customer.lastName}`);
    setShowCustomerModal(false);
  };

  const handleEmployeeSelect = (employee: User) => {
    handleInputChange('assigned_to', employee.id);
    setShowEmployeeModal(false);
  };

  const handleCategorySelect = (category: Category) => {
    setFormData(prev => {
      const categoryId = category.id.toString();
      const isSelected = prev.category_ids.includes(categoryId);
      const newCategoryIds = isSelected
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId];
      return { ...prev, category_ids: newCategoryIds };
    });
    // Keep modal open to allow multi-select
  };

  const handleFilesChanged = (files: FileSelection[]) => {
    setSelectedFiles(files);
  };

  const handleFileUploadComplete = (_result: MultipleFileUploadResult) => {
    // No-op: we upload after creation using manual flow
  };

  const handleFileUploadError = (message: string) => {
    Toast.show({ type: 'error', text1: t('common.error') as string, text2: message, visibilityTime: 3000 });
  };

  // Helpers: Category label
  const getCategoryName = (categoryIds: string[]): string => {
    if (!categoryIds || categoryIds.length === 0) return '';
    const names = categoryIds
      .map(id => categories.find(c => c.id.toString() === id)?.name || '')
      .filter(Boolean);
    return names.join(', ');
  };

  // Date helpers
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years: { label: string; value: string }[] = [];
    for (let year = currentYear; year <= currentYear + 5; year++) {
      years.push({ label: year.toString(), value: year.toString() });
    }
    return years;
  };
  const generateMonths = () => {
    const months: { label: string; value: string }[] = [];
    const lang = i18n.language;
    for (let month = 1; month <= 12; month++) {
      const monthDate = new Date(2000, month - 1, 1);
      let monthLabel = monthDate.toLocaleString(lang, { month: 'long' });
      monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1);
      months.push({ label: monthLabel, value: month.toString().padStart(2, '0') });
    }
    return months;
  };
  const generateDays = (year: string, month: string) => {
    const days: { label: string; value: string }[] = [];
    const daysInMonth = year && month ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      days.push({ label: dayStr, value: dayStr });
    }
    return days;
  };
  const generateHours = () => {
    const hours: { label: string; value: string }[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      hours.push({ label: hourStr, value: hourStr });
    }
    return hours;
  };
  const generateMinutes = () => {
    const minutes: { label: string; value: string }[] = [];
    for (let minute = 0; minute < 60; minute += 15) {
      const minuteStr = minute.toString().padStart(2, '0');
      minutes.push({ label: minuteStr, value: minuteStr });
    }
    return minutes;
  };

  const assembleDateFromPickers = (year: string, month: string, day: string, hour: string, minute: string): string => {
    if (!year || !month || !day || !hour || !minute) return '';
    try {
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      return date.toISOString();
    } catch {
      return '';
    }
  };
  const parseDateToPickers = (dateString: string) => {
    if (!dateString) {
      const now = new Date();
      return {
        year: now.getFullYear().toString(),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        day: now.getDate().toString().padStart(2, '0'),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: '00',
      };
    }
    try {
      const date = new Date(dateString);
      return {
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString().padStart(2, '0'),
        day: date.getDate().toString().padStart(2, '0'),
        hour: date.getHours().toString().padStart(2, '0'),
        minute: date.getMinutes().toString().padStart(2, '0'),
      };
    } catch {
      const now = new Date();
      return {
        year: now.getFullYear().toString(),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        day: now.getDate().toString().padStart(2, '0'),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: '00',
      };
    }
  };
  const openEstimatedDatePicker = () => {
    const parsed = parseDateToPickers(formData.estimated_completion);
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
      let monthName = date.toLocaleString(lang, { month: 'long' });
      monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      const yearFormatted = date.getFullYear();
      const finalDate = lang === 'es' ? `${dayFormatted} de ${monthName} de ${yearFormatted}` : `${monthName} ${dayFormatted}, ${yearFormatted}`;
      const time = date.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit', hour12: true });
      return `${finalDate}, ${time}`;
    } catch {
      return t('orders.invalidDate') as string;
    }
  };

  // Validation
  const validStatuses = useMemo(() => [
    'Open', 'In Progress', 'Ready for delivery', 'Delivered', 'Completed', 'Paid', 'Returned', 'Not paid', 'On hold', 'Cancelled'
  ], []);
  const validPriorities = useMemo(() => ['Low', 'Normal', 'High', 'Urgent'] as const, []);

  const validateField = (field: keyof FormData, value: string | string[]): string | null => {
    switch (field) {
      case 'customer_id':
        if (!String(value || '').trim()) return t('createOrder.errors.customerRequired') as string;
        return null;
      case 'title':
        if (!String(value || '').trim()) return t('createOrder.errors.titleRequired') as string;
        if (String(value).length > 255) return t('editOrder.errors.titleTooLong') as string;
        return null;
      case 'description':
        if (!String(value || '').trim()) return t('createOrder.errors.descriptionRequired') as string;
        return null;
      case 'status':
        if (!String(value || '').trim()) return t('createOrder.errors.statusRequired') as string;
        if (!validStatuses.includes(String(value))) return t('editOrder.errors.invalidStatus') as string;
        return null;
      case 'priority':
        if (!String(value || '').trim()) return t('createOrder.errors.priorityRequired') as string;
        if (!validPriorities.includes(value as any)) return t('editOrder.errors.invalidPriority') as string;
        return null;
      case 'category_ids': {
        const arr = Array.isArray(value) ? value : [];
        if (arr.length === 0) return t('editOrder.errors.categoryRequired') as string;
        const invalidCategory = arr.find(id => !categories.find(c => c.id.toString() === id));
        if (invalidCategory) return t('editOrder.errors.invalidCategory') as string;
        // Check duplicates
        const set = new Set(arr);
        if (set.size !== arr.length) return t('createOrder.errors.invalidCategory') as string;
        return null;
      }
      case 'estimated_completion':
        if (!String(value || '').trim()) return null; // optional
        try {
          const date = new Date(String(value));
          if (isNaN(date.getTime())) return t('createOrder.errors.estimatedDateInvalid') as string;
          const today = new Date();
          today.setHours(0,0,0,0);
          if (date <= today) return t('createOrder.errors.estimatedDateMustBeFuture') as string;
          return null;
        } catch {
          return t('createOrder.errors.estimatedDateInvalid') as string;
        }
      case 'assigned_to':
        if (!String(value || '').trim()) return t('createOrder.errors.assignedToRequired') as string;
        if (!employees.find(e => e.id === String(value))) return t('editOrder.errors.invalidEmployee') as string;
        return null;
      case 'notes':
        return null;
      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const fields: (keyof FormData)[] = ['customer_id', 'title', 'description', 'status', 'priority', 'category_ids', 'assigned_to', 'estimated_completion', 'notes'];
    const errors: FormErrors = {};
    let ok = true;
    for (const f of fields) {
      const v = (formData as any)[f];
      const e = validateField(f, v);
      if (e) {
        (errors as any)[f] = e;
        ok = false;
      }
    }
    setFormErrors(errors);
    return ok;
  };

  const handleReset = () => {
    Alert.alert(
      t('common.reset') as string,
      t('editOrder.confirmReset') as string,
      [
        { text: t('common.cancel') as string, style: 'cancel' },
        {
          text: t('common.reset') as string,
          style: 'destructive',
          onPress: () => {
            setFormData(initialFormState);
            setFormErrors({});
            setSelectedCustomerName('');
            setSelectedFiles([]);
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setIsSubmitting(true);
      clearError();

      // Log snapshot of formData before building payload
      try {
        console.log('DEBUG CreateOrder: formData snapshot', {
          customer_id: formData.customer_id,
          customer_uuid: customerUuidById[String(formData.customer_id)],
          title: formData.title,
          status: formData.status,
          priority: formData.priority,
          assigned_to: formData.assigned_to,
          category_ids: formData.category_ids,
          estimated_completion: formData.estimated_completion,
        });
      } catch {}

      // Build URL-encoded payload
      const params = new URLSearchParams();
      // Ensure numeric ID string is sent (backend expects users.id)
      const parsedCustomerId = parseInt(formData.customer_id, 10);
      if (Number.isNaN(parsedCustomerId)) {
        console.log('DEBUG CreateOrder: invalid customer_id (NaN)', { raw: formData.customer_id });
      }
      const safeCustomerId = String(parsedCustomerId);
      params.append('customer_id', safeCustomerId);
      // Add customer_uuid if we have it (optional)
      const cuuid = customerUuidById[safeCustomerId];
      if (cuuid) params.append('customer_uuid', cuuid);
      params.append('title', formData.title);
      params.append('description', formData.description);
      params.append('status', formData.status);
      params.append('priority', formData.priority);
      const parsedAssignedTo = parseInt(formData.assigned_to, 10);
      if (Number.isNaN(parsedAssignedTo)) {
        console.log('DEBUG CreateOrder: invalid assigned_to (NaN)', { raw: formData.assigned_to });
      }
      params.append('assigned_to', String(parsedAssignedTo));
      formData.category_ids.forEach(id => params.append('categories[]', id));
      if (formData.estimated_completion) {
        try {
          const d = new Date(formData.estimated_completion);
          if (!isNaN(d.getTime())) params.append('estimated_completion', d.toISOString());
        } catch {}
      }
      if (formData.notes) params.append('notes', formData.notes);

      if (__DEV__) {
        try {
          const debugPairs: Array<{k:string; v:string}> = [];
          params.forEach((v, k) => debugPairs.push({k, v}));
          console.log('DEBUG CreateOrder: POST /v1/orders urlencoded pairs:', debugPairs);
        } catch {}
      }
      const resp = await httpClient.post('/v1/orders', params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      });

      if (!(resp.status >= 200 && resp.status < 300)) {
        console.log('DEBUG CreateOrder: non-2xx response', { status: resp.status, data: resp.data });
        throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
      }

      console.log('DEBUG CreateOrder: create response keys', Object.keys(resp?.data || {}));

      // Extract UUID
      const orderUuid: string = String(
        (resp.data?.order?.uuid) || (resp.data?.data?.uuid) || (resp.data?.uuid) || (resp.data?.order?.id) || resp.data?.id
      );

      // Upload attachments if any
      if (selectedFiles.length > 0 && orderUuid) {
        const t0 = Date.now();
        setIsUploadingFiles(true);
        setTotalFiles(selectedFiles.length);
        setCurrentFileIndex(0);
        setUploadProgressPercent(0);
        try {
          // Try batch first
          const formDataUpload = new FormData();
          selectedFiles.forEach(file => {
            formDataUpload.append('files[]', { uri: file.uri, name: file.name, type: file.type } as any);
          });
          const uploadResp = await httpClient.post(`/v1/orders/${orderUuid}/attachments`, formDataUpload, {
            timeout: 120000,
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (evt: any) => {
              let pct = 0;
              if (evt?.total) pct = Math.round((evt.loaded * 100) / evt.total);
              const clamped = Math.min(100, Math.max(0, pct));
              setUploadProgressPercent(clamped);
              const approxIndex = Math.max(1, Math.min(selectedFiles.length, Math.ceil((clamped / 100) * selectedFiles.length)));
              setCurrentFileIndex(approxIndex);
            },
          });
          if (!(uploadResp.status >= 200 && uploadResp.status < 300)) {
            throw new Error(`HTTP ${uploadResp.status}: ${uploadResp.statusText}`);
          }
        } catch (batchErr: any) {
          // Fallback: single uploads
          for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const fd = new FormData();
            fd.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
            setUploadProgressPercent(Math.round((i / selectedFiles.length) * 100));
            const singleResp = await httpClient.post(`/v1/orders/${orderUuid}/attachments`, fd, {
              timeout: 60000,
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (evt: any) => {
                let combined = Math.round((i / selectedFiles.length) * 100);
                if (evt?.total) {
                  const part = (evt.loaded / evt.total);
                  combined = Math.round(((i + part) / selectedFiles.length) * 100);
                }
                setUploadProgressPercent(Math.min(100, combined));
                setCurrentFileIndex(i + 1);
              },
            });
            if (!(singleResp.status >= 200 && singleResp.status < 300)) {
              throw new Error(`HTTP ${singleResp.status}: ${singleResp.statusText}`);
            }
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
          navigation.navigate('Main', { screen: 'Orders' } as any);
        },
      });
    } catch (err: any) {
      try {
        console.log('DEBUG CreateOrder: error response', { status: err?.response?.status, data: err?.response?.data, message: err?.message });
      } catch {}
      await errorService.logError(err as Error, { component: 'CreateOrderScreen', operation: 'createOrder' });
      const message = (err?.response?.data?.message as string) || err?.message || (t('navigation.errors.serverError') as string);
      Toast.show({ type: 'error', text1: t('common.error') as string, text2: message, visibilityTime: 3500 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorities: Array<{key: string; label: string; value: 'Low' | 'Normal' | 'High' | 'Urgent'}> = [
    {key: 'low', label: t('orders.priorities.low') as string, value: 'Low'},
    {key: 'normal', label: t('orders.priorities.normal') as string, value: 'Normal'},
    {key: 'high', label: t('orders.priorities.high') as string, value: 'High'},
    {key: 'urgent', label: t('orders.priorities.urgent') as string, value: 'Urgent'},
  ];
  const statuses: Array<{key: string; label: string; value: string}> = [
    { key: 'open', label: t('orders.statuses.open') as string, value: 'Open' },
    { key: 'inProgress', label: t('orders.statuses.inProgress') as string, value: 'In Progress' },
    { key: 'readyForDelivery', label: t('orders.statuses.readyForDelivery') as string, value: 'Ready for delivery' },
    { key: 'delivered', label: t('orders.statuses.delivered') as string, value: 'Delivered' },
    { key: 'completed', label: t('orders.statuses.completed') as string, value: 'Completed' },
    { key: 'paid', label: t('orders.statuses.paid') as string, value: 'Paid' },
    { key: 'returned', label: t('orders.statuses.returned') as string, value: 'Returned' },
    { key: 'notPaid', label: t('orders.statuses.notPaid') as string, value: 'Not paid' },
    { key: 'onHold', label: t('orders.statuses.onHold') as string, value: 'On hold' },
    { key: 'cancelled', label: t('orders.statuses.cancelled') as string, value: 'Cancelled' },
  ];

  const renderCustomerItem = ({item}: {item: User}) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleCustomerSelect(item)}
      accessibilityLabel={t('createOrder.customerItemAccessibility', { 
        customerName: `${item.firstName} ${item.lastName}`, 
        company: item.company || t('common.noCompany') as string 
      }) as string}
      accessibilityRole="button">
      <Text style={styles.customerName}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={styles.customerDetails}>
        {item.email} • {item.company || t('common.noCompany') as string}
      </Text>
      {item.customerType && (
        <Text style={styles.customerType}>
          {item.customerType === 'corporate' ? t('common.customerTypes.corporate') as string : t('common.customerTypes.individual') as string}
        </Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <ErrorMessage 
          error={error} 
          visible={hasError} 
          onRetry={clearError}
          style={styles.errorMessage}
        />
        
        {/* Navigation header provides title; removing duplicate header */}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createOrder.orderDetails') as string}</Text>
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.orderTitle') as string || t('createOrder.orderTitle') as string}</Text>
              <TextInput
                style={[styles.input, formErrors.title && styles.inputError]}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder={t('createOrder.orderTitle') as string}
                editable={!isSubmitting && !isLoading}
              />
              {formErrors.title && (<Text style={styles.errorText}>{formErrors.title}</Text>)}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.description') as string || t('createOrder.orderDescription') as string}</Text>
              <TextInput
                style={[styles.input, styles.textArea, formErrors.description && styles.inputError]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder={t('createOrder.orderDescription') as string}
                multiline
                numberOfLines={4}
                editable={!isSubmitting && !isLoading}
              />
              {formErrors.description && (<Text style={styles.errorText}>{formErrors.description}</Text>)}
            </View>

            {/* Customer selector below description */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.customer') as string}</Text>
              <TouchableOpacity
                style={[styles.customerSelector, formErrors.customer_id && styles.inputError]}
                onPress={() => setShowCustomerModal(true)}
                accessibilityLabel={t('createOrder.selectCustomerAccessibility') as string}
                accessibilityRole="button">
                <Text style={[styles.customerSelectorText, !formData.customer_id && styles.placeholder]}>
                  {selectedCustomerName || (t('createOrder.selectCustomer') as string)}
                </Text>
              </TouchableOpacity>
              {formErrors.customer_id && (<Text style={styles.errorText}>{formErrors.customer_id}</Text>)}
            </View>

            {/* Category selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.category') as string}</Text>
              <TouchableOpacity
                style={[styles.customerSelector, formErrors.category_ids && styles.inputError]}
                onPress={() => setShowCategoryModal(true)}>
                <Text style={[styles.customerSelectorText, formData.category_ids.length === 0 && styles.placeholder]}>
                  {formData.category_ids.length > 0 ? getCategoryName(formData.category_ids) : (t('createOrder.selectCategory') as string)}
                </Text>
              </TouchableOpacity>
              {formErrors.category_ids && (<Text style={styles.errorText}>{formErrors.category_ids}</Text>)}
            </View>

            {/* Assigned to */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.assignedTo') as string}</Text>
              <TouchableOpacity
                style={[styles.customerSelector, formErrors.assigned_to && styles.inputError]}
                onPress={() => setShowEmployeeModal(true)}>
                <Text style={[styles.customerSelectorText, !formData.assigned_to && styles.placeholder]}>
                  {formData.assigned_to ? (employees.find(e => e.id === formData.assigned_to)?.firstName + ' ' + (employees.find(e => e.id === formData.assigned_to)?.lastName ?? '')) : (t('createOrder.selectEmployee') as string)}
                </Text>
              </TouchableOpacity>
              {formErrors.assigned_to && (<Text style={styles.errorText}>{formErrors.assigned_to}</Text>)}
            </View>

            {/* Estimated completion */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.estimatedCompletion') as string}</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, formErrors.estimated_completion && styles.inputError]}
                onPress={openEstimatedDatePicker}>
                <Text style={[styles.datePickerText, !formData.estimated_completion && styles.placeholder]}>
                  {formData.estimated_completion ? getEstimatedDatePreview() : (t('orders.selectDate') as string)}
                </Text>
              </TouchableOpacity>
              {formErrors.estimated_completion && (<Text style={styles.errorText}>{formErrors.estimated_completion}</Text>)}
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.notes') as string}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.notes}
                onChangeText={(value) => handleInputChange('notes', value)}
                placeholder={t('orders.notesPlaceholder') as string}
                multiline
                numberOfLines={3}
                editable={!isSubmitting && !isLoading}
              />
            </View>

            {/* Status */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.status') as string}</Text>
              <View style={styles.statusContainer}>
                {statuses.map((status) => (
                  <TouchableOpacity
                    key={status.key}
                    style={[styles.statusButton, formData.status === status.value && styles.statusButtonActive]}
                    onPress={() => handleInputChange('status', status.value)}>
                    <Text style={[styles.statusButtonText, formData.status === status.value && styles.statusButtonTextActive]}>
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.status && (<Text style={styles.errorText}>{formErrors.status}</Text>)}
            </View>

            {/* Priority */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('orders.priority') as string}</Text>
              <View style={styles.priorityContainer}>
                {priorities.map((priority) => (
                  <TouchableOpacity
                    key={priority.key}
                    style={[styles.priorityButton, formData.priority === priority.value && styles.priorityButtonSelected]}
                    onPress={() => handleInputChange('priority', priority.value)}
                    accessibilityLabel={t('createOrder.priorityButtonAccessibility', { priority: priority.label }) as string}
                    accessibilityRole="button">
                    <Text style={[styles.priorityButtonText, formData.priority === priority.value && styles.priorityButtonTextSelected]}>
                      {priority.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {formErrors.priority && (<Text style={styles.errorText}>{formErrors.priority}</Text>)}
            </View>
          </View>
        </View>

        {/* Attachments section (selection only; upload after create) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createOrder.attachments') as string}</Text>
          <Text style={styles.sectionDescription}>{t('createOrder.attachmentsDescription') as string}</Text>
          
          <FileUploader
            showUploadButton={false}
            allowMultiple={true}
            onFilesChanged={setSelectedFiles}
            onUploadComplete={handleFileUploadComplete}
            onUploadError={(e) => handleFileUploadError(e)}
            maxFiles={10}
            isScreenFocused={isFocused}
            allowedFileTypes={[
              'image/jpeg','image/png','image/gif','image/heic','image/webp',
              'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','text/plain']}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={isSubmitting}>
            <Text style={styles.resetButtonText}>{t('common.reset') as string}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.submitButtonText}>{t('createOrder.createOrderButton') as string || (t('common.create') as string)}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Customer Modal */}
        <Modal
          visible={showCustomerModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowCustomerModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectCustomer') as string}</Text>
              <TouchableOpacity onPress={() => setShowCustomerModal(false)} accessibilityLabel={t('common.close') as string} accessibilityRole="button">
                <Text style={styles.modalCloseButton}>×</Text>
              </TouchableOpacity>
            </View>
            <FlatList data={customers} renderItem={({ item }) => (
              <TouchableOpacity style={styles.customerItem} onPress={() => handleCustomerSelect(item)}>
                <Text style={styles.customerName}>{item.firstName} {item.lastName}</Text>
                <Text style={styles.customerDetails}>{item.email} • {item.company || (t('common.noCompany') as string)}</Text>
              </TouchableOpacity>
            )} keyExtractor={(item) => item.id} style={styles.customerList} />
          </View>
        </Modal>

        {/* Category Modal */}
        <Modal visible={showCategoryModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectCategory') as string}</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.modalCloseButton}>{t('common.done') as string}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={({ item }) => {
                const isSelected = formData.category_ids.includes(item.id.toString());
                const categoryHexColor = colorNameToHex(item.color);
                return (
                  <TouchableOpacity
                    style={[styles.customerItem, isSelected && { backgroundColor: LIGHT_GRAY, borderColor: GRAY, borderWidth: 1 }]}
                    onPress={() => handleCategorySelect(item)}
                  >
                    <View style={styles.categoryNameContainer}>
                      <LedIndicator color={getLedTone(categoryHexColor || LIGHT_BLUE)} />
                      <View>
                        <Text style={styles.customerName}>{item.name}</Text>
                        <Text style={styles.customerDetails}>{item.description}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item.id.toString()}
              style={styles.customerList}
            />
          </View>
        </Modal>

        {/* Employee Modal */}
        <Modal visible={showEmployeeModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectEmployee') as string}</Text>
              <TouchableOpacity onPress={() => setShowEmployeeModal(false)}>
                <Text style={styles.modalCloseButton}>{t('common.close') as string}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={employees}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.customerItem} onPress={() => handleEmployeeSelect(item)}>
                  <Text style={styles.customerName}>{item.firstName} {item.lastName}</Text>
                  <Text style={styles.customerDetails}>{item.email} • {item.company || (t('common.noCompany') as string)}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
              style={styles.customerList}
            />
          </View>
        </Modal>

        {/* Estimated Date Picker Modal */}
        <Modal visible={showEstimatedDatePicker} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('orders.estimatedCompletion') as string}</Text>
              <TouchableOpacity onPress={() => {
                const iso = assembleDateFromPickers(estimatedYear, estimatedMonth, estimatedDay, estimatedHour, estimatedMinute);
                if (iso) handleInputChange('estimated_completion', iso);
                setShowEstimatedDatePicker(false);
              }}>
                <Text style={styles.modalCloseButton}>{t('common.done') as string}</Text>
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>{t('orders.year') as string}</Text>
                  <Picker selectedValue={estimatedYear} onValueChange={setEstimatedYear} style={styles.picker}>
                    {generateYears().map(y => (<Picker.Item key={y.value} label={y.label} value={y.value} />))}
                  </Picker>
                </View>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>{t('orders.month') as string}</Text>
                  <Picker selectedValue={estimatedMonth} onValueChange={setEstimatedMonth} style={styles.picker}>
                    {generateMonths().map(m => (<Picker.Item key={m.value} label={m.label} value={m.value} />))}
                  </Picker>
                </View>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>{t('orders.day') as string}</Text>
                  <Picker selectedValue={estimatedDay} onValueChange={setEstimatedDay} style={styles.picker}>
                    {generateDays(estimatedYear, estimatedMonth).map(d => (<Picker.Item key={d.value} label={d.label} value={d.value} />))}
                  </Picker>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>{t('orders.hour') as string}</Text>
                  <Picker selectedValue={estimatedHour} onValueChange={setEstimatedHour} style={styles.picker}>
                    {generateHours().map(h => (<Picker.Item key={h.value} label={h.label} value={h.value} />))}
                  </Picker>
                </View>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>{t('orders.minute') as string}</Text>
                  <Picker selectedValue={estimatedMinute} onValueChange={setEstimatedMinute} style={styles.picker}>
                    {generateMinutes().map(min => (<Picker.Item key={min.value} label={min.label} value={min.value} />))}
                  </Picker>
                </View>
              </View>
              <View style={styles.datePreviewContainer}>
                <Text style={styles.datePreviewLabel}>{t('orders.datePreview') as string}:</Text>
                <Text style={styles.datePreviewText}>{getEstimatedDatePreview()}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  errorMessage: { margin: 16 },
  section: { margin: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333333' },
  card: { backgroundColor: '#ffffff', borderRadius: 8, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.22, shadowRadius: 2.22, elevation: 3 },
  sectionDescription: { fontSize: 14, color: '#666', marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 5, color: '#333333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9' },
  textArea: { height: 100, textAlignVertical: 'top' },
  inputError: { borderColor: '#FF3B30', borderWidth: 2 },
  errorText: { color: '#FF3B30', fontSize: 12, marginTop: 4 },

  customerSelector: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, backgroundColor: '#f9f9f9', marginBottom: 15 },
  customerSelectorText: { fontSize: 16, color: '#333333' },
  placeholder: { color: '#999999' },

  priorityContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  priorityButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  priorityButtonSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  priorityButtonText: { fontSize: 14, color: '#666' },
  priorityButtonTextSelected: { color: '#fff' },

  statusContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  statusButton: { flex: 1, minWidth: '45%', padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, marginHorizontal: 2, marginVertical: 2, alignItems: 'center' },
  statusButtonActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  statusButtonText: { fontSize: 12, color: '#666' },
  statusButtonTextActive: { color: '#fff', fontWeight: '500' },

  datePickerButton: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 12, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  datePickerText: { fontSize: 16, color: '#333333' },
  pickerContainer: { flex: 1, marginHorizontal: 4 },
  pickerLabel: { fontSize: 14, color: '#666', marginBottom: 4 },
  picker: { height: 44 },
  datePreviewContainer: { marginTop: 12 },
  datePreviewLabel: { fontSize: 14, color: '#666' },
  datePreviewText: { fontSize: 14, color: '#333', fontWeight: '500' },

  fileUploader: { marginTop: 8 },

  buttonContainer: { margin: 20, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  resetButton: { flex: 1, backgroundColor: '#ffffff', padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#FF3B30' },
  resetButtonText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },
  submitButton: { flex: 1, backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
  submitButtonDisabled: { backgroundColor: '#cccccc' },
  submitButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },

  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  modalTitle: { fontSize: 18, fontWeight: '600' },
  modalCloseButton: { fontSize: 16, color: '#007AFF' },
  customerList: { flex: 1 },
  customerItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  customerName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  customerDetails: { fontSize: 14, color: '#666', marginBottom: 4 },
  categoryNameContainer: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  uploadModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  uploadModalContainer: { width: '80%', backgroundColor: '#ffffff', borderRadius: 10, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, alignItems: 'center' },
  uploadTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 6 },
  uploadSubtitle: { fontSize: 14, color: '#666', marginBottom: 12 },
  uploadProgressBar: { width: '100%', height: 6, borderRadius: 3, marginBottom: 8 },
  uploadPercent: { fontSize: 14, color: '#333', fontWeight: '500' },
});

export default CreateOrderScreen; 