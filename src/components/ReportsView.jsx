import React, { useState } from 'react';

const dl = (content, name, mime) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type:mime}));
  a.download = name; a.click();
};

export default function ReportsView({ sales, products, customers, storeSettings, appearance, promotions, setPromotions, notify, shifts, auditLog }) {
  const [period,        setPeriod]        = useState('week');
  const [tab,           setTab]           = useState('overview');
  const [showPromoModal,setShowPromoModal] = useState(false);
  const [promoForm,     setPromoForm]     = useState({name:'', type:'percent_off', value:'', minOrder:'', active:true, startDate:'', endDate:''});
  const [schedules,     setSchedules]     = useState([]);
  const [showSchedModal,setShowSchedModal] = useState(false);
  const [schedForm,     setSchedForm]     = useState({email:'', frequency:'daily', time:'08:00'});

  const C      = storeSettings?.currency || 'GH';
  const accent = appearance?.accentColor || '#7c5cbf';
  const gold   = '#b8962e';
  const promos = promotions || [];

  const DAYS   = {today:1, week:7, month:30, year:365};
  const cutoff = new Date(Date.now() - DAYS[period] * 86400000);
  const ps     = (sales||[]).filter(s => new Date(s.date) >= cutoff && !s.isRefund);
  const refunds = (sales||[]).filter(s => new Date(s.date) >= cutoff && s.isRefund);

  const totalRev    = ps.reduce((s,x) => s + x.total, 0);
  const totalRefunds = refunds.reduce((s,x) => s + Math.abs(x.total), 0);
  const totalCogs   = ps.reduce((s, sale) => s + sale.items.reduce((a, item) => {
    const p = (products||[]).find(x => x.name === item.name);
    return a + (p?.cost||0) * item.qty;
  }, 0), 0);
  const grossProfit = totalRev - totalCogs - totalRefunds;
  const totalTax    = ps.reduce((s,x) => s + x.tax, 0);
  const netProfit   = grossProfit - totalTax;
  const totalDisc   = ps.reduce((s,x) => s + (x.discount||0), 0);
  const avgOrder    = ps.length ? totalRev / ps.length : 0;

  const byDay = {};
  ps.forEach(s => { byDay[s.date] = (byDay[s.date]||0) + s.total; });
  const days   = Object.entries(byDay).sort((a,b) => a[0].localeCompare(b[0])).slice(-14);
  const maxDay = Math.max(...days.map(([,v]) => v), 1);

  const byCat = {};
  ps.forEach(s => s.items.forEach(i => {
    const p = (products||[]).find(x => x.name === i.name);
    const c = p?.category || 'Other';
    byCat[c] = (byCat[c]||0) + i.qty * i.price;
  }));
  const cats  = Object.entries(byCat).sort((a,b) => b[1]-a[1]);
  const totCat = cats.reduce((s,[,v]) => s+v, 0);

  const byPay = {};
  ps.forEach(s => { byPay[s.payment] = (byPay[s.payment]||0) + s.total; });

  const byStaff = {};
  ps.forEach(s => {
    if (!byStaff[s.cashier]) byStaff[s.cashier] = {name:s.cashier, count:0, total:0};
    byStaff[s.cashier].count++;
    byStaff[s.cashier].total += s.total;
  });
  const staff = Object.values(byStaff).sort((a,b) => b.total - a.total);

  const COLORS = [accent, gold, '#059669', '#dc2626', '#0891b2', '#7c3aed'];
  const PAY_LABELS = {cash:'Cash', mobile_money:'Mobile Money', split:'Split', credit:'Credit', card:'Card'};

  const exportCSV = () => {
    const h = ['Sale ID','Date','Time','Cashier','Customer','Payment','Total'];
    const csv = [h.join(','), ...ps.map(s => [s.id,s.date,s.time,s.cashier,s.customer,s.payment,s.total].map(v=>`"${v}"`).join(','))].join('\n');
    dl(csv, `report_${period}.csv`, 'text/csv');
  };
  const exportExcel = () => {
    let xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Sales"><Table>`;
    xml += `<Row><Cell><Data ss:Type="String">ID</Data></Cell><Cell><Data ss:Type="String">Date</Data></Cell><Cell><Data ss:Type="String">Cashier</Data></Cell><Cell><Data ss:Type="String">Customer</Data></Cell><Cell><Data ss:Type="Number">Total</Data></Cell></Row>`;
    ps.forEach(s => { xml += `<Row><Cell><Data ss:Type="String">${s.id}</Data></Cell><Cell><Data ss:Type="String">${s.date}</Data></Cell><Cell><Data ss:Type="String">${s.cashier}</Data></Cell><Cell><Data ss:Type="String">${s.customer}</Data></Cell><Cell><Data ss:Type="Number">${s.total}</Data></Cell></Row>`; });
    xml += `</Table></Worksheet></Workbook>`;
    dl(xml, `report_${period}.xls`, 'application/vnd.ms-excel');
  };

  const savePromo = () => {
    if (!promoForm.name || !promoForm.value) { notify('Name and value required.','error'); return; }
    const p = {id:`PROMO${Date.now()}`, name:promoForm.name, type:promoForm.type, value:parseFloat(promoForm.value), minOrder:parseFloat(promoForm.minOrder||0), active:promoForm.active, startDate:promoForm.startDate, endDate:promoForm.endDate};
    if (setPromotions) setPromotions(prev => [...(prev||[]), p]);
    setShowPromoModal(false);
    setPromoForm({name:'', type:'percent_off', value:'', minOrder:'', active:true, startDate:'', endDate:''});
    notify('Promotion created.');
  };

  const saveSchedule = () => {
    if (!schedForm.email) { notify('Email required.','error'); return; }
    setSchedules(prev => [...prev, {id:Date.now(), ...schedForm}]);
    setShowSchedModal(false);
    notify('Scheduled report saved.');
  };

  const TABS = [
    ['overview',    'Overview'],
    ['pl',          'Profit & Loss'],
    ['staff',       'Staff Performance'],
    ['promotions',  `Promotions${promos.length > 0 ? ` (${promos.length})` : ''}`],
    ['shifts',      'Shifts'],
    ['scheduled',   'Scheduled'],
  ];

  const Card = ({ children, className='' }) => (
    <div className={`bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl ${className}`}>
      {children}
    </div>
  );

  const CardHeader = ({ title, action }) => (
    <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-gray-800">
      <h3 className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>{title}</h3>
      {action}
    </div>
  );

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b-2 border-stone-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Reports & Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Store performance overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn-secondary text-xs px-3 min-h-[38px]">Export CSV</button>
          <button onClick={exportExcel} className="btn-secondary text-xs px-3 min-h-[38px]">Export Excel</button>
        </div>
      </div>

      {/* Tab strip */}
      <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-stone-200 dark:border-gray-800">
        {TABS.map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`flex-shrink-0 px-4 py-2.5 font-semibold border-b-2 -mb-px transition-all text-sm ${tab===k?'border-current':'border-transparent text-gray-400 hover:text-gray-600'}`}
            style={tab===k?{color:accent, borderColor:accent}:{}}>
            {l}
          </button>
        ))}
      </div>

      {/* Period filter */}
      <div className="flex gap-2">
        {[['today','Today'],['week','This Week'],['month','This Month'],['year','This Year']].map(([k,l]) => (
          <button key={k} onClick={() => setPeriod(k)}
            className={`flex-shrink-0 px-3 py-2 rounded-lg font-semibold text-xs transition-all ${period===k?'text-white':'bg-stone-100 dark:bg-gray-800 text-gray-500'}`}
            style={period===k?{background:accent}:{}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {tab === 'overview' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              [`${C}${totalRev.toFixed(0)}`, 'Revenue',      '#059669'],
              [ps.length,                    'Transactions',  accent   ],
              [`${C}${avgOrder.toFixed(0)}`, 'Avg Order',     gold     ],
              [`${C}${totalDisc.toFixed(0)}`, 'Discounts',   '#dc2626' ],
            ].map(([v,l,c]) => (
              <div key={l} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4 text-center">
                <div className="font-bold leading-none" style={{fontSize:'1.5rem', color:c, fontFamily:'Georgia, serif'}}>{v}</div>
                <div className="text-gray-400 font-medium mt-1 uppercase tracking-wider" style={{fontSize:'0.5625rem'}}>{l}</div>
              </div>
            ))}
          </div>

          {/* Revenue bar chart */}
          <Card>
            <CardHeader title="Daily Revenue"/>
            <div className="p-5">
              {days.length === 0
                ? <div className="text-center py-8 text-gray-400 text-sm">No data for this period.</div>
                : <div className="flex items-end gap-1.5 h-36">
                    {days.map(([date, rev]) => (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end min-w-0">
                        <div className="text-gray-400 font-medium w-full text-center" style={{fontSize:'0.5rem'}}>{C}{rev >= 1000 ? `${(rev/1000).toFixed(0)}k` : rev.toFixed(0)}</div>
                        <div className="w-full rounded-t-md min-h-[4px] transition-all duration-500" style={{height:`${(rev/maxDay)*100}%`, background:accent}}/>
                        <div className="text-gray-400 w-full text-center truncate" style={{fontSize:'0.5rem'}}>{date.slice(5)}</div>
                      </div>
                    ))}
                  </div>
              }
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment methods */}
            <Card>
              <CardHeader title="Payment Methods"/>
              <div className="p-5 space-y-4">
                {Object.entries(byPay).length === 0
                  ? <div className="text-center py-4 text-gray-400 text-sm">No data.</div>
                  : Object.entries(byPay).map(([method, rev], i) => {
                    const pct = totalRev ? (rev / totalRev) * 100 : 0;
                    const cnt = ps.filter(s => s.payment === method).length;
                    return (
                      <div key={method}>
                        <div className="flex justify-between items-center mb-1.5 text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{PAY_LABELS[method]||method}</span>
                          <span className="font-bold" style={{color:COLORS[i%COLORS.length]}}>{cnt} · {C}{rev.toFixed(0)}</span>
                        </div>
                        <div className="h-2 bg-stone-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{width:`${pct}%`, background:COLORS[i%COLORS.length]}}/>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </Card>

            {/* Category breakdown */}
            <Card>
              <CardHeader title="Revenue by Category"/>
              <div className="p-5 space-y-3">
                {cats.length === 0
                  ? <div className="text-center py-4 text-gray-400 text-sm">No data.</div>
                  : cats.map(([cat, rev], i) => {
                    const pct = totCat ? (rev/totCat)*100 : 0;
                    return (
                      <div key={cat} className="bg-stone-50 dark:bg-gray-800 rounded-xl p-3">
                        <div className="flex justify-between items-center mb-1.5 text-sm">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{cat}</span>
                          <span className="font-bold" style={{color:COLORS[i%COLORS.length]}}>{C}{rev.toFixed(0)}</span>
                        </div>
                        <div className="h-1.5 bg-stone-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{width:`${pct}%`, background:COLORS[i%COLORS.length]}}/>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ── PROFIT & LOSS ── */}
      {tab === 'pl' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              [`${C}${totalRev.toFixed(2)}`,      'Gross Revenue',  '#059669'],
              [`${C}${totalCogs.toFixed(2)}`,      'Cost of Goods',  '#dc2626'],
              [`${C}${totalRefunds.toFixed(2)}`,   'Refunds',        gold],
              [`${C}${grossProfit.toFixed(2)}`,    'Gross Profit',   grossProfit >= 0 ? '#059669' : '#dc2626'],
              [`${C}${totalTax.toFixed(2)}`,       'Tax Collected',  '#6b7280'],
              [`${C}${netProfit.toFixed(2)}`,      'Net Profit',     netProfit >= 0 ? '#059669' : '#dc2626'],
            ].map(([v,l,c]) => (
              <div key={l} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4 text-center">
                <div className="font-bold leading-none" style={{fontSize:'1.25rem', color:c, fontFamily:'Georgia, serif'}}>{v}</div>
                <div className="text-gray-400 font-medium mt-1 uppercase tracking-wider" style={{fontSize:'0.5625rem'}}>{l}</div>
              </div>
            ))}
          </div>

          <Card>
            <CardHeader title="P&L Statement"/>
            <div className="p-5">
              {[
                ['Revenue',          totalRev,        '#059669', false],
                ['Cost of Goods',    -totalCogs,      '#dc2626', false],
                ['Refunds',          -totalRefunds,   gold,      false],
                ['GROSS PROFIT',     grossProfit,     grossProfit >= 0 ? '#059669' : '#dc2626', true],
                ['Tax Collected',    -totalTax,       '#6b7280', false],
                ['NET PROFIT',       netProfit,       netProfit >= 0 ? '#059669' : '#dc2626',   true],
              ].map(([label, val, color, bold]) => (
                <div key={label} className={`flex justify-between items-center py-3 ${bold ? 'border-t-2 border-stone-200 dark:border-gray-700 mt-1' : 'border-b border-stone-100 dark:border-gray-800'}`}>
                  <span className={`${bold ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-500'} text-sm`} style={bold?{fontFamily:'Georgia, serif'}:{}}>{label}</span>
                  <span className={`font-bold text-sm`} style={{color}}>{val >= 0 ? '+' : ''}{C}{val.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── STAFF PERFORMANCE ── */}
      {tab === 'staff' && (
        <div className="space-y-3">
          {staff.length === 0
            ? <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">📊</div><div className="text-sm">No sales data for this period.</div></div>
            : staff.map((s, i) => (
              <Card key={s.name}>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0" style={{background:COLORS[i%COLORS.length], fontSize:'0.875rem'}}>{i+1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 dark:text-white text-sm truncate" style={{fontFamily:'Georgia, serif'}}>{s.name}</div>
                      <div className="text-gray-400 text-xs">{s.count} transactions · avg {C}{(s.total/s.count).toFixed(2)}</div>
                    </div>
                    <div className="font-bold text-emerald-600 text-lg" style={{fontFamily:'Georgia, serif'}}>{C}{s.total.toFixed(0)}</div>
                  </div>
                  <div className="mt-3 h-2 bg-stone-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{width:`${staff[0]?((s.total/staff[0].total)*100):0}%`, background:COLORS[i%COLORS.length]}}/>
                  </div>
                </div>
              </Card>
            ))
          }
        </div>
      )}

      {/* ── PROMOTIONS ── */}
      {tab === 'promotions' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowPromoModal(true)} className="px-4 py-2.5 rounded-lg font-semibold text-white text-sm" style={{background:accent}}>+ New Promotion</button>
          </div>
          {promos.length === 0 && <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">🎫</div><div className="text-sm">No promotions created yet.</div></div>}
          {promos.map(p => (
            <Card key={p.id} className={p.active?'':'opacity-60'}>
              <div className="p-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>{p.name}</div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-stone-100 dark:bg-gray-800 text-gray-500'}`}>{p.active?'Active':'Inactive'}</span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {p.type === 'percent_off' ? `${p.value}% off` : p.type === 'fixed_off' ? `${C}${p.value} off` : p.type}
                    {p.minOrder > 0 ? ` · min order ${C}${p.minOrder}` : ''}
                    {p.startDate ? ` · ${p.startDate} → ${p.endDate||'∞'}` : ''}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPromotions && setPromotions(prev => prev.map(x => x.id===p.id ? {...x,active:!x.active} : x))} className="btn-secondary min-h-[32px] px-3 text-xs">{p.active?'Disable':'Enable'}</button>
                  <button onClick={() => { setPromotions && setPromotions(prev => prev.filter(x => x.id!==p.id)); notify('Promo removed.'); }} className="btn-danger min-h-[32px] px-2 text-xs">Del</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── SHIFTS ── */}
      {tab === 'shifts' && (
        <div className="space-y-3">
          {(!shifts || shifts.length === 0) && <div className="text-center py-16 text-gray-400"><div className="text-5xl mb-3">⏰</div><div className="text-sm">No shift records yet.</div></div>}
          {(shifts||[]).map(s => {
            const dur = s.clockOut ? Math.round((new Date(s.clockOut)-new Date(s.clockIn))/60000) : null;
            return (
              <Card key={s.id}>
                <div className="p-4 flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0" style={{background:accent}}>{s.userName?.slice(0,2).toUpperCase()}</div>
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
                    {s.salesCount != null && <div className="text-right"><div className="font-bold text-emerald-600 text-sm">{C}{(s.revenue||0).toFixed(0)}</div><div className="text-gray-400" style={{fontSize:'0.625rem'}}>{s.salesCount} sales</div></div>}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.clockOut?'bg-stone-100 dark:bg-gray-800 text-gray-500':'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'}`}>{s.clockOut?'Ended':'● Active'}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── SCHEDULED REPORTS ── */}
      {tab === 'scheduled' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowSchedModal(true)} className="px-4 py-2.5 rounded-lg font-semibold text-white text-sm" style={{background:accent}}>+ Schedule Report</button>
          </div>
          {schedules.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📧</div>
              <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1" style={{fontFamily:'Georgia, serif'}}>No scheduled reports</div>
              <div className="text-sm">Set up automatic email reports sent daily, weekly or monthly.</div>
            </div>
          )}
          {schedules.map(s => (
            <Card key={s.id}>
              <div className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm" style={{fontFamily:'Georgia, serif'}}>{s.email}</div>
                  <div className="text-gray-400 text-xs capitalize">{s.frequency} at {s.time}</div>
                </div>
                <button onClick={() => setSchedules(prev => prev.filter(x => x.id!==s.id))} className="btn-danger min-h-[32px] px-3 text-xs">Remove</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── PROMO MODAL ── */}
      {showPromoModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md slide-up">
            <div className="flex justify-center pt-3"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-4">
              <div className="font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>New Promotion</div>
              <button onClick={() => setShowPromoModal(false)} className="btn-ghost w-8 h-8">✕</button>
            </div>
            <div className="px-5 pb-8 space-y-4">
              <div><label className="lbl">Promo Name *</label><input value={promoForm.name} onChange={e=>setPromoForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Weekend Sale" className="inp"/></div>
              <div>
                <label className="lbl">Discount Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[['percent_off','% Off'],['fixed_off','Fixed Off'],['free_item','Free Item']].map(([k,l]) => (
                    <button key={k} onClick={() => setPromoForm(f=>({...f,type:k}))}
                      className="py-2.5 rounded-xl border-2 font-semibold text-xs text-center transition-all"
                      style={{borderColor:promoForm.type===k?accent:'#e5e7eb', background:promoForm.type===k?`${accent}12`:'', color:promoForm.type===k?accent:'#6b7280'}}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="lbl">{promoForm.type==='percent_off'?'Percentage':C+' Amount'} *</label><input type="number" inputMode="decimal" value={promoForm.value} onChange={e=>setPromoForm(f=>({...f,value:e.target.value}))} className="inp"/></div>
                <div><label className="lbl">Min Order ({C})</label><input type="number" inputMode="decimal" value={promoForm.minOrder} onChange={e=>setPromoForm(f=>({...f,minOrder:e.target.value}))} className="inp"/></div>
                <div><label className="lbl">Start Date</label><input type="date" value={promoForm.startDate} onChange={e=>setPromoForm(f=>({...f,startDate:e.target.value}))} className="inp"/></div>
                <div><label className="lbl">End Date</label><input type="date" value={promoForm.endDate} onChange={e=>setPromoForm(f=>({...f,endDate:e.target.value}))} className="inp"/></div>
              </div>
              <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-gray-800 rounded-xl">
                <span className="font-medium text-gray-900 dark:text-white text-sm">Activate immediately</span>
                <button onClick={() => setPromoForm(f=>({...f,active:!f.active}))} className="w-12 h-6 rounded-full relative transition-colors" style={{background:promoForm.active?accent:'#d1d5db'}}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${promoForm.active?'left-6':'left-0.5'}`}/>
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowPromoModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={savePromo} className="flex-1 min-h-[44px] rounded-xl font-semibold text-white" style={{background:accent}}>Create</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SCHEDULE MODAL ── */}
      {showSchedModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md slide-up">
            <div className="flex justify-center pt-3"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-4">
              <div className="font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Schedule Automated Report</div>
              <button onClick={() => setShowSchedModal(false)} className="btn-ghost w-8 h-8">✕</button>
            </div>
            <div className="px-5 pb-8 space-y-4">
              <div><label className="lbl">Send to Email *</label><input type="email" value={schedForm.email} onChange={e=>setSchedForm(f=>({...f,email:e.target.value}))} placeholder="manager@store.com" className="inp"/></div>
              <div>
                <label className="lbl">Frequency</label>
                <div className="grid grid-cols-3 gap-2">
                  {['daily','weekly','monthly'].map(f => (
                    <button key={f} onClick={() => setSchedForm(p=>({...p,frequency:f}))}
                      className="py-2.5 rounded-xl border-2 font-semibold capitalize text-sm transition-all"
                      style={{borderColor:schedForm.frequency===f?accent:'#e5e7eb', background:schedForm.frequency===f?`${accent}12`:'', color:schedForm.frequency===f?accent:'#6b7280'}}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className="lbl">Send Time</label><input type="time" value={schedForm.time} onChange={e=>setSchedForm(f=>({...f,time:e.target.value}))} className="inp"/></div>
              <div className="p-3 rounded-xl text-xs" style={{background:`${accent}10`, color:accent}}>
                Reports will be sent automatically when EmailJS is configured in Settings → Notifications.
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowSchedModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={saveSchedule} className="flex-1 min-h-[44px] rounded-xl font-semibold text-white" style={{background:accent}}>Save Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
