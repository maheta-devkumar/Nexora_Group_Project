import React, { useState } from 'react';
import { useDeliveryProfileContext } from '../../../context/delivery_panel/DeliveryProfileContext';
import './ProfileDetails.css';

const ProfileDetails = ({ personalInfo, joiningDate, loading, getFullName }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        date_of_birth: '',
        address: '',
        joining_date: ''
    });
    const [errors, setErrors] = useState({});
    const { updatePersonalInfo } = useDeliveryProfileContext();

    React.useEffect(() => {
        if (personalInfo) {
            setFormData({
                first_name: personalInfo.first_name || '',
                last_name: personalInfo.last_name || '',
                email: personalInfo.email || '',
                phone_number: personalInfo.phone || '',
                date_of_birth: personalInfo.date_of_birth || '',
                address: [personalInfo.address_line1, personalInfo.address_line2, personalInfo.city, personalInfo.state].filter(Boolean).join(', ') || ''
            });
        }
    }, [personalInfo]);

    // Helper to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            return dateString;
        }
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (personalInfo) {
            setFormData({
                first_name: personalInfo.first_name || '',
                last_name: personalInfo.last_name || '',
                email: personalInfo.email || '',
                phone_number: personalInfo.phone_number || '',
                date_of_birth: personalInfo.date_of_birth || '',
                address: personalInfo.address || '',
                joining_date: personalInfo.joining_date || ''
            });
        }
    };

    const handleSave = async () => {
        try {
            // Map frontend fields to backend schema
            const updatePayload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                phone: formData.phone_number, // Map phone_number to phone
                // Handle date_of_birth: send null if empty string
                date_of_birth: formData.date_of_birth || null
            };

            await updatePersonalInfo(updatePayload);
            setIsEditing(false);
        } catch (err) {
            console.error("Failed to update profile", err);
        }
    };

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

    if (loading && !personalInfo) {
        return (
            <div className="personal-info-card loading">
                <div className="card-header">
                    <h3>Personal Information</h3>
                </div>
                <div className="loading-content">
                    Loading...
                </div>
            </div>
        );
    }

    return (
        <div className="personal-info-card">
            <div className="card-header">
                <h3>Personal Information</h3>
                {!isEditing ? (
                    <button className="btn-text" onClick={handleEdit}>
                        <i data-lucide="edit"></i>
                        Edit
                    </button>
                ) : (
                    <div className="edit-actions">
                        <button className="btn-text cancel" onClick={handleCancel}>
                            Cancel
                        </button>
                        <button className="btn-text save" onClick={handleSave}>
                            Save
                        </button>
                    </div>
                )}
            </div>
            <div className="info-grid">
                <div className="info-item">
                    <span className="info-label">Full Name</span>
                    {isEditing ? (
                        <div className="name-fields">
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                className="edit-input"
                                placeholder="First Name"
                            />
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                className="edit-input"
                                placeholder="Last Name"
                            />
                        </div>
                    ) : (
                        <span className="info-value">{getFullName()}</span>
                    )}
                </div>
                <div className="info-item">
                    <span className="info-label">Email</span>
                    {isEditing ? (
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="edit-input"
                        />
                    ) : (
                        <span className="info-value">{personalInfo?.email || 'N/A'}</span>
                    )}
                </div>
                <div className="info-item">
                    <span className="info-label">Phone Number</span>
                    {isEditing ? (
                        <input
                            type="tel"
                            name="phone_number"
                            value={formData.phone_number}
                            onChange={handleChange}
                            className="edit-input"
                        />
                    ) : (
                        <span className="info-value">{personalInfo?.phone || 'N/A'}</span>
                    )}
                </div>
                <div className="info-item">
                    <span className="info-label">Date of Birth</span>
                    {isEditing ? (
                        <input
                            type="date"
                            name="date_of_birth"
                            value={formData.date_of_birth}
                            onChange={handleChange}
                            className="edit-input"
                        />
                    ) : (
                        <span className="info-value">{formatDate(personalInfo?.date_of_birth)}</span>
                    )}
                </div>
                <div className="info-item">
                    <span className="info-label">Address</span>
                    {isEditing ? (
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="edit-textarea"
                            rows="3"
                            disabled={true} // Address update requires specific flow
                            title="Please reach out to support to update address"
                        />
                    ) : (
                        <span className="info-value">
                            {[personalInfo?.address_line1, personalInfo?.address_line2, personalInfo?.city, personalInfo?.state].filter(Boolean).join(', ') || 'N/A'}
                        </span>
                    )}
                </div>
                <div className="info-item">
                    <span className="info-label">Joining Date</span>
                    <span className="info-value">{formatDate(joiningDate)}</span>
                </div>
            </div>
        </div>
    );
};

export default ProfileDetails;