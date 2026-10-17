import React, { useState } from 'react';
import { useDeliveryProfileContext } from '../../../context/delivery_panel/DeliveryProfileContext';
import './PasswordChange.css';

const PasswordChange = ({ loading }) => {
    const { changePassword } = useDeliveryProfileContext();
    const [formData, setFormData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.current_password) {
            newErrors.current_password = 'Current password is required';
        }

        if (!formData.new_password) {
            newErrors.new_password = 'New password is required';
        } else if (formData.new_password.length < 8) {
            newErrors.new_password = 'Password must be at least 8 characters';
        }

        if (!formData.confirm_password) {
            newErrors.confirm_password = 'Please confirm your password';
        } else if (formData.new_password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSuccess(false);

        try {
            const result = await changePassword({
                current_password: formData.current_password,
                new_password: formData.new_password,
                confirm_password: formData.confirm_password
            });

            if (result.success) {
                setSuccess(true);
                setFormData({
                    current_password: '',
                    new_password: '',
                    confirm_password: ''
                });
                setTimeout(() => setSuccess(false), 5000);
            } else {
                setErrors({
                    submit: result.message || 'Failed to change password'
                });
            }
        } catch (error) {
            setErrors({
                submit: 'An error occurred while changing password'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            current_password: '',
            new_password: '',
            confirm_password: ''
        });
        setErrors({});
        setSuccess(false);
    };

    return (
        <div className="password-change-card">
            <div className="card-header">
                <h3>Change Password</h3>
            </div>

            {success && (
                <div className="success-message">
                    <i data-lucide="check-circle"></i>
                    <span>Password changed successfully!</span>
                </div>
            )}

            {errors.submit && (
                <div className="error-message">
                    <i data-lucide="alert-circle"></i>
                    <span>{typeof errors.submit === 'string' ? errors.submit : JSON.stringify(errors.submit)}</span>
                </div>
            )}

            <form className="password-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="current_password">
                        <i data-lucide="lock"></i>
                        Current Password
                    </label>
                    <input
                        type="password"
                        id="current_password"
                        name="current_password"
                        value={formData.current_password}
                        onChange={handleChange}
                        placeholder="Enter current password"
                        className={errors.current_password ? 'error' : ''}
                        disabled={isSubmitting}
                    />
                    {errors.current_password && (
                        <span className="field-error">{errors.current_password}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="new_password">
                        <i data-lucide="lock"></i>
                        New Password
                    </label>
                    <input
                        type="password"
                        id="new_password"
                        name="new_password"
                        value={formData.new_password}
                        onChange={handleChange}
                        placeholder="Enter new password"
                        className={errors.new_password ? 'error' : ''}
                        disabled={isSubmitting}
                    />
                    {errors.new_password && (
                        <span className="field-error">{errors.new_password}</span>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="confirm_password">
                        <i data-lucide="lock"></i>
                        Confirm New Password
                    </label>
                    <input
                        type="password"
                        id="confirm_password"
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleChange}
                        placeholder="Confirm new password"
                        className={errors.confirm_password ? 'error' : ''}
                        disabled={isSubmitting}
                    />
                    {errors.confirm_password && (
                        <span className="field-error">{errors.confirm_password}</span>
                    )}
                </div>

                <div className="password-requirements">
                    <strong>Password Requirements:</strong>
                    <ul>
                        <li>At least 8 characters long</li>
                        <li>Contains uppercase and lowercase letters</li>
                        <li>Contains at least one number</li>
                        <li>Contains at least one special character</li>
                    </ul>
                </div>

                <div className="form-actions">
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="spinner"></div>
                                Changing Password...
                            </>
                        ) : (
                            <>
                                <i data-lucide="key"></i>
                                Change Password
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PasswordChange;