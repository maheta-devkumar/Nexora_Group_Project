import React, { useState } from 'react';
import { useOrderAdminContext } from '../../../../context/OrderAdminContext';
import './IssueModal.css';

const IssueModal = ({ issue, onClose, onActionComplete }) => {
    const { resolveOrderIssue } = useOrderAdminContext();
    const [resolutionNote, setResolutionNote] = useState('');

    const handleResolve = async () => {
        if (!resolutionNote.trim()) {
            alert('Please provide a resolution note');
            return;
        }
        
        const result = await resolveOrderIssue(issue.order_id, issue.issue_id, resolutionNote);
        if (result.success) {
            onActionComplete();
        }
    };

    if (!issue) return null;

    return (
        <div className="issue-modal-overlay">
            <div className="issue-modal">
                <div className="issue-modal-header">
                    <h3>Resolve Issue</h3>
                    <p className="issue-subtitle">Issue #{issue.issue_id} for Order #{issue.order_id}</p>
                </div>
                
                <div className="issue-description">
                    <p className="issue-description-label">Issue Description:</p>
                    <div className="issue-description-content">
                        <p>{issue.description}</p>
                    </div>
                </div>
                
                <div className="resolution-input">
                    <label>Resolution Note</label>
                    <textarea
                        className="resolution-textarea"
                        rows="4"
                        placeholder="Describe how this issue was resolved..."
                        value={resolutionNote}
                        onChange={(e) => setResolutionNote(e.target.value)}
                    />
                </div>
                
                <div className="issue-modal-actions">
                    <button
                        onClick={handleResolve}
                        className="issue-modal-button resolve"
                    >
                        Mark as Resolved
                    </button>
                    <button
                        onClick={onClose}
                        className="issue-modal-button cancel"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IssueModal;