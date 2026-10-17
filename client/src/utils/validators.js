/**
 * Form Validation Utilities
 */

// Validate email format
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate required field
export const validateRequired = (value, fieldName) => {
    if (!value || value.toString().trim() === '') {
        return `${fieldName} is required`;
    }
    return '';
};

// Validate minimum length
export const validateMinLength = (value, minLength, fieldName) => {
    if (value && value.length < minLength) {
        return `${fieldName} must be at least ${minLength} characters`;
    }
    return '';
};

// Validate maximum length
export const validateMaxLength = (value, maxLength, fieldName) => {
    if (value && value.length > maxLength) {
        return `${fieldName} must be less than ${maxLength} characters`;
    }
    return '';
};

// Validate numeric value
export const validateNumber = (value, fieldName) => {
    if (isNaN(value) || value === null || value === '') {
        return `${fieldName} must be a number`;
    }
    return '';
};

// Validate minimum value
export const validateMinValue = (value, minValue, fieldName) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue < minValue) {
        return `${fieldName} must be at least ${minValue}`;
    }
    return '';
};

// Validate maximum value
export const validateMaxValue = (value, maxValue, fieldName) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > maxValue) {
        return `${fieldName} must be less than or equal to ${maxValue}`;
    }
    return '';
};

// Validate positive number
export const validatePositiveNumber = (value, fieldName) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue < 0) {
        return `${fieldName} must be a positive number`;
    }
    return '';
};

// Validate integer
export const validateInteger = (value, fieldName) => {
    if (!Number.isInteger(Number(value))) {
        return `${fieldName} must be an integer`;
    }
    return '';
};

// Validate price
export const validatePrice = (price) => {
    const numPrice = parseFloat(price);
    
    if (isNaN(numPrice)) {
        return 'Price must be a number';
    }
    
    if (numPrice < 0) {
        return 'Price cannot be negative';
    }
    
    if (numPrice > 1000000) {
        return 'Price cannot exceed 1,000,000';
    }
    
    return '';
};

// Validate discount
export const validateDiscount = (discountType, discountValue) => {
    const numValue = parseFloat(discountValue);
    
    if (discountType === 'PERCENT') {
        if (isNaN(numValue)) {
            return 'Discount percentage must be a number';
        }
        
        if (numValue < 0 || numValue > 100) {
            return 'Discount percentage must be between 0 and 100';
        }
    } else if (discountType === 'FLAT') {
        if (isNaN(numValue)) {
            return 'Discount amount must be a number';
        }
        
        if (numValue < 0) {
            return 'Discount amount cannot be negative';
        }
    }
    
    return '';
};

// Validate stock quantity
export const validateStock = (stock) => {
    const numStock = parseInt(stock, 10);
    
    if (isNaN(numStock)) {
        return 'Stock quantity must be a number';
    }
    
    if (!Number.isInteger(numStock)) {
        return 'Stock quantity must be an integer';
    }
    
    if (numStock < 0) {
        return 'Stock quantity cannot be negative';
    }
    
    if (numStock > 1000000) {
        return 'Stock quantity cannot exceed 1,000,000';
    }
    
    return '';
};

// Validate product name
export const validateProductName = (name) => {
    if (!name || name.trim() === '') {
        return 'Product name is required';
    }
    
    if (name.length < 2) {
        return 'Product name must be at least 2 characters';
    }
    
    if (name.length > 200) {
        return 'Product name cannot exceed 200 characters';
    }
    
    return '';
};

// Validate category name
export const validateCategoryName = (name) => {
    if (!name || name.trim() === '') {
        return 'Category name is required';
    }
    
    if (name.length < 2) {
        return 'Category name must be at least 2 characters';
    }
    
    if (name.length > 100) {
        return 'Category name cannot exceed 100 characters';
    }
    
    return '';
};

