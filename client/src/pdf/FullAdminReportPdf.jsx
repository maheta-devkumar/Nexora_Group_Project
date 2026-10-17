import React from 'react';
import { Document, Page } from '@react-pdf/renderer';
import { styles } from './pdfStyles';
import { ReportHeader, ReportFooter } from './ReportLayout';

// Sections
import { OverviewSection } from './sections/OverviewSection';
import { SalesSection } from './sections/SalesSection';
import { ProductSection } from './sections/ProductSection';
import { CategorySection } from './sections/CategorySection';
import { CustomerSection } from './sections/CustomerSection';
import { PaymentSection } from './sections/PaymentSection';
import { DeliverySection } from './sections/DeliverySection';

const FullAdminReportPdf = ({
    overview,
    sales,
    products,
    categories,
    customers,
    payments,
    delivery
}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <ReportHeader title="Full Executive Report" />

            <OverviewSection data={overview} />
            <SalesSection data={sales} />
            <ProductSection data={products} />
            <CategorySection data={categories} />
            <CustomerSection data={customers} />
            <PaymentSection data={payments} />
            <DeliverySection data={delivery} />

            <ReportFooter />
        </Page>
    </Document>
);

export default FullAdminReportPdf;
