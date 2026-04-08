from __future__ import annotations

import boto3
from botocore.config import Config

from config import settings


def _client(external: bool = False) -> boto3.client:
    endpoint = (
        settings.minio_external_endpoint if external else settings.minio_endpoint
    )
    scheme = "https" if settings.minio_use_ssl else "http"
    return boto3.client(
        "s3",
        endpoint_url=f"{scheme}://{endpoint}",
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


def generate_presigned_put(key: str, content_type: str, expires_in: int = 900) -> str:
    client = _client(external=True)
    return client.generate_presigned_url(
        "put_object",
        Params={
            "Bucket": settings.minio_bucket,
            "Key": key,
            "ContentType": content_type,
        },
        ExpiresIn=expires_in,
    )


def object_url(key: str) -> str:
    scheme = "https" if settings.minio_use_ssl else "http"
    return f"{scheme}://{settings.minio_external_endpoint}/{settings.minio_bucket}/{key}"
