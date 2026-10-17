import React from 'react';  
import './UserActivity.css';

const UserActivity = ({ behavior }) => {
    const { active_sessions, device_breakdown } = behavior;

    return (
        <div className="user-activity bg-white rounded-lg p-4">
            <h4 className="activity-title font-medium text-gray-900 mb-4">User Activity</h4>
            
            <div className="sessions-container mb-6">
                <div className="sessions-header flex items-center justify-between mb-2">
                    <span className="sessions-label text-gray-700">Active Sessions (30min)</span>
                    <span className="sessions-count text-xl font-bold text-green-600">{active_sessions}</span>
                </div>
                <div className="progress-bar w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="progress-fill bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(active_sessions * 10, 100)}%` }}
                    ></div>
                </div>
            </div>

            <div>
                <h5 className="device-title text-sm font-medium text-gray-700 mb-3">Device Breakdown</h5>
                <div className="device-list space-y-3">
                    {Object.entries(device_breakdown).map(([device, percentage]) => (
                        <div key={device} className="device-item flex items-center justify-between">
                            <div className="device-info flex items-center">
                                <div className="device-marker w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                                <span className="device-name text-sm text-gray-700">{device}</span>
                            </div>
                            <span className="device-percentage text-sm font-medium text-gray-900">{percentage.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UserActivity;