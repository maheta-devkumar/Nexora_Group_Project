import React from 'react'; 
import './StatusBadge.css';

const StatusBadge = ({ status, type = 'order' }) => {
    const getStatusConfig = () => {
        const configs = {
            order: {
                PLACED: { className: 'order placed', label: 'Placed' },
                PROCESSING: { className: 'order processing', label: 'Processing' },
                SHIPPED: { className: 'order shipped', label: 'Shipped' },
                DELIVERED: { className: 'order delivered', label: 'Delivered' },
                CANCELLED: { className: 'order cancelled', label: 'Cancelled' }
            },
            payment: {
                PENDING: { className: 'payment pending', label: 'Pending' },
                COMPLETED: { className: 'payment completed', label: 'Completed' },
                FAILED: { className: 'payment failed', label: 'Failed' },
                REFUNDED: { className: 'payment refunded', label: 'Refunded' }
            },
            return: {
                REQUESTED: { className: 'return requested', label: 'Requested' },
                APPROVED: { className: 'return approved', label: 'Approved' },
                REJECTED: { className: 'return rejected', label: 'Rejected' },
                PROCESSING: { className: 'return processing', label: 'Processing' },
                COMPLETED: { className: 'return completed', label: 'Completed' }
            },
            refund: {
                PENDING: { className: 'refund pending', label: 'Pending' },
                PROCESSING: { className: 'refund processing', label: 'Processing' },
                COMPLETED: { className: 'refund completed', label: 'Completed' },
                FAILED: { className: 'refund failed', label: 'Failed' }
            }
        };

        const config = configs[type] || configs.order;
        return config[status] || { className: 'default', label: status };
    };

    const config = getStatusConfig();

    return (
        <span className={`status-badge ${config.className}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;