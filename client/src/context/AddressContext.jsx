import React, { createContext, useContext, useState, useCallback } from 'react';
import * as addressApi from '../api/address';

const AddressContext = createContext();

export const useAddressContext = () => {
    const context = useContext(AddressContext);
    if (!context) {
        throw new Error('useAddressContext must be used within AddressProvider');
    }
    return context;
};

export const AddressProvider = ({ children }) => {
    // State
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);
    const [areas, setAreas] = useState([]);
    const [addresses, setAddresses] = useState([]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

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
        setStates([]);
        setCities([]);
        setAreas([]);
        setAddresses([]);
        setOperationLogs([]);
        setError(null);
        addLog('All address data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Address operation logs cleared', 'info');
    }, [addLog]);

    // ===== GET ALL STATES =====
    const fetchStates = useCallback(async () => {
        // Only fetch if not already loaded
        if (states.length > 0) {
            return { success: true, data: states };
        }
        
        setLoading(true);
        setError(null);
        addLog('Fetching states...', 'info');
        
        try {
            const result = await addressApi.fetchStates();
            if (result.success) {
                setStates(result.data);
                addLog(`✅ States fetched: ${result.data.length} states`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch states: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch states';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'States endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch states error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [states.length, addLog]);

    // ===== GET CITIES BY STATE =====
    const fetchCitiesByState = useCallback(async (stateId) => {
        if (!stateId) {
            setCities([]);
            return { success: true, data: [] };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Fetching cities for state ID: ${stateId}...`, 'info');
        
        try {
            const result = await addressApi.fetchCitiesByState(stateId);
            if (result.success) {
                setCities(result.data);
                addLog(`✅ Cities fetched: ${result.data.length} cities`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch cities: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch cities';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Cities endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch cities error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== GET AREAS BY CITY =====
    const fetchAreasByCity = useCallback(async (cityId) => {
        if (!cityId) {
            setAreas([]);
            return { success: true, data: [] };
        }
        
        setLoading(true);
        setError(null);
        addLog(`Fetching areas for city ID: ${cityId}...`, 'info');
        
        try {
            const result = await addressApi.fetchAreasByCity(cityId);
            if (result.success) {
                setAreas(result.data);
                addLog(`✅ Areas fetched: ${result.data.length} areas`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch areas: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch areas';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Areas endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch areas error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== GET USER ADDRESSES =====
    const fetchUserAddresses = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching user addresses...', 'info');
        
        try {
            const result = await addressApi.fetchUserAddresses();
            if (result.success) {
                setAddresses(result.data);
                addLog(`✅ User addresses fetched: ${result.data.length} addresses`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch addresses: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch addresses';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Addresses endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch addresses error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== GET ADDRESS BY ID =====
    const fetchAddressById = useCallback(async (addressId) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching address ID: ${addressId}...`, 'info');
        
        try {
            const result = await addressApi.fetchAddressById(addressId);
            if (result.success) {
                addLog(`✅ Address ${addressId} fetched successfully`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch address: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to fetch address';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Address endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch address by ID error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== CREATE ADDRESS =====
    const createAddress = useCallback(async (addressData) => {
        setLoading(true);
        setError(null);
        addLog('Creating new address...', 'info');
        
        try {
            const result = await addressApi.createAddress(addressData);
            if (result.success) {
                setAddresses(prev => [...prev, result.data]);
                addLog('✅ Address created successfully', 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to create address: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to create address';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Create address endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Create address error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== UPDATE ADDRESS =====
    const updateAddress = useCallback(async (addressId, updateData) => {
        setLoading(true);
        setError(null);
        addLog(`Updating address ID: ${addressId}...`, 'info');
        
        try {
            const result = await addressApi.updateAddress(addressId, updateData);
            if (result.success) {
                setAddresses(prev => 
                    prev.map(addr => 
                        addr.address_id === addressId ? result.data : addr
                    )
                );
                addLog(`✅ Address ${addressId} updated successfully`, 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to update address: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to update address';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Update address endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Update address error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== DELETE ADDRESS =====
    const deleteAddress = useCallback(async (addressId) => {
        setLoading(true);
        setError(null);
        addLog(`Deleting address ID: ${addressId}...`, 'info');
        
        try {
            const result = await addressApi.deleteAddress(addressId);
            if (result.success) {
                setAddresses(prev => prev.filter(addr => addr.address_id !== addressId));
                addLog(`✅ Address ${addressId} deleted successfully`, 'success');
                return { success: true, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to delete address: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to delete address';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Delete address endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Delete address error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== SET DEFAULT ADDRESS =====
    const setDefaultAddress = useCallback(async (addressId) => {
        setLoading(true);
        setError(null);
        addLog(`Setting default address ID: ${addressId}...`, 'info');
        
        try {
            const result = await addressApi.setDefaultAddress(addressId);
            if (result.success) {
                setAddresses(prev => 
                    prev.map(addr => ({
                        ...addr,
                        is_default: addr.address_id === addressId
                    }))
                );
                addLog(`✅ Default address set to ${addressId}`, 'success');
                return { success: true, data: result.data, message: result.message };
            } else {
                setError(result.message);
                addLog(`❌ Failed to set default address: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const status = err.response?.status;
            let errorMsg = 'Failed to set default address';

            // Handle 404 error - logout as requested
            if (status === 404) {
                errorMsg = 'Set default address endpoint not found';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            // Handle 401/403 errors
            if (status === 401 || status === 403) {
                errorMsg = 'Authentication failed';
                addLog(`❌ ${errorMsg}, logging out...`, 'error');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return { success: false, message: errorMsg };
            }

            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Set default address error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const value = {
        // State
        states,
        cities,
        areas,
        addresses,
        loading,
        error,
        operationLogs,
        
        // Fetch Functions
        fetchStates,
        fetchCitiesByState,
        fetchAreasByCity,
        fetchUserAddresses,
        fetchAddressById,
        
        // CRUD Functions
        createAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <AddressContext.Provider value={value}>
            {children}
        </AddressContext.Provider>
    );
};