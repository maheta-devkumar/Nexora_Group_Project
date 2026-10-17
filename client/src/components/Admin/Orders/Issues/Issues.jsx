import React from 'react'; 
import './Issues.css';

const IssuesList = ({ issues, onResolve, loading }) => {
    if (loading && issues.length === 0) {
        return (
            <div className="loading-state">
                <div>Loading issues...</div>
            </div>
        );
    }

    if (issues.length === 0 && !loading) {
        return (
            <div className="empty-state">
                <div className="text-gray-500">No issues found.</div>
            </div>
        );
    }

    return (
        <div className="issues-container">
            {issues.map((issue) => (
                <div key={issue.issue_id} className="issue-card">
                    <div className="issue-header">
                        <div className="issue-title">
                            <h3>Issue #{issue.issue_id}</h3>
                            <p className="issue-meta">
                                Order #{issue.order_id} • {new Date(issue.created_at).toLocaleDateString()}
                            </p>
                        </div>
                        <span className={`issue-status ${issue.resolved ? 'resolved' : 'open'}`}>
                            {issue.resolved ? 'Resolved' : 'Open'}
                        </span>
                    </div>
                    
                    <div className="issue-description">
                        <p>{issue.description}</p>
                    </div>
                    
                    {issue.resolved && issue.resolution_note && (
                        <div className="resolution-note">
                            <p className="resolution-title">Resolution:</p>
                            <p className="resolution-text">{issue.resolution_note}</p>
                        </div>
                    )}
                    
                    {!issue.resolved && (
                        <div className="issue-actions">
                            <button
                                onClick={() => onResolve(issue)}
                                className="resolve-button"
                            >
                                Resolve Issue
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default IssuesList;