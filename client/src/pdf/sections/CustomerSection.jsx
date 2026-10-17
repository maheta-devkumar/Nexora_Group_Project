import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../pdfStyles';

export const CustomerSection = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Customers</Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Customer Name</Text>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Email</Text>
                    <Text style={styles.tableHeaderCell}>Orders</Text>
                    <Text style={styles.tableHeaderCell}>Total Spent</Text>
                </View>
                {data.slice(0, 20).map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.customer_name}</Text>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.email}</Text>
                        <Text style={styles.tableCell}>{item.total_orders}</Text>
                        <Text style={styles.tableCell}>${Number(item.total_spent).toFixed(2)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};
