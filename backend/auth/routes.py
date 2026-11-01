"""
FastAPI Authentication & User Administration Router for QualiSense AI.
Handles registration, login, logout, token refresh, profiles, password reset,
and RBAC administrator user management.
"""

import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_, func

from backend.database import get_db
from backend.models import User, RefreshSession, PasswordResetToken, AuditLog
from backend.auth.security import (
    hash_password, verify_password, hash_token, generate_random_token,
    create_access_token, decode_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS, RESET_TOKEN_EXPIRE_HOURS
)
from backend.auth.permissions import (
    ROLE_ADMINISTRATOR, ROLE_QUALITY_ENGINEER, ROLE_PRODUCTION_MANAGER, ROLE_VIEWER,
    VALID_ROLES, get_role_permissions, USERS_READ, USERS_MANAGE
)
from backend.auth.dependencies import get_current_user, require_permission
from backend.auth.rate_limiter import rate_limiter
from backend.auth.schemas import (
    UserRegisterRequest, UserLoginRequest, UserResponse, TokenResponse,
    ProfileUpdateRequest, ChangePasswordRequest, ForgotPasswordRequest,
    ResetPasswordRequest, AdminCreateUserRequest, AdminUpdateUserRequest,
    AuditLogOut
)

router = APIRouter(prefix="/api/auth", tags=["Authentication & Access Control"])

def build_user_response(user: User) -> UserResponse:
    """Helper to construct UserResponse with permissions list."""
    perms = get_role_permissions(user.role)
    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        organisation=user.organisation,
        avatar=user.avatar,
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at,
        last_login_at=user.last_login_at,
        permissions=perms
    )

def set_auth_cookies(response: Response, access_token: str, refresh_token: Optional[str] = None):
    """Set secure HTTP-only cookies for access and refresh tokens."""
    # Access token cookie (15 min)
    response.set_cookie(
        key="qualisense_access",
        value=access_token,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production HTTPS
        path="/"
    )
    # Refresh token cookie (7 days)
    if refresh_token:
        response.set_cookie(
            key="qualisense_refresh",
            value=refresh_token,
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
            httponly=True,
            samesite="lax",
            secure=False,
            path="/api/auth"
        )

def clear_auth_cookies(response: Response):
    """Clear session cookies upon logout."""
    response.delete_cookie(key="qualisense_access", path="/")
    response.delete_cookie(key="qualisense_refresh", path="/api/auth")

# ==============================================================================
# PUBLIC AUTHENTICATION ROUTES
# ==============================================================================

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(
    req: UserRegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Public registration: assigns lowest-privilege role ('Viewer') strictly."""
    rate_limiter.check(request, action="register", max_requests=5, window_seconds=60)

    normalized_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    now = datetime.datetime.utcnow()
    initials = "".join([p[0].upper() for p in req.full_name.split()[:2]]) or "U"
    
    # Public registrations always receive the lowest privilege: Viewer
    new_user = User(
        name=req.full_name.strip(),
        email=normalized_email,
        password_hash=hash_password(req.password),
        role=ROLE_VIEWER,
        organisation=req.organisation.strip() if req.organisation else "L’Oréal Plant Operations",
        avatar=initials,
        is_active=True,
        is_verified=True,
        created_at=now,
        updated_at=now
    )
    db.add(new_user)
    db.flush()

    # Create session tokens
    token_data = {"sub": new_user.id, "email": new_user.email, "role": new_user.role, "name": new_user.name}
    access_token = create_access_token(token_data)

    # Store refresh session
    raw_refresh = generate_random_token(48)
    refresh_session = RefreshSession(
        user_id=new_user.id,
        token_hash=hash_token(raw_refresh),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent", "")[:255],
        expires_at=now + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        created_at=now
    )
    db.add(refresh_session)

    # Audit log
    audit = AuditLog(
        actor_user_id=new_user.id,
        action="USER_REGISTERED",
        target_type="USER",
        target_id=str(new_user.id),
        timestamp=now,
        metadata_json={"email": normalized_email, "role": ROLE_VIEWER}
    )
    db.add(audit)
    db.commit()

    set_auth_cookies(response, access_token, raw_refresh)
    return TokenResponse(
        access_token=access_token,
        user=build_user_response(new_user)
    )

@router.post("/login", response_model=TokenResponse)
def login_user(
    req: UserLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticate user with email and password, setting secure cookies."""
    normalized_email = req.email.strip().lower()
    rate_limiter.check(request, action="login", max_requests=10, window_seconds=60, custom_key=normalized_email)

    user = db.query(User).filter(User.email == normalized_email).first()
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Please contact your plant administrator."
        )

    now = datetime.datetime.utcnow()
    user.last_login_at = now

    token_data = {"sub": user.id, "email": user.email, "role": user.role, "name": user.name}
    access_token = create_access_token(token_data)

    # Create refresh token
    raw_refresh = generate_random_token(48)
    refresh_session = RefreshSession(
        user_id=user.id,
        token_hash=hash_token(raw_refresh),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent", "")[:255],
        expires_at=now + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        created_at=now
    )
    db.add(refresh_session)

    # Audit log
    audit = AuditLog(
        actor_user_id=user.id,
        action="USER_LOGIN",
        target_type="USER",
        target_id=str(user.id),
        timestamp=now,
        metadata_json={"email": user.email, "role": user.role}
    )
    db.add(audit)
    db.commit()

    set_auth_cookies(response, access_token, raw_refresh)
    return TokenResponse(
        access_token=access_token,
        user=build_user_response(user)
    )

