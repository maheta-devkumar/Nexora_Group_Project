// src/api/dp/schedule.js
import api from '../api';

const SCHEDULE_BASE_URL = `/delivery_panel/schedule`;

/* -----------------------------
   ✅ DELIVERY SCHEDULE API FUNCTIONS
------------------------------ */

// Health check for schedule module
export const checkScheduleHealth = async () => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/health`);
        return { 
            success: true, 
            data: response.data,
            message: "Schedule module is healthy"
        };
    } catch (error) {
        console.error("Schedule Health Check Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Schedule module health check failed",
            data: null
        };
    }
};

// Get today's shift
export const fetchTodayShift = async () => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/today`);
        return { 
            success: true, 
            data: response.data,
            message: "Today's shift fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Today Shift Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch today's shift",
            data: null
        };
    }
};

// Get upcoming shifts
export const fetchUpcomingShifts = async (daysAhead = 30) => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/upcoming?days_ahead=${daysAhead}`);
        return { 
            success: true, 
            data: response.data,
            message: "Upcoming shifts fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Upcoming Shifts Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch upcoming shifts",
            data: null
        };
    }
};

// Get schedule calendar
export const fetchScheduleCalendar = async (year = null, month = null) => {
    try {
        let url = `${SCHEDULE_BASE_URL}/calendar`;
        const params = [];
        if (year) params.push(`year=${year}`);
        if (month) params.push(`month=${month}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        
        const response = await api.get(url);
        return { 
            success: true, 
            data: response.data,
            message: "Schedule calendar fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Schedule Calendar Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch schedule calendar",
            data: null
        };
    }
};

// Get schedule list with filtering
export const fetchScheduleList = async (startDate = null, endDate = null, status = null, page = 1, pageSize = 50) => {
    try {
        let url = `${SCHEDULE_BASE_URL}/list`;
        const params = [];
        if (startDate) params.push(`start_date=${startDate}`);
        if (endDate) params.push(`end_date=${endDate}`);
        if (status) params.push(`status=${status}`);
        params.push(`page=${page}`);
        params.push(`page_size=${pageSize}`);
        
        if (params.length > 0) url += `?${params.join('&')}`;
        
        const response = await api.get(url);
        return { 
            success: true, 
            data: response.data,
            message: "Schedule list fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Schedule List Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch schedule list",
            data: null
        };
    }
};

// Get schedule summary
export const fetchScheduleSummary = async () => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/summary`);
        return { 
            success: true, 
            data: response.data,
            message: "Schedule summary fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Schedule Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch schedule summary",
            data: null
        };
    }
};

// Get work preferences
export const fetchWorkPreferences = async () => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/preferences`);
        return { 
            success: true, 
            data: response.data,
            message: "Work preferences fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Work Preferences Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch work preferences",
            data: null
        };
    }
};

// Get shift details
export const fetchShiftDetails = async (shiftDate) => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/shifts/${shiftDate}`);
        return { 
            success: true, 
            data: response.data,
            message: "Shift details fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Shift Details Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch shift details",
            data: null
        };
    }
};

// Get complete schedule
export const fetchCompleteSchedule = async (includePreferences = true) => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/complete?include_preferences=${includePreferences}`);
        return { 
            success: true, 
            data: response.data,
            message: "Complete schedule fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Complete Schedule Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch complete schedule",
            data: null
        };
    }
};

// Get month summary
export const fetchMonthSummary = async (year = null, month = null) => {
    try {
        let url = `${SCHEDULE_BASE_URL}/month-summary`;
        const params = [];
        if (year) params.push(`year=${year}`);
        if (month) params.push(`month=${month}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        
        const response = await api.get(url);
        return { 
            success: true, 
            data: response.data,
            message: "Month summary fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Month Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch month summary",
            data: null
        };
    }
};

// Get week summary
export const fetchWeekSummary = async (startDate = null) => {
    try {
        let url = `${SCHEDULE_BASE_URL}/week-summary`;
        if (startDate) url += `?start_date=${startDate}`;
        
        const response = await api.get(url);
        return { 
            success: true, 
            data: response.data,
            message: "Week summary fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Week Summary Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch week summary",
            data: null
        };
    }
};

// Get next shift only
export const fetchNextShift = async () => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/shifts/next`);
        return { 
            success: true, 
            data: response.data,
            message: "Next shift fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Next Shift Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch next shift",
            data: null
        };
    }
};

// Get today's shift status only
export const fetchTodayShiftStatus = async () => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/shifts/today/status`);
        return { 
            success: true, 
            data: response.data,
            message: "Today's shift status fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Today Shift Status Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch today's shift status",
            data: null
        };
    }
};

// Get status values
export const fetchStatusValues = async () => {
    try {
        const response = await api.get(`${SCHEDULE_BASE_URL}/status-values`);
        return { 
            success: true, 
            data: response.data,
            message: "Status values fetched successfully"
        };
    } catch (error) {
        console.error("Fetch Status Values Error:", error.response?.data || error.message);
        return { 
            success: false, 
            message: error.response?.data?.detail || "Failed to fetch status values",
            data: null
        };
    }
};