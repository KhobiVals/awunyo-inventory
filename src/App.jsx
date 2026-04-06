import React, { useState, useEffect, useCallback, useRef } from 'react';

import LoginView, { sendLoginNotification } from './components/LoginView';
import DashboardView     from './components/DashboardView';
import POSView           from './components/POSView';
import InventoryView     from './components/InventoryView';
import SalesView         from './components/SalesView';
import CustomersView     from './components/CustomersView';
import ReportsView       from './components/ReportsView';
import SettingsView      from './components/SettingsView';
import SuppliersView     from './components/SuppliersView';
import StaffView         from './components/StaffView';
import TenantManagerView from './components/TenantManagerView';
import BottomNav         from './components/BottomNav';
import Sidebar           from './components/Sidebar';
import Notification      from './components/Notification';

import { INITIAL_PRODUCTS }                      from './data/products';
import { INITIAL_CUSTOMERS }                     from './data/customers';
import { INITIAL_SALES }                         from './data/sales';
import { SUPPLIERS }                             from './data/constants';
import { INITIAL_TENANTS, SUPER_ADMIN, TENANT_USERS } from './data/tenants';
import { usePOS }                                from './hooks/usePOS';

// ── Offline queue — inline fallback (upgrade to OfflineDB.js later) ──────────
function useOfflineQueue(isOnline, setSales, notify) {
  const [pendingCount, setPendingCount] = React.useState(0);
  const [syncing]                       = React.useState(false);

  const queueSale = React.useCallback(async (sale) => {
    // Store in localStorage as fallback
    try {
      const q = JSON.parse(localStorage.getItem('nx_offline_q') || '[]');
      localStorage.setItem('nx_offline_q', JSON.stringify([...q, sale]));
      setPendingCount(p => p + 1);
    } catch {}
  }, []);

  const syncPending = React.useCallback(() => {
    try {
      const q = JSON.parse(localStorage.getItem('nx_offline_q') || '[]');
      if (!q.length) return;
      setSales(prev => {
        const ids = new Set(prev.map(s => s.id));
        return [...q.filter(s => !ids.has(s.id)), ...prev];
      });
      localStorage.setItem('nx_offline_q', '[]');
      setPendingCount(0);
      if (notify) notify(`${q.length} offline sale${q.length > 1 ? 's' : ''} synced.`);
    } catch {}
  }, [setSales, notify]);

  // Sync when coming online
  React.useEffect(() => { if (isOnline) syncPending(); }, [isOnline]); // eslint-disable-line

  // Load pending count on mount
  React.useEffect(() => {
    try {
      const q = JSON.parse(localStorage.getItem('nx_offline_q') || '[]');
      setPendingCount(q.length);
    } catch {}
  }, []);

  return { pendingCount, syncing, queueSale, syncPending };
}

// ── Notification service — no-op until services/ folder is set up ─────────────
const autoSendReceipt = async () => {};
const loadConfig      = () => ({});

import { APP_NAME, PERMISSIONS, ROLE_LABELS, getAllowedViews } from './constants';

// Set document title
if (typeof document !== 'undefined') document.title = APP_NAME;

// Re-export for any legacy imports (components should use ../constants directly)
export { APP_NAME, PERMISSIONS, ROLE_LABELS, getAllowedViews };

