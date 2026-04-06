import React, { useState, useCallback } from 'react';

// NotificationService — replace these with real imports once src/services/ is set up
// import { broadcastMessage, loadConfig } from '../services/NotificationService';
const loadConfig = () => ({});
const broadcastMessage = null; // set to real function once services folder exists

const GROUPS = ['All Customers', 'VIP', 'Wholesale', 'Regular', 'Retail'];
const GROUP_COLOR = { VIP:'#7c5cbf', Wholesale:'#0891b2', Regular:'#059669', Retail:'#b8962e' };

export default function CustomersView({ customers, setCustomers, sales, notify, storeSettings, appearance }) {
  const [search,        setSearch]        = useState('');
  const [group,         setGroup]         = useState('All Customers');
  const [showModal,     setShowModal]     = useState(false);
  const [editC,         setEditC]         = useState(null);
  const [form,          setForm]          = useState({});
  const [showCredit,    setShowCredit]    = useState(null);
  const [creditAmt,     setCreditAmt]     = useState('');
  const [creditNote,    setCreditNote]    = useState('');
  const [showMarketing, setShowMarketing] = useState(false);
  const [mktMsg,        setMktMsg]        = useState('');
  const [mktTarget,     setMktTarget]     = useState('All Customers');
  const [mktChannels,   setMktChannels]   = useState({ whatsapp:true, sms:false, email:true });
  const [tab,           setTab]           = useState('customers');
  const [broadcasting,  setBroadcasting]  = useState(false);
  const [broadcastLog,  setBroadcastLog]  = useState([]);
  const [broadcastDone, setBroadcastDone] = useState(false);
  const [progress,      setProgress]      = useState({ current:0, total:0, name:'' });

  const C      = storeSettings?.currency || 'GH';
  const accent = appearance?.accentColor || '#7c5cbf';
  const gold   = '#b8962e';

  const filtered = customers.filter(c => {
    const ms = c.name.toLowerCase().includes(search.toLowerCase()) ||
               c.phone.includes(search) ||
               (c.email||'').toLowerCase().includes(search.toLowerCase());
    const mg = group === 'All Customers' || c.group === group;
    return ms && mg;
  });

  const getCustSales   = name => sales.filter(s => s.customer === name && !s.isRefund);
  const totalLoyalty   = customers.reduce((s, c) => s + (c.loyaltyPoints||0), 0);
  const totalCredit    = customers.reduce((s, c) => s + (c.creditBalance||0), 0);
  const creditCustomers = customers.filter(c => (c.creditBalance||0) > 0).sort((a,b) => (b.creditBalance||0)-(a.creditBalance||0));

  const openAdd  = () => { setEditC(null); setForm({name:'',phone:'',email:'',group:'Regular',loyaltyPoints:0,totalSpent:0,creditBalance:0,joinDate:new Date().toISOString().split('T')[0]}); setShowModal(true); };
  const openEdit = c  => { setEditC(c); setForm({...c}); setShowModal(true); };

  const handleSave = () => {
    if (!form.name || !form.phone) { notify('Name and phone required.', 'error'); return; }
    if (editC) {
      setCustomers(p => p.map(c => c.id === editC.id ? {...c, ...form} : c));
      notify('Customer updated.');
    } else {
      const id = `C${String(customers.length + 1).padStart(3, '0')}`;
      setCustomers(p => [...p, {...form, id, loyaltyPoints:0, totalSpent:0, creditBalance:0}]);
      notify('Customer added.');
    }
    setShowModal(false);
  };

  const handleDelete = id => { setCustomers(p => p.filter(c => c.id !== id)); notify('Customer removed.'); };

  /* ── Credit payment ── */
  const recordCreditPayment = () => {
    if (!creditAmt || isNaN(parseFloat(creditAmt))) { notify('Enter payment amount.', 'error'); return; }
    const amt = parseFloat(creditAmt);
    setCustomers(p => p.map(c => c.id === showCredit ? {...c, creditBalance: Math.max(0, (c.creditBalance||0) - amt)} : c));
    setShowCredit(null); setCreditAmt(''); setCreditNote('');
    notify(`Credit payment of ${C}${amt.toFixed(2)} recorded.`);
  };

  /* ── Marketing broadcast ── */
  const getTargets = () => mktTarget === 'All Customers'
    ? customers
    : customers.filter(c => c.group === mktTarget);

  const handleBroadcast = useCallback(async () => {
    if (!mktMsg.trim()) { notify('Enter a message.', 'error'); return; }
    const targets  = getTargets();
    const channels = Object.entries(mktChannels).filter(([,on]) => on).map(([k]) => k);
    if (channels.length === 0) { notify('Select at least one channel.', 'error'); return; }
    if (targets.length === 0)  { notify('No customers in selected group.', 'error'); return; }

    const cfg = loadConfig();
    const hasAPI = cfg.whatsapp_enabled || cfg.africastalking_enabled || cfg.hubtel_enabled || cfg.emailjs_service_id;

    if (!hasAPI) {
      notify('No notification APIs configured. Configure them in Settings → Notifications.', 'warning');
      // Fallback: native SMS/WhatsApp for first customer
      const first = targets.find(c => c.phone);
      if (first && channels.includes('whatsapp')) {
        window.open(`https://wa.me/${first.phone.replace(/\D/g,'')}?text=${encodeURIComponent(mktMsg)}`, '_blank');
      } else if (first && channels.includes('sms')) {
        window.open(`sms:${first.phone}?body=${encodeURIComponent(mktMsg)}`);
      }
      return;
    }

    setBroadcasting(true);
    setBroadcastLog([]);
    setBroadcastDone(false);
    setProgress({ current:0, total:targets.length, name:'' });

    const results = await broadcastMessage({
      customers: targets,
      message:   mktMsg,
      channels,
      onProgress: (current, total, name) => setProgress({ current, total, name }),
    });

    setBroadcastLog(results);
    setBroadcasting(false);
    setBroadcastDone(true);

    const sent  = results.filter(r => r.ok).length;
    const total = results.length;
    notify(`Broadcast complete: ${sent}/${total} delivered.`, sent > 0 ? 'success' : 'warning');
  }, [mktMsg, mktTarget, mktChannels, customers, notify]);

  const CHANNEL_ICONS = {
    whatsapp: { label:'WhatsApp', color:'#25D366', icon:<svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M20.52 3.449C12.831-3.984.106 1.407.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a11.956 11.956 0 005.682 1.444h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.395-8.45zm-8.53 18.31a9.926 9.926 0 01-5.031-1.378l-.361-.214-3.741.981.999-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.89 9.884z"/></svg> },
    sms:      { label:'SMS',      color:'#f59e0b', icon:<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
    email:    { label:'Email',    color:'#4f46e5', icon:<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> },
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-sub">{customers.length} registered · {totalLoyalty.toLocaleString()} loyalty pts · {C}{totalCredit.toFixed(0)} outstanding</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowMarketing(true); setBroadcastDone(false); setBroadcastLog([]); }}
            className="btn-secondary text-xs px-3 min-h-[38px] gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
            Broadcast
          </button>
          <button onClick={openAdd} className="btn-primary text-sm px-4 min-h-[38px]" style={{background:accent}}>+ Add</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-stone-200 dark:border-gray-800">
        {[['customers','Customers'],['credit','Credit Tab']].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`px-4 py-2.5 font-semibold border-b-2 -mb-px transition-all ${tab===k?'border-current':'border-transparent text-gray-400 hover:text-gray-600'}`}
            style={{fontSize:'0.8125rem',...(tab===k?{color:accent,borderColor:accent}:{})}}>
            {l}{k==='credit'&&totalCredit>0?` · ${C}${totalCredit.toFixed(0)}`:``}
          </button>
        ))}
      </div>

      {/* ── CREDIT TAB ── */}
      {tab === 'credit' && (
        <div className="space-y-3">
          {creditCustomers.length===0 && <div className="text-center py-12 text-gray-400 text-sm">No outstanding credit balances.</div>}
          {creditCustomers.map(c => (
            <div key={c.id} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center font-bold text-base flex-shrink-0">{c.name.charAt(0)}</div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">{c.name}</div>
                    <div className="text-gray-400 text-xs">{c.phone}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-600" style={{fontSize:'1rem'}}>{C}{(c.creditBalance||0).toFixed(2)}</div>
                  <div className="text-gray-400" style={{fontSize:'0.625rem'}}>OWES</div>
                </div>
              </div>
              {showCredit===c.id ? (
                <div className="mt-3 space-y-2">
                  <input type="number" inputMode="decimal" value={creditAmt} onChange={e=>setCreditAmt(e.target.value)} placeholder={`Payment amount (max ${C}${(c.creditBalance||0).toFixed(2)})`} className="inp"/>
                  <input value={creditNote} onChange={e=>setCreditNote(e.target.value)} placeholder="Note (optional)" className="inp"/>
                  <div className="flex gap-2">
                    <button onClick={()=>setShowCredit(null)} className="btn-secondary flex-1 text-sm">Cancel</button>
                    <button onClick={recordCreditPayment} className="flex-1 min-h-[40px] rounded-xl font-semibold text-white text-sm" style={{background:'#059669'}}>Record Payment</button>
                  </div>
                </div>
              ) : (
                <button onClick={()=>{setShowCredit(c.id);setCreditAmt('');}} className="mt-3 w-full py-2 rounded-xl border border-emerald-200 dark:border-emerald-800 text-emerald-600 font-semibold hover:bg-emerald-50 transition-colors text-sm">
                  Record Payment
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── CUSTOMERS TAB ── */}
      {tab === 'customers' && (
        <>
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, phone or email…" className="inp pl-9"/>
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-2 mb-4">
            {GROUPS.map(g=>(
              <button key={g} onClick={()=>setGroup(g)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full font-medium transition-all text-xs ${group===g?'text-white':'bg-stone-100 dark:bg-gray-800 text-gray-500'}`}
                style={group===g?{background:GROUP_COLOR[g]||accent}:{}}>
                {g}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map(c => {
              const cSales     = getCustSales(c.name);
              const groupColor = GROUP_COLOR[c.group] || '#6b7280';
              return (
                <div key={c.id} className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-base flex-shrink-0" style={{background:groupColor}}>{c.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{c.name}</div>
                        {c.group && c.group!=='Regular' && <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full" style={{background:`${groupColor}20`,color:groupColor}}>{c.group}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button onClick={()=>openEdit(c)} className="btn-secondary min-h-[32px] px-2.5 text-xs">Edit</button>
                      <button onClick={()=>handleDelete(c.id)} className="btn-danger min-h-[32px] px-2 text-xs">Del</button>
                    </div>
                  </div>
                  <div className="text-gray-400 space-y-0.5 mb-3 text-xs"><div>{c.phone}</div>{c.email&&<div>{c.email}</div>}</div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      [`${C}${(c.totalSpent||0).toFixed(0)}`, 'Spent', '#059669'],
                      [c.loyaltyPoints||0, 'Points', accent],
                      [cSales.length, 'Orders', gold],
                      [(c.creditBalance||0)>0?`${C}${(c.creditBalance||0).toFixed(0)}`:'-', 'Credit', '#d97706'],
                    ].map(([v,l,col]) => (
                      <div key={l} className="bg-stone-50 dark:bg-gray-800 rounded-xl p-2 text-center">
                        <div className="font-bold leading-none" style={{color:col,fontSize:'0.8125rem'}}>{v}</div>
                        <div className="text-gray-400 font-medium mt-0.5" style={{fontSize:'0.5rem'}}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {(c.creditBalance||0)>0&&(
                    <button onClick={()=>setShowCredit(c.id)} className="mt-2 w-full py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 text-amber-600 font-medium hover:bg-amber-50 transition-colors text-xs">
                      Owes {C}{(c.creditBalance||0).toFixed(2)} — Record payment
                    </button>
                  )}
                </div>
              );
            })}
            {filtered.length===0&&<div className="col-span-full text-center py-12 text-gray-400 text-sm">No customers found.</div>}
          </div>
        </>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto slide-up">
            <div className="flex justify-center pt-3"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-4">
              <div className="font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>{editC?'Edit Customer':'Add Customer'}</div>
              <button onClick={()=>setShowModal(false)} className="btn-ghost w-8 h-8">✕</button>
            </div>
            <div className="px-5 pb-8 space-y-4">
              {[['name','Full Name *','text'],['phone','Phone *','tel'],['email','Email','email']].map(([k,l,t])=>(
                <div key={k}><label className="lbl">{l}</label><input type={t} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="inp"/></div>
              ))}
              <div>
                <label className="lbl">Customer Group</label>
                <div className="grid grid-cols-3 gap-2">
                  {GROUPS.filter(g=>g!=='All Customers').map(g=>(
                    <button key={g} type="button" onClick={()=>setForm(p=>({...p,group:g}))}
                      className="py-2 rounded-xl border-2 font-medium transition-all text-xs"
                      style={{borderColor:form.group===g?(GROUP_COLOR[g]||accent):'#e5e7eb',background:form.group===g?`${GROUP_COLOR[g]||accent}12`:'',color:form.group===g?(GROUP_COLOR[g]||accent):'#6b7280'}}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={()=>setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} className="flex-1 min-h-[44px] rounded-xl font-semibold text-white" style={{background:accent}}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BROADCAST MODAL ── */}
      {showMarketing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto slide-up">
            <div className="flex justify-center pt-3"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-4 border-b border-stone-100 dark:border-gray-800">
              <div>
                <div className="font-bold text-gray-900 dark:text-white" style={{fontFamily:'Georgia, serif'}}>Broadcast Message</div>
                <div className="text-gray-400 text-xs mt-0.5">Send to customers via WhatsApp, SMS, or Email</div>
              </div>
              <button onClick={()=>setShowMarketing(false)} className="btn-ghost w-8 h-8">✕</button>
            </div>

            <div className="px-5 pb-8 space-y-4 pt-4">
              {/* Target group */}
              <div>
                <label className="lbl">Send To</label>
                <select value={mktTarget} onChange={e=>setMktTarget(e.target.value)} className="inp">
                  {GROUPS.map(g=><option key={g}>{g}</option>)}
                </select>
                <div className="text-gray-400 text-xs mt-1">
                  {getTargets().length} customers selected · {getTargets().filter(c=>c.phone).length} with phone · {getTargets().filter(c=>c.email).length} with email
                </div>
              </div>

              {/* Channels */}
              <div>
                <label className="lbl">Channels</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(CHANNEL_ICONS).map(([key, ch]) => (
                    <button key={key}
                      onClick={() => setMktChannels(p => ({...p, [key]: !p[key]}))}
                      className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all"
                      style={{
                        borderColor: mktChannels[key] ? ch.color : '#e5e7eb',
                        background:  mktChannels[key] ? `${ch.color}12` : '',
                        color:       mktChannels[key] ? ch.color : '#9ca3af',
                      }}>
                      {ch.icon}
                      <span className="font-semibold" style={{fontSize:'0.6875rem'}}>{ch.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="lbl mb-0">Message *</label>
                  <span className="text-gray-400" style={{fontSize:'0.6875rem'}}>{mktMsg.length}/500</span>
                </div>
                <textarea
                  value={mktMsg}
                  onChange={e=>setMktMsg(e.target.value.slice(0,500))}
                  placeholder="Type your promotional message here…"
                  rows={4}
                  className="inp resize-none"
                  style={{minHeight:'100px'}}
                />
                {/* Template suggestions */}
                <div className="flex gap-2 mt-2 overflow-x-auto scrollbar-hide pb-1">
                  {[
                    'Thank you for shopping with us! We appreciate your support 🙏',
                    '🎉 Special offer: 10% off your next purchase! Visit us today.',
                    'We have new stock available! Come in and check out our latest products.',
                  ].map((t,i) => (
                    <button key={i} onClick={() => setMktMsg(t)}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full bg-stone-100 dark:bg-gray-800 text-gray-500 hover:bg-stone-200 dark:hover:bg-gray-700 transition-colors"
                      style={{fontSize:'0.6875rem'}}>
                      Template {i+1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress during broadcast */}
              {broadcasting && (
                <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full animate-pulse" style={{background:accent}}/>
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300">Sending…</span>
                  </div>
                  <div className="text-gray-400 text-xs">{progress.name} ({progress.current}/{progress.total})</div>
                  <div className="h-1.5 bg-stone-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-300" style={{width:`${progress.total>0?(progress.current/progress.total)*100:0}%`,background:accent}}/>
                  </div>
                </div>
              )}

              {/* Broadcast results */}
              {broadcastDone && broadcastLog.length > 0 && (
                <div className="bg-stone-50 dark:bg-gray-800 rounded-xl p-4 space-y-2 max-h-48 overflow-y-auto">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white mb-2" style={{fontFamily:'Georgia, serif'}}>
                    Results: {broadcastLog.filter(r=>r.ok).length}/{broadcastLog.length} sent
                  </div>
                  {broadcastLog.slice(0,20).map((r,i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${r.ok?'bg-emerald-500':'bg-amber-400'}`}/>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{r.customer}</span>
                      <span className="text-gray-400">{r.channel}</span>
                      {!r.ok && r.fallback && <span className="text-amber-500">app opened</span>}
                      {!r.ok && !r.fallback && <span className="text-red-500">failed</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={()=>setShowMarketing(false)} className="btn-secondary flex-1">Close</button>
                {!broadcastDone && (
                  <button
                    onClick={handleBroadcast}
                    disabled={broadcasting || !mktMsg.trim()}
                    className="flex-1 min-h-[44px] rounded-xl font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60"
                    style={{background:accent}}>
                    {broadcasting ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full spin"/>Sending…</>
                    ) : (
                      <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>Send Broadcast</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
