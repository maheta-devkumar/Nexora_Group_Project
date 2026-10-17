import React, { useState, useEffect } from 'react';
import { Save, Store, CreditCard, ShoppingBag, Cpu, Check } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import AdminLayout from '../../components/Admin/Layout/AdminLayout';
import './Settings.css';

const Settings = () => {
    const { settings, loading, updating, saveSettings } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;

        setLocalSettings(prev => {
            const updated = { ...prev, [name]: newValue };
            checkChanges(updated);
            return updated;
        });
    };

    const checkChanges = (updated) => {
        const isModified = JSON.stringify(updated) !== JSON.stringify(settings);
        setHasChanges(isModified);
    };

    const handleSubmit = async () => {
        if (!hasChanges) return;

        // Simple Validation
        if (!localSettings.store_name.trim() || !localSettings.support_email.trim()) {
            // Toast is handled in context but we could alert here too
            return;
        }

        const success = await saveSettings(localSettings);
        if (success) {
            setHasChanges(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="settings-container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="settings-container animate-fade-in">
                <div className="settings-header">
                    <h1>Platform Settings</h1>
                    <p>Manage store configuration, payment methods, and system preferences.</p>
                </div>

                <div className="settings-grid">

                    {/* General Settings */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div className="card-icon">
                                <Store size={20} />
                            </div>
                            <div className="card-title">
                                <h3>General Configuration</h3>
                                <p>Basic store information</p>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Store Name</label>
                            <input
                                type="text"
                                name="store_name"
                                value={localSettings.store_name}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="e.g. Nexora Store"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Support Email</label>
                            <input
                                type="email"
                                name="support_email"
                                value={localSettings.support_email}
                                onChange={handleChange}
                                className="form-input"
                                placeholder="support@nexora.com"
                            />
                        </div>
                    </div>

                    {/* Payment Settings */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div className="card-icon">
                                <CreditCard size={20} />
                            </div>
                            <div className="card-title">
                                <h3>Payment Gateways</h3>
                                <p>Control available payment methods</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Toggle
                                label="Enable UPI Payments"
                                desc="Allow customers to pay via UPI apps"
                                name="enable_upi"
                                checked={localSettings.enable_upi}
                                onChange={handleChange}
                            />
                            <Toggle
                                label="Enable Credit/Debit Card"
                                desc="Accept major cards via gateway"
                                name="enable_card"
                                checked={localSettings.enable_card}
                                onChange={handleChange}
                            />
                            <Toggle
                                label="Enable Cash on Delivery"
                                desc="Allow payment upon delivery"
                                name="enable_cod"
                                checked={localSettings.enable_cod}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Order Settings */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div className="card-icon">
                                <ShoppingBag size={20} />
                            </div>
                            <div className="card-title">
                                <h3>Order Processing</h3>
                                <p>Configure order request rules</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Toggle
                                label="Allow Order Cancellation"
                                desc="Customers can cancel pending orders"
                                name="allow_order_cancel"
                                checked={localSettings.allow_order_cancel}
                                onChange={handleChange}
                            />
                            <Toggle
                                label="Allow Returns"
                                desc="Customers can request returns"
                                name="allow_returns"
                                checked={localSettings.allow_returns}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* AI Settings */}
                    <div className="settings-card">
                        <div className="card-header">
                            <div className="card-icon">
                                <Cpu size={20} />
                            </div>
                            <div className="card-title">
                                <h3>Artificial Intelligence</h3>
                                <p>Enable AI features for admin</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <Toggle
                                label="Enable Admin AI Assistant"
                                desc="Activate AI insights and chatbot"
                                name="enable_admin_ai"
                                checked={localSettings.enable_admin_ai}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                </div>

                {hasChanges && (
                    <div className="save-action-bar animate-slide-up">
                        <div className="flex-1 text-sm text-gray-500">
                            You have unsaved changes
                        </div>
                        <button
                            className="btn-save"
                            onClick={handleSubmit}
                            disabled={updating}
                        >
                            {updating ? (
                                <>
                                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></div>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

const Toggle = ({ label, desc, name, checked, onChange }) => (
    <div className="toggle-group">
        <div className="toggle-info">
            <h4>{label}</h4>
            <p>{desc}</p>
        </div>
        <label className="toggle-switch">
            <input
                type="checkbox"
                name={name}
                checked={checked}
                onChange={onChange}
            />
            <span className="slider"></span>
        </label>
    </div>
);

export default Settings;
