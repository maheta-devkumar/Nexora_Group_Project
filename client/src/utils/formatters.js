/**
 * Data Formatting Utilities
 */

// Format product data for display
export const formatProductForDisplay = (product) => {
    if (!product) return null;
    
    return {
        id: product.product_id,
        name: product.product_name,
        description: product.description || 'No description available',
        brand: product.brand?.brand_name || 'No brand',
        category: product.category?.category_name || 'No category',
        subcategory: product.subcategory?.sub_category_name || 'No subcategory',
        createdAt: product.created_at,
        variants: product.variants?.map(formatVariantForDisplay) || [],
        defaultVariant: product.default_variant ? formatVariantForDisplay(product.default_variant) : null
    };
};

// Format variant data for display
export const formatVariantForDisplay = (variant) => {
    if (!variant) return null;
    
    const originalPrice = variant.price || 0;
    const discountValue = variant.discount_value || 0;
    const discountType = variant.discount_type || 'NONE';
    
    let finalPrice = originalPrice;
    let discountPercentage = 0;
    
    if (discountType === 'PERCENT') {
        discountPercentage = discountValue;
        finalPrice = originalPrice * (1 - discountValue / 100);
    } else if (discountType === 'FLAT') {
        finalPrice = Math.max(originalPrice - discountValue, 0);
        discountPercentage = originalPrice > 0 ? Math.round((discountValue / originalPrice) * 100) : 0;
    }
    
    return {
        id: variant.variant_id,
        name: variant.variant_name || 'Default Variant',
        price: originalPrice,
        finalPrice: finalPrice,
        discountType: discountType,
        discountValue: discountValue,
        discountPercentage: discountPercentage,
        stock: variant.stock_quantity || 0,
        status: variant.status || 'INACTIVE',
        isDefault: variant.is_default || false,
        images: variant.images?.map(img => ({
            id: img.image_id,
            url: img.url,
            isDefault: img.is_default
        })) || [],
        attributes: variant.attributes?.map(attr => ({
            id: attr.attribute_id,
            name: attr.attribute_name,
            value: attr.value
        })) || []
    };
};

// Format category data for display
export const formatCategoryForDisplay = (category) => {
    if (!category) return null;
    
    return {
        id: category.category_id,
        name: category.category_name,
        description: category.description || 'No description',
        subcategories: category.subcategories?.map(formatSubcategoryForDisplay) || []
    };
};

// Format subcategory data for display
export const formatSubcategoryForDisplay = (subcategory) => {
    if (!subcategory) return null;
    
    return {
        id: subcategory.sub_category_id,
        name: subcategory.sub_category_name,
        description: subcategory.description || 'No description',
        categoryId: subcategory.category_id
    };
};

// Format brand data for display
export const formatBrandForDisplay = (brand) => {
    if (!brand) return null;
    
    return {
        id: brand.brand_id,
        name: brand.brand_name,
        description: brand.description || 'No description'
    };
};

// Format attribute data for display
export const formatAttributeForDisplay = (attribute) => {
    if (!attribute) return null;
    
    return {
        id: attribute.attribute_id,
        name: attribute.attribute_name,
        values: attribute.values || []
    };
};

// Format variant attribute for display
export const formatVariantAttributeForDisplay = (attribute) => {
    if (!attribute) return null;
    
    return {
        attributeId: attribute.attribute_id,
        attributeName: attribute.attribute_name,
        value: attribute.value
    };
};

// Format image data for display
export const formatImageForDisplay = (image) => {
    if (!image) return null;
    
    return {
        id: image.image_id,
        url: image.url,
        isDefault: image.is_default,
        variantId: image.variant_id
    };
};

// Format video data for display
export const formatVideoForDisplay = (video) => {
    if (!video) return null;
    
    return {
        id: video.video_id,
        url: video.url,
        isDefault: video.is_default,
        variantId: video.variant_id
    };
};

// Format product data for API (create/update)
export const formatProductForApi = (productData) => {
    return {
        product_name: productData.name,
        description: productData.description,
        brand_id: productData.brandId,
        sub_category_id: productData.subcategoryId
    };
};

// Format category data for API (create/update)
export const formatCategoryForApi = (categoryData) => {
    return {
        category_name: categoryData.name,
        description: categoryData.description
    };
};

// Format subcategory data for API (create/update)
export const formatSubcategoryForApi = (subcategoryData) => {
    return {
        sub_category_name: subcategoryData.name,
        category_id: subcategoryData.categoryId,
        description: subcategoryData.description
    };
};

// Format brand data for API (create/update)
export const formatBrandForApi = (brandData) => {
    return {
        brand_name: brandData.name,
        description: brandData.description
    };
};

// Format variant data for API (create/update)
export const formatVariantForApi = (variantData) => {
    return {
        variant_name: variantData.name,
        product_id: variantData.productId,
        price: variantData.price,
        stock_quantity: variantData.stock,
        discount_type: variantData.discountType,
        discount_value: variantData.discountValue,
        status: variantData.status,
        is_default: variantData.isDefault
    };
};

// Format attribute data for API (create/update)
export const formatAttributeForApi = (attributeData) => {
    return {
        attribute_name: attributeData.name
    };
};

