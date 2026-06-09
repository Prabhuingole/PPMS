import asyncio
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

def test_email():
    host = os.getenv("SMTP_HOST")
    port = int(os.getenv("SMTP_PORT", 587))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")

    print(f"Connecting to {host}:{port} with user {user}")

    msg = MIMEMultipart()
    msg['From'] = f"Admin <{user}>"
    msg['To'] = user
    msg['Subject'] = "Test Welcome! Your Temporary Login Credentials"

    body = "Test Email"
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(host, port)
        server.set_debuglevel(1)
        server.starttls()
        server.login(user, password)
        server.send_message(msg)
        server.quit()
        print("Successfully sent test email")
    except Exception as e:
        print(f"Failed to send test email: {e}")

test_email()