// ── localStorage ──────────────────────────────────────────────────────────────
const LS = {
  get:  (k, fb) => { try { const v = localStorage.getItem(k); return v !== null ? JSON.parse(v) : fb; } catch { return fb; } },
  set:  (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del:  (k)     => { try { localStorage.removeItem(k); } catch {} },
};
const sk  = (sid, k) => `nx_${sid}_${k}`;
const gsd = (sid, k, fb) => LS.get(sk(sid, k), fb);
const ssd = (sid, k, v)  => LS.set(sk(sid, k), v);

const IDLE_MS       = 10 * 60 * 1000;
const WARN_MS       = 9  * 60 * 1000;
const SESSION_TOKEN = Math.random().toString(36).slice(2) + Date.now().toString(36);

const VIEW_LABELS = {
  dashboard:'Dashboard', pos:'Point of Sale', inventory:'Inventory',
  sales:'Sales History', customers:'Customers', reports:'Reports',
  settings:'Settings', suppliers:'Suppliers', staff:'Staff Management',
  tenants:'Tenant Manager',
};

// ── New permission-based role system ─────────────────────────────────────────



export default function AwunyoInventory() {
  // ── Global state ──────────────────────────────────────────────────────────
  const [dark,         setDark]         = useState(() => LS.get('nx_dark', true));
  const [currentUser,  setCurrentUser]  = useState(() => LS.get('nx_user', null));
  const [tenants,      setTenants]      = useState(() => LS.get('nx_tenants', INITIAL_TENANTS));
  const [tenantUsers,  setTenantUsers]  = useState(() => LS.get('nx_tenant_users', TENANT_USERS));
  const [notification, setNotification] = useState(null);
  const [time,         setTime]         = useState(new Date());
  const [sidebarOpen,  setSidebarOpen]  = useState(() => LS.get('nx_sidebar', true));
  const [mobileMenu,   setMobileMenu]   = useState(false);
  const [idleWarn,     setIdleWarn]     = useState(false);
  const [forcedOut,    setForcedOut]    = useState(false);
  const [forceChangeUser, setForceChangeUser] = useState(null); // user that must change password
  const [view,         setViewRaw]      = useState('dashboard');
  const [isOnline,     setIsOnline]     = useState(navigator.onLine);
  const [auditLog,     setAuditLog]     = useState(() => LS.get('nx_audit', []));
  const [shifts,       setShifts]       = useState(() => LS.get('nx_shifts', []));
  const [activeShift,  setActiveShift]  = useState(() => {
    const u = LS.get('nx_user', null);
    return u ? LS.get(`nx_shift_${u.id}`, null) : null;
  });

  // ── Super admin store switcher ────────────────────────────────────────────
  // When superadmin selects a store to "impersonate"/browse
  const [adminViewStore, setAdminViewStore] = useState(() => LS.get('nx_admin_view_store', null));

  const idleRef = useRef(null);
  const warnRef = useRef(null);

  const isSuperAdmin   = currentUser?.isSuperAdmin === true;
  // The store context: superadmin can switch to any store
  const currentStoreId = isSuperAdmin
    ? (adminViewStore || null)
    : (currentUser?.storeId || null);

  // ── Per-store state ───────────────────────────────────────────────────────
  const [storeSettings,  setStoreSettingsRaw] = useState(() => {
    const sid = LS.get('nx_user', null)?.storeId;
    return sid ? gsd(sid, 'settings', defaultStoreSettings(INITIAL_TENANTS.find(t=>t.id===sid))) : {};
  });
  const [storeStaff,    setStoreStaffRaw]    = useState(() => {
    const u = LS.get('nx_user', null);
    if (!u || u.isSuperAdmin) return [];
    return gsd(u.storeId, 'staff', TENANT_USERS[u.storeId] || []);
  });
  const [suppliers,     setSuppliers]        = useState(() => {
    const sid = LS.get('nx_user', null)?.storeId;
    return sid ? gsd(sid, 'suppliers', SUPPLIERS) : SUPPLIERS;
  });
  const [customers,     setCustomers]        = useState(() => {
    const sid = LS.get('nx_user', null)?.storeId;
    return sid ? gsd(sid, 'customers', INITIAL_CUSTOMERS.filter(c=>c.storeId===sid)) : [];
  });
  const [appearance,    setAppearance]       = useState(() => LS.get('nx_appearance', {
    accentColor:'#7c5cbf', fontFamily:'Georgia', fontSize:'normal',
  }));
  const [heldSales,     setHeldSales]        = useState([]);
  const [promotions,    setPromotions]       = useState(() => LS.get('nx_promotions', []));
  const [categories,    setCategories]       = useState(() => LS.get('nx_categories', ['Beverages','Food','Household','Healthcare']));

  function defaultStoreSettings(tenant) {
    return {
      name: tenant?.name || 'Store', phone: tenant?.phone || '',
      address: tenant?.address || '', currency: tenant?.currency || 'GH',
      taxRate: tenant?.taxRate || 10, receiptFooter: tenant?.receiptFooter || 'Thank you!',
      logo: tenant?.logo || null,
    };
  }

  // ── Online/offline detection ──────────────────────────────────────────────
  useEffect(() => {
    const on  = () => { setIsOnline(true);  syncPending(); };
    const off = () => setIsOnline(false);
    window.addEventListener('online',  on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []); // eslint-disable-line

  // ── Clock ─────────────────────────────────────────────────────────────────
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  // ── Dark mode ─────────────────────────────────────────────────────────────
  useEffect(() => { document.documentElement.classList.toggle('dark', dark); }, [dark]);

  // ── Appearance CSS vars ───────────────────────────────────────────────────
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--accent', appearance.accentColor);
    r.style.fontFamily = `'${appearance.fontFamily}', 'Segoe UI', system-ui, sans-serif`;
    r.style.fontSize = { small:'13px', normal:'14px', large:'16px' }[appearance.fontSize] || '14px';
  }, [appearance]);

  // ── Viewport fix ──────────────────────────────────────────────────────────
  useEffect(() => {
    let m = document.querySelector('meta[name="viewport"]');
    if (!m) { m = document.createElement('meta'); m.name='viewport'; document.head.appendChild(m); }
    m.content = 'width=device-width,initial-scale=1.0,viewport-fit=cover';
  }, []);

  // ── Persist globals ───────────────────────────────────────────────────────
  useEffect(() => LS.set('nx_dark',            dark),          [dark]);
  useEffect(() => LS.set('nx_sidebar',         sidebarOpen),   [sidebarOpen]);
  useEffect(() => LS.set('nx_user',            currentUser),   [currentUser]);
  useEffect(() => LS.set('nx_tenants',         tenants),       [tenants]);
  useEffect(() => LS.set('nx_tenant_users',    tenantUsers),   [tenantUsers]);
  useEffect(() => LS.set('nx_appearance',      appearance),    [appearance]);
  useEffect(() => LS.set('nx_promotions',      promotions),    [promotions]);
  useEffect(() => LS.set('nx_categories',      categories),    [categories]);
  useEffect(() => LS.set('nx_audit',           auditLog),      [auditLog]);
  useEffect(() => LS.set('nx_shifts',          shifts),        [shifts]);
  useEffect(() => {
    if (currentUser) LS.set(`nx_shift_${currentUser.id}`, activeShift);
  }, [activeShift, currentUser?.id]); // eslint-disable-line
  // nx_offline_q is now managed by OfflineDB (IndexedDB) — no localStorage persist needed
  useEffect(() => LS.set('nx_admin_view_store',adminViewStore),[adminViewStore]);

  // ── Persist per-store ─────────────────────────────────────────────────────
  useEffect(() => { if (currentStoreId && !isSuperAdmin) ssd(currentStoreId,'settings', storeSettings); }, [storeSettings, currentStoreId]); // eslint-disable-line
  useEffect(() => { if (currentStoreId && !isSuperAdmin) ssd(currentStoreId,'staff',    storeStaff);    }, [storeStaff,    currentStoreId]); // eslint-disable-line
  useEffect(() => { if (currentStoreId && !isSuperAdmin) ssd(currentStoreId,'suppliers',suppliers);     }, [suppliers,     currentStoreId]); // eslint-disable-line
  useEffect(() => { if (currentStoreId && !isSuperAdmin) ssd(currentStoreId,'customers',customers);     }, [customers,     currentStoreId]); // eslint-disable-line

  // ── POS hook ──────────────────────────────────────────────────────────────
  const storeIdForData = isSuperAdmin ? adminViewStore : currentStoreId;
  const initProducts = storeIdForData ? gsd(storeIdForData,'products', INITIAL_PRODUCTS.filter(p=>p.storeId===storeIdForData)) : [];
  const initSales    = storeIdForData ? gsd(storeIdForData,'sales',    INITIAL_SALES.filter(s=>s.storeId===storeIdForData))    : [];

  const { products, setProducts, sales, setSales, cart, addToCart, removeFromCart, updateCartQty, clearCart } =
    usePOS(initProducts, initSales);

  useEffect(() => { if (storeIdForData) ssd(storeIdForData,'products', products); }, [products, storeIdForData]); // eslint-disable-line
  useEffect(() => { if (storeIdForData) ssd(storeIdForData,'sales',    sales);    }, [sales,    storeIdForData]); // eslint-disable-line

  // ── Super admin store switcher ────────────────────────────────────────────
  const switchToStore = useCallback((storeId) => {
    setAdminViewStore(storeId);
    if (storeId) {
      const tenant = tenants.find(t=>t.id===storeId)||{};
      setStoreSettingsRaw(gsd(storeId,'settings', defaultStoreSettings(tenant)));
      setStoreStaffRaw(gsd(storeId,'staff', TENANT_USERS[storeId]||[]));
      setSuppliers(gsd(storeId,'suppliers', SUPPLIERS));
      setCustomers(gsd(storeId,'customers', INITIAL_CUSTOMERS.filter(c=>c.storeId===storeId)));
    }
    setViewRaw('dashboard');
  }, [tenants]); // eslint-disable-line

  const notify = useCallback((msg, type='success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  }, []);

  // OfflineDB hook — after notify and setSales are both defined
  const { pendingCount: offlineCount, queueSale: dbQueueSale, syncPending } = useOfflineQueue(isOnline, setSales, notify);

  const addAudit = useCallback((action, detail='', entity='') => {
    const entry = {
      id: Date.now(),
      ts: new Date().toISOString(),
      user: currentUser?.name || '?',
      userId: currentUser?.id || '?',
      role: currentUser?.role || '?',
      store: currentStoreId,
      action, detail, entity,
    };
    setAuditLog(prev => [entry, ...prev].slice(0, 500));
  }, [currentUser, currentStoreId]);

  const today    = time.toISOString().split('T')[0];
  const greeting = () => { const h=time.getHours(); return h<12?'Good morning':h<17?'Good afternoon':'Good evening'; };

  // ── Load store data on login ──────────────────────────────────────────────
  const loadStoreData = useCallback((user) => {
    if (!user || user.isSuperAdmin) return;
    const sid    = user.storeId;
    const tenant = INITIAL_TENANTS.find(t=>t.id===sid)||{};
    setStoreSettingsRaw(gsd(sid,'settings', defaultStoreSettings(tenant)));
    setStoreStaffRaw(gsd(sid,'staff', TENANT_USERS[sid]||[]));
    setSuppliers(gsd(sid,'suppliers', SUPPLIERS));
    setCustomers(gsd(sid,'customers', INITIAL_CUSTOMERS.filter(c=>c.storeId===sid)));
  }, []); // eslint-disable-line

  // ── Single-device enforcement ─────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    LS.set(`nx_session_${currentUser.id}`, SESSION_TOKEN);
    const check = setInterval(() => {
      const stored = LS.get(`nx_session_${currentUser.id}`, null);
      if (stored && stored !== SESSION_TOKEN) {
        clearInterval(check);
        setCurrentUser(null); setViewRaw('dashboard'); clearCart(); setForcedOut(true);
      }
    }, 5000);
    return () => clearInterval(check);
  }, [currentUser?.id]); // eslint-disable-line

  // ── Idle logout ───────────────────────────────────────────────────────────
  const doLogout = useCallback(() => {
    setCurrentUser(null); setViewRaw('dashboard'); clearCart(); setIdleWarn(false);
    LS.del('nx_user');
  }, [clearCart]);

  const resetIdle = useCallback(() => {
    if (!currentUser) return;
    setIdleWarn(false);
    clearTimeout(idleRef.current); clearTimeout(warnRef.current);
    warnRef.current = setTimeout(() => setIdleWarn(true), WARN_MS);
    idleRef.current = setTimeout(doLogout, IDLE_MS);
  }, [currentUser, doLogout]);

  useEffect(() => {
    if (!currentUser) { clearTimeout(idleRef.current); clearTimeout(warnRef.current); return; }
    const evts = ['mousemove','mousedown','keydown','touchstart','scroll','click'];
    evts.forEach(e => window.addEventListener(e, resetIdle, { passive:true }));
    resetIdle();
    return () => { evts.forEach(e => window.removeEventListener(e, resetIdle)); clearTimeout(idleRef.current); clearTimeout(warnRef.current); };
  }, [currentUser, resetIdle]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = useCallback((usernameInput, password) => {
    const uname = usernameInput.trim().toLowerCase();

    // Super admin — can login with username 'superadmin' or email
    if ((uname === 'superadmin' || uname === SUPER_ADMIN.email || uname === SUPER_ADMIN.username) && password === SUPER_ADMIN.password) {
      setCurrentUser(SUPER_ADMIN);
      setViewRaw('dashboard');
      LS.set(`nx_session_${SUPER_ADMIN.id}`, SESSION_TOKEN);
      return SUPER_ADMIN;
    }

    // Match tenant users by username, staffId, or email (in that priority)
    const allUsers = Object.entries(tenantUsers).flatMap(([sid, users]) => users.map(u => ({ ...u, storeId: sid })));
    const user = allUsers.find(u => {
      const matchUsername = u.username && u.username.toLowerCase() === uname;
      const matchStaffId  = u.staffId  && u.staffId.toLowerCase()  === uname;
      const matchEmail    = u.email    && u.email.toLowerCase()     === uname;
      return (matchUsername || matchStaffId || matchEmail) && u.password === password;
    });

    if (!user) return false;
    const tenant = tenants.find(t => t.id === user.storeId);
    if (!tenant)        return false;
    if (!tenant.active) return { disabled: true };

    // First-time login — force password change
    if (user.mustChangePassword) {
      setForceChangeUser({ ...user });
      return { mustChangePassword: true };
    }

    setCurrentUser(user);
    setForcedOut(false);
    setForceChangeUser(null);
    LS.set(`nx_session_${user.id}`, SESSION_TOKEN);
    loadStoreData(user);
    const firstView = getAllowedViews(user.role, user.allowedViews)[0] || 'dashboard';
    setViewRaw(firstView === 'tenants' ? 'dashboard' : firstView);
    addAudit('Login', `${user.name} signed in`, 'auth');
    const storeAdmins = (tenantUsers[user.storeId]||[]).filter(u2 => (u2.role==='admin'||u2.role==='owner') && u2.id!==user.id);
    sendLoginNotification(user, storeAdmins).catch(()=>{});
    return user;
  }, [tenants, tenantUsers, loadStoreData, addAudit]);

  // Handle forced password change completion — update user record, log out, redirect to login
  const handleForceChangeComplete = useCallback((newPassword) => {
    const user = forceChangeUser;
    if (!user) return;
    // Update the password and clear the mustChangePassword flag
    setTenantUsers(prev => {
      const updated = { ...prev };
      if (updated[user.storeId]) {
        updated[user.storeId] = updated[user.storeId].map(u =>
          u.id === user.id ? { ...u, password: newPassword, mustChangePassword: false } : u
        );
      }
      return updated;
    });
    setForceChangeUser(null);
    // Don't log them in — force them to login fresh with new password
    notify('Password set successfully! Please sign in with your new password.', 'success');
    addAudit('Password Changed', `${user.name} set password on first login`, 'security');
  }, [forceChangeUser, addAudit, notify]);

  const handleLogout = useCallback(() => {
    addAudit('Logout', `${currentUser?.name} signed out`, 'auth');
    if (currentUser) LS.del(`nx_session_${currentUser.id}`);
    setCurrentUser(null); setViewRaw('dashboard'); clearCart(); setIdleWarn(false);
    setAdminViewStore(null);
  }, [currentUser, clearCart, addAudit]);

  // ── Role-safe setView ─────────────────────────────────────────────────────
  const setView = useCallback((v) => {
    if (!currentUser) return;
    if (isSuperAdmin) { setViewRaw(v); setMobileMenu(false); return; }
    const lu = (tenantUsers[currentUser.storeId]||[]).find(u=>u.id===currentUser.id) || currentUser;
    const allowed = getAllowedViews(lu.role, lu.allowedViews);
    if (allowed.includes(v) || v==='staff') { setViewRaw(v); setMobileMenu(false); }
    else notify('You do not have access to that section.', 'error');
  }, [currentUser, isSuperAdmin, tenantUsers, notify]);

  // ── Shift / Clock management ─────────────────────────────────────────────
  const clockIn = useCallback(() => {
    if (activeShift) { notify('Already clocked in.', 'error'); return; }
    const shift = {
      id: `SH${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      storeId: currentStoreId,
      clockIn: new Date().toISOString(),
      clockOut: null,
    };
    setActiveShift(shift);
    setShifts(prev => [shift, ...prev]);
    addAudit('Clock In', `${currentUser.name} started shift`, 'shift');
    notify('Shift started. Good luck!');
  }, [activeShift, currentUser, currentStoreId, addAudit, notify]);

  const clockOut = useCallback((skipEndOfDayGate = false) => {
    if (!activeShift) { notify('No active shift.', 'error'); return; }
    const shiftSales = sales.filter(s => s.shiftId === activeShift.id);
    const shiftRev   = shiftSales.reduce((s, x) => s + x.total, 0);
    const dur        = Math.round((Date.now() - new Date(activeShift.clockIn).getTime()) / 60000);
    const hrs        = `${Math.floor(dur/60)}h ${dur%60}m`;

    // Sales/Cashier roles must complete end-of-day before clocking out
    if (!skipEndOfDayGate && ['sales','staff'].includes(currentUser?.role)) {
      const confirmed = window.confirm(
        `Before clocking out, you must complete your End-of-Day summary.\n\n` +
        `Shift summary:\n` +
        `• Duration: ${hrs}\n` +
        `• Sales: ${shiftSales.length}\n` +
        `• Revenue: ${storeSettings.currency||'GH'}${shiftRev.toFixed(2)}\n\n` +
        `Press OK to go to Sales → End-of-Day Close, then come back to clock out.`
      );
      if (!confirmed) return;
      // Navigate to sales view for end-of-day close
      setViewRaw('sales');
      notify('Complete your End-of-Day close in Sales, then clock out.', 'warning');
      return;
    }

    const confirmed = window.confirm(
      `End shift?\n\nDuration: ${hrs}\nSales: ${shiftSales.length}\nRevenue: ${storeSettings.currency||'GH'}${shiftRev.toFixed(2)}\n\nTap OK to clock out.`
    );
    if (!confirmed) return;
    const updated = {...activeShift, clockOut: new Date().toISOString(), salesCount: shiftSales.length, revenue: shiftRev};
    setShifts(prev => prev.map(s => s.id === activeShift.id ? updated : s));
    setActiveShift(null);
    addAudit('Clock Out', `${currentUser.name} ended shift — ${shiftSales.length} sales`, 'shift');
    notify(`Shift ended. ${shiftSales.length} sales · ${storeSettings.currency||'GH'}${shiftRev.toFixed(2)}`);
  }, [activeShift, sales, currentUser, storeSettings, addAudit, notify]);

  // ── Complete sale ─────────────────────────────────────────────────────────
  const handleCompleteSale = useCallback(async (saleData) => {
    if (['sales','staff'].includes(currentUser?.role) && !activeShift) {
      notify('You must clock in before making a sale.', 'error');
      return null;
    }
    const id  = `S${20000 + sales.length + 1}`;
    const now = new Date();
    const newSale = {
      id, storeId: storeIdForData,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0,5),
      cashier: currentUser.name,
      shiftId: activeShift?.id || null,
      ...saleData,
    };
    if (isOnline) {
      setSales(prev => [newSale, ...prev]);
    } else {
      await dbQueueSale(newSale);
      notify('Offline — sale queued, will sync when reconnected.', 'warning');
    }
    setProducts(prev => prev.map(p => {
      const ci = cart.find(c => c.id===p.id || c.id?.startsWith(p.id+'_'));
      return ci ? { ...p, stock: Math.max(0, p.stock - ci.qty) } : p;
    }));
    clearCart();
    addAudit('Sale', `${id} — ${storeSettings.currency||'GH'}${saleData.total.toFixed(2)}`, 'sale');
    notify(`Sale ${id} — ${storeSettings.currency||'GH'}${saleData.total.toFixed(2)}`);

    // Auto-send receipt if customer has contact info and config is set
    const cfg = loadConfig();
    if (cfg.auto_send_receipt !== false && saleData.customer && saleData.customer !== 'Walk-in') {
      const custObj = customers.find(c => c.name === saleData.customer);
      if (custObj && (custObj.phone || custObj.email)) {
      const storeForReceipt = isSuperAdmin && adminViewStore
        ? (() => { try { const s = localStorage.getItem(`nx_${adminViewStore}_settings`); return s ? JSON.parse(s) : storeSettings; } catch { return storeSettings; } })()
        : storeSettings;
      autoSendReceipt({
          sale:     newSale,
          customer: custObj,
          store:    storeForReceipt,
          onStatus: (msg) => setTimeout(() => notify(msg), 1500),
        }).catch(e => console.warn('Auto-send receipt failed:', e));
      }
    }

    return newSale;
  }, [sales.length, storeIdForData, currentUser, activeShift, isOnline, cart, customers, adminViewStore, isSuperAdmin, clearCart, storeSettings, setSales, setProducts, addAudit, notify, dbQueueSale]);

  // ── Staff setters ─────────────────────────────────────────────────────────
  const updateStoreStaff = useCallback((updater) => {
    const updated = typeof updater==='function' ? updater(storeStaff) : updater;
    setStoreStaffRaw(updated);
    setTenantUsers(p => ({ ...p, [currentStoreId]: updated }));
    const lu = updated.find(x=>x.id===currentUser?.id);
    if (lu) setCurrentUser(lu);
  }, [storeStaff, currentStoreId, currentUser]);

  const setStoreSettings = useCallback((s) => {
    setStoreSettingsRaw(s);
    const sid = isSuperAdmin ? adminViewStore : currentStoreId;
    if (sid) {
      setTenants(p => p.map(t => t.id===sid ? { ...t, name:s.name, phone:s.phone, address:s.address, currency:s.currency, taxRate:s.taxRate, receiptFooter:s.receiptFooter, logo:s.logo } : t));
    }
  }, [currentStoreId, adminViewStore, isSuperAdmin]);

  // ── Derived values ────────────────────────────────────────────────────────
  if (!currentUser) {
    return <LoginView onLogin={handleLogin} dark={dark} setDark={setDark} greeting={greeting()} storeSettings={null} forcedOut={forcedOut} onDismissForcedOut={()=>setForcedOut(false)} forceChangeUser={forceChangeUser} onForceChangeComplete={handleForceChangeComplete}/>;
  }

  const liveUser       = isSuperAdmin ? SUPER_ADMIN : (tenantUsers[currentUser.storeId]||[]).find(u=>u.id===currentUser.id) || currentUser;
  const liveAllowed    = getAllowedViews(liveUser.role, liveUser.allowedViews);
  const currentTenant  = tenants.find(t=>t.id===currentStoreId) || {};
  const viewingTenant  = isSuperAdmin ? (tenants.find(t=>t.id===adminViewStore)||null) : currentTenant;
  const canManageStaff = isSuperAdmin || ['owner','admin','superadmin'].includes(liveUser.role);
  const todaySales     = sales.filter(s=>s.date===today);
  const todayRevenue   = todaySales.reduce((s,x)=>s+x.total,0);
  const lowStock       = products.filter(p=>p.stock>0&&p.stock<=p.reorderLevel).length;
  const outOfStock     = products.filter(p=>p.stock===0).length;
  const accent         = appearance.accentColor || '#6b4c11';

  // Effective store settings for display (when superadmin is viewing a store)
  const effectiveStoreSettings = isSuperAdmin && viewingTenant
    ? gsd(viewingTenant.id,'settings', defaultStoreSettings(viewingTenant))
    : storeSettings;

  const shared = { dark, notify, storeSettings: effectiveStoreSettings, appearance };

  const drawerItems = isSuperAdmin
    ? [
        { id:'dashboard', label:'Dashboard' },
        { id:'tenants',   label:'Tenant Manager' },
        ...(adminViewStore ? [
          { id:'pos',       label:'Point of Sale', badge:cart.length },
          { id:'inventory', label:'Inventory',     badge:lowStock+outOfStock },
          { id:'sales',     label:'Sales History' },
          { id:'customers', label:'Customers' },
          { id:'suppliers', label:'Suppliers' },
          { id:'reports',   label:'Reports' },
          { id:'staff',     label:'Staff Management' },
        ] : []),
        { id:'settings',  label:'Settings' },
      ]
    : [
        { id:'dashboard', label:'Dashboard' },
        { id:'pos',       label:'Point of Sale', badge:cart.length },
        { id:'inventory', label:'Inventory',     badge:lowStock+outOfStock },
        { id:'sales',     label:'Sales History' },
        { id:'customers', label:'Customers' },
        { id:'suppliers', label:'Suppliers' },
        { id:'reports',   label:'Reports' },
        ...(canManageStaff ? [{ id:'staff', label:'Staff Management' }] : []),
        { id:'settings',  label:'Settings' },
      ].filter(i => i.id==='staff' || liveAllowed.includes(i.id));

  return (
    <div className={`${dark?'dark':''} flex h-screen overflow-hidden bg-stone-50 dark:bg-gray-950`}>
      <Notification notification={notification} />

      {/* Offline banner */}
      {!isOnline && (
        <div className="fixed top-0 inset-x-0 z-[9998] bg-amber-700 text-white text-center py-1.5 font-semibold" style={{fontSize:'0.75rem'}}>
          ⚠ You're offline — sales will sync when reconnected ({offlineCount} queued)
        </div>
      )}

      {/* Idle warning */}
      {idleWarn && (
        <div className="fixed inset-x-0 z-[9997] bg-amber-600 text-white px-4 py-2.5 flex items-center justify-between" style={{top: !isOnline?'32px':'0', fontSize:'0.8125rem',fontWeight:500}}>
          <span>Session expires in 1 minute due to inactivity.</span>
          <button onClick={resetIdle} className="ml-4 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg font-semibold">Stay signed in</button>
        </div>
      )}

      {/* Desktop Sidebar */}
      <Sidebar
        view={view} setView={setView}
        sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen}
        currentUser={liveUser} isSuperAdmin={isSuperAdmin}
        lowStock={lowStock} outOfStock={outOfStock} cartLength={cart.length}
        canManageStaff={canManageStaff} onLogout={handleLogout}
        appearance={appearance} storeSettings={isSuperAdmin?{name:'Awunyo Platform'}:storeSettings}
        tenantName={currentTenant.name}
        adminViewStore={adminViewStore}
        viewingTenant={viewingTenant}
        activeShift={activeShift} onClockIn={clockIn} onClockOut={clockOut}
      />

      {/* Mobile drawer */}
      {mobileMenu && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm" onClick={()=>setMobileMenu(false)}/>
          <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-900 shadow-2xl lg:hidden flex flex-col overflow-y-auto">
            <div className="flex items-center justify-between h-16 px-4 border-b border-stone-200 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden" style={{background:accent}}>
                  {storeSettings?.logo ? <img src={storeSettings.logo} alt="" className="w-full h-full object-contain"/> : <span className="text-white font-bold text-sm">A</span>}
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.8125rem'}}>Awunyo Suite</div>
                  <div className="text-gray-400 uppercase tracking-widest" style={{fontSize:'0.5625rem'}}>{isSuperAdmin?'Platform Admin':currentTenant.name}</div>
                </div>
              </div>
              <button onClick={()=>setMobileMenu(false)} className="btn-ghost w-9 h-9">✕</button>
            </div>
            <nav className="flex-1 p-3 space-y-0.5">
              {drawerItems.map(item=>(
                <button key={item.id} onClick={()=>{setView(item.id);setMobileMenu(false);}}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium transition-all"
                  style={{fontSize:'0.8125rem',background:view===item.id?accent:'',color:view===item.id?'#fff':''}}>
                  <span className={view!==item.id?'text-gray-600 dark:text-gray-400':''}>{item.label}</span>
                  {item.badge>0 && <span className="font-bold min-w-[18px] h-[18px] px-1 rounded-md flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600" style={{fontSize:'0.625rem'}}>{item.badge}</span>}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-stone-100 dark:border-gray-800 flex-shrink-0">
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" style={{fontSize:'0.8125rem'}}>Sign Out</button>
            </div>
          </div>
        </>
      )}

      {/* Main area */}
      <div className={`flex-1 flex flex-col overflow-hidden min-w-0 ${(!isOnline||idleWarn)?'pt-8':''}`}>
        {/* Top bar */}
        <header className="flex-shrink-0 h-14 bg-white dark:bg-gray-900 border-b border-stone-200 dark:border-gray-800 flex items-center gap-3 px-4 z-10">
          <button onClick={()=>setMobileMenu(true)} className={`lg:hidden btn-ghost w-10 h-10 ${mobileMenu?'invisible':''}`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <button onClick={()=>setSidebarOpen(!sidebarOpen)} className="hidden lg:flex btn-ghost w-9 h-9">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 dark:text-white truncate" style={{fontSize:'0.875rem'}}>{VIEW_LABELS[view]||view}</div>
            <div className="text-gray-400 hidden sm:block" style={{fontSize:'0.6875rem'}}>
              {viewingTenant && isSuperAdmin && <span className="font-semibold mr-1.5" style={{color:accent}}>{viewingTenant.name} (viewing)</span>}
              {!isSuperAdmin&&currentTenant.name&&<span className="font-medium mr-1.5" style={{color:accent}}>{currentTenant.name}</span>}
              {time.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
            </div>
          </div>
          {/* Super admin: store context badge */}
          {isSuperAdmin && adminViewStore && (
            <button onClick={()=>switchToStore(null)} className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium" style={{borderColor:accent,color:accent,background:`${accent}10`}}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
              {viewingTenant?.name} · Exit View
            </button>
          )}
          {isSuperAdmin && !adminViewStore && <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg font-semibold border" style={{fontSize:'0.6875rem',background:`${accent}12`,color:accent,borderColor:`${accent}30`}}>Platform Admin</span>}
          <div className="hidden lg:block font-mono text-gray-400 tabular-nums bg-stone-50 dark:bg-gray-800 border border-stone-200 dark:border-gray-700 px-2.5 py-1.5 rounded-lg" style={{fontSize:'0.6875rem'}}>
            {time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
          </div>
          <button onClick={()=>setDark(!dark)} className="btn-ghost w-9 h-9">
            {dark ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          </button>
          <div className="hidden md:flex items-center gap-2 pl-2 border-l border-stone-200 dark:border-gray-700">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-stone-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {liveUser.photo?<img src={liveUser.photo} alt="" className="w-full h-full object-cover"/>:<span className="font-bold text-sm" style={{color:accent}}>{liveUser.avatar}</span>}
            </div>
            <div className="hidden xl:block">
              <div className="font-semibold text-gray-900 dark:text-white leading-tight" style={{fontSize:'0.75rem'}}>{liveUser.name}</div>
              <div className="text-gray-400" style={{fontSize:'0.625rem',textTransform:'capitalize'}}>{ROLE_LABELS[liveUser.role]||liveUser.role}</div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-scroll" className="flex-1 overflow-y-auto overflow-x-hidden" style={{paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 5rem)'}}>
          {view==='tenants'   && isSuperAdmin && <TenantManagerView tenants={tenants} setTenants={setTenants} tenantUsers={tenantUsers} setTenantUsers={setTenantUsers} notify={notify} appearance={appearance} auditLog={auditLog} onSwitchToStore={switchToStore} adminViewStore={adminViewStore}/>}
          {view==='dashboard' && <DashboardView {...shared} sales={sales} products={products} customers={customers} todayRevenue={todayRevenue} todaySales={todaySales} lowStock={lowStock} outOfStock={outOfStock} setView={setView} greeting={greeting()} currentUser={liveUser} time={time} isSuperAdmin={isSuperAdmin} tenants={tenants} tenantUsers={tenantUsers} adminViewStore={adminViewStore} viewingTenant={viewingTenant} onSwitchToStore={switchToStore} activeShift={activeShift} onClockIn={clockIn} onClockOut={clockOut} shifts={shifts}/>}
          {view==='pos'       && <POSView {...shared} products={products} cart={cart} addToCart={p=>addToCart(p,notify)} removeFromCart={removeFromCart} updateCartQty={updateCartQty} onCompleteSale={handleCompleteSale} customers={customers} setCustomers={setCustomers} currentUser={liveUser} heldSales={heldSales} setHeldSales={setHeldSales} promotions={promotions} categories={categories} activeShift={activeShift} onClockIn={clockIn}/>}
          {view==='inventory' && <InventoryView {...shared} products={products} setProducts={setProducts} suppliers={suppliers} tenants={tenants} currentStoreId={storeIdForData} categories={categories} setCategories={setCategories} addAudit={addAudit}/>}
          {view==='sales'     && <SalesView {...shared} sales={sales} setSales={setSales} products={products} setProducts={setProducts} activeShift={activeShift} onClockOut={clockOut} currentUser={liveUser} shifts={shifts}/>}
          {view==='customers' && <CustomersView {...shared} customers={customers} setCustomers={setCustomers} sales={sales}/>}
          {view==='reports'   && <ReportsView {...shared} sales={sales} products={products} customers={customers} promotions={promotions} setPromotions={setPromotions} auditLog={auditLog}/>}
          {view==='suppliers' && <SuppliersView {...shared} suppliers={suppliers} setSuppliers={setSuppliers}/>}
          {view==='staff'     && canManageStaff && <StaffView {...shared} users={isSuperAdmin?(adminViewStore?(tenantUsers[adminViewStore]||[]):Object.values(tenantUsers).flat()):storeStaff} setUsers={isSuperAdmin && adminViewStore ? (fn)=>{const cur=tenantUsers[adminViewStore]||[];const updated=typeof fn==='function'?fn(cur):fn;setTenantUsers(p=>({...p,[adminViewStore]:updated}));}:isSuperAdmin?(fn)=>{const all=Object.values(tenantUsers).flat();const updated=typeof fn==='function'?fn(all):fn;setTenantUsers(prev=>{const n={...prev};updated.forEach(u=>{if(n[u.storeId])n[u.storeId]=n[u.storeId].map(x=>x.id===u.id?u:x);});return n;});}:updateStoreStaff} currentUser={liveUser} auditLog={isSuperAdmin?auditLog:auditLog.filter(a=>a.store===currentStoreId)}/>}
          {view==='settings'  && <SettingsView {...shared} dark={dark} setDark={setDark} currentUser={liveUser} isSuperAdmin={isSuperAdmin} users={isSuperAdmin?(adminViewStore?(tenantUsers[adminViewStore]||[]):Object.values(tenantUsers).flat()):[...storeStaff]} setUsers={isSuperAdmin && adminViewStore?(fn)=>{const cur=tenantUsers[adminViewStore]||[];const updated=typeof fn==='function'?fn(cur):fn;setTenantUsers(p=>({...p,[adminViewStore]:updated}));}:isSuperAdmin?(fn)=>{const all=Object.values(tenantUsers).flat();const updated=typeof fn==='function'?fn(all):fn;setTenantUsers(prev=>{const n={...prev};updated.forEach(u=>{if(n[u.storeId])n[u.storeId]=n[u.storeId].map(x=>x.id===u.id?u:x);});return n;});}:updateStoreStaff} setStoreSettings={setStoreSettings} appearance={appearance} setAppearance={setAppearance} auditLog={isSuperAdmin?auditLog:auditLog.filter(a=>!currentStoreId||a.store===currentStoreId)} addAudit={addAudit} tenants={tenants} adminViewStore={adminViewStore} onSwitchToStore={switchToStore}/>}
        </main>

        <BottomNav
          view={view} setView={setView}
          cartLength={cart.length}
          stockBadge={lowStock + outOfStock}
          allowedViews={isSuperAdmin?['dashboard','tenants','settings','pos','inventory','sales','customers','reports','staff']:liveAllowed}
          hidden={mobileMenu}
        />
      </div>
    </div>
  );
}
