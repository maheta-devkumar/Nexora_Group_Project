// src/api/delivery_panel/reports.js
import api from '../api';

const DELIVERY_REPORTS_BASE_URL = `/delivery_panel/reports`;

/* -----------------------------
   ✅ DELIVERY REPORTS API FUNCTIONS
------------------------------ */

// Get delivery reports
export const getDeliveryReports = async (params = {}) => {
    try {
        const response = await api.get(DELIVERY_REPORTS_BASE_URL, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Delivery reports fetched successfully"
        };
    } catch (error) {
        console.error("Get Delivery Reports Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery reports",
            data: null
        };
    }
};

// Export delivery report
export const exportDeliveryReport = async (params = {}) => {
    try {
        const response = await api.get(`${DELIVERY_REPORTS_BASE_URL}/export`, {
            params,
            responseType: 'blob' // Important for file downloads
        });
        
        // Extract filename from Content-Disposition header or generate one
        const contentDisposition = response.headers['content-disposition'];
        let filename = `delivery_report_${new Date().toISOString().split('T')[0]}`;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
            }
        }
        
        // Determine file extension based on format
        const format = params.report_format || 'pdf';
        if (!filename.includes('.')) {
            filename = `${filename}.${format}`;
        }
        
        // Create blob and download URL
        const blob = new Blob([response.data], { 
            type: response.headers['content-type'] || 'application/octet-stream' 
        });
        const downloadUrl = window.URL.createObjectURL(blob);
        
        return { 
            success: true, 
            data: {
                blob,
                downloadUrl,
                filename,
                contentType: response.headers['content-type'],
                size: blob.size
            },
            message: "Report exported successfully"
        };
    } catch (error) {
        console.error("Export Delivery Report Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to export delivery report",
            data: null
        };
    }
};

// Get quick summary for dashboard
export const getDeliverySummary = async () => {
    try {
        const response = await api.get(`${DELIVERY_REPORTS_BASE_URL}/summary`);
        return { 
            success: true, 
            data: response.data,
            message: "Delivery summary fetched successfully"
        };
    } catch (error) {
        console.error("Get Delivery Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch delivery summary",
            data: null
        };
    }
};

// Get trend data only
export const getDeliveryTrend = async (days = 30) => {
    try {
        const response = await api.get(`${DELIVERY_REPORTS_BASE_URL}/trend`, { params: { days } });
        return { 
            success: true, 
            data: response.data,
            message: "Delivery trend data fetched successfully"
        };
    } catch (error) {
        console.error("Get Delivery Trend Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch delivery trend",
            data: null
        };
    }
};

// Get order-wise report only
export const getOrderWiseReport = async (params = {}) => {
    try {
        const response = await api.get(`${DELIVERY_REPORTS_BASE_URL}/orders`, { params });
        return { 
            success: true, 
            data: response.data,
            message: "Order-wise report fetched successfully"
        };
    } catch (error) {
        console.error("Get Order-wise Report Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch order-wise report",
            data: null
        };
    }
};

// Health check for reports service
export const checkReportsHealth = async () => {
    try {
        const response = await api.get(`${DELIVERY_REPORTS_BASE_URL}/health`);
        return { 
            success: true, 
            data: response.data,
            message: "Reports service is healthy"
        };
    } catch (error) {
        console.error("Reports Health Check Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Reports service health check failed",
            data: null
        };
    }
};

// Helper function to download file from blob
export const downloadFile = (blobData) => {
    if (!blobData) return false;
    
    const { downloadUrl, filename } = blobData;
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    link.style.display = 'none';
    
    // Append to body, click, and cleanup
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
    }, 100);
    
    return true;
};

// Helper to generate export params
export const generateExportParams = (filters) => {
    const params = {
        report_format: filters.format || 'pdf',
        report_range: filters.range || 'overall',
        export_type: filters.exportType || 'full'
    };
    
    // Add date filters if present
    if (filters.startDate) {
        params.start_date = filters.startDate;
    }
    if (filters.endDate) {
        params.end_date = filters.endDate;
    }
    
    // Add status filter if present
    if (filters.status) {
        params.status_filter = filters.status;
    }
    
    return params;
};