import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../pdfStyles';

export const CategorySection = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Category</Text>
                    <Text style={styles.tableHeaderCell}>Total Products</Text>
                    <Text style={styles.tableHeaderCell}>Units Sold</Text>
                    <Text style={styles.tableHeaderCell}>Revenue</Text>
                </View>
                {data.map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.category_name}</Text>
                        <Text style={styles.tableCell}>{item.total_products}</Text>
                        <Text style={styles.tableCell}>{item.total_sold}</Text>
                        <Text style={styles.tableCell}>${Number(item.revenue).toFixed(2)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};
