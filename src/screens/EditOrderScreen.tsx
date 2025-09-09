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
import {EditOrderScreenProps} from '../types/navigation';
import {useTranslationSafe} from '../hooks/useTranslationSafe';
import {User, UserRole, FileSelection, MultipleFileUploadResult} from '../types';
import {FileUploader} from '../components/ui';
import ErrorBoundary from '../components/ErrorBoundary';
import ErrorMessage from '../components/ErrorMessage';
import {useErrorHandler} from '../hooks/useErrorHandler';
import {errorService} from '../services/errorService';
import {httpClient} from '../utils/httpClient';
import {useOrders} from '../hooks/useOrders';
import i18n from '../i18n'; // Import i18n
import {useAuth} from '../hooks/useAuth'; // Import useAuth hook
import { getLedTone, LIGHT_GRAY, LIGHT_BLUE, GRAY, colorNameToHex } from '../utils/orderVisuals';
import LedIndicator from '../components/ui/LedIndicator';
import Toast from 'react-native-toast-message';
import { ProgressBar } from 'react-native-paper';
import { useIsFocused } from '@react-navigation/native';

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
  title: string;
  description: string;
  status: string;
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
  category_ids: string[]; // Changed to an array for multiple selection
  estimated_completion: string;
  actual_completion: string;
  notes: string;
  assigned_to: string;
}

interface OrderInfo {
  id: string;
  uuid: string;
  customer?: {
    id: string;
    full_name: string;
    email: string;
  };
  assigned_to?: {
    id: string;
    full_name: string;
  };
  created_by?: {
    id: string;
    full_name: string;
  };
  updated_by?: {
    id: string;
    full_name: string;
  };
  created_at: string;
  updated_at: string;
  status: string;
  priority: string;
}

interface FormErrors {
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  category_ids?: string;
  estimated_completion?: string;
  actual_completion?: string;
  notes?: string;
  assigned_to?: string;
}

