import React from 'react';
import { X, Calendar, CreditCard, User, Package, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const PaymentDetailsModal = ({ payment, onClose }) => {
    if (!payment) return null;

    const getStatusColor = (status) => {
        switch (status) {
            case 'PAID': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'FAILED': return 'text-red-600 bg-red-50 border-red-200';
            case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'REFUNDED': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const statusStyle = getStatusColor(payment.payment_status);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Payment Details</h2>
                        <p className="text-sm text-gray-500 mt-1">Transaction ID: {payment.payment_id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">

                    {/* Status Banner */}
                    <div className={`flex items-center gap-3 p-4 rounded-xl border ${statusStyle}`}>
                        {payment.payment_status === 'PAID' && <CheckCircle size={24} />}
                        {payment.payment_status === 'FAILED' && <AlertCircle size={24} />}
                        {payment.payment_status === 'PENDING' && <Clock size={24} />}
                        {payment.payment_status === 'REFUNDED' && <AlertCircle size={24} />}
                        <div>
                            <p className="font-semibold">{payment.payment_status}</p>
                            <p className="text-sm opacity-90">
                                {payment.payment_status === 'PAID' ? 'Payment was successfully processed.' :
                                    payment.payment_status === 'FAILED' ? 'Payment failed significantly.' :
                                        'Transaction is currently processing.'}
                            </p>
                        </div>
                    </div>

                    {/* Amount & Date */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">Amount Paid</p>
                            <p className="text-2xl font-bold text-gray-900">${parseFloat(payment.amount_paid).toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl">
                            <p className="text-sm text-gray-500 mb-1">Date & Time</p>
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-gray-400" />
                                <p className="font-medium text-gray-900">
                                    {new Date(payment.payment_date).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Customer Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Customer Info</h3>
                            <div className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <User size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{payment.user_name}</p>
                                    <p className="text-sm text-gray-500">User ID: #{payment.user_id}</p>
                                </div>
                            </div>
                        </div>

                        {/* Order Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Order Reference</h3>
                            <div className="flex items-start gap-3 p-3 border border-gray-100 rounded-lg">
                                <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Order #{payment.order_id}</p>
                                    <button className="text-xs text-blue-600 hover:underline mt-1">View Order Details</button>
                                </div>
                            </div>
                        </div>

                        {/* Method Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Payment Method</h3>
                            <div className="flex items-center gap-2 text-gray-700">
                                <CreditCard size={18} />
                                <span className="font-medium">{payment.payment_method}</span>
                            </div>
                            {payment.transaction_reference && (
                                <p className="text-xs text-gray-500 break-all">
                                    Ref: {payment.transaction_reference}
                                </p>
                            )}
                        </div>

                        {/* Gateway / Remarks */}
                        {payment.remarks && (
                            <div className="space-y-3 md:col-span-2">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Remarks</h3>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                    {payment.remarks}
                                </p>
                            </div>
                        )}

                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-sm"
                    >
                        Close
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm shadow-blue-200">
                        Download Receipt
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentDetailsModal;
