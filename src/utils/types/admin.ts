export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  COMPANION_ADMIN = 'COMPANION_ADMIN',
  FINANCE_ADMIN = 'FINANCE_ADMIN',
}

export enum AdminPermission {
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_RESTAURANTS = 'MANAGE_RESTAURANTS',
  MANAGE_ORDERS = 'MANAGE_ORDERS',
  MANAGE_PROMOTIONS = 'MANAGE_PROMOTIONS',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_SUPPORT = 'MANAGE_SUPPORT',
  MANAGE_DRIVERS = 'MANAGE_DRIVERS',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_ADMINS = 'MANAGE_ADMINS',
}

export enum AdminStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export const RolePermissions: Record<AdminRole, AdminPermission[]> = {
  [AdminRole.SUPER_ADMIN]: Object.values(AdminPermission),
  [AdminRole.COMPANION_ADMIN]: [
    AdminPermission.MANAGE_RESTAURANTS,
    AdminPermission.MANAGE_DRIVERS,
    AdminPermission.MANAGE_SUPPORT,
    AdminPermission.VIEW_ANALYTICS,
  ],
  [AdminRole.FINANCE_ADMIN]: [
    AdminPermission.MANAGE_PAYMENTS,
    AdminPermission.MANAGE_PROMOTIONS,
    AdminPermission.VIEW_ANALYTICS,
  ],
};

let phucle = {};
phucle['first_name'] = 'teo';
