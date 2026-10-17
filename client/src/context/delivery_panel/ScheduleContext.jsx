// src/context/delivery_panel/ScheduleContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as scheduleApi from '../../api/delivery_panel/schedule';

const ScheduleContext = createContext();

export const useScheduleContext = () => {
    const context = useContext(ScheduleContext);
    if (!context) {
        throw new Error('useScheduleContext must be used within ScheduleProvider');
    }
    return context;
};

export const ScheduleProvider = ({ children }) => {
    // State
    const [todayShift, setTodayShift] = useState(null);
    const [upcomingShifts, setUpcomingShifts] = useState(null);
    const [scheduleCalendar, setScheduleCalendar] = useState(null);
    const [scheduleList, setScheduleList] = useState(null);
    const [scheduleSummary, setScheduleSummary] = useState(null);
    const [workPreferences, setWorkPreferences] = useState(null);
    const [shiftDetails, setShiftDetails] = useState(null);
    const [completeSchedule, setCompleteSchedule] = useState(null);
    const [monthSummary, setMonthSummary] = useState(null);
    const [weekSummary, setWeekSummary] = useState(null);
    const [nextShift, setNextShift] = useState(null);
    const [todayShiftStatus, setTodayShiftStatus] = useState(null);
    const [statusValues, setStatusValues] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [operationLogs, setOperationLogs] = useState([]);

    // Utility function to add logs
    const addLog = useCallback((message, type = 'info') => {
        const log = {
            message,
            type,
            timestamp: new Date().toLocaleTimeString()
        };
        setOperationLogs(prev => [log, ...prev.slice(0, 49)]); // Keep last 50 logs
    }, []);

    // Clear error
    const clearError = useCallback(() => setError(null), []);

    // Clear all data
    const clearAllData = useCallback(() => {
        setTodayShift(null);
        setUpcomingShifts(null);
        setScheduleCalendar(null);
        setScheduleList(null);
        setScheduleSummary(null);
        setWorkPreferences(null);
        setShiftDetails(null);
        setCompleteSchedule(null);
        setMonthSummary(null);
        setWeekSummary(null);
        setNextShift(null);
        setTodayShiftStatus(null);
        setStatusValues(null);
        setOperationLogs([]);
        setError(null);
        addLog('All schedule data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Schedule operation logs cleared', 'info');
    }, [addLog]);

    // ===== HEALTH CHECK =====
    const checkScheduleHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking schedule module health...', 'test');
        
        try {
            const result = await scheduleApi.checkScheduleHealth();
            if (result.success) {
                addLog('✅ Schedule module is healthy', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Schedule health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check schedule health';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Schedule health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== TODAY'S SHIFT =====
    const fetchTodayShift = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching today\'s shift...', 'test');
        
        try {
            const result = await scheduleApi.fetchTodayShift();
            if (result.success) {
                setTodayShift(result.data);
                addLog('✅ Today\'s shift fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch today\'s shift: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch today\'s shift';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch today shift error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== UPCOMING SHIFTS =====
    const fetchUpcomingShifts = useCallback(async (daysAhead = 30) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching upcoming shifts (next ${daysAhead} days)...`, 'test');
        
        try {
            const result = await scheduleApi.fetchUpcomingShifts(daysAhead);
            if (result.success) {
                setUpcomingShifts(result.data);
                addLog(`✅ Upcoming shifts fetched: ${result.data.total_upcoming || 0} shifts`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch upcoming shifts: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch upcoming shifts';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch upcoming shifts error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== SCHEDULE CALENDAR =====
    const fetchScheduleCalendar = useCallback(async (year = null, month = null) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching schedule calendar for ${year || 'current'} ${month || 'month'}...`, 'test');
        
        try {
            const result = await scheduleApi.fetchScheduleCalendar(year, month);
            if (result.success) {
                setScheduleCalendar(result.data);
                addLog('✅ Schedule calendar fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch schedule calendar: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch schedule calendar';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch schedule calendar error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== SCHEDULE LIST =====
    const fetchScheduleList = useCallback(async (startDate = null, endDate = null, status = null, page = 1, pageSize = 50) => {
        setLoading(true);
        setError(null);
        addLog('Fetching schedule list...', 'test');
        
        try {
            const result = await scheduleApi.fetchScheduleList(startDate, endDate, status, page, pageSize);
            if (result.success) {
                setScheduleList(result.data);
                addLog(`✅ Schedule list fetched: ${result.data.total_shifts || 0} shifts`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch schedule list: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch schedule list';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch schedule list error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== SCHEDULE SUMMARY =====
    const fetchScheduleSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching schedule summary...', 'test');
        
        try {
            const result = await scheduleApi.fetchScheduleSummary();
            if (result.success) {
                setScheduleSummary(result.data);
                addLog('✅ Schedule summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch schedule summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch schedule summary';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch schedule summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== WORK PREFERENCES =====
    const fetchWorkPreferences = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching work preferences...', 'test');
        
        try {
            const result = await scheduleApi.fetchWorkPreferences();
            if (result.success) {
                setWorkPreferences(result.data);
                addLog('✅ Work preferences fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch work preferences: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch work preferences';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch work preferences error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== SHIFT DETAILS =====
    const fetchShiftDetails = useCallback(async (shiftDate) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching shift details for ${shiftDate}...`, 'test');
        
        try {
            const result = await scheduleApi.fetchShiftDetails(shiftDate);
            if (result.success) {
                setShiftDetails(result.data);
                addLog('✅ Shift details fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch shift details: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch shift details';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch shift details error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== COMPLETE SCHEDULE =====
    const fetchCompleteSchedule = useCallback(async (includePreferences = true) => {
        setLoading(true);
        setError(null);
        addLog('Fetching complete schedule data...', 'test');
        
        try {
            const result = await scheduleApi.fetchCompleteSchedule(includePreferences);
            if (result.success) {
                setCompleteSchedule(result.data);
                addLog('✅ Complete schedule fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch complete schedule: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch complete schedule';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch complete schedule error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== MONTH SUMMARY =====
    const fetchMonthSummary = useCallback(async (year = null, month = null) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching month summary for ${year || 'current'}/${month || 'current'}...`, 'test');
        
        try {
            const result = await scheduleApi.fetchMonthSummary(year, month);
            if (result.success) {
                setMonthSummary(result.data);
                addLog('✅ Month summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch month summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch month summary';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch month summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== WEEK SUMMARY =====
    const fetchWeekSummary = useCallback(async (startDate = null) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching week summary starting ${startDate || 'current week'}...`, 'test');
        
        try {
            const result = await scheduleApi.fetchWeekSummary(startDate);
            if (result.success) {
                setWeekSummary(result.data);
                addLog('✅ Week summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch week summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch week summary';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch week summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== NEXT SHIFT =====
    const fetchNextShift = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching next shift...', 'test');
        
        try {
            const result = await scheduleApi.fetchNextShift();
            if (result.success) {
                setNextShift(result.data);
                addLog('✅ Next shift fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch next shift: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch next shift';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch next shift error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== TODAY'S SHIFT STATUS =====
    const fetchTodayShiftStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching today\'s shift status...', 'test');
        
        try {
            const result = await scheduleApi.fetchTodayShiftStatus();
            if (result.success) {
                setTodayShiftStatus(result.data);
                addLog('✅ Today\'s shift status fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch today\'s shift status: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch today\'s shift status';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch today shift status error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== STATUS VALUES =====
    const fetchStatusValues = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching status values...', 'test');
        
        try {
            const result = await scheduleApi.fetchStatusValues();
            if (result.success) {
                setStatusValues(result.data);
                addLog('✅ Status values fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch status values: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch status values';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch status values error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllScheduleData = useCallback(async (includePreferences = true) => {
        setLoading(true);
        setError(null);
        addLog('Fetching all schedule data...', 'test');
        
        try {
            // Fetch the most important endpoints
            const results = await Promise.all([
                fetchTodayShift(),
                fetchUpcomingShifts(),
                fetchScheduleCalendar(),
                fetchScheduleSummary(),
                includePreferences ? fetchWorkPreferences() : Promise.resolve({success: true})
            ]);
            
            const allSuccess = results.every(result => result.success);
            
            if (allSuccess) {
                addLog('✅ All schedule data fetched successfully', 'success');
                return { success: true, message: 'All schedule data fetched successfully' };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some schedule data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some schedule data failed to load: ${errorMessages}`, 'warning');
                return { success: false, message: errorMessages };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all schedule data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all schedule data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [
        fetchTodayShift, 
        fetchUpcomingShifts, 
        fetchScheduleCalendar, 
        fetchScheduleSummary, 
        fetchWorkPreferences, 
        addLog
    ]);

    const value = {
        // State
        todayShift,
        upcomingShifts,
        scheduleCalendar,
        scheduleList,
        scheduleSummary,
        workPreferences,
        shiftDetails,
        completeSchedule,
        monthSummary,
        weekSummary,
        nextShift,
        todayShiftStatus,
        statusValues,
        loading,
        error,
        operationLogs,
        
        // Schedule Functions
        checkScheduleHealth,
        fetchTodayShift,
        fetchUpcomingShifts,
        fetchScheduleCalendar,
        fetchScheduleList,
        fetchScheduleSummary,
        fetchWorkPreferences,
        fetchShiftDetails,
        fetchCompleteSchedule,
        fetchMonthSummary,
        fetchWeekSummary,
        fetchNextShift,
        fetchTodayShiftStatus,
        fetchStatusValues,
        
        // Batch Operations
        fetchAllScheduleData,
        
        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <ScheduleContext.Provider value={value}>
            {children}
        </ScheduleContext.Provider>
    );
};