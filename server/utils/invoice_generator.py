from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import io
from datetime import datetime

class InvoiceGenerator:
    @staticmethod
    def generate_invoice(order):
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # Header
        c.setFont("Helvetica-Bold", 24)
        c.drawString(50, height - 50, "NEXORA")
        
        c.setFont("Helvetica", 12)
        c.drawString(50, height - 70, "Invoice")
        
        # Order Details
        c.drawString(50, height - 100, f"Order ID: {order.order_id}")
        c.drawString(50, height - 120, f"Date: {order.placed_at.strftime('%Y-%m-%d') if order.placed_at else datetime.now().strftime('%Y-%m-%d')}")
        c.drawString(50, height - 140, f"Status: {order.order_status}")
        
        # Customer Details (Simple version)
        c.drawString(300, height - 100, f"Customer ID: {order.user_id}")
        
        # Items Table
        y = height - 180
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Item")
        c.drawString(300, y, "Qty")
        c.drawString(350, y, "Price")
        c.drawString(450, y, "Total")
        
        y -= 20
        c.line(50, y, 550, y)
        y -= 20
        
        c.setFont("Helvetica", 10)
        for item in order.items:
            # Variant/Product Name
            name = item.variant.product.product_name if item.variant and item.variant.product else "Item"
            c.drawString(50, y, name[:40])
            c.drawString(300, y, str(item.quantity))
            c.drawString(350, y, f"${item.price:.2f}")
            c.drawString(450, y, f"${(item.price * item.quantity):.2f}")
            y -= 20
            
        c.line(50, y, 550, y)
        y -= 30
        
        # Totals
        c.setFont("Helvetica-Bold", 12)
        c.drawString(350, y, "Subtotal:")
        c.drawString(450, y, f"${order.subtotal:.2f}")
        y -= 20
        c.drawString(350, y, "Tax:")
        c.drawString(450, y, f"${order.tax_amount:.2f}")
        y -= 20
        c.drawString(350, y, "Total:")
        c.drawString(450, y, f"${order.total_amount:.2f}")
        
        c.save()
        buffer.seek(0)
        return buffer
