"""Frozen app configuration — read once from environment at boot."""

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    region: str = os.getenv("AWS_REGION", "us-east-1")
    cognito_user_pool_id: str = os.getenv("COGNITO_USER_POOL_ID", "")
    cognito_client_id: str = os.getenv("COGNITO_CLIENT_ID", "")
    db_host: str = os.getenv("DB_HOST", "")
    db_port: int = int(os.getenv("DB_PORT", "5432"))
    db_name: str = os.getenv("DB_NAME", "contracts")
    db_user: str = os.getenv("DB_USER", "postgres")
    db_password: str = os.getenv("DB_PASSWORD", "")
    bedrock_model: str = os.getenv("BEDROCK_MODEL", "deepseek.deepseek-v3")
    s3_outputs_bucket: str = os.getenv("S3_OUTPUTS_BUCKET", "")
    s3_templates_bucket: str = os.getenv("S3_TEMPLATES_BUCKET", "")
    cors_origin: str = os.getenv("CORS_ORIGIN", "*")


config = Config()
