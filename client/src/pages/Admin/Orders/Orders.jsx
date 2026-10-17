import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import Filters from '../../../components/Admin/Orders/common/Filters';
import OrdersTable from '../../../components/Admin/Orders/OrderList/OrdersTable';
import Pagination from '../../../components/Admin/Orders/common/Pagination';
import './Orders.css';

const Orders = () => {
    const navigate = useNavigate();
    const {
        orders,
        loading,
        error,
        fetchAllOrders,
        searchOrders,
        fetchOrdersByDate,
        pagination,
        clearError
    } = useOrderAdminContext();

    const [filters, setFilters] = useState({
        status: '',
        search: '',
        startDate: '',
        endDate: ''
    });

    const [isSearching, setIsSearching] = useState(false);

    // Initial load
    useEffect(() => {
        fetchAllOrders(1, 20); // Default Fetch
    }, []);

    // Handle Fetching Logic
    const fetchOrdersData = useCallback(async (page = 1) => {
        const { status, search, startDate, endDate } = filters;
        setIsSearching(true);
        clearError();

        try {
            if (search) {
                // If search is present, usage search API (which limits other filters usually)
                await searchOrders(search, page, 20);
            } else if (startDate && endDate) {
                // If date range is present
                await fetchOrdersByDate(startDate, endDate);
            } else {
                // Default fetch with status filter if present
                await fetchAllOrders(page, 20, status || null);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsSearching(false);
        }
    }, [filters, searchOrders, fetchOrdersByDate, fetchAllOrders, clearError]);

    const handleFilterChange = (newFilters) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    const handleSearch = () => {
        fetchOrdersData(1); // Reset to page 1
    };

    const handleClearSearch = () => {
        setFilters({
            status: '',
            search: '',
            startDate: '',
            endDate: ''
        });
        fetchAllOrders(1, 20, null); // Reset
    };

    const handlePageChange = (newPage) => {
        fetchOrdersData(newPage);
    };

    const handleViewOrder = (orderId) => {
        navigate(`/admin/orders/${orderId}`);
    };

    // Auto-fetch when status changes (common UX)
    useEffect(() => {
        if (!filters.search && !filters.startDate && !filters.endDate) {
            fetchAllOrders(1, 20, filters.status || null);
        }
    }, [filters.status]);

    return (
        <div className="admin-orders-page">
            <div className="admin-orders-header-section">
                <div className="admin-orders-title-group">
                    <h1>Order Management</h1>
                    <p>Manage and track all customer orders</p>
                </div>
                <div className="admin-orders-actions">
                    <button
                        className="admin-btn-refresh"
                        onClick={() => fetchOrdersData(pagination.page)}
                        disabled={loading}
                    >
                        <i className="fas fa-sync-alt"></i>
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="admin-error-alert">
                    <p>{error}</p>
                    <button onClick={clearError} className="admin-close-error">✕</button>
                </div>
            )}

            <div className="admin-orders-filters-container">
                <Filters
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    onSearch={handleSearch}
                    onClearSearch={handleClearSearch}
                />
            </div>

            <div className="admin-orders-content-section">
                {/* Summary / Count logic can go here if pagination data has total count */}
                {pagination && (
                    <div className="admin-results-summary">
                        Showing {(pagination.page - 1) * pagination.perPage + 1} - {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total} orders
                    </div>
                )}

                <OrdersTable
                    orders={orders}
                    onViewOrder={handleViewOrder}
                    loading={loading || isSearching}
                />

                {orders.length > 0 && pagination && (
                    <div className="admin-pagination-wrapper">
                        <Pagination
                            currentPage={pagination.page}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Orders;