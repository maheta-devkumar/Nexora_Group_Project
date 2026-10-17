import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../pdfStyles';

export const OverviewSection = ({ data }) => {
    if (!data) return null;

    const formatCurrency = (val) => `$${Number(val).toFixed(2)}`;
    const formatNumber = (val) => Number(val).toLocaleString();

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview KPI Summary</Text>

            <View style={styles.kpiContainer}>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Total Revenue</Text>
                    <Text style={[styles.kpiValue, { color: '#059669' }]}>{formatCurrency(data.total_revenue)}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Total Orders</Text>
                    <Text style={styles.kpiValue}>{formatNumber(data.total_orders)}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Avg Order Value</Text>
                    <Text style={styles.kpiValue}>{formatCurrency(data.avg_order_value)}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Completed Orders</Text>
                    <Text style={styles.kpiValue}>{formatNumber(data.completed_orders)}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Cancelled Orders</Text>
                    <Text style={[styles.kpiValue, { color: '#dc2626' }]}>{formatNumber(data.cancelled_orders)}</Text>
                </View>
                <View style={styles.kpiCard}>
                    <Text style={styles.kpiLabel}>Repeat Purchase Rate</Text>
                    <Text style={[styles.kpiValue, { color: '#4f46e5' }]}>{data.repeat_purchase_rate}%</Text>
                </View>
            </View>
        </View>
    );
};
