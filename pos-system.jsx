import { useState, useRef, useCallback } from "react";
import { INITIAL_STORES } from "./src/data/stores.js";
import { INITIAL_USERS } from "./src/data/users.js";
import { INITIAL_PRODUCTS } from "./src/data/products.js";
import { INITIAL_SALES } from "./src/data/sales.js";
import { INITIAL_CUSTOMERS } from "./src/data/customers.js";
import { CATEGORIES } from "./src/data/constants.js";

// ─── HELPERS ──────────────────────────────────────────────────
const fmt = (n) => Number(n).toLocaleString("en-GH", { minimumFractionDigits:2, maximumFractionDigits:2 });

// ─── ICONS ────────────────────────────────────────────────────
const I = ({ n, s=18 }) => {
  const d = {
    dashboard: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
    pos:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
    inventory: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
    sales:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/></svg>,
    customers: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    reports:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    settings:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
    stores:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    users:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    cart:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>,
    plus:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    minus:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    search:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    trash:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>,
    check:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
    alert:     <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    x:         <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    eye:       <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    logout:    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    menu:      <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    barcode:   <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14M21 5v14"/></svg>,
    star:      <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    download:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    trending:  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  };
  return d[n] || null;
};

// ─── ROOT APP ─────────────────────────────────────────────────
export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [stores, setStores] = useState(INITIAL_STORES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [sales, setSales] = useState(INITIAL_SALES);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [notification, setNotification] = useState(null);

  const notify = useCallback((msg, type="success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const logout = () => setCurrentUser(null);

  const addSale = (sale) => setSales(p => [sale, ...p]);
  const deductStock = (cartItems) => setProducts(p => p.map(prod => {
    const item = cartItems.find(c => c.id === prod.id);
    return item ? { ...prod, stock: prod.stock - item.qty } : prod;
  }));

  const C = { blue:"#2980b9", orange:"#e67e22", green:"#27ae60", red:"#e74c3c", pink:"#e91e8c", purple:"#7c3aed", dkBlue:"#1565c0", dkGreen:"#1b8a3c", sidebar:"#222b35" };

  if (!currentUser) {
    return <LoginPage users={users} onLogin={setCurrentUser} notify={notify} notification={notification} C={C} />;
  }

  return (
    <Shell
      currentUser={currentUser} logout={logout} stores={stores} setStores={setStores}
      users={users} setUsers={setUsers} products={products} setProducts={setProducts}
      sales={sales} setSales={setSales} customers={customers} setCustomers={setCustomers}
      addSale={addSale} deductStock={deductStock} notify={notify} notification={notification} C={C}
    />
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────
function LoginPage({ users, onLogin, notify, notification, C }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [selectedDemo, setSelectedDemo] = useState(null);

  const demos = [
    { role:"superadmin", label:"Super Admin",  color:C.purple, icon:"👑", hint:"superadmin / super123", desc:"Manage all stores & users" },
    { role:"admin",      label:"Admin",         color:C.blue,   icon:"🛡️", hint:"admin / admin123",      desc:"Full store management" },
    { role:"sales",      label:"Sales Girl",    color:C.pink,   icon:"🏷️", hint:"sales / sales123",      desc:"POS & daily sales" },
  ];

  const handleLogin = () => {
    const user = users.find(u => u.username === username.trim() && u.password === password);
    if (user) { onLogin(user); }
    else { setError("Invalid username or password"); }
  };

  const fillDemo = (demo) => {
    const u = users.find(u => u.role === demo.role);
    if (u) { setUsername(u.username); setPassword(u.password); setSelectedDemo(demo.role); setError(""); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f2f5", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        input:focus { outline:none; border-color:#2980b9 !important; }
        .demo-card { transition:all 0.2s; cursor:pointer; }
        .demo-card:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.12); }
      `}</style>

      {notification && (
        <div style={{ position:"fixed", top:16, right:16, background: notification.type==="success" ? C.green : C.red, color:"#fff", padding:"10px 18px", borderRadius:8, fontWeight:600, fontSize:13, zIndex:9999 }}>
          {notification.msg}
        </div>
      )}

      <div style={{ width:"100%", maxWidth:900, padding:"0 16px" }}>
        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:12, background:"#fff", padding:"14px 28px", borderRadius:50, boxShadow:"0 2px 12px rgba(0,0,0,0.08)", marginBottom:14 }}>
            <div style={{ width:36, height:36, background:C.blue, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:18 }}>N</div>
            <span style={{ fontWeight:700, fontSize:20, color:"#1a202c" }}>NEXUS POS</span>
          </div>
          <div style={{ fontSize:14, color:"#718096" }}>Enterprise Point of Sale & Inventory System</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24, alignItems:"start" }}>
          {/* Login Form */}
          <div style={{ background:"#fff", borderRadius:16, padding:32, boxShadow:"0 4px 24px rgba(0,0,0,0.08)" }}>
            <div style={{ fontSize:20, fontWeight:700, color:"#1a202c", marginBottom:6 }}>Welcome back</div>
            <div style={{ fontSize:13, color:"#718096", marginBottom:28 }}>Sign in to your account</div>

            {error && <div style={{ background:"#fde8e8", color:"#c0392b", padding:"10px 14px", borderRadius:8, fontSize:13, marginBottom:16, fontWeight:500 }}>{error}</div>}

            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#718096", textTransform:"uppercase", letterSpacing:"0.5px", display:"block", marginBottom:6 }}>Username</label>
              <input value={username} onChange={e => { setUsername(e.target.value); setError(""); }}
                placeholder="Enter username"
                style={{ width:"100%", padding:"11px 14px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:14, color:"#1a202c" }} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:600, color:"#718096", textTransform:"uppercase", letterSpacing:"0.5px", display:"block", marginBottom:6 }}>Password</label>
              <div style={{ position:"relative" }}>
                <input type={showPw ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }}
                  placeholder="Enter password" onKeyDown={e => e.key==="Enter" && handleLogin()}
                  style={{ width:"100%", padding:"11px 40px 11px 14px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:14, color:"#1a202c" }} />
                <button onClick={() => setShowPw(!showPw)} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:"#718096", cursor:"pointer", display:"flex" }}>
                  <I n="eye" s={16} />
                </button>
              </div>
            </div>

            <button onClick={handleLogin} style={{ width:"100%", padding:"12px", background:C.blue, color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:15, cursor:"pointer", transition:"all 0.2s" }}
              onMouseOver={e=>e.target.style.background="#1a6fa8"} onMouseOut={e=>e.target.style.background=C.blue}>
              Sign In →
            </button>
          </div>

          {/* Demo Accounts */}
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"#718096", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:12 }}>Quick Access — Demo Accounts</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {demos.map(demo => (
                <div key={demo.role} className="demo-card" onClick={() => fillDemo(demo)}
                  style={{ background:"#fff", borderRadius:12, padding:"16px 20px", boxShadow:"0 2px 8px rgba(0,0,0,0.06)", border:`2px solid ${selectedDemo===demo.role ? demo.color : "transparent"}`, display:"flex", alignItems:"center", gap:14 }}>
                  <div style={{ width:46, height:46, borderRadius:10, background:demo.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{demo.icon}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:"#1a202c" }}>{demo.label}</div>
                    <div style={{ fontSize:12, color:"#718096", marginTop:2 }}>{demo.desc}</div>
                    <div style={{ fontSize:11, color:demo.color, marginTop:4, fontFamily:"monospace", fontWeight:600 }}>{demo.hint}</div>
                  </div>
                  {selectedDemo===demo.role && <div style={{ color:demo.color }}><I n="check" s={18} /></div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────
function Shell({ currentUser, logout, stores, setStores, users, setUsers, products, setProducts, sales, setSales, customers, setCustomers, addSale, deductStock, notify, notification, C }) {
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cart, setCart] = useState([]);

  const role = currentUser.role;
  const myStore = stores.find(s => s.id === currentUser.storeId);
  const myProducts = role==="superadmin" ? products : products.filter(p => p.storeId===currentUser.storeId);
  const mySales = role==="superadmin" ? sales : sales.filter(s => s.storeId===currentUser.storeId);
  const myCustomers = role==="superadmin" ? customers : customers.filter(c => c.storeId===currentUser.storeId);

  // Nav items by role
  const navItems = {
    superadmin: [
      { id:"dashboard", icon:"dashboard", label:"Dashboard" },
      { id:"stores",    icon:"stores",    label:"Manage Stores" },
      { id:"users",     icon:"users",     label:"Users & Roles" },
      { id:"reports",   icon:"reports",   label:"Global Reports" },
      { id:"settings",  icon:"settings",  label:"Settings" },
    ],
    admin: [
      { id:"dashboard", icon:"dashboard", label:"Dashboard" },
      { id:"pos",       icon:"pos",       label:"Point of Sale", badge: cart.length||null },
      { id:"inventory", icon:"inventory", label:"Inventory" },
      { id:"sales",     icon:"sales",     label:"Sales History" },
      { id:"customers", icon:"customers", label:"Customers" },
      { id:"reports",   icon:"reports",   label:"Reports" },
      { id:"users",     icon:"users",     label:"Staff" },
      { id:"settings",  icon:"settings",  label:"Settings" },
    ],
    sales: [
      { id:"dashboard", icon:"dashboard", label:"My Dashboard" },
      { id:"pos",       icon:"pos",       label:"Point of Sale", badge: cart.length||null },
      { id:"mysales",   icon:"sales",     label:"My Sales" },
      { id:"customers", icon:"customers", label:"Customers" },
    ],
  };

  const roleMeta = {
    superadmin: { label:"Super Admin", color:C.purple, bg:"#7c3aed" },
    admin:      { label:"Admin",       color:C.blue,   bg:C.blue },
    sales:      { label:"Sales",       color:C.pink,   bg:C.pink },
  };
  const rm = roleMeta[role];

  const addToCart = (product) => {
    if (product.stock===0) { notify("Out of stock!","error"); return; }
    setCart(prev => {
      const ex = prev.find(i=>i.id===product.id);
      if (ex) return prev.map(i=>i.id===product.id ? {...i,qty:i.qty+1} : i);
      return [...prev,{...product,qty:1}];
    });
  };

  const completeSale = (saleData) => {
    const newSale = { id:`S${20000+sales.length+1}`, date:"2026-03-22", time:new Date().toTimeString().slice(0,5), cashier:currentUser.name, storeId:currentUser.storeId, ...saleData };
    addSale(newSale);
    deductStock(cart);
    setCart([]);
    notify(`Sale #${newSale.id} — GH₵${saleData.total.toFixed(2)} complete!`,"success");
    return newSale;
  };

  const th = { padding:"9px 12px", textAlign:"left", fontWeight:600, fontSize:11, textTransform:"uppercase", letterSpacing:"0.4px", background:"#f5f6fa", color:"#718096", borderBottom:"1px solid #e2e8f0" };
  const td = { padding:"8px 12px", fontSize:13, borderBottom:"1px solid #f0f2f5", color:"#1a202c" };

  return (
    <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans','Segoe UI',sans-serif", background:"#f0f2f5" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#e2e8f0; border-radius:2px; }
        input:focus, select:focus { outline:none; border-color:#2980b9 !important; }
        button { cursor:pointer; border:none; font-family:inherit; }
        .nav-btn { transition:all 0.15s; }
        .nav-btn:hover { background:rgba(255,255,255,0.08) !important; }
        .nav-btn.active { background:${rm.bg} !important; color:#fff !important; }
        .hover-row:hover { background:#f8faff; }
        .product-tile:hover { transform:translateY(-2px); box-shadow:0 6px 20px rgba(0,0,0,0.1); }
        .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index:1000; backdrop-filter:blur(3px); }
      `}</style>

      {notification && (
        <div style={{ position:"fixed", top:14, right:14, zIndex:9999, background:notification.type==="success" ? C.green : C.red, color:"#fff", padding:"10px 18px", borderRadius:8, fontWeight:600, fontSize:13, boxShadow:"0 4px 16px rgba(0,0,0,0.2)" }}>
          {notification.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside style={{ width:sidebarOpen?220:60, background:C.sidebar, display:"flex", flexDirection:"column", transition:"width 0.25s", overflow:"hidden", position:"sticky", top:0, height:"100vh", flexShrink:0 }}>
        <div style={{ padding:"16px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10, minHeight:60 }}>
          <div style={{ width:34, height:34, borderRadius:8, background:rm.bg, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, flexShrink:0 }}>N</div>
          {sidebarOpen && <div><div style={{ fontWeight:700, fontSize:14, color:"#fff" }}>NEXUS POS</div><div style={{ fontSize:9, color:"#9eb3c2", letterSpacing:"1px" }}>ENTERPRISE</div></div>}
        </div>

        {sidebarOpen && (
          <div style={{ padding:"12px 14px", borderBottom:"1px solid rgba(255,255,255,0.07)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:50, background:rm.bg, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:13, flexShrink:0 }}>{currentUser.avatar}</div>
            <div>
              <div style={{ color:"#fff", fontSize:12, fontWeight:600 }}>{currentUser.name}</div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#27ae60", display:"inline-block" }} />
                <span style={{ fontSize:10, color:rm.color }}>{rm.label}</span>
              </div>
            </div>
          </div>
        )}

        <nav style={{ flex:1, padding:"8px 6px", overflowY:"auto" }}>
          {(navItems[role]||[]).map(item => (
            <button key={item.id} className={`nav-btn ${activeView===item.id?"active":""}`}
              onClick={() => setActiveView(item.id)}
              style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 10px", borderRadius:8, background:"transparent", color: activeView===item.id?"#fff":"#9eb3c2", marginBottom:2, textAlign:"left", position:"relative" }}>
              <span style={{ flexShrink:0, display:"flex" }}><I n={item.icon} s={17} /></span>
              {sidebarOpen && <span style={{ fontSize:13, fontWeight:500, whiteSpace:"nowrap" }}>{item.label}</span>}
              {item.badge && sidebarOpen && <span style={{ marginLeft:"auto", background:C.red, color:"#fff", borderRadius:20, padding:"1px 7px", fontSize:10, fontWeight:700 }}>{item.badge}</span>}
              {item.badge && !sidebarOpen && <span style={{ position:"absolute", top:5, right:5, width:8, height:8, background:C.red, borderRadius:"50%" }} />}
            </button>
          ))}
        </nav>

        <div style={{ padding:"10px 6px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button className="nav-btn" onClick={logout}
            style={{ width:"100%", display:"flex", alignItems:"center", gap:10, padding:"10px 10px", borderRadius:8, background:"transparent", color:"#9eb3c2" }}>
            <I n="logout" s={17} />
            {sidebarOpen && <span style={{ fontSize:13, fontWeight:500 }}>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        {/* Topbar */}
        <header style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"0 18px", height:52, display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background:"transparent", color:"#718096", padding:6, borderRadius:6, display:"flex" }}><I n="menu" s={18} /></button>
          <div style={{ width:1, height:24, background:"#e2e8f0" }} />
          {myStore && <div style={{ fontSize:12, color:"#718096" }}>🏪 <strong style={{ color:"#1a202c" }}>{myStore.name}</strong></div>}
          <div style={{ flex:1, fontSize:15, fontWeight:700, color:"#1a202c", marginLeft:6 }}>
            {{dashboard:"Dashboard",pos:"Point of Sale",inventory:"Inventory",sales:"Sales History",mysales:"My Sales",customers:"Customers",reports:"Reports",stores:"Store Management",users:"Users & Roles",settings:"Settings"}[activeView]}
          </div>
          <div style={{ padding:"4px 12px", borderRadius:20, background:`${rm.bg}15`, color:rm.color, fontSize:11, fontWeight:700, border:`1px solid ${rm.bg}30` }}>{rm.label}</div>
          <div style={{ fontSize:11, color:"#718096" }}>Sun 22 Mar 2026</div>
        </header>

        <main style={{ flex:1, overflowY:"auto" }}>
          {activeView==="dashboard" && role==="superadmin" && <SuperDashboard stores={stores} sales={sales} products={products} users={users} customers={customers} C={C} th={th} td={td} setActiveView={setActiveView} />}
          {activeView==="dashboard" && role==="admin"      && <AdminDashboard store={myStore} sales={mySales} products={myProducts} customers={myCustomers} C={C} th={th} td={td} setActiveView={setActiveView} />}
          {activeView==="dashboard" && role==="sales"      && <SalesDashboard user={currentUser} sales={mySales} products={myProducts} cart={cart} C={C} setActiveView={setActiveView} />}
          {activeView==="pos"       && <POSView products={myProducts} cart={cart} setCart={setCart} addToCart={addToCart} customers={myCustomers} completeSale={completeSale} notify={notify} storeId={currentUser.storeId} C={C} />}
          {activeView==="inventory" && <InventoryView products={myProducts} setProducts={setProducts} storeId={currentUser.storeId} notify={notify} C={C} th={th} td={td} />}
          {activeView==="sales"     && <SalesView sales={mySales} C={C} th={th} td={td} />}
          {activeView==="mysales"   && <MySalesView user={currentUser} sales={mySales} C={C} th={th} td={td} />}
          {activeView==="customers" && <CustomersView customers={myCustomers} setCustomers={setCustomers} sales={mySales} storeId={currentUser.storeId} notify={notify} C={C} th={th} td={td} />}
          {activeView==="reports"   && <ReportsView sales={mySales} products={myProducts} stores={stores} isSuper={role==="superadmin"} allSales={sales} C={C} />}
          {activeView==="stores"    && <StoresView stores={stores} setStores={setStores} users={users} setUsers={setUsers} products={products} setProducts={setProducts} notify={notify} C={C} th={th} td={td} />}
          {activeView==="users"     && <UsersView users={users} setUsers={setUsers} stores={stores} currentUser={currentUser} notify={notify} C={C} th={th} td={td} />}
          {activeView==="settings"  && <SettingsView store={myStore} stores={stores} setStores={setStores} currentUser={currentUser} C={C} notify={notify} />}
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SUPER ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
function SuperDashboard({ stores, sales, products, users, customers, C, th, td, setActiveView }) {
  const totalRevenue = sales.reduce((a,s)=>a+s.total,0);
  const totalProducts = products.length;
  const totalUsers = users.filter(u=>u.role!=="superadmin").length;

  const storeStats = stores.map(store => {
    const ss = sales.filter(s=>s.storeId===store.id);
    const sp = products.filter(p=>p.storeId===store.id);
    return { ...store, salesCount:ss.length, revenue:ss.reduce((a,s)=>a+s.total,0), productCount:sp.length, staffCount:users.filter(u=>u.storeId===store.id).length };
  });

  const topStores = [...storeStats].sort((a,b)=>b.revenue-a.revenue);

  return (
    <div style={{ padding:18 }}>
      {/* Role Banner */}
      <div style={{ background:`linear-gradient(135deg, ${C.purple}, #9333ea)`, borderRadius:12, padding:"18px 24px", marginBottom:18, color:"#fff", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, opacity:0.8, letterSpacing:"1px", textTransform:"uppercase", marginBottom:4 }}>Super Admin Control Panel</div>
          <div style={{ fontSize:20, fontWeight:700 }}>Network Overview</div>
          <div style={{ fontSize:12, opacity:0.8, marginTop:2 }}>{stores.length} active stores · {totalUsers} staff members</div>
        </div>
        <div style={{ fontSize:48 }}>👑</div>
      </div>

      {/* Top KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:18 }}>
        {[
          { label:"Total Stores",    value:stores.length,                color:C.purple, icon:"🏪" },
          { label:"Network Revenue", value:`GH₵ ${fmt(totalRevenue)}`,    color:C.green,  icon:"💰" },
          { label:"Total Products",  value:totalProducts,                 color:C.blue,   icon:"📦" },
          { label:"Total Staff",     value:totalUsers,                    color:C.orange, icon:"👥" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={{ background:color, borderRadius:8, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, color:"#fff", overflow:"hidden", position:"relative" }}>
            <div style={{ width:50, height:50, borderRadius:8, background:"rgba(0,0,0,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{icon}</div>
            <div><div style={{ fontSize:11, opacity:0.85, marginBottom:3 }}>{label}</div><div style={{ fontSize:20, fontWeight:700 }}>{value}</div></div>
          </div>
        ))}
      </div>

      {/* Store Cards */}
      <div style={{ marginBottom:18 }}>
        <div style={{ fontWeight:700, fontSize:15, color:"#1a202c", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          Store Performance
          <button onClick={()=>setActiveView("stores")} style={{ background:C.purple, color:"#fff", padding:"6px 14px", borderRadius:6, fontSize:12, fontWeight:600 }}>+ New Store</button>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:14 }}>
          {storeStats.map(store => (
            <div key={store.id} style={{ background:"#fff", borderRadius:10, border:"1px solid #e2e8f0", padding:18, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:"#1a202c" }}>{store.name}</div>
                  <div style={{ fontSize:12, color:"#718096", marginTop:2 }}>📍 {store.location}</div>
                </div>
                <span style={{ padding:"3px 10px", borderRadius:20, background:store.active?"#d4edda":"#f8d7da", color:store.active?"#155724":"#721c24", fontSize:11, fontWeight:600 }}>{store.active?"Active":"Inactive"}</span>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {[["Revenue", `GH₵ ${fmt(store.revenue)}`, C.green], ["Sales", store.salesCount, C.blue], ["Products", store.productCount, C.orange], ["Staff", store.staffCount, C.purple]].map(([k,v,c])=>(
                  <div key={k} style={{ background:"#f8faff", borderRadius:6, padding:"10px 12px", borderLeft:`3px solid ${c}` }}>
                    <div style={{ fontSize:11, color:"#718096" }}>{k}</div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#1a202c", marginTop:2 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sales across all stores */}
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0", fontWeight:700, fontSize:14 }}>Recent Transactions — All Stores</div>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["Sale ID","Store","Date","Customer","Total","Payment"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {sales.slice(0,8).map(sale=>(
              <tr key={sale.id} className="hover-row">
                <td style={td}><code style={{ background:"#f0f2f5", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{sale.id}</code></td>
                <td style={td}>{stores.find(s=>s.id===sale.storeId)?.name||sale.storeId}</td>
                <td style={td}>{sale.date} {sale.time}</td>
                <td style={td}>{sale.customer}</td>
                <td style={{ ...td, fontWeight:700, color:C.green }}>GH₵{fmt(sale.total)}</td>
                <td style={td}><span style={{ background:sale.payment==="cash"?"#d4edda":sale.payment==="card"?"#cfe2ff":"#e2d9f3", color:sale.payment==="cash"?"#155724":sale.payment==="card"?"#084298":"#432874", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{sale.payment}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
function AdminDashboard({ store, sales, products, customers, C, th, td, setActiveView }) {
  const totalRevenue = sales.reduce((a,s)=>a+s.total,0);
  const todaySales = sales.filter(s=>s.date==="2026-03-22");
  const todayRevenue = todaySales.reduce((a,s)=>a+s.total,0);
  const lowStock = products.filter(p=>p.stock>0&&p.stock<=p.reorderLevel);
  const outOfStock = products.filter(p=>p.stock===0);
  const totalPurchaseDue = products.reduce((s,p)=>s+p.cost*p.stock,0);

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyPurchase = [8,4,6,5,45,70,30,20,280,12,80,15].map(v=>v*1000);
  const monthlySales2 = [3,2,4,3,25,40,15,10,60,8,40,9].map(v=>v*1000);
  const maxVal = Math.max(...monthlyPurchase,...monthlySales2);

  const recentProducts = [...products].slice(-5).reverse();
  const expiredItems = [
    { code:"IT0015", name:"Colgate",      category:"Health Care", expire:"10-10-2019" },
    { code:"IT0028", name:"Panadol Extra",category:"Health Care", expire:"03-01-2023" },
  ];

  const topRow = [
    { label:"Total Purchase Due", value:`GH₵ ${fmt(totalPurchaseDue)}`, color:"#2980b9", icon:"📦" },
    { label:"Total Sales Due",    value:`GH₵ ${fmt(todayRevenue*0.3)}`,  color:"#e67e22", icon:"💲" },
    { label:"Total Sales Amount", value:`GH₵ ${fmt(totalRevenue)}`,      color:"#27ae60", icon:"🛒" },
    { label:"Total Expense",      value:"GH₵ 1,700.00",                  color:"#e74c3c", icon:"🧾" },
  ];
  const countRow = [
    { num:customers.length, label:"Customers",        color:"#e91e8c", onClick:()=>setActiveView("customers") },
    { num:3,                label:"Suppliers",         color:"#7c3aed", onClick:null },
    { num:10,               label:"Purchase Invoice",  color:"#1565c0", onClick:null },
    { num:sales.length,     label:"Sales Invoice",     color:"#1b8a3c", onClick:()=>setActiveView("sales") },
  ];

  return (
    <div style={{ padding:18 }}>
      {/* Row 1 Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:14 }}>
        {topRow.map(({ label, value, color, icon })=>(
          <div key={label} style={{ background:color, borderRadius:6, padding:"16px 18px", display:"flex", alignItems:"center", gap:14, color:"#fff", position:"relative", overflow:"hidden" }}>
            <div style={{ width:52, height:52, borderRadius:6, background:"rgba(0,0,0,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{icon}</div>
            <div><div style={{ fontSize:11, opacity:0.9, marginBottom:3 }}>{label}</div><div style={{ fontSize:17, fontWeight:700 }}>{value}</div></div>
          </div>
        ))}
      </div>

      {/* Row 2 Count Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:16 }}>
        {countRow.map(({ num, label, color, onClick })=>(
          <div key={label} style={{ borderRadius:6, overflow:"hidden", cursor:onClick?"pointer":"default" }} onClick={onClick}>
            <div style={{ background:color, padding:"14px 16px", display:"flex", alignItems:"center", gap:10, position:"relative", overflow:"hidden" }}>
              <div style={{ fontSize:40, fontWeight:700, color:"#fff", lineHeight:1 }}>{num}</div>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.92)" }}>{label}</div>
              <div style={{ position:"absolute", right:-6, top:-8, opacity:0.1, fontSize:72 }}>👥</div>
            </div>
            <div style={{ background:`${color}cc`, padding:"6px 16px", fontSize:11, color:"#fff" }}>View ›</div>
          </div>
        ))}
      </div>

      {/* Row 3 Chart + Recent Items */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16, marginBottom:14 }}>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:6, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <span style={{ fontWeight:700, fontSize:14 }}>Purchase &amp; Sales Bar Chart</span>
            <div style={{ display:"flex", gap:12, fontSize:12 }}>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:C.green, display:"inline-block" }}/>Purchase</span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}><span style={{ width:10, height:10, borderRadius:2, background:C.blue, display:"inline-block" }}/>Sales</span>
            </div>
          </div>
          <div style={{ padding:"14px 16px" }}>
            <div style={{ display:"flex", alignItems:"flex-end", gap:5, height:170, paddingBottom:22, position:"relative" }}>
              {[0,0.25,0.5,0.75,1].map(f=>(
                <div key={f} style={{ position:"absolute", bottom:22+f*148, left:0, right:0, borderTop:"1px solid #f0f2f5", zIndex:0 }}>
                  <span style={{ fontSize:9, color:"#aaa", position:"absolute", left:0, top:-7 }}>{f===0?0:Math.round(maxVal*f/1000)+"k"}</span>
                </div>
              ))}
              {months.map((m,i)=>(
                <div key={m} style={{ flex:1, display:"flex", gap:1, alignItems:"flex-end", position:"relative", zIndex:1 }}>
                  <div style={{ flex:1, background:C.green, borderRadius:"2px 2px 0 0", height:`${(monthlyPurchase[i]/maxVal)*148}px`, minHeight:2 }}/>
                  <div style={{ flex:1, background:C.blue, borderRadius:"2px 2px 0 0", height:`${(monthlySales2[i]/maxVal)*148}px`, minHeight:2 }}/>
                  <div style={{ position:"absolute", bottom:-18, left:"50%", transform:"translateX(-50%)", fontSize:8, color:"#aaa", whiteSpace:"nowrap" }}>{m}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:6, overflow:"hidden" }}>
          <div style={{ padding:"11px 14px", borderBottom:"1px solid #e2e8f0", fontWeight:700, fontSize:13 }}>Recently Added Items</div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["#","Name","Price"].map(h=><th key={h} style={{...th,fontSize:10}}>{h}</th>)}</tr></thead>
            <tbody>
              {recentProducts.map((p,i)=>(
                <tr key={p.id} className="hover-row">
                  <td style={td}>{i+1}</td>
                  <td style={{ ...td, fontSize:12 }}>{p.name}</td>
                  <td style={{ ...td, fontWeight:700, fontSize:12 }}>GH₵{p.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding:"8px 14px", textAlign:"center", fontSize:12, color:C.blue, borderTop:"1px solid #e2e8f0", cursor:"pointer" }} onClick={()=>setActiveView("inventory")}>View All</div>
        </div>
      </div>

      {/* Row 4 Expired + Stock Alert */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:6, overflow:"hidden" }}>
          <div style={{ padding:"11px 14px", borderBottom:"1px solid #e2e8f0", fontWeight:700, fontSize:13 }}>Expired Items</div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["#","Code","Name","Category","Expire Date"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {expiredItems.map((item,i)=>(
                <tr key={item.code} className="hover-row">
                  <td style={td}>{i+1}</td><td style={td}>{item.code}</td><td style={td}>{item.name}</td><td style={td}>{item.category}</td>
                  <td style={td}><span style={{ background:"#fde8e8", color:"#c0392b", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{item.expire}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", borderTop:"1px solid #e2e8f0", background:"#fafafa" }}>
            <span style={{ fontSize:11, color:"#718096", flex:1 }}>Showing 1 to 2 of 2 entries</span>
            {["Prev","1","Next"].map(b=><button key={b} style={{ padding:"3px 9px", border:"1px solid #e2e8f0", borderRadius:3, fontSize:11, background:b==="1"?C.blue:"#fff", color:b==="1"?"#fff":"#444" }}>{b}</button>)}
          </div>
        </div>

        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:6, overflow:"hidden" }}>
          <div style={{ padding:"11px 14px", borderBottom:"1px solid #e2e8f0", fontWeight:700, fontSize:13 }}>Stock Alert</div>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead><tr>{["#","Category","Item","Stock"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {[...outOfStock,...lowStock].slice(0,5).map((p,i)=>(
                <tr key={p.id} className="hover-row">
                  <td style={td}>{i+1}</td><td style={td}>{p.category}</td><td style={td}>{p.name}</td>
                  <td style={td}><span style={{ background:p.stock===0?"#fde8e8":"#fff8e1", color:p.stock===0?"#c0392b":"#b7770d", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{p.stock===0?"OUT":p.stock}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 14px", borderTop:"1px solid #e2e8f0", background:"#fafafa" }}>
            <span style={{ fontSize:11, color:"#718096", flex:1 }}>Showing stock alerts</span>
            {["Prev","1","Next"].map(b=><button key={b} style={{ padding:"3px 9px", border:"1px solid #e2e8f0", borderRadius:3, fontSize:11, background:b==="1"?C.blue:"#fff", color:b==="1"?"#fff":"#444" }}>{b}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SALES GIRL DASHBOARD
// ══════════════════════════════════════════════════════════════
function SalesDashboard({ user, sales, products, cart, C, setActiveView }) {
  const mySales = sales.filter(s => s.cashier === user.name);
  const todayMySales = mySales.filter(s => s.date === "2026-03-22");
  const todayRevenue = todayMySales.reduce((a,s)=>a+s.total, 0);
  const totalRevenue = mySales.reduce((a,s)=>a+s.total, 0);
  const avgOrder = todayMySales.length ? todayRevenue / todayMySales.length : 0;
  const lowStock = products.filter(p => p.stock <= p.reorderLevel && p.stock > 0);
  const outOfStock = products.filter(p => p.stock === 0);

  const hourlyData = [0,0,0,0,0,0,0,0,15.95,0,31.52,33.46,0,0,28.05,0,0,0,0,0,0,0,0,0];

  const payBreak = ["cash","mobile_money","card"].map(type => ({
    type, label: type==="mobile_money"?"MoMo":type==="cash"?"Cash":"Card",
    icon: type==="mobile_money"?"📱":type==="cash"?"💵":"💳",
    color: type==="cash"?C.green:type==="mobile_money"?C.purple:C.blue,
    count: todayMySales.filter(s=>s.payment===type).length,
    total: todayMySales.filter(s=>s.payment===type).reduce((a,s)=>a+s.total,0),
  }));

  return (
    <div style={{ padding:18 }}>
      {/* Welcome Banner */}
      <div style={{ background:`linear-gradient(135deg, ${C.pink}, #f06292)`, borderRadius:12, padding:"16px 22px", marginBottom:18, color:"#fff", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ fontSize:11, opacity:0.85, letterSpacing:"1px", textTransform:"uppercase", marginBottom:3 }}>Sales Dashboard</div>
          <div style={{ fontSize:18, fontWeight:700 }}>Hey {user.name.split(" ")[0]}! 👋</div>
          <div style={{ fontSize:12, opacity:0.85, marginTop:2 }}>Sunday, March 22, 2026 — You've made {todayMySales.length} sales today</div>
        </div>
        <button onClick={()=>setActiveView("pos")} style={{ background:"rgba(255,255,255,0.25)", border:"1.5px solid rgba(255,255,255,0.5)", color:"#fff", padding:"10px 20px", borderRadius:8, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          Open POS →
        </button>
      </div>

      {/* My KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:18 }}>
        {[
          { label:"Today's Sales",   value:`GH₵ ${fmt(todayRevenue)}`, color:C.green,  icon:"💰", sub:`${todayMySales.length} transactions` },
          { label:"Avg Order Value", value:`GH₵ ${fmt(avgOrder)}`,     color:C.blue,   icon:"📊", sub:"Today's average" },
          { label:"Total (All Time)",value:`GH₵ ${fmt(totalRevenue)}`, color:C.purple, icon:"🏆", sub:`${mySales.length} total sales` },
          { label:"Cart Items",      value:cart.reduce((a,i)=>a+i.qty,0), color:C.orange, icon:"🛒", sub:"Items in current cart" },
        ].map(({ label, value, color, icon, sub })=>(
          <div key={label} style={{ background:"#fff", border:`2px solid ${color}20`, borderRadius:10, padding:"16px 18px", borderTop:`4px solid ${color}` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div>
                <div style={{ fontSize:11, color:"#718096", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.4px", marginBottom:6 }}>{label}</div>
                <div style={{ fontSize:22, fontWeight:700, color:"#1a202c", letterSpacing:"-0.5px" }}>{value}</div>
                {sub && <div style={{ fontSize:11, color:"#718096", marginTop:3 }}>{sub}</div>}
              </div>
              <div style={{ fontSize:24 }}>{icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:16, marginBottom:16 }}>
        {/* Hourly Sales Timeline */}
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:18 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:"#1a202c" }}>Today's Sales Timeline</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:3, height:120, paddingBottom:20, position:"relative" }}>
            {[0,0.5,1].map(f=>(
              <div key={f} style={{ position:"absolute", bottom:20+f*100, left:0, right:0, borderTop:"1px dashed #f0f2f5", zIndex:0 }}>
                <span style={{ fontSize:8, color:"#ccc", position:"absolute", right:0, top:-7 }}>{f===0?0:Math.round(Math.max(...hourlyData)*f)}</span>
              </div>
            ))}
            {hourlyData.map((v,h)=>(
              <div key={h} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", zIndex:1 }}>
                <div title={`${h}:00 — GH₵${v}`} style={{ width:"100%", background:v>0?C.pink:"#f0f2f5", borderRadius:"3px 3px 0 0", height:`${v>0?(v/Math.max(...hourlyData))*100:4}px`, minHeight:4, transition:"height 0.5s" }}/>
                {h%3===0 && <span style={{ fontSize:7, color:"#aaa", marginTop:2 }}>{h}</span>}
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", fontSize:11, color:"#718096", marginTop:4 }}>Hour of day</div>
        </div>

        {/* Payment Breakdown */}
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:18 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:14, color:"#1a202c" }}>Payment Methods</div>
          {payBreak.map(({ type, label, icon, color, count, total })=>(
            <div key={type} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #f0f2f5" }}>
              <div style={{ width:38, height:38, borderRadius:8, background:`${color}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, color:"#1a202c" }}>{label}</div>
                <div style={{ fontSize:11, color:"#718096" }}>{count} transactions</div>
              </div>
              <div style={{ fontWeight:700, color, fontSize:13 }}>GH₵{fmt(total)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* My Recent Sales + Low Stock Warning */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0", fontWeight:700, fontSize:14, display:"flex", justifyContent:"space-between" }}>
            My Recent Sales
            <button onClick={()=>setActiveView("mysales")} style={{ background:"transparent", color:C.pink, fontSize:12, fontWeight:600 }}>View all →</button>
          </div>
          {mySales.slice(0,5).map(sale=>(
            <div key={sale.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #f5f5f5" }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13, color:"#1a202c" }}>{sale.id}</div>
                <div style={{ fontSize:11, color:"#718096" }}>{sale.time} · {sale.customer}</div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontWeight:700, color:C.green, fontSize:13 }}>GH₵{fmt(sale.total)}</div>
                <div style={{ fontSize:10, color:"#718096" }}>{sale.payment}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
          <div style={{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0", fontWeight:700, fontSize:14 }}>⚠️ Stock Alerts</div>
          {[...outOfStock.slice(0,2),...lowStock.slice(0,3)].map((p,i)=>(
            <div key={p.id} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 16px", borderBottom:"1px solid #f5f5f5" }}>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <span style={{ fontSize:18 }}>{p.image}</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:600, color:"#1a202c" }}>{p.name}</div>
                  <div style={{ fontSize:10, color:"#718096" }}>{p.category}</div>
                </div>
              </div>
              <span style={{ background:p.stock===0?"#fde8e8":"#fff8e1", color:p.stock===0?"#c0392b":"#b7770d", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>
                {p.stock===0?"OUT":p.stock+" left"}
              </span>
            </div>
          ))}
          {(outOfStock.length+lowStock.length)===0 && <div style={{ padding:"20px 16px", textAlign:"center", color:"#27ae60", fontSize:13 }}>✅ All products well-stocked</div>}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STORES MANAGEMENT (Super Admin)
// ══════════════════════════════════════════════════════════════
function StoresView({ stores, setStores, users, setUsers, products, setProducts, notify, C, th, td }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", location:"", currency:"GH₵", taxRate:10 });

  const createStore = () => {
    if (!form.name||!form.location) { notify("Name and location required","error"); return; }
    const newStore = { id:`ST${String(stores.length+1).padStart(3,"0")}`, ...form, taxRate:parseFloat(form.taxRate)||10, active:true, createdAt:"2026-03-22" };
    setStores(p=>[...p,newStore]);
    notify(`Store "${form.name}" created!`,"success");
    setShowModal(false);
    setForm({ name:"", location:"", currency:"GH₵", taxRate:10 });
  };

  const toggleStore = (id) => setStores(p=>p.map(s=>s.id===id?{...s,active:!s.active}:s));

  return (
    <div style={{ padding:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"#1a202c" }}>Store Management</div>
          <div style={{ fontSize:12, color:"#718096" }}>{stores.length} stores in the network</div>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ background:C.purple, color:"#fff", padding:"10px 20px", borderRadius:8, fontWeight:700, fontSize:13, display:"flex", gap:6, alignItems:"center" }}>
          <I n="plus" s={15}/> Create New Store
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:16 }}>
        {stores.map(store=>{
          const storeUsers = users.filter(u=>u.storeId===store.id);
          const storeAdmins = storeUsers.filter(u=>u.role==="admin");
          const storeSales = storeUsers.filter(u=>u.role==="sales");
          return (
            <div key={store.id} style={{ background:"#fff", borderRadius:12, border:"1px solid #e2e8f0", padding:20, boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
                <div style={{ display:"flex", gap:12, alignItems:"center" }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:`${C.blue}15`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🏪</div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:15, color:"#1a202c" }}>{store.name}</div>
                    <div style={{ fontSize:12, color:"#718096" }}>📍 {store.location}</div>
                    <div style={{ fontSize:11, color:"#718096" }}>Created: {store.createdAt}</div>
                  </div>
                </div>
                <button onClick={()=>toggleStore(store.id)} style={{ padding:"4px 12px", borderRadius:20, background:store.active?"#d4edda":"#f8d7da", color:store.active?"#155724":"#721c24", fontSize:11, fontWeight:700, border:"none" }}>
                  {store.active?"● Active":"○ Inactive"}
                </button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
                {[["Currency",store.currency,C.blue],["Tax Rate",`${store.taxRate}%`,C.orange],["Staff",storeUsers.length,C.green]].map(([k,v,c])=>(
                  <div key={k} style={{ background:"#f8faff", borderRadius:6, padding:"8px 10px", borderLeft:`3px solid ${c}` }}>
                    <div style={{ fontSize:10, color:"#718096" }}>{k}</div>
                    <div style={{ fontWeight:700, fontSize:14, color:"#1a202c" }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop:"1px solid #f0f2f5", paddingTop:12 }}>
                <div style={{ fontSize:11, color:"#718096", fontWeight:600, marginBottom:8, textTransform:"uppercase" }}>Staff Members</div>
                {storeUsers.length===0
                  ? <div style={{ fontSize:12, color:"#aaa" }}>No staff assigned yet</div>
                  : storeUsers.map(u=>(
                    <div key={u.id} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                      <div style={{ width:28, height:28, borderRadius:50, background:u.role==="admin"?`${C.blue}20`:`${C.pink}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:u.role==="admin"?C.blue:C.pink }}>{u.avatar}</div>
                      <div>
                        <div style={{ fontSize:12, fontWeight:600, color:"#1a202c" }}>{u.name}</div>
                        <div style={{ fontSize:10, color:u.role==="admin"?C.blue:C.pink, fontWeight:600, textTransform:"capitalize" }}>{u.role}</div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="modal-bg" onClick={()=>setShowModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:460, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight:700, fontSize:18, marginBottom:4, color:"#1a202c" }}>🏪 Create New Store</div>
            <div style={{ fontSize:13, color:"#718096", marginBottom:22 }}>Add a new branch to your network</div>
            {[["name","Store Name","text"],["location","Location / Address","text"],["currency","Currency Code","text"],["taxRate","Tax / VAT Rate (%)","number"]].map(([field,label,type])=>(
              <div key={field} style={{ marginBottom:14 }}>
                <label style={{ fontSize:11, color:"#718096", display:"block", marginBottom:5, fontWeight:600, textTransform:"uppercase" }}>{label}</label>
                <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
                  style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c" }} />
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:11, background:"#f0f2f5", borderRadius:8, fontWeight:600, color:"#444" }}>Cancel</button>
              <button onClick={createStore} style={{ flex:2, padding:11, background:C.purple, color:"#fff", borderRadius:8, fontWeight:700, fontSize:14 }}>Create Store</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// USERS VIEW
// ══════════════════════════════════════════════════════════════
function UsersView({ users, setUsers, stores, currentUser, notify, C, th, td }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", username:"", password:"", role:"sales", storeId:"ST001", email:"" });

  const visibleUsers = currentUser.role==="superadmin" ? users.filter(u=>u.role!=="superadmin") : users.filter(u=>u.storeId===currentUser.storeId&&u.role!=="superadmin");

  const addUser = () => {
    if (!form.name||!form.username||!form.password) { notify("All fields required","error"); return; }
    const newUser = { id:`U${String(users.length+1).padStart(3,"0")}`, ...form, avatar:form.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase(), active:true };
    setUsers(p=>[...p,newUser]);
    notify(`User "${form.name}" added!`,"success");
    setShowModal(false);
  };

  const toggleUser = (id) => setUsers(p=>p.map(u=>u.id===id?{...u,active:!u.active}:u));

  const roleColor = { admin:C.blue, sales:C.pink, superadmin:C.purple };

  return (
    <div style={{ padding:18 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
        <div style={{ fontSize:16, fontWeight:700, color:"#1a202c" }}>Staff Management</div>
        <button onClick={()=>setShowModal(true)} style={{ background:C.blue, color:"#fff", padding:"9px 18px", borderRadius:8, fontWeight:700, fontSize:13, display:"flex", gap:6, alignItems:"center" }}>
          <I n="plus" s={14}/> Add Staff
        </button>
      </div>

      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead><tr>{["User","Username","Role","Store","Email","Status","Action"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {visibleUsers.map(user=>(
              <tr key={user.id} className="hover-row">
                <td style={td}>
                  <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                    <div style={{ width:32, height:32, borderRadius:8, background:`${roleColor[user.role]}20`, color:roleColor[user.role], display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>{user.avatar}</div>
                    <span style={{ fontWeight:600 }}>{user.name}</span>
                  </div>
                </td>
                <td style={td}><code style={{ background:"#f0f2f5", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{user.username}</code></td>
                <td style={td}><span style={{ background:`${roleColor[user.role]}15`, color:roleColor[user.role], padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{user.role}</span></td>
                <td style={td}>{stores.find(s=>s.id===user.storeId)?.name||"—"}</td>
                <td style={{ ...td, color:"#718096", fontSize:12 }}>{user.email}</td>
                <td style={td}><span style={{ background:user.active?"#d4edda":"#f8d7da", color:user.active?"#155724":"#721c24", padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:600 }}>{user.active?"Active":"Inactive"}</span></td>
                <td style={td}>
                  <button onClick={()=>toggleUser(user.id)} style={{ background:user.active?`${C.red}15`:`${C.green}15`, color:user.active?C.red:C.green, padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600 }}>
                    {user.active?"Deactivate":"Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-bg" onClick={()=>setShowModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:440, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight:700, fontSize:17, marginBottom:20, color:"#1a202c" }}>👤 Add New Staff</div>
            {[["name","Full Name","text"],["username","Username","text"],["password","Password","password"],["email","Email","email"]].map(([field,label,type])=>(
              <div key={field} style={{ marginBottom:13 }}>
                <label style={{ fontSize:11, color:"#718096", display:"block", marginBottom:5, fontWeight:600, textTransform:"uppercase" }}>{label}</label>
                <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
                  style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c" }} />
              </div>
            ))}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:13 }}>
              <div>
                <label style={{ fontSize:11, color:"#718096", display:"block", marginBottom:5, fontWeight:600, textTransform:"uppercase" }}>Role</label>
                <select value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c" }}>
                  <option value="admin">Admin</option>
                  <option value="sales">Sales</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:11, color:"#718096", display:"block", marginBottom:5, fontWeight:600, textTransform:"uppercase" }}>Store</label>
                <select value={form.storeId} onChange={e=>setForm(f=>({...f,storeId:e.target.value}))} style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c" }}>
                  {stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:11, background:"#f0f2f5", borderRadius:8, fontWeight:600, color:"#444" }}>Cancel</button>
              <button onClick={addUser} style={{ flex:2, padding:11, background:C.blue, color:"#fff", borderRadius:8, fontWeight:700, fontSize:14 }}>Add Staff Member</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// POS VIEW
// ══════════════════════════════════════════════════════════════
function POSView({ products, cart, setCart, addToCart, customers, completeSale, notify, storeId, C }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percent");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [amountTendered, setAmountTendered] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState(null);

  const TAX = 0.10;
  const filtered = products.filter(p => (category==="All"||p.category===category) && (p.name.toLowerCase().includes(search.toLowerCase())||p.barcode?.includes(search)||p.sku?.toLowerCase().includes(search.toLowerCase())));
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  const discountAmt = discountType==="percent" ? subtotal*(discount/100) : Math.min(discount,subtotal);
  const taxable = subtotal-discountAmt;
  const tax = taxable*TAX;
  const total = taxable+tax;
  const change = parseFloat(amountTendered)-total;

  const updateQty=(id,delta)=>setCart(p=>p.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+delta)}:i));
  const removeItem=(id)=>setCart(p=>p.filter(i=>i.id!==id));

  const handlePay=()=>{
    if(cart.length===0){notify("Cart is empty!","error");return;}
    const saleData={items:cart.map(i=>({name:i.name,qty:i.qty,price:i.price})),subtotal,tax,discount:discountAmt,total,payment:paymentMethod,customer:selectedCustomer?.name||"Walk-in"};
    const newSale=completeSale(saleData);
    setLastSale({...saleData,...newSale});
    setDiscount(0);setAmountTendered("");setSelectedCustomer(null);
    setShowPayModal(false);setShowReceipt(true);
  };

  const inputStyle={ padding:"9px 12px",border:"1.5px solid #e2e8f0",borderRadius:8,fontSize:13,color:"#1a202c",width:"100%" };

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 360px", height:"calc(100vh - 52px)" }}>
      {/* Products */}
      <div style={{ padding:14, overflowY:"auto", background:"#f0f2f5" }}>
        <div style={{ display:"flex", gap:8, marginBottom:10 }}>
          <div style={{ flex:1, position:"relative" }}>
            <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#718096" }}><I n="search" s={15}/></div>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product, barcode, SKU..."
              style={{ ...inputStyle, paddingLeft:32 }} />
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"8px 12px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, color:"#718096", fontSize:12 }}><I n="barcode" s={14}/> Scan</div>
        </div>
        <div style={{ display:"flex", gap:6, marginBottom:12, flexWrap:"wrap" }}>
          {CATEGORIES.map(c=><button key={c} onClick={()=>setCategory(c)} style={{ padding:"5px 14px", borderRadius:20, background:category===c?C.blue:"#fff", color:category===c?"#fff":"#718096", border:`1px solid ${category===c?C.blue:"#e2e8f0"}`, fontSize:12, fontWeight:600 }}>{c}</button>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:10 }}>
          {filtered.map(p=>(
            <button key={p.id} className="product-tile" onClick={()=>addToCart(p)}
              style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:12, textAlign:"left", transition:"all 0.2s", opacity:p.stock===0?0.55:1, position:"relative" }}>
              {p.stock===0&&<span style={{ position:"absolute", top:6, right:6, background:"#fde8e8", color:"#c0392b", padding:"1px 7px", borderRadius:10, fontSize:10, fontWeight:700 }}>OUT</span>}
              {p.stock>0&&p.stock<=p.reorderLevel&&<span style={{ position:"absolute", top:6, right:6, background:"#fff8e1", color:"#b7770d", padding:"1px 7px", borderRadius:10, fontSize:10, fontWeight:700 }}>LOW</span>}
              <div style={{ fontSize:26, marginBottom:5 }}>{p.image}</div>
              <div style={{ fontSize:11, fontWeight:600, color:"#1a202c", lineHeight:1.3, marginBottom:3 }}>{p.name}</div>
              <div style={{ fontSize:10, color:"#718096", marginBottom:4 }}>{p.sku}</div>
              <div style={{ fontSize:14, fontWeight:700, color:C.green }}>GH₵{p.price.toFixed(2)}</div>
              <div style={{ fontSize:10, color:"#718096" }}>{p.stock} in stock</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div style={{ background:"#fff", borderLeft:"1px solid #e2e8f0", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:14, borderBottom:"1px solid #e2e8f0" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontWeight:700, fontSize:14, display:"flex", gap:6, alignItems:"center" }}>
              <I n="cart" s={16}/> Cart
              {cart.length>0&&<span style={{ background:C.red, color:"#fff", borderRadius:20, padding:"1px 8px", fontSize:11, fontWeight:700 }}>{cart.reduce((s,i)=>s+i.qty,0)}</span>}
            </div>
            {cart.length>0&&<button onClick={()=>setCart([])} style={{ background:"#fde8e8", color:"#c0392b", padding:"3px 10px", borderRadius:6, fontSize:11, fontWeight:600 }}>Clear</button>}
          </div>
          <select value={selectedCustomer?.id||""} onChange={e=>setSelectedCustomer(customers.find(c=>c.id===e.target.value)||null)}
            style={{ ...inputStyle, fontSize:12, padding:"7px 10px" }}>
            <option value="">👤 Walk-in Customer</option>
            {customers.map(c=><option key={c.id} value={c.id}>{c.name} — ⭐{c.loyaltyPoints}pts</option>)}
          </select>
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"8px 14px" }}>
          {cart.length===0 ? (
            <div style={{ textAlign:"center", padding:"40px 20px", color:"#aaa" }}>
              <div style={{ fontSize:42, marginBottom:10 }}>🛒</div>
              <div style={{ fontWeight:600, fontSize:14 }}>Cart is empty</div>
              <div style={{ fontSize:12, marginTop:3 }}>Tap products to add</div>
            </div>
          ) : cart.map(item=>(
            <div key={item.id} style={{ display:"flex", gap:8, alignItems:"center", padding:"9px 0", borderBottom:"1px solid #f5f5f5" }}>
              <span style={{ fontSize:20 }}>{item.image}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", color:"#1a202c" }}>{item.name}</div>
                <div style={{ fontSize:11, color:"#718096" }}>GH₵{item.price.toFixed(2)}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                <button onClick={()=>updateQty(item.id,-1)} style={{ width:22, height:22, borderRadius:5, background:"#f0f2f5", color:"#444", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="minus" s={11}/></button>
                <span style={{ width:22, textAlign:"center", fontSize:13, fontWeight:700 }}>{item.qty}</span>
                <button onClick={()=>updateQty(item.id,1)} style={{ width:22, height:22, borderRadius:5, background:"#f0f2f5", color:"#444", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="plus" s={11}/></button>
              </div>
              <div style={{ width:52, textAlign:"right" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#1a202c" }}>GH₵{(item.price*item.qty).toFixed(2)}</div>
                <button onClick={()=>removeItem(item.id)} style={{ background:"none", color:"#e74c3c", display:"flex", alignItems:"center", justifyContent:"flex-end", width:"100%", marginTop:1 }}><I n="trash" s={11}/></button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding:"12px 14px", borderTop:"1px solid #e2e8f0" }}>
          <div style={{ display:"flex", gap:6, marginBottom:10 }}>
            <input type="number" value={discount} onChange={e=>setDiscount(parseFloat(e.target.value)||0)} placeholder="Discount"
              style={{ flex:1, padding:"7px 10px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:12, color:"#1a202c" }} />
            <select value={discountType} onChange={e=>setDiscountType(e.target.value)} style={{ padding:"7px 6px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:12, color:"#1a202c" }}>
              <option value="percent">%</option><option value="fixed">GH₵</option>
            </select>
          </div>
          <div style={{ fontSize:12, display:"grid", gap:3, marginBottom:10 }}>
            {[["Subtotal",`GH₵${subtotal.toFixed(2)}`],["Discount",`-GH₵${discountAmt.toFixed(2)}`],["VAT (10%)",`GH₵${tax.toFixed(2)}`]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", color:"#718096" }}>
                <span>{k}</span><span style={{ color:k==="Discount"?C.red:"#1a202c", fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:16, marginTop:6, paddingTop:8, borderTop:"1px solid #e2e8f0" }}>
              <span>TOTAL</span><span style={{ color:C.green }}>GH₵{total.toFixed(2)}</span>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginBottom:10 }}>
            {[["cash","💵","Cash"],["mobile_money","📱","MoMo"],["card","💳","Card"]].map(([key,icon,label])=>(
              <button key={key} onClick={()=>setPaymentMethod(key)}
                style={{ padding:"7px 4px", borderRadius:7, background:paymentMethod===key?`${C.blue}15`:"#f8f9fc", border:`1px solid ${paymentMethod===key?C.blue:"#e2e8f0"}`, color:paymentMethod===key?C.blue:"#718096", fontSize:11, fontWeight:600 }}>
                <div style={{ fontSize:15 }}>{icon}</div>{label}
              </button>
            ))}
          </div>
          <button onClick={()=>cart.length>0?setShowPayModal(true):notify("Add items first!","error")}
            style={{ width:"100%", padding:13, borderRadius:8, fontWeight:700, fontSize:14, background:C.green, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
            <I n="check" s={17}/> Charge GH₵{total.toFixed(2)}
          </button>
        </div>
      </div>

      {showPayModal&&(
        <div className="modal-bg" onClick={()=>setShowPayModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:360, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight:700, fontSize:17, marginBottom:18, color:"#1a202c" }}>💳 Complete Payment</div>
            <div style={{ background:"#f8faff", borderRadius:10, padding:16, marginBottom:18, textAlign:"center" }}>
              <div style={{ fontSize:11, color:"#718096" }}>Amount Due</div>
              <div style={{ fontSize:30, fontWeight:800, color:C.green }}>GH₵{total.toFixed(2)}</div>
              <div style={{ fontSize:11, color:"#718096" }}>{paymentMethod.replace("_"," ").toUpperCase()} · {selectedCustomer?.name||"Walk-in"}</div>
            </div>
            {paymentMethod==="cash"&&(
              <div style={{ marginBottom:14 }}>
                <input type="number" value={amountTendered} onChange={e=>setAmountTendered(e.target.value)} placeholder="Amount tendered..."
                  style={{ width:"100%", padding:11, border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:16, fontWeight:700, color:"#1a202c", marginBottom:8 }}/>
                {amountTendered&&change>=0&&<div style={{ padding:"8px 12px", background:"#d4edda", borderRadius:8, color:"#155724", fontWeight:700, fontSize:14 }}>Change: GH₵{change.toFixed(2)}</div>}
                {amountTendered&&change<0&&<div style={{ padding:"8px 12px", background:"#fde8e8", borderRadius:8, color:"#c0392b", fontWeight:700, fontSize:14 }}>Short by GH₵{Math.abs(change).toFixed(2)}</div>}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6, marginTop:8 }}>
                  {[total,Math.ceil(total/5)*5,Math.ceil(total/10)*10].map(amt=>(
                    <button key={amt} onClick={()=>setAmountTendered(amt.toFixed(2))} style={{ padding:8, background:"#f0f2f5", border:"1px solid #e2e8f0", borderRadius:7, fontSize:12, fontWeight:600, color:"#1a202c" }}>GH₵{amt.toFixed(0)}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>setShowPayModal(false)} style={{ flex:1, padding:11, background:"#f0f2f5", borderRadius:8, fontWeight:600, color:"#444" }}>Cancel</button>
              <button onClick={handlePay} disabled={paymentMethod==="cash"&&(!amountTendered||change<0)}
                style={{ flex:2, padding:11, background:C.green, color:"#fff", borderRadius:8, fontWeight:700, fontSize:14, opacity:paymentMethod==="cash"&&(!amountTendered||change<0)?0.5:1 }}>
                ✓ Confirm Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {showReceipt&&lastSale&&(
        <div className="modal-bg">
          <div style={{ background:"#fff", borderRadius:16, padding:28, width:360, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign:"center", marginBottom:18 }}>
              <div style={{ width:52, height:52, borderRadius:"50%", background:"#d4edda", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", fontSize:24 }}>✅</div>
              <div style={{ fontWeight:700, fontSize:17, color:"#1a202c" }}>Sale Complete!</div>
              <div style={{ fontSize:12, color:"#718096" }}>Receipt #{lastSale.id}</div>
            </div>
            <div style={{ background:"#f8f9fc", borderRadius:10, padding:14, fontFamily:"monospace", fontSize:11, marginBottom:16 }}>
              <div style={{ textAlign:"center", fontWeight:700, marginBottom:8, fontSize:13 }}>NEXUS STORE</div>
              <div style={{ borderTop:"1px dashed #ddd", marginBottom:6 }}/>
              {lastSale.items?.map((item,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                  <span>{item.name.slice(0,16)} ×{item.qty}</span>
                  <span>GH₵{(item.price*item.qty).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop:"1px dashed #ddd", margin:"8px 0" }}/>
              <div style={{ display:"flex", justifyContent:"space-between" }}><span>Subtotal</span><span>GH₵{lastSale.subtotal?.toFixed(2)}</span></div>
              <div style={{ display:"flex", justifyContent:"space-between" }}><span>VAT 10%</span><span>GH₵{lastSale.tax?.toFixed(2)}</span></div>
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:700, fontSize:13, marginTop:5 }}><span>TOTAL</span><span>GH₵{lastSale.total?.toFixed(2)}</span></div>
              <div style={{ borderTop:"1px dashed #ddd", margin:"8px 0", textAlign:"center", color:"#666" }}>Thank you! Come again.</div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ flex:1, padding:10, background:"#f0f2f5", borderRadius:8, fontSize:12, fontWeight:600, color:"#444", display:"flex", gap:5, alignItems:"center", justifyContent:"center" }}><I n="download" s={13}/> PDF</button>
              <button onClick={()=>setShowReceipt(false)} style={{ flex:2, padding:10, background:C.blue, color:"#fff", borderRadius:8, fontWeight:700, fontSize:13 }}>New Sale</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// INVENTORY VIEW
// ══════════════════════════════════════════════════════════════
function InventoryView({ products, setProducts, storeId, notify, C, th, td }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editP, setEditP] = useState(null);
  const [form, setForm] = useState({ name:"",sku:"",barcode:"",category:"Food",price:"",cost:"",stock:"",reorderLevel:"10",unit:"piece",image:"📦" });

  const filtered = products.filter(p=>(cat==="All"||p.category===cat)&&(p.name.toLowerCase().includes(search.toLowerCase())||p.sku.toLowerCase().includes(search.toLowerCase())));

  const openAdd=()=>{ setEditP(null); setForm({ name:"",sku:"",barcode:"",category:"Food",price:"",cost:"",stock:"",reorderLevel:"10",unit:"piece",image:"📦" }); setShowModal(true); };
  const openEdit=(p)=>{ setEditP(p); setForm({...p}); setShowModal(true); };
  const del=(id)=>{ setProducts(p=>p.filter(x=>x.id!==id)); notify("Product deleted"); };

  const save=()=>{
    if(!form.name||!form.price){notify("Name and price required","error");return;}
    if(editP){
      setProducts(p=>p.map(x=>x.id===editP.id?{...x,...form,price:parseFloat(form.price),cost:parseFloat(form.cost),stock:parseInt(form.stock),reorderLevel:parseInt(form.reorderLevel)}:x));
      notify("Product updated!");
    } else {
      setProducts(p=>[...p,{...form,id:`P${String(p.length+1).padStart(3,"0")}`,price:parseFloat(form.price),cost:parseFloat(form.cost)||0,stock:parseInt(form.stock)||0,reorderLevel:parseInt(form.reorderLevel)||10,storeId}]);
      notify("Product added!");
    }
    setShowModal(false);
  };

  const sc=(p)=>p.stock===0?C.red:p.stock<=p.reorderLevel?C.orange:C.green;

  return (
    <div style={{ padding:18 }}>
      <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        <div style={{ position:"relative", flex:1, minWidth:180 }}>
          <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#718096" }}><I n="search" s={14}/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search products..."
            style={{ width:"100%", padding:"9px 12px 9px 32px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c", background:"#fff" }}/>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {CATEGORIES.map(c=><button key={c} onClick={()=>setCat(c)} style={{ padding:"7px 14px", borderRadius:20, background:cat===c?C.blue:"#fff", color:cat===c?"#fff":"#718096", border:`1px solid ${cat===c?C.blue:"#e2e8f0"}`, fontSize:12, fontWeight:600 }}>{c}</button>)}
        </div>
        <button onClick={openAdd} style={{ background:C.green, color:"#fff", padding:"9px 18px", borderRadius:8, fontWeight:700, fontSize:13, display:"flex", gap:6, alignItems:"center" }}><I n="plus" s={14}/> Add Product</button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
        {[["Total Products",products.length,C.blue,"📦"],["In Stock",products.filter(p=>p.stock>0).length,C.green,"✅"],["Low Stock",products.filter(p=>p.stock>0&&p.stock<=p.reorderLevel).length,C.orange,"⚠️"],["Out of Stock",products.filter(p=>p.stock===0).length,C.red,"❌"]].map(([label,val,color,icon])=>(
          <div key={label} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:14, display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ background:`${color}15`, borderRadius:8, padding:8, fontSize:20 }}>{icon}</div>
            <div><div style={{ fontSize:20, fontWeight:700, color:"#1a202c" }}>{val}</div><div style={{ fontSize:11, color:"#718096" }}>{label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead><tr>{["Product","SKU","Category","Price","Cost","Stock","Status","Actions"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(p=>(
                <tr key={p.id} className="hover-row">
                  <td style={td}><div style={{ display:"flex", gap:8, alignItems:"center" }}><span style={{ fontSize:20 }}>{p.image}</span><div><div style={{ fontWeight:600, color:"#1a202c" }}>{p.name}</div><div style={{ fontSize:10, color:"#718096" }}>{p.barcode}</div></div></div></td>
                  <td style={td}><code style={{ background:"#f0f2f5", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{p.sku}</code></td>
                  <td style={td}><span style={{ background:`${C.blue}15`, color:C.blue, padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:600 }}>{p.category}</span></td>
                  <td style={{ ...td, fontWeight:700 }}>GH₵{p.price.toFixed(2)}</td>
                  <td style={{ ...td, color:"#718096" }}>GH₵{p.cost.toFixed(2)}</td>
                  <td style={td}>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <div style={{ width:36, height:4, background:"#f0f2f5", borderRadius:2, overflow:"hidden" }}>
                        <div style={{ width:`${Math.min(100,(p.stock/(p.reorderLevel*3))*100)}%`, height:"100%", background:sc(p), borderRadius:2 }}/>
                      </div>
                      <span style={{ fontWeight:700, color:sc(p) }}>{p.stock}</span>
                    </div>
                  </td>
                  <td style={td}><span style={{ background:p.stock===0?"#fde8e8":p.stock<=p.reorderLevel?"#fff8e1":"#d4edda", color:p.stock===0?"#c0392b":p.stock<=p.reorderLevel?"#b7770d":"#155724", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{p.stock===0?"Out of Stock":p.stock<=p.reorderLevel?"Low Stock":"In Stock"}</span></td>
                  <td style={td}><div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>openEdit(p)} style={{ background:`${C.blue}15`, color:C.blue, padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600 }}>Edit</button>
                    <button onClick={()=>del(p.id)} style={{ background:"#fde8e8", color:C.red, padding:"4px 10px", borderRadius:6, fontSize:11, fontWeight:600 }}>Del</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal&&(
        <div className="modal-bg" onClick={()=>setShowModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:480, maxHeight:"90vh", overflowY:"auto", boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight:700, fontSize:17, marginBottom:20, color:"#1a202c" }}>{editP?"✏️ Edit Product":"➕ Add Product"}</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:13 }}>
              {[["name","Product Name","text"],["sku","SKU","text"],["barcode","Barcode","text"],["unit","Unit","text"],["price","Selling Price","number"],["cost","Cost Price","number"],["stock","Current Stock","number"],["reorderLevel","Reorder Level","number"]].map(([field,label,type])=>(
                <div key={field}>
                  <label style={{ fontSize:11, color:"#718096", display:"block", marginBottom:5, fontWeight:600, textTransform:"uppercase" }}>{label}</label>
                  <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
                    style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c" }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize:11, color:"#718096", display:"block", marginBottom:5, fontWeight:600, textTransform:"uppercase" }}>Category</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c" }}>
                  {["Food","Beverages","Household","Healthcare"].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:"flex", gap:10, marginTop:18 }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:11, background:"#f0f2f5", borderRadius:8, fontWeight:600, color:"#444" }}>Cancel</button>
              <button onClick={save} style={{ flex:2, padding:11, background:C.green, color:"#fff", borderRadius:8, fontWeight:700, fontSize:14 }}>{editP?"Update":"Add Product"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SALES HISTORY
// ══════════════════════════════════════════════════════════════
function SalesView({ sales, C, th, td }) {
  const [search, setSearch] = useState("");
  const [sel, setSel] = useState(null);
  const filtered = sales.filter(s=>s.id.includes(search)||s.customer.toLowerCase().includes(search.toLowerCase()));
  return (
    <div style={{ padding:18 }}>
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <div style={{ position:"relative", flex:1 }}>
          <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#718096" }}><I n="search" s={14}/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search sales..." style={{ width:"100%", padding:"9px 12px 9px 32px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c", background:"#fff" }}/>
        </div>
        <button style={{ display:"flex", gap:6, alignItems:"center", padding:"8px 14px", background:"#fff", border:"1px solid #e2e8f0", borderRadius:8, color:"#718096", fontSize:12, fontWeight:600 }}><I n="download" s={13}/> Export</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        {[["Transactions",filtered.length,C.blue],["Total Revenue",`GH₵${fmt(filtered.reduce((a,s)=>a+s.total,0))}`,C.green],["Avg Order",`GH₵${fmt(filtered.reduce((a,s)=>a+s.total,0)/(filtered.length||1))}`,C.purple]].map(([l,v,c])=>(
          <div key={l} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:14, display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ background:`${c}15`, borderRadius:8, padding:8, color:c, fontSize:20 }}>{l==="Transactions"?"🧾":l==="Total Revenue"?"💰":"📊"}</div>
            <div><div style={{ fontSize:20, fontWeight:700, color:"#1a202c" }}>{v}</div><div style={{ fontSize:11, color:"#718096" }}>{l}</div></div>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr>{["Sale ID","Date","Customer","Cashier","Items","Subtotal","Tax","Discount","Total","Payment",""].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(sale=>(
              <tr key={sale.id} className="hover-row">
                <td style={td}><code style={{ background:"#f0f2f5", padding:"2px 6px", borderRadius:4, fontSize:11, color:C.blue }}>{sale.id}</code></td>
                <td style={{ ...td, color:"#718096", fontSize:11 }}>{sale.date} {sale.time}</td>
                <td style={{ ...td, fontWeight:500 }}>{sale.customer}</td>
                <td style={{ ...td, color:"#718096", fontSize:11 }}>{sale.cashier}</td>
                <td style={td}><span style={{ background:"#f0f2f5", color:"#718096", padding:"1px 7px", borderRadius:10, fontSize:11 }}>{sale.items.length}</span></td>
                <td style={td}>GH₵{fmt(sale.subtotal)}</td>
                <td style={{ ...td, color:"#718096" }}>GH₵{fmt(sale.tax)}</td>
                <td style={{ ...td, color:C.red }}>-GH₵{fmt(sale.discount)}</td>
                <td style={{ ...td, fontWeight:700, color:C.green }}>GH₵{fmt(sale.total)}</td>
                <td style={td}><span style={{ background:sale.payment==="cash"?"#d4edda":sale.payment==="card"?"#cfe2ff":"#e2d9f3", color:sale.payment==="cash"?"#155724":sale.payment==="card"?"#084298":"#432874", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{sale.payment==="mobile_money"?"📱 MoMo":sale.payment==="cash"?"💵 Cash":"💳 Card"}</span></td>
                <td style={td}><button onClick={()=>setSel(sale)} style={{ background:`${C.blue}15`, color:C.blue, padding:"3px 9px", borderRadius:6, fontSize:11, fontWeight:600 }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sel&&(
        <div className="modal-bg" onClick={()=>setSel(null)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:380, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:18 }}>
              <div style={{ fontWeight:700, fontSize:16, color:"#1a202c" }}>Sale {sel.id}</div>
              <button onClick={()=>setSel(null)} style={{ background:"#f0f2f5", color:"#718096", padding:5, borderRadius:6 }}><I n="x" s={14}/></button>
            </div>
            {[["Date",`${sel.date} ${sel.time}`],["Customer",sel.customer],["Cashier",sel.cashier],["Payment",sel.payment]].map(([k,v])=>(
              <div key={k} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}><span style={{ color:"#718096" }}>{k}</span><span style={{ fontWeight:500 }}>{v}</span></div>
            ))}
            <div style={{ borderTop:"1px solid #e2e8f0", paddingTop:12, marginBottom:12 }}>
              {sel.items.map((item,i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:5 }}>
                  <span>{item.name} ×{item.qty}</span><span style={{ fontWeight:600 }}>GH₵{(item.price*item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop:"2px solid #e2e8f0", paddingTop:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#718096", marginBottom:4 }}><span>Subtotal</span><span>GH₵{fmt(sel.subtotal)}</span></div>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#718096", marginBottom:4 }}><span>Tax</span><span>GH₵{fmt(sel.tax)}</span></div>
              <div style={{ display:"flex", justifyContent:"space-between", fontWeight:800, fontSize:16, marginTop:8, color:C.green }}><span>TOTAL</span><span>GH₵{fmt(sel.total)}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// MY SALES (Sales Girl only)
// ══════════════════════════════════════════════════════════════
function MySalesView({ user, sales, C, th, td }) {
  const mySales = sales.filter(s=>s.cashier===user.name);
  const todaySales = mySales.filter(s=>s.date==="2026-03-22");
  return (
    <div style={{ padding:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
        {[["Today's Sales",todaySales.length,C.pink],["Today Revenue",`GH₵${fmt(todaySales.reduce((a,s)=>a+s.total,0))}`,C.green],["All Time Total",`GH₵${fmt(mySales.reduce((a,s)=>a+s.total,0))}`,C.blue]].map(([l,v,c])=>(
          <div key={l} style={{ background:"#fff", borderTop:`4px solid ${c}`, borderRadius:10, padding:16, border:"1px solid #e2e8f0", borderTopColor:c }}>
            <div style={{ fontSize:11, color:"#718096", textTransform:"uppercase", fontWeight:600, letterSpacing:"0.4px", marginBottom:6 }}>{l}</div>
            <div style={{ fontSize:22, fontWeight:700, color:"#1a202c" }}>{v}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, overflow:"hidden" }}>
        <div style={{ padding:"12px 16px", borderBottom:"1px solid #e2e8f0", fontWeight:700, fontSize:14, color:"#1a202c" }}>My Sales History</div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
          <thead><tr>{["Sale ID","Time","Customer","Items","Total","Payment"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
          <tbody>
            {mySales.map(sale=>(
              <tr key={sale.id} className="hover-row">
                <td style={td}><code style={{ background:"#f0f2f5", padding:"2px 6px", borderRadius:4, fontSize:11 }}>{sale.id}</code></td>
                <td style={{ ...td, color:"#718096" }}>{sale.date} {sale.time}</td>
                <td style={td}>{sale.customer}</td>
                <td style={td}>{sale.items.length} items</td>
                <td style={{ ...td, fontWeight:700, color:C.green }}>GH₵{fmt(sale.total)}</td>
                <td style={td}><span style={{ background:sale.payment==="cash"?"#d4edda":sale.payment==="card"?"#cfe2ff":"#e2d9f3", color:sale.payment==="cash"?"#155724":sale.payment==="card"?"#084298":"#432874", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:600 }}>{sale.payment}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CUSTOMERS
// ══════════════════════════════════════════════════════════════
function CustomersView({ customers, setCustomers, sales, storeId, notify, C, th, td }) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name:"", phone:"", email:"" });
  const filtered = customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.phone.includes(search));
  const addCustomer=()=>{
    if(!form.name)return;
    setCustomers(p=>[...p,{...form,id:`C${String(p.length+1).padStart(3,"0")}`,loyaltyPoints:0,totalSpent:0,joinDate:"2026-03-22",storeId}]);
    notify("Customer added!");setShowModal(false);setForm({name:"",phone:"",email:""});
  };
  return (
    <div style={{ padding:18 }}>
      <div style={{ display:"flex", gap:10, marginBottom:16 }}>
        <div style={{ position:"relative", flex:1 }}>
          <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", color:"#718096" }}><I n="search" s={14}/></div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search customers..." style={{ width:"100%", padding:"9px 12px 9px 32px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c", background:"#fff" }}/>
        </div>
        <button onClick={()=>setShowModal(true)} style={{ background:C.blue, color:"#fff", padding:"9px 18px", borderRadius:8, fontWeight:700, fontSize:13, display:"flex", gap:6, alignItems:"center" }}><I n="plus" s={14}/> Add Customer</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:14 }}>
        {filtered.map(c=>{
          const cs=sales.filter(s=>s.customer===c.name);
          return (
            <div key={c.id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:12, padding:18 }}>
              <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:14 }}>
                <div style={{ width:44, height:44, borderRadius:10, background:`${C.blue}20`, color:C.blue, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:14, flexShrink:0 }}>
                  {c.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#1a202c" }}>{c.name}</div>
                  <div style={{ fontSize:12, color:"#718096" }}>{c.phone}</div>
                </div>
                <div style={{ marginLeft:"auto", display:"flex", gap:2, alignItems:"center", color:C.orange, fontSize:12, fontWeight:700 }}>
                  <I n="star" s={12}/>{c.loyaltyPoints}
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, borderTop:"1px solid #f5f5f5", paddingTop:12 }}>
                {[["Spent",`GH₵${fmt(c.totalSpent)}`],["Purchases",cs.length],["Since",c.joinDate.slice(0,7)]].map(([k,v])=>(
                  <div key={k} style={{ textAlign:"center" }}>
                    <div style={{ fontWeight:700, fontSize:13, color:"#1a202c" }}>{v}</div>
                    <div style={{ fontSize:10, color:"#718096" }}>{k}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {showModal&&(
        <div className="modal-bg" onClick={()=>setShowModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:16, padding:28, width:380, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ fontWeight:700, fontSize:17, marginBottom:20, color:"#1a202c" }}>👤 Add Customer</div>
            {[["name","Full Name","text"],["phone","Phone","tel"],["email","Email","email"]].map(([field,label,type])=>(
              <div key={field} style={{ marginBottom:13 }}>
                <label style={{ fontSize:11, color:"#718096", display:"block", marginBottom:5, fontWeight:600, textTransform:"uppercase" }}>{label}</label>
                <input type={type} value={form[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.value}))} style={{ width:"100%", padding:"10px 12px", border:"1.5px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1a202c" }}/>
              </div>
            ))}
            <div style={{ display:"flex", gap:10, marginTop:6 }}>
              <button onClick={()=>setShowModal(false)} style={{ flex:1, padding:11, background:"#f0f2f5", borderRadius:8, fontWeight:600, color:"#444" }}>Cancel</button>
              <button onClick={addCustomer} style={{ flex:2, padding:11, background:C.blue, color:"#fff", borderRadius:8, fontWeight:700 }}>Add Customer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════
function ReportsView({ sales, products, stores, isSuper, allSales, C }) {
  const totalRevenue = sales.reduce((a,s)=>a+s.total,0);
  const totalCost = sales.reduce((a,sale)=>a+sale.items.reduce((b,item)=>{const p=products.find(x=>x.name===item.name);return b+(p?p.cost*item.qty:0);},0),0);
  const profit = totalRevenue-totalCost;
  const margin = totalRevenue?(profit/totalRevenue*100):0;

  const catRev={};
  sales.forEach(sale=>sale.items.forEach(item=>{const p=products.find(x=>x.name===item.name);if(p)catRev[p.category]=(catRev[p.category]||0)+item.price*item.qty;}));
  const catTotal=Object.values(catRev).reduce((a,b)=>a+b,1);

  const topProds={};
  sales.forEach(s=>s.items.forEach(item=>{topProds[item.name]=(topProds[item.name]||0)+item.qty;}));
  const sortedProds=Object.entries(topProds).sort((a,b)=>b[1]-a[1]).slice(0,6);

  const catColors=[C.blue,C.green,C.purple,C.orange,C.pink];

  return (
    <div style={{ padding:18 }}>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:18 }}>
        {[["Total Revenue",`GH₵${fmt(totalRevenue)}`,C.green,"💰"],["Gross Profit",`GH₵${fmt(profit)}`,C.purple,"📈"],["Profit Margin",`${margin.toFixed(1)}%`,C.blue,"🎯"],["Transactions",sales.length,C.orange,"🧾"]].map(([l,v,c,icon])=>(
          <div key={l} style={{ background:"#fff", borderTop:`4px solid ${c}`, border:"1px solid #e2e8f0", borderTopColor:c, borderRadius:10, padding:"14px 16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div><div style={{ fontSize:11, color:"#718096", fontWeight:600, textTransform:"uppercase", marginBottom:6 }}>{l}</div><div style={{ fontSize:22, fontWeight:700, color:"#1a202c" }}>{v}</div></div>
              <span style={{ fontSize:22 }}>{icon}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:18 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:"#1a202c" }}>Sales by Category</div>
          {Object.entries(catRev).sort((a,b)=>b[1]-a[1]).map(([cat,rev],i)=>(
            <div key={cat} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
                <span style={{ fontWeight:500, color:"#1a202c" }}>{cat}</span>
                <span style={{ fontWeight:700, color:catColors[i%5] }}>GH₵{fmt(rev)} ({((rev/catTotal)*100).toFixed(0)}%)</span>
              </div>
              <div style={{ height:6, background:"#f0f2f5", borderRadius:3 }}>
                <div style={{ width:`${(rev/catTotal)*100}%`, height:"100%", background:catColors[i%5], borderRadius:3 }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:18 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:"#1a202c" }}>🏆 Top Products (by qty)</div>
          {sortedProds.map(([name,qty],i)=>(
            <div key={name} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 0", borderBottom:"1px solid #f5f5f5" }}>
              <div style={{ width:24, height:24, borderRadius:6, background:i===0?`${C.orange}20`:C.blue+"10", color:i===0?C.orange:C.blue, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700 }}>#{i+1}</div>
              <div style={{ flex:1, fontSize:13, fontWeight:500, color:"#1a202c" }}>{name}</div>
              <span style={{ background:"#d4edda", color:"#155724", padding:"2px 8px", borderRadius:10, fontSize:11, fontWeight:700 }}>{qty} sold</span>
            </div>
          ))}
        </div>

        <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:18 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:"#1a202c" }}>Payment Methods</div>
          {["cash","mobile_money","card"].map((type,i)=>{
            const ss=sales.filter(s=>s.payment===type);
            const rev=ss.reduce((a,s)=>a+s.total,0);
            const pct=sales.length?(ss.length/sales.length*100):0;
            const col=[C.green,C.purple,C.blue][i];
            const label=["💵 Cash","📱 Mobile Money","💳 Card"][i];
            return (
              <div key={type} style={{ marginBottom:16 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
                  <span style={{ fontWeight:500 }}>{label}</span>
                  <span style={{ fontWeight:700, color:col }}>{ss.length} · GH₵{fmt(rev)}</span>
                </div>
                <div style={{ height:6, background:"#f0f2f5", borderRadius:3 }}>
                  <div style={{ width:`${pct}%`, height:"100%", background:col, borderRadius:3 }}/>
                </div>
              </div>
            );
          })}
        </div>

        {isSuper && (
          <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:18 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:16, color:"#1a202c" }}>Revenue by Store</div>
            {stores.map((store,i)=>{
              const sr=allSales.filter(s=>s.storeId===store.id);
              const rev=sr.reduce((a,s)=>a+s.total,0);
              const total=allSales.reduce((a,s)=>a+s.total,0)||1;
              return (
                <div key={store.id} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:13 }}>
                    <span style={{ fontWeight:500 }}>{store.name}</span>
                    <span style={{ fontWeight:700, color:catColors[i%5] }}>GH₵{fmt(rev)} ({((rev/total)*100).toFixed(0)}%)</span>
                  </div>
                  <div style={{ height:6, background:"#f0f2f5", borderRadius:3 }}>
                    <div style={{ width:`${(rev/total)*100}%`, height:"100%", background:catColors[i%5], borderRadius:3 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════
function SettingsView({ store, stores, setStores, currentUser, C, notify }) {
  const [taxRate, setTaxRate] = useState(store?.taxRate||10);
  const [storeName, setStoreName] = useState(store?.name||"");
  const [saved, setSaved] = useState(false);
  const save=()=>{
    if(store){setStores(p=>p.map(s=>s.id===store.id?{...s,name:storeName,taxRate:parseFloat(taxRate)}:s));}
    notify("Settings saved!");setSaved(true);setTimeout(()=>setSaved(false),2000);
  };
  const Section=({ title, children })=>(
    <div style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:10, padding:22, marginBottom:14 }}>
      <div style={{ fontWeight:700, fontSize:14, color:"#1a202c", marginBottom:16, paddingBottom:10, borderBottom:"1px solid #f0f2f5" }}>{title}</div>
      {children}
    </div>
  );
  const Field=({ label, sub, children })=>(
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
      <div><div style={{ fontSize:13, fontWeight:500, color:"#1a202c" }}>{label}</div>{sub&&<div style={{ fontSize:11, color:"#718096" }}>{sub}</div>}</div>
      {children}
    </div>
  );
  const Toggle=({ value })=>(
    <div style={{ width:42, height:22, borderRadius:11, background:value?C.green:"#e2e8f0", position:"relative", cursor:"pointer" }}>
      <div style={{ position:"absolute", top:2, left:value?22:2, width:18, height:18, borderRadius:9, background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 4px rgba(0,0,0,0.2)" }}/>
    </div>
  );
  return (
    <div style={{ padding:18, maxWidth:650 }}>
      <Section title="🏪 Store Information">
        {store ? (
          <>
            <Field label="Store Name"><input value={storeName} onChange={e=>setStoreName(e.target.value)} style={{ padding:"7px 12px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:13, color:"#1a202c", width:200 }}/></Field>
            <Field label="VAT/Tax Rate (%)" sub="Applied on all sales"><input type="number" value={taxRate} onChange={e=>setTaxRate(e.target.value)} style={{ padding:"7px 12px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:13, color:"#1a202c", width:80 }}/></Field>
            <Field label="Currency"><span style={{ fontWeight:600, color:C.blue }}>{store.currency}</span></Field>
          </>
        ) : <div style={{ fontSize:13, color:"#718096" }}>Super Admin settings apply globally across all stores.</div>}
      </Section>
      <Section title="🔔 Notifications">
        <Field label="Low Stock Alerts" sub="Alert when stock falls below reorder level"><Toggle value={true}/></Field>
        <Field label="Daily Summary" sub="End-of-shift sales summary"><Toggle value={true}/></Field>
      </Section>
      <Section title="🔐 Security">
        <Field label="PIN for Discounts" sub="Require manager approval for discounts"><Toggle value={true}/></Field>
        <Field label="Session Timeout"><select style={{ padding:"7px 10px", border:"1.5px solid #e2e8f0", borderRadius:7, fontSize:12, color:"#1a202c" }}><option>30 minutes</option><option>1 hour</option><option>Never</option></select></Field>
      </Section>
      <button onClick={save} style={{ padding:"11px 28px", borderRadius:8, background:C.green, color:"#fff", fontWeight:700, fontSize:14, display:"flex", gap:8, alignItems:"center" }}>
        {saved?<><I n="check" s={15}/>Saved!</>:"Save Settings"}
      </button>
    </div>
  );
}
