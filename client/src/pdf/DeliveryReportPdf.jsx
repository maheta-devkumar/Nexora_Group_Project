import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { ReportHeader, ReportFooter } from './ReportLayout';

// Summary Section Component
const SummarySection = ({ summary }) => {
    if (!summary) return null;
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview Summary</Text>
            <View style={styles.kpiContainer}>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Total Orders</Text>
                    <Text style={styles.kpiValue}>{summary.total_orders || 0}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Total Earnings</Text>
                    <Text style={styles.kpiValue}>₹{summary.total_earnings || 0}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Completion Rate</Text>
                    <Text style={styles.kpiValue}>{summary.completion_rate || 0}%</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Distance Covered</Text>
                    <Text style={styles.kpiValue}>{summary.total_distance || 0} km</Text>
                </View>
            </View>
        </View>
    );
};

// Orders Section Component
const OrdersSection = ({ orders }) => {
    if (!orders || orders.length === 0) return null;
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Orders List</Text>
            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Date</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Order</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Status</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 0.8 }]}>Earnings</Text>
                </View>
                {orders.map((order, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 0.8 }]}>
                            {order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : 'N/A'}
                        </Text>
                        <Text style={[styles.tableCell, { flex: 1.2 }]}>{order.order_number}</Text>
                        <Text style={[styles.tableCell, { flex: 1 }]}>{order.status}</Text>
                        <Text style={[styles.tableCell, { flex: 0.8 }]}>₹{order.delivery_fee || 0}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const DeliveryReportPdf = ({ data }) => {
    // Determine data structure based on export type (summary, orders, or full)
    const summary = data.summary;
    const orders = data.orders || (Array.isArray(data) ? data : []);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <ReportHeader title="Delivery Performance Report" />

                {summary && <SummarySection summary={summary} />}

                {data.periods && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Period Breakdown</Text>
                        <View style={styles.table}>
                            <View style={[styles.tableRow, styles.tableHeaderRow]}>
                                <Text style={styles.tableHeaderCell}>Period</Text>
                                <Text style={styles.tableHeaderCell}>Total</Text>
                                <Text style={styles.tableHeaderCell}>Completed</Text>
                                <Text style={styles.tableHeaderCell}>Failed</Text>
                                <Text style={styles.tableHeaderCell}>Earnings</Text>
                            </View>
                            {data.periods.map((item, idx) => (
                                <View key={idx} style={styles.tableRow}>
                                    <Text style={styles.tableCell}>{item.period || 'N/A'}</Text>
                                    <Text style={styles.tableCell}>{item.total_orders || item.total_deliveries || 0}</Text>
                                    <Text style={styles.tableCell}>{item.completed || item.completed_deliveries || 0}</Text>
                                    <Text style={styles.tableCell}>{item.failed || item.failed_deliveries || 0}</Text>
                                    <Text style={styles.tableCell}>₹{item.earnings || 0}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {orders && orders.length > 0 && <OrdersSection orders={orders} />}

                <ReportFooter />
            </Page>
        </Document>
    );
};

export default DeliveryReportPdf;
