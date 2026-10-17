# services/pdf_generator.py
import io
import os
from datetime import datetime
from typing import Dict, List, Optional
from fpdf import FPDF


class PDFReportGenerator:
    """Generate PDF reports for delivery data"""
    
    @staticmethod
    def generate_delivery_report_pdf(
        summary_data: Dict,
        period_data: List[Dict],
        trend_data: Dict,
        orders_data: List[Dict],
        report_range: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        delivery_person_name: str = "Delivery Person"
    ) -> bytes:
        """Generate a comprehensive PDF report"""
        
        buffer = io.BytesIO()
        
        # Create PDF document
        pdf = FPDF()
        pdf.add_page()
        
        # Set up fonts
        pdf.set_font("Arial", size=12)
        
        # Header
        pdf.set_font("Arial", 'B', 16)
        pdf.cell(200, 10, txt="Delivery Performance Report", ln=1, align='C')
        
        pdf.set_font("Arial", '', 12)
        pdf.cell(200, 10, txt=f"Generated for: {delivery_person_name}", ln=1, align='C')
        
        # Report period
        period_text = f"Report Period: {report_range.upper()}"
        if start_date and end_date:
            period_text += f" ({start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')})"
        pdf.cell(200, 10, txt=period_text, ln=1, align='C')
        pdf.cell(200, 10, txt=f"Generated on: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}", ln=1, align='C')
        
        pdf.ln(10)
        
        # 1. Summary Section
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="1. Executive Summary", ln=1)
        pdf.set_font("Arial", '', 12)
        
        # Summary table
        summary_table_data = [
            ["Metric", "Value"],
            ["Total Deliveries", str(summary_data.get('total_deliveries', 0))],
            ["Completed", str(summary_data.get('completed_deliveries', 0))],
            ["Pending", str(summary_data.get('pending_deliveries', 0))],
            ["Failed", str(summary_data.get('failed_deliveries', 0))],
            ["Cancelled", str(summary_data.get('cancelled_deliveries', 0))],
            ["Total Earnings", f"₹{summary_data.get('total_earnings', 0):.2f}"],
            ["Success Rate", f"{summary_data.get('success_rate', 0):.1f}%"],
        ]
        
        if summary_data.get('average_delivery_time'):
            summary_table_data.append(["Avg. Delivery Time", 
                                      f"{summary_data.get('average_delivery_time', 0):.1f} hours"])
        
        PDFReportGenerator._add_table(pdf, summary_table_data)
        pdf.ln(5)
        
        # 2. Period Breakdown Section
        if period_data:
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(200, 10, txt="2. Period-wise Performance", ln=1)
            pdf.set_font("Arial", '', 12)
            
            # Limit to first 5 periods for PDF readability
            period_table_data = [["Period", "Total", "Completed", "Failed", "Earnings"]]
            for period in period_data[:5]:
                period_table_data.append([
                    period.get('period', 'N/A'),
                    str(period.get('total_orders', 0)),
                    str(period.get('completed', 0)),
                    str(period.get('failed', 0)),
                    f"₹{period.get('earnings', 0):.2f}"
                ])
            
            PDFReportGenerator._add_table(pdf, period_table_data)
            pdf.ln(5)
        
        # 3. Recent Orders Section
        if orders_data:
            pdf.set_font("Arial", 'B', 14)
            pdf.cell(200, 10, txt="3. Recent Deliveries", ln=1)
            pdf.set_font("Arial", '', 10)  # Smaller font for table
            
            # Orders table (limited to 10 for readability)
            orders_table_data = [["Order ID", "Date", "Status", "Distance", "Earnings"]]
            for order in orders_data[:10]:
                orders_table_data.append([
                    f"#{order.get('order_id', '')}",
                    order.get('delivery_date', '').strftime('%Y-%m-%d') if hasattr(order.get('delivery_date'), 'strftime') else str(order.get('delivery_date', '')),
                    order.get('status', ''),
                    f"{order.get('distance_km', 0):.1f} km" if order.get('distance_km') else "N/A",
                    f"₹{order.get('earning_amount', 0):.2f}"
                ])
            
            PDFReportGenerator._add_table(pdf, orders_table_data)
            pdf.ln(5)
        
        # 4. Performance Metrics
        pdf.set_font("Arial", 'B', 14)
        pdf.cell(200, 10, txt="4. Performance Metrics", ln=1)
        pdf.set_font("Arial", '', 12)
        
        # Add simple metrics as text
        metrics = [
            f"• Delivery Success Rate: {summary_data.get('success_rate', 0):.1f}%",
            f"• Average Delivery Value: ₹{summary_data.get('total_earnings', 0)/max(summary_data.get('completed_deliveries', 1), 1):.2f} per delivery",
            f"• Completion Ratio: {summary_data.get('completed_deliveries', 0)}/{summary_data.get('total_deliveries', 1)}"
        ]
        
        for metric in metrics:
            pdf.cell(200, 8, txt=metric, ln=1)
        
        # Footer
        pdf.set_y(-30)
        pdf.set_font("Arial", 'I', 8)
        pdf.cell(0, 10, txt="Confidential - For internal use only", ln=1, align='C')
        pdf.cell(0, 10, txt=f"Report ID: DLV-{datetime.now().strftime('%Y%m%d-%H%M%S')}", ln=1, align='C')
        
        # Get PDF bytes
        pdf_bytes = pdf.output(dest='S').encode('latin-1')
        
        return pdf_bytes
    
    @staticmethod
    def _add_table(pdf: FPDF, data: List[List[str]]):
        """Helper method to add a table to PDF"""
        col_width = 190 / len(data[0])
        row_height = 10
        
        for row in data:
            for item in row:
                pdf.cell(col_width, row_height, txt=item, border=1, align='C')
            pdf.ln(row_height)