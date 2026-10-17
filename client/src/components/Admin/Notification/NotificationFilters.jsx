import React, { useState } from 'react';
import { FaSearch, FaFilter, FaCalendar, FaUser, FaEye, FaEyeSlash, FaTimes } from 'react-icons/fa';
import './NotificationFilters.css';

const NotificationFilters = ({ onFilter, loading }) => {
    const [filters, setFilters] = useState({
        keyword: '',
        user_id: '',
        type: '',
        is_read: '',
        start_date: '',
        end_date: ''
    });

    const notificationTypes = [
        { value: 'ORDER', label: 'Order' },
        { value: 'PAYMENT', label: 'Payment' },
        { value: 'DELIVERY', label: 'Delivery' },
        { value: 'OFFER', label: 'Offer' },
        { value: 'FEEDBACK', label: 'Feedback' },
        { value: 'SYSTEM', label: 'System' }
    ];

    const readStatusOptions = [
        { value: 'true', label: 'Read', icon: FaEye },
        { value: 'false', label: 'Unread', icon: FaEyeSlash }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onFilter(filters);
    };

    const handleClear = () => {
        const clearedFilters = {
            keyword: '',
            user_id: '',
            type: '',
            is_read: '',
            start_date: '',
            end_date: ''
        };
        setFilters(clearedFilters);
        onFilter(clearedFilters);
    };

    return (
        <div className="filters-container">
            <div className="filters-header">
                <h3 className="filters-title">
                    <FaFilter /> Filter Notifications
                </h3>
                <button
                    onClick={handleClear}
                    disabled={loading}
                    className="btn-clear"
                >
                    <FaTimes /> Clear
                </button>
            </div>

            <form onSubmit={handleSubmit} className="filters-form">
                {/* Search and User ID */}
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="filter-label">
                            <FaSearch /> Search
                        </label>
                        <input
                            type="text"
                            name="keyword"
                            value={filters.keyword}
                            onChange={handleChange}
                            placeholder="Search in title/message..."
                            className="filter-input"
                            disabled={loading}
                        />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">
                            <FaUser /> User ID
                        </label>
                        <input
                            type="number"
                            name="user_id"
                            value={filters.user_id}
                            onChange={handleChange}
                            placeholder="Filter by user ID..."
                            className="filter-input"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Type and Read Status */}
                <div className="filter-row">
                    <div className="filter-group">
                        <label className="filter-label">Notification Type</label>
                        <select
                            name="type"
                            value={filters.type}
                            onChange={handleChange}
                            className="filter-select"
                            disabled={loading}
                        >
                            <option value="">All Types</option>
                            {notificationTypes.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">Read Status</label>
                        <select
                            name="is_read"
                            value={filters.is_read}
                            onChange={handleChange}
                            className="filter-select"
                            disabled={loading}
                        >
                            <option value="">All Status</option>
                            {readStatusOptions.map(status => (
                                <option key={status.value} value={status.value}>
                                    {status.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Date Range */}
                <div className="date-filter-row">
                    <div className="filter-group">
                        <label className="filter-label">
                            <FaCalendar /> Start Date
                        </label>
                        <input
                            type="date"
                            name="start_date"
                            value={filters.start_date}
                            onChange={handleChange}
                            className="filter-input"
                            disabled={loading}
                        />
                    </div>
                    <div className="filter-group">
                        <label className="filter-label">
                            <FaCalendar /> End Date
                        </label>
                        <input
                            type="date"
                            name="end_date"
                            value={filters.end_date}
                            onChange={handleChange}
                            className="filter-input"
                            disabled={loading}
                        />
                    </div>
                </div>

                {/* Submit Button */}
                <div className="filter-submit">
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-apply"
                    >
                        <FaSearch />
                        {loading ? 'Applying Filters...' : 'Apply Filters'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NotificationFilters;