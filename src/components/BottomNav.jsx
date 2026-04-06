import React, { useEffect, useRef, useState } from 'react';

const ALL_NAV = [
  { id:'dashboard', label:'Home',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg> },
  { id:'pos',       label:'POS', cartBadge:true,
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg> },
  { id:'inventory', label:'Stock', stockBadge:true,
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg> },
  { id:'customers', label:'People',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { id:'sales',     label:'Sales',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/></svg> },
  { id:'reports',   label:'Reports',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
  { id:'tenants',   label:'Stores',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id:'settings',  label:'Settings',
    icon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg> },
];

export default function BottomNav({ view, setView, cartLength, stockBadge, allowedViews, hidden }) {
  const [autoHidden, setAutoHidden] = useState(false);
  const lastScrollY  = useRef(0);
  const scrollTimer  = useRef(null);

  useEffect(() => {
    const scroller = document.getElementById('main-scroll');
    if (!scroller) return;
    const onScroll = () => {
      const y = scroller.scrollTop;
      const diff = y - lastScrollY.current;
      if (diff > 8)       setAutoHidden(true);
      else if (diff < -8) setAutoHidden(false);
      lastScrollY.current = y;
      clearTimeout(scrollTimer.current);
      scrollTimer.current = setTimeout(() => setAutoHidden(false), 2000);
    };
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => { scroller.removeEventListener('scroll', onScroll); clearTimeout(scrollTimer.current); };
  }, []);

  const visible = ALL_NAV.filter(i => (allowedViews||[]).includes(i.id)).slice(0, 5);
  if (!visible.length) return null;

  const shouldHide = hidden || autoHidden;

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-gray-900 border-t border-stone-200 dark:border-gray-800"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        transform: shouldHide ? 'translateY(100%)' : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.06), 0 -4px 16px rgba(0,0,0,0.04)',
      }}
    >
      {autoHidden && (
        <button
          onClick={() => setAutoHidden(false)}
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-8 bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-700 rounded-t-2xl flex items-center justify-center shadow-md"
        >
          <div className="w-8 h-1 bg-stone-300 dark:bg-gray-600 rounded-full"/>
        </button>
      )}
      <div className="flex">
        {visible.map(item => {
          const active = view === item.id;
          const badge  = item.cartBadge ? cartLength : item.stockBadge ? (stockBadge||0) : 0;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className="nav-item relative flex-1"
              style={{ WebkitTapHighlightColor:'transparent' }}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{background:'var(--accent,#6b4c11)'}}/>
              )}
              <span className="w-[22px] h-[22px] block relative" style={{color:active?'var(--accent,#6b4c11)':'#9ca3af',transition:'color 0.15s'}}>
                {item.icon}
                {badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] bg-red-500 text-white rounded-full flex items-center justify-center px-0.5" style={{fontSize:'8px',fontWeight:700}}>
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span style={{fontSize:'10px',fontWeight:active?600:500,color:active?'var(--accent,#6b4c11)':'#9ca3af',transition:'color 0.15s',lineHeight:1.2}}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
