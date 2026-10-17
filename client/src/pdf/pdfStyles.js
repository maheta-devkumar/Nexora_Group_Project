import { StyleSheet } from '@react-pdf/renderer';

export const styles = StyleSheet.create({
    page: {
        padding: 40,
        backgroundColor: '#ffffff',
        fontFamily: 'Helvetica',
        fontSize: 10,
        color: '#333333',
        flexDirection: 'column'
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: '#4f46e5',
        paddingBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827' // Gray 900
    },
    headerSubtitle: {
        fontSize: 10,
        color: '#6b7280' // Gray 500
    },
    section: {
        marginBottom: 20,
        paddingBottom: 10
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4338ca', // Indigo 700
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1
    },
    // Table Styles
    table: {
        display: 'flex',
        width: 'auto',
        borderStyle: 'solid',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginBottom: 10
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomColor: '#e5e7eb',
        borderBottomWidth: 1,
        alignItems: 'center',
        minHeight: 24,
    },
    tableHeaderRow: {
        backgroundColor: '#f3f4f6', // Gray 100
        borderBottomWidth: 2,
        borderBottomColor: '#d1d5db'
    },
    tableCell: {
        margin: 5,
        fontSize: 9,
        flex: 1
    },
    tableHeaderCell: {
        margin: 5,
        fontSize: 9,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        flex: 1,
        color: '#374151'
    },
    // KPI Grid
    kpiContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20
    },
    kpiCard: {
        width: '30%',
        padding: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4,
        backgroundColor: '#f9fafb'
    },
    kpiLabel: {
        fontSize: 8,
        color: '#6b7280',
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    kpiValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827'
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#9ca3af',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
        paddingTop: 10
    }
});
