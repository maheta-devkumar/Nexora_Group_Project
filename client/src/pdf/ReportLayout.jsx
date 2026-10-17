import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { styles } from './pdfStyles';

export const ReportHeader = ({ title = "Admin Report" }) => (
    <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>Nexora Admin</Text>
            <Text style={styles.headerSubtitle}>Enterprise Management System</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, fontWeight: 'bold' }}>{title}</Text>
            <Text style={styles.headerSubtitle}>{new Date().toLocaleDateString()}</Text>
        </View>
    </View>
);

export const ReportFooter = () => (
    <Text style={styles.footer} fixed render={({ pageNumber, totalPages }) => (
        `Nexora Inc. Confidential Report - Page ${pageNumber} of ${totalPages} - Generated on ${new Date().toLocaleString()}`
    )} />
);
