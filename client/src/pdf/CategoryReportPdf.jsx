import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { ReportHeader, ReportFooter } from './ReportLayout';
import { CategorySection } from './sections/CategorySection';

const CategoryReportPdf = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ReportHeader title="Category Analysis Report" />
            <CategorySection data={data} />
            <ReportFooter />
        </Page>
    </Document>
);

export default CategoryReportPdf;
