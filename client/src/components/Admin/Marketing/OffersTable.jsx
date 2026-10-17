import React from 'react';
import { FaEye, FaEdit, FaTrash, FaCalendar } from 'react-icons/fa';
import { useMarketingContext } from '../../../context/MarketingContext';
import './OffersTable.css';

const OffersTable = ({ data, onViewItem, onEditItem, searchTerm }) => {
    const { deleteOffer, updateOfferStatus } = useMarketingContext();

    const handleDelete = async (offerId) => {
        if (!window.confirm('Are you sure you want to delete this offer?')) return;

        try {
            await deleteOffer(offerId);
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete offer');
        }
    };

    const handleStatusToggle = async (offer) => {
        try {
            await updateOfferStatus(offer.offer_id, !offer.is_active);
        } catch (err) {
            console.error('Status toggle error:', err);
            alert('Failed to update offer status');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    const getDiscountDisplay = (offer) => {
        if (offer.discount_type === 'PERCENT') {
            return `${offer.discount_value}%`;
        } else {
            return `₹${offer.discount_value}`;
        }
    };

    const isExpired = (endDate) => {
        return new Date(endDate) < new Date();
    };

    if (!data || data.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">🎁</div>
                <h3>No Offers Found</h3>
                <p>{searchTerm ? 'No offers match your search.' : 'Create your first offer to get started!'}</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Discount</th>
                        <th>Status</th>
                        <th>Validity</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(offer => {
                        const expired = isExpired(offer.end_date);

                        return (
                            <tr key={offer.offer_id} className={`table-row ${!offer.is_active ? 'inactive' : ''} ${expired ? 'expired' : ''}`}>
                                <td>
                                    <div className="offer-title">
                                        <strong>{offer.title}</strong>
                                        {expired && <span className="expired-badge">Expired</span>}
                                    </div>
                                </td>
                                <td>
                                    <div className="offer-description">
                                        {offer.description || 'No description'}
                                    </div>
                                </td>
                                <td>
                                    <div className="discount-info">
                                        <span className={`discount-value ${offer.discount_type === 'PERCENT' ? 'percent' : 'flat'}`}>
                                            {getDiscountDisplay(offer)}
                                        </span>
                                        <span className="discount-type">
                                            {offer.discount_type === 'PERCENT' ? '% off' : 'off'}
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <div className="status-cell">
                                        <button
                                            className={`status-btn ${offer.is_active ? 'active' : 'inactive'}`}
                                            onClick={() => handleStatusToggle(offer)}
                                            title={offer.is_active ? 'Click to deactivate' : 'Click to activate'}
                                        >
                                            <span className="status-dot"></span>
                                            {offer.is_active ? 'Active' : 'Inactive'}
                                        </button>
                                    </div>
                                </td>
                                <td>
                                    <div className="validity-info">
                                        <div className="date-display">
                                            <FaCalendar className="date-icon" />
                                            <span className="date-text">
                                                {formatDate(offer.start_date)} - {formatDate(offer.end_date)}
                                            </span>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => onViewItem(offer, 'offer')}
                                            title="View Details"
                                        >
                                            <FaEye />
                                        </button>
                                        <button
                                            className="action-btn edit-btn"
                                            onClick={() => onEditItem(offer, 'offer')}
                                            title="Edit Offer"
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(offer.offer_id)}
                                            title="Delete Offer"
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

export default OffersTable;