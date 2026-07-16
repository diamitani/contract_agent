"""Auth routes — sign-up, login, token verification."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from .. import auth as auth_module
from ..models import SignUpRequest, SignUpResponse, LoginRequest, LoginResponse

router = APIRouter()
security = HTTPBearer()


@router.post("/signup", response_model=SignUpResponse)
def sign_up(body: SignUpRequest):
    """Register a new user via Cognito."""
    try:
        result = auth_module.sign_up(
            email=body.email,
            password=body.password,
            name=body.name,
        )
        return SignUpResponse(
            user_id=result["user_id"],
            email=body.email,
            message="Account created. Please check your email for verification.",
        )
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))


@router.post("/login", response_model=LoginResponse)
def login(body: LoginRequest):
    """Authenticate user and return tokens."""
    try:
        tokens = auth_module.authenticate(body.email, body.password)
        user = auth_module.get_user(tokens["access_token"])
        return LoginResponse(
            access_token=tokens["access_token"],
            refresh_token=tokens["refresh_token"],
            expires_in=tokens["expires_in"],
            user_id=user["user_id"],
        )
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Dependency: verify token and return user info."""
    try:
        return auth_module.get_user(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
