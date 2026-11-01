"""
FastAPI Authentication & Authorization Dependencies for QualiSense AI.
Validates session tokens, active account state, and fine-grained RBAC permissions.
"""

from typing import Optional, List, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.auth.security import decode_access_token
from backend.auth.permissions import has_permission, get_role_permissions

bearer_scheme = HTTPBearer(auto_error=False)

def extract_token_from_request(request: Request, bearer: Optional[HTTPAuthorizationCredentials]) -> Optional[str]:
    """Extract JWT token from Authorization header or HTTP-only cookie."""
    # 1. Bearer header
    if bearer and bearer.credentials:
        return bearer.credentials

    # 2. HTTP-only cookie
    cookie_token = request.cookies.get("qualisense_access")
    if cookie_token:
        return cookie_token

    # 3. Raw header check fallback
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    return None

def get_current_user(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Validate token and return authenticated active user or raise HTTP 401/403."""
    token = extract_token_from_request(request, bearer)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your plant administrator."
        )

    return user

def get_current_user_optional(
    request: Request,
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Return user if authenticated, otherwise None without raising 401."""
    token = extract_token_from_request(request, bearer)
    if not token:
        return None

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        return None

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return None

    return user

def require_permission(permission: str) -> Callable[[User], User]:
    """
    Factory dependency for role-based permission gating.
    Enforces that user has the required permission string.
    """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        if not has_permission(current_user.role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Insufficient permission ('{permission}' required for role '{current_user.role}')."
            )
        return current_user

    return permission_checker
