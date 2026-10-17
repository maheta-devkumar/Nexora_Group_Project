import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const DeliveryRoute = ({ children }) => {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log('❌ Delivery: Not authenticated, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    const userRoles = user?.roles || [];
    const isDeliveryPerson = userRoles.includes("delivery"); // FIXED: "delivery"
    
    console.log('🛵 DELIVERY ROUTE CHECK:');
    console.log('User roles:', userRoles);
    console.log('Is delivery person?', isDeliveryPerson);
    
    if (!isDeliveryPerson) {
        console.log('❌ Not a delivery person, redirecting to home');
        return <Navigate to="/" replace />;
    }

    console.log('✅ Delivery person access granted');
    return children;
};

export default DeliveryRoute;