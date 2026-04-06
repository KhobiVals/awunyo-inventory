import React, { useState, useEffect } from 'react';

export const EMAILJS_SERVICE_ID  = 'YOUR_SERVICE_ID';
export const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
export const EMAILJS_PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';

const getDevice = () => {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua))           return 'iPhone';
  if (/iPad/.test(ua))             return 'iPad';
  if (/Android.*Mobile/.test(ua))  return 'Android Phone';
  if (/Android/.test(ua))          return 'Android Tablet';
  if (/Windows/.test(ua))          return 'Windows PC';
  if (/Macintosh/.test(ua))        return 'Mac';
  return 'Unknown Device';
};

const loadEmailJS = async () => {
  if (window.emailjs) return;
  await new Promise((res, rej) => {
    if (document.getElementById('emailjs-sdk')) { res(); return; }
    const s = document.createElement('script');
    s.id = 'emailjs-sdk';
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  window.emailjs.init(EMAILJS_PUBLIC_KEY);
};

const sendAlert = async (toEmail, params) => {
  if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') return;
  try {
    await loadEmailJS();
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, { to_email: toEmail, ...params });
  } catch (e) { console.warn('Email alert failed:', e?.text || e); }
};

export const sendLoginNotification = async (user, allUsers) => {
  if (EMAILJS_SERVICE_ID === 'YOUR_SERVICE_ID') return;
  let location = 'Unknown location';
  try {
    const r = await fetch('https://ipapi.co/json/');
    const d = await r.json();
    location = [d.city, d.region, d.country_name].filter(Boolean).join(', ');
  } catch {}
  const loginTime = new Date().toLocaleString('en-GB', { weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' });
  const device    = getDevice();
  const ROLE_LABEL = { superadmin:'Super Admin', owner:'Store Owner', manager:'Manager', sales:'Sales / Cashier' };
  const baseParams = { user_name:user.name, user_email:user.email||'', user_role:ROLE_LABEL[user.role]||user.role, login_time:loginTime, device, location };
  if (user.email) await sendAlert(user.email, { ...baseParams, notify_name: user.name });
  const admins = (allUsers||[]).filter(u => (u.role==='owner'||u.role==='admin'||u.role==='superadmin') && u.id!==user.id && u.email);
  for (const admin of admins) await sendAlert(admin.email, { ...baseParams, notify_name: admin.name });
};

const EyeIcon = ({ show }) => show
  ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
  : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

// ── Force-change password screen shown on first login ─────────────────────────
function ForceChangePassword({ user, accent, onComplete }) {
  const [newPwd,   setNewPwd]   = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [error,    setError]    = useState('');
  const [saving,   setSaving]   = useState(false);

  const strength = newPwd.length === 0 ? 0 : newPwd.length < 4 ? 1 : newPwd.length < 6 ? 2 : newPwd.length < 9 ? 3 : 4;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#dc2626', '#d97706', '#059669', '#059669'][strength];

  const handleSave = async () => {
    setError('');
    if (newPwd.length < 6)       { setError('Password must be at least 6 characters.'); return; }
    if (newPwd !== confirm)       { setError('Passwords do not match.'); return; }
    if (newPwd === user.password) { setError('New password must differ from your temporary password.'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    onComplete(newPwd);
  };

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl mb-4" style={{background:`${accent}20`}}>
            <svg className="w-8 h-8" style={{color:accent}} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Set Your Password</h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed px-2">
            Welcome, <strong>{user.name}</strong>. Your account was set up by an administrator.
            Please create a personal password to continue.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-800 shadow-sm p-5 space-y-4">
          {/* Show username */}
          <div className="p-3 bg-stone-50 dark:bg-gray-800 rounded-lg flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <div>
              <div className="text-xs text-gray-400">Your username</div>
              <div className="font-bold text-gray-900 dark:text-white text-sm">{user.username || user.staffId || user.email}</div>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="lbl">New Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showNew?'text':'password'} value={newPwd}
                onChange={e=>{setNewPwd(e.target.value);setError('');}}
                placeholder="Minimum 6 characters" className="inp pr-11" autoComplete="new-password" autoFocus/>
              <button type="button" onClick={()=>setShowNew(p=>!p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <EyeIcon show={showNew}/>
              </button>
            </div>
            {newPwd.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {[1,2,3,4].map(i=>(
                  <div key={i} className="h-1 flex-1 rounded-full transition-all" style={{background:strength>=i?strengthColor:'#e5e7eb'}}/>
                ))}
                <span className="text-xs font-medium ml-1" style={{color:strengthColor}}>{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="lbl">Confirm Password <span className="text-red-500">*</span></label>
            <div className="relative">
              <input type={showConf?'text':'password'} value={confirm}
                onChange={e=>{setConfirm(e.target.value);setError('');}}
                placeholder="Re-enter your new password" className="inp pr-11" autoComplete="new-password"
                onKeyDown={e=>e.key==='Enter'&&handleSave()}/>
              <button type="button" onClick={()=>setShowConf(p=>!p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <EyeIcon show={showConf}/>
              </button>
            </div>
            {confirm.length>0&&newPwd!==confirm&&<div className="text-xs text-red-500 mt-1">Passwords do not match</div>}
            {confirm.length>0&&newPwd===confirm&&newPwd.length>=6&&<div className="text-xs text-emerald-600 mt-1">✓ Passwords match</div>}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg text-red-600 text-xs font-medium">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button onClick={handleSave} disabled={saving||!newPwd||!confirm}
            className="w-full min-h-[48px] rounded-xl font-bold text-white text-sm disabled:opacity-60 transition-all"
            style={{background:accent}}>
            {saving?(
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"/>Saving…
              </span>
            ):'Set Password & Sign In'}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
          After saving, you will be signed out and redirected to login with your new password.
        </p>
      </div>
    </div>
  );
}

// ── Main Login screen ─────────────────────────────────────────────────────────
export default function LoginView({
  onLogin, dark, setDark, greeting, storeSettings, forcedOut, onDismissForcedOut,
  forceChangeUser, onForceChangeComplete,
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd,  setShowPwd]  = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [time,     setTime]     = useState(new Date());

  const accent = '#7c5cbf';
  const gold   = '#b8962e';

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Show forced password change screen
  if (forceChangeUser) {
    return <ForceChangePassword user={forceChangeUser} accent={accent} onComplete={onForceChangeComplete}/>;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const result = onLogin(username.trim(), password);
    setLoading(false);
    if (!result)              setError('Incorrect username or password. Please try again.');
    else if (result.disabled) setError('This store account has been disabled. Contact your administrator.');
    // mustChangePassword is handled by App.jsx — it sets forceChangeUser prop
  };

  const DEMOS = [
    { role:'Super Admin', username:'superadmin', pwd:'super123', color:'#7c5cbf' },
    { role:'Store Owner', username:'admin',      pwd:'admin123', color:gold },
    { role:'Sales',       username:'sales',      pwd:'sales123', color:'#059669' },
  ];

  return (
    <div className={`${dark?'dark':''} min-h-screen bg-stone-100 dark:bg-gray-950 flex items-center justify-center p-4`}>
      {/* Forced-out banner */}
      {forcedOut && (
        <div className="fixed top-4 left-4 right-4 z-20 bg-amber-600 text-white rounded-xl px-4 py-3 flex items-start gap-3 shadow-xl">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <div className="flex-1">
            <div className="font-bold text-sm">Signed out remotely</div>
            <div className="text-xs opacity-90 mt-0.5">Your account was signed in on another device.</div>
          </div>
          <button onClick={onDismissForcedOut} className="text-white/70 hover:text-white font-bold text-lg">✕</button>
        </div>
      )}

      {/* Dark toggle */}
      <button onClick={()=>setDark(!dark)}
        className="fixed top-4 right-4 w-10 h-10 rounded-lg bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 flex items-center justify-center text-gray-500 shadow-sm hover:bg-stone-50 transition-all z-10">
        {dark
          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        }
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl shadow-lg mb-4 overflow-hidden"
            style={{background:storeSettings?.logo?'#f9fafb':accent, boxShadow:`0 10px 30px -8px ${accent}40`}}>
            {storeSettings?.logo
              ? <img src={storeSettings.logo} alt="Logo" className="w-full h-full object-contain p-1"/>
              : <span className="text-white font-bold text-2xl" style={{fontFamily:'Georgia, serif'}}>A</span>
            }
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight" style={{fontFamily:'Georgia, serif'}}>
            {storeSettings?.name || 'Awunyo Inventory Suite'}
          </h1>
          <div className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Business Management Platform</div>
        </div>

        {/* Time card */}
        <div className="rounded-xl p-4 mb-5 text-white" style={{background:accent}}>
          <div className="text-2xl font-bold tabular-nums" style={{fontFamily:'Georgia, serif'}}>
            {time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
          </div>
          <div className="text-xs mt-0.5 opacity-80">
            {time.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </div>
          <div className="text-sm font-medium mt-2 opacity-90">{greeting}. Please sign in to continue.</div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-stone-200 dark:border-gray-800 shadow-sm p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="lbl">Username</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <input type="text" value={username} onChange={e=>{setUsername(e.target.value);setError('');}}
                  placeholder="Enter your username" required autoComplete="username" autoFocus
                  className={`inp pl-9 ${error?'ring-2 ring-red-500/40 border-red-400':''}`}/>
              </div>
            </div>
            <div>
              <label className="lbl">Password</label>
              <div className="relative">
                <input type={showPwd?'text':'password'} value={password} onChange={e=>{setPassword(e.target.value);setError('');}}
                  placeholder="Enter your password" required autoComplete="current-password"
                  className={`inp pr-11 ${error?'ring-2 ring-red-500/40 border-red-400':''}`}/>
                <button type="button" onClick={()=>setShowPwd(p=>!p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 rounded-lg transition-colors">
                  <EyeIcon show={showPwd}/>
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-xs font-medium">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full min-h-[48px] rounded-xl font-bold text-white text-sm disabled:opacity-70 hover:opacity-90 active:scale-[0.98] transition-all"
              style={{background:accent, boxShadow:`0 4px 14px -4px ${accent}60`}}>
              {loading?(
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"/>Signing in…
                </span>
              ):'Sign In'}
            </button>
          </form>

          <div className="mt-4">
            <button onClick={()=>setShowDemo(p=>!p)}
              className="w-full py-2.5 rounded-lg border border-stone-200 dark:border-gray-700 text-gray-500 text-xs font-medium hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {showDemo?'Hide':'View'} Demo Credentials
            </button>
            {showDemo && (
              <div className="mt-2 rounded-xl border border-stone-100 dark:border-gray-800 overflow-hidden">
                {DEMOS.map((d,i)=>(
                  <button key={d.role}
                    onClick={()=>{setUsername(d.username);setPassword(d.pwd);setError('');setShowDemo(false);}}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 dark:hover:bg-gray-800 transition-colors ${i>0?'border-t border-stone-100 dark:border-gray-800':''}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{background:d.color}}>
                      {d.role.slice(0,2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold" style={{color:d.color}}>{d.role}</div>
                      <div className="text-xs text-gray-400">@{d.username}</div>
                    </div>
                    <div className="text-xs text-gray-400 font-mono">{d.pwd}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          Awunyo Inventory Suite · All rights reserved
        </p>
      </div>
    </div>
  );
}
