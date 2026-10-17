/**
 * Safe rendering utilities to prevent null/undefined errors
 */

// Safe number formatting
export const safeFormatNumber = (value, options = {}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return options.fallback || '0';
  }
  
  const { 
    style = 'decimal', 
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
    currency = 'USD',
    ...rest 
  } = options;
  
  if (style === 'currency') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
      ...rest
    }).format(value);
  }
  
  if (style === 'percent') {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits,
      maximumFractionDigits,
      ...rest
    }).format(value / 100);
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits,
    ...rest
  }).format(value);
};

// Safe toFixed
export const safeToFixed = (value, digits = 2) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0'.padEnd(digits ? digits + 1 : 3, '0');
  }
  return Number(value).toFixed(digits);
};

// Safe toLocaleString
export const safeToLocaleString = (value) => {
  if (value === null || value === undefined) {
    return '0';
  }
  
  if (typeof value === 'number') {
    return value.toLocaleString('en-US');
  }
  
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toLocaleString('en-US');
  }
  
  return String(value);
};

// Safe dollar formatting
// Safe dollar formatting
export const safeFormatDollar = (value, options = {}) => {
  const {
    fallback = '$0',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2
  } = options;

  if (value === null || value === undefined) {
    return fallback;
  }

  const num = typeof value === 'number' ? value : Number(value);

  if (isNaN(num)) {
    return fallback;
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(num);
};


// Safe percentage formatting
export const safeFormatPercent = (value, digits = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }
  return `${safeToFixed(value, digits)}%`;
};

// Safe rating stars
export const safeFormatRating = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return '0.0';
  }
  return Number(value).toFixed(1);
};

// Safe array check
export const safeArray = (value) => {
  return Array.isArray(value) ? value : [];
};

// Safe object check
export const safeObject = (value) => {
  return value && typeof value === 'object' ? value : {};
};