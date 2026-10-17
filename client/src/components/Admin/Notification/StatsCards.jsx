import React from 'react';
import { FaBell, FaEnvelope, FaUsers, FaChartLine, FaFileAlt, FaPercentage } from 'react-icons/fa';
import './StatsCards.css';

const StatsCards = ({ stats, typeStats }) => {
    const statCards = [
        {
            title: 'Total Notifications',
            value: stats?.total_notifications || 0,
            icon: FaBell,
            color: 'blue'
        },
        {
            title: 'Unread Notifications',
            value: stats?.total_unread || 0,
            icon: FaEnvelope,
            color: 'red'
        },
        {
            title: 'Users with Notifications',
            value: stats?.total_users_with_notifications || 0,
            icon: FaUsers,
            color: 'green'
        },
        {
            title: 'Avg per User',
            value: stats?.average_notifications_per_user?.toFixed(2) || '0.00',
            icon: FaChartLine,
            color: 'purple'
        }
    ];

    return (
        <div className="stats-container">
            <div className="stats-header">
                <FaChartLine />
                <h2>Dashboard Statistics</h2>
            </div>
            
            <div className="stats-grid">
                {statCards.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-content">
                            <div className="stat-text">
                                <h3 className="stat-title">{stat.title}</h3>
                                <p className={`value ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div className={`stat-icon ${stat.color}`}>
                                <stat.icon className={`stat-icon-svg ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Type Breakdown */}
            {typeStats?.stats && typeStats.stats.length > 0 && (
                <div className="type-breakdown">
                    <div className="type-header">
                        <FaFileAlt />
                        <h3>Notification Type Breakdown</h3>
                    </div>
                    <div className="type-grid">
                        {typeStats.stats.map((typeStat, index) => (
                            <div key={index} className="type-card">
                                <div className="type-header-row">
                                    <FaPercentage className="type-icon" />
                                    <span className="type-name">{typeStat.type}</span>
                                </div>
                                <p className="type-value">{typeStat.count}</p>
                                <p className="type-percentage">{typeStat.percentage}%</p>
                            </div>
                        ))}
                        <div className="type-card total">
                            <div className="type-header-row">
                                <FaFileAlt className="type-icon" />
                                <span className="type-name">Total</span>
                            </div>
                            <p className="type-value">{typeStats.total}</p>
                            <p className="type-percentage">All types</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsCards;