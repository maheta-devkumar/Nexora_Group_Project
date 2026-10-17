import React from 'react';
import './ActivityCard.css';

const ActivityCard = ({ log }) => {
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getActionIcon = (action) => {
        switch (action.toLowerCase()) {
            case 'create': return '➕';
            case 'update': return '✏️';
            case 'delete': return '🗑️';
            default: return '📝';
        }
    };

    return (
        <div className="activity-card bg-white border border-gray-200 rounded-lg p-4">
            <div className="activity-content flex items-start">
                <div className="activity-icon text-2xl mr-3">{getActionIcon(log.action)}</div>
                <div className="activity-details flex-1">
                    <div className="activity-header flex justify-between items-start mb-2">
                        <div>
                            <span className="activity-action font-medium text-gray-900">{log.action}</span>
                            <span className="activity-entity text-gray-600 ml-2">{log.entity_type}</span>
                        </div>
                        <span className="activity-time text-sm text-gray-500">{formatTime(log.created_at)}</span>
                    </div>
                    <div className="activity-meta text-sm text-gray-600">
                        Admin #{log.admin_id} • IP: {log.ip_address || 'N/A'}
                    </div>
                    {log.entity_id && (
                        <div className="entity-id mt-2 text-xs text-blue-600 font-medium">
                            ID: {log.entity_id}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ActivityCard;