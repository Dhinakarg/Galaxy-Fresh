/**
 * Galaxy Fresh — Role-Based Access Control Definitions
 *
 * Role Hierarchy (least → most privileged):
 *   Owner → Chef → Supervisor → Manager
 *
 * NOTE: Owner is intentionally "read-only insights" (exec dashboard view),
 * while Manager has full operational access.
 */

export const ROLES = {
  OWNER:      'owner',
  CHEF:       'chef',
  SUPERVISOR: 'supervisor',
  MANAGER:    'manager',
};

export const ROLE_LABELS = {
  owner:      'Owner',
  manager:    'Manager',
  supervisor: 'Supervisor',
  chef:       'Chef',
};

export const ROLE_COLORS = {
  owner:      'bg-purple-100 text-purple-800 border-purple-200',
  manager:    'bg-blue-100 text-blue-800 border-blue-200',
  supervisor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  chef:       'bg-orange-100 text-orange-800 border-orange-200',
};

export const ROLE_DESCRIPTIONS = {
  owner:      'Read-only executive view with full analytics access.',
  chef:       'Can view inventory and log daily usage.',
  supervisor: 'Can log usage, add, and edit inventory items.',
  manager:    'Full operational access and administrative reports.',
};

/**
 * Permission matrix — maps each role to what actions it can perform.
 */
const PERMISSIONS = {
  owner: {
    canView:        true,
    canLog:         false,
    canAdd:         false,
    canEdit:        false,
    canDelete:      false,
    canRestock:     false,
    canManageUsers: false,
    canViewReports: true,
  },
  chef: {
    canView:        true,
    canLog:         true,
    canAdd:         false,
    canEdit:        false,
    canDelete:      false,
    canRestock:     false,
    canManageUsers: false,
    canViewReports: false,
  },
  supervisor: {
    canView:        true,
    canLog:         true,
    canAdd:         true,
    canEdit:        true,
    canDelete:      false,
    canRestock:     true,
    canManageUsers: false,
    canViewReports: false,
  },
  manager: {
    canView:        true,
    canLog:         true,
    canAdd:         true,
    canEdit:        true,
    canDelete:      true,
    canRestock:     true,
    canManageUsers: true,
    canViewReports: true,
  },
};

/**
 * Returns the permission set for a given role string.
 * Falls back to chef (least-privilege) for unknown/undefined roles.
 */
export const getPermissions = (role) => PERMISSIONS[role] ?? PERMISSIONS.chef;

/**
 * List of all assignable roles for dropdowns.
 */
export const ALL_ROLES = [
  ROLES.CHEF,
  ROLES.SUPERVISOR,
  ROLES.MANAGER,
  ROLES.OWNER,
];
