import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useReports } from '../../../context/ReportsContext';
import AdminLayout from '../../../components/Admin/Layout/AdminLayout'; // Verify path
import './Reports.css';

// Import PDF Components
import OverviewReportPdf from '../../../pdf/OverviewReportPdf';
import SalesReportPdf from '../../../pdf/SalesReportPdf';
import ProductReportPdf from '../../../pdf/ProductReportPdf';
import CategoryReportPdf from '../../../pdf/CategoryReportPdf';
import CustomerReportPdf from '../../../pdf/CustomerReportPdf';
import PaymentReportPdf from '../../../pdf/PaymentReportPdf';
import DeliveryReportPdf from '../../../pdf/DeliveryReportPdf';
import FullAdminReportPdf from '../../../pdf/FullAdminReportPdf';

const DownloadButton = ({ document, fileName, label, isFull = false }) => (
  <PDFDownloadLink document={document} fileName={fileName} className="text-decoration-none">
    {({ blob, url, loading, error }) => (
      <button
        className={`btn-download-pdf ${isFull ? 'btn-download-full' : ''} ${loading ? 'disabled' : ''}`}
        disabled={loading}
      >
        {loading ? 'Generating PDF...' : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {label}
          </>
        )}
      </button>
    )}
  </PDFDownloadLink>
);

const Reports = () => {
  const {
    overview, sales, products, categories,
    customers, payments, delivery,
    loading, error
  } = useReports();

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="reports-page">
          <div className="error-container">
            <h3>Error Loading Reports</h3>
            <p>{error}</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="reports-page">
        <div className="reports-header-section">
          <div>
            <h1 className="reports-title">Admin Reports Center</h1>
            <p className="reports-subtitle">View and export real-time business intelligence.</p>
          </div>
          {/* Full Report Download */}
          <DownloadButton
            document={
              <FullAdminReportPdf
                overview={overview}
                sales={Array.isArray(sales) ? sales : []}
                products={Array.isArray(products) ? products : []}
                categories={Array.isArray(categories) ? categories : []}
                customers={Array.isArray(customers) ? customers : []}
                payments={Array.isArray(payments) ? payments : []}
                delivery={Array.isArray(delivery) ? delivery : []}
              />
            }
            fileName={`Nexora_Full_Report_${new Date().toISOString().split('T')[0]}.pdf`}
            label="Download Full Executive Report"
            isFull={true}
          />
        </div>

        <div className="reports-grid">

          {/* 1. Overview Section */}
          <div className="report-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Overview KPI</h2>
              </div>
              <DownloadButton
                document={<OverviewReportPdf data={overview} />}
                fileName="Overview_Report.pdf"
                label="Download Overview PDF"
              />
            </div>
            {overview && (
              <div className="kpi-preview-grid">
                <div className="kpi-preview-card">
                  <div className="kpi-label">Revenue</div>
                  <div className="kpi-value">${overview.total_revenue?.toLocaleString()}</div>
                </div>
                <div className="kpi-preview-card">
                  <div className="kpi-label">Orders</div>
                  <div className="kpi-value">{overview.total_orders}</div>
                </div>
                <div className="kpi-preview-card">
                  <div className="kpi-label">Repeat Rate</div>
                  <div className="kpi-value">{overview.repeat_purchase_rate}%</div>
                </div>
              </div>
            )}
          </div>

          {/* 2. Sales Section */}
          <div className="report-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Sales Analytics</h2>
              </div>
              <DownloadButton
                document={<SalesReportPdf data={Array.isArray(sales) ? sales : []} />}
                fileName="Sales_Report.pdf"
                label="Download Sales PDF"
              />
            </div>
            <div className="report-preview">
              <table className="preview-table">
                <thead><tr><th>Date</th><th>Orders</th><th>Revenue</th></tr></thead>
                <tbody>
                  {Array.isArray(sales) && sales.length > 0 ? (
                    sales.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td>{row.date}</td>
                        <td>{row.orders_count}</td>
                        <td>${row.revenue?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3">No sales data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Products Section */}
          <div className="report-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Product Performance</h2>
              </div>
              <DownloadButton
                document={<ProductReportPdf data={Array.isArray(products) ? products : []} />}
                fileName="Product_Report.pdf"
                label="Download Product PDF"
              />
            </div>
            <div className="report-preview">
              <table className="preview-table">
                <thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
                <tbody>
                  {Array.isArray(products) && products.length > 0 ? (
                    products.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td>{row.product_name}</td>
                        <td>{row.total_sold}</td>
                        <td>${row.revenue?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3">No product data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 4. Categories Section */}
          <div className="report-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Category Breakdown</h2>
              </div>
              <DownloadButton
                document={<CategoryReportPdf data={Array.isArray(categories) ? categories : []} />}
                fileName="Category_Report.pdf"
                label="Download Category PDF"
              />
            </div>
            <div className="report-preview">
              <table className="preview-table">
                <thead><tr><th>Category</th><th>Products</th><th>Revenue</th></tr></thead>
                <tbody>
                  {Array.isArray(categories) && categories.length > 0 ? (
                    categories.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td>{row.category_name}</td>
                        <td>{row.total_products}</td>
                        <td>${row.revenue?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3">No category data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Customers Section */}
          <div className="report-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Top Customers</h2>
              </div>
              <DownloadButton
                document={<CustomerReportPdf data={Array.isArray(customers) ? customers : []} />}
                fileName="Customer_Report.pdf"
                label="Download Customer PDF"
              />
            </div>
            <div className="report-preview">
              <table className="preview-table">
                <thead><tr><th>Name</th><th>Email</th><th>Spent</th></tr></thead>
                <tbody>
                  {Array.isArray(customers) && customers.length > 0 ? (
                    customers.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td>{row.customer_name}</td>
                        <td>{row.email}</td>
                        <td>${row.total_spent?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3">No customer data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Payments Section */}
          <div className="report-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Payment Methods</h2>
              </div>
              <DownloadButton
                document={<PaymentReportPdf data={Array.isArray(payments) ? payments : []} />}
                fileName="Payment_Report.pdf"
                label="Download Payment PDF"
              />
            </div>
            <div className="report-preview">
              <table className="preview-table">
                <thead><tr><th>Method</th><th>Txns</th><th>Amount</th></tr></thead>
                <tbody>
                  {Array.isArray(payments) && payments.length > 0 ? (
                    payments.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td>{row.payment_method}</td>
                        <td>{row.total_transactions}</td>
                        <td>${row.total_amount?.toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3">No payment data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 7. Delivery Section */}
          <div className="report-section">
            <div className="section-header">
              <div className="section-title">
                <h2>Delivery Performance</h2>
              </div>
              <DownloadButton
                document={<DeliveryReportPdf data={Array.isArray(delivery) ? delivery : []} />}
                fileName="Delivery_Report.pdf"
                label="Download Delivery PDF"
              />
            </div>
            <div className="report-preview">
              <table className="preview-table">
                <thead><tr><th>Status</th><th>Orders</th><th>Time</th></tr></thead>
                <tbody>
                  {Array.isArray(delivery) && delivery.length > 0 ? (
                    delivery.slice(0, 5).map((row, i) => (
                      <tr key={i}>
                        <td>{row.delivery_status}</td>
                        <td>{row.total_orders}</td>
                        <td>{row.avg_delivery_time}</td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3">No delivery data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default Reports;