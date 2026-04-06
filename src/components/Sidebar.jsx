import React from 'react';
import { ROLE_LABELS } from '../constants';

const NAV = [
  { id:'tenants',   superOnly:true,  label:'Tenant Manager',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>},
  { id:'dashboard', label:'Dashboard',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>},
  { id:'pos',       label:'Point of Sale', cartBadge:true,
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>},
  { id:'inventory', label:'Inventory', stockBadge:true,
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>},
  { id:'sales',     label:'Sales History',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>},
  { id:'customers', label:'Customers',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>},
  { id:'suppliers', label:'Suppliers',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>},
  { id:'reports',   label:'Reports',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>},
  { id:'staff',     staffOnly:true, label:'Staff Management',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>},
  { id:'settings',  label:'Settings',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>},
];

const ROLE_COLOR = {
  superadmin:'#7c3aed', owner:'#6b4c11', manager:'#0891b2',
  admin:'#4f46e5', sales:'#059669', staff:'#0891b2'
};

export default function Sidebar({
  view, setView, sidebarOpen, setSidebarOpen,
  currentUser, isSuperAdmin, lowStock, outOfStock, cartLength,
  canManageStaff, onLogout, appearance, storeSettings,
  tenantName, adminViewStore, viewingTenant,
  activeShift, onClockIn, onClockOut,
}) {
  const accent = appearance?.accentColor || '#6b4c11';

  const items = NAV.filter(n => {
    if (n.superOnly) return isSuperAdmin;
    if (n.staffOnly) return canManageStaff;
    if (isSuperAdmin) {
      // Show store-specific items only if admin has switched to a store
      const storeItems = ['pos','inventory','sales','customers','suppliers','reports','staff'];
      if (storeItems.includes(n.id)) return !!adminViewStore;
      return true;
    }
    return (currentUser?.allowedViews||[]).includes(n.id);
  });

  const NavItem = ({ item }) => {
    const active = view === item.id;
    const badge  = item.cartBadge ? cartLength : item.stockBadge ? (lowStock+outOfStock) : 0;
    return (
      <button
        onClick={() => setView(item.id)}
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-150 ${active?'text-white shadow-sm':'text-gray-500 dark:text-gray-400 hover:bg-stone-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
        style={active?{background:accent}:{}}
        title={!sidebarOpen?item.label:''}
      >
        <span className="w-[18px] h-[18px] flex-shrink-0">{item.icon}</span>
        {sidebarOpen && (
          <>
            <span className="flex-1 text-left truncate" style={{fontSize:'0.8125rem'}}>{item.label}</span>
            {badge>0 && (
              <span className="min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1" style={{fontSize:'0.5625rem',background:active?'rgba(255,255,255,0.25)':'#fee2e2',color:active?'#fff':'#dc2626'}}>
                {badge>9?'9+':badge}
              </span>
            )}
          </>
        )}
        {!sidebarOpen && badge>0 && <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"/>}
      </button>
    );
  };

  return (
    <aside className={`hidden md:flex flex-col flex-shrink-0 bg-white dark:bg-gray-900 border-r border-stone-200 dark:border-gray-800 transition-all duration-300 ${sidebarOpen?'w-56':'w-[60px]'} overflow-hidden`}>

      {/* Branding */}
      <div className="h-14 flex items-center gap-3 px-3.5 border-b border-stone-100 dark:border-gray-800 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm" style={{background:storeSettings?.logo?'transparent':accent}}>
          {storeSettings?.logo
            ? <img src={storeSettings.logo} alt="" className="w-full h-full object-contain"/>
            : <span className="text-white font-bold text-sm">A</span>
          }
        </div>
        {sidebarOpen && (
          <div className="min-w-0 flex-1">
            <div className="font-bold text-gray-900 dark:text-white tracking-tight truncate leading-tight" style={{fontSize:'0.8125rem',fontFamily:'Georgia, serif'}}>
              {isSuperAdmin ? 'Awunyo Suite' : (storeSettings?.name||'Awunyo Suite')}
            </div>
            {isSuperAdmin
              ? <div className="font-semibold leading-tight" style={{fontSize:'0.5625rem',color:accent,letterSpacing:'0.05em',textTransform:'uppercase'}}>Platform Admin</div>
              : tenantName && <div className="text-gray-400 uppercase tracking-widest leading-tight truncate" style={{fontSize:'0.5rem'}}>{tenantName}</div>
            }
          </div>
        )}
      </div>

      {/* Super admin viewing store badge */}
      {isSuperAdmin && adminViewStore && sidebarOpen && viewingTenant && (
        <div className="mx-2 mt-2 px-3 py-2 rounded-lg text-xs font-semibold" style={{background:`${accent}15`,color:accent,border:`1px solid ${accent}30`}}>
          <div style={{fontSize:'0.5625rem',opacity:0.7,textTransform:'uppercase',letterSpacing:'0.05em'}}>Viewing Store</div>
          <div className="truncate">{viewingTenant.name}</div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {items.map(item => <NavItem key={item.id} item={item}/>)}
      </nav>

      {/* Divider */}
      <div className="mx-3 border-t border-stone-100 dark:border-gray-800"/>

      {/* User info & sign out */}
      <div className="p-2 space-y-1 flex-shrink-0">
      {/* Clock in/out — for non-superadmin users */}
        {!isSuperAdmin && onClockIn && (
          <button
            onClick={activeShift ? onClockOut : onClockIn}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium transition-all duration-150 ${activeShift?'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100':'bg-stone-100 dark:bg-gray-800 text-gray-500 hover:bg-stone-200 dark:hover:bg-gray-700'}`}
            title={activeShift?'Clock Out':'Clock In'}
          >
            {activeShift
              ? <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"/>
              : <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            }
            {sidebarOpen && <span style={{fontSize:'0.75rem'}}>{activeShift ? 'Clock Out' : 'Clock In'}</span>}
          </button>
        )}

        {sidebarOpen ? (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-stone-50 dark:bg-gray-800/60">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 border border-stone-200 dark:border-gray-700" style={{background:`${accent}15`}}>
              {currentUser?.photo
                ? <img src={currentUser.photo} alt="" className="w-full h-full object-cover"/>
                : <span className="text-xs font-bold" style={{color:accent}}>{currentUser?.avatar}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{currentUser?.name}</div>
              <div className="font-medium leading-tight" style={{fontSize:'0.625rem',color:ROLE_COLOR[currentUser?.role]||accent}}>
                {ROLE_LABELS[currentUser?.role]||currentUser?.role}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center border border-stone-200 dark:border-gray-700" style={{background:`${accent}15`}} title={currentUser?.name}>
              {currentUser?.photo
                ? <img src={currentUser.photo} alt="" className="w-full h-full object-cover"/>
                : <span className="text-xs font-bold" style={{color:accent}}>{currentUser?.avatar}</span>
              }
            </div>
          </div>
        )}

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-150"
          title="Sign Out"
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          {sidebarOpen && <span style={{fontSize:'0.8125rem'}}>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
