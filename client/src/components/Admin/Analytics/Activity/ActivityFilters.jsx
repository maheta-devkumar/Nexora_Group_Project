import React from 'react'; 
import './ActivityFilters.css';

const ActivityFilters = ({ onFilterChange }) => {
    const actions = ['ALL', 'CREATE', 'UPDATE', 'DELETE'];
    const entities = ['ALL', 'PRODUCT', 'USER', 'ORDER', 'CATEGORY'];

    return (
        <div className="activity-filters bg-white rounded-lg p-4">
            <h4 className="filters-title font-medium text-gray-900 mb-4">Filter Activity</h4>
            <div className="space-y-4">
                <div className="filter-group">
                    <label className="filter-label block text-sm font-medium text-gray-700 mb-2">Action Type</label>
                    <div className="filter-buttons flex flex-wrap gap-2">
                        {actions.map((action) => (
                            <button
                                key={action}
                                onClick={() => onFilterChange({ action: action === 'ALL' ? null : action })}
                                className="filter-button px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                            >
                                {action}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="filter-group">
                    <label className="filter-label block text-sm font-medium text-gray-700 mb-2">Entity Type</label>
                    <div className="filter-buttons flex flex-wrap gap-2">
                        {entities.map((entity) => (
                            <button
                                key={entity}
                                onClick={() => onFilterChange({ entity: entity === 'ALL' ? null : entity })}
                                className="filter-button px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                            >
                                {entity}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ActivityFilters;