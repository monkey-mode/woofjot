from __future__ import annotations

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    postgres_host: str = "postgres"
    postgres_port: int = 5432
    postgres_db: str = "woofjot"
    postgres_user: str = "woofjot"
    postgres_password: str = "woofjot"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = {"env_file": ".env"}


settings = Settings()
