import { AxiosError } from 'axios';

export const API_ERRORS = {
  UNAUTHORIZED: 'غير مصرح لك بالوصول',
  NOT_FOUND: 'لم يتم العثور على البيانات المطلوبة',
  VALIDATION_ERROR: 'يرجى التحقق من صحة البيانات المدخلة',
  SERVER_ERROR: 'حدث خطأ في الخادم',
  NETWORK_ERROR: 'فشل الاتصال بالخادم',
  MAINTENANCE_MODE: 'النظام تحت الصيانة حالياً',
  FORBIDDEN: 'ليس لديك صلاحية للقيام بهذا الإجراء',
  BAD_REQUEST: 'طلب غير صالح',
  CONFLICT: 'تعارض في البيانات',
  TIMEOUT: 'انتهت مهلة الاتصال بالخادم'
};

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    if (!error.response) {
      return error.message.includes('Network Error')
        ? API_ERRORS.NETWORK_ERROR
        : API_ERRORS.SERVER_ERROR;
    }

    switch (error.response.status) {
      case 400:
        return error.response.data?.detail || API_ERRORS.BAD_REQUEST;
      case 401:
        return API_ERRORS.UNAUTHORIZED;
      case 403:
        return API_ERRORS.FORBIDDEN;
      case 404:
        return API_ERRORS.NOT_FOUND;
      case 409:
        return API_ERRORS.CONFLICT;
      case 422:
        return API_ERRORS.VALIDATION_ERROR;
      case 503:
        return error.response.data?.detail || API_ERRORS.MAINTENANCE_MODE;
      default:
        if (error.response.status >= 500) {
          return API_ERRORS.SERVER_ERROR;
        }
        return 'حدث خطأ غير معروف';
    }
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      return API_ERRORS.TIMEOUT;
    }
    return error.message;
  }

  return 'حدث خطأ غير معروف';
};

export const handleApiError = (error: unknown, fallbackMessage?: string): string => {
  console.error('API Error:', error);
  return getErrorMessage(error) || fallbackMessage || 'حدث خطأ غير معروف';
};
