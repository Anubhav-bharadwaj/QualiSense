"""
Role-Based Access Control (RBAC) Definitions and Permissions Mapping for QualiSense AI.

Roles:
1. Administrator: Full system access, user management, audit logs, all plant operations.
2. Quality Engineer: Batches, readings, alerts, 5 Whys, CAPA, effectiveness verification, analytics, sustainability, SECOM dataset lab, ML benchmark.
3. Production Manager: Batches, production readings, alerts viewing, investigations viewing, CAPA viewing, quality analytics, sustainability.
4. Viewer: Read-only access to dashboard, batches, alerts, analytics, sustainability.
"""

from typing import List, Dict, Set

# Permission string constants
DASHBOARD_READ = "dashboard.read"
BATCHES_READ = "batches.read"
BATCHES_WRITE = "batches.write"
ALERTS_READ = "alerts.read"
ALERTS_WRITE = "alerts.write"
INVESTIGATIONS_READ = "investigations.read"
INVESTIGATIONS_WRITE = "investigations.write"
CAPA_READ = "capa.read"
CAPA_WRITE = "capa.write"
ANALYTICS_READ = "analytics.read"
SUSTAINABILITY_READ = "sustainability.read"
DATASET_READ = "dataset.read"
ML_RUN = "ml.run"
USERS_READ = "users.read"
USERS_MANAGE = "users.manage"
SETTINGS_MANAGE = "settings.manage"

ALL_PERMISSIONS: Set[str] = {
    DASHBOARD_READ,
    BATCHES_READ,
    BATCHES_WRITE,
    ALERTS_READ,
    ALERTS_WRITE,
    INVESTIGATIONS_READ,
    INVESTIGATIONS_WRITE,
    CAPA_READ,
    CAPA_WRITE,
    ANALYTICS_READ,
    SUSTAINABILITY_READ,
    DATASET_READ,
    ML_RUN,
    USERS_READ,
    USERS_MANAGE,
    SETTINGS_MANAGE,
}

# Role definitions
ROLE_ADMINISTRATOR = "Administrator"
ROLE_QUALITY_ENGINEER = "Quality Engineer"
ROLE_PRODUCTION_MANAGER = "Production Manager"
ROLE_VIEWER = "Viewer"

VALID_ROLES: List[str] = [
    ROLE_ADMINISTRATOR,
    ROLE_QUALITY_ENGINEER,
    ROLE_PRODUCTION_MANAGER,
    ROLE_VIEWER,
]

ROLE_PERMISSIONS_MAP: Dict[str, Set[str]] = {
    ROLE_ADMINISTRATOR: set(ALL_PERMISSIONS),

    ROLE_QUALITY_ENGINEER: {
        DASHBOARD_READ,
        BATCHES_READ,
        BATCHES_WRITE,
        ALERTS_READ,
        ALERTS_WRITE,
        INVESTIGATIONS_READ,
        INVESTIGATIONS_WRITE,
        CAPA_READ,
        CAPA_WRITE,
        ANALYTICS_READ,
        SUSTAINABILITY_READ,
        DATASET_READ,
        ML_RUN,
    },

    ROLE_PRODUCTION_MANAGER: {
        DASHBOARD_READ,
        BATCHES_READ,
        BATCHES_WRITE,
        ALERTS_READ,
        INVESTIGATIONS_READ,
        CAPA_READ,
        ANALYTICS_READ,
        SUSTAINABILITY_READ,
    },

    ROLE_VIEWER: {
        DASHBOARD_READ,
        BATCHES_READ,
        ALERTS_READ,
        ANALYTICS_READ,
        SUSTAINABILITY_READ,
    },
}

def get_role_permissions(role: str) -> List[str]:
    """Get list of granted permissions for a given role name."""
    # Normalize legacy names if present
    normalized_role = role
    if role == "Plant Manager":
        normalized_role = ROLE_PRODUCTION_MANAGER
    elif role == "Production Operator":
        normalized_role = ROLE_VIEWER
    
    perms = ROLE_PERMISSIONS_MAP.get(normalized_role, set())
    return sorted(list(perms))

def has_permission(role: str, permission: str) -> bool:
    """Check if role grants the specified permission."""
    granted = get_role_permissions(role)
    return permission in granted
