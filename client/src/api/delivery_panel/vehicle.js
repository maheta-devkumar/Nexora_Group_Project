// src/api/dp/vehicle.js
import api from '../api';

const VEHICLE_BASE_URL = `/delivery_panel/vehicle`;

/* -----------------------------
   🚗 DELIVERY VEHICLE API FUNCTIONS
------------------------------ */

// Get comprehensive vehicle information
export const fetchVehicleComprehensiveInfo = async () => {
    try {
        const response = await api.get(`${VEHICLE_BASE_URL}/`);
        return { 
            success: true, 
            data: response.data,
            message: "Vehicle comprehensive info fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Vehicle Comprehensive Info Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch vehicle comprehensive info",
            data: null
        };
    }
};

// Get basic vehicle information
export const fetchVehicleBasicInfo = async () => {
    try {
        const response = await api.get(`${VEHICLE_BASE_URL}/basic`);
        return { 
            success: true, 
            data: response.data,
            message: "Vehicle basic info fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Vehicle Basic Info Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch vehicle basic info",
            data: { vehicle_info: null, last_updated: null }
        };
    }
};

// Get vehicle documents
export const fetchVehicleDocuments = async () => {
    try {
        const response = await api.get(`${VEHICLE_BASE_URL}/documents`);
        return { 
            success: true, 
            data: response.data,
            message: "Vehicle documents fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Vehicle Documents Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch vehicle documents",
            data: { documents: [], total_documents: 0, verified_count: 0, pending_count: 0 }
        };
    }
};

// Get insurance details
export const fetchInsuranceDetails = async () => {
    try {
        const response = await api.get(`${VEHICLE_BASE_URL}/insurance`);
        return { 
            success: true, 
            data: response.data,
            message: "Insurance details fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Insurance Details Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch insurance details",
            data: { insurance_details: null, days_until_expiry: null, is_active: false }
        };
    }
};

// Get service history
export const fetchServiceHistory = async () => {
    try {
        const response = await api.get(`${VEHICLE_BASE_URL}/service-history`);
        return { 
            success: true, 
            data: response.data,
            message: "Service history fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Service History Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch service history",
            data: { service_records: [], total_services: 0, last_service_date: null, next_service_date: null, total_service_cost: null }
        };
    }
};

// Get safe vehicle info (no 404 errors)
export const fetchVehicleInfoSafe = async () => {
    try {
        const response = await api.get(`${VEHICLE_BASE_URL}/info`);
        return { 
            success: true, 
            data: response.data,
            message: "Vehicle info (safe) fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Vehicle Info Safe Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch vehicle info",
            data: { success: true, message: "No vehicle information available", data: null }
        };
    }
};

// Health check
export const checkVehicleHealth = async () => {
    try {
        const response = await api.get(`${VEHICLE_BASE_URL}/info`);
        return { 
            success: true, 
            data: response.data,
            message: "Vehicle API is healthy"
        };
    } catch (error) {
        console.error("Vehicle Health Check Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Vehicle API health check failed",
            data: null
        };
    }
};