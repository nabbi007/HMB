from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "HelloMamaBetter API"
    environment: str = "development"
    debug: bool = True

    # Database
    database_url: str = "postgresql+psycopg://hmb:hmb@localhost:5432/hmb"

    # Auth
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 30

    # Nurse PIN encryption (reversible — admins must read the PIN to verify it).
    # Generate a real key for prod:
    #   python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    pin_encryption_key: str = ""  # empty => dev fallback key (see app/core/crypto.py)
    pin_index_key: str = "dev-pin-index-key-change-me"  # HMAC key for the blind index

    # Email / SMTP. Dev uses Mailpit (docker-compose); prod swaps in a real provider.
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "HelloMamaBetter <no-reply@hmb.app>"
    smtp_starttls: bool = False  # port 587 STARTTLS (Gmail, SendGrid, …). Mailpit: False.
    smtp_ssl: bool = False  # port 465 implicit SSL. Use instead of starttls, not both.

    # One-time passcodes (account verification)
    otp_length: int = 6
    otp_expire_minutes: int = 10
    otp_max_attempts: int = 5
    otp_resend_cooldown_seconds: int = 30

    # Uploads. Dev stores files on disk and serves them at /uploads; prod swaps the
    # storage service (app/services/storage.py) for R2/Supabase presigned URLs.
    upload_dir: str = "uploads"
    upload_base_url: str = "/uploads"
    max_upload_mb: int = 5

    # CORS (comma-separated origins)
    cors_origins: str = "http://localhost:3000"

    # Monitoring
    sentry_dsn: str | None = None

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
