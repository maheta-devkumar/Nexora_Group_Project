import React, { useState } from 'react';
import { FaTimes, FaPaperPlane, FaUser, FaUsers, FaTag, FaFileAlt } from 'react-icons/fa';
import './SendNotificationModal.css';

const SendNotificationModal = ({ 
    isOpen, 
    onClose, 
    onSubmit, 
    loading,
    mode = 'single',
    initialUserId = null
}) => {
    const [formData, setFormData] = useState({
        user_ids: initialUserId ? [initialUserId] : [],
        title: '',
        message: '',
        type: 'SYSTEM',
        reference_id: ''
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

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        
        if (mode === 'single' && formData.user_ids.length !== 1) {
            alert('Please select exactly one user');
            return;
        }
        
        if (mode === 'multiple' && formData.user_ids.length === 0) {
            alert('Please select at least one user');
            return;
        }

        const payload = {
            userIds: mode === 'single' ? [formData.user_ids[0]] : formData.user_ids,
            title: formData.title,
            message: formData.message,
            type: formData.type,
            referenceId: formData.reference_id || null
        };

        onSubmit(payload, mode);
        
        setFormData({
            user_ids: [],
            title: '',
            message: '',
            type: 'SYSTEM',
            reference_id: ''
        });
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-container">
                <div className="modal-panel">
                    {/* Header */}
                    <div className="modal-header">
                        <h3 className="modal-title">
                            <FaPaperPlane />
                            {mode === 'single' ? 'Send Notification to User' : 'Send Notification to Users'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="close-button"
                        >
                            <FaTimes />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="modal-body">
                        {/* User Selection */}
                        {mode === 'multiple' && (
                            <div className="user-selection">
                                <label className="user-label">
                                    <FaUsers /> Select Users
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
                                                        <FaTimes size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {mode === 'single' && !initialUserId && (
                            <div className="form-group">
                                <label className="form-label">
                                    <FaUser /> User ID
                                </label>
                                <input
                                    type="number"
                                    name="user_id"
                                    value={formData.user_ids[0] || ''}
                                    onChange={(e) => setFormData(prev => ({ 
                                        ...prev, 
                                        user_ids: e.target.value ? [parseInt(e.target.value)] : [] 
                                    }))}
                                    placeholder="Enter User ID"
                                    className="form-input"
                                    required
                                    disabled={loading}
                                />
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

                        {/* Footer Buttons */}
                        <div className="modal-footer">
                            <button
                                type="button"
                                onClick={onClose}
                                className="btn-cancel"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-send"
                            >
                                <FaPaperPlane />
                                {loading ? 'Sending...' : 'Send Notification'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SendNotificationModal;