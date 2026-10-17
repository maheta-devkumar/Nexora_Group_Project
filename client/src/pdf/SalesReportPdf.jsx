import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { ReportHeader, ReportFooter } from './ReportLayout';
import { SalesSection } from './sections/SalesSection';

const SalesReportPdf = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ReportHeader title="Sales Report" />
            <SalesSection data={data} />
            <ReportFooter />
        </Page>
    </Document>
);

export default SalesReportPdf;
