// ── SalesView ─────────────────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';

export function SalesView({ sales, storeSettings }) {
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');
  const [sel,     setSel]     = useState(null);
  const C = storeSettings?.currency||'GH';

  const today     = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now()-86400000).toISOString().split('T')[0];
  const weekAgo   = new Date(Date.now()-7*86400000).toISOString().split('T')[0];

  const list = sales.filter(s=>{
    const ms = s.id.toLowerCase().includes(search.toLowerCase())||s.customer.toLowerCase().includes(search.toLowerCase());
    const md = filter==='all'||filter==='today'&&s.date===today||filter==='yesterday'&&s.date===yesterday||filter==='week'&&s.date>=weekAgo;
    return ms&&md;
  });
  const totalRev = list.reduce((s,x)=>s+x.total,0);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-4">
        <div className="text-lg font-black text-gray-900 dark:text-white">Sales History</div>
        <div className="text-xs text-gray-400">{list.length} transactions · {C}{totalRev.toFixed(2)}</div>
      </div>
      <div className="relative mb-3">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="inp pl-9"/>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
        {[['all','All'],['today','Today'],['yesterday','Yesterday'],['week','Week']].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)} className={`flex-shrink-0 px-3.5 py-2 rounded-full text-xs font-bold ${filter===k?'bg-indigo-500 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{l}</button>
        ))}
      </div>
      <div className="space-y-2">
        {list.map(s=>(
          <div key={s.id} className="card overflow-hidden">
            <button onClick={()=>setSel(sel?.id===s.id?null:s)} className="w-full flex items-center gap-3 p-4 text-left">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 font-black text-xs flex-shrink-0">
                {{cash:'C',mobile_money:'M'}[s.payment]||'?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-indigo-500">{s.id}</div>
                <div className="text-xs text-gray-400 truncate">{s.date} {s.time} · {s.customer}</div>
              </div>
              <div className="font-black text-emerald-500 flex-shrink-0">{C}{s.total.toFixed(2)}</div>
            </button>
            {sel?.id===s.id&&(
              <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-800 text-sm border-t border-gray-100 dark:border-gray-700">
                <div className="text-xs text-gray-400 mb-3 pt-3">Cashier: {s.cashier} · {s.payment.replace('_',' ')}</div>
                {s.items.map((i,idx)=><div key={idx} className="flex justify-between mb-1.5"><span className="text-gray-500">{i.name} ×{i.qty}</span><span className="font-semibold">{C}{(i.price*i.qty).toFixed(2)}</span></div>)}
                <div className="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2 space-y-1">
                  {s.discount>0&&<div className="flex justify-between text-emerald-500 text-xs"><span>Discount</span><span>-{C}{s.discount.toFixed(2)}</span></div>}
                  <div className="flex justify-between text-xs text-gray-400"><span>Tax</span><span>{C}{s.tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-black"><span>Total</span><span className="text-emerald-500">{C}{s.total.toFixed(2)}</span></div>
                </div>
                {s.payment==='mobile_money'&&s.momoName&&<div className="mt-2 text-xs text-gray-400">MoMo: {s.momoName} · {s.momoTxnId}</div>}
              </div>
            )}
          </div>
        ))}
        {list.length===0&&<div className="text-center py-12 text-gray-400 text-sm">No sales found.</div>}
      </div>
    </div>
  );
}

// ── CustomersView ─────────────────────────────────────────────────────────────
export function CustomersView({ customers, setCustomers, sales, notify }) {
  const [search,setSearch]=useState('');
  const [modal, setModal] =useState(false);
  const [edit,  setEdit]  =useState(null);
  const [form,  setForm]  =useState({});

  const list = customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search)||(c.email||'').toLowerCase().includes(search.toLowerCase()));

  const openAdd  = ()  => { setEdit(null); setForm({name:'',phone:'',email:'',loyaltyPoints:0,totalSpent:0,joinDate:new Date().toISOString().split('T')[0],storeId:'ST001'}); setModal(true); };
  const openEdit = (c) => { setEdit(c); setForm({...c}); setModal(true); };
  const save = () => {
    if (!form.name||!form.phone){notify('Name and phone required.','error');return;}
    if (edit) { setCustomers(p=>p.map(c=>c.id===edit.id?{...c,...form}:c)); notify('Customer updated.'); }
    else { const id=`C${String(customers.length+1).padStart(3,'0')}`; setCustomers(p=>[...p,{...form,id,loyaltyPoints:0,totalSpent:0}]); notify('Customer added.'); }
    setModal(false);
  };
  const del = id => { setCustomers(p=>p.filter(c=>c.id!==id)); notify('Customer removed.'); };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div><div className="text-lg font-black text-gray-900 dark:text-white">Customers</div><div className="text-xs text-gray-400">{customers.length} registered</div></div>
        <button onClick={openAdd} className="btn-primary text-sm">+ Add</button>
      </div>
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="inp pl-9"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(c=>{
          const cSales=sales.filter(s=>s.customer===c.name);
          return(
            <div key={c.id} className="card p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center font-black text-base flex-shrink-0">{c.name.charAt(0)}</div>
                  <div><div className="font-bold text-sm text-gray-900 dark:text-white">{c.name}</div><div className="text-[10px] text-gray-400">{c.id}</div></div>
                </div>
                <div className="flex gap-1">
                  <button onClick={()=>openEdit(c)} className="btn-secondary text-[11px] px-2 min-h-[32px]">Edit</button>
                  <button onClick={()=>del(c.id)} className="btn-danger text-[11px] px-2 min-h-[32px]">Del</button>
                </div>
              </div>
              <div className="text-xs text-gray-400 space-y-0.5 mb-3"><div>{c.phone}</div><div>{c.email}</div></div>
              <div className="grid grid-cols-3 gap-2">
                {[['Spent',`GH${c.totalSpent.toFixed(0)}`,'#10b981'],['Points',c.loyaltyPoints,'#6366f1'],['Orders',cSales.length,'#8b5cf6']].map(([l,v,col])=>(
                  <div key={l} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-2 text-center">
                    <div className="text-sm font-black" style={{color:col}}>{v}</div>
                    <div className="text-[9px] text-gray-400 font-semibold uppercase">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {modal&&<BottomModal title={edit?'Edit Customer':'Add Customer'} onClose={()=>setModal(false)}>
        <div className="space-y-3">
          {[['name','Full Name *','text'],['phone','Phone *','tel'],['email','Email','email']].map(([k,l,t])=>(
            <div key={k}><label className="lbl">{l}</label><input type={t} inputMode={t==='tel'?'tel':'text'} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="inp"/></div>
          ))}
          <div className="flex gap-3 pt-2"><button onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancel</button><button onClick={save} className="btn-primary flex-1">Save</button></div>
        </div>
      </BottomModal>}
    </div>
  );
}

// ── SuppliersView ─────────────────────────────────────────────────────────────
export function SuppliersView({ suppliers, setSuppliers, notify }) {
  const [search,setSearch]=useState('');
  const [modal, setModal] =useState(false);
  const [edit,  setEdit]  =useState(null);
  const [form,  setForm]  =useState({});

  const list=suppliers.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||s.contact.includes(search));
  const openAdd  = ()  => { setEdit(null); setForm({name:'',contact:'',email:'',address:'',notes:''}); setModal(true); };
  const openEdit = (s) => { setEdit(s); setForm({...s}); setModal(true); };
  const save = () => {
    if (!form.name||!form.contact){notify('Name and contact required.','error');return;}
    if (edit){setSuppliers(p=>p.map(s=>s.id===edit.id?{...s,...form}:s));notify('Supplier updated.');}
    else{const id=`SUP${String(suppliers.length+1).padStart(3,'0')}`;setSuppliers(p=>[...p,{...form,id}]);notify('Supplier added.');}
    setModal(false);
  };
  const del = id => { setSuppliers(p=>p.filter(s=>s.id!==id)); notify('Supplier removed.'); };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div><div className="text-lg font-black text-gray-900 dark:text-white">Suppliers</div><div className="text-xs text-gray-400">{suppliers.length} suppliers</div></div>
        <button onClick={openAdd} className="btn-primary text-sm">+ Add</button>
      </div>
      <div className="relative mb-4">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="inp pl-9"/>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map(s=>(
          <div key={s.id} className="card p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 flex items-center justify-center font-black text-base">{s.name.charAt(0)}</div>
                <div><div className="font-bold text-sm text-gray-900 dark:text-white">{s.name}</div><div className="text-[10px] text-gray-400 font-mono">{s.id}</div></div>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>openEdit(s)} className="btn-secondary text-[11px] px-2 min-h-[32px]">Edit</button>
                <button onClick={()=>del(s.id)} className="btn-danger text-[11px] px-2 min-h-[32px]">Del</button>
              </div>
            </div>
            <div className="text-xs text-gray-400 space-y-0.5">
              <div>{s.contact}</div>
              {s.email&&<div>{s.email}</div>}
              {s.address&&<div>{s.address}</div>}
            </div>
          </div>
        ))}
        {list.length===0&&<div className="col-span-full text-center py-12 text-gray-400 text-sm">No suppliers found.</div>}
      </div>
      {modal&&<BottomModal title={edit?'Edit Supplier':'Add Supplier'} onClose={()=>setModal(false)}>
        <div className="space-y-3">
          {[['name','Company Name *','text'],['contact','Phone *','tel'],['email','Email','email'],['address','Address','text'],['notes','Notes','text']].map(([k,l,t])=>(
            <div key={k}><label className="lbl">{l}</label><input type={t} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="inp"/></div>
          ))}
          <div className="flex gap-3 pt-2"><button onClick={()=>setModal(false)} className="btn-secondary flex-1">Cancel</button><button onClick={save} className="btn-primary flex-1">Save</button></div>
        </div>
      </BottomModal>}
    </div>
  );
}

// ── ReportsView ───────────────────────────────────────────────────────────────
export function ReportsView({ sales, products, customers, storeSettings }) {
  const [period,setPeriod]=useState('week');
  const C=storeSettings?.currency||'GH';

  const cut  = new Date(Date.now()-{today:1,week:7,month:30,year:365}[period]*86400000);
  const ps   = sales.filter(s=>new Date(s.date)>=cut);
  const rev  = ps.reduce((s,x)=>s+x.total,0);
  const disc = ps.reduce((s,x)=>s+x.discount,0);
  const avg  = ps.length?rev/ps.length:0;

  const byDay={};
  ps.forEach(s=>{byDay[s.date]=(byDay[s.date]||0)+s.total;});
  const days=Object.entries(byDay).sort((a,b)=>a[0].localeCompare(b[0])).slice(-7);
  const maxD=Math.max(...days.map(([,v])=>v),1);

  const byCat={};
  ps.forEach(s=>s.items.forEach(i=>{const p=products.find(x=>x.name===i.name);const c=p?.category||'Other';byCat[c]=(byCat[c]||0)+i.qty*i.price;}));
  const cats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  const totC=cats.reduce((s,[,v])=>s+v,0);

  const byPay={};
  ps.forEach(s=>{byPay[s.payment]=(byPay[s.payment]||0)+s.total;});

  const colors=['#6366f1','#10b981','#f59e0b','#ef4444','#06b6d4','#8b5cf6'];

  const dlCSV=()=>{
    const h=['Sale ID','Date','Time','Cashier','Customer','Payment','Total'];
    const rows=ps.map(s=>[s.id,s.date,s.time,s.cashier,s.customer,s.payment,s.total]);
    const csv=[h.join(','),...rows.map(r=>r.map(v=>`"${v}"`).join(','))].join('\n');
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=`report_${period}.csv`;a.click();
  };

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><div className="text-lg font-black text-gray-900 dark:text-white">Reports</div><div className="text-xs text-gray-400">Performance overview</div></div>
        <div className="flex gap-2">
          <button onClick={dlCSV} className="btn-secondary text-xs px-3 min-h-[40px]">Export CSV</button>
        </div>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {[['today','Today'],['week','Week'],['month','Month'],['year','Year']].map(([k,l])=>(
          <button key={k} onClick={()=>setPeriod(k)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold ${period===k?'bg-indigo-500 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{l}</button>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[[`${C}${rev.toFixed(0)}`,'Revenue','#10b981'],[ps.length,'Transactions','#6366f1'],[`${C}${avg.toFixed(0)}`,'Avg Order','#8b5cf6'],[`${C}${disc.toFixed(0)}`,'Discounts','#f59e0b']].map(([v,l,c])=>(
          <div key={l} className="card p-3 text-center"><div className="text-[10px] text-gray-400 font-bold uppercase mb-1">{l}</div><div className="text-xl font-black" style={{color:c}}>{v}</div></div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card p-4">
        <div className="font-bold text-sm text-gray-900 dark:text-white mb-4">Daily Revenue</div>
        {days.length===0?<div className="text-sm text-gray-400 text-center py-6">No data.</div>:(
          <div className="flex items-end gap-2 h-28">
            {days.map(([d,v])=>(
              <div key={d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <div className="text-[8px] text-gray-400 font-bold">{C}{v.toFixed(0)}</div>
                <div className="w-full rounded-t-lg min-h-[4px] bg-indigo-500" style={{height:`${(v/maxD)*100}%`}}/>
                <div className="text-[8px] text-gray-400">{d.slice(5)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Payment */}
        <div className="card p-4">
          <div className="font-bold text-sm text-gray-900 dark:text-white mb-3">Payment Methods</div>
          {Object.entries(byPay).map(([m,v],i)=>{
            const pct=rev?(v/rev)*100:0;
            return(<div key={m} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">{{cash:'Cash',mobile_money:'Mobile Money'}[m]||m}</span><span className="font-bold" style={{color:colors[i]}}>{pct.toFixed(0)}%</span></div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"><div className="h-full rounded-full" style={{width:`${pct}%`,background:colors[i]}}/></div>
            </div>);
          })}
          {Object.keys(byPay).length===0&&<div className="text-sm text-gray-400 py-3 text-center">No data.</div>}
        </div>
        {/* Categories */}
        <div className="card p-4">
          <div className="font-bold text-sm text-gray-900 dark:text-white mb-3">By Category</div>
          {cats.map(([c,v],i)=>{
            const pct=totC?(v/totC)*100:0;
            return(<div key={c} className="mb-3 last:mb-0">
              <div className="flex justify-between text-xs mb-1.5"><span className="font-semibold text-gray-700 dark:text-gray-300">{c}</span><span className="font-bold" style={{color:colors[i%colors.length]}}>{C}{v.toFixed(0)}</span></div>
              <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full"><div className="h-full rounded-full" style={{width:`${pct}%`,background:colors[i%colors.length]}}/></div>
            </div>);
          })}
          {cats.length===0&&<div className="text-sm text-gray-400 py-3 text-center">No data.</div>}
        </div>
      </div>
    </div>
  );
}

// ── ProfileCard (extracted to avoid hooks-in-map) ─────────────────────────────
function ProfileCard({ u, setUsers, notify, uploadPhoto }) {
  const [sig, setSig] = useState(u.signature || '');
  const [sid, setSid] = useState(u.staffId   || '');
  const pr = useRef();
  return (
    <div className="card p-4">
      <input ref={pr} type="file" accept="image/*" className="hidden" onChange={e => uploadPhoto(e, u.id)} />
      <div className="flex gap-4 items-start mb-4">
        <div className="relative flex-shrink-0 cursor-pointer" onClick={() => pr.current.click()}>
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border-2 border-gray-100 dark:border-gray-800">
            {u.photo ? <img src={u.photo} alt="" className="w-full h-full object-cover" /> : <span className="text-xl font-black text-indigo-500">{u.avatar}</span>}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">+</div>
        </div>
        <div>
          <div className="font-bold text-gray-900 dark:text-white">{u.name}</div>
          <div className="text-xs text-indigo-500 font-semibold capitalize">{{ superadmin:'Super Admin', admin:'Administrator', sales:'Sales Associate' }[u.role] || u.role}</div>
          <div className="text-xs text-gray-400">{u.email}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div><label className="lbl">Staff ID</label><input value={sid} onChange={e => setSid(e.target.value)} placeholder="EMP001" className="inp" /></div>
        <div><label className="lbl">Signature</label><input value={sig} onChange={e => setSig(e.target.value)} placeholder="Your name" className="inp" style={{ fontFamily: 'cursive' }} /></div>
      </div>
      <button onClick={() => { setUsers(p => p.map(x => x.id === u.id ? { ...x, signature: sig, staffId: sid } : x)); notify('Profile saved.'); }} className="btn-primary w-full text-sm">Save Profile</button>
    </div>
  );
}

// ── SettingsView ──────────────────────────────────────────────────────────────
export function SettingsView({ dark, setDark, currentUser, users, setUsers, storeSettings, setStoreSettings, notify }) {
  const [tab,   setTab]   = useState('store');
  const [store, setStore] = useState({...storeSettings});
  const [pwdForm,setPwdForm]=useState({userId:currentUser.id,cur:'',nw:'',cf:''});
  const [pwdErr,setPwdErr] =useState('');
  const photoRef = useRef();

  const saveStore=()=>{setStoreSettings({...store});notify('Settings saved.');};
  const changePwd=()=>{
    setPwdErr('');
    const u=users.find(x=>x.id===pwdForm.userId);
    if(!u){setPwdErr('User not found.');return;}
    if(u.password!==pwdForm.cur){setPwdErr('Current password incorrect.');return;}
    if(pwdForm.nw.length<6){setPwdErr('Min 6 characters.');return;}
    if(pwdForm.nw!==pwdForm.cf){setPwdErr('Passwords do not match.');return;}
    setUsers(p=>p.map(x=>x.id===pwdForm.userId?{...x,password:pwdForm.nw}:x));
    setPwdForm(f=>({...f,cur:'',nw:'',cf:''}));
    notify('Password updated.');
  };
  const uploadPhoto=(e,uid)=>{
    const f=e.target.files[0];if(!f)return;
    if(f.size>2*1024*1024){notify('Max 2MB.','error');return;}
    const r=new FileReader();r.onload=ev=>{setUsers(p=>p.map(u=>u.id===uid?{...u,photo:ev.target.result}:u));notify('Photo updated.');};r.readAsDataURL(f);e.target.value='';
  };

  const TABS=[['store','Store'],['appearance','Theme'],['profiles','Profiles'],['password','Password']];

  return(
    <div className="p-4 max-w-2xl mx-auto">
      <div className="text-lg font-black text-gray-900 dark:text-white mb-4">Settings</div>
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5">
        {TABS.map(([k,l])=><button key={k} onClick={()=>setTab(k)} className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all ${tab===k?'bg-indigo-500 text-white':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{l}</button>)}
      </div>

      {tab==='store'&&(
        <div className="card p-5 space-y-4">
          <div className="font-bold text-gray-900 dark:text-white">Store Information</div>
          {[['name','Store Name'],['phone','Phone'],['address','Address'],['receiptFooter','Receipt Footer']].map(([k,l])=>(
            <div key={k}><label className="lbl">{l}</label><input value={store[k]||''} onChange={e=>setStore(p=>({...p,[k]:e.target.value}))} className="inp"/></div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="lbl">Tax Rate (%)</label><input type="number" inputMode="decimal" value={store.taxRate||''} onChange={e=>setStore(p=>({...p,taxRate:parseFloat(e.target.value)||0}))} className="inp"/></div>
            <div><label className="lbl">Currency</label><input value={store.currency||''} onChange={e=>setStore(p=>({...p,currency:e.target.value}))} className="inp"/></div>
          </div>
          <button onClick={saveStore} className="btn-primary w-full">Save Settings</button>
        </div>
      )}

      {tab==='appearance'&&(
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div><div className="font-semibold text-gray-900 dark:text-white">Dark Mode</div><div className="text-xs text-gray-400 mt-0.5">Toggle dark/light interface</div></div>
            <button onClick={()=>setDark(!dark)} className={`w-14 h-7 rounded-full transition-colors relative flex-shrink-0 ${dark?'bg-indigo-500':'bg-gray-200'}`}>
              <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${dark?'left-7':'left-0.5'}`}/>
            </button>
          </div>
        </div>
      )}

      {tab==='profiles'&&(
        <div className="space-y-4">
          {users.map(u=>(
            <ProfileCard key={u.id} u={u} setUsers={setUsers} notify={notify} uploadPhoto={uploadPhoto}/>
          ))}
        </div>
      )}

      {tab==='password'&&(
        <div className="card p-5 space-y-4">
          <div className="font-bold text-gray-900 dark:text-white">Change Password</div>
          {(currentUser.role==='superadmin'||currentUser.role==='admin')&&(
            <div><label className="lbl">Select Account</label>
              <select value={pwdForm.userId} onChange={e=>setPwdForm(f=>({...f,userId:e.target.value,cur:'',nw:'',cf:''}))} className="inp">
                {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          {[['cur','Current Password'],['nw','New Password'],['cf','Confirm New Password']].map(([k,l])=>(
            <div key={k}><label className="lbl">{l}</label><input type="password" value={pwdForm[k]} onChange={e=>setPwdForm(f=>({...f,[k]:e.target.value}))} className="inp"/></div>
          ))}
          {pwdErr&&<div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-500 font-medium">{pwdErr}</div>}
          <button onClick={changePwd} className="btn-primary w-full">Update Password</button>
        </div>
      )}
    </div>
  );
}

// ── StaffView ─────────────────────────────────────────────────────────────────
const PERMS=[{id:'dashboard',label:'Dashboard'},{id:'pos',label:'Point of Sale'},{id:'inventory',label:'Inventory'},{id:'sales',label:'Sales History'},{id:'customers',label:'Customers'},{id:'suppliers',label:'Suppliers'},{id:'reports',label:'Reports'},{id:'settings',label:'Settings'},{id:'staff',label:'Staff Management'}];
const ROLES=['superadmin','admin','sales'];
const RL={superadmin:'Super Admin',admin:'Administrator',sales:'Sales Associate'};
const RC={superadmin:'#8b5cf6',admin:'#6366f1',sales:'#10b981'};

export function StaffView({ users, setUsers, currentUser, notify }) {
  const [addModal,setAddModal]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [draft,setDraft]=useState({});
  const [form,setForm]=useState({});
  const pRefs=useRef({});

  const enterEdit=u=>{setEditingId(u.id);setDraft(p=>({...p,[u.id]:[...(u.allowedViews||[])]}));};
  const cancelEdit=uid=>{setEditingId(null);setDraft(p=>{const n={...p};delete n[uid];return n;});};
  const savePerms=uid=>{setUsers(p=>p.map(u=>u.id===uid?{...u,allowedViews:draft[uid]||u.allowedViews}:u));setEditingId(null);notify('Permissions saved.');};
  const togglePerm=(uid,perm)=>setDraft(p=>{const v=p[uid]||[];return{...p,[uid]:v.includes(perm)?v.filter(x=>x!==perm):[...v,perm]};});

  const uploadPhoto=(e,uid)=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=ev=>{setUsers(p=>p.map(u=>u.id===uid?{...u,photo:ev.target.result}:u));notify('Photo updated.');};r.readAsDataURL(f);e.target.value='';};

  const saveAdd=()=>{
    if(!form.name||!form.email||!form.password){notify('Name, email, password required.','error');return;}
    if(users.some(u=>u.email===form.email)){notify('Email in use.','error');return;}
    const id=`U${String(users.length+1).padStart(3,'0')}`;
    setUsers(p=>[...p,{...form,id,avatar:form.name.slice(0,2).toUpperCase(),photo:null,signature:'',canDeleteUsers:form.role==='superadmin',allowedViews:['dashboard','pos','customers']}]);
    notify('Staff added.');setAddModal(false);
  };
  const del=id=>{if(id===currentUser.id){notify('Cannot delete own account.','error');return;}setUsers(p=>p.filter(u=>u.id!==id));notify('Staff removed.');};

  return(
    <div className="p-4 max-w-5xl mx-auto">
      {users.map(u=><input key={u.id} ref={el=>pRefs.current[u.id]=el} type="file" accept="image/*" className="hidden" onChange={e=>uploadPhoto(e,u.id)}/>)}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div><div className="text-lg font-black text-gray-900 dark:text-white">Staff</div><div className="text-xs text-gray-400">{users.length} members</div></div>
        <button onClick={()=>{setForm({name:'',email:'',password:'',role:'sales',staffId:''});setAddModal(true);}} className="btn-primary text-sm">+ Add Staff</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(u=>{
          const isEditing=editingId===u.id;
          const perms=isEditing?(draft[u.id]||u.allowedViews||[]):(u.allowedViews||[]);
          return(
            <div key={u.id} className={`card overflow-hidden transition-all ${isEditing?'ring-2 ring-indigo-500':''}`}>
              <div className="p-4">
                <div className="flex gap-3 items-start">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center border-2 border-gray-100 dark:border-gray-800">
                      {u.photo?<img src={u.photo} alt="" className="w-full h-full object-cover"/>:<span className="text-xl font-black text-indigo-500">{u.avatar}</span>}
                    </div>
                    <button onClick={()=>pRefs.current[u.id]?.click()} className="absolute -bottom-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">+</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-gray-900 dark:text-white">{u.name}</div>
                    <div className="text-xs font-semibold" style={{color:RC[u.role]||'#888'}}>{RL[u.role]||u.role}</div>
                    <div className="text-xs text-gray-400 truncate">{u.email}</div>
                    {u.staffId&&<div className="text-[10px] text-gray-400 font-mono">ID: {u.staffId}</div>}
                  </div>
                  {!isEditing&&u.id!==currentUser.id&&(
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button onClick={()=>enterEdit(u)} className="btn-secondary text-[11px] px-2.5 min-h-[32px]">Edit</button>
                      <button onClick={()=>del(u.id)} className="btn-danger text-[11px] px-2 min-h-[32px]">✕</button>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3">
                <div className="flex justify-between items-center mb-3">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Permissions</div>
                  {isEditing&&<div className="text-[10px] text-indigo-500 font-bold">Editing...</div>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PERMS.map(p=>{
                    const on=perms.includes(p.id);
                    const canToggle=isEditing&&u.id!==currentUser.id;
                    return(
                      <div key={p.id} onClick={()=>canToggle&&togglePerm(u.id,p.id)} className={`flex items-center gap-2 ${canToggle?'cursor-pointer':''}`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0 ${on?'bg-indigo-500 border-indigo-500':'border-gray-300 dark:border-gray-600'}`}>
                          {on&&<svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <span className={`text-xs ${on?'text-gray-900 dark:text-white font-medium':'text-gray-400'}`}>{p.label}</span>
                      </div>
                    );
                  })}
                </div>
                {isEditing&&(
                  <div className="flex gap-2 mt-3">
                    <button onClick={()=>cancelEdit(u.id)} className="btn-secondary flex-1 text-sm min-h-[40px]">Cancel</button>
                    <button onClick={()=>savePerms(u.id)} className="btn-primary flex-1 text-sm min-h-[40px]">Save Permissions</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {addModal&&<BottomModal title="Add Staff Member" onClose={()=>setAddModal(false)}>
        <div className="space-y-3">
          {[['name','Full Name *','text'],['email','Email *','email'],['password','Password *','password'],['staffId','Staff ID','text']].map(([k,l,t])=>(
            <div key={k}><label className="lbl">{l}</label><input type={t} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="inp"/></div>
          ))}
          <div>
            <label className="lbl">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r=><button key={r} type="button" onClick={()=>setForm(p=>({...p,role:r}))} className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${form.role===r?'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500':'border-gray-200 dark:border-gray-700 text-gray-500'}`}>{RL[r]}</button>)}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={()=>setAddModal(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={saveAdd} className="btn-primary flex-1">Add Staff</button>
          </div>
        </div>
      </BottomModal>}
    </div>
  );
}

// ── Shared BottomModal ────────────────────────────────────────────────────────
function BottomModal({ title, onClose, children }) {
  return(
    <div className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[92vh] overflow-y-auto slide-up">
        <div className="flex justify-center pt-3"><div className="w-10 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
        <div className="flex justify-between items-center px-5 py-4">
          <div className="font-black text-base text-gray-900 dark:text-white">{title}</div>
          <button onClick={onClose} className="text-gray-400 min-h-[44px] min-w-[44px] flex items-center justify-center text-xl">✕</button>
        </div>
        <div className="px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
