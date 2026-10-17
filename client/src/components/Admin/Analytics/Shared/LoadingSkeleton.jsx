import React from 'react';
import './LoadingSkeleton.css';

const LoadingSkeleton = () => {
    return (
        <div className="loading-skeleton min-h-screen bg-gray-50 p-6">
            <div className="skeleton-container max-w-7xl mx-auto">
                {/* Header Skeleton */}
                <div className="skeleton-header mb-8">
                    <div className="skeleton-title h-8 bg-gray-200 rounded w-64 mb-2"></div>
                    <div className="skeleton-description h-4 bg-gray-200 rounded w-96"></div>
                </div>

                {/* Dashboard Summary Skeleton */}
                <div className="skeleton-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton-card bg-white rounded-xl p-6">
                            <div className="skeleton-card-title h-4 bg-gray-200 rounded w-32 mb-4"></div>
                            <div className="skeleton-card-value h-8 bg-gray-200 rounded w-24 mb-2"></div>
                            <div className="skeleton-card-label h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                    ))}
                </div>

                {/* Content Grid Skeleton */}
                <div className="skeleton-content grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                        <div className="skeleton-section bg-white rounded-xl p-6">
                            <div className="skeleton-section-title h-6 bg-gray-200 rounded w-48 mb-6"></div>
                            <div className="skeleton-chart h-48 bg-gray-200 rounded"></div>
                        </div>
                        <div className="skeleton-section bg-white rounded-xl p-6">
                            <div className="skeleton-section-title h-6 bg-gray-200 rounded w-48 mb-6"></div>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="skeleton-item h-12 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        <div className="skeleton-section bg-white rounded-xl p-6">
                            <div className="skeleton-section-title h-6 bg-gray-200 rounded w-48 mb-6"></div>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="skeleton-item h-16 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                        <div className="skeleton-section bg-white rounded-xl p-6">
                            <div className="skeleton-section-title h-6 bg-gray-200 rounded w-48 mb-6"></div>
                            <div className="space-y-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="skeleton-item h-20 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingSkeleton;