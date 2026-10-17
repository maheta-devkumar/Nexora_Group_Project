import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { ReportHeader, ReportFooter } from './ReportLayout';
import { CustomerSection } from './sections/CustomerSection';

const CustomerReportPdf = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ReportHeader title="Customer Insights Report" />
            <CustomerSection data={data} />
            <ReportFooter />
        </Page>
    </Document>
);

export default CustomerReportPdf;
