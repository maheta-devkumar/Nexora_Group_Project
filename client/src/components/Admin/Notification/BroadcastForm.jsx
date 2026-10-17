import React, { useState } from 'react';
import { FaBroadcastTower, FaTag, FaFileAlt, FaBullhorn } from 'react-icons/fa';
import './BroadcastForm.css';

const BroadcastForm = ({ onSubmit, loading }) => {
    const [formData, setFormData] = useState({
        title: '',
        message: '',
        type: 'SYSTEM',
        reference_id: ''
    });

    const notificationTypes = [
        { value: 'ORDER', label: 'Order' },
        { value: 'PAYMENT', label: 'Payment' },
        { value: 'DELIVERY', label: 'Delivery' },
        { value: 'OFFER', label: 'Offer' },
        { value: 'FEEDBACK', label: 'Feedback' },
        { value: 'SYSTEM', label: 'System' }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const payload = {
            title: formData.title,
            message: formData.message,
            type: formData.type,
            reference_id: formData.reference_id || null
        };
        
        onSubmit(payload);
        
        // Reset form
        setFormData({
            title: '',
            message: '',
            type: 'SYSTEM',
            reference_id: ''
        });
    };

    return (
        <div className="broadcast-form">
            <div className="broadcast-header">
                <FaBroadcastTower />
                <h3>Broadcast to All Users</h3>
            </div>

            <div className="warning-banner">
                <div className="warning-content">
                    <FaBullhorn className="warning-icon" />
                    <div className="warning-text">
                        <h4>Important Notice</h4>
                        <p>
                            This will send a notification to <strong>all users</strong> in the system. 
                            Use this feature only for important announcements or system-wide updates.
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Notification Type */}
                <div className="form-group">
                    <label className="form-label">
                        <FaTag /> Broadcast Type
                    </label>
                    <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="form-select"
                        required
                        disabled={loading}
                    >
                        {notificationTypes.map(type => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Title */}
                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter broadcast title"
                        className="form-input"
                        required
                        disabled={loading}
                    />
                </div>

                {/* Message */}
                <div className="form-group">
                    <label className="form-label">
                        <FaFileAlt /> Message
                    </label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Enter broadcast message that will be sent to all users"
                        rows="5"
                        className="form-textarea"
                        required
                        disabled={loading}
                    />
                </div>

                {/* Reference ID (Optional) */}
                <div className="form-group">
                    <label className="form-label">Reference ID (Optional)</label>
                    <input
                        type="number"
                        name="reference_id"
                        value={formData.reference_id}
                        onChange={handleChange}
                        placeholder="e.g., System Update ID, Announcement ID"
                        className="form-input"
                        disabled={loading}
                    />
                </div>

                {/* Submit Button */}
                <div className="form-submit">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-broadcast"
                    >
                        <FaBroadcastTower />
                        {loading ? 'Broadcasting...' : 'Broadcast to All Users'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BroadcastForm;