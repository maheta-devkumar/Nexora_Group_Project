import React from 'react';
import { useMarketingContext } from '../../../context/MarketingContext';
import './MarketingStatusToggle.css';

const MarketingStatusToggle = ({ itemId, type, currentStatus }) => {
    const { updateCouponStatus, updateOfferStatus, loading } = useMarketingContext();

    const handleToggle = async () => {
        const newStatus = !currentStatus;
        if (type === 'coupon') {
            await updateCouponStatus(itemId, newStatus);
        } else {
            await updateOfferStatus(itemId, newStatus);
        }
    };

    return (
        <div className="status-toggle" title={`Click to ${currentStatus ? 'deactivate' : 'activate'}`}>
            <label className="toggle-switch">
                <input
                    type="checkbox"
                    checked={currentStatus}
                    onChange={handleToggle}
                    disabled={loading}
                />
                <span className="toggle-slider"></span>
            </label>
            <span className={`status-label ${currentStatus ? 'active' : 'inactive'}`}>
                {currentStatus ? 'Active' : 'Inactive'}
            </span>
        </div>
    );
};

export default MarketingStatusToggle;