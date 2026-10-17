import React from 'react';
import { AlertCircle, XCircle } from 'lucide-react';

const FailedPaymentsTable = ({ failedPayments, onViewAll }) => {
    return (
        <div className="admin-card p-0 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-[var(--admin-border)] flex gap-3 items-center bg-red-50/50">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                    <XCircle size={20} />
                </div>
                <div>
                    <h3 className="font-semibold text-[var(--admin-text-primary)]">Failed Payments</h3>
                    <p className="text-xs text-[var(--admin-text-secondary)]">Requires immediate attention</p>
                </div>
            </div>

            <div className="admin-table-container border-0 rounded-none shadow-none flex-1">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Txn ID</th>
                            <th>Reason</th>
                            <th>Method</th>
                        </tr>
                    </thead>
                    <tbody>
                        {failedPayments.map((item) => (
                            <tr key={item.payment_id} className="cursor-pointer">
                                <td className="font-medium text-xs">#{item.payment_id}</td>
                                <td>
                                    <span className="flex items-center gap-1 text-sm text-[var(--admin-danger)] font-medium">
                                        <AlertCircle size={14} />
                                        {item.remarks || 'Transaction Failed'}
                                    </span>
                                    <div className="text-xs text-[#94a3b8] mt-0.5">{new Date(item.payment_date).toLocaleDateString()}</div>
                                </td>
                                <td className="text-sm text-[var(--admin-text-secondary)]">{item.payment_method}</td>
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
                    View All Failures
                </button>
            </div>
        </div>
    );
};

export default FailedPaymentsTable;