const EditOrderScreen: React.FC<EditOrderScreenProps> = ({
  navigation,
  route,
}) => {
  const {orderUuid, orderData} = route.params;
  const {t} = useTranslationSafe();
  const {handleError, clearError, hasError, error} = useErrorHandler();
  const {setOrders} = useOrders();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    status: 'Open',
    priority: 'Normal',
    category_ids: [],
    estimated_completion: '',
    actual_completion: '',
    notes: '',
    assigned_to: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [originalFormData, setOriginalFormData] = useState<FormData>({
    title: '',
    description: '',
    status: 'Open',
    priority: 'Normal',
    category_ids: [],
    estimated_completion: '',
    actual_completion: '',
    notes: '',
    assigned_to: '',
  });
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [showEstimatedDatePicker, setShowEstimatedDatePicker] = useState(false);
  const [showActualDatePicker, setShowActualDatePicker] = useState(false);
  const {user} = useAuth(); // Get the current user from the auth context
  const isFocused = useIsFocused();
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
  
  const [actualYear, setActualYear] = useState<string>('');
  const [actualMonth, setActualMonth] = useState<string>('');
  const [actualDay, setActualDay] = useState<string>('');
  const [actualHour, setActualHour] = useState<string>('');
  const [actualMinute, setActualMinute] = useState<string>('');

  // Load initial data (customers, categories, employees)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        clearError();
        
        // Customers info is now read-only from order data

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
            id: String(u.id ?? u.uuid ?? u.user_id ?? ''),
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
        
        // Load categories from API (robust against paginated or nested shapes)
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
        if (__DEV__) console.log('DEBUG EditOrder: categories loaded', { count: activeCats.length });
        
        errorService.logSuccess('loadInitialData', {
          component: 'EditOrderScreen',
          orderUuid,
          employeeCount: mappedEmployees.length,
          categoryCount: response.data?.length || 0,
        });
      } catch (error) {
        await errorService.logError(error as Error, {
          component: 'EditOrderScreen',
          operation: 'loadInitialData',
          orderUuid,
        });
        handleError(error as Error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, [orderUuid, t, handleError, clearError]);

  // Load current order information
  useEffect(() => {
    if (!orderData) return;
    console.log("EditOrderScreen: orderData received:", orderData);
    
    try {
      // Use real order data passed from OrderDetailsScreen
      const realOrderInfo: OrderInfo = {
        id: String(orderData.id || ''),
        uuid: String((orderData as any)?.uuid || orderData.id || orderUuid),
        customer: orderData.customer ? {
          id: String(orderData.customer.id || ''),
          full_name: orderData.customer.full_name || `${orderData.customer.firstName} ${orderData.customer.lastName}` || '',
          email: orderData.customer.email || '',
        } : undefined,
        assigned_to: (orderData as any)?.assigned_to ? {
          id: String((orderData as any).assigned_to.id || ''),
          full_name: (orderData as any).assigned_to.full_name || '',
        } : undefined,
        created_by: (orderData as any)?.created_by ? {
          id: String((orderData as any).created_by.id || ''),
          full_name: (orderData as any).created_by.full_name || '',
        } : undefined,
        updated_by: (orderData as any)?.updated_by ? {
          id: String((orderData as any).updated_by.id || ''),
          full_name: (orderData as any).updated_by.full_name || '',
        } : undefined,
        created_at: orderData.createdAt || orderData.created_at || '',
        updated_at: orderData.updatedAt || orderData.updated_at || '',
        status: orderData.status || 'Open',
        priority: orderData.priority || 'Normal',
      };
      console.log("EditOrderScreen: realOrderInfo.assigned_to:", realOrderInfo.assigned_to);
      console.log("EditOrderScreen: orderData.assigned_to:", (orderData as any)?.assigned_to);
      console.log("EditOrderScreen: orderData.categories:", (orderData as any)?.categories);
      console.log("EditOrderScreen: orderData.category_ids (before assignment to formData):", (orderData as any)?.category_ids);

      setOrderInfo(realOrderInfo);
      
      // Set original form data to track changes
      console.log("realOrderInfo.assigned_to:", realOrderInfo.assigned_to);
      const originalData: FormData = {
        title: orderData.title || '',
        description: orderData.description || '',
        status: realOrderInfo.status,
        priority: realOrderInfo.priority as 'Low' | 'Normal' | 'High' | 'Urgent',
        category_ids: (orderData.categories?.map((cat: any) => cat.id.toString()) || orderData.category_ids?.map((id: any) => id.toString()) || [(orderData as any)?.category?.id?.toString()]).filter(Boolean) || [], // Ensure it's an array and filter out empty strings
        estimated_completion: orderData.estimatedCompletion || orderData.estimated_completion || '',
        actual_completion: orderData.actualCompletion || orderData.actual_completion || '',
        notes: orderData.notes || '',
        assigned_to: String(realOrderInfo.assigned_to?.id || ''), // Ensure it's always a string
      };

      console.log("EditOrderScreen: originalData.category_ids (after assignment):", originalData.category_ids);
      
      setOriginalFormData(originalData);
      setFormData(originalData);
      
      errorService.logSuccess('loadRealOrderInfo', {
        component: 'EditOrderScreen',
        orderUuid,
        hasCustomer: !!realOrderInfo.customer,
        hasAssignedTo: !!realOrderInfo.assigned_to,
      });
      
    } catch (error) {
      errorService.logError(error as Error, {
        component: 'EditOrderScreen',
        operation: 'loadOrderInfo',
        orderUuid,
        orderData,
      });
      handleError(error as Error);
    }
  }, [orderUuid, orderData, handleError]);

  // Ensure assigned employee from backend is present in the list for display purposes
  useEffect(() => {
    const anyAssigned: any = (orderData as any)?.assigned_to || orderInfo?.assigned_to;
    if (!anyAssigned) return;
    const assignedId = String(anyAssigned.id || '');
    if (!assignedId) return;
    if (!employees.find(e => e.id === assignedId)) {
      const full = String(anyAssigned.full_name || '');
      const parts = full.split(' ');
      const firstName = parts[0] || full;
      const lastName = parts.slice(1).join(' ');
      const minimal: User = {
        id: assignedId,
        firstName,
        lastName,
        email: '',
        role: UserRole.EMPLOYEE,
        company: '',
        phoneNumber: '',
        isActive: true,
        languagePreference: 'es',
        isCustomer: false,
        isEmployee: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setEmployees(prev => [minimal, ...prev]);
    }
  }, [employees, orderData, orderInfo]);

  // Validation functions
  const validateField = (field: keyof FormData, value: string | string[]): string | null => {
    // Only validate fields that have content
    if (typeof value === 'string' && !value.trim()) return null; // Handle string values
    if (Array.isArray(value) && value.length === 0) return null; // Handle empty array values

    switch (field) {
      case 'title':
        if (value.length > 255) {
          return t('editOrder.errors.titleTooLong') as string;
        }
        break;
      case 'description':
        // No specific validation for description beyond being non-empty
        break;
      case 'status':
        if (typeof value !== 'string') return null; // Ensure value is a string for string operations
        const validStatuses = ['Open', 'In Progress', 'Ready for delivery', 'Delivered', 'Paid', 'Returned', 'Not paid', 'Cancelled'];
        if (!validStatuses.includes(value)) {
          return t('editOrder.errors.invalidStatus') as string;
        }
        break;
      case 'priority':
        if (typeof value !== 'string') return null; // Ensure value is a string for string operations
        const validPriorities = ['Low', 'Normal', 'High', 'Urgent'];
        if (!validPriorities.includes(value)) {
          return t('editOrder.errors.invalidPriority') as string;
        }
        break;
      case 'category_ids':
        if (value.length === 0) {
          return t('editOrder.errors.categoryRequired') as string; // Assuming at least one category is required
        }
        // Ensure all selected category IDs exist
        const invalidCategory = (value as string[]).find(id => !categories.find(c => c.id.toString() === id));
        if (invalidCategory) {
          return t('editOrder.errors.invalidCategory') as string;
        }
        break;
      case 'estimated_completion':
      case 'actual_completion':
        if (typeof value !== 'string') return null; // Ensure value is a string for date operations
        // Validate date format (should be ISO from date picker)
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return t('editOrder.errors.invalidDate') as string;
        }
        
        // Additional validation: check if date is not too far in the past for completion dates
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        
        if (field === 'actual_completion' && date < oneYearAgo) {
          return t('editOrder.errors.dateTooOld') as string;
        }
        
        // Check date relationships
        if (field === 'estimated_completion' && formData.actual_completion) {
          const actualDate = new Date(formData.actual_completion);
          if (!isNaN(actualDate.getTime()) && date > actualDate) {
            return t('editOrder.errors.estimatedAfterActual') as string;
          }
        }
        
        if (field === 'actual_completion' && formData.estimated_completion) {
          const estimatedDate = new Date(formData.estimated_completion);
          if (!isNaN(estimatedDate.getTime()) && date < estimatedDate) {
            return t('editOrder.errors.actualBeforeEstimated') as string;
          }
        }
        break;
      case 'assigned_to':
        if (typeof value !== 'string') return null; // Ensure value is a string for string operations
        if (!employees.find(e => e.id === value)) {
          return t('editOrder.errors.invalidEmployee') as string;
        }
        break;
      case 'notes':
        if (typeof value !== 'string') return null; // Ensure value is a string for string operations
        // No specific validation for notes
        break;
    }
    return null;
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Validate only fields that have content
    Object.entries(formData).forEach(([key, value]) => {
      if ((typeof value === 'string' && value.trim()) || (Array.isArray(value) && value.length > 0)) {
        const error = validateField(key as keyof FormData, value);
        if (error) {
          errors[key as keyof FormErrors] = error;
          isValid = false;
        }
      }
    });

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({...prev, [field]: value}));
    
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({...prev, [field]: undefined}));
    }
  };


  const handleCategorySelect = (category: Category) => {
    setFormData(prev => {
      const categoryId = category.id.toString();
      const isSelected = prev.category_ids.includes(categoryId);
      const newCategoryIds = isSelected
        ? prev.category_ids.filter(id => id !== categoryId)
        : [...prev.category_ids, categoryId];
      return {...prev, category_ids: newCategoryIds};
    });
    // Do not close modal immediately, allow multiple selections
  };

  const handleEmployeeSelect = (employee: User) => {
    handleInputChange('assigned_to', employee.id);
    setShowEmployeeModal(false);
  };

  // Generate picker options
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 1; year <= currentYear + 5; year++) {
      years.push({ label: year.toString(), value: year.toString() });
    }
    return years;
  };

  const generateMonths = () => {
    const months = [];
    const lang = i18n.language; // Get current language
    for (let month = 1; month <= 12; month++) {
      const monthDate = new Date(2000, month - 1, 1); // Use a dummy year, only month is relevant
      let monthLabel = monthDate.toLocaleString(lang, { month: 'long' });
      monthLabel = monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1); // Capitalize first letter
      const monthValue = month.toString().padStart(2, '0');
      months.push({ label: monthLabel, value: monthValue });
    }
    return months;
  };

  const generateDays = (year: string, month: string) => {
    const days = [];
    const daysInMonth = year && month ? new Date(parseInt(year), parseInt(month), 0).getDate() : 31;
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      days.push({ label: dayStr, value: dayStr });
    }
    return days;
  };

  const generateHours = () => {
    const hours = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      hours.push({ label: hourStr, value: hourStr });
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let minute = 0; minute < 60; minute += 15) { // 15-minute intervals
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
        minute: '00'
      };
    }
    try {
      const date = new Date(dateString);
      return {
        year: date.getFullYear().toString(),
        month: (date.getMonth() + 1).toString().padStart(2, '0'),
        day: date.getDate().toString().padStart(2, '0'),
        hour: date.getHours().toString().padStart(2, '0'),
        minute: date.getMinutes().toString().padStart(2, '0')
      };
    } catch {
      const now = new Date();
      return {
        year: now.getFullYear().toString(),
        month: (now.getMonth() + 1).toString().padStart(2, '0'),
        day: now.getDate().toString().padStart(2, '0'),
        hour: now.getHours().toString().padStart(2, '0'),
        minute: '00'
      };
    }
  };

  const handleEstimatedDateChange = () => {
    const isoDate = assembleDateFromPickers(estimatedYear, estimatedMonth, estimatedDay, estimatedHour, estimatedMinute);
    if (isoDate) {
      handleInputChange('estimated_completion', isoDate);
    }
  };

  const handleActualDateChange = () => {
    const isoDate = assembleDateFromPickers(actualYear, actualMonth, actualDay, actualHour, actualMinute);
    if (isoDate) {
      handleInputChange('actual_completion', isoDate);
    }
  };

  const getEstimatedDatePreview = (): string => {
    if (!estimatedYear || !estimatedMonth || !estimatedDay || !estimatedHour || !estimatedMinute) {
      return t('orders.selectAllFields') as string;
    }
    try {
      const date = new Date(parseInt(estimatedYear), parseInt(estimatedMonth) - 1, parseInt(estimatedDay), parseInt(estimatedHour), parseInt(estimatedMinute));
      const lang = i18n.language; // Get current language

      const dayFormatted = date.getDate().toString().padStart(2, '0');
      let monthName = date.toLocaleString(lang, { month: 'long' });
      monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1); // Capitalize first letter
      const yearFormatted = date.getFullYear();

      const finalFormattedDate = lang === 'es' ? `${dayFormatted} de ${monthName} de ${yearFormatted}` : `${monthName} ${dayFormatted}, ${yearFormatted}`;
      
      const formattedTime = date.toLocaleTimeString(lang, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${finalFormattedDate}, ${formattedTime}`;
    } catch {
      return t('orders.invalidDate') as string;
    }
  };

  const getActualDatePreview = (): string => {
    if (!actualYear || !actualMonth || !actualDay || !actualHour || !actualMinute) {
      return t('orders.selectAllFields') as string;
    }
    try {
      const date = new Date(parseInt(actualYear), parseInt(actualMonth) - 1, parseInt(actualDay), parseInt(actualHour), parseInt(actualMinute));
      const lang = i18n.language; // Get current language

      const dayFormatted = date.getDate().toString().padStart(2, '0');
      let monthName = date.toLocaleString(lang, { month: 'long' });
      monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1); // Capitalize first letter
      const yearFormatted = date.getFullYear();

      const finalFormattedDate = lang === 'es' ? `${dayFormatted} de ${monthName} de ${yearFormatted}` : `${monthName} ${dayFormatted}, ${yearFormatted}`;

      const formattedTime = date.toLocaleTimeString(lang, {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
      return `${finalFormattedDate}, ${formattedTime}`;
    } catch {
      return t('orders.invalidDate') as string;
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

  const openActualDatePicker = () => {
    const parsed = parseDateToPickers(formData.actual_completion);
    setActualYear(parsed.year);
    setActualMonth(parsed.month);
    setActualDay(parsed.day);
    setActualHour(parsed.hour);
    setActualMinute(parsed.minute);
    setShowActualDatePicker(true);
  };

  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    } catch {
      return dateString;
    }
  };



  const handleFilesChanged = (files: FileSelection[]) => {
    setSelectedFiles(files);
  };

  const handleFileUploadComplete = (_result: MultipleFileUploadResult) => {
    // This handler will be called by the FileUploader internally. No additional logic needed here for now.
  };

  const handleFileUploadError = (error: string) => {
    // Prefer Toast over Alert/handleError to avoid Activity issues on Android
    errorService.logError(new Error(error), {
      component: 'EditOrderScreen',
      operation: 'handleFileUploadError',
      orderUuid,
      showAlert: false,
    });
    Toast.show({ type: 'error', text1: t('common.error') as string, text2: error, visibilityTime: 3000 });
  };

  const handleReset = () => {
    Alert.alert(
      t('editOrder.resetChanges') as string,
      t('editOrder.confirmReset') as string,
      [
        {text: t('common.cancel') as string, style: 'cancel'},
        {
          text: t('common.reset') as string,
          style: 'destructive',
          onPress: () => {
            setFormData(originalFormData); // Reset to original form data
            setFormErrors({});
            clearError();
            errorService.logSuccess('resetForm', {
              component: 'EditOrderScreen',
              orderUuid,
            });
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    if (__DEV__) console.log('DEBUG EditOrderScreen: handleSubmit called');
    if (!validateForm()) {
      if (__DEV__) console.log('DEBUG EditOrderScreen: form validation failed');
      return;
    }

    try {
      setIsSubmitting(true);
      clearError();

      if (__DEV__) {
        try {
          console.log('DEBUG EditOrderScreen: selectedFiles count:', selectedFiles.length);
          selectedFiles.forEach((f, idx) => console.log(`DEBUG EditOrderScreen: file[${idx}]`, { name: f.name, type: f.type, size: f.size, uri: f.uri }));
        } catch (_) {}
      }

      // Prepare data - only send fields with content AND that have changed
      const dataToSend: Record<string, string | string[]> = {};
      Object.entries(formData).forEach(([key, value]) => {
        const originalValue = originalFormData[key as keyof FormData];
        const hasContent = (typeof value === 'string' && value.trim()) || (Array.isArray(value) && value.length > 0);
        const hasChanged = JSON.stringify(value) !== JSON.stringify(originalValue);

        if (hasContent && hasChanged) {
          if (key === 'estimated_completion' || key === 'actual_completion') {
            try {
              const date = new Date(value as string);
              if (!isNaN(date.getTime())) {
                dataToSend[key] = date.toISOString();
              }
            } catch (error) {
              console.warn(`Invalid date format for ${key}:`, value);
            }
          } else if (key === 'category_ids') {
            dataToSend[key] = value as string[];
          } else {
            dataToSend[key] = value as string;
          }
        }
      });

      const hasFieldChanges = Object.keys(dataToSend).length > 0;
      const hasFiles = selectedFiles.length > 0;
      if (__DEV__) console.log('DEBUG EditOrderScreen: computed changes', { hasFieldChanges, hasFiles, dataToSend });

      if (!hasFieldChanges && !hasFiles) {
        Toast.show({
          type: 'info',
          text1: (t('common.info') as string) || 'Info',
          text2: 'No hay cambios para enviar.',
          visibilityTime: 3000,
        });
        setIsSubmitting(false);
        return;
      }

      // 1) Submit field changes first (if any)
      if (hasFieldChanges) {
        const formDataToSend = new URLSearchParams();
        const debugPairs: Array<{ k: string; v: string }> = [];
        Object.entries(dataToSend).forEach(([key, value]) => {
          if (key === 'category_ids' && Array.isArray(value)) {
            // Backend expects categories[] as array of IDs
            value.forEach(id => { formDataToSend.append('categories[]', id); debugPairs.push({ k: 'categories[]', v: String(id) }); });
          } else {
            formDataToSend.append(key, value as string);
            debugPairs.push({ k: key, v: String(value) });
          }
        });
        if (__DEV__) console.log('DEBUG EditOrderScreen: PUT payload (urlencoded pairs):', debugPairs);

        const response = await httpClient.put(
          `/v1/orders/${orderUuid}`,
          formDataToSend.toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );

        if (__DEV__) console.log('DEBUG EditOrderScreen: PUT response', { status: response.status, dataKeys: Object.keys(response?.data || {}) });
        if (!(response.status >= 200 && response.status < 300)) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        await errorService.logSuccess('updateOrder', {
          component: 'EditOrderScreen',
          orderUuid,
          formData: dataToSend,
        });
      }

      // 2) Upload files in a single request (if backend supports multi-file)
      if (hasFiles) {
        const t0 = Date.now();
        if (__DEV__) console.log('DEBUG EditOrderScreen: starting attachments upload, fileCount:', selectedFiles.length);
        setIsUploadingFiles(true);
        setTotalFiles(selectedFiles.length);
        setCurrentFileIndex(0);
        setUploadProgressPercent(0);
        if (selectedFiles.length === 1) {
          // Single file -> use field name 'file'
          const file = selectedFiles[0];
          const singleFormData = new FormData();
          singleFormData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.type,
          } as any);

          if (__DEV__) console.log('DEBUG EditOrderScreen: single-file formData ready');
          const singleResp = await httpClient.post(
            `/v1/orders/${orderUuid}/attachments`,
            singleFormData,
            {
              timeout: 60000,
              headers: { 'Content-Type': 'multipart/form-data' },
              onUploadProgress: (evt: any) => {
                if (evt?.total) {
                  const pct = Math.round((evt.loaded * 100) / evt.total);
                  setUploadProgressPercent(Math.min(100, Math.max(0, pct)));
                }
                setCurrentFileIndex(1);
              },
            }
          );

          if (__DEV__) console.log('DEBUG EditOrderScreen: single upload response', { status: singleResp.status, dataKeys: Object.keys(singleResp?.data || {}) });
          if (!(singleResp.status >= 200 && singleResp.status < 300)) {
            throw new Error(`HTTP ${singleResp.status}: ${singleResp.statusText}`);
          }

          await errorService.logSuccess('uploadAttachmentsSingle', {
            component: 'EditOrderScreen',
            orderUuid,
            fileCount: 1,
          });
        } else {
          // Multiple files -> try batch with 'files[]'
          try {
            const fileUploadFormData = new FormData();
            // Laravel will treat 'files[]' as an array under 'files'
            selectedFiles.forEach((file) => {
              fileUploadFormData.append('files[]', {
                uri: file.uri,
                name: file.name,
                type: file.type,
              } as any);
            });

            if (__DEV__) console.log('DEBUG EditOrderScreen: batch formData ready (files[])');
            const uploadResp = await httpClient.post(
              `/v1/orders/${orderUuid}/attachments`,
              fileUploadFormData,
              {
                timeout: 120000,
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (evt: any) => {
                  let pct = 0;
                  if (evt?.total) {
                    pct = Math.round((evt.loaded * 100) / evt.total);
                  }
                  const clamped = Math.min(100, Math.max(0, pct));
                  setUploadProgressPercent(clamped);
                  // Approximate current file index with progress
                  const approxIndex = Math.max(1, Math.min(selectedFiles.length, Math.ceil((clamped / 100) * selectedFiles.length)));
                  setCurrentFileIndex(approxIndex);
                },
              }
            );

            if (__DEV__) console.log('DEBUG EditOrderScreen: batch upload response', { status: uploadResp.status, dataKeys: Object.keys(uploadResp?.data || {}) });
            if (!(uploadResp.status >= 200 && uploadResp.status < 300)) {
              throw new Error(`HTTP ${uploadResp.status}: ${uploadResp.statusText}`);
            }

            await errorService.logSuccess('uploadAttachmentsBatch', {
              component: 'EditOrderScreen',
              orderUuid,
              fileCount: selectedFiles.length,
            });
          } catch (batchErr: any) {
            if (__DEV__) console.log('DEBUG EditOrderScreen: batch upload failed', { status: batchErr?.response?.status, data: batchErr?.response?.data });
            // Fallback: try single-file uploads if validation error (e.g., 422/400)
            const status = batchErr?.response?.status;
            await errorService.logError(batchErr as Error, {
              component: 'EditOrderScreen',
              operation: 'uploadAttachmentsBatch',
              orderUuid,
              httpStatus: status,
              responseData: batchErr?.response?.data,
            });

          if (typeof status !== 'number' || status < 200 || status >= 300) {
              // Attempt single uploads one by one with field name 'file'
              for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                const singleFormData = new FormData();
                singleFormData.append('file', {
                  uri: file.uri,
                  name: file.name,
                  type: file.type,
                } as any);

                // Initialize combined progress for this file
                setUploadProgressPercent(Math.round((i / selectedFiles.length) * 100));
                const singleResp = await httpClient.post(
                  `/v1/orders/${orderUuid}/attachments`,
                  singleFormData,
                  {
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
                  }
                );

                if (__DEV__) console.log('DEBUG EditOrderScreen: fallback single upload response', { status: singleResp.status, dataKeys: Object.keys(singleResp?.data || {}) });
                if (!(singleResp.status >= 200 && singleResp.status < 300)) {
                  throw new Error(`HTTP ${singleResp.status}: ${singleResp.statusText}`);
                }
              }

              await errorService.logSuccess('uploadAttachmentsFallbackSingle', {
                component: 'EditOrderScreen',
                orderUuid,
                fileCount: selectedFiles.length,
              });
            } else {
              throw batchErr;
            }
          }
        }
        const elapsed = Date.now() - t0;
        if (__DEV__) console.log('DEBUG EditOrderScreen: attachments upload finished, elapsed ms:', elapsed);
        setIsUploadingFiles(false);
        setUploadProgressPercent(0);
        setCurrentFileIndex(0);
        setTotalFiles(0);
      }

      // All operations succeeded
      if (__DEV__) console.log('DEBUG EditOrderScreen: all operations succeeded, showing success toast');
      Toast.show({
        type: 'success',
        text1: t('common.success') as string,
        text2: t('editOrder.updateSuccess') as string,
        visibilityTime: 3000,
        onHide: () => {
          // Clear orders cache and navigate to Orders tab
          setOrders([]);
          navigation.navigate('Main', { screen: 'Orders' } as any);
        },
      });
    } catch (error: any) {
      if (__DEV__) console.log('DEBUG EditOrderScreen: submit failed', { status: error?.response?.status, data: error?.response?.data, message: error?.message });
      await errorService.logError(error as Error, {
        component: 'EditOrderScreen',
        operation: 'submitEditOrder',
        orderUuid,
        formData,
        httpStatus: error?.response?.status,
        responseData: error?.response?.data,
      });

      let errorMessage = t('editOrder.updateError') as string;

      if (error?.response?.status === 422) {
        errorMessage = t('editOrder.validationError') as string;
        if (error.response?.data?.errors) {
          const backendErrors: FormErrors = {};
          Object.entries(error.response.data.errors).forEach(([key, value]) => {
            backendErrors[key as keyof FormErrors] = Array.isArray(value) ? value.join(', ') : String(value);
          });
          setFormErrors(prev => ({ ...prev, ...backendErrors }));
        }
      } else if (error?.response?.status === 404) {
        errorMessage = t('editOrder.orderNotFound') as string;
      } else if (error?.response?.status === 403) {
        errorMessage = t('editOrder.noPermission') as string;
      }

      Toast.show({
        type: 'error',
        text1: t('common.error') as string,
        text2: errorMessage,
        visibilityTime: 3000,
      });
    } finally {
      setIsSubmitting(false);
      // Ensure progress modal is closed on any failure
      setIsUploadingFiles(false);
    }
  };

  const statuses = [
    {key: 'open', label: t('orders.statuses.open') as string, value: 'Open'},
    {key: 'inProgress', label: t('orders.statuses.inProgress') as string, value: 'In Progress'},
    {key: 'readyForDelivery', label: t('orders.statuses.readyForDelivery') as string, value: 'Ready for delivery'},
    {key: 'delivered', label: t('orders.statuses.delivered') as string, value: 'Delivered'},
    {key: 'paid', label: t('orders.statuses.paid') as string, value: 'Paid'},
    {key: 'returned', label: t('orders.statuses.returned') as string, value: 'Returned'},
    {key: 'notPaid', label: t('orders.statuses.notPaid') as string, value: 'Not paid'},
    {key: 'cancelled', label: t('orders.statuses.cancelled') as string, value: 'Cancelled'},
  ];

  const priorities: Array<{key: string; label: string; value: 'Low' | 'Normal' | 'High' | 'Urgent'}> = [
    {key: 'low', label: t('orders.priorities.low') as string, value: 'Low'},
    {key: 'normal', label: t('orders.priorities.normal') as string, value: 'Normal'},
    {key: 'high', label: t('orders.priorities.high') as string, value: 'High'},
    {key: 'urgent', label: t('orders.priorities.urgent') as string, value: 'Urgent'},
  ];

  const canEditActualCompletion = user?.role === UserRole.ADMINISTRATOR || user?.role === UserRole.SUPER_ADMINISTRATOR;
  const showActualCompletionField = canEditActualCompletion &&
    ['Ready for delivery', 'Delivered', 'Paid', 'Returned', 'Cancelled'].includes(formData.status);

  const renderCategoryItem = ({item}: {item: Category}) => {
    const isSelected = formData.category_ids.includes(item.id.toString());
    const textColor = styles.customerName.color;
    const descriptionColor = styles.customerDetails.color;

    // Debugging: Log the item.color to see its value
    console.log(`Category ID: ${item.id}, Category Color: ${item.color}`);

    // Convert color name to hex if necessary
    const categoryHexColor = colorNameToHex(item.color);

    return (
      <TouchableOpacity
        style={[
          styles.customerItem,
          isSelected && {backgroundColor: LIGHT_GRAY, borderColor: GRAY, borderWidth: 1},
        ]}
        onPress={() => handleCategorySelect(item)}>
        <View style={styles.categoryNameContainer}>
          <LedIndicator color={getLedTone(categoryHexColor || LIGHT_BLUE)} />
          <View>
            <Text style={[
              styles.customerName,
              {color: textColor}
            ]}>
              {item.name}
            </Text>
            <Text style={[
              styles.customerDetails,
              {color: descriptionColor}
            ]}>
              {item.description}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmployeeItem = ({item}: {item: User}) => (
    <TouchableOpacity
      style={styles.customerItem}
      onPress={() => handleEmployeeSelect(item)}>
      <Text style={styles.customerName}>
        {item.firstName} {item.lastName}
      </Text>
      <Text style={styles.customerDetails}>
        {item.email} • {item.company || t('common.noCompany') as string}
      </Text>
    </TouchableOpacity>
  );


  const getCategoryName = (categoryIds: string[]): string => {
    if (!categoryIds || categoryIds.length === 0) {
      return '';
    }
    // Try from loaded categories
    let names = categoryIds.map(id => categories.find(c => c.id.toString() === id)?.name || '').filter(Boolean);
    if (names.length === 0) {
      // Fallback to orderData.categories (from backend) if available
      const backendCats: any[] = Array.isArray((orderData as any)?.categories) ? (orderData as any).categories : [];
      names = categoryIds.map(id => {
        const found = backendCats.find((c: any) => String(c.id) === String(id));
        return found?.name || found?.title || '';
      }).filter(Boolean);
    }
    return names.join(', ');
  };

  const getEmployeeName = (employeeId: string): string => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) return `${employee.firstName} ${employee.lastName}`;
    // Fallback to orderInfo assigned_to
    const anyAssigned: any = (orderData as any)?.assigned_to || orderInfo?.assigned_to;
    if (anyAssigned && String(anyAssigned.id) === String(employeeId)) return String(anyAssigned.full_name || '');
    return '';
  };

  const hasFieldChanges = React.useMemo(() => {
    let changed = false;
    Object.entries(formData).forEach(([key, value]) => {
      const originalValue = originalFormData[key as keyof FormData] as any;
      const hasContent = (typeof value === 'string' && value.trim().length > 0) || (Array.isArray(value) && value.length > 0);
      const hasChanged = JSON.stringify(value) !== JSON.stringify(originalValue);
      if (hasContent && hasChanged) changed = true;
    });
    return changed;
  }, [formData, originalFormData]);

  const canSubmit = !isSubmitting && (hasFieldChanges || selectedFiles.length > 0);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>{t('editOrder.loadingOrder') as string}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>

        {hasError && (
          <ErrorMessage 
            error={error}
            onRetry={clearError}
            onDismiss={clearError}
          />
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('orders.orderInfo') as string}</Text>
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('orders.uuid') as string}:</Text>
              <Text style={styles.infoValue}>{orderInfo?.uuid || '-'}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('orders.customer') as string}:</Text>
              <Text style={styles.infoValue}>{orderInfo?.customer?.full_name || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('orders.assignedTo') as string}:</Text>
              <Text style={styles.infoValue}>{orderInfo?.assigned_to?.full_name || '-'}</Text>
              {/* TODO: Make this field editable for Super Administrator and Administrator roles
                  when we have an endpoint to get users from the same company */}
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('orders.createdBy') as string}:</Text>
              <Text style={styles.infoValue}>{orderInfo?.created_by?.full_name || '-'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('orders.createdAt') as string}:</Text>
              <Text style={styles.infoValue}>{orderInfo?.created_at ? new Date(orderInfo.created_at).toLocaleString() : '-'}</Text>
            </View>
            
            {orderInfo?.updated_by && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('orders.updatedBy') as string}:</Text>
              <Text style={styles.infoValue}>{orderInfo?.updated_by?.full_name || '-'}</Text>
            </View>
            )}
            
            {orderInfo?.updated_at !== orderInfo?.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{t('orders.updatedAt') as string}:</Text>
              <Text style={styles.infoValue}>{orderInfo?.updated_at ? new Date(orderInfo.updated_at).toLocaleString() : '-'}</Text>
            </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('createOrder.orderDetails') as string}</Text>
          <View style={styles.card}>
            <Text style={styles.label}>{t('orders.orderTitle') as string}</Text>
            <TextInput
              style={[styles.input, formErrors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder={t('createOrder.orderTitle') as string}
            />
            {formErrors.title && (
              <Text style={styles.errorText}>{formErrors.title}</Text>
            )}

            <Text style={styles.label}>{t('orders.description') as string}</Text>
            <TextInput
              style={[styles.input, styles.textArea, formErrors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder={t('createOrder.orderDescription') as string}
              multiline
              numberOfLines={4}
            />
            {formErrors.description && (
              <Text style={styles.errorText}>{formErrors.description}</Text>
            )}

            <Text style={styles.label}>{t('orders.category') as string}</Text>
            <TouchableOpacity
              style={[styles.customerSelector, formErrors.category_ids && styles.inputError]}
              onPress={() => setShowCategoryModal(true)}>
              <Text style={[styles.customerSelectorText, !formData.category_ids.length && styles.placeholder]}>
                {formData.category_ids.length > 0 ? getCategoryName(formData.category_ids) : t('createOrder.selectCategory') as string}
              </Text>
            </TouchableOpacity>
            {formErrors.category_ids && (
              <Text style={styles.errorText}>{formErrors.category_ids}</Text>
            )}

            <Text style={styles.label}>{t('orders.assignedTo') as string}</Text>
            <TouchableOpacity
              style={[styles.customerSelector, formErrors.assigned_to && styles.inputError]}
              onPress={() => setShowEmployeeModal(true)}>
              <Text style={[styles.customerSelectorText, !formData.assigned_to && styles.placeholder]}>
                {getEmployeeName(formData.assigned_to) || (t('createOrder.selectEmployee') as string)}
              </Text>
            </TouchableOpacity>
            {formErrors.assigned_to && (
              <Text style={styles.errorText}>{formErrors.assigned_to}</Text>
            )}

            <Text style={styles.label}>{t('orders.estimatedCompletion') as string}</Text>
            <TouchableOpacity
              style={[styles.datePickerButton, formErrors.estimated_completion && styles.inputError]}
              onPress={openEstimatedDatePicker}>
              <Text style={[styles.datePickerText, !formData.estimated_completion && styles.placeholder]}>
                {formData.estimated_completion ? formatDateForDisplay(formData.estimated_completion) : t('orders.selectDate') as string}
              </Text>
            </TouchableOpacity>
            {formErrors.estimated_completion && (
              <Text style={styles.errorText}>{formErrors.estimated_completion}</Text>
            )}

            <Text style={styles.label}>{t('orders.notes') as string}</Text>
            <TextInput
              style={[styles.input, styles.textArea, formErrors.notes && styles.inputError]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder={t('orders.notesPlaceholder') as string}
              multiline
              numberOfLines={3}
            />
            {formErrors.notes && (
              <Text style={styles.errorText}>{formErrors.notes}</Text>
            )}

            <Text style={styles.label}>{t('orders.status') as string}</Text>
            <View style={styles.statusContainer}>
              {statuses.map((status) => (
                <TouchableOpacity
                  key={status.key}
                  style={[
                    styles.statusButton,
                    formData.status === status.value && styles.statusButtonActive,
                  ]}
                  onPress={() => handleInputChange('status', status.value)}>
                  <Text
                    style={[
                      styles.statusButtonText,
                      formData.status === status.value && styles.statusButtonTextActive,
                    ]}>
                    {status.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {formErrors.status && (
              <Text style={styles.errorText}>{formErrors.status}</Text>
            )}

            {showActualCompletionField && (
              <>
                <Text style={styles.label}>{t('orders.actualCompletion') as string}</Text>
                <TouchableOpacity
                  style={[styles.datePickerButton, formErrors.actual_completion && styles.inputError]}
                  onPress={openActualDatePicker}>
                  <Text style={[styles.datePickerText, !formData.actual_completion && styles.placeholder]}>
                    {formData.actual_completion ? formatDateForDisplay(formData.actual_completion) : t('orders.selectDate') as string}
                  </Text>
                </TouchableOpacity>
                {formErrors.actual_completion && (
                  <Text style={styles.errorText}>{formErrors.actual_completion}</Text>
                )}
              </>
            )}

            <Text style={styles.label}>{t('orders.priority') as string}</Text>
            <View style={styles.priorityContainer}>
              {priorities.map((priority) => (
                <TouchableOpacity
                  key={priority.key}
                  style={[
                    styles.priorityButton,
                    formData.priority === priority.value && styles.priorityButtonActive,
                  ]}
                  onPress={() => handleInputChange('priority', priority.value)}>
                  <Text
                    style={[
                      styles.priorityButtonText,
                      formData.priority === priority.value && styles.priorityButtonTextActive,
                    ]}>
                    {priority.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {formErrors.priority && (
              <Text style={styles.errorText}>{formErrors.priority}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('editOrder.attachments') as string}</Text>
          <FileUploader
            entityType="order"
            entityId={orderUuid}
            title={t('editOrder.attachments') as string}
            subtitle={t('editOrder.attachmentsDescription') as string}
            maxFiles={10}
            allowMultiple={true}
            isScreenFocused={isFocused}
            allowedFileTypes={[
              'image/jpeg',
              'image/png',
              'image/gif',
              'image/heic',
              'image/webp',
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'text/plain',
            ]}
            showUploadButton={false} // Modified to handle upload on main form submit
            onFilesChanged={handleFilesChanged}
            onUploadComplete={handleFileUploadComplete}
            onUploadError={handleFileUploadError}
          />
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            disabled={isSubmitting}>
            <Text style={styles.resetButtonText}>{t('editOrder.resetChanges') as string}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}>
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
            <Text style={styles.submitButtonText}>{t('editOrder.saveChanges') as string}</Text>
            )}
          </TouchableOpacity>
        </View>


        {/* Category Selection Modal */}
        <Modal
          visible={showCategoryModal}
          animationType="slide"
          presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectCategory') as string}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCategoryModal(false)}>
                <Text style={styles.closeButtonText}>{t('common.done') as string}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={categories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.customerList}
            />
          </View>
        </Modal>

        {/* Employee Selection Modal */}
        <Modal
          visible={showEmployeeModal}
          animationType="slide"
          presentationStyle="pageSheet">
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createOrder.selectEmployee') as string}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowEmployeeModal(false)}>
                <Text style={styles.closeButtonText}>{t('common.close') as string}</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={employees}
              renderItem={renderEmployeeItem}
              keyExtractor={(item) => item.id}
              style={styles.customerList}
            />
          </View>
        </Modal>

        {/* Custom Date Picker Modals */}
        <Modal
          visible={showEstimatedDatePicker}
          animationType="slide"
          transparent={true}>
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalContainer}>
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={() => setShowEstimatedDatePicker(false)}>
                  <Text style={styles.dateModalCancel}>{t('common.cancel') as string}</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>{t('orders.estimatedCompletion') as string}</Text>
                <TouchableOpacity onPress={() => {
                  handleEstimatedDateChange();
                  setShowEstimatedDatePicker(false);
                }}>
                  <Text style={styles.dateModalConfirm}>{t('common.ok') as string}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.datePickerContent}>
                <View style={styles.pickerRow}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.year') as string}</Text>
                    <Picker
                      selectedValue={estimatedYear}
                      onValueChange={setEstimatedYear}
                      style={styles.picker}>
                      {generateYears().map(year => (
                        <Picker.Item key={year.value} label={year.label} value={year.value} />
                      ))}
                    </Picker>
                  </View>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.month') as string}</Text>
                    <Picker
                      selectedValue={estimatedMonth}
                      onValueChange={setEstimatedMonth}
                      style={styles.picker}>
                      {generateMonths().map(month => (
                        <Picker.Item key={month.value} label={month.label} value={month.value} />
                      ))}
                    </Picker>
                  </View>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.day') as string}</Text>
                    <Picker
                      selectedValue={estimatedDay}
                      onValueChange={setEstimatedDay}
                      style={styles.picker}>
                      {generateDays(estimatedYear, estimatedMonth).map(day => (
                        <Picker.Item key={day.value} label={day.label} value={day.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.pickerRow}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.hour') as string}</Text>
                    <Picker
                      selectedValue={estimatedHour}
                      onValueChange={setEstimatedHour}
                      style={styles.picker}>
                      {generateHours().map(hour => (
                        <Picker.Item key={hour.value} label={hour.label} value={hour.value} />
                      ))}
                    </Picker>
                  </View>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.minute') as string}</Text>
                    <Picker
                      selectedValue={estimatedMinute}
                      onValueChange={setEstimatedMinute}
                      style={styles.picker}>
                      {generateMinutes().map(minute => (
                        <Picker.Item key={minute.value} label={minute.label} value={minute.value} />
                      ))}
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

        <Modal
          visible={showActualDatePicker}
          animationType="slide"
          transparent={true}>
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalContainer}>
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={() => setShowActualDatePicker(false)}>
                  <Text style={styles.dateModalCancel}>{t('common.cancel') as string}</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>{t('orders.actualCompletion') as string}</Text>
                <TouchableOpacity onPress={() => {
                  handleActualDateChange();
                  setShowActualDatePicker(false);
                }}>
                  <Text style={styles.dateModalConfirm}>{t('common.ok') as string}</Text>
                </TouchableOpacity>
              </View>
            
              <View style={styles.datePickerContent}>
                <View style={styles.pickerRow}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.year') as string}</Text>
                    <Picker
                      selectedValue={actualYear}
                      onValueChange={setActualYear}
                      style={styles.picker}>
                      {generateYears().map(year => (
                        <Picker.Item key={year.value} label={year.label} value={year.value} />
                      ))}
                    </Picker>
                  </View>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.month') as string}</Text>
                    <Picker
                      selectedValue={actualMonth}
                      onValueChange={setActualMonth}
                      style={styles.picker}>
                      {generateMonths().map(month => (
                        <Picker.Item key={month.value} label={month.label} value={month.value} />
                      ))}
                    </Picker>
                  </View>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.day') as string}</Text>
                    <Picker
                      selectedValue={actualDay}
                      onValueChange={setActualDay}
                      style={styles.picker}>
                      {generateDays(actualYear, actualMonth).map(day => (
                        <Picker.Item key={day.value} label={day.label} value={day.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.pickerRow}>
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.hour') as string}</Text>
                    <Picker
                      selectedValue={actualHour}
                      onValueChange={setActualHour}
                      style={styles.picker}>
                      {generateHours().map(hour => (
                        <Picker.Item key={hour.value} label={hour.label} value={hour.value} />
                      ))}
                    </Picker>
                  </View>
                  
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>{t('orders.minute') as string}</Text>
                    <Picker
                      selectedValue={actualMinute}
                      onValueChange={setActualMinute}
                      style={styles.picker}>
                      {generateMinutes().map(minute => (
                        <Picker.Item key={minute.value} label={minute.label} value={minute.value} />
                      ))}
                    </Picker>
                  </View>
                </View>
                
                <View style={styles.datePreviewContainer}>
                  <Text style={styles.datePreviewLabel}>{t('orders.datePreview') as string}:</Text>
                  <Text style={styles.datePreviewText}>{getActualDatePreview()}</Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>

      </ScrollView>

      {/* Upload Progress Modal */}
      <Modal
        visible={isUploadingFiles}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.uploadModalOverlay}>
          <View style={styles.uploadModalContainer}>
            <Text style={styles.uploadTitle}>{t('fileUploader.status.uploading') as string || 'Uploading files...'}</Text>
            <Text style={styles.uploadSubtitle}>
              {currentFileIndex > 0 && totalFiles > 0
                ? `${t('common.file') as string || 'File'} ${currentFileIndex}/${totalFiles}`
                : `${totalFiles} ${t('fileUploader.files') as string || 'files'}`}
            </Text>
            <ProgressBar progress={uploadProgressPercent / 100} style={styles.uploadProgressBar} />
            <Text style={styles.uploadPercent}>
              {uploadProgressPercent >= 99 ? (t('common.finalizing') as string || 'Finalizando...') : `${uploadProgressPercent}%`}
            </Text>
          </View>
        </View>
      </Modal>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
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
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  customerSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
  },
  customerSelectorText: {
    fontSize: 16,
    color: '#333333',
  },
  placeholder: {
    color: '#999999',
  },
  datePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#f9f9f9',
    marginBottom: 15,
    justifyContent: 'center',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333333',
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  statusButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 2,
    marginVertical: 2,
    alignItems: 'center',
    minWidth: '45%',
  },
  statusButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  statusButtonTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priorityButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  priorityButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  priorityButtonTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  buttonContainer: {
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  resetButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginBottom: 5,
  },
  helpText: {
    color: '#666666',
    fontSize: 11,
    marginTop: -15,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: '#333333',
    flex: 2,
    textAlign: 'right',
  },
  uploadModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadModalContainer: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  uploadProgressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  uploadPercent: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  customerList: {
    flex: 1,
  },
  customerItem: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  customerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 4,
  },
  categoryNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  customerDetails: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  customerType: {
    fontSize: 12,
    color: '#999999',
    fontStyle: 'italic',
  },
  confirmButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  // New improved date modal styles
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  dateModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    maxHeight: '85%', // Adjusted to occupy much more space, covering potential transparent gap
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  dateModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
    textAlign: 'center',
  },
  dateModalCancel: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  dateModalConfirm: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  datePickerContent: {
    padding: 10, // Reduced padding
    // paddingBottom: 20, // Removed paddingBottom to close gap
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0, // Removed margin to close gap
  },
  pickerContainer: {
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 2, // Reduced padding
  },
  pickerLabel: {
    fontSize: 11, // Slightly smaller font
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 3, // Reduced margin
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  picker: {
    height: 50, // Reduced height
    backgroundColor: 'transparent',
  },
  datePreviewContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 12,
    margin: 10,
    marginBottom: 20, // Increased margin to push content down
    alignItems: 'center',
  },
  datePreviewLabel: {
    fontSize: 13, // Slightly smaller font
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: 3,
  },
  datePreviewText: {
    fontSize: 15, // Slightly smaller font
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});

export default EditOrderScreen; 