// Validate brand name
export const validateBrandName = (name) => {
    if (!name || name.trim() === '') {
        return 'Brand name is required';
    }
    
    if (name.length < 2) {
        return 'Brand name must be at least 2 characters';
    }
    
    if (name.length > 100) {
        return 'Brand name cannot exceed 100 characters';
    }
    
    return '';
};

// Validate attribute name
export const validateAttributeName = (name) => {
    if (!name || name.trim() === '') {
        return 'Attribute name is required';
    }
    
    if (name.length < 2) {
        return 'Attribute name must be at least 2 characters';
    }
    
    if (name.length > 50) {
        return 'Attribute name cannot exceed 50 characters';
    }
    
    return '';
};

// Validate file upload
export const validateFile = (file, options = {}) => {
    const {
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxSize = 5 * 1024 * 1024, // 5MB
        allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    } = options;
    
    if (!file) {
        return 'No file selected';
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
        return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
    }
    
    // Check file size
    if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        return `File size too large. Maximum size: ${maxSizeMB}MB`;
    }
    
    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
        return `File extension not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`;
    }
    
    return '';
};

// Validate video file
export const validateVideoFile = (file) => {
    return validateFile(file, {
        allowedTypes: ['video/mp4', 'video/webm', 'video/ogg'],
        maxSize: 50 * 1024 * 1024, // 50MB
        allowedExtensions: ['.mp4', '.webm', '.ogg']
    });
};

// Validate status
export const validateStatus = (status) => {
    const validStatuses = ['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'];
    
    if (!validStatuses.includes(status)) {
        return `Status must be one of: ${validStatuses.join(', ')}`;
    }
    
    return '';
};

// Validate discount type
export const validateDiscountType = (discountType) => {
    const validTypes = ['NONE', 'PERCENT', 'FLAT'];
    
    if (!validTypes.includes(discountType)) {
        return `Discount type must be one of: ${validTypes.join(', ')}`;
    }
    
    return '';
};

// Form validation helper
export const validateForm = (formData, validationRules) => {
    const errors = {};
    
    Object.keys(validationRules).forEach(field => {
        const rules = validationRules[field];
        const value = formData[field];
        
        rules.forEach(rule => {
            const error = rule(value, field);
            if (error && !errors[field]) {
                errors[field] = error;
            }
        });
    });
    
    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

// Create validation rules object
export const createValidationRules = (rulesConfig) => {
    const rules = {};
    
    Object.keys(rulesConfig).forEach(field => {
        const fieldRules = rulesConfig[field];
        rules[field] = [];
        
        if (fieldRules.required) {
            rules[field].push((value) => validateRequired(value, fieldRules.label || field));
        }
        
        if (fieldRules.minLength) {
            rules[field].push((value) => validateMinLength(value, fieldRules.minLength, fieldRules.label || field));
        }
        
        if (fieldRules.maxLength) {
            rules[field].push((value) => validateMaxLength(value, fieldRules.maxLength, fieldRules.label || field));
        }
        
        if (fieldRules.number) {
            rules[field].push((value) => validateNumber(value, fieldRules.label || field));
        }
        
        if (fieldRules.minValue !== undefined) {
            rules[field].push((value) => validateMinValue(value, fieldRules.minValue, fieldRules.label || field));
        }
        
        if (fieldRules.maxValue !== undefined) {
            rules[field].push((value) => validateMaxValue(value, fieldRules.maxValue, fieldRules.label || field));
        }
        
        if (fieldRules.positive) {
            rules[field].push((value) => validatePositiveNumber(value, fieldRules.label || field));
        }
        
        if (fieldRules.integer) {
            rules[field].push((value) => validateInteger(value, fieldRules.label || field));
        }
        
        if (fieldRules.email) {
            rules[field].push((value) => validateEmail(value) ? '' : 'Invalid email format');
        }
        
        // Custom validators
        if (fieldRules.custom) {
            rules[field].push(fieldRules.custom);
        }
    });
    
    return rules;
};