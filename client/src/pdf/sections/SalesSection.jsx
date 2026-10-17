import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../pdfStyles';

export const SalesSection = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sales Analysis (Last 30 Records)</Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={styles.tableHeaderCell}>Date</Text>
                    <Text style={styles.tableHeaderCell}>Orders Count</Text>
                    <Text style={styles.tableHeaderCell}>Revenue</Text>
                </View>
                {data.slice(0, 30).map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{item.date}</Text>
                        <Text style={styles.tableCell}>{item.orders_count}</Text>
                        <Text style={styles.tableCell}>${Number(item.revenue).toFixed(2)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};
