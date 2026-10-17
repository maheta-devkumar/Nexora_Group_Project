import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminRoute = ({ children }) => {
    const { user, isAuthenticated } = useAuth();

    console.log('🔒 ADMIN ROUTE CHECK:');
    console.log('Is authenticated:', isAuthenticated);
    console.log('User:', user);
    
    if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login');
        return <Navigate to="/login" replace />;
    }

    const userRoles = user?.roles || [];
    const isAdmin = userRoles.includes("admin");
    
    console.log('User roles:', userRoles);
    console.log('Is admin?', isAdmin);
    
    if (!isAdmin) {
        console.log('❌ Not an admin, redirecting to home');
        return <Navigate to="/" replace />;
    }

    console.log('✅ Admin access granted');
    return children;
};

export default AdminRoute;