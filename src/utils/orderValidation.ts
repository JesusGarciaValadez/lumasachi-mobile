export interface OrderFormData {
  customerId: string;
  title: string;
  description: string;
  customerName?: string;
  priority?: string;
  category?: string;
  status?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage: string;
  missingFields?: string[];
}

export const validateOrderForm = (formData: OrderFormData, t?: (key: string) => string): ValidationResult => {
  const missingFields: string[] = [];
  
  // Check for missing required fields
  if (!formData.customerId) {
    missingFields.push(t ? t('orders.customer') : 'Customer');
  }
  if (!formData.title) {
    missingFields.push(t ? t('orders.orderTitle') : 'Title');
  }
  if (!formData.description) {
    missingFields.push(t ? t('orders.description') : 'Description');
  }

  if (missingFields.length > 0) {
    return {
      isValid: false,
      errorMessage: 'missingFields',
      missingFields: missingFields
    };
  }

  if (formData.title.trim().length < 3) {
    return {
      isValid: false,
      errorMessage: 'titleTooShort'
    };
  }

  if (formData.description.trim().length < 10) {
    return {
      isValid: false,
      errorMessage: 'descriptionTooShort'
    };
  }

  return {
    isValid: true,
    errorMessage: ''
  };
}; 