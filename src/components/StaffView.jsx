import React, { useState, useRef } from 'react';
import { ROLE_LABELS, PERMISSIONS } from '../constants';

const ALL_VIEWS = [
  { id:'dashboard', label:'Dashboard' }, { id:'pos',       label:'Point of Sale' },
  { id:'inventory', label:'Inventory' }, { id:'sales',     label:'Sales History' },
  { id:'customers', label:'Customers' }, { id:'suppliers', label:'Suppliers'     },
  { id:'reports',   label:'Reports'   }, { id:'settings',  label:'Settings'      },
  { id:'staff',     label:'Staff Mgmt'},
];

const ROLE_COLOR = { superadmin:'#7c5cbf', owner:'#b8962e', manager:'#7c5cbf', admin:'#7c5cbf', sales:'#059669', staff:'#0891b2' };
const ROLE_BG    = {
  superadmin:'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  owner:     'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  manager:   'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  admin:     'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  sales:     'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  staff:     'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300',
};

const ROLE_VIEW_DEFAULTS = {
  owner:   ['dashboard','pos','inventory','sales','customers','suppliers','reports','settings','staff'],
  manager: ['dashboard','pos','inventory','sales','customers','suppliers','reports'],
  sales:   ['dashboard','pos','customers'],
};

const EyeIcon = ({ show }) => show
  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