// Format attribute assignment for API
export const formatAttributeAssignmentForApi = (variantId, attributeId, value) => {
    return {
        variant_id: variantId,
        attribute_id: attributeId,
        value: value
    };
};

// Convert camelCase to snake_case for API
export const toSnakeCase = (obj) => {
    const result = {};
    
    Object.keys(obj).forEach(key => {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
        result[snakeKey] = obj[key];
    });
    
    return result;
};

// Convert snake_case to camelCase for frontend
export const toCamelCase = (obj) => {
    const result = {};
    
    Object.keys(obj).forEach(key => {
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
        result[camelKey] = obj[key];
    });
    
    return result;
};
export const formatPrice = (price) => {
    if (price === null || price === undefined) return '0.00';
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
};
// /src/utils/formatters.js - Add this function

/**
 * Format date string with various options
 * @param {string|Date} dateInput - Date string or Date object
 * @param {string} format - Format type: 'short', 'long', 'datetime', 'relative'
 * @returns {string} Formatted date string
 */
export const formatDate = (dateInput, format = 'short') => {
    if (!dateInput) return '';
    
    const date = new Date(dateInput);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
        return 'Invalid Date';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    // Relative format (e.g., "2 hours ago")
    if (format === 'relative') {
        if (diffSeconds < 60) {
            return 'just now';
        } else if (diffMinutes < 60) {
            return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else if (diffDays < 7) {
            return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        }
    }
    
    // Standard formats
    const options = {};
    
    switch (format) {
        case 'short':
            // Format: MM/DD/YYYY or DD/MM/YYYY based on locale
            return date.toLocaleDateString();
            
        case 'long':
            // Format: Month Day, Year (e.g., January 15, 2024)
            options.year = 'numeric';
            options.month = 'long';
            options.day = 'numeric';
            return date.toLocaleDateString('en-US', options);
            
        case 'datetime':
            // Format: MM/DD/YYYY, HH:MM AM/PM
            options.year = 'numeric';
            options.month = '2-digit';
            options.day = '2-digit';
            options.hour = '2-digit';
            options.minute = '2-digit';
            return date.toLocaleString('en-US', options);
            
        case 'time':
            // Format: HH:MM AM/PM
            options.hour = '2-digit';
            options.minute = '2-digit';
            return date.toLocaleTimeString('en-US', options);
            
        case 'dateonly':
            // Format: YYYY-MM-DD (ISO-like, for forms/inputs)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
            
        case 'monthyear':
            // Format: January 2024
            options.year = 'numeric';
            options.month = 'long';
            return date.toLocaleDateString('en-US', options);
            
        case 'compact':
            // Format: Jan 15, '24
            options.year = '2-digit';
            options.month = 'short';
            options.day = 'numeric';
            return date.toLocaleDateString('en-US', options);
            
        case 'timestamp':
            // Format: YYYY-MM-DD HH:MM:SS
            const timestampYear = date.getFullYear();
            const timestampMonth = String(date.getMonth() + 1).padStart(2, '0');
            const timestampDay = String(date.getDate()).padStart(2, '0');
            const timestampHours = String(date.getHours()).padStart(2, '0');
            const timestampMinutes = String(date.getMinutes()).padStart(2, '0');
            const timestampSeconds = String(date.getSeconds()).padStart(2, '0');
            return `${timestampYear}-${timestampMonth}-${timestampDay} ${timestampHours}:${timestampMinutes}:${timestampSeconds}`;
            
        case 'age':
            // Calculate age in years
            const ageDiffMs = now - date;
            const ageDate = new Date(ageDiffMs);
            return Math.abs(ageDate.getUTCFullYear() - 1970) + ' years';
            
        default:
            return date.toLocaleDateString();
    }
};

/**
 * Format date range (e.g., "Jan 1 - Jan 15, 2024")
 */
export const formatDateRange = (startDate, endDate, format = 'short') => {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 'Invalid Date Range';
    }
    
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = start.getMonth() === end.getMonth();
    
    if (format === 'short') {
        if (sameYear && sameMonth) {
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
        } else if (sameYear) {
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        } else {
            return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
        }
    }
    
    return `${formatDate(startDate, format)} - ${formatDate(endDate, format)}`;
};

/**
 * Format time duration (e.g., "2h 30m")
 */
export const formatDuration = (minutes) => {
    if (minutes === undefined || minutes === null) return '';
    
    if (minutes < 60) {
        return `${minutes}m`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
        return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format date for API (YYYY-MM-DD)
 */
export const formatDateForApi = (dateInput) => {
    if (!dateInput) return null;
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};

/**
 * Format date and time for API (YYYY-MM-DDTHH:MM:SS)
 */
export const formatDateTimeForApi = (dateInput) => {
    if (!dateInput) return null;
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return null;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

/**
 * Check if date is today
 */
export const isToday = (dateInput) => {
    if (!dateInput) return false;
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return false;
    
    const today = new Date();
    
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
};

/**
 * Check if date is yesterday
 */
export const isYesterday = (dateInput) => {
    if (!dateInput) return false;
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return false;
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear();
};

/**
 * Get time ago string (similar to relative but more detailed)
 */
export const getTimeAgo = (dateInput) => {
    if (!dateInput) return '';
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) {
        return 'just now';
    } else if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffWeeks < 4) {
        return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    } else if (diffMonths < 12) {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    } else {
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ago`;
    }
};