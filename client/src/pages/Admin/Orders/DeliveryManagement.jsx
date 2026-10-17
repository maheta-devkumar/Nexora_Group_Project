import React, { useEffect, useState } from 'react';
import { useOrderAdminContext } from '../../../context/OrderAdminContext';
import DeliveryInfo from '../../../components/Admin/Orders/Delivery/DeliveryInfo';
import DeliveryModals from '../../../components/Admin/Orders/Delivery/DeliveryModals';
import './DeliveryManagement.css';

const DeliveryManagement = () => {
    const { 
        orders, 
        loading, 
        error, 
        fetchAllOrders, 
        clearError 
    } = useOrderAdminContext();
    
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [actionType, setActionType] = useState('');
    const [deliveryOrders, setDeliveryOrders] = useState([]);

    useEffect(() => {
        fetchAllOrders();
    }, []);

    useEffect(() => {
        if (orders.length > 0) {
            // Filter orders that need delivery management
            const deliveryOrders = orders.filter(order => 
                ['PLACED', 'PROCESSING', 'SHIPPED'].includes(order.order_status)
            );
            setDeliveryOrders(deliveryOrders);
        }
    }, [orders]);

    const handleAssign = (order) => {
        setSelectedOrder(order);
        setActionType('assign');
    };

    const handleUpdate = (order) => {
        setSelectedOrder(order);
        setActionType('update');
    };

    const handleViewDetails = (order) => {
        setSelectedOrder(order);
        setActionType('view');
    };

    const handleCloseModal = () => {
        setSelectedOrder(null);
        setActionType('');
    };

    const handleActionComplete = () => {
        handleCloseModal();
        fetchAllOrders();
    };

    if (loading && !orders.length) {
        return (
            <div className="loading-state">
                <div>Loading delivery orders...</div>
            </div>
        );
    }

    return (
        <div className="delivery-management">
            <div className="delivery-header">
                <h1>Delivery Management</h1>
                <p>Assign and track delivery personnel</p>
            </div>

            {error && (
                <div className="error-alert">
                    <p>{error}</p>
                    <button 
                        onClick={clearError}
                        className="close-error"
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="delivery-grid">
                {deliveryOrders.map((order) => (
                    <DeliveryInfo 
                        key={order.order_id}
                        order={order}
                        onAssign={() => handleAssign(order)}
                        onUpdate={() => handleUpdate(order)}
                        onViewDetails={() => handleViewDetails(order)}
                    />
                ))}
                
                {deliveryOrders.length === 0 && !loading && (
                    <div className="empty-state">
                        <h3>No Orders Requiring Delivery</h3>
                        <p>All orders are either delivered, cancelled, or already assigned.</p>
                    </div>
                )}
            </div>

            {selectedOrder && (
                <DeliveryModals 
                    order={selectedOrder}
                    actionType={actionType}
                    onClose={handleCloseModal}
                    onActionComplete={handleActionComplete}
                />
            )}
        </div>
    );
};

export default DeliveryManagement;