from pydantic import EmailStr, BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import sys

class TestModel(BaseModel):
    email: EmailStr

model = TestModel(email="hr.sambhavai@gmail.com")

msg = MIMEMultipart()
msg['From'] = f"Admin <{settings.SMTP_USER}>"
msg['To'] = model.email
msg['Subject'] = "Test EmailStr"
msg.attach(MIMEText("Test", 'html'))

try:
    server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
    server.starttls()
    server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
    server.send_message(msg)
    server.quit()
    print("Success")
except Exception as e:
    print("Error:", e)
