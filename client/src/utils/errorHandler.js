/**
 * Safely extract error message from API response
 */
export const getErrorMessage = (error) => {
  if (!error) return "An unexpected error occurred";
  
  // Handle FastAPI validation error format: {detail: [...]}
  if (error.response?.data?.detail) {
    const detail = error.response.data.detail;
    
    if (Array.isArray(detail)) {
      // Format validation errors
      return detail.map(err => {
        const loc = err.loc?.join('.') || '';
        const msg = err.msg || 'Validation error';
        return loc ? `${loc}: ${msg}` : msg;
      }).join('; ');
    }
    
    if (typeof detail === 'string') {
      return detail;
    }
    
    return JSON.stringify(detail);
  }
  
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.message) {
    return error.message;
  }
  
  return "Failed to fetch data";
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error) => {
  return error.response?.data?.detail && Array.isArray(error.response.data.detail);
};