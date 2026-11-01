"""
Pydantic Schemas for Authentication, RBAC, User Profiles, and Audit Logs.
"""

import re
import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator

EMAIL_REGEX = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

def check_email(v: str) -> str:
    cleaned = v.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError("Invalid email address format.")
    return cleaned

class UserRegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: str
    password: str = Field(..., min_length=8, max_length=128)
    organisation: Optional[str] = Field(None, max_length=150)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return check_email(v)

class UserLoginRequest(BaseModel):
    email: str
    password: str
    remember_me: bool = False

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return check_email(v)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    organisation: Optional[str] = None
    avatar: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    created_at: Optional[datetime.datetime] = None
    last_login_at: Optional[datetime.datetime] = None
    permissions: List[str] = []

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    organisation: Optional[str] = Field(None, max_length=150)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)

class ForgotPasswordRequest(BaseModel):
    email: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return check_email(v)

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=16)
    new_password: str = Field(..., min_length=8, max_length=128)

class AdminCreateUserRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str
    password: str = Field(..., min_length=8, max_length=128)
    role: str = Field(..., description="Administrator, Quality Engineer, Production Manager, or Viewer")
    organisation: Optional[str] = Field(None, max_length=150)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return check_email(v)

class AdminUpdateUserRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    organisation: Optional[str] = None
    is_active: Optional[bool] = None

class AuditLogOut(BaseModel):
    id: int
    actor_user_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    timestamp: datetime.datetime
    metadata_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True
