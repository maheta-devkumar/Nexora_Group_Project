import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { ReportHeader, ReportFooter } from './ReportLayout';
import { ProductSection } from './sections/ProductSection';

const ProductReportPdf = ({ data }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ReportHeader title="Product Performance Report" />
            <ProductSection data={data} />
            <ReportFooter />
        </Page>
    </Document>
);

export default ProductReportPdf;
