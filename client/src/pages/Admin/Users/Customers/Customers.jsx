import React from 'react';
import { CustomerProvider } from '../../../../context/CustomerContext';
import AdminLayout from '../../../../components/Admin/Layout/AdminLayout';
import CustomerList from '../../../../components/Admin/Users/Customers/CustomerList';
import './Customers.css';

const Customers = () => {
    return (
        <CustomerProvider>
            <AdminLayout>
                <div className="admin-cp-container">
                    <CustomerList />
                </div>
            </AdminLayout>
        </CustomerProvider>
    );
};

export default Customers;