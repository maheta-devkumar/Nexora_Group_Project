// src/context/delivery_panel/VehicleContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as vehicleApi from '../../api/delivery_panel/vehicle';

const VehicleContext = createContext();

export const useVehicleContext = () => {
    const context = useContext(VehicleContext);
    if (!context) {
        throw new Error('useVehicleContext must be used within VehicleProvider');
    }
    return context;
};

export const VehicleProvider = ({ children }) => {
    // State
    const [comprehensiveInfo, setComprehensiveInfo] = useState(null);
    const [basicInfo, setBasicInfo] = useState(null);
    const [vehicleDocuments, setVehicleDocuments] = useState([]);
    const [insuranceDetails, setInsuranceDetails] = useState(null);
    const [serviceHistory, setServiceHistory] = useState([]);
    const [safeVehicleInfo, setSafeVehicleInfo] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);
    const [vehicleStats, setVehicleStats] = useState({
        hasVehicle: false,
        documentsCount: 0,
        verifiedDocuments: 0,
        insuranceActive: false,
        serviceRecordsCount: 0
    });

    // Utility function to add logs
    const addLog = useCallback((message, type = 'info') => {
        const log = {
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        setOperationLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, []);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setComprehensiveInfo(null);
        setBasicInfo(null);
        setVehicleDocuments([]);
        setInsuranceDetails(null);
        setServiceHistory([]);
        setSafeVehicleInfo(null);
        setVehicleStats({
            hasVehicle: false,
            documentsCount: 0,
            verifiedDocuments: 0,
            insuranceActive: false,
            serviceRecordsCount: 0
        });
        setOperationLogs([]);
        setError(null);
        addLog('All vehicle data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Vehicle operation logs cleared', 'info');
    }, [addLog]);

    // Update vehicle stats
    const updateVehicleStats = useCallback((data) => {
        const stats = {
            hasVehicle: !!data?.vehicle_info || !!data?.basicInfo?.vehicle_info,
            documentsCount: data?.documents?.total_documents || vehicleDocuments.length || 0,
            verifiedDocuments: data?.documents?.verified_count || 
                vehicleDocuments.filter(doc => doc.status === 'VERIFIED').length || 0,
            insuranceActive: data?.insurance?.is_active || 
                insuranceDetails?.is_active || 
                data?.insuranceDetails?.is_active || false,
            serviceRecordsCount: data?.serviceHistory?.total_services || serviceHistory.length || 0
        };
        setVehicleStats(stats);
        return stats;
    }, [vehicleDocuments, insuranceDetails, serviceHistory]);

    // ===== COMPREHENSIVE VEHICLE INFO =====
    const fetchComprehensiveInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching comprehensive vehicle information...', 'test');
        
        try {
            const result = await vehicleApi.fetchVehicleComprehensiveInfo();
            if (result.success) {
                setComprehensiveInfo(result.data);
                updateVehicleStats(result.data);
                addLog('✅ Comprehensive vehicle info fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                // Handle empty vehicle info gracefully (no error)
                if (result.message.includes("No vehicle") || result.message.includes("Failed to get")) {
                    setComprehensiveInfo({ vehicle_info: null, insurance_details: null, recent_service: null, document_count: 0 });
                    addLog('ℹ️ No vehicle information available', 'info');
                    return { success: true, data: { vehicle_info: null, insurance_details: null, recent_service: null, document_count: 0 } };
                } else {
                    setError(result.message);
                    addLog(`❌ Failed to fetch comprehensive vehicle info: ${result.message}`, 'error');
                    return { success: false, message: result.message };
                }
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch comprehensive vehicle info';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch comprehensive info error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog, updateVehicleStats]);

    // ===== BASIC VEHICLE INFO =====
    const fetchBasicInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching basic vehicle information...', 'test');
        
        try {
            const result = await vehicleApi.fetchVehicleBasicInfo();
            if (result.success) {
                setBasicInfo(result.data);
                updateVehicleStats({ basicInfo: result.data });
                addLog('✅ Basic vehicle info fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                // Handle empty vehicle info gracefully
                if (result.message.includes("No vehicle") || result.message.includes("Failed to get")) {
                    setBasicInfo({ vehicle_info: null, last_updated: null });
                    addLog('ℹ️ No vehicle information available', 'info');
                    return { success: true, data: { vehicle_info: null, last_updated: null } };
                } else {
                    setError(result.message);
                    addLog(`❌ Failed to fetch basic vehicle info: ${result.message}`, 'error');
                    return { success: false, message: result.message };
                }
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch basic vehicle info';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch basic info error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog, updateVehicleStats]);

    // ===== VEHICLE DOCUMENTS =====
    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching vehicle documents...', 'test');
        
        try {
            const result = await vehicleApi.fetchVehicleDocuments();
            if (result.success) {
                setVehicleDocuments(result.data.documents || []);
                updateVehicleStats({ documents: result.data });
                addLog(`✅ Vehicle documents fetched: ${result.data.total_documents || 0} documents`, 'success');
                return { success: true, data: result.data };
            } else {
                // Return empty documents array gracefully
                setVehicleDocuments([]);
                addLog('ℹ️ No vehicle documents available', 'info');
                return { success: true, data: { documents: [], total_documents: 0, verified_count: 0, pending_count: 0 } };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch vehicle documents';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch documents error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog, updateVehicleStats]);

    // ===== INSURANCE DETAILS =====
    const fetchInsurance = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching insurance details...', 'test');
        
        try {
            const result = await vehicleApi.fetchInsuranceDetails();
            if (result.success) {
                setInsuranceDetails(result.data);
                updateVehicleStats({ insurance: result.data });
                addLog('✅ Insurance details fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                // Return empty insurance details gracefully
                setInsuranceDetails({ insurance_details: null, days_until_expiry: null, is_active: false });
                addLog('ℹ️ No insurance information available', 'info');
                return { success: true, data: { insurance_details: null, days_until_expiry: null, is_active: false } };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch insurance details';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch insurance error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog, updateVehicleStats]);

    // ===== SERVICE HISTORY =====
    const fetchService = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching service history...', 'test');
        
        try {
            const result = await vehicleApi.fetchServiceHistory();
            if (result.success) {
                setServiceHistory(result.data.service_records || []);
                updateVehicleStats({ serviceHistory: result.data });
                addLog(`✅ Service history fetched: ${result.data.total_services || 0} records`, 'success');
                return { success: true, data: result.data };
            } else {
                // Return empty service history gracefully
                setServiceHistory([]);
                addLog('ℹ️ No service history available', 'info');
                return { success: true, data: { service_records: [], total_services: 0, last_service_date: null, next_service_date: null, total_service_cost: null } };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch service history';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch service error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog, updateVehicleStats]);

    // ===== SAFE VEHICLE INFO =====
    const fetchSafeInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching safe vehicle info...', 'test');
        
        try {
            const result = await vehicleApi.fetchVehicleInfoSafe();
            if (result.success) {
                setSafeVehicleInfo(result.data);
                addLog('✅ Safe vehicle info fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch safe vehicle info: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch safe vehicle info';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch safe info error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllVehicleData = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching all vehicle data...', 'test');
        
        try {
            const results = await Promise.all([
                fetchComprehensiveInfo(),
                fetchBasicInfo(),
                fetchDocuments(),
                fetchInsurance(),
                fetchService()
            ]);
            
            const allSuccess = results.every(result => result.success);
            
            if (allSuccess) {
                addLog('✅ All vehicle data fetched successfully', 'success');
                return { success: true, message: 'All vehicle data fetched successfully' };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some vehicle data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some vehicle data failed to load: ${errorMessages}`, 'warning');
                return { success: false, message: errorMessages };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all vehicle data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all vehicle data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [
        fetchComprehensiveInfo,
        fetchBasicInfo,
        fetchDocuments,
        fetchInsurance,
        fetchService,
        addLog
    ]);

    // ===== HEALTH CHECK =====
    const checkVehicleHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking vehicle API health...', 'test');
        
        try {
            const result = await vehicleApi.checkVehicleHealth();
            if (result.success) {
                addLog('✅ Vehicle API is healthy', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Vehicle API health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check vehicle API health';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Vehicle health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const value = {
        // State
        comprehensiveInfo,
        basicInfo,
        vehicleDocuments,
        insuranceDetails,
        serviceHistory,
        safeVehicleInfo,
        vehicleStats,
        loading,
        error,
        operationLogs,
        
        // Vehicle Functions
        fetchComprehensiveInfo,
        fetchBasicInfo,
        fetchDocuments,
        fetchInsurance,
        fetchService,
        fetchSafeInfo,
        
        // Batch Operations
        fetchAllVehicleData,
        
        // Health Check
        checkVehicleHealth,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog,
        updateVehicleStats
    };

    return (
        <VehicleContext.Provider value={value}>
            {children}
        </VehicleContext.Provider>
    );
};