import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import logging

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

def send_otp_email(email: str, otp: str):
    try:
        # 🚫 REMOVE OTP PRINTS IN PRODUCTION
        print("=" * 60)
        print("📧 PASSWORD RESET OTP EMAIL SENDING")
        print(f"To: {email}")
        print("=" * 60)

        if not all([SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD]):
            raise RuntimeError("SMTP configuration missing")

        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = email
        msg["Subject"] = "Nexora Password Reset OTP"

        body = f"""
Hello,

Your password reset OTP is:

🔐 {otp}

This OTP is valid for 10 minutes.
If you did not request this, please ignore this email.

— Nexora Team
"""
        msg.attach(MIMEText(body, "plain"))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()

        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()

        logger.info(f"OTP email sent successfully to {email}")
        print("✅ EMAIL SENT SUCCESSFULLY")

        return True

    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        print(f"❌ EMAIL FAILED: {e}")
        return False
