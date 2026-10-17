import React from 'react';
import './OrderTimeline.css';

const OrderTimeline = ({ status, timeline }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return 'fas fa-check-circle';
      case 'current':
        return 'fas fa-circle';
      case 'pending':
        return 'fas fa-clock';
      default:
        return 'fas fa-circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#00b894';
      case 'current':
        return '#667eea';
      case 'pending':
        return '#b2bec3';
      default:
        return '#b2bec3';
    }
  };

  return (
    <div className="order-timeline">
      <h4>Order Timeline</h4>
      <div className="timeline">
        {timeline.map((event, index) => (
          <div key={event.id} className="timeline-event">
            <div className="timeline-marker">
              <i 
                className={getStatusIcon(event.status)} 
                style={{ color: getStatusColor(event.status) }}
              ></i>
            </div>
            <div className="timeline-content">
              <h5>{event.title}</h5>
              <p>{event.description}</p>
              <span className="timeline-date">{event.date}</span>
            </div>
            {index < timeline.length - 1 && (
              <div className="timeline-connector"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderTimeline;