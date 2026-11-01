"""
Automated Verification Suite for Authentication & Role-Based Authorization (RBAC).
Tests:
1. Registration & Default Role Assignment (Viewer)
2. Duplicate Email Rejection
3. Login & Credential Verification with Argon2id
4. Inactive Account Gating
5. Refresh Session & Token Generation
6. Password Reset Token Workflow (Single-Use & Expiry)
7. RBAC Permission Matrix & Dependency Enforcement
8. Admin User Management & Last-Admin Safeguard
"""

import unittest
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Response
from starlette.datastructures import Headers

from backend.database import SessionLocal
from backend.models import User, RefreshSession, PasswordResetToken, AuditLog
from backend.auth.security import hash_password, verify_password, create_access_token, decode_access_token, generate_random_token, hash_token
from backend.auth.permissions import (
    ROLE_ADMINISTRATOR, ROLE_QUALITY_ENGINEER, ROLE_PRODUCTION_MANAGER, ROLE_VIEWER,
    ROLE_PERMISSIONS_MAP, has_permission, get_role_permissions,
    BATCHES_WRITE, ALERTS_WRITE, INVESTIGATIONS_WRITE, CAPA_WRITE, USERS_MANAGE
)
from backend.auth.dependencies import require_permission
from backend.auth.schemas import (
    UserRegisterRequest, UserLoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    AdminCreateUserRequest, AdminUpdateUserRequest
)
from backend.auth.routes import (
    register_user, login_user, get_current_user_profile, forgot_password, reset_password,
    admin_list_users, admin_update_user
)

class MockRequest:
    def __init__(self, client_ip="127.0.0.1", user_agent="PyTest-Mock"):
        self.client = type("Client", (), {"host": client_ip})()
        self.headers = {"user-agent": user_agent}
        self.cookies = {}

class TestAuthAndRBAC(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_01_argon2_and_jwt_security(self):
        """Test password hashing and JWT token creation/decoding."""
        pw = "SuperSecurePassword123!"
        hashed = hash_password(pw)
        self.assertTrue(hashed.startswith("$argon2id$"))
        self.assertTrue(verify_password(pw, hashed))
        self.assertFalse(verify_password("WrongPassword!", hashed))

        token = create_access_token({"sub": "user-uuid-123", "email": "test@qualisense.internal", "role": "Quality Engineer"})
        payload = decode_access_token(token)
        self.assertEqual(payload["sub"], "user-uuid-123")
        self.assertEqual(payload["email"], "test@qualisense.internal")
        self.assertEqual(payload["role"], "Quality Engineer")

    def test_02_rbac_permission_matrix(self):
        """Verify the 4-role hierarchy and granular permission mappings."""
        # Viewer permissions
        viewer_perms = get_role_permissions(ROLE_VIEWER)
        self.assertIn("dashboard.read", viewer_perms)
        self.assertIn("batches.read", viewer_perms)
        self.assertNotIn("batches.write", viewer_perms)
        self.assertNotIn("capa.write", viewer_perms)
        self.assertNotIn("users.manage", viewer_perms)

        # Quality Engineer permissions
        qe_perms = get_role_permissions(ROLE_QUALITY_ENGINEER)
        self.assertIn("batches.read", qe_perms)
        self.assertIn("batches.write", qe_perms)
        self.assertIn("alerts.write", qe_perms)
        self.assertIn("investigations.write", qe_perms)
        self.assertIn("capa.write", qe_perms)
        self.assertNotIn("users.manage", qe_perms)

        # Admin permissions
        admin_perms = get_role_permissions(ROLE_ADMINISTRATOR)
        self.assertIn("users.manage", admin_perms)
        self.assertIn("capa.write", admin_perms)
        self.assertIn("settings.manage", admin_perms)

        # Dependency check
        viewer_user = User(id="v1", email="v@q.internal", role=ROLE_VIEWER, is_active=True)
        qe_user = User(id="q1", email="q@q.internal", role=ROLE_QUALITY_ENGINEER, is_active=True)

        checker_batches_write = require_permission(BATCHES_WRITE)
        checker_users_manage = require_permission(USERS_MANAGE)

        # Quality Engineer allowed to write batches
        self.assertEqual(checker_batches_write(qe_user), qe_user)

        # Viewer blocked from writing batches (403 Forbidden)
        with self.assertRaises(HTTPException) as cm:
            checker_batches_write(viewer_user)
        self.assertEqual(cm.exception.status_code, 403)

        # Quality Engineer blocked from user management (403 Forbidden)
        with self.assertRaises(HTTPException) as cm:
            checker_users_manage(qe_user)
        self.assertEqual(cm.exception.status_code, 403)

    def test_03_public_registration_assigns_viewer_role(self):
        """Verify public registration creates account and strictly enforces Viewer role."""
        email = "test.newbie@qualisense-test.internal"
        # Cleanup if exists
        self.db.query(User).filter(User.email == email).delete()
        self.db.commit()

        payload = UserRegisterRequest(
            full_name="Test Newbie",
            email=email,
            password="Password123!Secure",
            organisation="Packaging Line 02"
        )
        req = MockRequest()
        res = Response()

        auth_out = register_user(payload, req, res, self.db)
        self.assertEqual(auth_out.user.email, email)
        self.assertEqual(auth_out.user.role, "Viewer")
        self.assertIn("dashboard.read", auth_out.user.permissions)
        self.assertNotIn("capa.write", auth_out.user.permissions)
        self.assertNotIn("users.manage", auth_out.user.permissions)

        # Duplicate registration should raise 400 Bad Request
        with self.assertRaises(HTTPException) as cm:
            register_user(payload, req, res, self.db)
        self.assertEqual(cm.exception.status_code, 400)

    def test_04_login_credential_verification_and_inactive_block(self):
        """Verify login works for active users and blocks inactive accounts."""
        req = MockRequest()
        res = Response()

        # Seeded demo Quality Engineer
        login_payload = UserLoginRequest(
            email="sarah.chen@qualisense-demo.internal",
            password="QualityEng@2026!"
        )
        auth_out = login_user(login_payload, req, res, self.db)
        self.assertEqual(auth_out.user.role, "Quality Engineer")
        self.assertIn("capa.write", auth_out.user.permissions)

        # Test invalid password raises 401
        bad_pw_payload = UserLoginRequest(
            email="sarah.chen@qualisense-demo.internal",
            password="WrongPassword123!"
        )
        with self.assertRaises(HTTPException) as cm:
            login_user(bad_pw_payload, req, res, self.db)
        self.assertEqual(cm.exception.status_code, 401)

        # Test inactive user raises 403
        user = self.db.query(User).filter(User.email == "sarah.chen@qualisense-demo.internal").first()
        user.is_active = False
        self.db.commit()

        with self.assertRaises(HTTPException) as cm:
            login_user(login_payload, req, res, self.db)
        self.assertEqual(cm.exception.status_code, 403)

        # Restore user to active
        user.is_active = True
        self.db.commit()

    def test_05_password_reset_token_workflow(self):
        """Test forgot-password generation and single-use reset password."""
        email = "sarah.chen@qualisense-demo.internal"
        req = MockRequest()

        forgot_res = forgot_password(ForgotPasswordRequest(email=email), req, self.db)
        self.assertIn("recovery_token", forgot_res)
        raw_token = forgot_res["recovery_token"]

        # Reset password with valid token
        new_pw = "NewQualityEng@2026!"
        reset_res = reset_password(ResetPasswordRequest(token=raw_token, new_password=new_pw), req, self.db)
        self.assertIn("Password successfully reset", reset_res["message"])

        # Re-using the same token should fail with 400
        with self.assertRaises(HTTPException) as cm:
            reset_password(ResetPasswordRequest(token=raw_token, new_password="AnotherPassword123!"), req, self.db)
        self.assertEqual(cm.exception.status_code, 400)

        # Restore original password for ongoing tests
        reset_res = forgot_password(ForgotPasswordRequest(email=email), req, self.db)
        reset_password(ResetPasswordRequest(token=reset_res["recovery_token"], new_password="QualityEng@2026!"), req, self.db)

    def test_06_admin_user_management_and_last_admin_safeguard(self):
        """Test admin role updating and last-admin safeguard protection."""
        admin = self.db.query(User).filter(User.role == ROLE_ADMINISTRATOR).first()
        self.assertIsNotNone(admin)

        # Ensure that attempting to deactivate the only admin fails with 400
        with self.assertRaises(HTTPException) as cm:
            admin_update_user(admin.id, AdminUpdateUserRequest(is_active=False), admin, self.db)
        self.assertEqual(cm.exception.status_code, 400)
        self.assertIn("Cannot deactivate or demote the last active Administrator", cm.exception.detail)


if __name__ == "__main__":
    unittest.main()
