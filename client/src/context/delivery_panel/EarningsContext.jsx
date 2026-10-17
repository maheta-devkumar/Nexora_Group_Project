// src/context/delivery_panel/EarningsContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import * as earningsApi from '../../api/delivery_panel/earnings';

const EarningsContext = createContext();

export const useEarningsContext = () => {
    const context = useContext(EarningsContext);
    if (!context) {
        throw new Error('useEarningsContext must be used within EarningsProvider');
    }
    return context;
};

export const EarningsProvider = ({ children }) => {
    // State
    const [earningsOverview, setEarningsOverview] = useState(null);
    const [earningsBreakdown, setEarningsBreakdown] = useState(null);
    const [earningsSummary, setEarningsSummary] = useState(null);
    const [chartData, setChartData] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [bankInfo, setBankInfo] = useState(null);
    const [payoutHistory, setPayoutHistory] = useState([]);
    const [todayEarnings, setTodayEarnings] = useState(null);
    const [weeklyEarnings, setWeeklyEarnings] = useState(null);
    const [monthlyEarnings, setMonthlyEarnings] = useState(null);
    const [periodEarnings, setPeriodEarnings] = useState(null);
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
        setEarningsOverview(null);
        setEarningsBreakdown(null);
        setEarningsSummary(null);
        setChartData(null);
        setTransactions([]);
        setBankInfo(null);
        setPayoutHistory([]);
        setTodayEarnings(null);
        setWeeklyEarnings(null);
        setMonthlyEarnings(null);
        setPeriodEarnings(null);
        setOperationLogs([]);
        setError(null);
        addLog('All earnings data cleared', 'info');
    }, [addLog]);

    // Clear operation logs
    const clearOperationLogs = useCallback(() => {
        setOperationLogs([]);
        addLog('Operation logs cleared', 'info');
    }, [addLog]);

    // ===== EARNINGS OVERVIEW =====
    const fetchEarningsOverview = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching earnings overview...', 'test');

        try {
            const result = await earningsApi.fetchEarningsOverview();
            if (result.success) {
                setEarningsOverview(result.data.overview);
                setEarningsBreakdown(result.data.breakdown);
                addLog('✅ Earnings overview fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch earnings overview: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch earnings overview';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch earnings overview error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== EARNINGS SUMMARY =====
    const fetchEarningsSummary = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching earnings summary...', 'test');

        try {
            const result = await earningsApi.fetchEarningsSummary();
            if (result.success) {
                setEarningsSummary(result.data);
                addLog('✅ Earnings summary fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch earnings summary: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch earnings summary';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch earnings summary error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== CHART DATA =====
    const fetchChartData = useCallback(async (startDate = null, endDate = null, grouping = "daily") => {
        setLoading(true);
        setError(null);
        addLog('Fetching chart data...', 'test');

        try {
            const result = await earningsApi.fetchChartData(startDate, endDate, grouping);
            if (result.success) {
                setChartData(result.data);
                addLog('✅ Chart data fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch chart data: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch chart data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch chart data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== TRANSACTIONS =====
    const fetchTransactions = useCallback(async (
        startDate = null,
        endDate = null,
        period = null,
        type = null,
        status = null,
        page = 1,
        perPage = 20
    ) => {
        setLoading(true);
        setError(null);
        addLog('Fetching transactions...', 'test');

        try {
            const result = await earningsApi.fetchTransactions(
                startDate, endDate, period, type, status, page, perPage
            );
            if (result.success) {
                setTransactions(result.data.transactions || []);
                addLog('✅ Transactions fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch transactions: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch transactions';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch transactions error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BANK INFO =====
    const fetchBankInfo = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching bank information...', 'test');

        try {
            const result = await earningsApi.fetchBankInfo();
            if (result.success) {
                setBankInfo(result.data.bank_info);
                addLog('✅ Bank information fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch bank information: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch bank information';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch bank info error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PAYOUT HISTORY =====
    const fetchPayoutHistory = useCallback(async (startDate = null, endDate = null, page = 1, perPage = 20) => {
        setLoading(true);
        setError(null);
        addLog('Fetching payout history...', 'test');

        try {
            const result = await earningsApi.fetchPayoutHistory(startDate, endDate, page, perPage);
            if (result.success) {
                setPayoutHistory(result.data.payouts || []);
                addLog('✅ Payout history fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch payout history: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch payout history';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch payout history error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== TODAY'S EARNINGS =====
    const fetchTodayEarnings = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog("Fetching today's earnings...", 'test');

        try {
            const result = await earningsApi.fetchTodayEarnings();
            if (result.success) {
                setTodayEarnings(result.data);
                addLog("✅ Today's earnings fetched successfully", 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch today's earnings: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = "Failed to fetch today's earnings";
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error("Fetch today's earnings error:", err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== WEEKLY EARNINGS =====
    const fetchWeeklyEarnings = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog("Fetching weekly earnings...", 'test');

        try {
            const result = await earningsApi.fetchWeeklyEarnings();
            if (result.success) {
                setWeeklyEarnings(result.data);
                addLog("✅ Weekly earnings fetched successfully", 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch weekly earnings: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = "Failed to fetch weekly earnings";
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error("Fetch weekly earnings error:", err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== MONTHLY EARNINGS =====
    const fetchMonthlyEarnings = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog("Fetching monthly earnings...", 'test');

        try {
            const result = await earningsApi.fetchMonthlyEarnings();
            if (result.success) {
                setMonthlyEarnings(result.data);
                addLog("✅ Monthly earnings fetched successfully", 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch monthly earnings: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = "Failed to fetch monthly earnings";
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error("Fetch monthly earnings error:", err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== PERIOD EARNINGS =====
    const fetchPeriodEarnings = useCallback(async (period, customStart = null, customEnd = null) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching ${period} earnings...`, 'test');

        try {
            const result = await earningsApi.fetchPeriodEarnings(period, customStart, customEnd);
            if (result.success) {
                setPeriodEarnings(result.data);
                addLog(`✅ ${period} earnings fetched successfully`, 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch ${period} earnings: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = `Failed to fetch ${period} earnings`;
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch period earnings error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== CUSTOM PERIOD EARNINGS =====
    const fetchCustomPeriodEarnings = useCallback(async (startDate, endDate) => {
        setLoading(true);
        setError(null);
        addLog(`Fetching custom period earnings (${startDate} to ${endDate})...`, 'test');

        try {
            const result = await earningsApi.fetchCustomPeriodEarnings(startDate, endDate);
            if (result.success) {
                setPeriodEarnings(result.data);
                addLog('✅ Custom period earnings fetched successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to fetch custom period earnings: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch custom period earnings';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch custom period earnings error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== DOWNLOAD STATEMENT =====
    const downloadStatement = useCallback(async (startDate, endDate, format = "csv", includePending = false) => {
        setLoading(true);
        setError(null);
        addLog(`Downloading statement (${startDate} to ${endDate})...`, 'info');

        try {
            const result = await earningsApi.downloadStatement(startDate, endDate, format, includePending);
            if (result.success) {
                if (format === "csv") {
                    await earningsApi.exportCSVStatement(startDate, endDate);
                }
                addLog('✅ Statement downloaded successfully', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Failed to download statement: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to download statement';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Download statement error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    // ===== BATCH OPERATIONS =====
    const fetchAllEarningsData = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Fetching all earnings data...', 'test');

        try {
            const results = await Promise.all([
                fetchEarningsOverview(),
                fetchEarningsSummary(),
                fetchBankInfo(),
                fetchPayoutHistory(),
                fetchTodayEarnings(),
                fetchWeeklyEarnings(),
                fetchMonthlyEarnings()
            ]);

            const allSuccess = results.every(result => result.success);

            if (allSuccess) {
                addLog('✅ All earnings data fetched successfully', 'success');
                return { success: true, message: 'All data fetched successfully' };
            } else {
                const errorMessages = results.filter(r => !r.success).map(r => r.message).join(', ');
                setError(`Some data failed to load: ${errorMessages}`);
                addLog(`⚠️ Some data failed to load: ${errorMessages}`, 'warning');
                return { success: false, message: errorMessages };
            }
        } catch (err) {
            const errorMsg = 'Failed to fetch all earnings data';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Fetch all data error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [
        fetchEarningsOverview,
        fetchEarningsSummary,
        fetchBankInfo,
        fetchPayoutHistory,
        fetchTodayEarnings,
        fetchWeeklyEarnings,
        fetchMonthlyEarnings,
        addLog
    ]);

    // ===== HEALTH CHECK =====
    const checkEarningsHealth = useCallback(async () => {
        setLoading(true);
        setError(null);
        addLog('Checking earnings module health...', 'test');

        try {
            const result = await earningsApi.checkEarningsHealth();
            if (result.success) {
                addLog('✅ Earnings module is healthy', 'success');
                return { success: true, data: result.data };
            } else {
                setError(result.message);
                addLog(`❌ Earnings module health check failed: ${result.message}`, 'error');
                return { success: false, message: result.message };
            }
        } catch (err) {
            const errorMsg = 'Failed to check earnings module health';
            setError(errorMsg);
            addLog(`❌ ${errorMsg}: ${err.message}`, 'error');
            console.error('Health check error:', err);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    }, [addLog]);

    const value = {
        // State
        earningsOverview,
        earningsBreakdown,
        earningsSummary,
        chartData,
        transactions,
        bankInfo,
        payoutHistory,
        todayEarnings,
        weeklyEarnings,
        monthlyEarnings,
        periodEarnings,
        loading,
        error,
        operationLogs,

        // Fetch Functions
        fetchEarningsOverview,
        fetchEarningsSummary,
        fetchChartData,
        fetchTransactions,
        fetchBankInfo,
        fetchPayoutHistory,
        fetchTodayEarnings,
        fetchWeeklyEarnings,
        fetchMonthlyEarnings,
        fetchPeriodEarnings,
        fetchCustomPeriodEarnings,

        // Actions
        downloadStatement,

        // Batch Operations
        fetchAllEarningsData,

        // Health Check
        checkEarningsHealth,

        // Utility Functions
        clearError,
        clearAllData,
        clearOperationLogs,
        addLog
    };

    return (
        <EarningsContext.Provider value={value}>
            {children}
        </EarningsContext.Provider>
    );
};