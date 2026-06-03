import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

def send_temporary_password_email(to_email: str, employee_name: str, temp_password: str):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Would have sent email to {to_email} with password: {temp_password}")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{settings.EMAILS_FROM_NAME or 'Admin'} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    msg['To'] = to_email
    msg['Subject'] = "Welcome! Your Temporary Login Credentials"

    body = f"""
    <p>Hello {employee_name},</p>
    <p>Your account has been successfully created.</p>
    <p>Here are your temporary login credentials:</p>
    <ul>
        <li><strong>Email:</strong> {to_email}</li>
        <li><strong>Temporary Password:</strong> {temp_password}</li>
    </ul>
    <p>Please <a href="{settings.FRONTEND_URL}/login">click here to log in</a>.</p>
    <p>You will be prompted to set a new, secure password upon your first login.</p>
    <p>Best regards,<br>The Team</p>
    """
    
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent welcome email to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")

def send_password_reset_email(to_email: str, employee_name: str, reset_link: str):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Reset link for {to_email}: {reset_link}")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{settings.EMAILS_FROM_NAME or 'Admin'} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    msg['To'] = to_email
    msg['Subject'] = "Password Reset Request"

    body = f"""
    <p>Hello {employee_name},</p>
    <p>We received a request to reset your password.</p>
    <p>Please <a href="{reset_link}">click here to reset your password</a>.</p>
    <p>If you did not request a password reset, please ignore this email.</p>
    <p>This link will expire in 15 minutes.</p>
    <p>Best regards,<br>The Team</p>
    """
    
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent password reset email to {to_email}")
    except Exception as e:
        print(f"Failed to send reset email to {to_email}: {e}")

def send_mfa_otp_email(to_email: str, employee_name: str, otp: str):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. MFA OTP for {to_email}: {otp}")
        return

    msg = MIMEMultipart()
    msg['From'] = f"{settings.EMAILS_FROM_NAME or 'Admin'} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    msg['To'] = to_email
    msg['Subject'] = "Your Login Verification Code"

    body = f"""
    <p>Hello {employee_name},</p>
    <p>Here is your verification code to complete your login:</p>
    <h2 style="font-size: 24px; font-weight: bold; padding: 10px; background: #f4f4f5; display: inline-block; border-radius: 6px;">{otp}</h2>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not attempt to log in, please secure your account immediately.</p>
    <p>Best regards,<br>The Team</p>
    """
    
    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent MFA OTP email to {to_email}")
    except Exception as e:
        print(f"Failed to send MFA OTP email to {to_email}: {e}")
