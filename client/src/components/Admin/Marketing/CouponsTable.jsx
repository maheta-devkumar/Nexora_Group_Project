import React from 'react';
import { FaEye, FaEdit, FaTrash, FaCalendar } from 'react-icons/fa';
import { useMarketingContext } from '../../../context/MarketingContext';
import './CouponsTable.css';

const CouponsTable = ({ data, onViewItem, onEditItem, searchTerm }) => {
    const { deleteCoupon, updateCouponStatus } = useMarketingContext();

    console.log('CouponsTable received data:', data);
    console.log('Number of coupons:', data ? data.length : 0);

    const handleDelete = async (couponId) => {
        if (!window.confirm('Are you sure you want to delete this coupon?')) return;

        try {
            await deleteCoupon(couponId);
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete coupon');
        }
    };

    const handleStatusToggle = async (coupon) => {
        try {
            await updateCouponStatus(coupon.coupon_id, !coupon.is_active);
        } catch (err) {
            console.error('Status toggle error:', err);
            alert('Failed to update coupon status');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getDiscountDisplay = (coupon) => {
        if (coupon.discount_type === 'PERCENT') {
            return `${coupon.discount_value}%`;
        } else {
            return `₹${coupon.discount_value}`;
        }
    };

    const isExpired = (endDate) => {
        return new Date(endDate) < new Date();
    };

    if (!data || data.length === 0) {
        console.log('No coupons to display. Search term:', searchTerm);
        return (
            <div className="empty-state">
                <div className="empty-icon">🎫</div>
                <h3>No Coupons Found</h3>
                <p>{searchTerm ? `No coupons match "${searchTerm}".` : 'Create your first coupon to get started!'}</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Description</th>
                        <th>Discount</th>
                        <th>Usage</th>
                        <th>Status</th>
                        <th>Validity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(coupon => {
                        const expired = isExpired(coupon.end_date);

                        console.log('Rendering coupon:', coupon.code, 'active:', coupon.is_active);

                        return (
                            <tr key={coupon.coupon_id} className={`table-row ${!coupon.is_active ? 'inactive' : ''} ${expired ? 'expired' : ''}`}>
                                <td>
                                    <div className="coupon-code">
                                        <strong>{coupon.code}</strong>
                                        {expired && <span className="expired-badge">Expired</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className="coupon-description">
                                        {coupon.description || 'No description'}
                                    </div>
                                </td>
                                <td>
                                    <div className="discount-info">
                                        <span className={`discount-value ${coupon.discount_type === 'PERCENT' ? 'percent' : 'flat'}`}>
                                            {getDiscountDisplay(coupon)}
                                        </span>
                                        <span className="discount-type">
                                            {coupon.discount_type === 'PERCENT' ? '% off' : 'off'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="usage-info">
                                        <span className="usage-limit">{coupon.usage_limit} uses</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="status-cell">
                                        <button
                                            className={`status-btn ${coupon.is_active ? 'active' : 'inactive'}`}
                                            onClick={() => handleStatusToggle(coupon)}
                                            title={coupon.is_active ? 'Click to deactivate' : 'Click to activate'}
                                        >
                                            <span className="status-dot"></span>
                                            {coupon.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <div className="validity-info">
                                        <div className="date-display">
                                            <FaCalendar className="date-icon" />
                                            <span className="date-text">
                                                {formatDate(coupon.start_date)} - {formatDate(coupon.end_date)}
                                            </span>
                                        </div>
                                        {coupon.min_order_amount && (
                                            <div className="min-order">
                                                Min: ₹{coupon.min_order_amount}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => onViewItem(coupon, 'coupon')}
                                            title="View Details"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => onEditItem(coupon, 'coupon')}
                                            title="Edit Coupon"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(coupon.coupon_id)}
                                            title="Delete Coupon"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default CouponsTable;