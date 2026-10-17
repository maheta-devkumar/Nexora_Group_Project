import React from 'react';
import { RefreshCcw } from 'lucide-react';

const RefundTrackingTable = ({ refunds, onViewAll }) => {
    return (
        <div className="admin-card p-0 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-[var(--admin-border)] flex gap-3 items-center bg-blue-50/50">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <RefreshCcw size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--admin-text-primary)]">Refund Tracking</h3>
                    <p className="text-xs text-[var(--admin-text-secondary)]">Processing & completed refunds</p>
                </div>
            </div>

            <div className="admin-table-container border-0 rounded-none shadow-none flex-1">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Refund ID</th>
                            <th>Amount</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {refunds.map((item) => (
                            <tr key={item.payment_id}>
                                <td className="font-medium text-xs">
                                    #{item.payment_id}
                                    <div className="text-xs text-[#94a3b8] mt-0.5">{new Date(item.payment_date).toLocaleDateString()}</div>
                                </td>
                                <td className="font-semibold">${parseFloat(item.amount_paid).toFixed(2)}</td>
                                <td>
                                    <span className={`admin-badge ${item.payment_status === 'REFUNDED' ? 'info' : 'warning'}`}>
                                        {item.payment_status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="p-3 border-t border-[var(--admin-border)] text-center">
                <button
                    onClick={onViewAll}
                    className="text-xs font-semibold text-[var(--admin-text-secondary)] hover:text-[var(--admin-primary)]"
                >
                    View All Refunds
                </button>
            </div>
        </div>
    );
};

export default RefundTrackingTable;
