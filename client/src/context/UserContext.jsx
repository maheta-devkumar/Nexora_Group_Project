import React, { createContext, useContext, useState, useCallback } from 'react';
import * as userApi from '../api/users';

const UserContext = createContext();

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUserContext must be used within UserProvider');
    }
    return context;
};

export const UserProvider = ({ children }) => {
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    // Fetch all users
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await userApi.fetchAllUsers();
            if (result.success) {
                setUsers(result.data || []);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch users';
            setError(errorMsg);
            console.error('Fetch users error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch user by ID
    const fetchUserById = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await userApi.fetchUserById(userId);
            if (result.success) {
                setCurrentUser(result.data);
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch user';
            setError(errorMsg);
            console.error('Fetch user error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, []);

    // Update user
    const updateUser = useCallback(async (userId, updateData) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await userApi.updateUser(userId, updateData);
            if (result.success) {
                // Update users list
                setUsers(prev => prev.map(user => 
                    user.user_id === userId ? { ...user, ...result.data } : user
                ));
                // Update current user if it's the one being updated
                if (currentUser?.user_id === userId) {
                    setCurrentUser(prev => ({ ...prev, ...result.data }));
                }
                setSuccessMessage(result.message || 'User updated successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to update user';
            setError(errorMsg);
            console.error('Update user error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    // Delete user
    const deleteUser = useCallback(async (userId) => {
        setLoading(true);
        setError(null);
        setSuccessMessage(null);
        try {
            const result = await userApi.deleteUser(userId);
            if (result.success) {
                // Remove from users list
                setUsers(prev => prev.filter(u => u.user_id !== userId));
                // Clear current user if it's the one being deleted
                if (currentUser?.user_id === userId) {
                    setCurrentUser(null);
                }
                setSuccessMessage(result.data?.message || 'User deleted successfully');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to delete user';
            setError(errorMsg);
            console.error('Delete user error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear success message
    const clearSuccessMessage = useCallback(() => setSuccessMessage(null), []);

    // Clear current user
    const clearCurrentUser = useCallback(() => setCurrentUser(null), []);

    const value = {
        users,
        currentUser,
        loading,
        error,
        successMessage,
        fetchUsers,
        fetchUserById,
        updateUser,
        deleteUser,
        clearError,
        clearSuccessMessage,
        clearCurrentUser
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};