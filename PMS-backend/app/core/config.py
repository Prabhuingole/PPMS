from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Security
    MAX_FAILED_ATTEMPTS: int = 5
    LOCKOUT_MINUTES: int = 15
    
    # Superadmin
    SUPERADMIN_EMAIL: str 
    SUPERADMIN_PASSWORD: str

    # Cloudflare R2
    R2_ENDPOINT: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET_NAME: str = ""
    R2_PUBLIC_URL: str = ""

    # SMTP Settings
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAILS_FROM_EMAIL: str | None = None
    EMAILS_FROM_NAME: str | None = None

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://192.168.1.9:3000"
    FRONTEND_URL: str = "http://192.168.1.9:3000"

    # Mail Automation SSO & Sync
    MAIL_AUTOMATION_URL: str = "http://192.168.1.6:3004"
    MAIL_SSO_SECRET: str = "mail_sso_secret_key"
    MAIL_INTERNAL_SECRET: str = "mail_sso_secret_key"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )

settings = Settings()