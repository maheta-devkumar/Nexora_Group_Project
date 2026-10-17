import React from 'react';
import './DetailsTabs.css';

const DetailsTabs = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className="admin-details-tabs">
            <div className="admin-tabs-container">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`admin-tab-btn ${activeTab === tab.id ? 'admin-active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DetailsTabs;