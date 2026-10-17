import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DeliveryPersonProvider } from '../../../../context/DeliveryPersonContext';
import AdminLayout from '../../../../components/Admin/Layout/AdminLayout'; // Add this import
import DeliveryPersonList from '../../../../components/Admin/Users/DeliveryPerson/DeliveryPersonList';
import DeliveryPersonDetails from '../../../../components/Admin/Users/DeliveryPerson/DeliveryPersonDetails';
import DeliveryPersonForm from '../../../../components/Admin/Users/DeliveryPerson/DeliveryPersonForm';
import './DeliveryPersons.css';

const DeliveryPersonsPage = () => {
    return (
        <DeliveryPersonProvider>
            <AdminLayout>
                <Routes>
                    <Route index element={<DeliveryPersonList />} />
                    <Route path="create" element={<DeliveryPersonForm mode="create" />} />
                    <Route path=":deliveryPersonId" element={<DeliveryPersonDetails />} />
                    <Route path="edit/:deliveryPersonId" element={<DeliveryPersonForm mode="edit" />} />
                    <Route path="*" element={<Navigate to="/admin/users/delivery-persons" replace />} />
                </Routes>
            </AdminLayout>
        </DeliveryPersonProvider>
    );
};

export default DeliveryPersonsPage;