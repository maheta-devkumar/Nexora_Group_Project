import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as settingsApi from '../api/settingsApi';
import { toast } from 'react-toastify';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState({
        store_name: '',
        support_email: '',
        enable_upi: true,
        enable_card: true,
        enable_cod: true,
        allow_order_cancel: true,
        allow_returns: true,
        enable_admin_ai: false
    });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const data = await settingsApi.fetchSettings();
            setSettings(data);
        } catch (error) {
            console.error("Failed to load settings:", error);
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettings = async (newSettings) => {
        try {
            setUpdating(true);
            const updated = await settingsApi.updateSettings(newSettings);
            setSettings(updated);
            toast.success("Settings updated successfully");
            return true;
        } catch (error) {
            console.error("Failed to save settings:", error);
            toast.error(error.response?.data?.detail || "Failed to update settings");
            return false;
        } finally {
            setUpdating(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    return (
        <SettingsContext.Provider value={{ settings, loading, updating, saveSettings, reloadSettings: loadSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};
