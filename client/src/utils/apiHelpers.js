/**
 * API Helper Functions
 */

// Format API error response
export const formatApiError = (error) => {
    if (error.response) {
        // Server responded with error status
        return {
            status: error.response.status,
            message: error.response.data?.detail || error.response.data?.message || 'Server error occurred',
            data: error.response.data
        };
    } else if (error.request) {
        // Request was made but no response received
        return {
            status: 0,
            message: 'No response from server. Please check your network connection.',
            data: null
        };
    } else {
        // Something happened in setting up the request
        return {
            status: -1,
            message: error.message || 'Unknown error occurred',
            data: null
        };
    }
};

// Create query string from filters object
export const createQueryString = (filters = {}) => {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value !== null && value !== undefined && value !== '') {
            if (Array.isArray(value)) {
                value.forEach(item => params.append(key, item));
            } else {
                params.append(key, value);
            }
        }
    });
    
    return params.toString();
};

// Validate required fields
export const validateRequiredFields = (data, requiredFields) => {
    const errors = {};
    
    requiredFields.forEach(field => {
        if (!data[field] || data[field].toString().trim() === '') {
            errors[field] = `${field.replace(/_/g, ' ')} is required`;
        }
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Format price
export const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};

// Calculate final price with discount
export const calculateFinalPrice = (price, discountType, discountValue) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    const numericDiscount = typeof discountValue === 'string' ? parseFloat(discountValue) : discountValue;
    
    if (discountType === 'PERCENT') {
        return numericPrice * (1 - numericDiscount / 100);
    } else if (discountType === 'FLAT') {
        return Math.max(numericPrice - numericDiscount, 0);
    } else {
        return numericPrice;
    }
};

// Format date
export const formatDate = (dateString, format = 'short') => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    if (format === 'short') {
        return date.toLocaleDateString();
    } else if (format === 'long') {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else if (format === 'datetime') {
        return date.toLocaleString();
    }
    
    return dateString;
};

// Get file extension
export const getFileExtension = (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
};

// Get file size in readable format
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Debounce function for search inputs
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Generate unique ID
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// Check if object is empty
export const isEmptyObject = (obj) => {
    return Object.keys(obj).length === 0;
};

// Deep clone object
export const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Merge objects
export const mergeObjects = (target, source) => {
    const output = { ...target };
    
    if (source) {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                output[key] = mergeObjects(target[key] || {}, source[key]);
            } else {
                output[key] = source[key];
            }
        });
    }
    
    return output;
};