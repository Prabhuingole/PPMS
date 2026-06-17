import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings
import datetime

def get_base_html(title: str, content: str) -> str:
    current_year = datetime.datetime.now().year
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); max-width: 600px; width: 100%;">
                        <!-- Header -->
                        <tr>
                            <td align="center" style="background-color: #4f46e5; padding: 30px 20px;">
                                <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: 1px;">SPMS</h1>
                            </td>
                        </tr>
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px; color: #3f3f46; font-size: 16px; line-height: 1.6;">
                                {content}
                                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e4e4e7;">
                                    <p style="margin: 0; font-size: 15px; color: #52525b;">Best regards,<br><strong style="color: #4f46e5;">The SPMS Team</strong></p>
                                </div>
                            </td>
                        </tr>
                        <!-- Footer -->
                        <tr>
                            <td align="center" style="background-color: #fafafa; padding: 24px; border-top: 1px solid #e4e4e7;">
                                <p style="margin: 0; color: #a1a1aa; font-size: 13px;">
                                    This is an automated message, please do not reply directly to this email.
                                </p>
                                <p style="margin: 8px 0 0 0; color: #a1a1aa; font-size: 13px;">
                                    &copy; {current_year} Sambhav Platform. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """

def send_temporary_password_email(to_email: str, employee_name: str, temp_password: str):
    if not settings.SMTP_HOST or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        print(f"SMTP not configured. Would have sent email to {to_email} with password: {temp_password}")
        return

    msg = MIMEMultipart('alternative')
    msg['From'] = f"{settings.EMAILS_FROM_NAME or 'SPMS'} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    msg['To'] = to_email
    msg['Subject'] = "Welcome to SPMS! Your Login Credentials"

    text = f"""Hello {employee_name},

Your account has been successfully created on the Sambhav Project Management System.

Here are your temporary login credentials to get started:
Email: {to_email}
Temporary Password: {temp_password}

Login URL: {settings.FRONTEND_URL}/login

For your security, you will be prompted to set a new, secure password upon your first login.

Best regards,
The SPMS Team
"""

    content = f"""
    <h2 style="color: #18181b; font-size: 20px; font-weight: 700; margin-top: 0;">Hello {employee_name},</h2>
    <p>Your account has been successfully created on the Sambhav Project Management System.</p>
    <p>Here are your temporary login credentials to get started:</p>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="margin: 0 0 10px 0;"><strong style="color: #475569;">Email:</strong> <span style="color: #0f172a; font-weight: 600;">{to_email}</span></p>
        <p style="margin: 0;"><strong style="color: #475569;">Temporary Password:</strong> <span style="color: #0f172a; font-weight: 600; font-family: monospace; font-size: 18px; background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{temp_password}</span></p>
    </div>
    <div style="text-align: center; margin: 32px 0;">
        <a href="{settings.FRONTEND_URL}/login" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 6px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">Login to Your Account</a>
    </div>
    <p>For your security, you will be prompted to set a new, secure password upon your first login.</p>
    """
    
    body = get_base_html("Welcome to SPMS", content)
    
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(body, 'html')
    
    msg.attach(part1)
    msg.attach(part2)

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

    msg = MIMEMultipart('alternative')
    msg['From'] = f"{settings.EMAILS_FROM_NAME or 'SPMS'} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    msg['To'] = to_email
    msg['Subject'] = "Password Reset Request - SPMS"

    text = f"""Hello {employee_name},

We received a request to reset your password for your SPMS account.

You can reset your password by opening the following link in your browser:
{reset_link}

This link will expire in 15 minutes.

If you did not request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
The SPMS Team
"""

    content = f"""
    <h2 style="color: #18181b; font-size: 20px; font-weight: 700; margin-top: 0;">Hello {employee_name},</h2>
    <p>We received a request to reset your password for your SPMS account.</p>
    <p>You can reset your password by clicking the button below:</p>
    <div style="text-align: center; margin: 32px 0;">
        <a href="{reset_link}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; padding: 14px 28px; border-radius: 6px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);">Reset My Password</a>
    </div>
    <p style="color: #dc2626; font-size: 14px; font-weight: 600;">This link will expire in 15 minutes.</p>
    <p style="font-size: 14px;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
    """
    
    body = get_base_html("Password Reset", content)
    
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(body, 'html')
    
    msg.attach(part1)
    msg.attach(part2)

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

    msg = MIMEMultipart('alternative')
    msg['From'] = f"{settings.EMAILS_FROM_NAME or 'SPMS'} <{settings.EMAILS_FROM_EMAIL or settings.SMTP_USER}>"
    msg['To'] = to_email
    msg['Subject'] = "Your SPMS Login Verification Code"

    text = f"""Hello {employee_name},

You are attempting to log in to SPMS. Please use the following verification code to complete your login:

{otp}

This code will expire in 10 minutes.

If you did not attempt to log in, please secure your account immediately and contact your administrator.

Best regards,
The SPMS Team
"""

    content = f"""
    <h2 style="color: #18181b; font-size: 20px; font-weight: 700; margin-top: 0;">Hello {employee_name},</h2>
    <p>You are attempting to log in to SPMS. Please use the following verification code to complete your login:</p>
    <div style="text-align: center; margin: 32px 0;">
        <div style="display: inline-block; background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; padding: 16px 32px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 6px; color: #0f172a; font-family: monospace;">{otp}</span>
        </div>
    </div>
    <p style="color: #dc2626; font-size: 14px; font-weight: 600;">This code will expire in 10 minutes.</p>
    <p style="font-size: 14px;">If you did not attempt to log in, please secure your account immediately and contact your administrator.</p>
    """
    
    body = get_base_html("Login Verification", content)
    
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(body, 'html')
    
    msg.attach(part1)
    msg.attach(part2)

    try:
        server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
        server.starttls()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)
        server.quit()
        print(f"Successfully sent MFA OTP email to {to_email}")
    except Exception as e:
        print(f"Failed to send MFA OTP email to {to_email}: {e}")
