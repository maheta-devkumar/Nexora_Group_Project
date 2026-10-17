// context/AttributeContext.jsx
import React, { createContext, useState, useContext, useCallback } from 'react';
import * as attributeApi from '../api/attribute';

const AttributeContext = createContext();

export const useAttributes = () => {
    const context = useContext(AttributeContext);
    if (!context) {
        throw new Error('useAttributes must be used within an AttributeProvider');
    }
    return context;
};

export const AttributeProvider = ({ children }) => {
    const [attributes, setAttributes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentAttribute, setCurrentAttribute] = useState(null);

    // Fetch all attributes
    const fetchAttributes = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await attributeApi.fetchAllAttributes();
            if (result.success) {
                setAttributes(result.data || []);
            } else {
                setError(result.message || 'Failed to fetch attributes');
            }
        } catch (err) {
            setError('Failed to fetch attributes: ' + err.message);
            console.error('Fetch attributes error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Get attribute by ID from local state
    const getAttributeById = useCallback((attributeId) => {
        return attributes.find(attr => attr.attribute_id === parseInt(attributeId));
    }, [attributes]);

    // Create attribute
    const createAttribute = async (attributeData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await attributeApi.createAttribute(attributeData);
            if (result.success) {
                // Refresh the list
                await fetchAttributes();
                return { 
                    success: true, 
                    data: result.data, 
                    message: result.message || 'Attribute created successfully' 
                };
            } else {
                const errorMsg = result.message || 'Failed to create attribute';
                setError(errorMsg);
                return { success: false, message: errorMsg };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to create attribute';
            setError(errorMsg);
            console.error('Create attribute error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };
    // Update the updateAttribute method in AttributeContext.jsx

    const updateAttribute = async (attributeId, attributeData) => {
        setLoading(true);
        setError(null);
        try {
            const result = await attributeApi.updateAttribute(attributeId, attributeData);
            if (result.success) {
                // Update in local state
                setAttributes(prev => prev.map(attr => 
                    attr.attribute_id === parseInt(attributeId) ? result.data : attr
                ));
                return { 
                    success: true, 
                    data: result.data, 
                    message: result.message || 'Attribute updated successfully' 
                };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to update attribute';
            setError(errorMsg);
            console.error('Update attribute error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Update the deleteAttribute method in AttributeContext.jsx

    const deleteAttribute = async (attributeId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await attributeApi.deleteAttribute(attributeId);
            if (result.success) {
                // Remove from local state
                setAttributes(prev => prev.filter(attr => attr.attribute_id !== parseInt(attributeId)));
                return { 
                    success: true, 
                    message: result.message || 'Attribute deleted successfully' 
                };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to delete attribute';
            setError(errorMsg);
            console.error('Delete attribute error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Fetch attribute by ID
    const fetchAttributeById = async (attributeId) => {
        setLoading(true);
        setError(null);
        try {
            const result = await attributeApi.fetchAttributeById(attributeId);
            if (result.success) {
                setCurrentAttribute(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.message || 'Failed to fetch attribute';
            setError(errorMsg);
            console.error('Fetch attribute by ID error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Clear current attribute
    const clearCurrentAttribute = () => {
        setCurrentAttribute(null);
    };

    // Clear error
    const clearError = () => {
        setError(null);
    };

    const value = {
        attributes,
        loading,
        error,
        currentAttribute,
        fetchAttributes,
        createAttribute,
        updateAttribute,
        deleteAttribute,
        fetchAttributeById,
        getAttributeById,  // Make sure this is included
        clearCurrentAttribute,
        clearError
    };

    return (
        <AttributeContext.Provider value={value}>
            {children}
        </AttributeContext.Provider>
    );
};