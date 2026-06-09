from app.core.config import settings
from app.core.email import send_temporary_password_email

print("SMTP HOST:", settings.SMTP_HOST)
print("SMTP PORT:", settings.SMTP_PORT)

send_temporary_password_email(
    to_email="hr.sambhavai@gmail.com",
    employee_name="Test Employee",
    temp_password="tempPass123!"
)
