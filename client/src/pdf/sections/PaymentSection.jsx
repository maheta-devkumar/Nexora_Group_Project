import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../pdfStyles';

export const PaymentSection = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Payment Method Analysis</Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Payment Method</Text>
                    <Text style={styles.tableHeaderCell}>Transactions</Text>
                    <Text style={styles.tableHeaderCell}>Total Amount</Text>
                    <Text style={styles.tableHeaderCell}>Success Rate</Text>
                </View>
                {data.map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.payment_method}</Text>
                        <Text style={styles.tableCell}>{item.total_transactions}</Text>
                        <Text style={styles.tableCell}>${Number(item.total_amount).toFixed(2)}</Text>
                        <Text style={styles.tableCell}>{item.success_rate}%</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};
