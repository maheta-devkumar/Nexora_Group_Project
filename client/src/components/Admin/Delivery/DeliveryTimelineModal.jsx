import React, { useState, useEffect } from 'react';
import { useDeliveryContext } from '../../../context/DeliveryContext';
import './DeliveryTimelineModal.css';

const DeliveryTimelineModal = ({ deliveryId, onClose }) => {
  const { adminGetDeliveryTimeline, loading } = useDeliveryContext();
  const [timeline, setTimeline] = useState([]);

  useEffect(() => {
    fetchTimeline();
  }, [deliveryId]);

  const fetchTimeline = async () => {
    const result = await adminGetDeliveryTimeline(deliveryId);
    if (result.success && result.data) {
      setTimeline(result.data);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      'ORDER_CREATED': '📝',
      'ASSIGNED': '👤',
      'PICKED_UP': '📦',
      'OUT_FOR_DELIVERY': '🚚',
      'DELIVERED': '✅',
      'FAILED': '❌',
      'CANCELLED': '🚫'
    };
    return icons[status] || '📌';
  };

  const getStatusColor = (status) => {
    const colors = {
      'ORDER_CREATED': '#2196F3',
      'ASSIGNED': '#9C27B0',
      'PICKED_UP': '#FF9800',
      'OUT_FOR_DELIVERY': '#3F51B5',
      'DELIVERED': '#4CAF50',
      'FAILED': '#F44336',
      'CANCELLED': '#9E9E9E'
    };
    return colors[status] || '#757575';
  };

  return (
    <div className="timeline-modal-overlay">
      <div className="timeline-modal-container">
        <div className="timeline-modal-header">
          <h3>Delivery Timeline</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="timeline-modal-body">
          {loading ? (
            <div className="timeline-loading">
              <div className="spinner"></div>
              <p>Loading timeline...</p>
            </div>
          ) : timeline.length === 0 ? (
            <div className="no-timeline">
              <div className="no-timeline-icon">📊</div>
              <p>No timeline data available</p>
            </div>
          ) : (
            <div className="timeline">
              {timeline.map((event, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker">
                    <div 
                      className="marker-icon"
                      style={{ backgroundColor: getStatusColor(event.status) }}
                    >
                      {getStatusIcon(event.status)}
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="timeline-line"></div>
                    )}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <h4 className="timeline-title">{event.status.replace(/_/g, ' ')}</h4>
                      <span className="timeline-time">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <div className="timeline-details">
                      {event.delivery_person_name && (
                        <div className="detail-item">
                          <span className="detail-label">Delivery Person:</span>
                          <span className="detail-value">{event.delivery_person_name}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="detail-item">
                          <span className="detail-label">Location:</span>
                          <span className="detail-value">{event.location}</span>
                        </div>
                      )}
                      {event.notes && (
                        <div className="detail-item">
                          <span className="detail-label">Notes:</span>
                          <span className="detail-value">{event.notes}</span>
                        </div>
                      )}
                    </div>
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="timeline-attachments">
                        <span className="attachments-label">Attachments:</span>
                        <div className="attachments-list">
                          {event.attachments.map((attachment, idx) => (
                            <a 
                              key={idx}
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="attachment-link"
                            >
                              📎 {attachment.name || 'Attachment'}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTimelineModal;