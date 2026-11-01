"""
First-Administrator Bootstrap CLI for QualiSense AI.
Allows plant engineers/administrators to securely establish or reset an Administrator account.

Usage:
    python -m backend.auth.bootstrap --email admin@qualisense.internal --password "YourStrongPassword123!" --name "Plant Admin"
"""

import argparse
import sys
import datetime
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.models import User, AuditLog
from backend.auth.security import hash_password
from backend.auth.permissions import ROLE_ADMINISTRATOR

def bootstrap_admin(email: str, password: str, name: str = "System Administrator", organisation: str = "Plant Operations"):
    if len(password) < 8:
        print("Error: Password must be at least 8 characters long.")
        sys.exit(1)

    normalized_email = email.strip().lower()
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == normalized_email).first()
        hashed = hash_password(password)
        now = datetime.datetime.utcnow()

        if user:
            user.password_hash = hashed
            user.role = ROLE_ADMINISTRATOR
            user.name = name
            user.organisation = organisation
            user.is_active = True
            user.is_verified = True
            user.updated_at = now
            action = "ADMIN_BOOTSTRAP_UPDATED"
            print(f"Existing user '{normalized_email}' elevated to Administrator and password updated.")
        else:
            initials = "".join([part[0].upper() for part in name.split()[:2]]) or "AD"
            user = User(
                name=name,
                email=normalized_email,
                password_hash=hashed,
                role=ROLE_ADMINISTRATOR,
                organisation=organisation,
                avatar=initials,
                is_active=True,
                is_verified=True,
                created_at=now,
                updated_at=now
            )
            db.add(user)
            db.flush()
            action = "ADMIN_BOOTSTRAP_CREATED"
            print(f"Administrator account '{normalized_email}' successfully bootstrapped.")

        # Record audit log
        audit = AuditLog(
            actor_user_id=user.id,
            action=action,
            target_type="USER",
            target_id=str(user.id),
            timestamp=now,
            metadata_json={"email": normalized_email, "role": ROLE_ADMINISTRATOR, "method": "CLI_BOOTSTRAP"}
        )
        db.add(audit)
        db.commit()
        print(f"Bootstrap completed. Log in at /login with {normalized_email}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Bootstrap Administrator Account for QualiSense AI")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--password", required=True, help="Secure administrator password")
    parser.add_argument("--name", default="System Administrator", help="Full name")
    parser.add_argument("--organisation", default="L’Oréal Plant Operations", help="Organisation name")
    args = parser.parse_args()

    bootstrap_admin(email=args.email, password=args.password, name=args.name, organisation=args.organisation)
