import React, { useState, useRef } from 'react';
import BarcodeScanner from './BarcodeScanner';

const DEFAULT_CATS = ['Beverages','Food','Household','Healthcare'];
const ADJ_REASONS  = ['Damaged','Expired','Theft / Loss','Stock Count Correction','Supplier Return','Other'];
const DAYS_EXPIRY  = 30;

const lookupBarcode = async bc => {
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v0/product/${bc}.json`);
    const d = await r.json();
    if (d.status===1&&d.product) return { name:d.product.product_name||'', barcode:bc };
    return null;
  } catch { return null; }
};

const dlFile = (content,name,mime) => {
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([content],{type:mime}));
  a.download=name; a.click();
};

export default function InventoryView({ products, setProducts, suppliers, notify, dark, appearance, tenants, currentStoreId, categories: propCats, setCategories: setPropCats, addAudit }) {
  const [search,       setSearch]       = useState('');
  const [catFilter,    setCatFilter]    = useState('All');
  const [stockFilter,  setStockFilter]  = useState('all');
  const [tab,          setTab]          = useState('products'); // 'products'|'orders'|'adjustments'|'transfers'|'categories'
  const [showModal,    setShowModal]    = useState(false);
  const [editP,        setEditP]        = useState(null);
  const [form,         setForm]         = useState({});
  const [showScanner,  setShowScanner]  = useState(false);
  const [looking,      setLooking]      = useState(false);
  // Categories
  const [localCats,    setLocalCats]    = useState(propCats && propCats.length ? propCats : DEFAULT_CATS);
  const [newCatName,   setNewCatName]   = useState('');
  const [editCatIdx,   setEditCatIdx]   = useState(null);
  const [editCatVal,   setEditCatVal]   = useState('');
  // Orders
  const [orders,       setOrders]       = useState([]);
  const [showOrderModal,setShowOrderModal]=useState(false);
  const [orderForm,    setOrderForm]    = useState({ supplierId:'', expectedDate:'', notes:'' });
  const [orderItems,   setOrderItems]   = useState([{productId:'',qty:'',unitCost:''}]);
  // Adjustments
  const [adjustments,  setAdjustments]  = useState([]);
  const [showAdjModal, setShowAdjModal] = useState(false);
  const [adjForm,      setAdjForm]      = useState({ productId:'', qty:'', reason:ADJ_REASONS[0], note:'', direction:'remove' });
  // Transfers
  const [transfers,    setTransfers]    = useState([]);
  const [showTxModal,  setShowTxModal]  = useState(false);
  const [txForm,       setTxForm]       = useState({ toStoreId:'', productId:'', qty:'', note:'' });

  const importRef = useRef(); const photoRef = useRef(); const cameraRef = useRef();
  const accent    = appearance?.accentColor || '#4f46e5';
  const cats      = localCats; // working categories list
  const allCats   = ['All', ...cats];

  /* ── Sync categories upward ─────────────────────────────────────────────── */
  const syncCats = updated => { setLocalCats(updated); if(setPropCats) setPropCats(updated); };

  /* ── Category CRUD ──────────────────────────────────────────────────────── */
  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) { notify('Enter a category name.','error'); return; }
    if (cats.map(c=>c.toLowerCase()).includes(name.toLowerCase())) { notify('Category already exists.','error'); return; }
    syncCats([...cats, name]);
    setNewCatName('');
    notify(`Category "${name}" added.`);
  };
  const saveEditCat = () => {
    const val = editCatVal.trim();
    if (!val) { notify('Name cannot be empty.','error'); return; }
    const oldName = cats[editCatIdx];
    const updated = cats.map((c,i) => i===editCatIdx ? val : c);
    syncCats(updated);
    // Rename in products too
    setProducts(prev => prev.map(p => p.category===oldName ? {...p,category:val} : p));
    setEditCatIdx(null); setEditCatVal('');
    notify(`Category renamed to "${val}".`);
  };
  const deleteCategory = idx => {
    const name = cats[idx];
    const inUse = products.some(p=>p.category===name);
    if (inUse) { notify(`"${name}" is in use by products. Reassign them first.`,'error'); return; }
    syncCats(cats.filter((_,i)=>i!==idx));
    notify(`Category "${name}" removed.`);
    if (catFilter===name) setCatFilter('All');
  };

  /* ── Product helpers ────────────────────────────────────────────────────── */
  const isExpiringSoon = p => { if(!p.expiryDate)return false; const d=(new Date(p.expiryDate)-new Date())/(864e5); return d>=0&&d<=DAYS_EXPIRY; };
  const isExpired      = p => p.expiryDate && new Date(p.expiryDate) < new Date();

  const filtered = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku||'').toLowerCase().includes(search.toLowerCase());
    const mc = catFilter==='All' || p.category===catFilter;
    const mf = stockFilter==='all' ? true
             : stockFilter==='in'  ? p.stock>p.reorderLevel
             : stockFilter==='low' ? p.stock>0&&p.stock<=p.reorderLevel
             : stockFilter==='out' ? p.stock===0
             : isExpiringSoon(p)||isExpired(p);
    return ms&&mc&&mf;
  });

  const blank = { name:'',sku:'',category:cats[0]||'Other',price:'',cost:'',stock:'',reorderLevel:'',unit:'piece',barcode:'',image:'',batchNo:'',expiryDate:'',variants:[] };

  const openAdd  = () => { setEditP(null); setForm(blank); setShowModal(true); };
  const openEdit = p  => { setEditP(p); setForm({...p,variants:p.variants||[]}); setShowModal(true); };

  const onBarcode = async code => {
    setShowScanner(false); setLooking(true);
    notify(`Barcode ${code} — searching...`);
    const r = await lookupBarcode(code);
    setLooking(false);
    setForm(f=>({...f,barcode:code,...(r?.name?{name:r.name}:{})}));
    notify(r?.name?'Product found. Review details.':'Not in database. Fill in manually.',r?.name?'success':'error');
    setShowModal(true);
  };

  const handlePhoto = ref => e => {
    const file=e.target.files[0]; if(!file)return;
    if(file.size>3*1024*1024){notify('Max 3MB.','error');return;}
    const rd=new FileReader();
    rd.onload=ev=>setForm(f=>({...f,image:ev.target.result}));
    rd.readAsDataURL(file); e.target.value='';
  };

  const save = () => {
    if(!form.name||!form.price||!form.stock){notify('Name, price and stock required.','error');return;}
    const data={...form,price:parseFloat(form.price),cost:parseFloat(form.cost||0),stock:parseInt(form.stock),reorderLevel:parseInt(form.reorderLevel||0),variants:form.variants||[]};
    if(editP){setProducts(p=>p.map(x=>x.id===editP.id?{...x,...data}:x));notify('Product updated.');if(addAudit)addAudit('Product Updated',data.name);}
    else{const id=`P${String(products.length+1).padStart(3,'0')}`;setProducts(p=>[...p,{...data,id,storeId:currentStoreId||'ST001'}]);notify('Product added.');if(addAudit)addAudit('Product Added',data.name);}
    setShowModal(false);
  };
  const del = id => { setProducts(p=>p.filter(x=>x.id!==id)); notify('Product removed.'); };

  const handleImport = e => {
    const file=e.target.files[0]; if(!file)return;
    const rd=new FileReader();
    rd.onload=ev=>{
      try{
        const lines=ev.target.result.split('\n').filter(l=>l.trim());
        const headers=lines[0].split(',').map(h=>h.trim().replace(/^"|"$/g,''));
        const rows=lines.slice(1).map(line=>{
          const vals=[];let cur='',inQ=false;
          for(const ch of line){if(ch==='"')inQ=!inQ;else if(ch===','&&!inQ){vals.push(cur);cur='';}else cur+=ch;}
          vals.push(cur);
          const obj={};headers.forEach((h,i)=>{obj[h]=(vals[i]||'').trim();});return obj;
        }).filter(r=>r.name);
        setProducts(rows.map((r,i)=>({
          id:r.id||`P${String(products.length+i+1).padStart(3,'0')}`,
          name:r.name,sku:r.sku||'',barcode:r.barcode||'',category:r.category||cats[0]||'Other',image:'',
          price:parseFloat(r.price)||0,cost:parseFloat(r.cost)||0,stock:parseInt(r.stock)||0,
          reorderLevel:parseInt(r.reorderLevel||r.reorder_level)||5,unit:r.unit||'piece',
          storeId:currentStoreId||'ST001',variants:[],batchNo:r.batchNo||'',expiryDate:r.expiryDate||'',
        })));
        notify(`${rows.length} products imported.`);
      } catch { notify('Import failed. Check CSV format.','error'); }
    };
    rd.readAsText(file); e.target.value='';
  };

  const exportCSV = () => {
    const h=['id','name','sku','barcode','category','price','cost','stock','reorderLevel','unit','batchNo','expiryDate'];
    const csv=[h.join(','),...products.map(p=>h.map(k=>`"${String(p[k]??'').replace(/"/g,'""')}"`).join(','))].join('\n');
    dlFile(csv,'nexus_products.csv','text/csv');
  };

  /* ── Purchase orders ────────────────────────────────────────────────────── */
  const createOrder = () => {
    if(!orderForm.supplierId){notify('Select a supplier.','error');return;}
    if(!orderItems.some(i=>i.productId&&i.qty)){notify('Add at least one item.','error');return;}
    const order={id:`PO${String(orders.length+1).padStart(4,'0')}`,date:new Date().toISOString().split('T')[0],supplierId:orderForm.supplierId,expectedDate:orderForm.expectedDate,notes:orderForm.notes,status:'draft',items:orderItems.filter(i=>i.productId&&i.qty).map(i=>({...i,qty:parseInt(i.qty),unitCost:parseFloat(i.unitCost||0)})),storeId:currentStoreId};
    setOrders(prev=>[order,...prev]);setShowOrderModal(false);setOrderItems([{productId:'',qty:'',unitCost:''}]);setOrderForm({supplierId:'',expectedDate:'',notes:''});
    notify(`Purchase order ${order.id} created.`);
  };
  const receiveOrder = id => {
    const order=orders.find(o=>o.id===id); if(!order)return;
    setProducts(prev=>prev.map(p=>{const oi=order.items.find(i=>i.productId===p.id);return oi?{...p,stock:p.stock+oi.qty}:p;}));
    setOrders(prev=>prev.map(o=>o.id===id?{...o,status:'received',receivedAt:new Date().toISOString()}:o));
    notify(`PO ${id} received. Stock updated.`);
  };

  /* ── Stock adjustment ───────────────────────────────────────────────────── */
  const saveAdjustment = () => {
    if(!adjForm.productId||!adjForm.qty){notify('Select product and quantity.','error');return;}
    const qty=parseInt(adjForm.qty);const sign=adjForm.direction==='add'?1:-1;
    setProducts(prev=>prev.map(p=>p.id===adjForm.productId?{...p,stock:Math.max(0,p.stock+sign*qty)}:p));
    const prod=products.find(p=>p.id===adjForm.productId);
    setAdjustments(prev=>[{id:`ADJ${Date.now()}`,date:new Date().toISOString().split('T')[0],productName:prod?.name,qty:sign*qty,reason:adjForm.reason,note:adjForm.note},...prev]);
    setShowAdjModal(false);setAdjForm({productId:'',qty:'',reason:ADJ_REASONS[0],note:'',direction:'remove'});
    notify(`Stock adjusted for ${prod?.name}.`);
  };

  /* ── Stock transfer ─────────────────────────────────────────────────────── */
  const saveTransfer = () => {
    if(!txForm.toStoreId||!txForm.productId||!txForm.qty){notify('Fill all fields.','error');return;}
    const qty=parseInt(txForm.qty);const prod=products.find(p=>p.id===txForm.productId);
    if(!prod||prod.stock<qty){notify('Insufficient stock.','error');return;}
    setProducts(prev=>prev.map(p=>p.id===txForm.productId?{...p,stock:p.stock-qty}:p));
    setTransfers(prev=>[{id:`TX${Date.now()}`,date:new Date().toISOString().split('T')[0],productName:prod.name,qty,fromStore:currentStoreId,toStore:txForm.toStoreId,note:txForm.note,status:'sent'},...prev]);
    setShowTxModal(false);setTxForm({toStoreId:'',productId:'',qty:'',note:''});
    notify(`${qty} × ${prod.name} transferred.`);
  };

  const stockLabel = p => isExpired(p)?'Expired':isExpiringSoon(p)?'Expiring':p.stock===0?'Out of stock':p.stock<=p.reorderLevel?'Low stock':'In stock';
  const stockCls   = p => isExpired(p)||p.stock===0?'bg-red-100 dark:bg-red-900/30 text-red-600':isExpiringSoon(p)||p.stock<=p.reorderLevel?'bg-amber-100 dark:bg-amber-900/30 text-amber-600':'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600';

  const TABS=[['products','Products'],['categories','Categories'],['orders','Orders'],['adjustments','Adjustments'],['transfers','Transfers']];

  return (
    <div className="p-4 lg:p-5 max-w-6xl mx-auto">
      {showScanner && <BarcodeScanner onDetected={onBarcode} onClose={()=>setShowScanner(false)} dark={dark}/>}
      <input ref={importRef} type="file" accept=".csv" className="hidden" onChange={handleImport}/>
      <input ref={photoRef}  type="file" accept="image/*" className="hidden" onChange={handlePhoto(photoRef)}/>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto(cameraRef)}/>

      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div><h1 className="page-title">Inventory</h1><p className="page-sub">{products.length} products · {cats.length} categories</p></div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={()=>importRef.current.click()} className="btn-secondary text-xs px-3 min-h-[38px]">Import</button>
          <button onClick={exportCSV} className="btn-secondary text-xs px-3 min-h-[38px]">Export</button>
          <button onClick={()=>{setEditP(null);setForm(blank);setShowScanner(true);}} className="btn-secondary text-xs px-3 min-h-[38px]">Scan</button>
          <button onClick={openAdd} className="btn-primary text-sm px-4 min-h-[38px]" style={{background:accent}}>+ Add</button>
        </div>
      </div>

      {looking && <div className="mb-4 px-4 py-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 rounded-xl text-indigo-600 font-medium" style={{fontSize:'0.75rem'}}>Searching product database...</div>}

      {/* Tab strip */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
        {TABS.map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)}
            className={`flex-shrink-0 px-4 py-2 rounded-full font-semibold transition-all ${tab===k?'text-white':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
            style={{fontSize:'0.8125rem',...(tab===k?{background:accent}:{})}}>
            {l}
          </button>
        ))}
      </div>

      {/* ── PRODUCTS TAB ── */}
      {tab==='products' && (
        <>
          {/* Stock quick stats */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[['all','Total',products.length,'#4f46e5'],['in','In Stock',products.filter(p=>p.stock>p.reorderLevel).length,'#059669'],['low','Low',products.filter(p=>p.stock>0&&p.stock<=p.reorderLevel).length,'#d97706'],['out','Out',products.filter(p=>p.stock===0).length,'#dc2626'],['expiring','Expiring',products.filter(p=>isExpiringSoon(p)||isExpired(p)).length,'#7c3aed']].map(([id,l,v,c])=>(
              <button key={id} onClick={()=>setStockFilter(id)} className={`card p-2.5 text-center transition-all ${stockFilter===id?'ring-2':''}`} style={stockFilter===id?{ringColor:c,outline:`2px solid ${c}`}:{}}>
                <div className="font-bold leading-none" style={{fontSize:'1rem',color:c}}>{v}</div>
                <div className="text-gray-400 font-medium mt-0.5" style={{fontSize:'0.5625rem'}}>{l}</div>
              </button>
            ))}
          </div>
          {/* Search + category filter */}
          <div className="space-y-2 mb-4">
            <div className="relative"><svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or SKU..." className="inp pl-9"/></div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {allCats.map(c=>(
                <button key={c} onClick={()=>setCatFilter(c)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full font-medium transition-all ${catFilter===c?'text-white':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}
                  style={{fontSize:'0.75rem',...(catFilter===c?{background:accent}:{})}}>
                  {c}
                </button>
              ))}
            </div>
          </div>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {filtered.map(p=>(
              <div key={p.id} className={`card p-3 ${isExpired(p)?'border-red-200 dark:border-red-900':''}`}>
                <div className="flex gap-3 items-start">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">{p.image&&p.image.startsWith('data:')?<img src={p.image} alt={p.name} className="w-full h-full object-cover"/>:<svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate" style={{fontSize:'0.875rem'}}>{p.name}</div>
                        <div className="text-gray-400 mt-0.5" style={{fontSize:'0.6875rem'}}>{p.sku} · {p.category}{p.batchNo?` · ${p.batchNo}`:''}{p.expiryDate?` · exp ${p.expiryDate}`:''}</div>
                      </div>
                      <span className={`badge flex-shrink-0 ${stockCls(p)}`}>{stockLabel(p)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2" style={{fontSize:'0.75rem'}}>
                      <span className="text-emerald-600 font-semibold">GH{p.price.toFixed(2)}</span>
                      <span className="text-gray-500">{p.stock} {p.unit}s</span>
                      {(p.variants||[]).length>0&&<span className="text-violet-500 font-medium">{p.variants.length} variants</span>}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={()=>openEdit(p)} className="btn-secondary min-h-[32px] px-3" style={{fontSize:'0.75rem'}}>Edit</button>
                      <button onClick={()=>del(p.id)} className="btn-danger min-h-[32px] px-3" style={{fontSize:'0.75rem'}}>Delete</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length===0&&<div className="text-center py-12 text-gray-400" style={{fontSize:'0.875rem'}}>No products found.</div>}
          </div>
          {/* Desktop table */}
          <div className="hidden md:block card overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800"><tr>{['Product','SKU','Category','Price','Stock','Expiry','Status',''].map(h=><th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtered.map(p=>(
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="td"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">{p.image&&p.image.startsWith('data:')?<img src={p.image} alt={p.name} className="w-full h-full object-cover"/>:<svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}</div><div><div className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.8125rem'}}>{p.name}</div><div className="text-gray-400" style={{fontSize:'0.6875rem'}}>{p.barcode||'—'}{(p.variants||[]).length>0?` · ${p.variants.length}v`:''}</div></div></div></td>
                    <td className="td font-mono text-gray-400" style={{fontSize:'0.75rem'}}>{p.sku}</td>
                    <td className="td"><span className="badge bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600">{p.category}</span></td>
                    <td className="td font-semibold text-emerald-600" style={{fontSize:'0.8125rem'}}>GH{p.price.toFixed(2)}</td>
                    <td className="td font-medium text-gray-900 dark:text-white" style={{fontSize:'0.8125rem'}}>{p.stock} {p.unit}s</td>
                    <td className="td text-gray-400" style={{fontSize:'0.75rem'}}>{p.expiryDate||'—'}</td>
                    <td className="td"><span className={`badge ${stockCls(p)}`}>{stockLabel(p)}</span></td>
                    <td className="td"><div className="flex gap-2"><button onClick={()=>openEdit(p)} className="btn-secondary min-h-[32px] px-3" style={{fontSize:'0.75rem'}}>Edit</button><button onClick={()=>del(p.id)} className="btn-danger min-h-[32px] px-2" style={{fontSize:'0.75rem'}}>Del</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length===0&&<div className="text-center py-12 text-gray-400" style={{fontSize:'0.875rem'}}>No products found.</div>}
          </div>
        </>
      )}

      {/* ── CATEGORIES TAB ── */}
      {tab==='categories' && (
        <div className="max-w-lg space-y-4">
          <div className="card p-5">
            <div className="font-semibold text-gray-900 dark:text-white mb-1" style={{fontSize:'0.9375rem'}}>Product Categories</div>
            <div className="text-gray-400 mb-4" style={{fontSize:'0.75rem'}}>Add, rename or remove categories. Renaming updates all products automatically.</div>

            {/* Add new */}
            <div className="flex gap-2 mb-4">
              <input
                value={newCatName}
                onChange={e=>setNewCatName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addCategory()}
                placeholder="New category name..."
                className="inp flex-1"
              />
              <button onClick={addCategory} className="btn-primary px-4" style={{background:accent}}>Add</button>
            </div>

            {/* Category list */}
            <div className="space-y-2">
              {cats.map((cat,i)=>{
                const count = products.filter(p=>p.category===cat).length;
                return (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    {/* Colour swatch */}
                    <div className="w-3 h-8 rounded-full flex-shrink-0" style={{background:`hsl(${i*47%360},60%,55%)`}}/>

                    {editCatIdx===i ? (
                      <>
                        <input
                          value={editCatVal}
                          onChange={e=>setEditCatVal(e.target.value)}
                          onKeyDown={e=>{ if(e.key==='Enter')saveEditCat(); if(e.key==='Escape'){setEditCatIdx(null);setEditCatVal('');} }}
                          className="inp flex-1"
                          autoFocus
                        />
                        <button onClick={saveEditCat} className="btn-primary px-3 min-h-[36px]" style={{background:accent,fontSize:'0.75rem'}}>Save</button>
                        <button onClick={()=>{setEditCatIdx(null);setEditCatVal('');}} className="btn-secondary px-3 min-h-[36px]" style={{fontSize:'0.75rem'}}>✕</button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>{cat}</div>
                          <div className="text-gray-400" style={{fontSize:'0.6875rem'}}>{count} product{count!==1?'s':''}</div>
                        </div>
                        <button onClick={()=>{setEditCatIdx(i);setEditCatVal(cat);}} className="btn-secondary min-h-[32px] px-2.5" style={{fontSize:'0.6875rem'}}>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          Edit
                        </button>
                        {count===0 && (
                          <button onClick={()=>deleteCategory(i)} className="btn-danger min-h-[32px] px-2" style={{fontSize:'0.6875rem'}}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              {cats.length===0 && <div className="text-center py-8 text-gray-400" style={{fontSize:'0.875rem'}}>No categories yet. Add one above.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── PURCHASE ORDERS TAB ── */}
      {tab==='orders' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={()=>setShowOrderModal(true)} className="btn-primary" style={{background:accent,fontSize:'0.875rem'}}>+ New Purchase Order</button></div>
          {orders.length===0&&<div className="text-center py-12 text-gray-400" style={{fontSize:'0.875rem'}}>No purchase orders yet.</div>}
          {orders.map(o=>{const sup=(suppliers||[]).find(s=>s.id===o.supplierId);return(
            <div key={o.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div><div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem'}}>{o.id}</div><div className="text-gray-400 mt-0.5" style={{fontSize:'0.75rem'}}>{sup?.name||o.supplierId} · {o.date}{o.expectedDate?` · Exp: ${o.expectedDate}`:''}</div></div>
                <div className="flex items-center gap-2"><span className={`badge ${o.status==='received'?'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600':o.status==='sent'?'bg-blue-100 dark:bg-blue-900/30 text-blue-600':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{o.status}</span>{o.status!=='received'&&<button onClick={()=>receiveOrder(o.id)} className="btn-success min-h-[32px] px-3" style={{fontSize:'0.75rem'}}>Receive</button>}</div>
              </div>
              {o.items.map((item,i)=>{const p=products.find(x=>x.id===item.productId);return(<div key={i} className="flex justify-between" style={{fontSize:'0.8125rem'}}><span className="text-gray-500">{p?.name||item.productId} ×{item.qty}</span><span className="font-medium text-gray-900 dark:text-white">GH{(item.qty*item.unitCost).toFixed(2)}</span></div>);})}
              {o.notes&&<div className="mt-2 text-gray-400 italic" style={{fontSize:'0.75rem'}}>{o.notes}</div>}
            </div>
          );})}
        </div>
      )}

      {/* ── ADJUSTMENTS TAB ── */}
      {tab==='adjustments' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={()=>{setAdjForm({productId:'',qty:'',reason:ADJ_REASONS[0],note:'',direction:'remove'});setShowAdjModal(true);}} className="btn-primary" style={{background:accent,fontSize:'0.875rem'}}>+ Adjustment</button></div>
          {adjustments.length===0&&<div className="text-center py-12 text-gray-400" style={{fontSize:'0.875rem'}}>No stock adjustments recorded.</div>}
          {adjustments.map(a=>(
            <div key={a.id} className="card p-4 flex items-center justify-between">
              <div><div className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>{a.productName}</div><div className="text-gray-400 mt-0.5" style={{fontSize:'0.75rem'}}>{a.date} · {a.reason}{a.note?` · ${a.note}`:''}</div></div>
              <div className={`font-bold ${a.qty>0?'text-emerald-600':'text-red-500'}`} style={{fontSize:'1rem'}}>{a.qty>0?'+':''}{a.qty}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── TRANSFERS TAB ── */}
      {tab==='transfers' && (
        <div className="space-y-4">
          <div className="flex justify-end"><button onClick={()=>setShowTxModal(true)} className="btn-primary" style={{background:accent,fontSize:'0.875rem'}}>+ Transfer</button></div>
          {transfers.length===0&&<div className="text-center py-12 text-gray-400" style={{fontSize:'0.875rem'}}>No stock transfers yet.</div>}
          {transfers.map(t=>(
            <div key={t.id} className="card p-4 flex items-center justify-between">
              <div><div className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>{t.productName} — {t.qty} units</div><div className="text-gray-400 mt-0.5" style={{fontSize:'0.75rem'}}>{t.date} · To: {(tenants||[]).find(x=>x.id===t.toStore)?.name||t.toStore}{t.note?` · ${t.note}`:''}</div></div>
              <span className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-600">{t.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT PRODUCT MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[93vh] overflow-y-auto slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-3">
              <div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem'}}>{editP?'Edit Product':'Add Product'}</div>
              <button onClick={()=>setShowModal(false)} className="btn-ghost w-8 h-8">✕</button>
            </div>
            <div className="px-5 pb-8 space-y-4">
              {/* Photo */}
              <div>
                <label className="lbl">Product Photo</label>
                <div className="flex gap-3 items-center">
                  <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700">
                    {form.image&&form.image.startsWith('data:')?<img src={form.image} alt="" className="w-full h-full object-cover rounded-2xl"/>:<svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>}
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    <button onClick={()=>cameraRef.current.click()} className="btn-secondary text-xs min-h-[38px] w-full"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>Camera</button>
                    <button onClick={()=>photoRef.current.click()} className="btn-secondary text-xs min-h-[38px] w-full"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"/></svg>Gallery</button>
                    {form.image&&<button onClick={()=>setForm(f=>({...f,image:''}))} className="btn-danger text-xs min-h-[32px] w-full">Remove</button>}
                  </div>
                </div>
              </div>
              {/* Barcode */}
              <div><label className="lbl">Barcode</label><div className="flex gap-2"><input value={form.barcode||''} onChange={e=>setForm(f=>({...f,barcode:e.target.value}))} placeholder="Scan or enter" className="inp flex-1 font-mono"/><button onClick={()=>{setShowModal(false);setShowScanner(true);}} className="btn-secondary px-3 min-h-[44px]"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14"/></svg></button></div></div>
              {/* Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="lbl">Product Name *</label><input value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} className="inp"/></div>
                <div><label className="lbl">SKU</label><input value={form.sku||''} onChange={e=>setForm(f=>({...f,sku:e.target.value}))} className="inp"/></div>
                <div><label className="lbl">Unit</label><input value={form.unit||''} onChange={e=>setForm(f=>({...f,unit:e.target.value}))} className="inp" placeholder="bottle, pack..."/></div>
                <div><label className="lbl">Selling Price (GH) *</label><input type="number" inputMode="decimal" value={form.price||''} onChange={e=>setForm(f=>({...f,price:e.target.value}))} className="inp" placeholder="0.00"/></div>
                <div><label className="lbl">Cost Price (GH)</label><input type="number" inputMode="decimal" value={form.cost||''} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} className="inp" placeholder="0.00"/></div>
                <div><label className="lbl">Stock *</label><input type="number" inputMode="numeric" value={form.stock||''} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} className="inp"/></div>
                <div><label className="lbl">Reorder Level</label><input type="number" inputMode="numeric" value={form.reorderLevel||''} onChange={e=>setForm(f=>({...f,reorderLevel:e.target.value}))} className="inp" placeholder="5"/></div>
                <div><label className="lbl">Batch No.</label><input value={form.batchNo||''} onChange={e=>setForm(f=>({...f,batchNo:e.target.value}))} className="inp"/></div>
                <div><label className="lbl">Expiry Date</label><input type="date" value={form.expiryDate||''} onChange={e=>setForm(f=>({...f,expiryDate:e.target.value}))} className="inp"/></div>
                <div className="col-span-2">
                  <label className="lbl">Category</label>
                  <select value={form.category||cats[0]||''} onChange={e=>setForm(f=>({...f,category:e.target.value}))} className="inp">
                    {cats.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {/* Variants */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="lbl mb-0">Variants (optional)</label>
                  <button onClick={()=>setForm(f=>({...f,variants:[...(f.variants||[]),{label:'',price:'',stock:''}]}))} className="font-semibold" style={{fontSize:'0.75rem',color:accent}}>+ Add</button>
                </div>
                {(form.variants||[]).map((v,i)=>(
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    <input value={v.label} onChange={e=>setForm(f=>({...f,variants:f.variants.map((x,j)=>j===i?{...x,label:e.target.value}:x)}))} placeholder="e.g. Large Red" className="inp text-sm col-span-1"/>
                    <input type="number" value={v.price} onChange={e=>setForm(f=>({...f,variants:f.variants.map((x,j)=>j===i?{...x,price:e.target.value}:x)}))} placeholder="Price" className="inp text-sm"/>
                    <div className="flex gap-1"><input type="number" value={v.stock} onChange={e=>setForm(f=>({...f,variants:f.variants.map((x,j)=>j===i?{...x,stock:parseInt(e.target.value)||0}:x)}))} placeholder="Stock" className="inp text-sm flex-1"/><button onClick={()=>setForm(f=>({...f,variants:f.variants.filter((_,j)=>j!==i)}))} className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center" style={{fontSize:'0.75rem'}}>✕</button></div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={()=>setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={save} className="btn-primary flex-1" style={{background:accent}}>{editP?'Save':'Add Product'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Order Modal */}
      {showOrderModal&&(
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-lg max-h-[93vh] overflow-y-auto slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-3"><div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem'}}>New Purchase Order</div><button onClick={()=>setShowOrderModal(false)} className="btn-ghost w-8 h-8">✕</button></div>
            <div className="px-5 pb-8 space-y-4">
              <div><label className="lbl">Supplier *</label><select value={orderForm.supplierId} onChange={e=>setOrderForm(f=>({...f,supplierId:e.target.value}))} className="inp"><option value="">Select supplier...</option>{(suppliers||[]).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="lbl">Expected Date</label><input type="date" value={orderForm.expectedDate} onChange={e=>setOrderForm(f=>({...f,expectedDate:e.target.value}))} className="inp"/></div>
              <div>
                <div className="flex items-center justify-between mb-2"><label className="lbl mb-0">Items</label><button onClick={()=>setOrderItems(p=>[...p,{productId:'',qty:'',unitCost:''}])} className="font-semibold" style={{fontSize:'0.75rem',color:accent}}>+ Item</button></div>
                {orderItems.map((item,i)=>(
                  <div key={i} className="grid grid-cols-3 gap-2 mb-2">
                    <select value={item.productId} onChange={e=>setOrderItems(p=>p.map((x,j)=>j===i?{...x,productId:e.target.value}:x))} className="inp text-sm col-span-1"><option value="">Product...</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <input type="number" value={item.qty} onChange={e=>setOrderItems(p=>p.map((x,j)=>j===i?{...x,qty:e.target.value}:x))} placeholder="Qty" className="inp text-sm"/>
                    <div className="flex gap-1"><input type="number" value={item.unitCost} onChange={e=>setOrderItems(p=>p.map((x,j)=>j===i?{...x,unitCost:e.target.value}:x))} placeholder="Cost" className="inp text-sm flex-1"/><button onClick={()=>setOrderItems(p=>p.filter((_,j)=>j!==i))} className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center" style={{fontSize:'0.75rem'}}>✕</button></div>
                  </div>
                ))}
              </div>
              <div><label className="lbl">Notes</label><input value={orderForm.notes} onChange={e=>setOrderForm(f=>({...f,notes:e.target.value}))} className="inp"/></div>
              <div className="flex gap-3"><button onClick={()=>setShowOrderModal(false)} className="btn-secondary flex-1">Cancel</button><button onClick={createOrder} className="btn-primary flex-1" style={{background:accent}}>Create PO</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjModal&&(
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-3"><div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem'}}>Stock Adjustment</div><button onClick={()=>setShowAdjModal(false)} className="btn-ghost w-8 h-8">✕</button></div>
            <div className="px-5 pb-8 space-y-4">
              <div><label className="lbl">Product *</label><select value={adjForm.productId} onChange={e=>setAdjForm(f=>({...f,productId:e.target.value}))} className="inp"><option value="">Select product...</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={()=>setAdjForm(f=>({...f,direction:'add'}))} className={`py-3 rounded-xl border-2 font-semibold ${adjForm.direction==='add'?'border-emerald-500 bg-emerald-50 text-emerald-600':'border-gray-200 text-gray-500'}`} style={{fontSize:'0.8125rem'}}>+ Add Stock</button>
                <button onClick={()=>setAdjForm(f=>({...f,direction:'remove'}))} className={`py-3 rounded-xl border-2 font-semibold ${adjForm.direction==='remove'?'border-red-400 bg-red-50 text-red-500':'border-gray-200 text-gray-500'}`} style={{fontSize:'0.8125rem'}}>− Remove</button>
              </div>
              <div><label className="lbl">Quantity *</label><input type="number" inputMode="numeric" value={adjForm.qty} onChange={e=>setAdjForm(f=>({...f,qty:e.target.value}))} placeholder="0" className="inp"/></div>
              <div><label className="lbl">Reason *</label><select value={adjForm.reason} onChange={e=>setAdjForm(f=>({...f,reason:e.target.value}))} className="inp">{ADJ_REASONS.map(r=><option key={r}>{r}</option>)}</select></div>
              <div><label className="lbl">Note</label><input value={adjForm.note} onChange={e=>setAdjForm(f=>({...f,note:e.target.value}))} className="inp"/></div>
              <div className="flex gap-3"><button onClick={()=>setShowAdjModal(false)} className="btn-secondary flex-1">Cancel</button><button onClick={saveAdjustment} className="btn-primary flex-1" style={{background:accent}}>Save</button></div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTxModal&&(
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
            <div className="flex justify-between items-center px-5 py-3"><div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem'}}>Transfer Stock</div><button onClick={()=>setShowTxModal(false)} className="btn-ghost w-8 h-8">✕</button></div>
            <div className="px-5 pb-8 space-y-4">
              <div><label className="lbl">Destination Store *</label><select value={txForm.toStoreId} onChange={e=>setTxForm(f=>({...f,toStoreId:e.target.value}))} className="inp"><option value="">Select store...</option>{(tenants||[]).filter(t=>t.id!==currentStoreId).map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
              <div><label className="lbl">Product *</label><select value={txForm.productId} onChange={e=>setTxForm(f=>({...f,productId:e.target.value}))} className="inp"><option value="">Select product...</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} ({p.stock})</option>)}</select></div>
              <div><label className="lbl">Quantity *</label><input type="number" inputMode="numeric" value={txForm.qty} onChange={e=>setTxForm(f=>({...f,qty:e.target.value}))} className="inp"/></div>
              <div><label className="lbl">Note</label><input value={txForm.note} onChange={e=>setTxForm(f=>({...f,note:e.target.value}))} className="inp"/></div>
              <div className="flex gap-3"><button onClick={()=>setShowTxModal(false)} className="btn-secondary flex-1">Cancel</button><button onClick={saveTransfer} className="btn-primary flex-1" style={{background:accent}}>Transfer</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
