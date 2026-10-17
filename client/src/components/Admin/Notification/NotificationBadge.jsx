import React from 'react';
import { FaBox, FaCreditCard, FaTruck, FaTag, FaComment, FaCog, FaEnvelope, FaEnvelopeOpen } from 'react-icons/fa';
import './NotificationBadge.css';

const NotificationBadge = ({ type, status, size = 'sm' }) => {
    // Type icons and colors
    const typeConfig = {
        ORDER: { icon: FaBox, className: 'ORDER' },
        PAYMENT: { icon: FaCreditCard, className: 'PAYMENT' },
        DELIVERY: { icon: FaTruck, className: 'DELIVERY' },
        OFFER: { icon: FaTag, className: 'OFFER' },
        FEEDBACK: { icon: FaComment, className: 'FEEDBACK' },
        SYSTEM: { icon: FaCog, className: 'SYSTEM' }
    };

    // Status icons
    const StatusIcon = status === 'read' ? FaEnvelopeOpen : FaEnvelope;
    
    const typeInfo = typeConfig[type] || typeConfig.SYSTEM;
    const TypeIcon = typeInfo.icon;

    return (
        <div className="notification-badge">
            <span className={`type-badge ${typeInfo.className} ${size}`}>
                <TypeIcon className="type-icon" />
                <span className="type-text">{type.toLowerCase()}</span>
            </span>
            
            <span className={`status-badge ${status} ${size}`}>
                <StatusIcon className="status-icon" />
                <span className="status-text">{status}</span>
            </span>
        </div>
    );
};

export default NotificationBadge;