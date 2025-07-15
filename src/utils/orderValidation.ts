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
}

export const validateOrderForm = (formData: OrderFormData): ValidationResult => {
  if (!formData.customerId || !formData.title || !formData.description) {
    return {
      isValid: false,
      errorMessage: 'missingFields'
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