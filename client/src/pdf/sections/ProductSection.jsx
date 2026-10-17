import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from '../pdfStyles';

export const ProductSection = ({ data }) => {
    if (!data || data.length === 0) return null;

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Product Performance</Text>

            <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeaderRow]}>
                    <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Product Name</Text>
                    <Text style={styles.tableHeaderCell}>SKU</Text>
                    <Text style={styles.tableHeaderCell}>Units Sold</Text>
                    <Text style={styles.tableHeaderCell}>Revenue Generated</Text>
                </View>
                {data.slice(0, 20).map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, { flex: 2 }]}>{item.product_name}</Text>
                        <Text style={styles.tableCell}>{item.sku}</Text>
                        <Text style={styles.tableCell}>{item.total_sold}</Text>
                        <Text style={styles.tableCell}>${Number(item.revenue).toFixed(2)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};
