import api from './api';

const DELIVERY_PERSONS_BASE_URL = `/delivery-persons`;

/* -----------------------------
   ✅ DELIVERY PERSON API FUNCTIONS
------------------------------ */

// Get all delivery persons (Admin only)
export const fetchAllDeliveryPersons = async (params = {}) => {
    try {
        const { page = 1, per_page = 20, status } = params;
        const response = await api.get(`${DELIVERY_PERSONS_BASE_URL}/`, {
            params: {
                page,
                per_page,
                ...(status && { status })
            }
        });
        return { 
            success: true, 
            data: response.data.data || [],
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Delivery Persons Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery persons",
            data: []
        };
    }
};

// Get delivery person by ID (Admin only)
export const fetchDeliveryPersonById = async (deliveryPersonId) => {
    try {
        const response = await api.get(`${DELIVERY_PERSONS_BASE_URL}/${deliveryPersonId}`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch Delivery Person Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery person"
        };
    }
};

// Get current user's delivery profile
export const fetchMyDeliveryProfile = async () => {
    try {
        const response = await api.get(`${DELIVERY_PERSONS_BASE_URL}/my-profile`);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Fetch My Delivery Profile Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery profile"
        };
    }
};

// Register as a delivery person (Admin can register others, users can apply)
export const registerDeliveryPerson = async (deliveryData) => {
    try {
        const response = await api.post(`${DELIVERY_PERSONS_BASE_URL}/register`, deliveryData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Register Delivery Person Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to register as delivery person"
        };
    }
};

// Apply to become a delivery person (user self-service)
export const applyAsDeliveryPerson = async (applicationData) => {
    try {
        const response = await api.post(`${DELIVERY_PERSONS_BASE_URL}/apply`, applicationData);
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Apply as Delivery Person Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to apply as delivery person"
        };
    }
};

// Update delivery person status (Admin only)
export const updateDeliveryPersonStatus = async (deliveryPersonId, status) => {
    try {
        const response = await api.patch(`${DELIVERY_PERSONS_BASE_URL}/${deliveryPersonId}/status`, { status });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Delivery Person Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update delivery person status"
        };
    }
};

// Update delivery person rating (Admin only)
export const updateDeliveryPersonRating = async (deliveryPersonId, rating) => {
    try {
        const response = await api.patch(`${DELIVERY_PERSONS_BASE_URL}/${deliveryPersonId}/rating`, { rating });
        return { 
            success: true, 
            data: response.data.data,
            message: response.data.message 
        };
    } catch (error) {
        console.error("Update Delivery Person Rating Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to update delivery person rating"
        };
    }
};

// Delete delivery person (Admin only)
export const deleteDeliveryPerson = async (deliveryPersonId) => {
    try {
        // Note: Backend doesn't have delete endpoint yet, we'll need to add it
        // For now, we'll update status to INACTIVE
        const response = await api.patch(`${DELIVERY_PERSONS_BASE_URL}/${deliveryPersonId}/status`, { 
            status: 'INACTIVE' 
        });
        return { 
            success: true, 
            data: response.data.data,
            message: 'Delivery person deactivated successfully'
        };
    } catch (error) {
        console.error("Delete Delivery Person Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to delete delivery person"
        };
    }
};

// Get delivery person statistics
export const fetchDeliveryPersonStats = async (deliveryPersonId) => {
    try {
        const response = await api.get(`${DELIVERY_PERSONS_BASE_URL}/${deliveryPersonId}`);
        if (response.data.success) {
            return { 
                success: true, 
                data: {
                    total_deliveries: response.data.data.total_deliveries || 0,
                    total_earnings: response.data.data.total_earnings || 0,
                    rating: response.data.data.rating || 0
                },
                message: "Stats retrieved successfully"
            };
        }
        return { 
            success: false, 
            message: "Failed to fetch stats" 
        };
    } catch (error) {
        console.error("Fetch Delivery Person Stats Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || error.response?.data?.message || "Failed to fetch delivery person stats"
        };
    }
};