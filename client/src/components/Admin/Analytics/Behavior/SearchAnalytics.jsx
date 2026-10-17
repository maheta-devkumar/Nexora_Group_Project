import React from 'react';
import './SearchAnalytics.css';

const SearchAnalytics = ({ data }) => {
    return (
        <div className="search-analytics bg-white rounded-xl shadow-sm p-6">
            <div className="search-header flex justify-between items-center mb-6">
                <h2 className="search-title text-xl font-bold text-gray-900">Search Analytics</h2>
                <div className="success-rate text-sm">
                    <span className="rate-value text-green-600 font-medium">{data.search_success_rate.toFixed(1)}%</span>
                    <span className="rate-label text-gray-500 ml-1">success rate</span>
                </div>
            </div>

            {/* Search Stats */}
            <div className="stats-grid grid grid-cols-3 gap-4 mb-8">
                <div className="stat-card text-center p-4 bg-gray-50 rounded-lg">
                    <div className="stat-value text-2xl font-bold text-gray-900">{data.total_searches.toLocaleString()}</div>
                    <div className="stat-label text-sm text-gray-600">Total Searches</div>
                </div>
                <div className="stat-card text-center p-4 bg-gray-50 rounded-lg">
                    <div className="stat-value text-2xl font-bold text-green-600">
                        {data.total_searches - data.no_result_searches}
                    </div>
                    <div className="stat-label text-sm text-gray-600">Successful</div>
                </div>
                <div className="stat-card text-center p-4 bg-gray-50 rounded-lg">
                    <div className="stat-value text-2xl font-bold text-red-600">{data.no_result_searches}</div>
                    <div className="stat-label text-sm text-gray-600">No Results</div>
                </div>
            </div>

            {/* Top Searches */}
            <div>
                <h4 className="top-searches-title font-medium text-gray-900 mb-4">Top Search Queries</h4>
                <div className="search-list space-y-3">
                    {data.top_searches.slice(0, 5).map((search, index) => (
                        <div key={index} className="search-item flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="search-info flex items-center">
                                <div className="search-rank w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="rank-number text-blue-600 font-bold">{index + 1}</span>
                                </div>
                                <div className="search-query font-medium text-gray-900">
                                    "{search.query}"
                                </div>
                            </div>
                            <div className="search-stats text-right">
                                <div className="search-count font-bold text-gray-900">{search.count} searches</div>
                                <div className="avg-results text-sm text-gray-500">{search.avg_results.toFixed(0)} avg results</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchAnalytics;