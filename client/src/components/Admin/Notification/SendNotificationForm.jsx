import React, { useState } from 'react';
import { FaPaperPlane, FaUser, FaUsers, FaTag, FaFileAlt, FaTimes } from 'react-icons/fa';
import './SendNotificationForm.css';

const SendNotificationForm = ({ onSubmit, loading, users = [] }) => {
    const [formData, setFormData] = useState({
        user_ids: [],
        title: '',
        message: '',
        type: 'SYSTEM',
        reference_id: '',
        send_type: 'single'
    });

    const [selectedUserId, setSelectedUserId] = useState('');

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

    const handleSendTypeChange = (type) => {
        setFormData(prev => ({ 
            ...prev, 
            send_type: type,
            user_ids: type === 'all' ? [] : prev.user_ids
        }));
    };

    const addUserId = () => {
        if (selectedUserId && !formData.user_ids.includes(parseInt(selectedUserId))) {
            setFormData(prev => ({
                ...prev,
                user_ids: [...prev.user_ids, parseInt(selectedUserId)]
            }));
            setSelectedUserId('');
        }
    };

    const removeUserId = (userId) => {
        setFormData(prev => ({
            ...prev,
            user_ids: prev.user_ids.filter(id => id !== userId)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        let payload = {};
        
        if (formData.send_type === 'single') {
            if (formData.user_ids.length === 1) {
                payload = {
                    userId: formData.user_ids[0],
                    title: formData.title,
                    message: formData.message,
                    type: formData.type,
                    referenceId: formData.reference_id || null
                };
            } else {
                alert('Please select exactly one user for single notification');
                return;
            }
        } else if (formData.send_type === 'multiple') {
            if (formData.user_ids.length === 0) {
                alert('Please select at least one user');
                return;
            }
            payload = {
                userIds: formData.user_ids,
                title: formData.title,
                message: formData.message,
                type: formData.type,
                referenceId: formData.reference_id || null
            };
        } else if (formData.send_type === 'all') {
            alert('Use the Broadcast tab for sending to all users');
            return;
        }

        onSubmit(payload, formData.send_type);
        
        if (formData.send_type !== 'all') {
            setFormData(prev => ({
                ...prev,
                title: '',
                message: '',
                user_ids: [],
                reference_id: ''
            }));
        }
    };

    return (
        <div className="send-form">
            <div className="form-header">
                <FaPaperPlane />
                <h3>Send Notification</h3>
            </div>

            {/* Send Type Toggle */}
            <div className="type-toggle">
                <button
                    type="button"
                    onClick={() => handleSendTypeChange('single')}
                    className={`type-tab ${formData.send_type === 'single' ? 'active' : ''}`}
                >
                    <FaUser /> Single User
                </button>
                <button
                    type="button"
                    onClick={() => handleSendTypeChange('multiple')}
                    className={`type-tab ${formData.send_type === 'multiple' ? 'active' : ''}`}
                >
                    <FaUsers /> Multiple Users
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* User Selection */}
                {formData.send_type !== 'all' && (
                    <div className="user-selection">
                        <label className="user-label">
                            <FaUser /> 
                            {formData.send_type === 'single' ? 'Select User' : 'Select Users'}
                        </label>
                        
                        <div className="user-input-group">
                            <input
                                type="number"
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                placeholder="Enter User ID"
                                className="user-input"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                onClick={addUserId}
                                disabled={loading || !selectedUserId}
                                className="btn-add-user"
                            >
                                Add
                            </button>
                        </div>

                        {/* Selected Users */}
                        {formData.user_ids.length > 0 && (
                            <div className="selected-users">
                                <div className="selected-users-label">
                                    Selected Users ({formData.user_ids.length}):
                                </div>
                                <div className="user-tags">
                                    {formData.user_ids.map(userId => (
                                        <div 
                                            key={userId} 
                                            className="user-tag"
                                        >
                                            <span>User #{userId}</span>
                                            <button
                                                type="button"
                                                onClick={() => removeUserId(userId)}
                                                className="remove-user"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Notification Type */}
                <div className="form-group">
                    <label className="form-label">
                        <FaTag /> Notification Type
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
                        placeholder="Enter notification title"
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
                        placeholder="Enter notification message"
                        rows="4"
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
                        placeholder="e.g., Order ID, Payment ID"
                        className="form-input"
                        disabled={loading}
                    />
                </div>

                {/* Submit Button */}
                <div className="form-submit">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-send"
                    >
                        <FaPaperPlane />
                        {loading ? 'Sending...' : (
                            formData.send_type === 'single' 
                                ? 'Send to User' 
                                : 'Send to Selected Users'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SendNotificationForm;