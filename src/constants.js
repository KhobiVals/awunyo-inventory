// src/constants.js
// Shared constants used by App.jsx and all components
// Keep here to avoid circular imports

export const APP_NAME = 'Awunyo Inventory Suite';

export const PERMISSIONS = {
  superadmin: [
    'tenant.create','tenant.update','tenant.delete','tenant.view_all',
    'subscription.manage','system.settings','user.global_manage',
    'audit.view_all','reports.global_view',
    'dashboard','tenants','pos','inventory','sales','customers',
    'suppliers','reports','settings','staff',
  ],
  owner: [
    'business.update','branch.create','branch.update','branch.delete',
    'user.create','user.update','user.delete','role.assign',
    'sales.view_all','sales.refund','sales.discount','inventory.full_access',
    'reports.view_all','reports.export','customer.manage','messaging.send_all',
    'dashboard','pos','inventory','sales','customers','suppliers','reports','settings','staff',
  ],
  manager: [
    'sales.view','sales.create','sales.print_receipt',
    'inventory.add','inventory.update','inventory.view',
    'reports.view','reports.export','customer.view','customer.message_send','staff.view',
    'dashboard','pos','inventory','sales','customers','suppliers','reports',
  ],
  sales: [
    'sales.create','sales.view_own','sales.print_receipt',
    'inventory.view_limited','customer.add',
    'dashboard','pos','customers',
  ],
};

export const ROLE_LABELS = {
  superadmin: 'Super Admin',
  owner:      'Store Owner',
  manager:    'Manager',
  admin:      'Manager',   // legacy alias
  sales:      'Sales / Cashier',
  staff:      'Staff',
};

export const ROLE_COLORS = {
  superadmin: '#7c5cbf',
  owner:      '#b8962e',
  manager:    '#7c5cbf',
  admin:      '#7c5cbf',
  sales:      '#059669',
  staff:      '#0891b2',
};

// Derive allowed nav views from role
export function getAllowedViews(role, customViews) {
  if (customViews && customViews.length) return customViews;
  const perms = PERMISSIONS[role] || PERMISSIONS.sales;
  return perms.filter(p => !p.includes('.'));
}
