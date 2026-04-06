import React, { useState } from 'react';
import { ROLE_LABELS } from '../constants';

const IC = {
  revenue: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  cart:    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
  trend:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  users:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  alert:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  box:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
  store:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  clock:   <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  tag:     <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
};

function StatCard({ label, value, sub, icon, color, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4 text-left w-full transition-all ${onClick ? 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{background:`${color}15`, color}}>
          {icon}
        </div>
        {badge != null && badge > 0 && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">{badge}</span>
        )}
        {onClick && !badge && <svg className="w-3.5 h-3.5 text-gray-300 dark:text-gray-700 mt-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>}
      </div>
      <div className="font-bold text-gray-900 dark:text-white leading-none" style={{fontSize:'1.5rem', fontFamily:'Georgia, serif'}}>{value}</div>
      <div className="text-gray-500 dark:text-gray-400 mt-1 font-medium" style={{fontSize:'0.6875rem', textTransform:'uppercase', letterSpacing:'0.05em'}}>{label}</div>
      {sub && <div className="text-gray-400 mt-0.5" style={{fontSize:'0.625rem'}}>{sub}</div>}
    </button>
  );
}

export default function DashboardView({
  sales, products, customers, todayRevenue, todaySales,
  lowStock, outOfStock, setView, greeting, currentUser,
  storeSettings, appearance, time, isSuperAdmin,
  tenants, tenantUsers, adminViewStore, viewingTenant, onSwitchToStore,
  activeShift, onClockIn, onClockOut, shifts,
}) {
  const C      = storeSettings?.currency || 'GH';
  const accent = appearance?.accentColor || '#7c5cbf';
  const gold   = '#b8962e';
  const can    = v => (currentUser?.allowedViews || []).includes(v) || isSuperAdmin;
  const dateStr = (time || new Date()).toLocaleDateString('en-GB', {weekday:'long', day:'numeric', month:'long', year:'numeric'});

  const weekAgo   = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekSales = (sales||[]).filter(s => new Date(s.date) >= weekAgo && !s.isRefund);
  const weekRev   = weekSales.reduce((s, x) => s + x.total, 0);
  const avgOrder  = todaySales.length ? todayRevenue / todaySales.length : 0;
  const topProds  = (() => {
    const m = {};
    (sales||[]).forEach(s => s.items?.forEach(i => { m[i.name] = (m[i.name]||0) + i.qty * i.price; }));
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0, 5);
  })();
  const lowItems  = (products||[]).filter(p => p.stock <= p.reorderLevel).slice(0, 6);
  const PAY_COLORS = {cash:'#059669', mobile_money:accent, split:'#7c3aed', credit:gold};
  const PAY_LABELS = {cash:'Cash', mobile_money:'Mobile Money', split:'Split', credit:'Credit'};

  // ── SUPER ADMIN PLATFORM VIEW ────────────────────────────────────────────
  if (isSuperAdmin && !adminViewStore) {
    const totalStores  = (tenants||[]).length;
    const activeStores = (tenants||[]).filter(t => t.active).length;
    const totalUsers   = Object.values(tenantUsers||{}).flat().length;
    const disabledCount = (tenants||[]).filter(t => !t.active).length;

    return (
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-4 border-b-2 border-stone-200 dark:border-gray-800">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>{greeting}, Administrator.</h1>
          <p className="text-gray-500 text-sm mt-1">Platform overview · {dateStr}</p>
        </div>

        {/* Platform stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Total Stores"  value={totalStores}  icon={IC.store} color={accent} onClick={() => setView('tenants')}/>
          <StatCard label="Active Stores" value={activeStores} icon={IC.store} color="#059669"/>
          <StatCard label="Total Users"   value={totalUsers}   icon={IC.users} color={gold}/>
          <StatCard label="Disabled"      value={disabledCount} icon={IC.alert} color="#dc2626" badge={disabledCount}/>
        </div>

        {/* Store list */}
        <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-gray-800">
            <h2 className="font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Store Accounts</h2>
            <button onClick={() => setView('tenants')} className="text-sm font-semibold hover:underline" style={{color:accent}}>Manage all →</button>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-gray-800">
            {(tenants||[]).length === 0 && (
              <div className="px-5 py-10 text-center text-gray-400">
                No stores yet. <button onClick={() => setView('tenants')} className="font-semibold underline" style={{color:accent}}>Create one</button>
              </div>
            )}
            {(tenants||[]).map(t => {
              const uCount = (tenantUsers||{})[t.id]?.length || 0;
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border border-stone-200 dark:border-gray-700" style={{background:t.logo?'transparent':`${accent}15`}}>
                    {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-contain p-0.5"/> : <span className="font-bold" style={{color:accent, fontSize:'0.875rem'}}>{t.name.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 dark:text-white truncate text-sm">{t.name}</div>
                    <div className="text-gray-400 text-xs">{uCount} staff · {t.industry || 'Retail'}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${t.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                      {t.active ? 'Active' : 'Off'}
                    </span>
                    <button onClick={() => onSwitchToStore && onSwitchToStore(t.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                      style={{borderColor:accent, color:accent, background:`${accent}08`}}>
                      Enter
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick nav */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            ['Tenant Manager', 'Manage all store accounts and users', 'tenants', accent, IC.store],
            ['Staff Overview', 'View all users across the platform', 'staff', gold, IC.users],
            ['Settings', 'Platform configuration and audit log', 'settings', '#6b7280', IC.tag],
          ].map(([title, desc, v, c, ic]) => (
            <div key={v} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{background:`${c}15`, color:c}}>{ic}</div>
              <div className="font-bold text-gray-900 dark:text-white mb-1 text-sm" style={{fontFamily:'Georgia, serif'}}>{title}</div>
              <div className="text-gray-400 text-xs mb-4 leading-relaxed">{desc}</div>
              <button onClick={() => setView(v)} className="w-full min-h-[38px] rounded-lg font-semibold text-white text-sm" style={{background:c}}>Open</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── SUPER ADMIN VIEWING A STORE ───────────────────────────────────────────
  if (isSuperAdmin && adminViewStore) {
    return (
      <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
        <div className="pb-4 border-b-2 border-stone-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background:`${accent}15`, color:accent}}>{IC.store}</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>{viewingTenant?.name}</h1>
              <p className="text-gray-500 text-sm">Store dashboard · Admin view · {dateStr}</p>
            </div>
          </div>
          <button onClick={() => onSwitchToStore && onSwitchToStore(null)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-600 bg-red-50 dark:bg-red-900/10 dark:border-red-800 mt-2">
            ← Exit Store View
          </button>
        </div>
        {/* Show the normal admin dashboard for the store */}
        <AdminDashboard {...{sales, products, customers, todayRevenue, todaySales, lowStock, outOfStock, setView, C, accent, gold, weekRev, weekSales, avgOrder, topProds, lowItems, PAY_COLORS, PAY_LABELS, can: () => true}}/>
      </div>
    );
  }

  // ── SALES / CASHIER VIEW ─────────────────────────────────────────────────
  if (['sales', 'staff'].includes(currentUser?.role)) {
    const myToday = (todaySales||[]).filter(s => s.cashier === currentUser.name && !s.isRefund);
    const myRev   = myToday.reduce((s, x) => s + x.total, 0);
    const dur     = activeShift ? Math.floor((Date.now() - new Date(activeShift.clockIn).getTime()) / 60000) : 0;
    const hrs     = Math.floor(dur / 60);
    const mins    = dur % 60;

    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Greeting */}
        <div className="pb-3 border-b border-stone-200 dark:border-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>{greeting}, {currentUser?.name?.split(' ')[0]}.</h1>
          <p className="text-gray-400 text-sm mt-0.5">{dateStr}</p>
        </div>

        {/* Shift card */}
        <div className={`rounded-xl p-4 border-2 ${activeShift ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10' : 'border-stone-200 dark:border-gray-700 bg-white dark:bg-gray-900'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeShift ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-stone-100 dark:bg-gray-800'}`}>
                {activeShift
                  ? <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"/>
                  : <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                }
              </div>
              <div>
                <div className="font-bold text-sm" style={{color: activeShift ? '#059669' : '#6b7280', fontFamily:'Georgia, serif'}}>
                  {activeShift ? 'Shift Active' : 'Not Clocked In'}
                </div>
                <div className="text-gray-400 text-xs">
                  {activeShift
                    ? `Started ${new Date(activeShift.clockIn).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} · ${hrs}h ${mins}m elapsed`
                    : 'Clock in to start selling'
                  }
                </div>
              </div>
            </div>
            <button
              onClick={activeShift ? onClockOut : onClockIn}
              className="px-4 py-2 rounded-lg font-bold text-white text-sm transition-all active:scale-95"
              style={{background: activeShift ? '#dc2626' : accent}}
            >
              {activeShift ? 'Clock Out' : 'Clock In'}
            </button>
          </div>
        </div>

        {/* Clock-in warning */}
        {!activeShift && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
            <svg className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <div>
              <div className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Clock in required</div>
              <div className="text-amber-600 dark:text-amber-400 text-xs mt-0.5">You must clock in before processing any sales.</div>
            </div>
          </div>
        )}

        {/* POS hero */}
        <div className="rounded-xl p-5 text-white" style={{background:`linear-gradient(135deg, ${accent} 0%, #5a3f9e 100%)`}}>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Point of Sale</div>
          <div className="text-2xl font-bold mb-4" style={{fontFamily:'Georgia, serif'}}>
            {activeShift ? 'Ready to serve' : 'Clock in first'}
          </div>
          <button
            onClick={() => activeShift && setView('pos')}
            disabled={!activeShift}
            className={`font-bold px-5 py-2.5 rounded-lg text-sm transition-all ${activeShift ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 cursor-not-allowed opacity-50'}`}
          >
            {activeShift ? 'Open POS →' : 'Clock in to access'}
          </button>
        </div>

        {/* My stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            [myToday.length,                                        'My Sales Today', accent],
            [`${C}${myRev.toFixed(0)}`,                            'My Revenue',     '#059669'],
            [myToday.length ? `${C}${(myRev/myToday.length).toFixed(0)}` : '—', 'Avg Order', gold],
          ].map(([v, l, c]) => (
            <div key={l} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-3 text-center">
              <div className="font-bold leading-none" style={{fontSize:'1.25rem', color:c, fontFamily:'Georgia, serif'}}>{v}</div>
              <div className="text-gray-400 font-medium mt-1" style={{fontSize:'0.5625rem', textTransform:'uppercase', letterSpacing:'0.05em'}}>{l}</div>
            </div>
          ))}
        </div>

        {/* My sales */}
        {myToday.length > 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100 dark:border-gray-800 font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>My Sales Today</div>
            <div className="divide-y divide-stone-100 dark:divide-gray-800">
              {myToday.slice(0, 6).map(s => (
                <div key={s.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-semibold text-sm" style={{color:accent}}>{s.id}</div>
                    <div className="text-gray-400 text-xs">{s.time} · {s.customer}</div>
                  </div>
                  <div className="font-bold text-emerald-600 text-sm">{C}{s.total.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-10 text-center">
            <div className="text-5xl mb-4">🛒</div>
            <div className="font-bold text-gray-900 dark:text-white mb-1" style={{fontFamily:'Georgia, serif'}}>No sales yet today</div>
            <div className="text-gray-400 text-sm mb-4">{activeShift ? 'Head to the POS to start selling' : 'Clock in first to begin your shift'}</div>
            {activeShift && <button onClick={() => setView('pos')} className="px-6 py-2.5 rounded-lg font-bold text-white text-sm" style={{background:accent}}>Open POS</button>}
          </div>
        )}
      </div>
    );
  }

  // ── MANAGER / OWNER / ADMIN FULL DASHBOARD ────────────────────────────────
  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3 pb-4 border-b-2 border-stone-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>{greeting}, {currentUser?.name?.split(' ')[0]}.</h1>
          <p className="text-gray-500 text-sm mt-1">{dateStr}</p>
        </div>
        {can('pos') && <button onClick={() => setView('pos')} className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-white text-sm" style={{background:accent}}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Sale
        </button>}
      </div>
      <AdminDashboard {...{sales, products, customers, todayRevenue, todaySales, lowStock, outOfStock, setView, C, accent, gold, weekRev, weekSales, avgOrder, topProds, lowItems, PAY_COLORS, PAY_LABELS, can}}/>
    </div>
  );
}

// Shared admin dashboard body used by both Manager view and SuperAdmin store view
function AdminDashboard({ sales, products, customers, todayRevenue, todaySales, lowStock, outOfStock, setView, C, accent, gold, weekRev, weekSales, avgOrder, topProds, lowItems, PAY_COLORS, PAY_LABELS, can }) {
  const totalRev = (sales||[]).filter(s => !s.isRefund).reduce((s,x) => s+x.total, 0);

  return (
    <>
      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Today Revenue"  value={`${C}${todayRevenue.toFixed(0)}`} sub={`${todaySales.length} sales`}  icon={IC.revenue} color="#059669"/>
        <StatCard label="This Week"      value={`${C}${weekRev.toFixed(0)}`}      sub={`${weekSales.length} orders`} icon={IC.cart}    color={accent}/>
        <StatCard label="Avg Order"      value={`${C}${avgOrder.toFixed(0)}`}     sub="Today"                         icon={IC.trend}   color={gold}/>
        <StatCard label="Customers"      value={(customers||[]).length}            sub="Registered"                    icon={IC.users}   color="#0891b2" onClick={can('customers') ? () => setView('customers') : null}/>
        <StatCard label="Stock Alerts"   value={lowStock + outOfStock}             sub={`${outOfStock} out of stock`} icon={IC.alert}   color="#dc2626" onClick={can('inventory') ? () => setView('inventory') : null} badge={outOfStock}/>
        <StatCard label="Products"       value={(products||[]).length}             sub="Total SKUs"                   icon={IC.box}     color="#7c3aed" onClick={can('inventory') ? () => setView('inventory') : null}/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent sales */}
        <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>Recent Sales</h3>
            {can('sales') && <button onClick={() => setView('sales')} className="text-xs font-semibold hover:underline" style={{color:accent}}>View all →</button>}
          </div>
          <div className="divide-y divide-stone-100 dark:divide-gray-800">
            {(sales||[]).length === 0
              ? <div className="px-5 py-10 text-center text-gray-400 text-sm">No sales yet. <button onClick={() => setView('pos')} className="font-semibold underline" style={{color:accent}}>Make a sale</button></div>
              : (sales||[]).slice(0, 7).map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3 hover:bg-stone-50 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold text-white" style={{background: PAY_COLORS[s.payment] || accent, fontSize:'0.5rem'}}>
                    {{cash:'CA', mobile_money:'MM', split:'SP', credit:'CR'}[s.payment] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm" style={{color:accent}}>{s.id}</div>
                    <div className="text-gray-400 text-xs truncate">{s.time} · {s.customer} · {s.cashier}</div>
                  </div>
                  <div className="font-bold text-emerald-600 text-sm flex-shrink-0">{C}{s.total.toFixed(2)}</div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>Top Products</h3>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-gray-800">
            {topProds.length === 0
              ? <div className="px-5 py-10 text-center text-gray-400 text-sm">No sales data yet.</div>
              : topProds.map(([name, rev], i) => {
                const pct = topProds[0] ? (rev / topProds[0][1]) * 100 : 0;
                return (
                  <div key={name} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded flex items-center justify-center font-bold text-white flex-shrink-0" style={{background: i === 0 ? gold : '#9ca3af', fontSize:'0.5rem'}}>{i+1}</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200 text-sm truncate">{name}</span>
                      </div>
                      <span className="font-bold text-sm flex-shrink-0" style={{color:'#059669'}}>{C}{rev.toFixed(0)}</span>
                    </div>
                    <div className="h-1 bg-stone-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`, background: i === 0 ? gold : accent}}/>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* Stock alerts */}
        {can('inventory') && (
          <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>Stock Alerts</h3>
              <button onClick={() => setView('inventory')} className="text-xs font-semibold hover:underline" style={{color:accent}}>Manage →</button>
            </div>
            <div className="divide-y divide-stone-100 dark:divide-gray-800">
              {lowItems.length === 0
                ? <div className="px-5 py-8 text-center text-emerald-600 font-semibold text-sm">✓ All products well stocked</div>
                : lowItems.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 dark:text-white text-sm truncate">{p.name}</div>
                      <div className="text-gray-400 text-xs">Reorder at {p.reorderLevel} units</div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ml-2 flex-shrink-0 ${p.stock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-600' : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700'}`}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Payment breakdown */}
        <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 dark:border-gray-800">
            <h3 className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>Payment Methods <span className="text-gray-400 font-normal text-xs ml-1">Today</span></h3>
          </div>
          <div className="p-5 space-y-4">
            {todaySales.length === 0
              ? <div className="text-center py-4 text-gray-400 text-sm">No transactions today.</div>
              : Object.entries(PAY_LABELS).map(([key, label]) => {
                const filtered = todaySales.filter(s => s.payment === key && !s.isRefund);
                const tot      = filtered.reduce((a, s) => a + s.total, 0);
                const pct      = todaySales.length ? (filtered.length / todaySales.length) * 100 : 0;
                if (!filtered.length) return null;
                return (
                  <div key={key}>
                    <div className="flex justify-between items-center mb-1.5 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{label}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{filtered.length} · {C}{tot.toFixed(0)}</span>
                    </div>
                    <div className="h-2 bg-stone-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`, background: PAY_COLORS[key] || accent}}/>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>
      </div>
    </>
  );
}
