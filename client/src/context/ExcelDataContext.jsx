import React, { createContext, useState, useContext, useEffect } from 'react';
import { fetchAllowedTables, downloadTemplate, previewBulkUpload, insertBulkData } from '../api/excel_data';

const ExcelDataContext = createContext();

export const useExcelData = () => useContext(ExcelDataContext);

export const ExcelDataProvider = ({ children }) => {
    const [allowedTables, setAllowedTables] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null); // stores table_name
    const [previewData, setPreviewData] = useState(null); // stores BulkPreviewResponse
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Initial fetch of tables
    useEffect(() => {
        loadTables();
    }, []);

    const loadTables = async () => {
        try {
            setLoading(true);
            const tables = await fetchAllowedTables();
            console.log("Fetched tables:", tables);
            if (Array.isArray(tables)) {
                setAllowedTables(tables);
            } else {
                console.error("Invalid tables format:", tables);
                setAllowedTables([]);
            }
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTableSelect = (tableName) => {
        setSelectedTable(tableName);
        setPreviewData(null);
        setError(null);
        setSuccessMessage(null);
    };

    const handleDownloadTemplate = async () => {
        if (!selectedTable) return;
        try {
            setLoading(true);
            await downloadTemplate(selectedTable);
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePreview = async (file) => {
        if (!selectedTable || !file) return;
        try {
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            const data = await previewBulkUpload(selectedTable, file);
            setPreviewData(data);
        } catch (err) {
            setError(err);
            setPreviewData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleInsert = async () => {
        if (!selectedTable || !previewData) return;
        try {
            setLoading(true);
            const result = await insertBulkData(selectedTable, previewData.preview_data);
            setSuccessMessage(`Success! ${result.inserted_count} records inserted.`);
            setPreviewData(null); // Clear preview after success
        } catch (err) {
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    const clearMessages = () => {
        setError(null);
        setSuccessMessage(null);
    };

    const value = {
        allowedTables,
        selectedTable,
        handleTableSelect,
        previewData,
        handlePreview,
        handleInsert,
        loading,
        error,
        successMessage,
        handleDownloadTemplate,
        clearMessages,
        currentTableInfo: allowedTables.find(t => t.table_name === selectedTable)
    };

    return (
        <ExcelDataContext.Provider value={value}>
            {children}
        </ExcelDataContext.Provider>
    );
};