export default function StaffView({ users, setUsers, currentUser, notify, appearance, shifts, auditLog }) {
  const [activeTab,   setActiveTab]  = useState('staff');
  const [showModal,   setShowModal]  = useState(false);
  const [editUser,    setEditUser]   = useState(null);
  const [search,      setSearch]     = useState('');
  const [roleFilter,  setRoleFilter] = useState('all');
  const [viewMode,    setViewMode]   = useState('grid'); // 'grid' | 'list'
  const [form,        setForm]       = useState({ name:'', email:'', password:'', username:'', role:'sales', staffId:'', phone:'', position:'', department:'' });
  const [showPwd,     setShowPwd]    = useState(false);
  const [editPerms,   setEditPerms]  = useState(null); // userId being edited
  const [draftPerms,  setDraftPerms] = useState([]);
  const [resetFor,    setResetFor]   = useState(null);
  const [resetPwd,    setResetPwd]   = useState('');
  const [showRPwd,    setShowRPwd]   = useState(false);
  const photoRefs = useRef({});

  const accent = appearance?.accentColor || '#7c5cbf';
  const gold   = '#b8962e';

  const allRoles = ['owner', 'manager', 'sales'];
  const filtered = (users||[]).filter(u => {
    const ms = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.staffId||'').includes(search);
    const mr = roleFilter === 'all' || u.role === roleFilter;
    return ms && mr;
  });

  const openAdd = () => {
    setEditUser(null);
    setForm({ name:'', email:'', password:'', role:'sales', staffId:'', phone:'', position:'', department:'' });
    setShowPwd(false);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ ...u, password:'' });
    setShowPwd(false);
    setShowModal(true);
  };

  const handleRoleChange = (role) => {
    setForm(p => ({...p, role, allowedViews: ROLE_VIEW_DEFAULTS[role] || ['dashboard','pos']}));
  };

  const saveUser = () => {
    if (!form.name || !form.email) { notify('Name and email are required.', 'error'); return; }
    if (!editUser && (!form.password || form.password.length < 6)) { notify('Password must be at least 6 characters.', 'error'); return; }
    if ((users||[]).some(u => u.email === form.email && u.id !== editUser?.id)) { notify('Email already in use.', 'error'); return; }

    if (editUser) {
      const updates = { ...form };
      if (!updates.password) delete updates.password;
      else if (updates.password.length < 6) { notify('Password must be at least 6 characters.', 'error'); return; }
      setUsers(prev => prev.map(u => u.id === editUser.id ? {...u, ...updates, avatar: form.name.slice(0,2).toUpperCase()} : u));
      notify(`${form.name} updated.`);
    } else {
      const id = `U${String((users||[]).length + 10).padStart(3,'0')}`;
      const autoUsername = (form.username || form.name.toLowerCase().replace(/\s+/g,'.').replace(/[^a-z0-9.]/g,''));
      setUsers(prev => [...(prev||[]), {
        ...form, id,
        username: autoUsername,
        avatar: form.name.slice(0,2).toUpperCase(),
        photo: null, signature: '',
        allowedViews: form.allowedViews || ROLE_VIEW_DEFAULTS[form.role] || ['dashboard','pos'],
        canDeleteUsers: false,
        mustChangePassword: true, // force password change on first login
      }]);
      notify(`${form.name} added.`);
    }
    setShowModal(false);
  };

  const deleteUser = (id) => {
    if (id === currentUser?.id) { notify('Cannot delete your own account.', 'error'); return; }
    const u = (users||[]).find(x => x.id === id);
    if (!window.confirm(`Remove "${u?.name}" from staff?\n\nThey will no longer be able to log in.`)) return;
    setUsers(prev => (prev||[]).filter(u => u.id !== id));
    notify(`${u?.name} removed.`);
  };

  const startEditPerms = (u) => {
    setEditPerms(u.id);
    setDraftPerms([...(u.allowedViews || ROLE_VIEW_DEFAULTS[u.role] || [])]);
  };

  const savePerms = (userId) => {
    setUsers(prev => prev.map(u => u.id === userId ? {...u, allowedViews: draftPerms} : u));
    setEditPerms(null);
    notify('Permissions saved.');
  };

  const toggleDraftPerm = (viewId) => {
    setDraftPerms(p => p.includes(viewId) ? p.filter(x => x !== viewId) : [...p, viewId]);
  };

  const doResetPwd = () => {
    if (!resetPwd || resetPwd.length < 6) { notify('Min 6 characters.', 'error'); return; }
    const u = (users||[]).find(x => x.id === resetFor);
    if (!window.confirm(`Reset password for "${u?.name}"?`)) return;
    setUsers(prev => prev.map(x => x.id === resetFor ? {...x, password: resetPwd} : x));
    notify(`Password reset for ${u?.name}.`);
    setResetFor(null); setResetPwd(''); setShowRPwd(false);
  };

  const uploadPhoto = (e, uid) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 2*1024*1024) { notify('Max 2MB.','error'); return; }
    const r = new FileReader();
    r.onload = ev => { setUsers(prev => prev.map(u => u.id===uid ? {...u, photo:ev.target.result} : u)); notify('Photo updated.'); };
    r.readAsDataURL(f); e.target.value = '';
  };

  const TABS = [
    { id:'staff',  label:`Staff (${(users||[]).length})` },
    { id:'shifts', label:`Shifts (${(shifts||[]).length})` },
    { id:'audit',  label:'Activity Log' },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Photo upload refs — hidden */}
      {(users||[]).map(u => (
        <input key={u.id} ref={el => photoRefs.current[u.id] = el} type="file" accept="image/*" className="hidden" onChange={e => uploadPhoto(e, u.id)}/>
      ))}

      {/* Page header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b-2 border-stone-200 dark:border-gray-800 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Staff Management</h1>
          <p className="text-gray-500 text-sm mt-1">{(users||[]).length} staff members registered</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm" style={{background:accent}}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Staff Member
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-stone-200 dark:border-gray-800">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 font-semibold border-b-2 -mb-px transition-all text-sm ${activeTab===t.id?'border-current':'border-transparent text-gray-400 hover:text-gray-600'}`}
            style={activeTab===t.id?{color:accent,borderColor:accent}:{}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── STAFF TAB ── */}
      {activeTab === 'staff' && (
        <>
          {/* Search + filter */}
          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email or ID…" className="inp pl-9"/>
            </div>
            <div className="flex gap-2">
              {['all','owner','manager','sales'].map(r => (
                <button key={r} onClick={() => setRoleFilter(r)}
                  className={`px-3 py-2 rounded-lg font-semibold text-xs transition-all capitalize ${roleFilter===r?'text-white':'bg-stone-100 dark:bg-gray-800 text-gray-500'}`}
                  style={roleFilter===r?{background:accent}:{}}>
                  {r === 'all' ? 'All Roles' : ROLE_LABELS[r]||r}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">👥</div>
              <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1" style={{fontFamily:'Georgia, serif'}}>No staff found</div>
              <div className="text-sm">Try adjusting your search or <button onClick={openAdd} className="font-semibold underline" style={{color:accent}}>add a new member</button></div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(u => {
              const isEditingPerms = editPerms === u.id;
              const perms = isEditingPerms ? draftPerms : (u.allowedViews || ROLE_VIEW_DEFAULTS[u.role] || []);
              const userShifts = (shifts||[]).filter(s => s.userId === u.id);
              const shiftRev   = userShifts.reduce((s,x) => s+(x.revenue||0), 0);

              return (
                <div key={u.id} className={`bg-white dark:bg-gray-900 border-2 rounded-xl overflow-hidden transition-all ${isEditingPerms?'':'border-stone-200 dark:border-gray-800'}`}
                  style={isEditingPerms?{borderColor:accent}:{}}>

                  {/* User header */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0 cursor-pointer" onClick={() => photoRefs.current[u.id]?.click()}>
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center border-2 border-stone-200 dark:border-gray-700" style={{background:`${ROLE_COLOR[u.role]||accent}15`}}>
                          {u.photo
                            ? <img src={u.photo} alt="" className="w-full h-full object-cover"/>
                            : <span className="font-bold text-xl" style={{color:ROLE_COLOR[u.role]||accent}}>{u.avatar}</span>
                          }
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{background:accent}}>+</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-gray-900 dark:text-white text-sm truncate" style={{fontFamily:'Georgia, serif'}}>{u.name}</div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_BG[u.role]||'bg-gray-100 text-gray-500'}`}>
                          {ROLE_LABELS[u.role]||u.role}
                        </span>
                        <div className="text-gray-400 text-xs truncate mt-0.5">{u.email}</div>
                        {u.position && <div className="text-gray-400 text-xs">{u.position}{u.department?` · ${u.department}`:''}</div>}
                        {u.staffId && <div className="text-gray-400 font-mono text-xs">#{u.staffId}</div>}
                      </div>
                      {u.id !== currentUser?.id && !isEditingPerms && (
                        <div className="flex flex-col gap-1.5 flex-shrink-0">
                          <button onClick={() => openEdit(u)} className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-gray-700 text-gray-500 hover:bg-stone-100 dark:hover:bg-gray-800 font-semibold transition-colors">Edit</button>
                          <button onClick={() => deleteUser(u.id)} className="text-xs px-2 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 border border-red-200 dark:border-red-800 font-semibold transition-colors">✕</button>
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    {userShifts.length > 0 && (
                      <div className="flex gap-3 mt-3 pt-3 border-t border-stone-100 dark:border-gray-800">
                        <div className="text-center">
                          <div className="font-bold text-xs" style={{color:accent}}>{userShifts.length}</div>
                          <div className="text-gray-400" style={{fontSize:'0.5625rem'}}>Shifts</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-xs text-emerald-600">{(u.storeId?'GH':'')}₵{shiftRev.toFixed(0)}</div>
                          <div className="text-gray-400" style={{fontSize:'0.5625rem'}}>Revenue</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Permissions section */}
                  <div className="border-t border-stone-100 dark:border-gray-800">
                    <div className="flex items-center justify-between px-4 py-2.5">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Module Access</div>
                      <div className="flex gap-2">
                        {isEditingPerms ? (
                          <>
                            <button onClick={() => setEditPerms(null)} className="text-xs px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-gray-800 text-gray-500 font-medium">Cancel</button>
                            <button onClick={() => savePerms(u.id)} className="text-xs px-2.5 py-1 rounded-lg font-semibold text-white" style={{background:accent}}>Save</button>
                          </>
                        ) : (
                          u.id !== currentUser?.id && (
                            <button onClick={() => startEditPerms(u)} className="text-xs px-2.5 py-1 rounded-lg font-semibold" style={{background:`${accent}15`, color:accent}}>Edit</button>
                          )
                        )}
                      </div>
                    </div>
                    <div className="px-4 pb-4 grid grid-cols-3 gap-1.5">
                      {ALL_VIEWS.map(v => {
                        const on = perms.includes(v.id);
                        return (
                          <div key={v.id}
                            onClick={() => isEditingPerms && toggleDraftPerm(v.id)}
                            className={`flex items-center gap-1.5 p-1.5 rounded-lg transition-all ${isEditingPerms?'cursor-pointer':''} ${on&&isEditingPerms?'':''}`}
                            style={on&&isEditingPerms?{background:`${accent}10`}:{}}>
                            <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-all ${on?'border-transparent':'border-gray-300 dark:border-gray-600'}`}
                              style={on?{background:accent}:{}}>
                              {on && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
                            </div>
                            <span className="text-xs font-medium truncate" style={{color: on ? (isEditingPerms?accent:'#374151') : '#9ca3af', fontSize:'0.5625rem'}}>{v.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    {/* Reset pwd */}
                    {u.id !== currentUser?.id && !isEditingPerms && (
                      <div className="px-4 pb-3">
                        <button onClick={() => { setResetFor(u.id); setResetPwd(''); setShowRPwd(false); }}
                          className="w-full py-2 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-600 font-semibold hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors text-xs">
                          Reset Password
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── SHIFTS TAB ── */}
      {activeTab === 'shifts' && (
        <div className="space-y-3">
          {(!shifts || shifts.length === 0) && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">⏰</div>
              <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1" style={{fontFamily:'Georgia, serif'}}>No shift records yet</div>
              <div className="text-sm">Staff clock in from the Dashboard or Sidebar.</div>
            </div>
          )}
          {(shifts||[]).map(s => {
            const dur = s.clockOut ? Math.round((new Date(s.clockOut) - new Date(s.clockIn)) / 60000) : null;
            return (
              <div key={s.id} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0" style={{background:accent}}>
                      {s.userName?.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>{s.userName}</div>
                      <div className="text-gray-400 text-xs">
                        {new Date(s.clockIn).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})}
                        {' · '}{new Date(s.clockIn).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                        {s.clockOut ? ` → ${new Date(s.clockOut).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}` : ' (active)'}
                        {dur ? ` · ${Math.floor(dur/60)}h ${dur%60}m` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s.salesCount != null && (
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 text-sm">GH₵{(s.revenue||0).toFixed(0)}</div>
                        <div className="text-gray-400" style={{fontSize:'0.625rem'}}>{s.salesCount} sales</div>
                      </div>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.clockOut ? 'bg-stone-100 dark:bg-gray-800 text-gray-500' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>
                      {s.clockOut ? 'Ended' : '● Active'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── ACTIVITY LOG TAB ── */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-gray-800">
          {(auditLog||[]).length === 0 && <div className="p-10 text-center text-gray-400">No activity recorded yet.</div>}
          {(auditLog||[]).slice(0, 100).map((entry, i) => (
            <div key={entry.id||i} className="flex items-start gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{background:`${accent}15`, color:accent}}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">{entry.action}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-stone-100 dark:bg-gray-800 text-gray-500">{entry.user}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{background:`${accent}15`, color:accent}}>{ROLE_LABELS[entry.role]||entry.role}</span>
                </div>
                {entry.detail && <div className="text-gray-400 text-xs mt-0.5 truncate">{entry.detail}</div>}
                <div className="text-gray-400 text-xs mt-0.5">{new Date(entry.ts).toLocaleString('en-GB')}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-3 border-b border-stone-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <div className="font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>{editUser ? 'Edit Staff Member' : 'Add Staff Member'}</div>
              <button onClick={() => setShowModal(false)} className="btn-ghost w-8 h-8">✕</button>
            </div>
            <div className="px-5 pb-8 pt-4 space-y-4">
              {/* Role */}
              <div>
                <label className="lbl">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {allRoles.map(r => (
                    <button key={r} type="button" onClick={() => handleRoleChange(r)}
                      className="py-3 rounded-xl border-2 font-semibold text-center transition-all"
                      style={{fontSize:'0.75rem', borderColor:form.role===r?ROLE_COLOR[r]||accent:'#e5e7eb', background:form.role===r?`${ROLE_COLOR[r]||accent}12`:'', color:form.role===r?ROLE_COLOR[r]||accent:'#6b7280'}}>
                      {ROLE_LABELS[r]||r}
                    </button>
                  ))}
                </div>
              </div>
              {/* Fields */}
              <div><label className="lbl">Username * <span className="text-gray-400 font-normal text-xs">(used to log in)</span></label><input type="text" value={form.username||''} onChange={e=>setForm(p=>({...p,username:e.target.value.toLowerCase().replace(/\s+/g,'.')}))} placeholder="e.g. ama.mensah" className="inp font-mono"/>{!editUser&&<p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate from name.</p>}</div>
              {[['name','Full Name *','text'],['email','Email (optional)','email'],['phone','Phone Number','tel'],['staffId','Staff ID','text'],['position','Job Title','text'],['department','Department','text']].map(([k,l,t]) => (
                <div key={k}><label className="lbl">{l}</label><input type={t} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="inp"/></div>
              ))}
              {/* Password */}
              <div>
                <label className="lbl">{editUser ? 'New Password (leave blank to keep)' : 'Password * (min 6 chars)'}</label>
                <div className="relative">
                  <input type={showPwd?'text':'password'} value={form.password||''} onChange={e=>setForm(p=>({...p,password:e.target.value}))} placeholder={editUser?'Leave blank to keep current':'Min 6 characters'} className="inp pr-11" autoComplete="new-password"/>
                  <button type="button" onClick={()=>setShowPwd(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"><EyeIcon show={showPwd}/></button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveUser} className="flex-1 min-h-[44px] rounded-xl font-semibold text-white" style={{background:accent}}>
                  {editUser ? 'Save Changes' : 'Add Staff Member'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {resetFor && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-2xl p-5 w-full max-w-sm space-y-4">
            <div>
              <div className="font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Reset Password</div>
              <div className="text-gray-400 text-xs mt-0.5">For <strong>{(users||[]).find(u=>u.id===resetFor)?.name}</strong></div>
            </div>
            <div className="relative">
              <input type={showRPwd?'text':'password'} value={resetPwd} onChange={e=>setResetPwd(e.target.value)} placeholder="Min 6 characters" className="inp pr-11" autoComplete="new-password"/>
              <button type="button" onClick={()=>setShowRPwd(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"><EyeIcon show={showRPwd}/></button>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setResetFor(null); setResetPwd(''); }} className="btn-secondary flex-1">Cancel</button>
              <button onClick={doResetPwd} className="flex-1 min-h-[44px] rounded-xl font-bold text-white" style={{background:'#dc2626'}}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
