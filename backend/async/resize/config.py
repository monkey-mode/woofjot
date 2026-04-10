from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    minio_endpoint: str = "minio:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "slips"
    minio_use_ssl: bool = False

    redis_url: str = "redis://redis:6379/0"

    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "woofjot"
    postgres_user: str = "woofjot"
    postgres_password: str = "woofjot"

    minio_external_endpoint: str = "localhost:9000"

    resize_max_px: int = 1200       # LLM-optimised copy
    resize_quality: int = 85

    resize_store_max_px: int = 2400  # storage-optimised original
    resize_store_quality: int = 88

    resize_thumb_max_px: int = 400   # UI thumbnail
    resize_thumb_quality: int = 75

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = {"env_file": ".env"}


settings = Settings()
