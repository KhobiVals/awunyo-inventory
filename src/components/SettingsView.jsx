import React, { useState, useMemo, lazy, Suspense } from 'react';
import { ROLE_LABELS, PERMISSIONS } from '../constants';

// Lazy-load new tabs so missing files don't crash the whole app
const NotificationSettings = lazy(() => import('./NotificationSettings').catch(() => ({ default: () => <div className="p-4 text-gray-400 text-sm">NotificationSettings.jsx not found in components folder.</div> })));
const RolePermissionsView  = lazy(() => import('./RolePermissionsView').catch(() => ({ default: () => <div className="p-4 text-gray-400 text-sm">RolePermissionsView.jsx not found in components folder.</div> })));

const EyeIcon = ({ show }) => show
  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

function PwdField({ label, value, onChange, show, onToggle, placeholder }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <div className="relative">
        <input type={show?'text':'password'} value={value} onChange={onChange}
          placeholder={placeholder||''} className="inp pr-11" autoComplete="new-password"/>
        <button type="button" onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <EyeIcon show={show}/>
        </button>
      </div>
    </div>
  );
}

const ACTION_ICON = (action) => {
  if (action?.toLowerCase().includes('login') || action?.toLowerCase().includes('logout'))
    return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>;
  if (action?.toLowerCase().includes('sale'))
    return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/></svg>;
  if (action?.toLowerCase().includes('password'))
    return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
  return <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
};

const ACTION_COLOR = (action) => {
  const a = action?.toLowerCase() || '';
  if (a.includes('login'))    return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
  if (a.includes('logout'))   return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600';
  if (a.includes('sale'))     return 'bg-blue-50 dark:bg-blue-900/20 text-blue-600';
  if (a.includes('delete') || a.includes('refund')) return 'bg-red-50 dark:bg-red-900/20 text-red-500';
  if (a.includes('password')) return 'bg-violet-50 dark:bg-violet-900/20 text-violet-600';
  return 'bg-stone-100 dark:bg-gray-800 text-gray-500';
};

