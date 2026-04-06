import React, { useState } from 'react';
import { PERMISSIONS, ROLE_LABELS } from '../constants';

// All string permissions grouped by category
const PERM_GROUPS = [
  {
    label: 'Sales',
    color: '#059669',
    perms: [
      { id: 'sales.create',        label: 'Create Sales' },
      { id: 'sales.view',          label: 'View All Sales' },
      { id: 'sales.view_own',      label: 'View Own Sales Only' },
      { id: 'sales.refund',        label: 'Process Refunds' },
      { id: 'sales.discount',      label: 'Apply Discounts' },
      { id: 'sales.print_receipt', label: 'Print Receipts' },
      { id: 'sales.view_all',      label: "View All Stores' Sales" },
    ],
  },
  {
    label: 'Inventory',
    color: '#7c5cbf',
    perms: [
      { id: 'inventory.view',         label: 'View Inventory' },
      { id: 'inventory.view_limited', label: 'View Limited Inventory' },
      { id: 'inventory.add',          label: 'Add Products' },
      { id: 'inventory.update',       label: 'Edit Products' },
      { id: 'inventory.full_access',  label: 'Full Inventory Access' },
    ],
  },
  {
    label: 'Customers',
    color: '#0891b2',
    perms: [
      { id: 'customer.add',          label: 'Add Customers' },
      { id: 'customer.view',         label: 'View Customers' },
      { id: 'customer.manage',       label: 'Full Customer Management' },
      { id: 'customer.message_send', label: 'Send Customer Messages' },
      { id: 'messaging.send_all',    label: 'Broadcast to All Customers' },
    ],
  },
  {
    label: 'Reports',
    color: '#b8962e',
    perms: [
      { id: 'reports.view',        label: 'View Reports' },
      { id: 'reports.export',      label: 'Export Reports' },
      { id: 'reports.view_all',    label: 'View All Reports' },
      { id: 'reports.global_view', label: 'Global Platform Reports' },
    ],
  },
  {
    label: 'Staff & Users',
    color: '#dc2626',
    perms: [
      { id: 'staff.view',    label: 'View Staff' },
      { id: 'user.create',  label: 'Create Users' },
      { id: 'user.update',  label: 'Edit Users' },
      { id: 'user.delete',  label: 'Delete Users' },
      { id: 'role.assign',  label: 'Assign Roles' },
      { id: 'user.global_manage', label: 'Manage All Platform Users' },
    ],
  },
  {
    label: 'Business Settings',
    color: '#374151',
    perms: [
      { id: 'business.update', label: 'Edit Business Settings' },
      { id: 'branch.create',   label: 'Create Branches' },
      { id: 'branch.update',   label: 'Edit Branches' },
      { id: 'branch.delete',   label: 'Delete Branches' },
      { id: 'system.settings', label: 'Platform System Settings' },
    ],
  },
  {
    label: 'Navigation Modules',
    color: '#6b7280',
    perms: [
      { id: 'dashboard',  label: 'Dashboard' },
      { id: 'pos',        label: 'Point of Sale' },
      { id: 'inventory',  label: 'Inventory' },
      { id: 'sales',      label: 'Sales History' },
      { id: 'customers',  label: 'Customers' },
      { id: 'suppliers',  label: 'Suppliers' },
      { id: 'reports',    label: 'Reports' },
      { id: 'staff',      label: 'Staff Management' },
      { id: 'settings',   label: 'Settings' },
      { id: 'tenants',    label: 'Tenant Manager' },
    ],
  },
];

const BASE_ROLES = ['owner', 'manager', 'sales'];

