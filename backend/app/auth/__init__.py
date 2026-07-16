"""Cognito User Pool integration for sign-up, login, and token verification."""

from __future__ import annotations

import boto3
from botocore.exceptions import ClientError
from .config import config


_client: boto3.client | None = None


def _get_client() -> boto3.client:
    global _client
    if _client is None:
        _client = boto3.client("cognito-idp", region_name=config.region)
    return _client


def sign_up(email: str, password: str, name: str, **attrs) -> dict:
    """Register a new user in Cognito. Returns user_sub on success."""
    client = _get_client()
    user_attrs = [
        {"Name": "name", "Value": name},
        {"Name": "email", "Value": email},
    ]
    try:
        resp = client.sign_up(
            ClientId=config.cognito_client_id,
            Username=email,
            Password=password,
            UserAttributes=user_attrs,
        )
        return {
            "user_id": resp["UserSub"],
            "confirmed": resp["UserConfirmed"],
        }
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code == "UsernameExistsException":
            raise ValueError("An account with this email already exists")
        raise


def authenticate(email: str, password: str) -> dict:
    """Authenticate user and return tokens."""
    client = _get_client()
    try:
        resp = client.initiate_auth(
            ClientId=config.cognito_client_id,
            AuthFlow="USER_PASSWORD_AUTH",
            AuthParameters={"USERNAME": email, "PASSWORD": password},
        )
        auth_result = resp["AuthenticationResult"]
        return {
            "access_token": auth_result["AccessToken"],
            "refresh_token": auth_result["RefreshToken"],
            "expires_in": auth_result["ExpiresIn"],
        }
    except ClientError as e:
        code = e.response["Error"]["Code"]
        if code == "NotAuthorizedException":
            raise ValueError("Invalid email or password")
        raise


def get_user(access_token: str) -> dict:
    """Verify token and return user attributes."""
    client = _get_client()
    try:
        resp = client.get_user(AccessToken=access_token)
        attrs = {a["Name"]: a["Value"] for a in resp["UserAttributes"]}
        return {
            "user_id": resp["Username"],
            "email": attrs.get("email", ""),
            "name": attrs.get("name", ""),
        }
    except ClientError:
        raise ValueError("Invalid or expired token")
