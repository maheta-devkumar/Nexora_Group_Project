import React from 'react';
import StatusBadge from '../common/StatusBadge';
import './Returns.css';

const ReturnsList = ({ returns, onApprove, onReject, onViewItems, loading }) => {
    if (loading && returns.length === 0) {
        return (
            <div className="loading-state">
                <div>Loading returns...</div>
            </div>
        );
    }

    if (returns.length === 0 && !loading) {
        return (
            <div className="empty-state">
                <div className="text-gray-500">No return requests found.</div>
            </div>
        );
    }

    return (
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Return ID</th>
                        <th>Order ID</th>
                        <th>Reason</th>
                        <th>Request Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {returns.map((returnItem) => (
                        <tr key={returnItem.return_id}>
                            <td className="font-mono text-[var(--admin-primary)] font-semibold">
                                #{returnItem.return_id}
                            </td>
                            <td className="font-mono">
                                #{returnItem.order_id}
                            </td>
                            <td>
                                <span className="text-sm text-[var(--admin-text-primary)]">
                                    {returnItem.reason || 'No reason provided'}
                                </span>
                            </td>
                            <td className="text-sm text-[var(--admin-text-secondary)]">
                                {new Date(returnItem.requested_at).toLocaleDateString()}
                            </td>
                            <td>
                                <StatusBadge status={returnItem.status} type="return" />
                            </td>
                            <td>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onViewItems(returnItem)}
                                        className="admin-btn admin-btn-secondary py-1 px-3 text-xs"
                                    >
                                        View Items
                                    </button>
                                    {returnItem.status === 'REQUESTED' && (
                                        <>
                                            <button
                                                onClick={() => onApprove(returnItem)}
                                                className="admin-btn admin-btn-success py-1 px-3 text-xs"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => onReject(returnItem)}
                                                className="admin-btn admin-btn-danger py-1 px-3 text-xs"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ReturnsList;