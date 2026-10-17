import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../pdfStyles';

export const DeliverySection = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Performance</Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Detail Status</Text>
                    <Text style={styles.tableHeaderCell}>Total Orders</Text>
                    <Text style={styles.tableHeaderCell}>Avg Delivery Time</Text>
                </View>
                {data.map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.delivery_status}</Text>
                        <Text style={styles.tableCell}>{item.total_orders}</Text>
                        <Text style={styles.tableCell}>{item.avg_delivery_time}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};
