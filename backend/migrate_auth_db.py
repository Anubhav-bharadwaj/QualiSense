"""
Safe SQLite Database Migration for QualiSense AI Authentication & RBAC.
Preserves 100% of existing cosmetics batches, readings, alerts, and SECOM samples.
Adds:
- User authentication columns (password_hash, organisation, is_active, is_verified, created_at, updated_at, last_login_at)
- refresh_sessions table
- password_reset_tokens table
- audit_logs table
- Seed / bootstrap verified demo accounts with Argon2id hashes
"""

import sqlite3
import datetime
import os
from backend.auth.security import hash_password

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "qualisense.db")

def migrate_auth_schema():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Inspect existing columns in 'users'
    cursor.execute("PRAGMA table_info(users)")
    existing_cols = {row[1] for row in cursor.fetchall()}
    print(f"Existing 'users' columns: {existing_cols}")

    # Columns to add if missing
    new_columns = [
        ("password_hash", "VARCHAR(255)"),
        ("organisation", "VARCHAR(150) DEFAULT 'L’Oréal Plant Operations'"),
        ("is_active", "BOOLEAN DEFAULT 1"),
        ("is_verified", "BOOLEAN DEFAULT 1"),
        ("created_at", "DATETIME"),
        ("updated_at", "DATETIME"),
        ("last_login_at", "DATETIME"),
    ]

    for col_name, col_def in new_columns:
        if col_name not in existing_cols:
            print(f"Adding column '{col_name}' to 'users' table...")
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")

    # 2. Create 'refresh_sessions' table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS refresh_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        ip_address VARCHAR(50),
        user_agent VARCHAR(255),
        expires_at DATETIME NOT NULL,
        revoked_at DATETIME,
        created_at DATETIME NOT NULL
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_refresh_sessions_user_id ON refresh_sessions(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_refresh_sessions_token_hash ON refresh_sessions(token_hash)")

    # 3. Create 'password_reset_tokens' table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(64) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME,
        created_at DATETIME NOT NULL
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_reset_tokens_user_id ON password_reset_tokens(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_reset_tokens_token_hash ON password_reset_tokens(token_hash)")

    # 4. Create 'audit_logs' table if not exists
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(100),
        timestamp DATETIME NOT NULL,
        metadata_json JSON
    )
    """)
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs(action)")
    cursor.execute("CREATE INDEX IF NOT EXISTS ix_audit_logs_timestamp ON audit_logs(timestamp)")

    # 5. Seed default demo accounts with Argon2id passwords
    now_str = datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")

    demo_users = [
        {
            "name": "Alexandre Martin",
            "email": "admin@qualisense.internal",
            "password": "AdminPass@2026!",
            "role": "Administrator",
            "organisation": "L’Oréal Global Quality & Operations",
            "avatar": "AM"
        },
        {
            "name": "Dr. Sarah Chen",
            "email": "sarah.chen@qualisense-demo.internal",
            "password": "QualityEng@2026!",
            "role": "Quality Engineer",
            "organisation": "Cosmetics Plant 04 (EMEA)",
            "avatar": "SC"
        },
        {
            "name": "Marc Dupont",
            "email": "marc.dupont@qualisense-demo.internal",
            "password": "ProdMgr@2026!",
            "role": "Production Manager",
            "organisation": "Cosmetics Plant 04 (EMEA)",
            "avatar": "MD"
        },
        {
            "name": "Elena Rossi",
            "email": "elena.rossi@qualisense-demo.internal",
            "password": "ViewerPass@2026!",
            "role": "Viewer",
            "organisation": "Cosmetics Plant 04 (EMEA)",
            "avatar": "ER"
        }
    ]

    for u in demo_users:
        cursor.execute("SELECT id FROM users WHERE email = ?", (u["email"],))
        row = cursor.fetchone()
        hashed = hash_password(u["password"])
        if row:
            # Update password and standardize role
            cursor.execute("""
                UPDATE users
                SET password_hash = ?, role = ?, name = ?, organisation = ?, avatar = ?, is_active = 1, is_verified = 1, updated_at = ?
                WHERE id = ?
            """, (hashed, u["role"], u["name"], u["organisation"], u["avatar"], now_str, row[0]))
            print(f"Updated user: {u['email']} (Role: {u['role']})")
        else:
            # Insert user
            cursor.execute("""
                INSERT INTO users (name, email, password_hash, role, organisation, avatar, is_active, is_verified, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, 1, 1, ?, ?)
            """, (u["name"], u["email"], hashed, u["role"], u["organisation"], u["avatar"], now_str, now_str))
            print(f"Created user: {u['email']} (Role: {u['role']})")

    conn.commit()
    conn.close()
    print(">>> Authentication schema migration completed successfully! <<<")

if __name__ == "__main__":
    migrate_auth_schema()
