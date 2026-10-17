import React from 'react';
import { DollarSign, AlertCircle, RefreshCw, Clock } from 'lucide-react';
import '../../../pages/Admin/Payments/Payments.css';

const PaymentOverviewCards = ({ data }) => {
    const cards = [
        {
            title: "Total Received",
            value: data.totalReceived.amount,
            count: `${data.totalReceived.count} txns`,
            icon: <DollarSign size={24} className="text-emerald-500" />,
            bg: "bg-emerald-50",
            trend: data.totalReceived.change,
            trendColor: "text-emerald-600"
        },
        {
            title: "Failed Payments",
            value: data.failedPayments.amount,
            count: `${data.failedPayments.count} txns`,
            icon: <AlertCircle size={24} className="text-red-500" />,
            bg: "bg-red-50",
            trend: data.failedPayments.change,
            trendColor: "text-red-600"
        },
        {
            title: "Refunded",
            value: data.refundedAmount.amount,
            count: `${data.refundedAmount.count} txns`,
            icon: <RefreshCw size={24} className="text-blue-500" />,
            bg: "bg-blue-50",
            trend: data.refundedAmount.change,
            trendColor: "text-blue-600"
        },
        {
            title: "Pending Settlements",
            value: data.pendingSettlements.amount,
            count: `${data.pendingSettlements.count} txns`,
            icon: <Clock size={24} className="text-amber-500" />,
            bg: "bg-amber-50",
            trend: "Next: Jan 24",
            trendColor: "text-amber-600"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div key={index} className="admin-card payment-card-hover mb-0 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${card.bg}`}>
                            {card.icon}
                        </div>
                        <span className={`text-xs font-semibold ${card.trendColor} bg-opacity-10 px-2 py-1 rounded-full`}>
                            {card.trend}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-[var(--admin-text-secondary)] text-sm font-medium mb-1">{card.title}</h3>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-[var(--admin-text-primary)]">{card.value}</span>
                            <span className="text-xs text-[var(--admin-text-muted)]">{card.count}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PaymentOverviewCards;
