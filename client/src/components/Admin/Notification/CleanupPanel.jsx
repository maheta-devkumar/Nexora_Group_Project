import React, { useState } from 'react';
import { FaTrash, FaCalendar, FaExclamationTriangle, FaHistory, FaInfoCircle } from 'react-icons/fa';
import './CleanupPanel.css';

const CleanupPanel = ({ onCleanup, loading, cleanupPreview }) => {
    const [days, setDays] = useState(30);
    const [confirmText, setConfirmText] = useState('');
    const [showPreview, setShowPreview] = useState(false);

    const handlePreview = () => {
        onCleanup(days, false);
        setShowPreview(true);
    };

    const handleConfirmCleanup = () => {
        if (confirmText === 'DELETE') {
            onCleanup(days, true);
            setConfirmText('');
            setShowPreview(false);
        } else {
            alert('Please type "DELETE" to confirm');
        }
    };

    const ageOptions = [
        { days: 7, label: '1 Week' },
        { days: 30, label: '1 Month' },
        { days: 90, label: '3 Months' },
        { days: 180, label: '6 Months' },
        { days: 365, label: '1 Year' },
        { days: 730, label: '2 Years' }
    ];

    return (
        <div className="cleanup-panel">
            <div className="cleanup-header">
                <FaTrash />
                <h3>Cleanup Old Notifications</h3>
            </div>

            {/* Warning Banner */}
            <div className="warning-alert">
                <div className="warning-content">
                    <FaExclamationTriangle className="warning-icon" />
                    <div className="warning-text">
                        <h4>Warning: Irreversible Action</h4>
                        <p>
                            This will permanently delete notifications older than the specified age. 
                            This action cannot be undone. Always preview before deleting.
                        </p>
                    </div>
                </div>
            </div>

            {/* Age Selection */}
            <div className="age-selection">
                <label className="age-label">
                    <FaCalendar /> Delete notifications older than:
                </label>
                <div className="age-options">
                    {ageOptions.map(option => (
                        <button
                            key={option.days}
                            type="button"
                            onClick={() => setDays(option.days)}
                            className={`age-option ${days === option.days ? 'active' : ''}`}
                            disabled={loading}
                        >
                            <div className="age-option-days">{option.days} days</div>
                            <div className="age-option-label">{option.label}</div>
                        </button>
                    ))}
                </div>
                <div className="age-info">
                    <FaInfoCircle />
                    Notifications older than {days} days will be deleted
                </div>
            </div>

            {/* Preview Results */}
            {showPreview && cleanupPreview && (
                <div className="preview-results">
                    <div className="preview-content">
                        <FaHistory className="preview-icon" />
                        <div className="preview-text">
                            <h4>Preview Results</h4>
                            <div className="preview-details">
                                <p><strong>{cleanupPreview.would_delete_count || 0}</strong> notifications would be deleted</p>
                                <p>Notifications older than {cleanupPreview.days || days} days</p>
                                {cleanupPreview.confirm_required && (
                                    <p className="confirm-warning">
                                        ⚠️ Confirm deletion by typing "DELETE" below
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
                <button
                    onClick={handlePreview}
                    disabled={loading}
                    className="btn-preview"
                >
                    <FaHistory />
                    {loading ? 'Generating Preview...' : 'Preview Deletion'}
                </button>

                {showPreview && cleanupPreview?.confirm_required && cleanupPreview.would_delete_count > 0 && (
                    <>
                        <div className="confirm-input">
                            <label>
                                Type "DELETE" to confirm permanent deletion:
                            </label>
                            <input
                                type="text"
                                value={confirmText}
                                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                                placeholder="Type DELETE here"
                                className="confirm-field"
                                disabled={loading}
                            />
                        </div>
                        
                        <button
                            onClick={handleConfirmCleanup}
                            disabled={loading || confirmText !== 'DELETE'}
                            className="btn-delete"
                        >
                            <FaTrash />
                            {loading ? 'Deleting...' : `Permanently Delete ${cleanupPreview.would_delete_count} Notifications`}
                        </button>
                    </>
                )}
            </div>

            {/* Information Section */}
            <div className="guidelines">
                <h4>
                    <FaInfoCircle /> Cleanup Guidelines
                </h4>
                <ul className="guidelines-list">
                    <li>Always preview before deleting</li>
                    <li>Consider archiving important notifications instead of deleting</li>
                    <li>Monthly cleanup is recommended for system performance</li>
                    <li>Notifications older than 90 days rarely need to be kept</li>
                    <li>System notifications can typically be cleaned up after 30 days</li>
                </ul>
            </div>
        </div>
    );
};

export default CleanupPanel;