export default function RolePermissionsView({ users, setUsers, notify, appearance }) {
  const accent = appearance?.accentColor || '#7c5cbf';
  const gold   = '#b8962e';

  // Load or init role permissions from localStorage
  const [rolePerms, setRolePerms] = useState(() => {
    try {
      const saved = localStorage.getItem('nx_role_perms');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default from PERMISSIONS in App.jsx
    return {
      owner:   [...(PERMISSIONS.owner   || [])],
      manager: [...(PERMISSIONS.manager || [])],
      sales:   [...(PERMISSIONS.sales   || [])],
    };
  });

  const [activeRole,  setActiveRole]  = useState('manager');
  const [saved,       setSaved]       = useState(true);
  const [searchPerms, setSearchPerms] = useState('');

  const permsForRole = rolePerms[activeRole] || [];

  const toggle = (permId) => {
    setRolePerms(p => {
      const cur = p[activeRole] || [];
      return {
        ...p,
        [activeRole]: cur.includes(permId) ? cur.filter(x => x !== permId) : [...cur, permId],
      };
    });
    setSaved(false);
  };

  const selectAll = (groupPerms) => {
    setRolePerms(p => {
      const cur  = new Set(p[activeRole] || []);
      groupPerms.forEach(x => cur.add(x.id));
      return { ...p, [activeRole]: [...cur] };
    });
    setSaved(false);
  };

  const clearAll = (groupPerms) => {
    setRolePerms(p => {
      const ids = new Set(groupPerms.map(x => x.id));
      return { ...p, [activeRole]: (p[activeRole] || []).filter(x => !ids.has(x)) };
    });
    setSaved(false);
  };

  const saveAll = () => {
    localStorage.setItem('nx_role_perms', JSON.stringify(rolePerms));

    // Apply to all existing users of each role
    if (setUsers) {
      setUsers(prev => prev.map(u => {
        if (BASE_ROLES.includes(u.role) && !u.customPermissions) {
          return { ...u, allowedViews: (rolePerms[u.role] || []).filter(p => !p.includes('.')) };
        }
        return u;
      }));
    }

    setSaved(true);
    notify('Role permissions saved and applied to all staff.');
  };

  const resetRole = (role) => {
    if (!window.confirm(`Reset "${ROLE_LABELS[role] || role}" to default permissions?\n\nThis cannot be undone.`)) return;
    setRolePerms(p => ({
      ...p,
      [role]: [...(PERMISSIONS[role] || [])],
    }));
    setSaved(false);
    notify(`${ROLE_LABELS[role] || role} reset to defaults.`);
  };

  const filteredGroups = searchPerms
    ? PERM_GROUPS.map(g => ({
        ...g,
        perms: g.perms.filter(p => p.label.toLowerCase().includes(searchPerms.toLowerCase()) || p.id.includes(searchPerms.toLowerCase())),
      })).filter(g => g.perms.length > 0)
    : PERM_GROUPS;

  const totalPerms = PERM_GROUPS.reduce((s, g) => s + g.perms.length, 0);
  const activeCount = permsForRole.length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="pb-4 border-b border-stone-200 dark:border-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Roles & Permissions</h2>
        <p className="text-gray-500 text-sm mt-1">Define what each role can access and do. Changes apply to all staff with that role.</p>
      </div>

      {/* Role tabs */}
      <div className="flex gap-2 flex-wrap">
        {BASE_ROLES.map(role => {
          const count = (rolePerms[role] || []).length;
          return (
            <button
              key={role}
              onClick={() => setActiveRole(role)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border-2 ${activeRole === role ? 'text-white border-transparent' : 'border-stone-200 dark:border-gray-700 text-gray-500 hover:border-current'}`}
              style={activeRole === role ? {background: accent} : {}}
            >
              {ROLE_LABELS[role] || role}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${activeRole === role ? 'bg-white/20 text-white' : 'bg-stone-100 dark:bg-gray-800 text-gray-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stats + actions bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 p-3 bg-stone-50 dark:bg-gray-800 rounded-xl">
        <div className="text-sm text-gray-500">
          <span className="font-bold" style={{color:accent}}>{activeCount}</span> of {totalPerms} permissions enabled for <span className="font-semibold">{ROLE_LABELS[activeRole] || activeRole}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => resetRole(activeRole)} className="text-xs px-3 py-1.5 rounded-lg border border-stone-200 dark:border-gray-700 text-gray-500 hover:bg-stone-100 dark:hover:bg-gray-700 font-medium transition-colors">
            Reset to Default
          </button>
          <button
            onClick={saveAll}
            className="text-xs px-4 py-1.5 rounded-lg font-semibold text-white transition-all"
            style={{background: saved ? '#9ca3af' : accent}}
          >
            {saved ? '✓ Saved' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={searchPerms} onChange={e=>setSearchPerms(e.target.value)} placeholder="Search permissions…" className="inp pl-9"/>
      </div>

      {/* Permission groups */}
      <div className="space-y-4">
        {filteredGroups.map(group => {
          const allOn  = group.perms.every(p => permsForRole.includes(p.id));
          const someOn = group.perms.some(p => permsForRole.includes(p.id));
          return (
            <div key={group.label} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden">
              {/* Group header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 dark:border-gray-800" style={{background:`${group.color}08`}}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{background:group.color}}/>
                  <span className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>{group.label}</span>
                  <span className="text-xs text-gray-400">
                    {group.perms.filter(p => permsForRole.includes(p.id)).length}/{group.perms.length}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {!allOn && (
                    <button onClick={() => selectAll(group.perms)} className="text-xs px-2.5 py-1 rounded-lg font-medium transition-colors" style={{background:`${group.color}15`,color:group.color}}>All</button>
                  )}
                  {someOn && (
                    <button onClick={() => clearAll(group.perms)} className="text-xs px-2.5 py-1 rounded-lg font-medium bg-stone-100 dark:bg-gray-700 text-gray-500 hover:bg-stone-200 dark:hover:bg-gray-600 transition-colors">None</button>
                  )}
                </div>
              </div>

              {/* Permissions grid */}
              <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.perms.map(perm => {
                  const on = permsForRole.includes(perm.id);
                  return (
                    <button
                      key={perm.id}
                      onClick={() => toggle(perm.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${on ? 'bg-opacity-10' : 'hover:bg-stone-50 dark:hover:bg-gray-800'}`}
                      style={on ? {background:`${group.color}10`} : {}}
                    >
                      <div
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${on ? 'border-transparent' : 'border-gray-300 dark:border-gray-600'}`}
                        style={on ? {background:group.color, borderColor:group.color} : {}}
                      >
                        {on && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-xs" style={{color: on ? group.color : '#6b7280'}}>{perm.label}</div>
                        <div className="text-gray-400 font-mono" style={{fontSize:'0.5625rem'}}>{perm.id}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Save button */}
      {!saved && (
        <div className="sticky bottom-4">
          <button onClick={saveAll} className="w-full min-h-[52px] rounded-xl font-bold text-white text-sm shadow-lg transition-all active:scale-[0.98]" style={{background:accent}}>
            Save Permissions for {ROLE_LABELS[activeRole] || activeRole}
          </button>
        </div>
      )}
    </div>
  );
}
