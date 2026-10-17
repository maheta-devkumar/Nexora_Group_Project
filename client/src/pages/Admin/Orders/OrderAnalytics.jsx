import React, { useEffect, useState } from 'react';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import OrdersAnalytics from '../../../components/Admin/Orders/Analytics/OrdersAnalytics';
import DateRangeFilter from '../../../components/Admin/Orders/Analytics/DateRangeFilter';
import './OrderAnalytics.css';

const OrderAnalytics = () => {
    const {
        stats,
        loading,
        error,
        fetchOrderStats,
        fetchOrdersByDate,
        clearError
    } = useOrderAdminContext();

    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [ordersByDate, setOrdersByDate] = useState([]);

    useEffect(() => {
        fetchOrderStats();
        loadOrdersByDate();
    }, []);

    const loadOrdersByDate = async () => {
        const result = await fetchOrdersByDate(dateRange.startDate, dateRange.endDate);
        if (result.success) {
            setOrdersByDate(result.data);
        }
    };

    const handleDateRangeChange = (newDateRange) => {
        setDateRange(newDateRange);
    };

    const handleApplyDateRange = () => {
        loadOrdersByDate();
    };

    if (loading && !stats) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="p-8 w-full max-w-[1600px] mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--admin-text-primary)]">Order Analytics</h1>
                    <p className="text-[var(--admin-text-secondary)] mt-1">Insights and statistics for order management</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
                    <p>{error}</p>
                    <button onClick={clearError} className="hover:bg-red-100 p-1 rounded">✕</button>
                </div>
            )}

            <div className="admin-card mb-8">
                <div className="flex justify-end">
                    <DateRangeFilter
                        dateRange={dateRange}
                        onDateRangeChange={handleDateRangeChange}
                        onApply={handleApplyDateRange}
                    />
                </div>
            </div>

            <div className="analytics-content">
                <OrdersAnalytics
                    stats={stats}
                    ordersByDate={ordersByDate}
                    dateRange={dateRange}
                />
            </div>
        </div>
    );
};

export default OrderAnalytics;