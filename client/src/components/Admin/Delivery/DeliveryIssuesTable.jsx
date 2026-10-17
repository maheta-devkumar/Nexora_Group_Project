import React, { useState, useEffect } from 'react';
import { useDeliveryContext } from '../../../context/DeliveryContext';
import './DeliveryIssuesTable.css';

const DeliveryIssuesTable = () => {
  const { 
    deliveryIssues = [], 
    adminGetDeliveryIssues,
    adminCancelDelivery,
    adminCancelDeliveryToPool,
    loading 
  } = useDeliveryContext();

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    adminGetDeliveryIssues();
  }, [adminGetDeliveryIssues]);

  const getIssueTypeIcon = (type) => {
    if (!type) return '⚠️';
    
    const icons = {
      'DELAYED': '⏰',
      'DAMAGED': '💔',
      'WRONG_ADDRESS': '📍',
      'CUSTOMER_NOT_AVAILABLE': '👤',
      'TRAFFIC': '🚦',
      'VEHICLE_ISSUE': '🚗',
      'OTHER': '❓'
    };
    return icons[type] || '⚠️';
  };

  const getIssueSeverity = (severity) => {
    if (!severity) return null;
    
    const config = {
      'LOW': { color: '#4CAF50', label: 'Low' },
      'MEDIUM': { color: '#FF9800', label: 'Medium' },
      'HIGH': { color: '#F44336', label: 'High' },
      'CRITICAL': { color: '#D32F2F', label: 'Critical' }
    };
    const cfg = config[severity] || { color: '#757575', label: 'Unknown' };
    
    return (
      <span 
        className="severity-badge"
        style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
      >
        {cfg.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    
    const config = {
      'REPORTED': { color: '#FF9800', label: 'Reported' },
      'IN_PROGRESS': { color: '#2196F3', label: 'In Progress' },
      'RESOLVED': { color: '#4CAF50', label: 'Resolved' },
      'ESCALATED': { color: '#9C27B0', label: 'Escalated' }
    };
    const cfg = config[status] || { color: '#757575', label: status };
    
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: cfg.color + '20', color: cfg.color }}
      >
        {cfg.label}
      </span>
    );
  };

  const handleCancel = async (deliveryId) => {
    if (!deliveryId) return;
    
    if (window.confirm('Are you sure you want to cancel this delivery?')) {
      const result = await adminCancelDelivery(deliveryId);
      if (result.success) {
        adminGetDeliveryIssues();
      }
    }
  };

  const handleCancelToPool = async (deliveryId) => {
    if (!deliveryId) return;
    
    if (window.confirm('Cancel and return to delivery pool?')) {
      const result = await adminCancelDeliveryToPool(deliveryId);
      if (result.success) {
        adminGetDeliveryIssues();
      }
    }
  };

  return (
    <div className="delivery-issues-table">
      <div className="issues-header">
        <div>
          <h2>Delivery Issues</h2>
          <p className="subtitle">Manage and resolve delivery problems</p>
        </div>
        <button 
          className="refresh-btn"
          onClick={adminGetDeliveryIssues}
          disabled={loading}
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="loading-issues">
          <div className="spinner"></div>
          <p>Loading issues...</p>
        </div>
      ) : deliveryIssues.length === 0 ? (
        <div className="no-issues">
          <div className="no-issues-icon">✅</div>
          <h3>No Delivery Issues</h3>
          <p>All deliveries are proceeding smoothly</p>
        </div>
      ) : (
        <div className="issues-grid">
          {deliveryIssues.map((issue, index) => (
            <div key={issue.issue_id || index} className="issue-card">
              <div className="issue-header">
                <div className="issue-icon">
                  {getIssueTypeIcon(issue.issue_type)}
                </div>
                <div className="issue-meta">
                  <h4 className="issue-title">
                    {issue.issue_type ? issue.issue_type.replace(/_/g, ' ') : 'Unknown Issue'}
                  </h4>
                  <div className="issue-ids">
                    <span className="delivery-id">Delivery: {issue.delivery_id || 'N/A'}</span>
                    <span className="order-id">Order: {issue.order_id || 'N/A'}</span>
                  </div>
                </div>
                <div className="issue-severity">
                  {getIssueSeverity(issue.severity)}
                </div>
              </div>

              <div className="issue-details">
                <div className="detail-row">
                  <span className="detail-label">Reported By:</span>
                  <span className="detail-value">{issue.reported_by || 'Unknown'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Reported At:</span>
                  <span className="detail-value">
                    {issue.reported_at 
                      ? new Date(issue.reported_at).toLocaleString()
                      : 'Unknown'
                    }
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value">
                    {getStatusBadge(issue.status)}
                  </span>
                </div>
                {issue.description && (
                  <div className="issue-description">
                    <span className="desc-label">Description:</span>
                    <p className="desc-text">{issue.description}</p>
                  </div>
                )}
              </div>

              <div className="issue-actions">
                <button
                  className="action-btn view-btn"
                  onClick={() => {
                    setSelectedIssue(issue);
                    setShowDetails(true);
                  }}
                >
                  👁️ View Details
                </button>
                <button
                  className="action-btn resolve-btn"
                  onClick={() => {
                    alert('Resolve feature coming soon');
                  }}
                >
                  ✅ Mark Resolved
                </button>
                <button
                  className="action-btn cancel-btn"
                  onClick={() => handleCancel(issue.delivery_id)}
                >
                  🚫 Cancel Delivery
                </button>
                {issue.can_return_to_pool && (
                  <button
                    className="action-btn pool-btn"
                    onClick={() => handleCancelToPool(issue.delivery_id)}
                  >
                    🔄 Return to Pool
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Details Modal */}
      {showDetails && selectedIssue && (
        <div className="issue-details-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Issue Details</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-section">
                <h4>Basic Information</h4>
                <div className="details-grid">
                  <div className="detail-item">
                    <label>Issue Type:</label>
                    <span>{selectedIssue.issue_type || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Severity:</label>
                    <span>{getIssueSeverity(selectedIssue.severity)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span>{getStatusBadge(selectedIssue.status)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Reported By:</label>
                    <span>{selectedIssue.reported_by || 'Unknown'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Delivery ID:</label>
                    <span className="delivery-id">{selectedIssue.delivery_id || 'N/A'}</span>
                  </div>
                  <div className="detail-item">
                    <label>Order ID:</label>
                    <span className="order-id">{selectedIssue.order_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {selectedIssue.description && (
                <div className="detail-section">
                  <h4>Description</h4>
                  <div className="description-box">
                    {selectedIssue.description}
                  </div>
                </div>
              )}

              {selectedIssue.attachments && Array.isArray(selectedIssue.attachments) && selectedIssue.attachments.length > 0 && (
                <div className="detail-section">
                  <h4>Attachments</h4>
                  <div className="attachments">
                    {selectedIssue.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment"
                      >
                        📎 {attachment.name || 'Attachment'}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="detail-section">
                <h4>Timeline</h4>
                <div className="timeline">
                  <div className="timeline-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <span>
                        Reported at {selectedIssue.reported_at 
                          ? new Date(selectedIssue.reported_at).toLocaleString()
                          : 'Unknown time'
                        }
                      </span>
                    </div>
                  </div>
                  {selectedIssue.resolved_at && (
                    <div className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <span>
                          Resolved at {new Date(selectedIssue.resolved_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryIssuesTable;