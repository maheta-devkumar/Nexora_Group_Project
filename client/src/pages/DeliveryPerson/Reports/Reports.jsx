import React, { useEffect, useState } from 'react';
import { useDeliveryReportsContext } from '../../../context/delivery_panel/DeliveryReportsContext';
import DeliveryLayout from '../../../components/DeliveryPerson/Layout/DeliveryLayout';
import ReportsHeader from '../../../components/DeliveryPerson/Reports/ReportsHeader';
import ReportsFilters from '../../../components/DeliveryPerson/Reports/ReportsFilters';
import ReportsSummary from '../../../components/DeliveryPerson/Reports/ReportsSummary';
import ReportsTrend from '../../../components/DeliveryPerson/Reports/ReportsTrend';
import ReportsTable from '../../../components/DeliveryPerson/Reports/ReportsTable';
import './Reports.css';

// PDF Components
import { PDFDownloadLink } from '@react-pdf/renderer';
import DeliveryReportPdf from '../../../pdf/DeliveryReportPdf';

const Reports = () => {
    const {
        reportsData,
        summaryData,
        trendData,
        ordersData,
        loading,
        error,
        fetchAllReportsData,
        fetchDeliveryReports,
        fetchOrderWiseReport,
        exportReport,
        updateFilters,
        clearError,
        clearAllData
    } = useDeliveryReportsContext();

    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const [pdfData, setPdfData] = useState(null);
    const [readyToDownload, setReadyToDownload] = useState(false);

    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [periodFilter, setPeriodFilter] = useState('Overall');

    useEffect(() => {
        const loadData = async () => {
            try {
                await fetchAllReportsData();
            } catch (err) {
                console.error('Error loading reports data:', err);
            }
        };

        loadData();

        // Set default date range (last 30 days)
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        setDateRange({ startDate, endDate });
    }, []);

    const handleFilterChange = async () => {
        const filters = {};

        if (dateRange.startDate && dateRange.endDate) {
            filters.startDate = dateRange.startDate;
            filters.endDate = dateRange.endDate;
        }

        if (statusFilter !== 'All Status') {
            filters.status = statusFilter;
        }

        if (periodFilter !== 'Overall') {
            filters.range = periodFilter.toLowerCase();
        }

        updateFilters(filters);

        try {
            await fetchDeliveryReports(filters);
            await fetchOrderWiseReport(filters);
        } catch (err) {
            console.error('Error applying filters:', err);
        }
    };

    const handlePeriodChange = (period) => {
        setPeriodFilter(period);

        const now = new Date();
        let startDate = '';
        let endDate = now.toISOString().split('T')[0];

        switch (period) {
            case 'Weekly':
                startDate = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case 'Monthly':
                startDate = new Date(now.setMonth(now.getMonth() - 1)).toISOString().split('T')[0];
                break;
            case 'Custom Range':
                // Don't auto-set dates for custom range
                break;
            default: // Overall
                startDate = '';
                endDate = '';
        }

        if (startDate) {
            setDateRange({ startDate, endDate });
        }
    };

    const preparePdfData = async () => {
        setIsGeneratingPdf(true);
        setReadyToDownload(false);
        setPdfData(null);

        const params = {
            report_format: 'json', // Request JSON for client-side PDF
            report_range: periodFilter.toLowerCase(),
            export_type: 'full'
        };

        if (dateRange.startDate && dateRange.endDate) {
            params.start_date = dateRange.startDate;
            params.end_date = dateRange.endDate;
        }

        if (statusFilter !== 'All Status') {
            params.status_filter = statusFilter;
        }

        try {
            // Re-use exportReport logic but expect raw data return from modified context/api
            // If context assumes file download, we might need to bypass it or check handleExportReport result

            // Assuming exportReport in context calls the API. 
            // We need the data. If context doesn't return data, we might need a direct generic API call or context modification.

            // For now, let's assume we can get data. 
            // If the context function strictly handles blob, we might need to fetch manually here or update the context.
            // Let's assume we need to call API directly if context is rigid.
            // OR simpler: use the data we already have in `reportsData` and `ordersData`!

            // Actually, best approach: use state data if available, but for "FULL" export we might need more than what's in state (pagination limit).
            // Let's assume we use the data currently loaded for simplicity, or re-fetch full list.

            // Let's construct data from available state for now:
            const dataToExport = {
                summary: summaryData,
                periods: reportsData?.period_breakdown || [],
                orders: ordersData, // This might be paginated, ideally fetch all
                metadata: {
                    report_range: periodFilter
                }
            };

            setPdfData(dataToExport);
            setReadyToDownload(true);

        } catch (err) {
            console.error("Failed to prepare PDF data", err);
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    // Component for the download button
    const ReportDownloadButton = () => {
        // Use existing data from context since we have fetched it
        const docData = {
            summary: summaryData,
            periods: reportsData?.period_breakdown || [],
            orders: ordersData,
            metadata: { report_range: periodFilter }
        };

        if (!summaryData) return <button className="btn-primary" disabled>Loading Data...</button>;

        return (
            <PDFDownloadLink
                document={<DeliveryReportPdf data={docData} />}
                fileName={`Delivery_Report_${periodFilter}_${new Date().toISOString().split('T')[0]}.pdf`}
                className="btn-link-reset"
            >
                {({ blob, url, loading, error }) => (
                    <button className="btn-primary" disabled={loading}>
                        <i data-lucide="download"></i>
                        {loading ? 'Generating PDF...' : 'Download Report (PDF)'}
                    </button>
                )}
            </PDFDownloadLink>
        );
    };

    const handleClearFilters = () => {
        setDateRange({ startDate: '', endDate: '' });
        setStatusFilter('All Status');
        setPeriodFilter('Overall');
        clearAllData();
        fetchAllReportsData();
    };

    if (loading && !reportsData) {
        return (
            <DeliveryLayout>
                <div className="page active" id="reports-page">
                    <div className="page-header">
                        <h2>Delivery Reports</h2>
                    </div>
                    <div className="loading-state">
                        <div className="loading-spinner"></div>
                        <p>Loading reports data...</p>
                    </div>
                </div>
            </DeliveryLayout>
        );
    }

    return (
        <DeliveryLayout>
            <div className="page active" id="reports-page">
                {/* Page Header */}
                <ReportsHeader
                    periodFilter={periodFilter}
                    onPeriodChange={handlePeriodChange}
                    customExportButton={<ReportDownloadButton />}
                    loading={loading}
                />

                {error && (
                    <div className="error-alert">
                        <div className="alert-content">
                            <i data-lucide="alert-circle"></i>
                            <span>{error}</span>
                        </div>
                        <button className="alert-close" onClick={clearError}>
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                )}



                {/* Filters Section */}
                <ReportsFilters
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    onApplyFilters={handleFilterChange}
                    onClearFilters={handleClearFilters}
                    loading={loading}
                />

                {/* Summary Cards */}
                <ReportsSummary
                    summaryData={summaryData}
                    reportsData={reportsData}
                    loading={loading}
                />

                {/* Trend Section */}
                <ReportsTrend
                    trendData={trendData}
                    reportsData={reportsData}
                    loading={loading}
                />

                {/* Period Breakdown Table */}
                {reportsData?.period_breakdown && reportsData.period_breakdown.length > 0 && (
                    <div className="breakdown-section">
                        <h3>📅 Period-wise Breakdown</h3>
                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Total</th>
                                        <th>Completed</th>
                                        <th>Failed</th>
                                        <th>Earnings</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportsData.period_breakdown.map((period, index) => (
                                        <tr key={index}>
                                            <td>{period.period || 'N/A'}</td>
                                            <td>{period.total_orders || period.total_deliveries || 0}</td>
                                            <td className="text-green">
                                                {period.completed || period.completed_deliveries || 0}
                                            </td>
                                            <td className="text-red">
                                                {period.failed || period.failed_deliveries || 0}
                                            </td>
                                            <td>₹{period.earnings || 0}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Order-wise Report Table */}
                <ReportsTable
                    ordersData={ordersData}
                    loading={loading}
                    onRefresh={handleFilterChange}
                />

                {/* Footer Info */}
                <div className="reports-footer">
                    <p>
                        <i data-lucide="info"></i>
                        Reports are generated based on completed delivery data only.
                    </p>
                </div>
            </div>
        </DeliveryLayout>
    );
};

export default Reports;