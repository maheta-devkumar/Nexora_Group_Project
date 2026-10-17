import React, { useState } from 'react';
import './QuickActions.css';
import {
  Camera,
  AlertCircle,
  Navigation,
  X,
  Check
} from 'lucide-react';
import { useDeliveryDashboardContext } from '../../../context/DeliveryPersonDashboardContext';

const QuickActions = () => {
  const { reportIssue, addLog, loading } = useDeliveryDashboardContext();

  // Removed showQRModal, qrData, qrLoading states
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueData, setIssueData] = useState({
    order_id: '',
    issue_type: 'delivery',
    description: '',
    priority: 'MEDIUM'
  });
  const [uploadPODData, setUploadPODData] = useState({
    order_id: '',
    image_url: '',
    notes: ''
  });

  const actions = [

    {
      id: 'upload-pod',
      label: 'Upload POD',
      icon: <Camera size={24} />,
      onClick: () => handlePODUpload(),
      color: '#10b981'
    },
    {
      id: 'report-issue',
      label: 'Report Issue',
      icon: <AlertCircle size={24} />,
      onClick: () => setShowIssueModal(true),
      color: '#ef4444'
    },
    {
      id: 'navigate',
      label: 'Navigate',
      icon: <Navigation size={24} />,
      onClick: () => handleNavigation(),
      color: '#8b5cf6'
    }
  ];



  const handleIssueSubmit = async (e) => {
    e.preventDefault();

    if (!issueData.order_id || !issueData.description) {
      addLog('Please fill all required fields', 'warning');
      return;
    }

    addLog(`Reporting issue for order ${issueData.order_id}`, 'info');

    try {
      const result = await reportIssue(
        parseInt(issueData.order_id),
        issueData.issue_type,
        issueData.description,
        issueData.priority
      );

      if (result.success) {
        addLog('✅ Issue reported successfully', 'success');
        setShowIssueModal(false);
        setIssueData({
          order_id: '',
          issue_type: 'delivery',
          description: '',
          priority: 'MEDIUM'
        });
      } else {
        addLog(`❌ Failed to report issue: ${result.message}`, 'error');
      }
    } catch (error) {
      addLog(`❌ Error reporting issue: ${error.message}`, 'error');
    }
  };

  const handlePODUpload = () => {
    // For now, show a prompt. In real app, this would open file upload
    const orderId = prompt('Enter Order ID for POD upload:');
    if (orderId) {
      const imageUrl = prompt('Enter image URL (in real app, this would be file upload):');
      if (imageUrl) {
        const notes = prompt('Enter any notes (optional):');
        addLog(`POD upload requested for order ${orderId}. Image URL: ${imageUrl}`, 'info');

        // In real app, you would call uploadPOD API here
        // uploadPOD(parseInt(orderId), imageUrl, null, notes);
      }
    }
  };

  const handleNavigation = () => {
    const orderId = prompt('Enter Order ID for navigation:');
    if (orderId) {
      addLog(`Opening navigation for order ${orderId}`, 'info');
      // In real app, you would call fetchNavigationDetails and open maps
      window.open(`https://www.google.com/maps/search/?api=1&query=Delivery+Location`, '_blank');
    }
  };

  return (
    <>
      <div className="dp-quick-actions">
        <h3>Quick Actions</h3>
        <div className="dp-actions-grid">
          {actions.map((action) => (
            <button
              key={action.id}
              className="dp-action-btn"
              onClick={action.onClick}
              disabled={loading}
              style={{ '--action-color': action.color }}
            >
              <span className="dp-action-icon">{action.icon}</span>
              <span className="dp-action-label">{action.label}</span>
            </button>
          ))}
        </div>
      </div>



      {/* Issue Report Modal */}
      {showIssueModal && (
        <div className="dp-modal-overlay">
          <div className="dp-modal-content">
            <div className="dp-modal-header">
              <h3>Report Issue</h3>
              <button
                className="dp-close-btn"
                onClick={() => setShowIssueModal(false)}
                disabled={loading}
              >
                <X size={20} />
              </button>
            </div>

            <form className="dp-modal-body" onSubmit={handleIssueSubmit}>
              <div className="dp-form-group">
                <label htmlFor="orderId">Order ID *</label>
                <input
                  type="number"
                  id="orderId"
                  className="dp-form-input"
                  placeholder="Enter order ID"
                  value={issueData.order_id}
                  onChange={(e) => setIssueData({ ...issueData, order_id: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="dp-form-group">
                <label htmlFor="issueType">Issue Type *</label>
                <select
                  id="issueType"
                  className="dp-form-select"
                  value={issueData.issue_type}
                  onChange={(e) => setIssueData({ ...issueData, issue_type: e.target.value })}
                  required
                  disabled={loading}
                >
                  <option value="delivery">Delivery Issue</option>
                  <option value="payment">Payment Issue</option>
                  <option value="customer">Customer Not Available</option>
                  <option value="address">Wrong Address</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="dp-form-group">
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  className="dp-form-select"
                  value={issueData.priority}
                  onChange={(e) => setIssueData({ ...issueData, priority: e.target.value })}
                  disabled={loading}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="dp-form-group">
                <label htmlFor="issueDescription">Description *</label>
                <textarea
                  id="issueDescription"
                  className="dp-form-textarea"
                  placeholder="Describe your issue in detail..."
                  value={issueData.description}
                  onChange={(e) => setIssueData({ ...issueData, description: e.target.value })}
                  rows="4"
                  required
                  disabled={loading}
                />
              </div>
            </form>

            <div className="dp-modal-footer">
              <button
                className="dp-btn-secondary"
                onClick={() => setShowIssueModal(false)}
                type="button"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="dp-btn-primary"
                type="submit"
                onClick={handleIssueSubmit}
                disabled={loading || !issueData.order_id || !issueData.description}
              >
                {loading ? (
                  <>
                    <div className="dp-spinner-small"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Submit Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickActions;
