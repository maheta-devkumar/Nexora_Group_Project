import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { ReportHeader, ReportFooter } from './ReportLayout';
import { PaymentSection } from './sections/PaymentSection';

const PaymentReportPdf = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ReportHeader title="Payment Methods Report" />
            <PaymentSection data={data} />
            <ReportFooter />
        </Page>
    </Document>
);

export default PaymentReportPdf;
