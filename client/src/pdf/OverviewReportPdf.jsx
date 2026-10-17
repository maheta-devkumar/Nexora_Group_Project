import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { ReportHeader, ReportFooter } from './ReportLayout';
import { OverviewSection } from './sections/OverviewSection';

const OverviewReportPdf = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ReportHeader title="Overview Report" />
            <OverviewSection data={data} />
            <ReportFooter />
        </Page>
    </Document>
);

export default OverviewReportPdf;
