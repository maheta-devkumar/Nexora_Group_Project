import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useOrderContext } from '../../context/OrderContext';
import { toastSuccess } from '../../utils/customToast';
import html2pdf from 'html2pdf.js';
import './Invoice.css';

const Invoice = () => {
  const { orderId } = useParams();
  const { fetchOrderById, currentOrder, loading } = useOrderContext();

  useEffect(() => {
    if (orderId) {
      fetchOrderById(orderId);
    }
  }, [orderId]);

  const handleDownloadPDF = () => {
    const element = document.getElementById('printable-invoice');
    const opt = {
      margin: 10,
      filename: `invoice_${orderId}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // New Promise-based usage:
    html2pdf().set(opt).from(element).save();
    toastSuccess('Invoice PDF downloaded');
  };

  if (loading) return <div className="loading-state">Loading Invoice...</div>;
  if (!currentOrder) return <div className="error-state">Invoice details not available.</div>;

  return (
    <div className="invoice-page">
      <div className="invoice-actions no-print">
        <button onClick={handleDownloadPDF} className="btn-primary" style={{ background: '#e74c3c' }}>
          <i className="fas fa-file-pdf"></i> Download PDF
        </button>
      </div>

      <div className="invoice-container" id="printable-invoice">
        {/* Header */}
        <header className="invoice-header">
          <div className="brand-section">
            <h1 className="brand-name">Nexora</h1>
            <p className="brand-tagline">Premium Shopping Experience</p>
          </div>
          <div className="invoice-title-section">
            <h2 className="doc-title">INVOICE</h2>
            <p className="doc-number">#{currentOrder.order_id}</p>
            <span className={`status-badge ${currentOrder.payment_status.toLowerCase()}`}>
              {currentOrder.payment_status}
            </span>
          </div>
        </header>

        {/* Info Grid */}
        <div className="invoice-info-grid">
          <div className="info-block from">
            <h3>Billed From:</h3>
            <p><strong>Nexora Retail Pvt Ltd.</strong></p>
            <p>123 Tech Park, Innovation Street</p>
            <p>Bangalore, KA 560001, India</p>
            <p>support@nexora.com</p>
          </div>
          <div className="info-block into">
            <h3>Billed To:</h3>
            <p><strong>{currentOrder.address?.name || 'Valued Customer'}</strong></p>
            <p>{currentOrder.address?.line1}</p>
            <p>{currentOrder.address?.line2}</p>
            <p>{currentOrder.address?.city_name}, {currentOrder.address?.state_name} - {currentOrder.address?.pincode}</p>
          </div>
          <div className="info-block meta">
            <div className="meta-row">
              <span>Order Date:</span>
              <strong>{new Date(currentOrder.placed_at).toLocaleDateString()}</strong>
            </div>
            <div className="meta-row">
              <span>Payment Method:</span>
              <strong>{currentOrder.payment_method || 'Online'}</strong>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="invoice-table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {currentOrder.items?.map((item, index) => (
                <tr key={index}>
                  <td>
                    <div className="item-name">{item.product_name}</div>
                    <div className="item-variant">{item.variant_name}</div>
                  </td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{item.price.toLocaleString()}</td>
                  <td className="text-right">₹{(item.price * item.quantity).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="invoice-footer-section">
          <div className="notes-section">
            <h4>Notes:</h4>
            <p>Thank you for shopping with Nexora. This is a computer-generated invoice and does not require a signature.</p>
          </div>
          <div className="totals-section">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>₹{currentOrder.subtotal.toLocaleString()}</span>
            </div>
            <div className="total-row">
              <span>Delivery Fee:</span>
              <span>₹{currentOrder.delivery_fee.toLocaleString()}</span>
            </div>
            <div className="total-row">
              <span>Tax (GST):</span>
              <span>₹{currentOrder.tax_amount.toLocaleString()}</span>
            </div>
            {currentOrder.discount_amount > 0 && (
              <div className="total-row discount">
                <span>Discount:</span>
                <span>-₹{currentOrder.discount_amount.toLocaleString()}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span>Grand Total:</span>
              <span>₹{currentOrder.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;