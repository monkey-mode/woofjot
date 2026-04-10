from __future__ import annotations

import asyncio

import boto3
from botocore.config import Config

from config import settings


def _client() -> boto3.client:
    scheme = "https" if settings.minio_use_ssl else "http"
    return boto3.client(
        "s3",
        endpoint_url=f"{scheme}://{settings.minio_endpoint}",
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        config=Config(signature_version="s3v4"),
        region_name="us-east-1",
    )


async def download(key: str) -> bytes:
    loop = asyncio.get_event_loop()
    client = _client()

    def _get() -> bytes:
        return client.get_object(Bucket=settings.minio_bucket, Key=key)["Body"].read()

    return await loop.run_in_executor(None, _get)


def object_url(key: str) -> str:
    scheme = "https" if settings.minio_use_ssl else "http"
    return f"{scheme}://{settings.minio_external_endpoint}/{settings.minio_bucket}/{key}"


async def upload(key: str, data: bytes, content_type: str = "image/jpeg") -> None:
    loop = asyncio.get_event_loop()
    client = _client()

    def _put() -> None:
        client.put_object(
            Bucket=settings.minio_bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    await loop.run_in_executor(None, _put)
