import React from 'react';
import './ActivityLogTable.css';

const ActivityLogTable = ({ logs }) => {
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const getActionColor = (action) => {
        switch (action.toLowerCase()) {
            case 'create': 
                return 'action-create bg-green-100 text-green-800';
            case 'update': 
                return 'action-update bg-blue-100 text-blue-800';
            case 'delete': 
                return 'action-delete bg-red-100 text-red-800';
            default: 
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="activity-log-table bg-white rounded-xl shadow-sm p-6">
            <div className="activity-header flex justify-between items-center mb-6">
                <h2 className="activity-title text-xl font-bold text-gray-900">Recent Admin Activity</h2>
                <span className="activity-subtitle text-sm text-gray-500">Last 50 actions</span>
            </div>

            <div className="space-y-4">
                {logs.slice(0, 10).map((log) => (
                    <div key={log.log_id} className="log-item p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="log-header flex justify-between items-start mb-2">
                            <div className="flex items-center">
                                <span className={`log-action px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                                    {log.action.toUpperCase()}
                                </span>
                                <span className="log-meta ml-2 text-sm text-gray-600">
                                    {log.entity_type} #{log.entity_id || 'N/A'}
                                </span>
                            </div>
                            <span className="log-time text-xs text-gray-500">{formatDate(log.created_at)}</span>
                        </div>
                        
                        <div className="log-details text-sm text-gray-700">
                            <div className="flex items-center">
                                <span className="font-medium mr-2">Admin ID:</span>
                                <span>{log.admin_id}</span>
                            </div>
                            {log.ip_address && (
                                <div className="flex items-center mt-1">
                                    <span className="font-medium mr-2">IP:</span>
                                    <span className="font-mono text-xs">{log.ip_address}</span>
                                </div>
                            )}
                        </div>
                        
                        {(log.old_value || log.new_value) && (
                            <div className="value-diff mt-3 pt-3 border-t border-gray-100">
                                <div className="diff-grid grid grid-cols-2 gap-4">
                                    {log.old_value && (
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">Old Value</div>
                                            <div className="old-value text-sm bg-red-50 p-2 rounded truncate">
                                                {log.old_value}
                                            </div>
                                        </div>
                                    )}
                                    {log.new_value && (
                                        <div>
                                            <div className="text-xs text-gray-500 mb-1">New Value</div>
                                            <div className="new-value text-sm bg-green-50 p-2 rounded truncate">
                                                {log.new_value}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ActivityLogTable;