@router.post("/logout")
def logout_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Revoke refresh session and clear authentication cookies."""
    raw_refresh = request.cookies.get("qualisense_refresh")
    now = datetime.datetime.utcnow()

    if raw_refresh:
        th = hash_token(raw_refresh)
        session = db.query(RefreshSession).filter(RefreshSession.token_hash == th).first()
        if session and not session.revoked_at:
            session.revoked_at = now
            db.commit()

    clear_auth_cookies(response)
    return {"message": "Successfully logged out."}

@router.post("/refresh", response_model=TokenResponse)
def refresh_session_token(
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """Rotate refresh token and issue new access token."""
    raw_refresh = request.cookies.get("qualisense_refresh")
    if not raw_refresh:
        # Check Authorization header fallback
        auth_header = request.headers.get("X-Refresh-Token")
        if auth_header:
            raw_refresh = auth_header

    if not raw_refresh:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token missing. Please log in again."
        )

    th = hash_token(raw_refresh)
    session = db.query(RefreshSession).filter(RefreshSession.token_hash == th).first()
    now = datetime.datetime.utcnow()

    if not session or session.revoked_at or session.expires_at < now:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh session expired or revoked. Please log in again."
        )

    user = db.query(User).filter(User.id == session.user_id).first()
    if not user or not user.is_active:
        clear_auth_cookies(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer active."
        )

    # Token rotation: revoke old session, spawn new one
    session.revoked_at = now
    new_raw_refresh = generate_random_token(48)
    new_session = RefreshSession(
        user_id=user.id,
        token_hash=hash_token(new_raw_refresh),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("User-Agent", "")[:255],
        expires_at=now + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
        created_at=now
    )
    db.add(new_session)

    # Issue new access token
    token_data = {"sub": user.id, "email": user.email, "role": user.role, "name": user.name}
    new_access_token = create_access_token(token_data)
    db.commit()

    set_auth_cookies(response, new_access_token, new_raw_refresh)
    return TokenResponse(
        access_token=new_access_token,
        user=build_user_response(user)
    )

# ==============================================================================
# PASSWORD RECOVERY WORKFLOW
# ==============================================================================

@router.post("/forgot-password")
def forgot_password(
    req: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Request password reset token.
    Generic response avoids revealing user existence.
    """
    rate_limiter.check(request, action="forgot_password", max_requests=5, window_seconds=60)
    normalized_email = req.email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    now = datetime.datetime.utcnow()

    reset_token_secret = None
    if user and user.is_active:
        reset_token_secret = generate_random_token(32)
        reset_record = PasswordResetToken(
            user_id=user.id,
            token_hash=hash_token(reset_token_secret),
            expires_at=now + datetime.timedelta(hours=RESET_TOKEN_EXPIRE_HOURS),
            created_at=now
        )
        db.add(reset_record)

        audit = AuditLog(
            actor_user_id=user.id,
            action="PASSWORD_RESET_REQUESTED",
            target_type="USER",
            target_id=str(user.id),
            timestamp=now,
            metadata_json={"email": user.email}
        )
        db.add(audit)
        db.commit()

    # In local competition prototype environment without outbound SMTP server,
    # we explicitly state email delivery is unconfigured and provide recovery token in demo metadata.
    return {
        "message": "If an account with this email exists, a password reset instruction has been generated.",
        "email_delivery_status": "SMTP_NOT_CONFIGURED (Local Competition Prototype)",
        "recovery_token": reset_token_secret,
        "reset_url_example": f"/reset-password?token={reset_token_secret}" if reset_token_secret else None
    }

@router.post("/reset-password")
def reset_password(
    req: ResetPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Consume single-use password reset token and update password."""
    rate_limiter.check(request, action="reset_password", max_requests=5, window_seconds=60)

    th = hash_token(req.token.strip())
    now = datetime.datetime.utcnow()
    record = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == th).first()

    if not record or record.used_at is not None or record.expires_at < now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token. Please request a new link."
        )

    user = db.query(User).filter(User.id == record.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User account not found.")

    # Invalidate token
    record.used_at = now
    user.password_hash = hash_password(req.new_password)
    user.updated_at = now

    # Revoke all existing refresh sessions for security
    db.query(RefreshSession).filter(
        RefreshSession.user_id == user.id,
        RefreshSession.revoked_at == None
    ).update({"revoked_at": now})

    audit = AuditLog(
        actor_user_id=user.id,
        action="PASSWORD_RESET_COMPLETED",
        target_type="USER",
        target_id=str(user.id),
        timestamp=now,
        metadata_json={"email": user.email}
    )
    db.add(audit)
    db.commit()

    return {"message": "Password successfully reset. You can now log in with your new password."}

# ==============================================================================
# CURRENT USER PROFILE MANAGEMENT
# ==============================================================================

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve current authenticated user details and active permissions."""
    return build_user_response(current_user)

@router.patch("/profile", response_model=UserResponse)
def update_profile(
    req: ProfileUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's own profile (full name, organisation). Cannot elevate role."""
    now = datetime.datetime.utcnow()
    if req.name and req.name.strip():
        current_user.name = req.name.strip()
        initials = "".join([p[0].upper() for p in current_user.name.split()[:2]]) or "U"
        current_user.avatar = initials
    if req.organisation is not None:
        current_user.organisation = req.organisation.strip()

    current_user.updated_at = now
    db.commit()
    db.refresh(current_user)
    return build_user_response(current_user)

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change own password after verifying current password."""
    if not current_user.password_hash or not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )

    now = datetime.datetime.utcnow()
    current_user.password_hash = hash_password(req.new_password)
    current_user.updated_at = now

    # Revoke other sessions
    db.query(RefreshSession).filter(
        RefreshSession.user_id == current_user.id,
        RefreshSession.revoked_at == None
    ).update({"revoked_at": now})

    audit = AuditLog(
        actor_user_id=current_user.id,
        action="PASSWORD_CHANGED",
        target_type="USER",
        target_id=str(current_user.id),
        timestamp=now,
        metadata_json={"email": current_user.email}
    )
    db.add(audit)
    db.commit()

    return {"message": "Password changed successfully."}

# ==============================================================================
# ADMIN USER MANAGEMENT (Role: Administrator only)
# ==============================================================================

@router.get("/admin/users", response_model=List[UserResponse])
def admin_list_users(
    search: Optional[str] = Query(None, description="Search by name or email"),
    role: Optional[str] = Query(None, description="Filter by role"),
    active_only: Optional[bool] = Query(None, description="Filter active status"),
    current_user: User = Depends(require_permission(USERS_MANAGE)),
    db: Session = Depends(get_db)
):
    """Administrator listing of all plant users."""
    query = db.query(User)

    if search:
        s = f"%{search.strip().lower()}%"
        query = query.filter(or_(func.lower(User.name).like(s), func.lower(User.email).like(s)))

    if role and role in VALID_ROLES:
        query = query.filter(User.role == role)

    if active_only is not None:
        query = query.filter(User.is_active == active_only)

    users = query.order_by(desc(User.created_at)).all()
    return [build_user_response(u) for u in users]

@router.post("/admin/users", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def admin_create_user(
    req: AdminCreateUserRequest,
    current_user: User = Depends(require_permission(USERS_MANAGE)),
    db: Session = Depends(get_db)
):
    """Administrator provisioning of privileged roles (Administrator, Quality Engineer, etc.)."""
    normalized_email = req.email.strip().lower()
    existing = db.query(User).filter(User.email == normalized_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    if req.role not in VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(VALID_ROLES)}"
        )

    now = datetime.datetime.utcnow()
    initials = "".join([p[0].upper() for p in req.name.split()[:2]]) or "U"
    
    new_user = User(
        name=req.name.strip(),
        email=normalized_email,
        password_hash=hash_password(req.password),
        role=req.role,
        organisation=req.organisation.strip() if req.organisation else "L’Oréal Plant Operations",
        avatar=initials,
        is_active=True,
        is_verified=True,
        created_at=now,
        updated_at=now
    )
    db.add(new_user)
    db.flush()

    audit = AuditLog(
        actor_user_id=current_user.id,
        action="ADMIN_CREATED_USER",
        target_type="USER",
        target_id=str(new_user.id),
        timestamp=now,
        metadata_json={"email": normalized_email, "role": req.role, "creator": current_user.email}
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)
    return build_user_response(new_user)

@router.patch("/admin/users/{user_id}", response_model=UserResponse)
def admin_update_user(
    user_id: int,
    req: AdminUpdateUserRequest,
    current_user: User = Depends(require_permission(USERS_MANAGE)),
    db: Session = Depends(get_db)
):
    """
    Administrator update of user account status and role.
    Safeguard: prevents deactivating or demoting the last active Administrator.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Safeguard check for last active administrator
    if user.role == ROLE_ADMINISTRATOR:
        if (req.is_active is False) or (req.role and req.role != ROLE_ADMINISTRATOR):
            active_admin_count = db.query(User).filter(
                User.role == ROLE_ADMINISTRATOR,
                User.is_active == True,
                User.id != user.id
            ).count()
            if active_admin_count == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot deactivate or demote the last active Administrator. Another active Administrator must exist."
                )

    now = datetime.datetime.utcnow()
    changes = {}

    if req.name and req.name.strip():
        user.name = req.name.strip()
        changes["name"] = user.name

    if req.role and req.role in VALID_ROLES:
        changes["old_role"] = user.role
        user.role = req.role
        changes["new_role"] = req.role

    if req.organisation is not None:
        user.organisation = req.organisation.strip()
        changes["organisation"] = user.organisation

    if req.is_active is not None:
        user.is_active = req.is_active
        changes["is_active"] = user.is_active
        # If deactivating, revoke active sessions
        if not user.is_active:
            db.query(RefreshSession).filter(
                RefreshSession.user_id == user.id,
                RefreshSession.revoked_at == None
            ).update({"revoked_at": now})

    user.updated_at = now
    audit = AuditLog(
        actor_user_id=current_user.id,
        action="ADMIN_UPDATED_USER",
        target_type="USER",
        target_id=str(user.id),
        timestamp=now,
        metadata_json=changes
    )
    db.add(audit)
    db.commit()
    db.refresh(user)
    return build_user_response(user)

@router.post("/admin/users/{user_id}/reset-password")
def admin_reset_user_password(
    user_id: int,
    current_user: User = Depends(require_permission(USERS_MANAGE)),
    db: Session = Depends(get_db)
):
    """Generate a single-use password reset token for a user."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    now = datetime.datetime.utcnow()
    reset_token_secret = generate_random_token(32)
    reset_record = PasswordResetToken(
        user_id=user.id,
        token_hash=hash_token(reset_token_secret),
        expires_at=now + datetime.timedelta(hours=RESET_TOKEN_EXPIRE_HOURS),
        created_at=now
    )
    db.add(reset_record)

    audit = AuditLog(
        actor_user_id=current_user.id,
        action="ADMIN_ISSUED_PASSWORD_RESET",
        target_type="USER",
        target_id=str(user.id),
        timestamp=now,
        metadata_json={"email": user.email, "admin": current_user.email}
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Password reset link generated for {user.email}.",
        "reset_token": reset_token_secret,
        "reset_url": f"/reset-password?token={reset_token_secret}"
    }

@router.get("/admin/audit-logs", response_model=List[AuditLogOut])
def admin_get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    current_user: User = Depends(require_permission(USERS_MANAGE)),
    db: Session = Depends(get_db)
):
    """View tamper-evident security audit trail of privileged operations."""
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(desc(AuditLog.timestamp)).limit(limit).all()
    res = []
    for log in logs:
        actor_name = log.actor.name if log.actor else "System / Automated"
        res.append(AuditLogOut(
            id=log.id,
            actor_user_id=log.actor_user_id,
            actor_name=actor_name,
            action=log.action,
            target_type=log.target_type,
            target_id=log.target_id,
            timestamp=log.timestamp,
            metadata_json=log.metadata_json
        ))
    return res
