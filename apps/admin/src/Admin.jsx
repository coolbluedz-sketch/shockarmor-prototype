import React, { useState, useEffect, useMemo, useRef } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Shield, Zap, Truck, CheckCircle, Package, LayoutDashboard, Tags, ClipboardList, Users, MapPin, LogOut, Menu, Globe, MessageCircle, Store, ChevronRight, ChevronLeft, Edit, Phone } from "lucide-react";
import { C, T, WILAYAS, fmt, waLink, STATUS, STATUS_COLOR, ProductArt, ProductVisual, Logo, catArt, api, supabase, isSupabaseConfigured, ImageUploader } from "@shared";

function Admin(props) {
  const { t } = props;
  // Auth réelle si Supabase est configuré ; sinon login factice (démo en mémoire).
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(isSupabaseConfigured);
  const [demoLogged, setDemoLogged] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setChecking(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  const loggedIn = isSupabaseConfigured ? !!session : demoLogged;

  const onSubmit = async (email, pw) => {
    if (!isSupabaseConfigured) { setDemoLogged(true); return null; }
    const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
    return error ? error.message : null;
  };
  const onLogout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    else setDemoLogged(false);
  };

  if (checking) {
    return <div className="bx-login"><div className="bx-card">{t.signingIn}</div></div>;
  }
  if (!loggedIn) return <Login t={t} demo={!isSupabaseConfigured} onSubmit={onSubmit} />;
  return <AdminShell {...props} onLogout={onLogout} />;
}

