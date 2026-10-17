import React from 'react';
import './ActionModal.css';

const ActionModal = ({
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'default',
    loading = false
}) => {
    const getTypeClass = () => {
        switch (type) {
            case 'danger': return 'admin-modal-danger';
            case 'warning': return 'admin-modal-warning';
            case 'success': return 'admin-modal-success';
            default: return '';
        }
    };

    return (
        <div className="admin-modal-overlay">
            <div className={`admin-modal-content ${getTypeClass()}`}>
                <div className="admin-modal-header">
                    <h3 className="admin-modal-title">{title}</h3>
                </div>

                <div className="admin-modal-body">
                    <p>{message}</p>
                </div>

                <div className="admin-modal-actions">
                    <button
                        className="admin-modal-btn admin-modal-btn-cancel"
                        onClick={onCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </button>
                    <button
                        className="admin-modal-btn admin-modal-btn-confirm"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActionModal;