import React from 'react';
import './TopCustomersTable.css';

const TopCustomersTable = ({ customers }) => {
    return (
        <div className="top-customers-table bg-white rounded-lg p-4">
            <h4 className="table-title font-medium text-gray-900 mb-4">Top Customers</h4>
            <div className="table-container overflow-x-auto">
                <table className="table min-w-full">
                    <thead className="table-header">
                        <tr>
                            <th className="header-cell text-left text-xs text-gray-500 uppercase">Customer</th>
                            <th className="header-cell text-left text-xs text-gray-500 uppercase">Orders</th>
                            <th className="header-cell text-left text-xs text-gray-500 uppercase">Spent</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.user_id} className="table-row border-t">
                                <td className="table-cell customer-cell py-3">
                                    <div>
                                        <div className="font-medium">{customer.name}</div>
                                        <div className="email-cell text-sm text-gray-500">{customer.email}</div>
                                    </div>
                                </td>
                                <td className="table-cell orders-cell py-3">{customer.total_orders}</td>
                                <td className="table-cell spent-cell py-3 font-semibold">${customer.total_spent.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TopCustomersTable;