function Login({ t, onSubmit, demo }) {
  const [email,setEmail] = useState(demo ? "admin@shockarmor.dz" : "");
  const [pw,setPw] = useState(demo ? "demo1234" : "");
  const [err,setErr] = useState(null);
  const [busy,setBusy] = useState(false);
  const submit = async () => {
    if (busy) return;
    setErr(null); setBusy(true);
    try {
      const e = await onSubmit(email, pw);
      if (e) setErr(e);
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="bx-login">
      <div className="bx-card">
        <div style={{marginBottom:18}}><Logo size={36}/></div>
        <h3 style={{fontSize:18,marginBottom:16}}>{t.login}</h3>
        <label className="bx-label">{t.email}</label>
        <input className="bx-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{marginBottom:12}}/>
        <label className="bx-label">{t.password}</label>
        <input className="bx-input" type="password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} style={{marginBottom:16}}/>
        {err && <p style={{fontSize:12,color:C.red,marginBottom:12}} role="alert">{err}</p>}
        <button className="bx-btn bx-cobalt" style={{width:"100%"}} onClick={submit} disabled={busy}>{busy ? t.signingIn : t.signin}</button>
        <p style={{fontSize:12,color:C.muted,marginTop:12,textAlign:"center"}}>{demo ? t.demoHint : t.authHint}</p>
      </div>
    </div>
  );
}

function AdminShell({ t, lang, cats, setCats, products, setProducts, orders, setOrders, fees, setFees, waNumber, setWaNumber, onLogout }) {
  const L = (o) => o[lang] || o.fr;
  const [tab, setTab] = useState("dash");
  const newCount = orders.filter(o=>o.status==="new").length;
  const nav = [
    ["dash", t.dashboard, LayoutDashboard], ["products", t.products, Package],
    ["cats", t.gammes, Tags], ["orders", t.orders, ClipboardList],
    ["clients", t.clients, Users], ["delivery", t.delivery, Truck],
  ];
  return (
    <div className="bx-admin">
      <aside className="bx-side">
        <div className="brand"><Logo wordmark={false} size={28}/>Admin</div>
        {nav.map(([id,label,Icon])=>(
          <button key={id} className={tab===id?"on":""} onClick={()=>setTab(id)}>
            <Icon size={17}/>{label}
            {id==="orders" && newCount>0 && <span className="bx-badge" style={{position:"static",marginInlineStart:"auto"}}>{newCount}</span>}
          </button>
        ))}
        <div style={{borderTop:`1px solid ${C.line}`,marginTop:10,paddingTop:10}}>
          <button onClick={onLogout}><LogOut size={17}/>{t.logout}</button>
        </div>
      </aside>
      <main className="bx-main">
        {tab==="dash" && <Dashboard {...{t,lang,products,orders,waNumber,setWaNumber,setTab}}/>}
        {tab==="products" && <ProductsAdmin {...{t,L,lang,products,setProducts,cats}}/>}
        {tab==="cats" && <CatsAdmin {...{t,L,cats,setCats,products}}/>}
        {tab==="orders" && <OrdersAdmin {...{t,lang,orders,setOrders,setProducts}}/>}
        {tab==="clients" && <ClientsAdmin {...{t,lang,orders}}/>}
        {tab==="delivery" && <DeliveryAdmin {...{t,lang,fees,setFees}}/>}
      </main>
    </div>
  );
}

function StatusPill({ status, t }) {
  return <span className="bx-pill" style={{background:STATUS_COLOR[status]}}>{t["st_"+status]}</span>;
}

function waMsg(o, lang, t){
  const lines = o.items.map(i=>`• ${i.name} x${i.qty}`).join("\n");
  const w = WILAYAS.find(x=>x.code===o.wilaya);
  return `🛡️ ShockArmor — ${t.orderNo}: ${o.no}\n${o.name} — ${o.phone}\n${w?w.name:""}, ${o.commune}\n${o.address}\n${lines}\n${t.total}: ${fmt(o.total,lang)} (COD)`;
}

function Dashboard({ t, lang, products, orders, waNumber, setWaNumber, setTab }) {
  const revenue = orders.filter(o=>o.status==="delivered").reduce((s,o)=>s+o.total,0);
  const newOrders = orders.filter(o=>o.status==="new");
  const stockOut = products.filter(p=>p.stock<=0).length;
  const counts = STATUS.map(s=>({ s, n: orders.filter(o=>o.status===s).length }));
  const maxN = Math.max(1, ...counts.map(c=>c.n));
  const latest = [...orders].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5);
  const kpis = [
    [t.kpiRevenue, fmt(revenue,lang), C.green],
    [t.kpiOrders, orders.length, C.cobalt],
    [t.kpiNew, newOrders.length, C.amber],
    [t.kpiStockOut, stockOut, stockOut>0?C.red:C.ink],
  ];
  return (
    <>
      <h2>{t.dashboard}</h2>
      <div className="bx-kpis">
        {kpis.map(([k,v,c],i)=>(
          <div className="bx-kpi" key={i}><div className="k">{k}</div><div className="v mono" style={{color:c}}>{v}</div></div>
        ))}
      </div>

      <div className="bx-dash2">
        <div className="bx-card" style={{padding:18}}>
          <h3 style={{fontSize:15,marginBottom:16}}>{t.ordersByStatus}</h3>
          {counts.map(c=>(
            <div key={c.s} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:5}}>
                <span>{t["st_"+c.s]}</span><span className="mono" style={{fontWeight:700}}>{c.n}</span>
              </div>
              <div style={{background:C.mist,borderRadius:6,height:10}}>
                <div className="bx-bar" style={{width:`${(c.n/maxN)*100}%`,background:STATUS_COLOR[c.s],minWidth:c.n?6:0}}/>
              </div>
            </div>
          ))}
        </div>
        <div className="bx-card" style={{padding:18}}>
          <h3 style={{fontSize:15,marginBottom:6,display:"flex",alignItems:"center",gap:8}}><MessageCircle size={17} color={C.green}/>{t.notifyWa}</h3>
          <label className="bx-label" style={{marginTop:8}}>{t.waNumber}</label>
          <input className="bx-input mono" value={waNumber} onChange={e=>setWaNumber(e.target.value)}/>
          <div style={{marginTop:14}}>
            {newOrders.length===0
              ? <p style={{fontSize:13,color:C.muted}}>—</p>
              : newOrders.slice(0,3).map(o=>(
                <div key={o.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderTop:`1px solid ${C.line}`}}>
                  <div style={{fontSize:13}}><b className="mono">{o.no}</b> · {o.name}</div>
                  <a className="bx-btn bx-cobalt" style={{padding:"7px 12px"}} target="_blank" rel="noreferrer"
                     href={waLink(waNumber, waMsg(o,lang,t))}><MessageCircle size={14}/></a>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <div className="bx-card" style={{overflow:"hidden"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 16px"}}>
          <h3 style={{fontSize:15}}>{t.latestOrders}</h3>
          <button className="bx-btn bx-ghost" style={{padding:"7px 12px"}} onClick={()=>setTab("orders")}>{t.orders}<ChevronRight size={14}/></button>
        </div>
        <table className="bx-table" style={{border:"none",borderRadius:0,boxShadow:"none"}}>
          <thead><tr><th>{t.orderNo}</th><th>{t.customer}</th><th>{t.total}</th><th>{t.status}</th></tr></thead>
          <tbody>
            {latest.map(o=>(
              <tr key={o.id}><td className="mono">{o.no}</td><td>{o.name}</td><td className="mono">{fmt(o.total,lang)}</td><td><StatusPill status={o.status} t={t}/></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function ProductsAdmin({ t, L, lang, products, setProducts, cats }) {
  const [edit,setEdit] = useState(null);
  const [confirmDel,setConfirmDel] = useState(null); // produit en attente de confirmation de suppression
  const [deleting,setDeleting] = useState(false);
  const blank = { id:"", cat:cats[0]?.id, sku:"", price:0, was:null, stock:0, drop:null, rating:4.5, hot:false, active:true, brand:"", model:"", fr:"",en:"",ar:"",dFr:"",dEn:"",dAr:"", images:[] };
  const save = async (p) => {
    try {
      const saved = isSupabaseConfigured ? await api.saveProduct(p) : { ...p, id: p.id || "p"+Date.now() };
      setProducts(prev => prev.some(x=>x.id===saved.id) ? prev.map(x=>x.id===saved.id?saved:x) : [saved, ...prev]);
      setEdit(null);
    } catch (e) { alert("Erreur enregistrement produit : " + e.message); }
  };
  const confirmDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      if (isSupabaseConfigured) await api.deleteProduct(confirmDel); // supprime aussi les images Cloudinary
      setProducts(prev=>prev.filter(x=>x.id!==confirmDel.id));
      setConfirmDel(null);
    } catch (e) { alert("Erreur suppression produit : " + e.message); }
    finally { setDeleting(false); }
  };
  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h2 style={{margin:0}}>{t.products}</h2>
        <button className="bx-btn bx-cobalt" onClick={()=>setEdit({...blank})}><Plus size={16}/>{t.newProduct}</button>
      </div>
      <table className="bx-table">
        <thead><tr><th>{t.name}</th><th>{t.category}</th><th>{t.price}</th><th>{t.stock}</th><th>{t.actions}</th></tr></thead>
        <tbody>
          {products.map(p=>(
            <tr key={p.id}>
              <td><div className="bx-row-gap" style={{opacity:p.active===false?0.5:1}}><ProductVisual p={p} size={34} radius={8}/><div><div style={{fontWeight:600,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>{L(p)}
                {p.hot && <span style={{fontSize:10,fontWeight:700,color:C.amber,background:C.mist,border:`1px solid ${C.amber}`,borderRadius:6,padding:"1px 6px"}}>★ {t.featuredShort}</span>}
                {p.active===false && <span style={{fontSize:10,fontWeight:700,color:C.muted,background:C.mist,borderRadius:6,padding:"1px 6px"}}>{t.hidden}</span>}
              </div><div style={{fontSize:11,color:C.muted}}><span className="mono">{p.sku}</span> · {p.brand} {p.model}</div></div></div></td>
              <td>{L(cats.find(c=>c.id===p.cat)||{fr:"—"})}</td>
              <td className="mono">{fmt(p.price,lang)}</td>
              <td><span style={{color:p.stock<=0?C.red:p.stock<10?C.amber:C.ink,fontWeight:700}} className="mono">{p.stock}</span></td>
              <td><div className="bx-row-gap">
                <button className="bx-iconbtn" onClick={()=>setEdit({...p})}><Edit size={15}/></button>
                <button className="bx-iconbtn" onClick={()=>setConfirmDel(p)} style={{color:C.red}}><Trash2 size={15}/></button>
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
      {edit && <ProductEditor {...{t,cats,product:edit,onClose:()=>setEdit(null),onSave:save}}/>}
      {confirmDel && (
        <div className="bx-overlay" onClick={()=>!deleting&&setConfirmDel(null)}>
          <div className="bx-modal sm" onClick={e=>e.stopPropagation()}>
            <div className="bx-dh"><h3>{t.confirmDelTitle}</h3><button className="bx-x" onClick={()=>!deleting&&setConfirmDel(null)}><X size={18}/></button></div>
            <div style={{padding:20}}>
              <div className="bx-row-gap" style={{marginBottom:12}}>
                <ProductVisual p={confirmDel} size={44} radius={10}/>
                <div>
                  <div style={{fontWeight:700}}>{L(confirmDel)}</div>
                  <div style={{fontSize:12,color:C.muted}}><span className="mono">{confirmDel.sku}</span></div>
                </div>
              </div>
              <p style={{margin:0,fontSize:13,color:C.muted}}>{t.confirmDelMsg}</p>
              <div className="bx-row-gap" style={{justifyContent:"flex-end",marginTop:20}}>
                <button className="bx-btn bx-ghost" onClick={()=>setConfirmDel(null)} disabled={deleting}>{t.cancel}</button>
                <button className="bx-btn" style={{background:C.red,color:"#fff"}} onClick={confirmDelete} disabled={deleting}>
                  <Trash2 size={15}/>{deleting ? "…" : t.del}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProductEditor({ t, cats, product, onClose, onSave }) {
  const [p,setP] = useState(product);
  const set=(k,v)=>setP(prev=>({...prev,[k]:v}));
  return (
    <div className="bx-overlay" onClick={onClose}>
      <div className="bx-modal" onClick={e=>e.stopPropagation()}>
        <div className="bx-dh"><h3>{p.id?t.edit:t.newProduct}</h3><button className="bx-x" onClick={onClose}><X size={18}/></button></div>
        <div style={{padding:20}}>
          <div className="bx-form-grid">
            <div><label className="bx-label">{t.name} (FR)</label><input className="bx-input" value={p.fr} onChange={e=>set("fr",e.target.value)}/></div>
            <div><label className="bx-label">{t.name} (EN)</label><input className="bx-input" value={p.en} onChange={e=>set("en",e.target.value)}/></div>
            <div><label className="bx-label">{t.name} (AR)</label><input className="bx-input" dir="rtl" value={p.ar} onChange={e=>set("ar",e.target.value)}/></div>
            <div><label className="bx-label">SKU</label><input className="bx-input mono" value={p.sku} onChange={e=>set("sku",e.target.value)}/></div>
            <div><label className="bx-label">Marque</label><input className="bx-input" value={p.brand||""} onChange={e=>set("brand",e.target.value)}/></div>
            <div><label className="bx-label">Modèle</label><input className="bx-input mono" value={p.model||""} onChange={e=>set("model",e.target.value)}/></div>
            <div><label className="bx-label">{t.category}</label>
              <select className="bx-select" value={p.cat} onChange={e=>set("cat",e.target.value)}>
                {cats.map(c=><option key={c.id} value={c.id}>{c.fr}</option>)}
              </select></div>
            <div><label className="bx-label">{t.price} (DA)</label><input className="bx-input mono" type="number" value={p.price} onChange={e=>set("price",Number(e.target.value))}/></div>
            <div><label className="bx-label">{t.stock}</label><input className="bx-input mono" type="number" value={p.stock} onChange={e=>set("stock",Number(e.target.value))}/></div>
            <div><label className="bx-label">{t.dropTest} (m)</label><input className="bx-input mono" type="number" step="0.1" value={p.drop||""} onChange={e=>set("drop",e.target.value?Number(e.target.value):null)}/></div>
          </div>
          <div style={{marginTop:12}}><label className="bx-label">Description (FR)</label><textarea className="bx-area" rows={2} value={p.dFr} onChange={e=>set("dFr",e.target.value)}/></div>
          <div style={{marginTop:12}}>
            <label className="bx-label">Photos</label>
            <ImageUploader
              images={p.images || []}
              onChange={(imgs)=>set("images",imgs)}
              folder="products"
              max={6}
            />
          </div>
          <div style={{marginTop:16,display:"flex",gap:24,flexWrap:"wrap"}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14,fontWeight:600}}>
              <input type="checkbox" checked={!!p.hot} onChange={e=>set("hot",e.target.checked)} style={{width:16,height:16,accentColor:C.amber}}/>
              {t.featuredLabel}
            </label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:14,fontWeight:600}}>
              <input type="checkbox" checked={p.active!==false} onChange={e=>set("active",e.target.checked)} style={{width:16,height:16,accentColor:C.cobalt}}/>
              {t.activeLabel}
            </label>
          </div>
          <div className="bx-row-gap" style={{justifyContent:"flex-end",marginTop:16}}>
            <button className="bx-btn bx-ghost" onClick={onClose}>{t.cancel}</button>
            <button className="bx-btn bx-cobalt" onClick={()=>onSave(p)}>{t.save}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CatsAdmin({ t, L, cats, setCats, products }) {
  const [edit,setEdit]=useState(null);
  const arts=["case","glass","bumper","sleeve"];
  const save=async(c)=>{
    try {
      const saved = isSupabaseConfigured ? await api.saveCategory(c) : { ...c, id: c.id || "c"+Date.now() };
      setCats(prev => prev.some(x=>x.id===saved.id) ? prev.map(x=>x.id===saved.id?saved:x) : [...prev, saved]);
      setEdit(null);
    } catch (e) { alert("Erreur enregistrement gamme : " + e.message); }
  };
  const del=async(id)=>{
    if(!confirm("Supprimer cette gamme ? Les produits liés perdront leur gamme.")) return;
    try {
      if (isSupabaseConfigured) await api.deleteCategory(id);
      setCats(prev=>prev.filter(x=>x.id!==id));
    } catch (e) { alert("Erreur suppression gamme : " + e.message); }
  };
  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h2 style={{margin:0}}>{t.gammes}</h2>
        <button className="bx-btn bx-cobalt" onClick={()=>setEdit({id:"",fr:"",en:"",ar:"",art:"case"})}><Plus size={16}/>{t.newCat}</button>
      </div>
      <div className="bx-cats">
        {cats.map(c=>(
          <div className="bx-card" key={c.id} style={{padding:16}}>
            <ProductArt variant={c.art} accent={C.cobalt} size={70}/>
            <h3 style={{fontSize:15,marginTop:8}}>{L(c)}</h3>
            <span style={{fontSize:12.5,color:C.muted}}>{products.filter(p=>p.cat===c.id).length} {t.products.toLowerCase()}</span>
            <div className="bx-row-gap" style={{marginTop:10}}>
              <button className="bx-iconbtn" onClick={()=>setEdit({...c})}><Edit size={15}/></button>
              <button className="bx-iconbtn" onClick={()=>del(c.id)} style={{color:C.red}}><Trash2 size={15}/></button>
            </div>
          </div>
        ))}
      </div>
      {edit && (
        <div className="bx-overlay" onClick={()=>setEdit(null)}>
          <div className="bx-modal sm" onClick={e=>e.stopPropagation()}>
            <div className="bx-dh"><h3>{edit.id?t.edit:t.newCat}</h3><button className="bx-x" onClick={()=>setEdit(null)}><X size={18}/></button></div>
            <div style={{padding:20}}>
              <div className="bx-form-grid">
                <div><label className="bx-label">{t.name} (FR)</label><input className="bx-input" value={edit.fr} onChange={e=>setEdit({...edit,fr:e.target.value})}/></div>
                <div><label className="bx-label">{t.name} (EN)</label><input className="bx-input" value={edit.en} onChange={e=>setEdit({...edit,en:e.target.value})}/></div>
                <div><label className="bx-label">{t.name} (AR)</label><input className="bx-input" dir="rtl" value={edit.ar} onChange={e=>setEdit({...edit,ar:e.target.value})}/></div>
                <div><label className="bx-label">Icône</label>
                  <select className="bx-select" value={edit.art} onChange={e=>setEdit({...edit,art:e.target.value})}>
                    {arts.map(a=><option key={a} value={a}>{a}</option>)}
                  </select></div>
              </div>
              <div className="bx-row-gap" style={{justifyContent:"flex-end",marginTop:16}}>
                <button className="bx-btn bx-ghost" onClick={()=>setEdit(null)}>{t.cancel}</button>
                <button className="bx-btn bx-cobalt" onClick={()=>save(edit)}>{t.save}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function OrdersAdmin({ t, lang, orders, setOrders, setProducts }) {
  const [filter,setFilter]=useState("all");
  const [detail,setDetail]=useState(null);
  const list = [...orders].sort((a,b)=>b.createdAt-a.createdAt).filter(o=>filter==="all"||o.status===filter);

  const changeStatus=async(order,status)=>{
    const isConfirm = order.status==="new" && status==="confirmed";
    try {
      if (isSupabaseConfigured) {
        if (isConfirm) await api.confirmOrder(order.id);   // décompte du stock atomique côté serveur
        else await api.setOrderStatus(order.id, status);
      }
    } catch (e) { alert("Erreur changement de statut : " + e.message); return; }
    if (isConfirm) {
      setProducts(prev=>prev.map(p=>{
        const it=order.items.find(i=>i.productId===p.id);
        return it?{...p,stock:Math.max(0,p.stock-it.qty)}:p;
      }));
    }
    setOrders(prev=>prev.map(o=>o.id===order.id?{...o,status}:o));
    setDetail(d=>d&&d.id===order.id?{...d,status}:d);
  };

  return (
    <>
      <h2>{t.orders}</h2>
      <div className="bx-filters">
        <button className={filter==="all"?"on":""} onClick={()=>setFilter("all")}>{t.all}</button>
        {STATUS.map(s=><button key={s} className={filter===s?"on":""} onClick={()=>setFilter(s)}>{t["st_"+s]}</button>)}
      </div>
      {list.length===0 ? <p style={{color:C.muted}}>{t.noOrders}</p> : (
        <table className="bx-table">
          <thead><tr><th>{t.orderNo}</th><th>{t.customer}</th><th>{t.wilaya}</th><th>{t.total}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead>
          <tbody>
            {list.map(o=>{
              const w=WILAYAS.find(x=>x.code===o.wilaya);
              return (
                <tr key={o.id}>
                  <td className="mono">{o.no}</td>
                  <td><div style={{fontWeight:600}}>{o.name}</div><div className="mono" style={{fontSize:11,color:C.muted}}>{o.phone}</div></td>
                  <td style={{fontSize:13}}>{w?(lang==="ar"?w.ar:w.name):"—"}</td>
                  <td className="mono">{fmt(o.total,lang)}</td>
                  <td><StatusPill status={o.status} t={t}/></td>
                  <td><div className="bx-row-gap">
                    <button className="bx-iconbtn" onClick={()=>setDetail(o)}><Search size={15}/></button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {detail && (
        <div className="bx-overlay" onClick={()=>setDetail(null)}>
          <div className="bx-modal" onClick={e=>e.stopPropagation()}>
            <div className="bx-dh"><h3 className="mono">{detail.no}</h3><button className="bx-x" onClick={()=>setDetail(null)}><X size={18}/></button></div>
            <div style={{padding:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:10}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16}}>{detail.name}</div>
                  <div><a className="mono" href={`tel:${String(detail.phone).replace(/\s/g,"")}`} style={{color:C.cobalt,fontSize:13,textDecoration:"none"}}>{detail.phone}</a></div>
                  <a className="bx-btn" href={`tel:${String(detail.phone).replace(/\s/g,"")}`} style={{background:C.green,color:"#fff",textDecoration:"none",marginTop:8,padding:"8px 14px",fontSize:13}}>
                    <Phone size={15}/>{t.callClient}
                  </a>
                  <div style={{fontSize:13,marginTop:6,display:"flex",alignItems:"center",gap:6}}><MapPin size={14} color={C.cobalt}/>
                    {(()=>{const w=WILAYAS.find(x=>x.code===detail.wilaya);return w?(lang==="ar"?w.ar:w.name):"";})()}, {detail.commune}</div>
                  <div style={{fontSize:13,color:C.inkSoft}}>{detail.address}</div>
                  <div style={{fontSize:13,marginTop:4}}>{detail.deliveryType==="home"?t.homeDeliv:t.desk}</div>
                </div>
                <StatusPill status={detail.status} t={t}/>
              </div>
              <table className="bx-table" style={{marginBottom:14}}>
                <thead><tr><th>{t.items}</th><th>{t.qty}</th><th>{t.price}</th></tr></thead>
                <tbody>{detail.items.map((i,k)=>(
                  <tr key={k}><td>{i.name}</td><td className="mono">{i.qty}</td><td className="mono">{fmt(i.price*i.qty,lang)}</td></tr>
                ))}</tbody>
              </table>
              <div className="bx-card" style={{padding:12,marginBottom:14}}>
                <div className="bx-sumrow"><span>{t.subtotal}</span><span className="mono">{fmt(detail.subtotal,lang)}</span></div>
                <div className="bx-sumrow"><span>{t.delivery}</span><span className="mono">{fmt(detail.delivery,lang)}</span></div>
                <div className="bx-sumrow tot"><span>{t.total}</span><span className="mono">{fmt(detail.total,lang)}</span></div>
              </div>
              <label className="bx-label">{t.changeStatus}</label>
              <div className="bx-filters" style={{marginBottom:6}}>
                {STATUS.map(s=>(
                  <button key={s} className={detail.status===s?"on":""} onClick={()=>changeStatus(detail,s)}>{t["st_"+s]}</button>
                ))}
              </div>
              {detail.status==="new" && (
                <button className="bx-btn bx-cobalt" style={{width:"100%",marginTop:8}} onClick={()=>changeStatus(detail,"confirmed")}>
                  <CheckCircle size={16}/>{t.confirmStock}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ClientsAdmin({ t, lang, orders }) {
  const clients = useMemo(()=>{
    const m={};
    orders.forEach(o=>{
      if(o.status==="cancelled") return;
      if(!m[o.phone]) m[o.phone]={ name:o.name, phone:o.phone, count:0, total:0, wilaya:o.wilaya };
      m[o.phone].count++; m[o.phone].total+=o.total;
    });
    return Object.values(m).sort((a,b)=>b.total-a.total);
  },[orders]);
  return (
    <>
      <h2>{t.clients}</h2>
      {clients.length===0 ? <p style={{color:C.muted}}>—</p> : (
        <table className="bx-table">
          <thead><tr><th>{t.customer}</th><th>{t.phone}</th><th>{t.wilaya}</th><th>{t.ordersCount}</th><th>{t.spent}</th></tr></thead>
          <tbody>
            {clients.map((c,i)=>{
              const w=WILAYAS.find(x=>x.code===c.wilaya);
              return (
                <tr key={i}>
                  <td style={{fontWeight:600}}>{c.name}</td>
                  <td className="mono">{c.phone}</td>
                  <td style={{fontSize:13}}>{w?(lang==="ar"?w.ar:w.name):"—"}</td>
                  <td className="mono">{c.count}</td>
                  <td className="mono" style={{fontWeight:700}}>{fmt(c.total,lang)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}

function DeliveryAdmin({ t, lang, fees, setFees }) {
  const [q,setQ]=useState("");
  const upd=(code,key,val)=>setFees(prev=>({...prev,[code]:{...prev[code],[key]:Number(val)||0}}));
  const persist=async(code)=>{
    if(!isSupabaseConfigured) return;
    try { await api.setWilayaFee(code, fees[code]); }
    catch(e){ alert("Erreur frais wilaya : " + e.message); }
  };
  const list = WILAYAS.filter(w=> !q || w.name.toLowerCase().includes(q.toLowerCase()) || w.ar.includes(q) || String(w.code).includes(q));
  return (
    <>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <h2 style={{margin:0}}>{t.delivery}</h2>
        <div className="bx-searchbox" style={{display:"flex",maxWidth:260}}>
          <Search size={16}/><input value={q} placeholder={t.wilaya} onChange={e=>setQ(e.target.value)}/>
        </div>
      </div>
      <table className="bx-table">
        <thead><tr><th>#</th><th>{t.wilaya}</th><th>{t.feeHome}</th><th>{t.feeDesk}</th></tr></thead>
        <tbody>
          {list.map(w=>(
            <tr key={w.code}>
              <td className="mono" style={{color:C.muted}}>{String(w.code).padStart(2,"0")}</td>
              <td style={{fontWeight:600}}>{lang==="ar"?w.ar:w.name}</td>
              <td><input className="bx-input mono" style={{maxWidth:120,padding:"7px 10px"}} type="number" value={fees[w.code]?.home ?? 0} onChange={e=>upd(w.code,"home",e.target.value)} onBlur={()=>persist(w.code)}/></td>
              <td><input className="bx-input mono" style={{maxWidth:120,padding:"7px 10px"}} type="number" value={fees[w.code]?.desk ?? 0} onChange={e=>upd(w.code,"desk",e.target.value)} onBlur={()=>persist(w.code)}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

export { Admin };