export default function SettingsView({
  dark, setDark, currentUser, isSuperAdmin, users, setUsers,
  storeSettings, setStoreSettings, notify,
  appearance, setAppearance, auditLog, addAudit,
  tenants, adminViewStore, onSwitchToStore,
}) {
  const [tab,          setTab]          = useState('store');
  const [store,        setStore]        = useState({...(storeSettings||{})});
  const [profile,      setProfile]      = useState({...(users?.find(u=>u.id===currentUser?.id)||currentUser||{})});
  const [pwdForm,      setPwdForm]      = useState({cur:'',nw:'',cf:''});
  const [pwdErr,       setPwdErr]       = useState('');
  const [showPwd,      setShowPwd]      = useState({cur:false,nw:false,cf:false});
  const [resetTarget,  setResetTarget]  = useState('');
  const [resetPwd,     setResetPwd]     = useState('');
  const [showResetPwd, setShowResetPwd] = useState(false);
  const [resetErr,     setResetErr]     = useState('');

  // Audit filters
  const [auditSearch,    setAuditSearch]    = useState('');
  const [auditDateFrom,  setAuditDateFrom]  = useState('');
  const [auditDateTo,    setAuditDateTo]    = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('all');

  const isAdmin  = isSuperAdmin || ['owner','admin','superadmin'].includes(currentUser?.role);
  const accent   = appearance?.accentColor || '#6b4c11';
  const otherUsers = (users||[]).filter(u=>u.id!==currentUser?.id);

  // Sync store form when storeSettings prop changes (superadmin switching stores)
  React.useEffect(() => { setStore({...(storeSettings||{})}); }, [storeSettings]);

  const saveStore = () => {
    setStoreSettings({...store});
    if (addAudit) addAudit('Store Settings Saved', store.name, 'settings');
    notify('Store settings saved.');
  };

  const changePwd = () => {
    setPwdErr('');
    const u = (users||[]).find(x=>x.id===currentUser?.id);
    if (!u) { setPwdErr('Account not found.'); return; }
    if (u.password !== pwdForm.cur) { setPwdErr('Current password is incorrect.'); return; }
    if (pwdForm.nw.length < 6) { setPwdErr('New password must be at least 6 characters.'); return; }
    if (pwdForm.nw !== pwdForm.cf) { setPwdErr('Passwords do not match.'); return; }
    if (setUsers) setUsers(p=>p.map(x=>x.id===currentUser.id?{...x,password:pwdForm.nw}:x));
    setPwdForm({cur:'',nw:'',cf:''});
    setShowPwd({cur:false,nw:false,cf:false});
    if (addAudit) addAudit('Password Changed', `${currentUser.name} updated own password`, 'security');
    notify('Password updated.');
  };

  const doAdminReset = () => {
    setResetErr('');
    if (!resetTarget) { setResetErr('Select a staff member.'); return; }
    if (resetPwd.length < 6) { setResetErr('Password must be at least 6 characters.'); return; }
    const u = (users||[]).find(x=>x.id===resetTarget);
    if (!window.confirm(`Reset password for "${u?.name}"?\n\nThey will need to use this new password to log in.`)) return;
    if (setUsers) setUsers(p=>p.map(x=>x.id===resetTarget?{...x,password:resetPwd}:x));
    if (addAudit) addAudit('Password Reset', `Admin reset password for ${u?.name}`, 'security');
    notify(`Password reset for ${u?.name}.`);
    setResetTarget(''); setResetPwd(''); setShowResetPwd(false); setResetErr('');
  };

  const saveProfile = () => {
    if (setUsers) setUsers(p=>p.map(u=>u.id===currentUser?.id?{...u,...profile}:u));
    if (addAudit) addAudit('Profile Updated', currentUser?.name, 'profile');
    notify('Profile saved.');
  };

  // Filtered audit log
  const filteredAudit = useMemo(() => {
    return (auditLog||[]).filter(entry => {
      const entryDate = entry.ts ? entry.ts.split('T')[0] : '';
      const matchSearch = !auditSearch ||
        entry.action?.toLowerCase().includes(auditSearch.toLowerCase()) ||
        entry.user?.toLowerCase().includes(auditSearch.toLowerCase()) ||
        entry.detail?.toLowerCase().includes(auditSearch.toLowerCase());
      const matchFrom = !auditDateFrom || entryDate >= auditDateFrom;
      const matchTo   = !auditDateTo   || entryDate <= auditDateTo;
      const matchAction = auditActionFilter === 'all' || entry.action?.toLowerCase().includes(auditActionFilter.toLowerCase());
      return matchSearch && matchFrom && matchTo && matchAction;
    });
  }, [auditLog, auditSearch, auditDateFrom, auditDateTo, auditActionFilter]);

  const exportAuditCSV = () => {
    const headers = ['Timestamp','User','Role','Action','Detail','Store'];
    const rows = filteredAudit.map(e => [
      new Date(e.ts).toLocaleString(),
      e.user, e.role, e.action, e.detail||'', e.store||''
    ]);
    const csv = [headers.join(','), ...rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const TABS_BASE = [
    ['store',      'Store Info'],
    ['appearance', 'Appearance'],
    ['profile',    'My Profile'],
    ['security',   'Security'],
    ['notifications', 'Notifications'],
    ['roles',      'Roles & Perms'],
    ['audit',      'Audit Log'],
  ];

  const FONTS   = ['Georgia','Inter','Roboto','Open Sans','Poppins','Lato'];
  const ACCENTS = ['#7c5cbf','#b8962e','#4f46e5','#059669','#dc2626','#0891b2','#374151','#92400e'];

  const ACTION_FILTERS = ['all','Login','Logout','Sale','Password','Settings','Inventory'];

  return (
    <div className="p-4 lg:p-6 max-w-3xl mx-auto">
      {/* Page header — traditional style */}
      <div className="mb-6 pb-4 border-b-2 border-stone-200 dark:border-gray-800">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{fontFamily:'Georgia, serif'}}>Settings</h1>
        <p className="text-gray-500 text-sm mt-1">System configuration and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 mb-6 border-b border-stone-200 dark:border-gray-800">
        {TABS_BASE.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`flex-shrink-0 px-4 py-2.5 font-semibold transition-all border-b-2 -mb-px ${tab===k?'border-current':'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
            style={{fontSize:'0.8125rem',...(tab===k?{color:accent,borderColor:accent}:{})}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── STORE INFO ── */}
      {tab==='store' && (
        <div className="space-y-5">
          {/* Super admin store switcher */}
          {isSuperAdmin && tenants && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="font-semibold text-amber-800 dark:text-amber-400 mb-2" style={{fontSize:'0.8125rem'}}>
                Platform Admin — Store Context
              </div>
              <select
                value={adminViewStore||''}
                onChange={e=>onSwitchToStore&&onSwitchToStore(e.target.value||null)}
                className="inp"
              >
                <option value="">— Select a store to configure —</option>
                {tenants.map(t=>(
                  <option key={t.id} value={t.id}>{t.name} {!t.active?'(disabled)':''}</option>
                ))}
              </select>
              {!adminViewStore && <p className="text-amber-600 text-xs mt-2">Select a store above to edit its settings.</p>}
            </div>
          )}

          {(!isSuperAdmin || adminViewStore) && (
            <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
              <h2 className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem',fontFamily:'Georgia, serif'}}>Store Information</h2>
              <div>
                <label className="lbl">Store Logo</label>
                <div className="flex items-center gap-4 mt-1">
                  <div className="w-16 h-16 rounded-xl bg-stone-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-200 dark:border-gray-700">
                    {store.logo?<img src={store.logo} alt="" className="w-full h-full object-contain p-1"/>:<span className="font-bold text-2xl text-stone-400">{(store.name||'S').charAt(0)}</span>}
                  </div>
                  <div className="space-y-2 flex-1">
                    <input type="file" accept="image/*" id="logo-up" className="hidden"
                      onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setStore(s=>({...s,logo:ev.target.result}));r.readAsDataURL(f);e.target.value='';}}/>
                    <label htmlFor="logo-up" className="btn-secondary w-full cursor-pointer text-center block" style={{fontSize:'0.8125rem'}}>Upload Logo</label>
                    {store.logo&&<button onClick={()=>setStore(s=>({...s,logo:null}))} className="btn-danger w-full" style={{fontSize:'0.8125rem'}}>Remove Logo</button>}
                  </div>
                </div>
              </div>
              {[['name','Business Name'],['phone','Phone Number'],['address','Address'],['receiptFooter','Receipt Footer Message']].map(([k,l])=>(
                <div key={k}><label className="lbl">{l}</label><input value={store[k]||''} onChange={e=>setStore(s=>({...s,[k]:e.target.value}))} className="inp"/></div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><label className="lbl">Currency Symbol</label><input value={store.currency||'GH'} onChange={e=>setStore(s=>({...s,currency:e.target.value}))} className="inp" placeholder="GH"/></div>
                <div><label className="lbl">Tax Rate (%)</label><input type="number" inputMode="decimal" value={store.taxRate||''} onChange={e=>setStore(s=>({...s,taxRate:parseFloat(e.target.value)||0}))} className="inp" placeholder="10"/></div>
              </div>
              <button onClick={saveStore} className="btn-primary w-full font-semibold" style={{background:accent}}>Save Store Settings</button>
            </div>
          )}
        </div>
      )}

      {/* ── APPEARANCE ── */}
      {tab==='appearance' && (
        <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-5 space-y-6">
          <h2 className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem',fontFamily:'Georgia, serif'}}>Theme &amp; Display</h2>

          {/* Dark mode */}
          <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-gray-800 rounded-xl">
            <div>
              <div className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>Dark Mode</div>
              <div className="text-gray-400 text-xs mt-0.5">Toggle between light and dark interface</div>
            </div>
            <button onClick={()=>setDark(!dark)} className="w-12 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200" style={{background:dark?accent:'#d1d5db'}}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${dark?'left-6':'left-0.5'}`}/>
            </button>
          </div>

          {/* Accent colour */}
          <div>
            <label className="lbl">Accent Colour</label>
            <div className="flex gap-2 flex-wrap mt-2">
              {ACCENTS.map(c=>(
                <button key={c} onClick={()=>setAppearance(a=>({...a,accentColor:c}))}
                  className="w-9 h-9 rounded-lg transition-all active:scale-90 border-2"
                  style={{background:c,borderColor:appearance?.accentColor===c?'#fff':c,outline:appearance?.accentColor===c?`2px solid ${c}`:'none',outlineOffset:'2px'}}>
                  {appearance?.accentColor===c&&<svg className="w-4 h-4 text-white mx-auto" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
                </button>
              ))}
              <input type="color" value={appearance?.accentColor||accent} onChange={e=>setAppearance(a=>({...a,accentColor:e.target.value}))} className="w-9 h-9 rounded-lg cursor-pointer p-0.5 border border-stone-200" title="Custom colour"/>
            </div>
          </div>

          {/* Font */}
          <div>
            <label className="lbl">Font Family</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {FONTS.map(f=>(
                <button key={f} onClick={()=>setAppearance(a=>({...a,fontFamily:f}))}
                  className="py-2.5 rounded-lg border-2 font-medium transition-all"
                  style={{fontSize:'0.75rem',fontFamily:f,borderColor:appearance?.fontFamily===f?accent:'#e5e7eb',background:appearance?.fontFamily===f?`${accent}12`:'',color:appearance?.fontFamily===f?accent:'#6b7280'}}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Text size */}
          <div>
            <label className="lbl">Text Size</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[['small','Small'],['normal','Normal'],['large','Large']].map(([k,l])=>(
                <button key={k} onClick={()=>setAppearance(a=>({...a,fontSize:k}))}
                  className="py-2.5 rounded-lg border-2 font-medium transition-all"
                  style={{fontSize:'0.8125rem',borderColor:appearance?.fontSize===k?accent:'#e5e7eb',background:appearance?.fontSize===k?`${accent}12`:'',color:appearance?.fontSize===k?accent:'#6b7280'}}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MY PROFILE ── */}
      {tab==='profile' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem',fontFamily:'Georgia, serif'}}>My Profile</h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 border border-stone-200 dark:border-gray-700">
                {profile.photo?<img src={profile.photo} alt="" className="w-full h-full object-cover"/>:<span className="font-bold text-2xl" style={{color:accent}}>{profile.avatar||'?'}</span>}
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <input type="file" accept="image/*" id="pp" className="hidden"
                  onChange={e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>setProfile(p=>({...p,photo:ev.target.result}));r.readAsDataURL(f);e.target.value='';}}/>
                <label htmlFor="pp" className="btn-secondary cursor-pointer text-center block" style={{fontSize:'0.8125rem'}}>Change Photo</label>
                {profile.photo&&<button onClick={()=>setProfile(p=>({...p,photo:null}))} className="btn-danger" style={{fontSize:'0.8125rem'}}>Remove</button>}
              </div>
            </div>
            {[['name','Full Name'],['staffId','Staff ID']].map(([k,l])=>(
              <div key={k}><label className="lbl">{l}</label><input value={profile[k]||''} onChange={e=>setProfile(p=>({...p,[k]:e.target.value}))} className="inp"/></div>
            ))}
            <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3 space-y-1.5 border border-stone-100 dark:border-gray-700" style={{fontSize:'0.75rem'}}>
              <div className="flex justify-between"><span className="text-gray-400">Email</span><span className="font-semibold text-gray-900 dark:text-white">{currentUser?.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Role</span><span className="font-semibold" style={{color:accent}}>{ROLE_LABELS[currentUser?.role]||currentUser?.role}</span></div>
            </div>
            <button onClick={saveProfile} className="btn-primary w-full" style={{background:accent}}>Save Profile</button>
          </div>
        </div>
      )}

      {/* ── SECURITY ── */}
      {tab==='security' && (
        <div className="space-y-5">
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
            <h2 className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem',fontFamily:'Georgia, serif'}}>Change My Password</h2>
            <PwdField label="Current Password *" value={pwdForm.cur}
              onChange={e=>setPwdForm(p=>({...p,cur:e.target.value}))}
              show={showPwd.cur} onToggle={()=>setShowPwd(p=>({...p,cur:!p.cur}))}/>
            <PwdField label="New Password (min 6 chars) *" value={pwdForm.nw}
              onChange={e=>setPwdForm(p=>({...p,nw:e.target.value}))}
              show={showPwd.nw} onToggle={()=>setShowPwd(p=>({...p,nw:!p.nw}))}
              placeholder="At least 6 characters"/>
            <PwdField label="Confirm New Password *" value={pwdForm.cf}
              onChange={e=>setPwdForm(p=>({...p,cf:e.target.value}))}
              show={showPwd.cf} onToggle={()=>setShowPwd(p=>({...p,cf:!p.cf}))}/>
            {pwdErr&&<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-500 font-medium text-sm">{pwdErr}</div>}
            <button onClick={changePwd} className="btn-primary w-full" style={{background:accent}}>Update My Password</button>
          </div>

          {isAdmin && otherUsers.length > 0 && (
            <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem',fontFamily:'Georgia, serif'}}>Reset Staff Password</h2>
                <p className="text-gray-400 text-xs mt-1">Set a new password for any staff member without their current password.</p>
              </div>
              <div>
                <label className="lbl">Staff Member *</label>
                <select value={resetTarget} onChange={e=>setResetTarget(e.target.value)} className="inp">
                  <option value="">Select staff member…</option>
                  {otherUsers.map(u=>(
                    <option key={u.id} value={u.id}>{u.name} — {ROLE_LABELS[u.role]||u.role}{u.staffId?` (${u.staffId})`:''}</option>
                  ))}
                </select>
              </div>
              <PwdField label="New Password *" value={resetPwd}
                onChange={e=>setResetPwd(e.target.value)}
                show={showResetPwd} onToggle={()=>setShowResetPwd(p=>!p)}
                placeholder="Min 6 characters"/>
              {resetErr&&<div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-500 font-medium text-sm">{resetErr}</div>}
              <button onClick={doAdminReset} className="w-full min-h-[44px] rounded-xl font-semibold text-white flex items-center justify-center gap-2" style={{background:'#dc2626'}}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Reset Staff Password
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {tab === 'notifications' && (
        <Suspense fallback={<div className="p-4 text-gray-400 text-sm">Loading…</div>}>
          <NotificationSettings notify={notify} appearance={appearance}/>
        </Suspense>
      )}

      {/* ── ROLES & PERMISSIONS ── */}
      {tab === 'roles' && (
        <Suspense fallback={<div className="p-4 text-gray-400 text-sm">Loading…</div>}>
          <RolePermissionsView users={users} setUsers={setUsers} notify={notify} appearance={appearance}/>
        </Suspense>
      )}

      {/* ── AUDIT LOG ── */}
      {tab==='audit' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4 space-y-3">
            <h2 className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem',fontFamily:'Georgia, serif'}}>Audit Log</h2>

            {/* Search */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input value={auditSearch} onChange={e=>setAuditSearch(e.target.value)} placeholder="Search user, action, detail…" className="inp pl-9"/>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lbl">From Date</label>
                <input type="date" value={auditDateFrom} onChange={e=>setAuditDateFrom(e.target.value)} className="inp"/>
              </div>
              <div>
                <label className="lbl">To Date</label>
                <input type="date" value={auditDateTo} onChange={e=>setAuditDateTo(e.target.value)} className="inp"/>
              </div>
            </div>

            {/* Action filter pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {ACTION_FILTERS.map(f=>(
                <button key={f} onClick={()=>setAuditActionFilter(f)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full font-semibold text-xs transition-all ${auditActionFilter===f?'text-white':'bg-stone-100 dark:bg-gray-800 text-gray-500'}`}
                  style={auditActionFilter===f?{background:accent}:{}}>
                  {f === 'all' ? 'All Actions' : f}
                </button>
              ))}
            </div>

            {/* Stats + export */}
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">{filteredAudit.length} entries{(auditLog||[]).length !== filteredAudit.length ? ` (filtered from ${(auditLog||[]).length})` : ''}</span>
              <div className="flex gap-2">
                {(auditDateFrom||auditDateTo||auditSearch||auditActionFilter!=='all') && (
                  <button onClick={()=>{setAuditSearch('');setAuditDateFrom('');setAuditDateTo('');setAuditActionFilter('all');}} className="text-xs text-red-500 hover:underline font-medium">Clear filters</button>
                )}
                <button onClick={exportAuditCSV} className="btn-secondary text-xs px-3 min-h-[34px]">Export CSV</button>
              </div>
            </div>
          </div>

          {/* Log entries */}
          {filteredAudit.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-10 text-center">
              <div className="text-4xl mb-3">📋</div>
              <div className="font-semibold text-gray-900 dark:text-white mb-1" style={{fontFamily:'Georgia, serif'}}>No entries found</div>
              <div className="text-gray-400 text-sm">Try adjusting your filters or date range.</div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-gray-800">
              {filteredAudit.slice(0, 200).map((entry, i) => (
                <div key={entry.id||i} className="flex items-start gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${ACTION_COLOR(entry.action)}`}>
                    {ACTION_ICON(entry.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.8125rem'}}>{entry.action}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-gray-800 text-gray-500">{entry.user}</span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{background:`${accent}15`,color:accent}}>{ROLE_LABELS[entry.role]||entry.role}</span>
                      {entry.store && <span className="text-xs text-gray-400 font-mono">{entry.store}</span>}
                    </div>
                    {entry.detail && <div className="text-gray-500 mt-0.5 truncate" style={{fontSize:'0.75rem'}}>{entry.detail}</div>}
                    <div className="text-gray-400 mt-0.5" style={{fontSize:'0.6875rem'}}>
                      {new Date(entry.ts).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
                      {' · '}
                      {new Date(entry.ts).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
              {filteredAudit.length > 200 && (
                <div className="px-4 py-3 text-center text-gray-400 text-xs">Showing 200 of {filteredAudit.length} — use date filters to narrow results.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
