import React, { useState } from 'react';

export default function SalesView({ sales, setSales, storeSettings, products, setProducts, notify, appearance, shifts, onClockOut, activeShift, currentUser }) {
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [sel,       setSel]       = useState(null);
  const [showClose, setShowClose] = useState(false);
  const [tillCount, setTillCount] = useState('');
  const [closeNote, setCloseNote] = useState('');
  const [closedDays,setClosedDays]= useState([]);

  const C        = storeSettings?.currency || 'GH';
  const accent   = appearance?.accentColor || '#4f46e5';
  const today    = new Date().toISOString().split('T')[0];
  const yesterday= new Date(Date.now()-86400000).toISOString().split('T')[0];
  const weekAgo  = new Date(Date.now()-7*86400000).toISOString().split('T')[0];

  const list = sales.filter(s => {
    const ms = s.id.toLowerCase().includes(search.toLowerCase()) ||
               s.customer.toLowerCase().includes(search.toLowerCase()) ||
               s.cashier.toLowerCase().includes(search.toLowerCase());
    const md = filter==='all'    ? true :
               filter==='today'  ? s.date===today :
               filter==='yesterday'?s.date===yesterday :
               filter==='week'   ? s.date>=weekAgo   : true;
    return ms && md && !s.refunded;
  });

  const totalRev = list.reduce((s,x)=>s+x.total,0);
  const todayRev = sales.filter(s=>s.date===today&&!s.refunded).reduce((s,x)=>s+x.total,0);

  /* ── Refund ────────────────────────────────────────────────────────────── */
  const handleRefund = (sale, partial) => {
    if (!window.confirm(`Refund ${partial ? 'partial' : 'full'} ${C}${sale.total.toFixed(2)} for ${sale.id}?`)) return;
    // Mark sale as refunded
    setSales(prev => prev.map(s => s.id===sale.id ? {...s, refunded:true, refundedAt: new Date().toISOString()} : s));
    // Add refund record
    const refund = {
      id: `R${sale.id}`, date: today, time: new Date().toTimeString().slice(0,5),
      cashier: sale.cashier, customer: sale.customer, payment: sale.payment,
      items: sale.items, subtotal: -sale.subtotal, tax: -sale.tax,
      discount: -sale.discount, total: -sale.total, isRefund: true,
      storeId: sale.storeId,
    };
    setSales(prev => [refund, ...prev]);
    // Restock products
    if (setProducts && products) {
      setProducts(prev => prev.map(p => {
        const ri = sale.items.find(i => i.name===p.name);
        return ri ? {...p, stock: p.stock + ri.qty} : p;
      }));
    }
    setSel(null);
    notify(`Refund ${refund.id} processed. Stock restocked.`);
  };

  /* ── End-of-day close ──────────────────────────────────────────────────── */
  const cashSales  = sales.filter(s=>s.date===today&&s.payment==='cash'&&!s.refunded).reduce((s,x)=>s+x.total,0);
  const momoSales  = sales.filter(s=>s.date===today&&s.payment==='mobile_money'&&!s.refunded).reduce((s,x)=>s+x.total,0);
  const splitCash  = sales.filter(s=>s.date===today&&s.payment==='split'&&!s.refunded).reduce((s,x)=>s+(x.splitCash||0),0);
  const expectedCash = cashSales + splitCash;
  const variance   = parseFloat(tillCount||0) - expectedCash;

  const doClose = () => {
    if (!tillCount) { notify('Enter till count.','error'); return; }
    const report = {
      date: today, closedAt: new Date().toISOString(),
      tillCount: parseFloat(tillCount), expectedCash, variance,
      totalRevenue: todayRev, cashSales, momoSales,
      salesCount: sales.filter(s=>s.date===today&&!s.refunded).length,
      note: closeNote,
    };
    setClosedDays(prev => [report, ...prev]);
    setShowClose(false); setTillCount(''); setCloseNote('');
    notify(`Day closed. Variance: ${variance>=0?'+':''}${C}${variance.toFixed(2)}`);
    // If sales/staff role has active shift, prompt to clock out
    if (activeShift && onClockOut && ['sales','staff'].includes(currentUser?.role)) {
      setTimeout(() => {
        if (window.confirm('End-of-Day complete! \n\nYou may now clock out.\n\nPress OK to clock out now.')) {
          // Clear the gate so clockOut proceeds directly
          onClockOut(true); // pass true = skip end-of-day gate
        }
      }, 500);
    }
  };

  const PAY_ICON = { cash:'C', mobile_money:'M', split:'S', credit:'CR', card:'K' };
  const PAY_LABEL = { cash:'Cash', mobile_money:'Mobile Money', split:'Split', credit:'Credit', card:'Card' };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-sub">{list.length} transactions · {C}{totalRev.toFixed(2)}</p>
        </div>
        <button onClick={()=>setShowClose(true)} className="btn-secondary text-xs px-3 min-h-[38px] gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          End-of-Day Close
        </button>
      </div>

      {/* Today summary strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[[`${C}${todayRev.toFixed(0)}`,'Today Revenue','#059669'],[`${C}${cashSales.toFixed(0)}`,'Cash','#4f46e5'],[`${C}${momoSales.toFixed(0)}`,'MoMo','#7c3aed']].map(([v,l,c])=>(
          <div key={l} className="card p-3 text-center">
            <div className="font-bold leading-none" style={{fontSize:'1rem',color:c}}>{v}</div>
            <div className="text-gray-400 font-medium mt-0.5" style={{fontSize:'0.6875rem'}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by ID, customer, cashier..." className="inp pl-9"/>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
        {[['all','All'],['today','Today'],['yesterday','Yesterday'],['week','This Week']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            className={`flex-shrink-0 px-3.5 py-2 rounded-full font-medium transition-all ${filter===k?'text-white':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
            style={{fontSize:'0.75rem',...(filter===k?{background:accent}:{})}}>
            {l}
          </button>
        ))}
      </div>

      {/* Closed day reports */}
      {closedDays.length>0&&filter==='today'&&(
        <div className="mb-4 space-y-2">
          {closedDays.filter(d=>d.date===today).map((d,i)=>(
            <div key={i} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>Day Close Report · {d.date}</div>
                <span className={`badge ${d.variance>=0?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600':'bg-red-100 dark:bg-red-900/30 text-red-500'}`}>
                  Variance: {d.variance>=0?'+':''}{C}{d.variance.toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[[`${C}${d.totalRevenue.toFixed(0)}`,'Total'],[`${C}${d.expectedCash.toFixed(0)}`,'Expected Cash'],[`${C}${d.tillCount.toFixed(0)}`,'Till Count']].map(([v,l])=>(
                  <div key={l}><div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>{v}</div><div className="text-gray-400" style={{fontSize:'0.6875rem'}}>{l}</div></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sale list */}
      <div className="space-y-2">
        {list.length===0&&<div className="text-center py-12 text-gray-400" style={{fontSize:'0.875rem'}}>No sales found.</div>}
        {list.map(s=>(
          <div key={s.id} className={`card overflow-hidden ${s.isRefund?'border-red-200 dark:border-red-900':''}`}>
            <button onClick={()=>setSel(sel?.id===s.id?null:s)} className="w-full flex items-center gap-3 p-4 text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${s.isRefund?'bg-red-100 dark:bg-red-900/30 text-red-500':'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600'}`} style={{fontSize:'0.6875rem'}}>
                {s.isRefund?'REF':PAY_ICON[s.payment]||'?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{color:s.isRefund?'#dc2626':'#4f46e5'}}>{s.id}</div>
                <div className="text-gray-400 truncate" style={{fontSize:'0.75rem'}}>{s.date} {s.time} · {s.customer} · {s.cashier}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`font-black ${s.isRefund?'text-red-500':'text-emerald-600'}`} style={{fontSize:'0.875rem'}}>
                  {s.isRefund?'-':''}{C}{Math.abs(s.total).toFixed(2)}
                </div>
                <svg className={`w-4 h-4 text-gray-400 transition-transform ${sel?.id===s.id?'rotate-180':''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
            </button>
            {sel?.id===s.id&&(
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <div className="text-gray-400 pt-3 mb-3" style={{fontSize:'0.75rem'}}>
                  Cashier: {s.cashier} · {PAY_LABEL[s.payment]||s.payment}
                </div>
                {s.items.map((item,i)=>(
                  <div key={i} className="flex justify-between mb-1.5" style={{fontSize:'0.8125rem'}}>
                    <span className="text-gray-500">{item.name} ×{item.qty}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{C}{(item.price*item.qty).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 space-y-1">
                  {s.discount>0&&<div className="flex justify-between text-emerald-600" style={{fontSize:'0.75rem'}}><span>Discount</span><span>-{C}{s.discount.toFixed(2)}</span></div>}
                  {s.loyaltyRedeemed>0&&<div className="flex justify-between text-indigo-600" style={{fontSize:'0.75rem'}}><span>Loyalty</span><span>-{C}{s.loyaltyRedeemed.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-gray-400" style={{fontSize:'0.75rem'}}><span>Tax</span><span>{C}{s.tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}><span>Total</span><span className="text-emerald-600">{C}{Math.abs(s.total).toFixed(2)}</span></div>
                </div>
                {s.payment==='mobile_money'&&s.momoName&&<div className="mt-2 text-gray-400 p-2 bg-white dark:bg-gray-900 rounded-lg" style={{fontSize:'0.6875rem'}}>MoMo: {s.momoName} · {s.momoTxnId}</div>}
                {s.payment==='split'&&<div className="mt-2 text-gray-400 p-2 bg-white dark:bg-gray-900 rounded-lg" style={{fontSize:'0.6875rem'}}>Cash: {C}{s.splitCash?.toFixed(2)} · MoMo: {C}{s.splitMoMo?.toFixed(2)}</div>}
                {s.payment==='credit'&&<div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 font-medium" style={{fontSize:'0.6875rem'}}>On credit tab</div>}

                {/* Refund button — only on non-refund sales */}
                {!s.isRefund&&setSales&&(
                  <button onClick={()=>handleRefund(s,false)}
                    className="mt-3 w-full py-2 rounded-xl border border-red-200 dark:border-red-800 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    style={{fontSize:'0.8125rem'}}>
                    Process Full Refund · {C}{s.total.toFixed(2)}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* End-of-Day Close Modal */}
      {showClose&&(
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-3">
              <div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem'}}>End-of-Day Close</div>
              <button onClick={()=>setShowClose(false)} className="btn-ghost w-8 h-8">✕</button>
            </div>
            <div className="px-5 pb-8 space-y-4">
              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-2">
                <div className="font-semibold text-gray-900 dark:text-white mb-2" style={{fontSize:'0.875rem'}}>Today's Summary — {today}</div>
                {[
                  ['Total Revenue', `${C}${todayRev.toFixed(2)}`],
                  ['Cash Sales', `${C}${cashSales.toFixed(2)}`],
                  ['MoMo Sales', `${C}${momoSales.toFixed(2)}`],
                  ['Expected in Till', `${C}${expectedCash.toFixed(2)}`],
                  ['Transactions', sales.filter(s=>s.date===today&&!s.refunded).length],
                ].map(([l,v])=>(
                  <div key={l} className="flex justify-between" style={{fontSize:'0.8125rem'}}>
                    <span className="text-gray-500">{l}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{v}</span>
                  </div>
                ))}
              </div>

              <div>
                <label className="lbl">Actual Till Count ({C}) *</label>
                <input type="number" inputMode="decimal" value={tillCount} onChange={e=>setTillCount(e.target.value)} placeholder="Count and enter cash in drawer" className="inp"/>
                {tillCount&&(
                  <div className={`mt-1.5 font-bold ${variance>=0?'text-emerald-600':'text-red-500'}`} style={{fontSize:'0.875rem'}}>
                    Variance: {variance>=0?'+':''}{C}{variance.toFixed(2)} {variance>=0?'(overage)':'(shortage)'}
                  </div>
                )}
              </div>

              <div>
                <label className="lbl">Notes (optional)</label>
                <input value={closeNote} onChange={e=>setCloseNote(e.target.value)} placeholder="Any issues, notes..." className="inp"/>
              </div>

              <div className="flex gap-3">
                <button onClick={()=>setShowClose(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={doClose} className="btn-primary flex-1" style={{background:accent}}>Close Day</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
