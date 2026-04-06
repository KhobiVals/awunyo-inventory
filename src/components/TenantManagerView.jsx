import React, { useState } from 'react';
import { ROLE_LABELS, PERMISSIONS } from '../constants';

const ALL_VIEWS = [
  { id:'dashboard', label:'Dashboard' },
  { id:'pos',       label:'Point of Sale' },
  { id:'inventory', label:'Inventory' },
  { id:'sales',     label:'Sales History' },
  { id:'customers', label:'Customers' },
  { id:'suppliers', label:'Suppliers' },
  { id:'reports',   label:'Reports' },
  { id:'settings',  label:'Settings' },
  { id:'staff',     label:'Staff Management' },
];

const ROLE_VIEW_DEFAULTS = {
  owner:   ['dashboard','pos','inventory','sales','customers','suppliers','reports','settings','staff'],
  manager: ['dashboard','pos','inventory','sales','customers','suppliers','reports'],
  sales:   ['dashboard','pos','customers'],
};

const ROLE_COLOR = {
  owner:'#b8962e', manager:'#7c5cbf', sales:'#059669',
};
const ROLE_BG = {
  owner:'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
  manager:'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
  sales:'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400',
};

const EyeIcon = ({ show }) => show
  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

export default function TenantManagerView({
  tenants, setTenants, tenantUsers, setTenantUsers,
  notify, appearance, auditLog, onSwitchToStore, adminViewStore,
}) {
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editTenant,     setEditTenant]     = useState(null);
  const [storeForm,      setStoreForm]      = useState({});
  const [expandedStore,  setExpandedStore]  = useState(null);
  const [showUserModal,  setShowUserModal]  = useState(null); // storeId
  const [editUser,       setEditUser]       = useState(null); // existing user being edited
  const [userForm,       setUserForm]       = useState({});
  const [showPwd,        setShowPwd]        = useState(false);
  const [resetTarget,    setResetTarget]    = useState(null);
  const [resetPwd,       setResetPwd]       = useState('');
  const [showResetPwd,   setShowResetPwd]   = useState(false);
  const [searchStore,    setSearchStore]    = useState('');
  const [activeTab,      setActiveTab]      = useState('stores');
  const [userSearch,     setUserSearch]     = useState('');

  const accent = appearance?.accentColor || '#7c5cbf';
  const gold   = '#b8962e';

  /* ── Store CRUD ──────────────────────────────────────────────────────── */
  const openAddStore = () => {
    setEditTenant(null);
    setStoreForm({ name:'', email:'', phone:'', address:'', city:'', country:'Ghana', currency:'GH₵', taxRate:10, active:true, receiptFooter:'Thank you for your business!', logo:null, industry:'Retail' });
    setShowStoreModal(true);
  };
  const openEditStore = t => { setEditTenant(t); setStoreForm({...t}); setShowStoreModal(true); };

  const saveStore = () => {
    if (!storeForm.name || !storeForm.email) { notify('Store name and email are required.', 'error'); return; }
    if (editTenant) {
      setTenants(p => p.map(t => t.id === editTenant.id ? {...t, ...storeForm} : t));
      notify('Store updated.');
    } else {
      const id = `ST${String(tenants.length + 100).padStart(3, '0')}`;
      setTenants(p => [...p, {...storeForm, id, createdAt: new Date().toISOString().split('T')[0]}]);
      setTenantUsers(p => ({...p, [id]: []}));
      notify(`Store "${storeForm.name}" created.`);
    }
    setShowStoreModal(false);
  };

  const deleteStore = id => {
    const t = tenants.find(x => x.id === id);
    if (!window.confirm(`Delete store "${t?.name}"?\n\nThis removes all ${(tenantUsers[id]||[]).length} user(s) and all store data.\n\nThis CANNOT be undone.`)) return;
    setTenants(p => p.filter(x => x.id !== id));
    setTenantUsers(p => { const n = {...p}; delete n[id]; return n; });
    if (expandedStore === id) setExpandedStore(null);
    notify(`Store "${t?.name}" deleted.`);
  };

  const toggleActive = id => {
    const t = tenants.find(x => x.id === id);
    if (!t?.active || window.confirm(`Disable "${t?.name}"?\n\nAll users will be locked out until re-enabled.\n\nConfirm?`)) {
      setTenants(p => p.map(x => x.id === id ? {...x, active: !x.active} : x));
      notify(t?.active ? `${t?.name} disabled.` : `${t?.name} enabled.`);
    }
  };

  /* ── User CRUD ───────────────────────────────────────────────────────── */
  const blankUser = { name:'', email:'', phone:'', password:'', username:'', role:'sales', staffId:'', position:'', department:'', gender:'', dateOfBirth:'', address:'', emergencyContact:'', emergencyPhone:'', notes:'' };

  const openAddUser = storeId => {
    setEditUser(null);
    setShowUserModal(storeId);
    setUserForm({...blankUser, allowedViews: ROLE_VIEW_DEFAULTS['sales']});
    setShowPwd(false);
  };

  const openEditUser = (storeId, user) => {
    setEditUser(user);
    setShowUserModal(storeId);
    setUserForm({...blankUser, ...user, password: ''});
    setShowPwd(false);
  };

  const handleRoleChange = (role) => {
    setUserForm(p => ({...p, role, allowedViews: ROLE_VIEW_DEFAULTS[role] || ['dashboard','pos']}));
  };

  const toggleView = (viewId) => {
    setUserForm(p => {
      const cur = p.allowedViews || [];
      return {...p, allowedViews: cur.includes(viewId) ? cur.filter(v => v !== viewId) : [...cur, viewId]};
    });
  };

  const saveUser = storeId => {
    if (!userForm.name || !userForm.email) { notify('Full name and email are required.', 'error'); return; }
    if (!editUser && (!userForm.password || userForm.password.length < 6)) { notify('Password must be at least 6 characters.', 'error'); return; }
    const allUsers = Object.values(tenantUsers).flat();
    if (allUsers.some(u => u.email === userForm.email && u.id !== editUser?.id)) { notify('Email already in use by another user.', 'error'); return; }

    const userData = {
      storeId,
      name:             userForm.name,
      email:            userForm.email,
      username:         (userForm.username || userForm.staffId || userForm.email.split('@')[0]).toLowerCase().replace(/\s+/g,'.'),
      phone:            userForm.phone || '',
      role:             userForm.role,
      staffId:          userForm.staffId || '',
      position:         userForm.position || '',
      department:       userForm.department || '',
      gender:           userForm.gender || '',
      dateOfBirth:      userForm.dateOfBirth || '',
      address:          userForm.address || '',
      emergencyContact: userForm.emergencyContact || '',
      emergencyPhone:   userForm.emergencyPhone || '',
      notes:            userForm.notes || '',
      mustChangePassword: !editUser, // force password change on first login
      allowedViews:     userForm.allowedViews || ROLE_VIEW_DEFAULTS[userForm.role] || ['dashboard','pos'],
      avatar:           userForm.name.slice(0, 2).toUpperCase(),
      photo:            editUser?.photo || null,
      signature:        editUser?.signature || '',
      canDeleteUsers:   false,
    };

    if (editUser) {
      // Update existing user
      if (userForm.password && userForm.password.length >= 6) userData.password = userForm.password;
      else userData.password = editUser.password;
      setTenantUsers(p => ({...p, [storeId]: (p[storeId]||[]).map(u => u.id === editUser.id ? {...u, ...userData} : u)}));
      notify(`"${userForm.name}" updated.`);
    } else {
      const id = `U${String(allUsers.length + 10).padStart(3, '0')}`;
      setTenantUsers(p => ({...p, [storeId]: [...(p[storeId]||[]), {...userData, id, password: userForm.password}]}));
      notify(`"${userForm.name}" added to ${tenants.find(t => t.id === storeId)?.name}.`);
    }
    setShowUserModal(null); setEditUser(null); setShowPwd(false);
  };

  const deleteUser = (storeId, userId) => {
    const u = (tenantUsers[storeId]||[]).find(x => x.id === userId);
    if (!window.confirm(`Remove "${u?.name}"?\n\nThey will no longer be able to log in. Sales history is preserved.`)) return;
    setTenantUsers(p => ({...p, [storeId]: (p[storeId]||[]).filter(u => u.id !== userId)}));
    notify(`"${u?.name}" removed.`);
  };

  const openResetPwd = (storeId, userId, name) => {
    setResetTarget({storeId, userId, name});
    setResetPwd(''); setShowResetPwd(false);
  };

  const doResetPwd = () => {
    if (!resetPwd || resetPwd.length < 6) { notify('Password must be at least 6 characters.', 'error'); return; }
    if (!window.confirm(`Reset password for "${resetTarget?.name}"?\n\nThey will need to use the new password to log in.`)) return;
    setTenantUsers(p => ({...p, [resetTarget.storeId]: (p[resetTarget.storeId]||[]).map(u => u.id === resetTarget.userId ? {...u, password: resetPwd} : u)}));
    notify(`Password reset for "${resetTarget?.name}".`);
    setResetTarget(null); setResetPwd(''); setShowResetPwd(false);
  };

  const filtered   = tenants.filter(t => t.name.toLowerCase().includes(searchStore.toLowerCase()) || (t.email||'').toLowerCase().includes(searchStore.toLowerCase()));
  const totalUsers = Object.values(tenantUsers).flat().length;
  const allUsers   = Object.entries(tenantUsers).flatMap(([sid, users]) => users.map(u => ({...u, storeName: tenants.find(t => t.id === sid)?.name || sid})));
  const filteredUsers = allUsers.filter(u =>
    !userSearch ||
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.storeName.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  const TABS = [
    { id:'stores', label:`Stores (${tenants.length})` },
    { id:'users',  label:`All Users (${totalUsers})` },
    { id:'audit',  label:'Audit Log' },
  ];

  const INDUSTRIES = ['Retail','Food & Beverage','Healthcare','Fashion','Electronics','Grocery','Pharmacy','Hardware','Beauty & Wellness','Other'];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 pb-4 border-b-2 border-stone-200 dark:border-gray-800">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Platform Management</h1>
            <p className="text-gray-500 text-sm mt-1">{tenants.length} stores · {tenants.filter(t=>t.active).length} active · {totalUsers} users registered</p>
          </div>
          <button onClick={openAddStore} className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-[0.98]" style={{background: gold}}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New Store
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          [tenants.length, 'Total Stores', accent],
          [tenants.filter(t=>t.active).length, 'Active', '#059669'],
          [tenants.filter(t=>!t.active).length, 'Disabled', '#dc2626'],
          [totalUsers, 'Total Users', gold],
        ].map(([v, l, c]) => (
          <div key={l} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4 text-center">
            <div className="font-bold leading-none" style={{fontSize:'1.75rem', color:c}}>{v}</div>
            <div className="text-gray-400 font-medium mt-1" style={{fontSize:'0.6875rem',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-stone-200 dark:border-gray-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-shrink-0 px-4 py-2.5 font-semibold border-b-2 -mb-px transition-all ${activeTab===t.id?'border-current':'border-transparent text-gray-400 hover:text-gray-600'}`}
            style={{fontSize:'0.8125rem', ...(activeTab===t.id?{color:accent, borderColor:accent}:{})}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STORES TAB ── */}
      {activeTab === 'stores' && (
        <>
          <div className="relative mb-4">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={searchStore} onChange={e=>setSearchStore(e.target.value)} placeholder="Search stores…" className="inp pl-9"/>
          </div>

          <div className="space-y-4">
            {filtered.map(t => {
              const users    = tenantUsers[t.id] || [];
              const expanded = expandedStore === t.id;
              const isViewing = adminViewStore === t.id;
              return (
                <div key={t.id} className={`bg-white dark:bg-gray-900 border-2 rounded-xl overflow-hidden transition-all ${isViewing?'':'border-stone-200 dark:border-gray-800'} ${!t.active?'opacity-75':''}`}
                  style={isViewing?{borderColor:accent}:{}}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-200 dark:border-gray-700" style={{background:t.logo?'transparent':`${accent}15`}}>
                        {t.logo
                          ? <img src={t.logo} alt="" className="w-full h-full object-contain p-1"/>
                          : <span className="font-bold text-xl" style={{color:accent}}>{t.name.charAt(0)}</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem',fontFamily:'Georgia, serif'}}>{t.name}</span>
                          {isViewing && <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:`${accent}20`,color:accent}}>● Viewing</span>}
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.active?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700':'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                            {t.active ? 'Active' : 'Disabled'}
                          </span>
                          {t.industry && <span className="text-xs text-gray-400 font-medium">{t.industry}</span>}
                        </div>
                        <div className="text-gray-400 mt-0.5 text-xs">{t.email}{t.phone?` · ${t.phone}`:''}</div>
                        {t.address && <div className="text-gray-400 text-xs truncate">{t.address}{t.city?`, ${t.city}`:''}</div>}
                      </div>
                      {/* Actions */}
                      <div className="flex gap-1.5 flex-shrink-0 flex-wrap justify-end">
                        <button onClick={() => onSwitchToStore && onSwitchToStore(isViewing ? null : t.id)}
                          className="px-2.5 py-1.5 rounded-lg font-semibold border transition-all flex-shrink-0 text-xs"
                          style={isViewing
                            ? {borderColor:'#dc2626',background:'#fef2f2',color:'#dc2626'}
                            : {borderColor:accent,background:`${accent}10`,color:accent}
                          }>
                          {isViewing ? 'Exit View' : 'Enter Store'}
                        </button>
                        <button onClick={() => toggleActive(t.id)} className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all flex-shrink-0 text-xs ${t.active?'border-amber-200 bg-amber-50 text-amber-600':'border-emerald-200 bg-emerald-50 text-emerald-600'}`}>
                          {t.active ? 'Disable' : 'Enable'}
                        </button>
                        <button onClick={() => openEditStore(t)} className="btn-secondary min-h-[32px] px-2.5 text-xs">Edit</button>
                        <button onClick={() => deleteStore(t.id)} className="btn-danger min-h-[32px] px-2 text-xs">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-5 mt-3 flex-wrap">
                      {[['Currency', t.currency||'GH₵'], ['Tax Rate', `${t.taxRate||0}%`], ['Staff', users.length], ['Since', t.createdAt||'—']].map(([l, v]) => (
                        <div key={l}>
                          <div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>{v}</div>
                          <div className="text-gray-400 uppercase tracking-wider" style={{fontSize:'0.5rem'}}>{l}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Users section */}
                  <div className="border-t border-stone-100 dark:border-gray-800">
                    <button onClick={() => setExpandedStore(expanded ? null : t.id)}
                      className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-stone-50 dark:hover:bg-gray-800/50 transition-colors">
                      <span className="font-semibold text-gray-500 dark:text-gray-400 text-xs">{users.length} staff member{users.length !== 1 ? 's' : ''}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded?'rotate-180':''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>

                    {expanded && (
                      <div className="px-4 pb-4 border-t border-stone-50 dark:border-gray-800/50">
                        <div className="space-y-2 mt-3 mb-3">
                          {users.length === 0 && <div className="text-center py-6 text-gray-400 text-sm">No staff yet.</div>}
                          {users.map(u => (
                            <div key={u.id} className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-gray-800 rounded-xl">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-200 dark:border-gray-700" style={{background:`${ROLE_COLOR[u.role]||accent}15`}}>
                                {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover"/> : <span className="font-bold text-xs" style={{color:ROLE_COLOR[u.role]||accent}}>{u.avatar}</span>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name}</div>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${ROLE_BG[u.role]||'bg-gray-100 text-gray-500'}`}>
                                    {ROLE_LABELS[u.role] || u.role}
                                  </span>
                                  {u.position && <span className="text-xs text-gray-400">{u.position}</span>}
                                  {u.staffId && <span className="text-xs text-gray-400 font-mono">#{u.staffId}</span>}
                                </div>
                                <div className="text-gray-400 text-xs truncate">{u.email}{u.phone?` · ${u.phone}`:''}</div>
                              </div>
                              <div className="flex gap-1.5 flex-shrink-0">
                                <button onClick={() => openEditUser(t.id, u)} className="px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-gray-700 text-gray-500 hover:bg-stone-100 dark:hover:bg-gray-700 font-semibold transition-colors" style={{fontSize:'0.625rem'}}>Edit</button>
                                <button onClick={() => openResetPwd(t.id, u.id, u.name)} className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-800 font-semibold" style={{fontSize:'0.625rem'}}>Reset Pwd</button>
                                <button onClick={() => deleteUser(t.id, u.id)} className="btn-danger min-h-[28px] px-2" style={{fontSize:'0.625rem'}}>✕</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => openAddUser(t.id)}
                          className="w-full py-3 rounded-xl border-2 border-dashed text-gray-400 hover:text-purple-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          style={{'--tw-border-opacity':1}}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Add Staff Member
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No stores found.</div>}
          </div>
        </>
      )}

      {/* ── ALL USERS TAB ── */}
      {activeTab === 'users' && (
        <div className="space-y-3">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={userSearch} onChange={e=>setUserSearch(e.target.value)} placeholder="Search by name, email, role, store…" className="inp pl-9"/>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-gray-800">
            {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-400">No users found.</div>}
            {filteredUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-200 dark:border-gray-700" style={{background:`${ROLE_COLOR[u.role]||accent}15`}}>
                  {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover"/> : <span className="font-bold text-xs" style={{color:ROLE_COLOR[u.role]||accent}}>{u.avatar}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{u.name}</div>
                  <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                    <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${ROLE_BG[u.role]||'bg-gray-100 text-gray-500'}`}>{ROLE_LABELS[u.role]||u.role}</span>
                    <span className="text-xs text-gray-400 font-medium" style={{color:accent}}>{u.storeName}</span>
                    {u.position && <span className="text-xs text-gray-400">{u.position}</span>}
                  </div>
                  <div className="text-gray-400 text-xs truncate">{u.email}{u.phone?` · ${u.phone}`:''}</div>
                </div>
                <button onClick={() => openResetPwd(u.storeId, u.id, u.name)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 border border-amber-200 dark:border-amber-800 font-semibold flex-shrink-0 text-xs">
                  Reset Pwd
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── AUDIT TAB ── */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-gray-800">
          {(auditLog||[]).length === 0 && <div className="p-8 text-center text-gray-400">No audit entries yet.</div>}
          {(auditLog||[]).slice(0, 100).map((entry, i) => (
            <div key={entry.id||i} className="flex items-start gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-gray-800/50 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:`${accent}15`,color:accent}}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{entry.action}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-gray-800 text-gray-500">{entry.user}</span>
                  {entry.store && <span className="text-xs text-gray-400">{tenants.find(t=>t.id===entry.store)?.name||entry.store}</span>}
                </div>
                {entry.detail && <div className="text-gray-400 text-xs mt-0.5 truncate">{entry.detail}</div>}
                <div className="text-gray-400 text-xs mt-0.5">{new Date(entry.ts).toLocaleString('en-GB')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT STORE MODAL ── */}
      {showStoreModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[93vh] overflow-y-auto slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-stone-100 dark:border-gray-800">
              <div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem',fontFamily:'Georgia, serif'}}>{editTenant ? 'Edit Store' : 'Create New Store'}</div>
              <button onClick={() => setShowStoreModal(false)} className="btn-ghost w-8 h-8">✕</button>
            </div>
            <div className="px-5 pb-8 space-y-4 pt-4">
              {/* Logo */}
              <div>
                <label className="lbl">Store Logo</label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-stone-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0 overflow-hidden bg-stone-50 dark:bg-gray-800">
                    {storeForm.logo ? <img src={storeForm.logo} alt="" className="w-full h-full object-contain p-1"/> : <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>}
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    <input type="file" accept="image/*" id="slogo" className="hidden" onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setStoreForm(p=>({...p,logo:ev.target.result}));r.readAsDataURL(f);e.target.value='';}}/>
                    <label htmlFor="slogo" className="btn-secondary cursor-pointer text-center text-sm">Upload Logo</label>
                    {storeForm.logo && <button onClick={() => setStoreForm(p=>({...p,logo:null}))} className="btn-danger text-sm">Remove</button>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[['name','Business / Store Name *'],['email','Contact Email *'],['phone','Phone Number'],['address','Street Address']].map(([k,l]) => (
                  <div key={k}><label className="lbl">{l}</label><input value={storeForm[k]||''} onChange={e=>setStoreForm(p=>({...p,[k]:e.target.value}))} className="inp"/></div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="lbl">City</label><input value={storeForm.city||''} onChange={e=>setStoreForm(p=>({...p,city:e.target.value}))} className="inp"/></div>
                <div><label className="lbl">Country</label><input value={storeForm.country||'Ghana'} onChange={e=>setStoreForm(p=>({...p,country:e.target.value}))} className="inp"/></div>
              </div>

              <div>
                <label className="lbl">Industry</label>
                <select value={storeForm.industry||'Retail'} onChange={e=>setStoreForm(p=>({...p,industry:e.target.value}))} className="inp">
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="lbl">Receipt Footer Message</label>
                <input value={storeForm.receiptFooter||''} onChange={e=>setStoreForm(p=>({...p,receiptFooter:e.target.value}))} className="inp"/>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div><label className="lbl">Currency Symbol</label><input value={storeForm.currency||'GH₵'} onChange={e=>setStoreForm(p=>({...p,currency:e.target.value}))} className="inp" placeholder="GH₵"/></div>
                <div><label className="lbl">Tax Rate (%)</label><input type="number" inputMode="decimal" value={storeForm.taxRate||''} onChange={e=>setStoreForm(p=>({...p,taxRate:parseFloat(e.target.value)||0}))} className="inp" placeholder="10"/></div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-gray-800 rounded-xl">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">Account Active</div>
                  <div className="text-gray-400 text-xs">Inactive stores cannot log in</div>
                </div>
                <button onClick={()=>setStoreForm(p=>({...p,active:!p.active}))} className="w-12 h-6 rounded-full relative flex-shrink-0 transition-colors" style={{background:storeForm.active?accent:'#d1d5db'}}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${storeForm.active?'left-6':'left-0.5'}`}/>
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowStoreModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveStore} className="flex-1 min-h-[44px] rounded-xl font-semibold text-white" style={{background:accent}}>{editTenant ? 'Save Changes' : 'Create Store'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD/EDIT USER MODAL ── */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[95vh] overflow-y-auto slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-stone-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div>
                <div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem',fontFamily:'Georgia, serif'}}>{editUser ? 'Edit Staff Member' : 'Add Staff Member'}</div>
                <div className="text-gray-400 text-xs">{tenants.find(t=>t.id===showUserModal)?.name}</div>
              </div>
              <button onClick={() => { setShowUserModal(null); setEditUser(null); }} className="btn-ghost w-8 h-8">✕</button>
            </div>

            <div className="px-5 pb-8 space-y-5 pt-4">
              {/* Section: Role */}
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm" style={{fontFamily:'Georgia, serif'}}>Role & Access Level</div>
                <div className="grid grid-cols-3 gap-2">
                  {[['owner','Store Owner'],['manager','Manager'],['sales','Sales / Cashier']].map(([r, l]) => (
                    <button key={r} onClick={() => handleRoleChange(r)}
                      className="py-3 rounded-xl border-2 font-semibold text-center transition-all"
                      style={{fontSize:'0.6875rem',borderColor:userForm.role===r?ROLE_COLOR[r]||accent:'#e5e7eb',background:userForm.role===r?`${ROLE_COLOR[r]||accent}12`:'',color:userForm.role===r?ROLE_COLOR[r]||accent:'#6b7280'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section: Module permissions */}
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-2 text-sm" style={{fontFamily:'Georgia, serif'}}>Module Access / Permissions</div>
                <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3">
                  <div className="grid grid-cols-2 gap-2">
                    {ALL_VIEWS.map(v => {
                      const on = (userForm.allowedViews||[]).includes(v.id);
                      return (
                        <button key={v.id} onClick={() => toggleView(v.id)}
                          className="flex items-center gap-2 p-2 rounded-lg transition-all text-left"
                          style={{background:on?`${accent}12`:'transparent'}}>
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${on?'border-current':' border-gray-300 dark:border-gray-600'}`} style={on?{background:accent,borderColor:accent}:{}}>
                            {on && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
                          </div>
                          <span className="text-xs font-medium" style={{color:on?accent:'#6b7280'}}>{v.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Section: Personal info */}
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm" style={{fontFamily:'Georgia, serif'}}>Personal Information</div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2"><label className="lbl">Full Name *</label><input value={userForm.name||''} onChange={e=>setUserForm(p=>({...p,name:e.target.value}))} className="inp" placeholder="e.g. Ama Mensah"/></div>
                    <div className="col-span-2"><label className="lbl">Username * <span className="text-gray-400 font-normal">(used to log in)</span></label><input value={userForm.username||''} onChange={e=>setUserForm(p=>({...p,username:e.target.value.toLowerCase().replace(/\s+/g,'.')}))} className="inp font-mono" placeholder="e.g. ama.mensah"/>{!editUser&&<p className="text-xs text-gray-400 mt-1">Auto-generated from name if left blank. Staff log in with this username.</p>}</div>
                    <div><label className="lbl">Gender</label>
                      <select value={userForm.gender||''} onChange={e=>setUserForm(p=>({...p,gender:e.target.value}))} className="inp">
                        <option value="">Select…</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div><label className="lbl">Date of Birth</label><input type="date" value={userForm.dateOfBirth||''} onChange={e=>setUserForm(p=>({...p,dateOfBirth:e.target.value}))} className="inp"/></div>
                    <div><label className="lbl">Phone Number</label><input type="tel" value={userForm.phone||''} onChange={e=>setUserForm(p=>({...p,phone:e.target.value}))} className="inp" placeholder="+233 XX XXX XXXX"/></div>
                    <div><label className="lbl">Staff ID</label><input value={userForm.staffId||''} onChange={e=>setUserForm(p=>({...p,staffId:e.target.value}))} className="inp" placeholder="e.g. EMP001"/></div>
                  </div>
                  <div><label className="lbl">Residential Address</label><input value={userForm.address||''} onChange={e=>setUserForm(p=>({...p,address:e.target.value}))} className="inp" placeholder="Street, City"/></div>
                </div>
              </div>

              {/* Section: Work info */}
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm" style={{fontFamily:'Georgia, serif'}}>Work Information</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="lbl">Job Title / Position</label><input value={userForm.position||''} onChange={e=>setUserForm(p=>({...p,position:e.target.value}))} className="inp" placeholder="e.g. Cashier"/></div>
                  <div><label className="lbl">Department</label><input value={userForm.department||''} onChange={e=>setUserForm(p=>({...p,department:e.target.value}))} className="inp" placeholder="e.g. Sales"/></div>
                </div>
              </div>

              {/* Section: Emergency Contact */}
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm" style={{fontFamily:'Georgia, serif'}}>Emergency Contact</div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="lbl">Contact Name</label><input value={userForm.emergencyContact||''} onChange={e=>setUserForm(p=>({...p,emergencyContact:e.target.value}))} className="inp" placeholder="Full name"/></div>
                  <div><label className="lbl">Contact Phone</label><input type="tel" value={userForm.emergencyPhone||''} onChange={e=>setUserForm(p=>({...p,emergencyPhone:e.target.value}))} className="inp" placeholder="+233 XX XXX XXXX"/></div>
                </div>
              </div>

              {/* Section: Account credentials */}
              <div>
                <div className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm" style={{fontFamily:'Georgia, serif'}}>Login Credentials</div>
                <div className="space-y-3">
                  <div><label className="lbl">Email Address *</label><input type="email" value={userForm.email||''} onChange={e=>setUserForm(p=>({...p,email:e.target.value}))} className="inp" placeholder="name@store.com"/></div>
                  <div>
                    <label className="lbl">{editUser ? 'New Password (leave blank to keep current)' : 'Password * (min 6 chars)'}</label>
                    <div className="relative">
                      <input type={showPwd?'text':'password'} value={userForm.password||''} onChange={e=>setUserForm(p=>({...p,password:e.target.value}))} placeholder={editUser?'Leave blank to keep current':'Min 6 characters'} className="inp pr-11" autoComplete="new-password"/>
                      <button type="button" onClick={()=>setShowPwd(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"><EyeIcon show={showPwd}/></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="lbl">Notes (optional)</label>
                <input value={userForm.notes||''} onChange={e=>setUserForm(p=>({...p,notes:e.target.value}))} className="inp" placeholder="Any additional notes about this staff member"/>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowUserModal(null); setEditUser(null); }} className="btn-secondary flex-1">Cancel</button>
                <button onClick={() => saveUser(showUserModal)} className="flex-1 min-h-[44px] rounded-xl font-semibold text-white" style={{background:accent}}>
                  {editUser ? 'Save Changes' : 'Add Staff Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-2xl p-5 w-full max-w-sm space-y-4 fade-in">
            <div>
              <div className="font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Reset Password</div>
              <div className="text-gray-400 text-xs mt-0.5">Setting new password for <strong>{resetTarget.name}</strong></div>
            </div>
            <div>
              <label className="lbl">New Password * (min 6 chars)</label>
              <div className="relative">
                <input type={showResetPwd?'text':'password'} value={resetPwd} onChange={e=>setResetPwd(e.target.value)} placeholder="Min 6 characters" className="inp pr-11" autoComplete="new-password"/>
                <button type="button" onClick={()=>setShowResetPwd(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"><EyeIcon show={showResetPwd}/></button>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setResetTarget(null); setResetPwd(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={doResetPwd} className="flex-1 min-h-[44px] rounded-xl font-bold text-white flex items-center justify-center gap-2" style={{background:'#dc2626'}}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
