import api from './api';

export const fetchAllowedTables = async () => {
    try {
        const response = await api.get('/admin/bulk/tables');
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || "Failed to fetch tables";
    }
};

export const downloadTemplate = async (tableName) => {
    try {
        const response = await api.get(`/admin/bulk/template/${tableName}`, {
            responseType: 'blob'
        });
        
        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${tableName}_template.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    } catch (error) {
        throw error.response?.data?.detail || "Failed to download template";
    }
};

export const previewBulkUpload = async (tableName, file) => {
    try {
        const formData = new FormData();
        formData.append('table_name', tableName);
        formData.append('excel_file', file);

        const response = await api.post('/admin/bulk/preview', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || "Preview failed";
    }
};

export const insertBulkData = async (tableName, data) => {
    try {
        const response = await api.post('/admin/bulk/insert', {
            table_name: tableName,
            data: data
        });
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || "Insert failed";
    }
};
