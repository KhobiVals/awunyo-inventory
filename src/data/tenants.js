// ── Multi-Tenant Registry ─────────────────────────────────────────────────────
// Each tenant is a separate store account. Only the Super Admin can create,
// edit or delete tenants. Each tenant has its own isolated data store.

export const INITIAL_TENANTS = [
  {
    id:        'ST001',
    name:      'Nexus Main Store',
    email:     'main@nexuspos.com',
    phone:     '0302 000 001',
    address:   'Accra Central, Ghana',
    currency:  'GH',
    taxRate:   10,
    logo:      null,
    receiptFooter: 'Thank you for shopping with us!',
    plan:      'pro',      // 'basic' | 'pro' | 'enterprise'
    active:    true,
    createdAt: '2024-01-01',
  },
  {
    id:        'ST002',
    name:      'Nexus Kumasi Branch',
    email:     'kumasi@nexuspos.com',
    phone:     '0322 000 002',
    address:   'Kumasi, Ashanti Region',
    currency:  'GH',
    taxRate:   10,
    logo:      null,
    receiptFooter: 'Thank you! Visit us again.',
    plan:      'basic',
    active:    true,
    createdAt: '2024-03-15',
  },
];

// ── Super Admin account (global — not tied to any tenant) ─────────────────────
export const SUPER_ADMIN = {
  id:           'SUPER001',
  name:         'System Administrator',
  email:        'superadmin@nexuspos.com',
  password:     'super123',
  role:         'superadmin',
  avatar:       'SA',
  staffId:      'SYS-001',
  photo:        null,
  signature:    '',
  canDeleteUsers: true,
  isSuperAdmin: true,
  allowedViews: ['dashboard','pos','inventory','sales','customers','suppliers','reports','settings','staff','tenants'],
};

// ── Per-tenant initial users ───────────────────────────────────────────────────
export const TENANT_USERS = {
  ST001: [
    {
      id:       'U001',
      storeId:  'ST001',
      name:     'Admin User',
      email:    'admin@nexuspos.com',
      password: 'admin123',
      role:     'admin',
      avatar:   'AU',
      staffId:  'EMP001',
      photo:    null,
      signature:'',
      canDeleteUsers: false,
      allowedViews: ['dashboard','pos','inventory','sales','customers','suppliers','reports','settings','staff'],
    },
    {
      id:       'U002',
      storeId:  'ST001',
      name:     'Sales Associate',
      email:    'sales@nexuspos.com',
      password: 'sales123',
      role:     'sales',
      avatar:   'SA',
      staffId:  'EMP002',
      photo:    null,
      signature:'',
      canDeleteUsers: false,
      allowedViews: ['pos','customers'],
    },
  ],
  ST002: [
    {
      id:       'U003',
      storeId:  'ST002',
      name:     'Kumasi Admin',
      email:    'kadmin@nexuspos.com',
      password: 'admin123',
      role:     'admin',
      avatar:   'KA',
      staffId:  'EMP003',
      photo:    null,
      signature:'',
      canDeleteUsers: false,
      allowedViews: ['dashboard','pos','inventory','sales','customers','suppliers','reports','settings','staff'],
    },
  ],
};
