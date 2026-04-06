import React, { useState, useCallback, memo } from 'react';
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from './LoginView';

/* ── PDF / Email ─────────────────────────────────────────────────────────── */
const loadJsPDF   = () => new Promise((res,rej)=>{if(window.jspdf){res(window.jspdf.jsPDF);return;}const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';s.onload=()=>res(window.jspdf.jsPDF);s.onerror=rej;document.head.appendChild(s);});
const loadEmailJS = () => new Promise((res,rej)=>{if(window.emailjs){res();return;}const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';s.onload=()=>{window.emailjs.init(EMAILJS_PUBLIC_KEY);res();};s.onerror=rej;document.head.appendChild(s);});

const buildPDF = async (sale, store, user) => {
  const J=await loadJsPDF();const doc=new J({unit:'mm',format:[80,200]});
  const C=store?.currency||'GH';const W=80;let y=8;
  const ln=(t,sz,b,c)=>{doc.setFontSize(sz||8);doc.setFont('helvetica',b?'bold':'normal');doc.text(t,c?W/2:6,y,c?{align:'center'}:{});y+=(sz||8)*0.45+1.5;};
  const rule=()=>{doc.setDrawColor(180);doc.setLineDashPattern([1,1],0);doc.line(6,y,W-6,y);y+=3;};
  const row=(l,r)=>{doc.setFontSize(7.5);doc.setFont('helvetica','normal');doc.text(l,6,y);doc.text(r,W-6,y,{align:'right'});y+=4.5;};
  ln(store?.name||'NEXUS POS',11,true,true);if(store?.address)ln(store.address,7,false,true);if(store?.phone)ln(store.phone,7,false,true);
  rule();ln(`Receipt: ${sale.id}`,7.5,true,true);ln(new Date().toLocaleString(),7,false,true);ln(`Cashier: ${user?.name||''}${user?.staffId?` (${user.staffId})`:''}`,7,false,true);ln(`Customer: ${sale.customer}`,7,false,true);
  rule();sale.items.forEach(i=>row(`${i.name} ×${i.qty}`,`${C}${(i.price*i.qty).toFixed(2)}`));
  rule();row('Subtotal',`${C}${sale.subtotal.toFixed(2)}`);if(sale.discount>0)row('Discount',`-${C}${sale.discount.toFixed(2)}`);if(sale.loyaltyRedeemed>0)row('Loyalty',`-${C}${sale.loyaltyRedeemed.toFixed(2)}`);row(`Tax(${store?.taxRate||10}%)`,`${C}${sale.tax.toFixed(2)}`);
  y+=1;doc.setFontSize(10);doc.setFont('helvetica','bold');doc.text('TOTAL',6,y);doc.text(`${C}${sale.total.toFixed(2)}`,W-6,y,{align:'right'});y+=6;
  rule();const pm={cash:'Cash',mobile_money:'Mobile Money',split:'Split',credit:'Credit'};row('Payment',pm[sale.payment]||sale.payment);
  if(sale.payment==='cash'){row('Tendered',`${C}${(sale.amountPaid||0).toFixed(2)}`);if(sale.change>0)row('Change',`${C}${sale.change.toFixed(2)}`);}
  if(sale.payment==='mobile_money'){row('MoMo Name',sale.momoName||'');row('Txn ID',sale.momoTxnId||'');}
  if(sale.payment==='split'){row('Cash',`${C}${(sale.splitCash||0).toFixed(2)}`);row('MoMo',`${C}${(sale.splitMoMo||0).toFixed(2)}`);if(sale.momoName)row('MoMo Name',sale.momoName);}
  rule();if(user?.signature){doc.setFont('times','italic');doc.setFontSize(11);doc.text('Authorised by',W/2,y,{align:'center'});y+=5;doc.text(user.signature,W/2,y,{align:'center'});y+=7;}if(store?.receiptFooter)ln(store.receiptFooter,7,false,true);
  return doc.output('datauristring').split(',')[1];
};
const sendReceiptEmail=async(toEmail,sale,store,user,notify)=>{
  if(EMAILJS_SERVICE_ID==='YOUR_SERVICE_ID'){window.open(`mailto:${toEmail}?subject=Receipt ${sale.id}&body=${encodeURIComponent(`Receipt:${sale.id}\nTotal:${store?.currency||'GH'}${sale.total.toFixed(2)}`)}`);return;}
  try{notify('Preparing PDF…');await loadEmailJS();const pdf=await buildPDF(sale,store,user);await window.emailjs.send(EMAILJS_SERVICE_ID,EMAILJS_TEMPLATE_ID,{to_email:toEmail,receipt_id:sale.id,store_name:store?.name||'NEXUS POS',total:`${store?.currency||'GH'}${sale.total.toFixed(2)}`,cashier:user?.name||'',footer:store?.receiptFooter||'Thank you!',pdf_content:pdf});notify('Receipt sent to '+toEmail);}
  catch{notify('Email failed. Opening mail app.','error');window.open(`mailto:${toEmail}?subject=Receipt ${sale.id}`);}
};

/* ══════════════════════════════════════════════════════════════════════════
   CRITICAL FIX: CartPanel is defined OUTSIDE the main component so React
   never re-mounts it on parent state changes. This fixes the vanishing
   customer select, amount-paid field, and MoMo fields on every keystroke.
══════════════════════════════════════════════════════════════════════════ */
const CartPanel = memo(function CartPanel({
  cart, customers, heldSales, needsClockIn,
  customer, setCustomer,
  payment, setPayment,
  discount, setDiscount,
  amountPaid, setAmountPaid,
  momoName, setMomoName,
  momoTxnId, setMomoTxnId,
  splitCash, setSplitCash,
  splitMoMo, setSplitMoMo,
  splitMomoName, setSplitMomoName,
  splitMomoTxn, setSplitMomoTxn,
  redeemPoints, setRedeemPoints,
  subtotal, discountAmt, promoDiscount, loyaltyRedeem, tax, total, splitTotal, change,
  custObj, C, accent, store,
  onRemove, onQtyChange, onClear, onHold, onHeldList, onCheckout,
  onClose,
}) {
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>Order</span>
          {cart.length>0&&<span className="min-w-[18px] h-[18px] rounded-md flex items-center justify-center px-1 font-bold text-white" style={{fontSize:'0.625rem',background:accent}}>{cart.length}</span>}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(heldSales||[]).length>0&&<button onClick={onHeldList} className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 font-semibold flex-shrink-0" style={{fontSize:'0.6875rem'}}>{heldSales.length} held</button>}
          {cart.length>0&&<button onClick={onHold} className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium flex-shrink-0" style={{fontSize:'0.6875rem'}}>Park</button>}
          {cart.length>0&&<button onClick={onClear} className="px-2 py-1 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 font-medium flex-shrink-0" style={{fontSize:'0.6875rem'}}>Clear</button>}
          {onClose&&<button onClick={onClose} className="btn-ghost w-8 h-8 flex-shrink-0">✕</button>}
        </div>
      </div>

      {/* Clock-in warning */}
      {needsClockIn&&(
        <div className="mx-4 mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 flex-shrink-0">
          <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <span className="text-amber-700 dark:text-amber-400 font-medium" style={{fontSize:'0.75rem'}}>Clock in before making a sale</span>
        </div>
      )}

      {/* Customer selector — STABLE: lives in CartPanel, not remounted */}
      <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
        <label className="lbl">Customer</label>
        <select
          value={customer}
          onChange={e => setCustomer(e.target.value)}
          className="inp"
        >
          <option value="Walk-in">Walk-in Customer</option>
          {(customers||[]).map(c=>(
            <option key={c.id} value={c.name}>
              {c.name}{c.loyaltyPoints>0?` · ${c.loyaltyPoints}pts`:''}{(c.creditBalance||0)>0?` · owes ${C}${c.creditBalance.toFixed(0)}`:''}
            </option>
          ))}
        </select>
        {custObj&&(custObj.loyaltyPoints||0)>=10&&(
          <div className="flex items-center justify-between mt-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <span style={{fontSize:'0.6875rem',color:accent,fontWeight:600}}>
              {custObj.loyaltyPoints} pts = {C}{(custObj.loyaltyPoints/10).toFixed(2)} off
            </span>
            <button
              onClick={()=>setRedeemPoints(!redeemPoints)}
              className="w-10 h-5 rounded-full transition-colors relative flex-shrink-0"
              style={{background:redeemPoints?accent:'#e5e7eb'}}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${redeemPoints?'left-5':'left-0.5'}`}/>
            </button>
          </div>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-4 py-2 min-h-0">
        {cart.length===0?(
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-8">
            <svg className="w-10 h-10 opacity-25" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span style={{fontSize:'0.8125rem'}}>Tap a product to add it</span>
          </div>
        ):cart.map(item=>(
          <div key={item.id} className="flex items-center gap-2 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 dark:text-white truncate" style={{fontSize:'0.8125rem'}}>{item.name}</div>
              {item.variant&&<div className="text-gray-400" style={{fontSize:'0.6875rem'}}>{item.variant}</div>}
              <div className="text-emerald-600 font-medium" style={{fontSize:'0.75rem'}}>{C}{(item.price*item.qty).toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={()=>onQtyChange(item.id,item.qty-1)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-lg active:scale-90">−</button>
              <span className="w-6 text-center font-bold tabular-nums" style={{fontSize:'0.875rem'}}>{item.qty}</span>
              <button onClick={()=>onQtyChange(item.id,item.qty+1)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-lg active:scale-90">+</button>
            </div>
            <button onClick={()=>onRemove(item.id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 flex items-center justify-center font-bold flex-shrink-0">✕</button>
          </div>
        ))}
      </div>

      {/* Payment section */}
      <div className="flex-shrink-0 px-4 pt-3 pb-4 border-t border-gray-100 dark:border-gray-800 space-y-3 overflow-y-auto" style={{maxHeight:'55vh'}}>
        {/* Discount */}
        <div>
          <label className="lbl">Manual Discount ({C})</label>
          <input
            type="number" inputMode="decimal" min="0" step="0.01"
            value={discount}
            onChange={e=>setDiscount(e.target.value)}
            placeholder="0.00"
            className="inp"
          />
        </div>

        {/* Totals */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2.5 space-y-1">
          <div className="flex justify-between text-gray-500" style={{fontSize:'0.75rem'}}><span>Subtotal</span><span>{C}{subtotal.toFixed(2)}</span></div>
          {discountAmt>0&&<div className="flex justify-between text-emerald-600" style={{fontSize:'0.75rem'}}><span>Discount</span><span>-{C}{discountAmt.toFixed(2)}</span></div>}
          {promoDiscount>0&&<div className="flex justify-between text-violet-600" style={{fontSize:'0.75rem'}}><span>Promo</span><span>-{C}{promoDiscount.toFixed(2)}</span></div>}
          {loyaltyRedeem>0&&<div className="flex justify-between text-indigo-600" style={{fontSize:'0.75rem'}}><span>Loyalty pts</span><span>-{C}{loyaltyRedeem.toFixed(2)}</span></div>}
          <div className="flex justify-between text-gray-500" style={{fontSize:'0.75rem'}}><span>Tax ({store?.taxRate||10}%)</span><span>{C}{tax.toFixed(2)}</span></div>
          <div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700" style={{fontSize:'0.9375rem'}}>
            <span>Total</span><span className="text-emerald-600">{C}{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment method */}
        <div>
          <label className="lbl">Payment Method</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[['cash','Cash'],['mobile_money','MoMo'],['split','Split'],['credit','Credit']].map(([k,l])=>(
              <button key={k} onClick={()=>setPayment(k)}
                className="py-2.5 rounded-xl font-semibold border-2 transition-all"
                style={{fontSize:'0.6875rem',borderColor:payment===k?accent:'#e5e7eb',background:payment===k?`${accent}18`:'',color:payment===k?accent:'#6b7280'}}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Cash fields */}
        {payment==='cash'&&(
          <div>
            <label className="lbl">Amount Tendered ({C}) *</label>
            <input
              type="number" inputMode="decimal" min="0" step="0.01"
              value={amountPaid}
              onChange={e=>setAmountPaid(e.target.value)}
              placeholder={`Min ${C}${total.toFixed(2)}`}
              className="inp"
            />
            {amountPaid&&change>=0&&<div className="mt-1.5 text-emerald-600 font-bold" style={{fontSize:'0.9375rem'}}>Change: {C}{change.toFixed(2)}</div>}
          </div>
        )}

        {/* MoMo fields */}
        {payment==='mobile_money'&&(
          <div className="space-y-2.5">
            <div>
              <label className="lbl">MoMo Account Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={momoName}
                onChange={e=>setMomoName(e.target.value)}
                placeholder="e.g. John Mensah"
                className="inp"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="lbl">Transaction ID <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={momoTxnId}
                onChange={e=>setMomoTxnId(e.target.value)}
                placeholder="e.g. GH240322XXXX"
                className="inp"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {/* Split fields */}
        {payment==='split'&&(
          <div className="space-y-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
            <div className="flex justify-between font-semibold" style={{fontSize:'0.75rem',color:'#6b7280'}}>
              <span>Total: {C}{total.toFixed(2)}</span>
              <span className={Math.abs(splitTotal-total)<0.01?'text-emerald-600':'text-red-500'}>{C}{splitTotal.toFixed(2)} allocated</span>
            </div>
            <div>
              <label className="lbl">Cash Amount</label>
              <input type="number" inputMode="decimal" value={splitCash} onChange={e=>setSplitCash(e.target.value)} placeholder="0.00" className="inp"/>
            </div>
            <div>
              <label className="lbl">MoMo Amount</label>
              <input type="number" inputMode="decimal" value={splitMoMo} onChange={e=>setSplitMoMo(e.target.value)} placeholder="0.00" className="inp"/>
            </div>
            {parseFloat(splitMoMo)>0&&(
              <>
                <div>
                  <label className="lbl">MoMo Name <span className="text-red-500">*</span></label>
                  <input type="text" value={splitMomoName} onChange={e=>setSplitMomoName(e.target.value)} className="inp" autoComplete="off"/>
                </div>
                <div>
                  <label className="lbl">Txn ID <span className="text-red-500">*</span></label>
                  <input type="text" value={splitMomoTxn} onChange={e=>setSplitMomoTxn(e.target.value)} className="inp" autoComplete="off"/>
                </div>
              </>
            )}
          </div>
        )}

        {/* Credit */}
        {payment==='credit'&&(
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 text-amber-700 dark:text-amber-400" style={{fontSize:'0.75rem'}}>
            {customer==='Walk-in'
              ? 'Select a named customer to use the credit tab.'
              : `${C}${total.toFixed(2)} will be added to ${customer}'s tab. Current balance: ${C}${(custObj?.creditBalance||0).toFixed(2)}`
            }
          </div>
        )}

        {/* Checkout button */}
        <button
          onClick={onCheckout}
          disabled={!cart.length||needsClockIn}
          className={`w-full min-h-[52px] rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${cart.length&&!needsClockIn?'text-white active:scale-[0.98] shadow-sm':'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'}`}
          style={cart.length&&!needsClockIn?{background:accent,fontSize:'0.9375rem'}:{fontSize:'0.875rem'}}
        >
          {needsClockIn?'Clock in first to sell':'Review & Confirm →'}
        </button>
      </div>
    </div>
  );
});

/* ══════════════════════════════════════════════════════════════════════════ */
export default function POSView({
  products, cart, addToCart, removeFromCart, updateCartQty,
  onCompleteSale, customers, setCustomers,
  notify, storeSettings, appearance, currentUser,
  heldSales, setHeldSales, promotions, categories,
  activeShift, onClockIn,
}) {
  /* All state lives here — CartPanel receives it as props */
  const [search,       setSearch]       = useState('');
  const [cat,          setCat]          = useState('All');
  const [customer,     setCustomer]     = useState('Walk-in');
  const [payment,      setPayment]      = useState('cash');
  const [discount,     setDiscount]     = useState('');
  const [amountPaid,   setAmountPaid]   = useState('');
  const [momoName,     setMomoName]     = useState('');
  const [momoTxnId,    setMomoTxnId]    = useState('');
  const [splitCash,    setSplitCash]    = useState('');
  const [splitMoMo,    setSplitMoMo]    = useState('');
  const [splitMomoName,setSplitMomoName]= useState('');
  const [splitMomoTxn, setSplitMomoTxn] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [showCart,     setShowCart]     = useState(false);
  const [showHold,     setShowHold]     = useState(false);
  const [holdName,     setHoldName]     = useState('');
  const [showHeldList, setShowHeldList] = useState(false);
  const [variantModal, setVariantModal] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showReceipt,  setShowReceipt]  = useState(false);
  const [lastSale,     setLastSale]     = useState(null);
  const [receiptMode,  setReceiptMode]  = useState('');
  const [contact,      setContact]      = useState('');
  const [sending,      setSending]      = useState(false);

  const store  = storeSettings || {};
  const TAX    = (store.taxRate||10)/100;
  const C      = store.currency||'GH';
  const accent = appearance?.accentColor||'#4f46e5';
  const promos = promotions||[];
  const allCats= categories&&categories.length>0?['All',...categories]:['All','Beverages','Food','Household','Healthcare'];

  /* Totals */
  const subtotal      = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discountAmt   = Math.min(parseFloat(discount)||0,subtotal);
  const custObj       = (customers||[]).find(c=>c.name===customer);
  const maxRedeemGH   = Math.min((custObj?.loyaltyPoints||0)/10,subtotal-discountAmt);
  const loyaltyRedeem = redeemPoints&&custObj?maxRedeemGH:0;
  const promoDiscount = (()=>{let b=0;promos.filter(p=>p.active).forEach(p=>{if(p.type==='percent_off'){const d=(subtotal-discountAmt)*p.value/100;if(d>b)b=d;}else if(p.type==='fixed_off'&&subtotal>=(p.minOrder||0)){if(p.value>b)b=p.value;}});return Math.min(b,subtotal-discountAmt);})();
  const afterDiscount = subtotal-discountAmt-promoDiscount-loyaltyRedeem;
  const tax           = Math.max(afterDiscount,0)*TAX;
  const total         = Math.max(afterDiscount,0)+tax;
  const splitTotal    = (parseFloat(splitCash)||0)+(parseFloat(splitMoMo)||0);
  const change        = payment==='cash'?parseFloat(amountPaid)-total:0;

  const needsClockIn  = ['sales','staff'].includes(currentUser?.role)&&!activeShift;

  const filtered = (products||[]).filter(p=>
    (cat==='All'||p.category===cat)&&
    (p.name.toLowerCase().includes(search.toLowerCase())||(p.sku||'').toLowerCase().includes(search.toLowerCase()))
  );

  /* Stable callbacks — won't cause CartPanel re-render */
  const handleRemove  = useCallback(id=>removeFromCart(id),[removeFromCart]);
  const handleQtyChange=useCallback((id,q)=>updateCartQty(id,q),[updateCartQty]);
  const handleClear   = useCallback(()=>cart.forEach(i=>removeFromCart(i.id)),[cart,removeFromCart]);

  const validatePayment=()=>{
    if(needsClockIn){notify('Clock in before making a sale.','error');return false;}
    if(payment==='cash'){if(!amountPaid||isNaN(parseFloat(amountPaid))){notify('Enter amount paid.','error');return false;}if(parseFloat(amountPaid)<total){notify('Insufficient payment.','error');return false;}}
    if(payment==='mobile_money'){if(!momoName.trim()){notify('MoMo name required.','error');return false;}if(!momoTxnId.trim()){notify('Transaction ID required.','error');return false;}}
    if(payment==='split'){if(Math.abs(splitTotal-total)>0.01){notify(`Split must equal total (${C}${total.toFixed(2)}).`,'error');return false;}if(parseFloat(splitMoMo)>0&&(!splitMomoName.trim()||!splitMomoTxn.trim())){notify('MoMo name and Txn ID required.','error');return false;}}
    if(payment==='credit'&&customer==='Walk-in'){notify('Select a customer for credit payment.','error');return false;}
    return true;
  };

  const openCheckout=()=>{if(!cart.length){notify('Cart is empty.','error');return;}if(!validatePayment())return;setShowCheckout(true);setShowCart(false);};

  const confirmSale=()=>{
    const saleData={
      items:cart.map(i=>({name:i.name,qty:i.qty,price:i.price})),
      subtotal,tax,discount:discountAmt+promoDiscount,loyaltyRedeemed:loyaltyRedeem,total,payment,customer,
      ...(payment==='cash'?{amountPaid:parseFloat(amountPaid),change:Math.max(0,change)}:{}),
      ...(payment==='mobile_money'?{momoName,momoTxnId}:{}),
      ...(payment==='split'?{splitCash:parseFloat(splitCash)||0,splitMoMo:parseFloat(splitMoMo)||0,momoName:splitMomoName,momoTxnId:splitMomoTxn}:{}),
      ...(payment==='credit'?{creditNote:`Credit added to ${customer}'s tab`}:{}),
    };
    if(custObj){
      const earned=Math.floor(total);
      setCustomers(prev=>prev.map(c=>c.id===custObj.id?{...c,loyaltyPoints:(c.loyaltyPoints||0)-Math.floor(loyaltyRedeem*10)+earned,totalSpent:(c.totalSpent||0)+total,...(payment==='credit'?{creditBalance:(c.creditBalance||0)+total}:{})}:c));
    }
    const sale=onCompleteSale(saleData);
    if(!sale){setShowCheckout(false);return;}
    setLastSale({...saleData,id:sale.id||'S----'});
    setShowCheckout(false);setShowReceipt(true);
    setDiscount('');setAmountPaid('');setMomoName('');setMomoTxnId('');setSplitCash('');setSplitMoMo('');setSplitMomoName('');setSplitMomoTxn('');
    setCustomer('Walk-in');setPayment('cash');setReceiptMode('');setRedeemPoints(false);
    setContact(custObj?.phone||custObj?.email||'');
  };

  const holdSale=()=>{
    if(!cart.length){notify('Cart is empty.','error');return;}
    const name=holdName.trim()||`Held #${Date.now()%10000}`;
    setHeldSales(prev=>[...prev,{id:Date.now(),name,cart:[...cart],customer,payment,discount}]);
    cart.forEach(i=>removeFromCart(i.id));setHoldName('');setShowHold(false);
    notify(`Sale parked as "${name}".`);
  };
  const resumeHeld=held=>{
    cart.forEach(i=>removeFromCart(i.id));held.cart.forEach(i=>addToCart(i,()=>{}));
    setCustomer(held.customer||'Walk-in');setDiscount(held.discount||'');
    setHeldSales(prev=>prev.filter(h=>h.id!==held.id));setShowHeldList(false);
    notify(`Resumed "${held.name}".`);
  };

  const handlePrint=()=>{
    if(!lastSale)return;
    const pm={cash:'Cash',mobile_money:'Mobile Money',split:'Split',credit:'Credit'};
    const w=window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html><head><title>Receipt</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:11px;max-width:280px;margin:0 auto;padding:16px 12px}.c{text-align:center}.b{font-weight:700}.row{display:flex;justify-content:space-between;margin:2px 0}hr{border:none;border-top:1px dashed #bbb;margin:8px 0}.sig{font-family:cursive;font-size:18px;text-align:center}.ft{text-align:center;font-size:10px;color:#555;margin-top:6px}</style></head><body><div class="c b" style="font-size:13px">${store.name||'NEXUS POS'}</div>${store.address?`<div class="c">${store.address}</div>`:''}${store.phone?`<div class="c">${store.phone}</div>`:''}<hr/><div class="c">Receipt: <b>${lastSale.id}</b></div><div class="c">${new Date().toLocaleString()}</div><div class="c">Cashier: ${currentUser?.name||''}</div><div class="c">Customer: ${lastSale.customer}</div><hr/>${lastSale.items.map(i=>`<div class="row"><span>${i.name} ×${i.qty}</span><span>${C}${(i.price*i.qty).toFixed(2)}</span></div>`).join('')}<hr/><div class="row"><span>Subtotal</span><span>${C}${lastSale.subtotal.toFixed(2)}</span></div>${lastSale.discount>0?`<div class="row"><span>Discount</span><span>-${C}${lastSale.discount.toFixed(2)}</span></div>`:''}<div class="row"><span>Tax(${store.taxRate||10}%)</span><span>${C}${lastSale.tax.toFixed(2)}</span></div><div class="row b" style="font-size:12px"><span>TOTAL</span><span>${C}${lastSale.total.toFixed(2)}</span></div><hr/><div class="row"><span>Payment</span><span>${pm[lastSale.payment]||lastSale.payment}</span></div>${lastSale.payment==='cash'?`<div class="row"><span>Tendered</span><span>${C}${lastSale.amountPaid?.toFixed(2)}</span></div><div class="row"><span>Change</span><span>${C}${lastSale.change?.toFixed(2)}</span></div>`:''}${lastSale.payment==='mobile_money'?`<div class="row"><span>MoMo</span><span>${lastSale.momoName}</span></div><div class="row"><span>Txn</span><span>${lastSale.momoTxnId}</span></div>`:''}${lastSale.payment==='split'?`<div class="row"><span>Cash</span><span>${C}${lastSale.splitCash?.toFixed(2)}</span></div><div class="row"><span>MoMo</span><span>${C}${lastSale.splitMoMo?.toFixed(2)}</span></div>`:''}<hr/>${currentUser?.signature?`<div class="c" style="font-size:9px;color:#888">Authorised by</div><div class="sig">${currentUser.signature}</div>`:''}<div class="ft">${store.receiptFooter||'Thank you!'}</div></body></html>`);
    w.document.close();setTimeout(()=>w.print(),400);
  };

  /* Shared CartPanel props */
  const cartPanelProps = {
    cart, customers, heldSales, needsClockIn,
    customer, setCustomer,
    payment, setPayment,
    discount, setDiscount,
    amountPaid, setAmountPaid,
    momoName, setMomoName,
    momoTxnId, setMomoTxnId,
    splitCash, setSplitCash,
    splitMoMo, setSplitMoMo,
    splitMomoName, setSplitMomoName,
    splitMomoTxn, setSplitMomoTxn,
    redeemPoints, setRedeemPoints,
    subtotal, discountAmt, promoDiscount, loyaltyRedeem, tax, total, splitTotal, change,
    custObj, C, accent, store,
    onRemove: handleRemove,
    onQtyChange: handleQtyChange,
    onClear: handleClear,
    onHold: ()=>setShowHold(true),
    onHeldList: ()=>setShowHeldList(true),
    onCheckout: openCheckout,
  };

  return (
    <>
      {/* Hold modal */}
      {showHold&&(<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"><div className="card p-5 w-full max-w-sm fade-in"><div className="font-bold text-gray-900 dark:text-white mb-3" style={{fontSize:'1rem'}}>Park Current Sale</div><label className="lbl">Label (optional)</label><input value={holdName} onChange={e=>setHoldName(e.target.value)} placeholder="e.g. Table 3" className="inp mb-4" autoFocus/><div className="flex gap-3"><button onClick={()=>setShowHold(false)} className="btn-secondary flex-1">Cancel</button><button onClick={holdSale} className="btn-primary flex-1" style={{background:accent}}>Park Sale</button></div></div></div>)}

      {/* Held sales list */}
      {showHeldList&&(<div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"><div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md slide-up"><div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div><div className="flex justify-between items-center px-5 py-3"><div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem'}}>Held Sales</div><button onClick={()=>setShowHeldList(false)} className="btn-ghost w-8 h-8">✕</button></div><div className="px-5 pb-6 space-y-2 max-h-72 overflow-y-auto">{(heldSales||[]).map(h=>(<div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"><div><div className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>{h.name}</div><div className="text-gray-400" style={{fontSize:'0.6875rem'}}>{h.cart.length} items · {h.customer}</div></div><div className="flex gap-2"><button onClick={()=>resumeHeld(h)} className="btn-primary text-xs min-h-[32px] px-3" style={{background:accent}}>Resume</button><button onClick={()=>setHeldSales(prev=>prev.filter(x=>x.id!==h.id))} className="btn-danger text-xs min-h-[32px] px-2">✕</button></div></div>))}</div></div></div>)}

      {/* Variant selector */}
      {variantModal&&(<div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"><div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md slide-up"><div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div><div className="flex justify-between items-center px-5 py-3"><div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem'}}>{variantModal.name}</div><button onClick={()=>setVariantModal(null)} className="btn-ghost w-8 h-8">✕</button></div><div className="px-5 pb-6 space-y-2 max-h-80 overflow-y-auto">{(variantModal.variants||[]).map((v,i)=>(<button key={i} onClick={()=>{addToCart({...variantModal,id:`${variantModal.id}_${i}`,price:v.price||variantModal.price,stock:v.stock||0,variant:v.label},()=>{});setVariantModal(null);}} disabled={v.stock===0} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${v.stock===0?'opacity-40 cursor-not-allowed border-gray-200':'border-gray-200 hover:border-indigo-500 active:scale-[0.98]'}`}><span className="font-semibold text-gray-900 dark:text-white" style={{fontSize:'0.875rem'}}>{v.label}</span><div className="text-right"><div className="font-bold text-emerald-600" style={{fontSize:'0.875rem'}}>{C}{(v.price||variantModal.price).toFixed(2)}</div><div className="text-gray-400" style={{fontSize:'0.6875rem'}}>{v.stock===0?'Out of stock':`${v.stock} left`}</div></div></button>))}</div></div></div>)}

      {/* CHECKOUT CONFIRMATION */}
      {showCheckout&&(<div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"><div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md max-h-[92vh] overflow-y-auto slide-up"><div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div><div className="flex justify-between items-center px-5 py-3"><div><div className="font-bold text-gray-900 dark:text-white" style={{fontSize:'1rem'}}>Confirm Sale</div><div className="text-gray-400" style={{fontSize:'0.75rem'}}>Review before completing</div></div><button onClick={()=>setShowCheckout(false)} className="btn-ghost w-8 h-8">✕</button></div><div className="px-5 pb-6 space-y-4"><div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4"><div className="font-semibold text-gray-900 dark:text-white mb-3" style={{fontSize:'0.8125rem'}}>{cart.length} item{cart.length!==1?'s':''} · {customer}</div><div className="space-y-2">{cart.map((it,i)=>(<div key={i} className="flex justify-between" style={{fontSize:'0.8125rem'}}><span className="text-gray-600 dark:text-gray-300">{it.name}{it.variant?` (${it.variant})`:''} ×{it.qty}</span><span className="font-semibold text-gray-900 dark:text-white">{C}{(it.price*it.qty).toFixed(2)}</span></div>))}</div><div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 space-y-1">{discountAmt>0&&<div className="flex justify-between text-emerald-600" style={{fontSize:'0.75rem'}}><span>Discount</span><span>-{C}{discountAmt.toFixed(2)}</span></div>}{promoDiscount>0&&<div className="flex justify-between text-violet-600" style={{fontSize:'0.75rem'}}><span>Promo</span><span>-{C}{promoDiscount.toFixed(2)}</span></div>}{loyaltyRedeem>0&&<div className="flex justify-between text-indigo-600" style={{fontSize:'0.75rem'}}><span>Loyalty</span><span>-{C}{loyaltyRedeem.toFixed(2)}</span></div>}<div className="flex justify-between text-gray-500" style={{fontSize:'0.75rem'}}><span>Tax ({store.taxRate||10}%)</span><span>{C}{tax.toFixed(2)}</span></div><div className="flex justify-between font-bold text-gray-900 dark:text-white pt-1 border-t border-gray-200 dark:border-gray-700" style={{fontSize:'1.0625rem'}}><span>Total</span><span className="text-emerald-600">{C}{total.toFixed(2)}</span></div></div></div><div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3"><div className="flex justify-between" style={{fontSize:'0.8125rem'}}><span className="text-gray-500">Payment</span><span className="font-semibold text-gray-900 dark:text-white">{{cash:'Cash',mobile_money:'Mobile Money',split:'Split Payment',credit:'Credit Tab'}[payment]}</span></div>{payment==='cash'&&amountPaid&&(<><div className="flex justify-between mt-1" style={{fontSize:'0.8125rem'}}><span className="text-gray-500">Tendered</span><span>{C}{parseFloat(amountPaid).toFixed(2)}</span></div>{change>0&&<div className="flex justify-between mt-1 font-bold text-emerald-600" style={{fontSize:'0.875rem'}}><span>Change</span><span>{C}{change.toFixed(2)}</span></div>}</>)}{payment==='mobile_money'&&(<><div className="flex justify-between mt-1" style={{fontSize:'0.8125rem'}}><span className="text-gray-500">MoMo Name</span><span className="font-medium text-gray-900 dark:text-white">{momoName}</span></div><div className="flex justify-between mt-1" style={{fontSize:'0.8125rem'}}><span className="text-gray-500">Txn ID</span><span className="font-medium text-gray-900 dark:text-white">{momoTxnId}</span></div></>)}{payment==='split'&&(<><div className="flex justify-between mt-1" style={{fontSize:'0.8125rem'}}><span className="text-gray-500">Cash</span><span>{C}{(parseFloat(splitCash)||0).toFixed(2)}</span></div><div className="flex justify-between mt-1" style={{fontSize:'0.8125rem'}}><span className="text-gray-500">MoMo</span><span>{C}{(parseFloat(splitMoMo)||0).toFixed(2)}</span></div></>)}</div><div className="flex gap-3"><button onClick={()=>setShowCheckout(false)} className="btn-secondary flex-1" style={{fontSize:'0.875rem'}}>← Edit</button><button onClick={confirmSale} className="flex-1 min-h-[52px] rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-[0.98]" style={{background:'#059669',fontSize:'0.9375rem'}}><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>Confirm Sale</button></div></div></div></div>)}

      {/* RECEIPT */}
      {showReceipt&&lastSale&&(<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"><div className="bg-white dark:bg-gray-900 rounded-t-3xl w-full max-w-md max-h-[90vh] overflow-y-auto slide-up"><div className="flex justify-center pt-3 pb-1"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div><div className="p-5"><div className="text-center mb-4"><div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-3"><svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div><div className="font-bold text-gray-900 dark:text-white text-lg">Sale Complete</div><div className="text-gray-500 mt-0.5" style={{fontSize:'0.8125rem'}}>{lastSale.id} · {C}{lastSale.total.toFixed(2)}</div></div><div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-4 divide-y divide-gray-200 dark:divide-gray-700"><div className="pb-2 space-y-1">{lastSale.items.map((i,idx)=>(<div key={idx} className="flex justify-between" style={{fontSize:'0.75rem'}}><span className="text-gray-500">{i.name} ×{i.qty}</span><span className="font-medium text-gray-900 dark:text-white">{C}{(i.price*i.qty).toFixed(2)}</span></div>))}</div><div className="pt-2 flex justify-between font-bold" style={{fontSize:'0.875rem'}}><span className="text-gray-900 dark:text-white">Total</span><span className="text-emerald-600">{C}{lastSale.total.toFixed(2)}</span></div>{currentUser?.signature&&<div className="pt-2 text-center"><div className="text-gray-400" style={{fontSize:'0.625rem'}}>Authorised by</div><div style={{fontFamily:'cursive',fontSize:18}}>{currentUser.signature}</div></div>}</div><button onClick={handlePrint} className="btn-primary w-full mb-3" style={{background:accent}}><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>Print Receipt</button><div className="grid grid-cols-2 gap-2 mb-3">{[['email','Email PDF'],['sms','Send SMS']].map(([mode,label])=>(<button key={mode} onClick={()=>setReceiptMode(receiptMode===mode?'':mode)} className="py-2.5 rounded-xl font-semibold border-2 transition-all" style={{fontSize:'0.75rem',borderColor:receiptMode===mode?accent:'#e5e7eb',background:receiptMode===mode?`${accent}15`:'',color:receiptMode===mode?accent:'#6b7280'}}>{label}</button>))}</div>{receiptMode&&(<div className="mb-3"><label className="lbl">{receiptMode==='email'?'Customer Email':'Customer Phone'}</label><div className="flex gap-2"><input type={receiptMode==='email'?'email':'tel'} value={contact} onChange={e=>setContact(e.target.value)} placeholder={receiptMode==='email'?'customer@email.com':'0244123456'} className="inp flex-1"/><button onClick={async()=>{if(!contact){notify('Enter contact.','error');return;}if(receiptMode==='sms'){window.open(`sms:${contact}?body=${encodeURIComponent(`${store.name||'NEXUS POS'}\nReceipt:${lastSale.id}\nTotal:${C}${lastSale.total.toFixed(2)}`)}`);notify('SMS app opened.');}else{setSending(true);await sendReceiptEmail(contact,lastSale,store,currentUser,notify);setSending(false);}}} disabled={sending} className="btn-success px-4" style={{fontSize:'0.8125rem'}}>{sending?<span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full spin"/>:'Send'}</button></div></div>)}<button onClick={()=>{setShowReceipt(false);setReceiptMode('');}} className="btn-secondary w-full">New Sale</button></div></div></div>)}

      {/* MAIN LAYOUT */}
      <div className="flex h-full lg:flex-row flex-col overflow-hidden">
        {/* Product grid */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-3 pt-3 pb-2 space-y-2">
            {needsClockIn&&<div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 font-medium flex items-center gap-2" style={{fontSize:'0.75rem'}}><svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>Clock in to start selling</div>}
            {promoDiscount>0&&cart.length>0&&<div className="px-3 py-1.5 bg-violet-50 dark:bg-violet-900/20 rounded-lg text-violet-600 font-semibold" style={{fontSize:'0.75rem'}}>Promo applied — save {C}{promoDiscount.toFixed(2)}</div>}
            <div className="relative"><svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products…" className="inp pl-9"/></div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">{allCats.map(c=>(<button key={c} onClick={()=>setCat(c)} className={`flex-shrink-0 px-3 py-1.5 rounded-full font-medium transition-all ${cat===c?'text-white':'bg-gray-100 dark:bg-gray-800 text-gray-500'}`} style={{fontSize:'0.75rem',...(cat===c?{background:accent}:{})}}>{c}</button>))}</div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 content-start" style={{paddingBottom:'5rem'}}>
            {filtered.map(p=>{
              const inCart=cart.find(c=>c.id===p.id||c.id?.startsWith(p.id+'_'));
              const hasVars=(p.variants||[]).length>0;
              const oos=p.stock===0&&!hasVars;
              return(
                <button
                  key={p.id}
                  onClick={()=>{if(oos)return;if(hasVars)setVariantModal(p);else addToCart(p,()=>{});}}
                  disabled={oos}
                  className={`relative text-left bg-white dark:bg-gray-900 rounded-xl p-3 border-2 transition-all select-none ${inCart?'border-indigo-500':'border-gray-200 dark:border-gray-800'} ${oos?'opacity-40 cursor-not-allowed':'hover:border-gray-300 active:scale-[0.97] cursor-pointer'}`}
                >
                  {inCart&&<div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center font-bold text-white pointer-events-none" style={{fontSize:'0.625rem',background:accent}}>{inCart.qty}</div>}
                  {hasVars&&<div className="absolute top-2 left-2 px-1 py-0.5 rounded-md font-semibold" style={{fontSize:'0.5rem',background:`${accent}20`,color:accent}}>VARS</div>}
                  <div className="w-full aspect-square rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-2 overflow-hidden">
                    {p.image&&p.image.startsWith('data:')?<img src={p.image} alt={p.name} className="w-full h-full object-cover"/>:<svg className="w-7 h-7 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>}
                  </div>
                  <div className="text-gray-400 uppercase tracking-wide truncate mb-0.5" style={{fontSize:'0.625rem',fontWeight:500}}>{p.category}</div>
                  <div className="font-semibold text-gray-900 dark:text-white leading-tight line-clamp-2 mb-1" style={{fontSize:'0.75rem'}}>{p.name}</div>
                  <div className="font-bold text-emerald-600" style={{fontSize:'0.875rem'}}>{C}{p.price.toFixed(2)}</div>
                  <div className={`font-medium mt-0.5 ${oos?'text-red-400':'text-gray-400'}`} style={{fontSize:'0.6875rem'}}>{oos?'Out of stock':hasVars?'Select variant':`${p.stock} left`}</div>
                </button>
              );
            })}
            {filtered.length===0&&<div className="col-span-full text-center py-12 text-gray-400">No products found.</div>}
          </div>
        </div>

        {/* Desktop cart */}
        <div className="hidden lg:flex flex-col w-80 xl:w-96 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 flex-shrink-0 overflow-hidden">
          <CartPanel {...cartPanelProps}/>
        </div>

        {/* Mobile cart sheet */}
        {showCart&&(
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="absolute inset-0 bg-black/50" onClick={()=>setShowCart(false)}/>
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl h-[92vh] flex flex-col slide-up">
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0"><div className="w-9 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
              <CartPanel {...cartPanelProps} onClose={()=>setShowCart(false)}/>
            </div>
          </div>
        )}

        {/* Mobile FAB */}
        <button
          onClick={()=>setShowCart(true)}
          className="lg:hidden fixed right-4 w-14 h-14 text-white rounded-full shadow-lg flex items-center justify-center z-30 active:scale-95"
          style={{bottom:'calc(env(safe-area-inset-bottom,0px)+68px)',background:accent}}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          {cart.length>0&&<span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center font-bold" style={{fontSize:'0.625rem'}}>{cart.length}</span>}
        </button>
      </div>
    </>
  );
}
