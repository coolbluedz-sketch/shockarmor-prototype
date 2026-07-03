import React, { useState, useEffect, useMemo, useRef } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Shield, Zap, Truck, CheckCircle, Package, LayoutDashboard, Tags, ClipboardList, Users, MapPin, LogOut, Menu, Globe, MessageCircle, Store, ChevronRight, ChevronLeft, Edit } from "lucide-react";
import { C, T, WILAYAS, fmt, genNo, waLink, catArt, ProductArt, ProductVisual, Logo, LangSwitch, api, isSupabaseConfigured } from "@shared";

function Shop({ t, lang, setLang, cats, products, fees, setOrders, waNumber }) {
  const L = (o) => o[lang] || o.fr;
  const [page, setPage] = useState("home");
  const [catFilter, setCatFilter] = useState("all");
  const [q, setQ] = useState("");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null);
  const [checkout, setCheckout] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const catsRef = useRef(null);
  const scrollCats = (dir) => {
    const el = catsRef.current; if(!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.7, behavior:"smooth" });
  };

  const catName = (id) => { const c = cats.find(x=>x.id===id); return c?L(c):""; };
  const cartCount = cart.reduce((s,i)=>s+i.qty,0);
  const cartItems = cart.map(i => ({ ...i, p: products.find(p=>p.id===i.productId) })).filter(i=>i.p);
  const subtotal = cartItems.reduce((s,i)=>s + i.p.price*i.qty, 0);

  const addToCart = (p, qty=1) => {
    setCart(prev => {
      const ex = prev.find(i=>i.productId===p.id);
      if (ex) return prev.map(i=>i.productId===p.id?{...i,qty:i.qty+qty}:i);
      return [...prev, {productId:p.id, qty}];
    });
    setActiveProduct(null); setCartOpen(true);
  };
  // Achat direct : ajoute au panier puis va droit au checkout.
  const buyNow = (p, qty=1) => { addToCart(p, qty); setCartOpen(false); setCheckout(true); };
  const setQty = (id, qty) => setCart(prev => qty<=0 ? prev.filter(i=>i.productId!==id) : prev.map(i=>i.productId===id?{...i,qty}:i));

  let list = products.filter(p => p.active!==false && (catFilter==="all" || p.cat===catFilter));
  if (q.trim()) { const s=q.toLowerCase(); list = list.filter(p => L(p).toLowerCase().includes(s) || p.sku.toLowerCase().includes(s)); }
  const featured = products.filter(p=>p.hot && p.active!==false);
  const goCatalog = (cat="all") => { setCatFilter(cat); setPage("catalog"); window.scrollTo(0,0); };

  const placeOrder = async (form) => {
    const w = WILAYAS.find(x=>x.code===Number(form.wilaya));
    const delivery = fees[form.wilaya]?.[form.deliveryType==="home"?"home":"desk"] ?? 0;
    const items = cartItems.map(i=>({ productId:i.p.id, name:L(i.p), price:i.p.price, qty:i.qty }));
    const draft = {
      id:"o"+Date.now(), no:genNo(), name:form.name, phone:form.phone, wilaya:Number(form.wilaya),
      commune:form.commune, address:form.address, deliveryType:form.deliveryType, note:form.note||"",
      items, subtotal, delivery, total:subtotal+delivery, status:"new", createdAt:Date.now(),
    };
    let order = draft;
    if (isSupabaseConfigured) {
      try { order = await api.createOrder(draft); }
      catch (e) { alert("Erreur lors de l'enregistrement de la commande : " + e.message); return; }
    }
    setOrders(prev=>[order, ...prev]);
    setCart([]); setCheckout(false); setCartOpen(false);
    setConfirmation({ order, wilayaName: w ? (lang==="ar"?w.ar:w.name) : "" });
  };

  return (
    <>
      <header className="bx-head">
        <div className="bx-wrap">
          <div className="bx-logo" onClick={()=>{setPage("home");setMenuOpen(false);window.scrollTo(0,0);}} style={{cursor:"pointer"}}>
            <Logo/>
          </div>
          <nav className="bx-nav">
            <button className={page==="home"?"on":""} onClick={()=>{setPage("home");window.scrollTo(0,0);}}>{t.home}</button>
            <button className={page==="catalog"?"on":""} onClick={()=>goCatalog("all")}>{t.catalog}</button>
          </nav>
          <div className="bx-searchbox">
            <Search size={16}/>
            <input value={q} placeholder={t.search}
              onChange={e=>{setQ(e.target.value); if(e.target.value) setPage("catalog");}}/>
          </div>
          <div className="bx-head-actions">
            <LangSwitch lang={lang} setLang={setLang}/>
            <button className="bx-carticon" onClick={()=>setCartOpen(true)} aria-label={t.cart}>
              <ShoppingCart size={19}/>
              {cartCount>0 && <span className="bx-badge" key={cartCount}>{cartCount}</span>}
            </button>
            <button className="bx-burger" onClick={()=>setMenuOpen(o=>!o)} aria-label="Menu" aria-expanded={menuOpen}>
              {menuOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="bx-mmenu">
            <div className="bx-searchbox">
              <Search size={16}/>
              <input value={q} placeholder={t.search}
                onChange={e=>{setQ(e.target.value); if(e.target.value){setPage("catalog");}}}/>
            </div>
            <button onClick={()=>{setPage("home");setMenuOpen(false);window.scrollTo(0,0);}}>{t.home}</button>
            <button onClick={()=>{goCatalog("all");setMenuOpen(false);}}>{t.catalog}</button>
          </div>
        )}
      </header>

      {page==="home" && (
        <>
          <section className="bx-hero">
            <div className="bx-wrap">
              <div className="bx-hero-text">
                <span className="bx-kicker"><Zap size={14}/>{t.heroKicker}</span>
                <h1>{t.heroTitle}</h1>
                <p>{t.heroSub}</p>
                <button className="bx-btn bx-amber" onClick={()=>goCatalog("all")}>{t.shopNow}<ChevronRight size={16}/></button>
              </div>
            </div>
          </section>

          <section className="bx-trust">
            <div className="bx-wrap">
              <span className="bx-trust-i"><MapPin size={18}/>{t.trustDelivery}</span>
            </div>
          </section>

          <section className="bx-section"><div className="bx-wrap">
            <div className="bx-sec-h"><h2>{t.categories}</h2></div>
            <div className="bx-cats-wrap">
              <button className="bx-cats-arrow prev" onClick={()=>scrollCats(-1)} aria-label="◀"><ChevronLeft size={20}/></button>
              <div className="bx-cats bx-cats-scroll" ref={catsRef}>
                {cats.map(c=>{
                  const n = products.filter(p=>p.cat===c.id).length;
                  return (
                    <button key={c.id} className="bx-cat" onClick={()=>goCatalog(c.id)}>
                      <ProductArt variant={c.art} accent={C.cobalt} size={92}/>
                      <h3>{L(c)}</h3><span>{n} {t.products.toLowerCase()}</span>
                    </button>
                  );
                })}
              </div>
              <button className="bx-cats-arrow next" onClick={()=>scrollCats(1)} aria-label="▶"><ChevronRight size={20}/></button>
            </div>
          </div></section>

          <section className="bx-section" style={{paddingTop:0}}><div className="bx-wrap">
            <div className="bx-sec-h"><h2>{t.featured}</h2>
              <button className="bx-btn bx-ghost" onClick={()=>goCatalog("all")}>{t.catalog}<ChevronRight size={15}/></button>
            </div>
            <div className="bx-grid">
              {featured.map(p=>(
                <ProductCard key={p.id} {...{p,t,L,lang,catName,onOpen:setActiveProduct,onAdd:addToCart,onBuy:buyNow}}/>
              ))}
            </div>
          </div></section>
        </>
      )}

      {page==="catalog" && (
        <section className="bx-section"><div className="bx-wrap">
          <div className="bx-sec-h"><h2>{t.catalog}</h2></div>
          <div className="bx-filters">
            <button className={catFilter==="all"?"on":""} onClick={()=>setCatFilter("all")}>{t.all}</button>
            {cats.map(c=>(
              <button key={c.id} className={catFilter===c.id?"on":""} onClick={()=>setCatFilter(c.id)}>{L(c)}</button>
            ))}
          </div>
          <div className="bx-grid">
            {list.map(p=>(
              <ProductCard key={p.id} {...{p,t,L,lang,catName,onOpen:setActiveProduct,onAdd:addToCart,onBuy:buyNow}}/>
            ))}
          </div>
          {list.length===0 && <p style={{color:C.muted,marginTop:20}}>—</p>}
        </div></section>
      )}

      <footer className="bx-foot">
        <div className="bx-wrap">
          <Logo variant="dark"/>
          <span style={{fontSize:13}}>{t.payNote}</span>
        </div>
      </footer>

      {activeProduct && (
        <ProductModal {...{p:activeProduct,t,L,lang,catName,onClose:()=>setActiveProduct(null),onAdd:addToCart,onBuy:buyNow}}/>
      )}

      {cartOpen && (
        <div className="bx-overlay" onClick={()=>setCartOpen(false)}>
          <div className="bx-drawer" onClick={e=>e.stopPropagation()}>
            <div className="bx-dh"><h3>{t.cart}</h3><button className="bx-x" onClick={()=>setCartOpen(false)}><X size={18}/></button></div>
            <div style={{flex:1,overflow:"auto",padding:"0 18px"}}>
              {cartItems.length===0 ? (
                <div style={{textAlign:"center",padding:"60px 0",color:C.muted}}>
                  <ShoppingCart size={40} style={{opacity:.3}}/><p style={{marginTop:12}}>{t.emptyCart}</p>
                </div>
              ) : cartItems.map(i=>(
                <div className="bx-citem" key={i.productId}>
                  <div className="ci-art" style={{width:64,height:64}}><ProductArt variant={catArt(i.p.cat)} size={56}/></div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14}}>{L(i.p)}</div>
                    <div className="mono" style={{fontSize:13,color:C.muted,margin:"2px 0 8px"}}>{fmt(i.p.price,lang)}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div className="bx-qty">
                        <button onClick={()=>setQty(i.productId,i.qty-1)}><Minus size={14}/></button>
                        <span>{i.qty}</span>
                        <button onClick={()=>setQty(i.productId,i.qty+1)}><Plus size={14}/></button>
                      </div>
                      <button className="bx-iconbtn" onClick={()=>setQty(i.productId,0)}><Trash2 size={15}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {cartItems.length>0 && (
              <div style={{padding:18,borderTop:`1px solid ${C.line}`}}>
                <div className="bx-sumrow tot"><span>{t.subtotal}</span><span className="mono">{fmt(subtotal,lang)}</span></div>
                <button className="bx-btn bx-amber" style={{width:"100%",marginTop:12}} onClick={()=>{setCartOpen(false);setCheckout(true);}}>{t.checkout}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {checkout && (
        <Checkout {...{t,lang,subtotal,fees,onClose:()=>setCheckout(false),onSubmit:placeOrder}}/>
      )}

      {confirmation && (
        <div className="bx-overlay">
          <div className="bx-modal sm">
            <div style={{padding:"32px 28px",textAlign:"center"}}>
              <div style={{width:64,height:64,borderRadius:"50%",background:C.green+"1a",display:"grid",placeItems:"center",margin:"0 auto 16px"}}>
                <CheckCircle size={36} color={C.green}/>
              </div>
              <h3 style={{fontSize:21,marginBottom:8}}>{t.orderOk}</h3>
              <p style={{color:C.muted,fontSize:14,marginBottom:14}}>{t.callConfirm}</p>
              <div className="bx-card" style={{padding:14,textAlign:"start",marginBottom:16}}>
                <div className="bx-sumrow"><span>{t.orderNo}</span><span className="mono" style={{fontWeight:800}}>{confirmation.order.no}</span></div>
                <div className="bx-sumrow"><span>{t.wilaya}</span><span>{confirmation.wilayaName}</span></div>
                <div className="bx-sumrow tot"><span>{t.total}</span><span className="mono">{fmt(confirmation.order.total,lang)}</span></div>
              </div>
              <div className="bx-row-gap" style={{justifyContent:"center",flexWrap:"wrap"}}>
                <a className="bx-btn bx-cobalt" href={waLink(waNumber, `${t.orderNo}: ${confirmation.order.no}`)} target="_blank" rel="noreferrer"><MessageCircle size={16}/>{t.contactWa}</a>
                <button className="bx-btn bx-ghost" onClick={()=>setConfirmation(null)}>{t.continue}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function ProductCard({ p, t, L, lang, catName, onOpen, onAdd, onBuy }) {
  const out = p.stock<=0;
  return (
    <div className="bx-prod">
      <div className="bx-prod-img" onClick={()=>onOpen(p)}>
        {p.was && !out && <span className="bx-tag">-{Math.round((1-p.price/p.was)*100)}%</span>}
        {out && <span className="bx-tag out">{t.outOfStock}</span>}
        <ProductVisual p={p} size={190}/>
      </div>
      <div className="bx-prod-body">
        <span className="bx-prod-cat">{catName(p.cat)}</span>
        <span className="bx-prod-name" onClick={()=>onOpen(p)}>{L(p)}</span>
        <span className="bx-prod-bm">{p.brand} · {p.model}</span>
        {p.drop && (
          <div className="bx-prod-meta">
            <span className="bx-spec"><Shield size={12} color={C.cobalt}/><span className="mono">{p.drop} m</span></span>
          </div>
        )}
        <div className="bx-price">
          <span className="now mono">{fmt(p.price,lang)}</span>
          {p.was && <span className="was mono">{fmt(p.was,lang)}</span>}
        </div>
        <div style={{display:"flex",gap:8,marginTop:4}}>
          <button
            className="bx-btn"
            style={{background:"transparent",color:"var(--orange,#FF6600)",border:"1.5px solid var(--orange,#FF6600)",padding:"0 14px"}}
            disabled={out}
            onClick={()=>onAdd(p)}
            aria-label={t.addToCart}
            title={t.addToCart}
          >
            <ShoppingCart size={16}/>
          </button>
          <button className="bx-btn bx-amber" style={{flex:1}} disabled={out} onClick={()=>onBuy(p)}>
            {out?t.outOfStock:t.buyNow}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ p, t, L, lang, catName, onClose, onAdd, onBuy }) {
  const [qty,setQty] = useState(1); const out = p.stock<=0;
  return (
    <div className="bx-overlay" onClick={onClose}>
      <div className="bx-modal" onClick={e=>e.stopPropagation()}>
        <div className="bx-dh"><h3>{L(p)}</h3><button className="bx-x" onClick={onClose}><X size={18}/></button></div>
        <div className="bx-prodmodal">
          <div style={{background:C.mist,display:"grid",placeItems:"center",padding:24,minHeight:240}}>
            <ProductVisual p={p} size={200} radius={16}/>
          </div>
          <div style={{padding:20}}>
            <span className="bx-prod-cat">{catName(p.cat)}</span>
            <div className="bx-prod-bm" style={{marginTop:4}}>{p.brand} · {p.model}</div>
            <div className="bx-price" style={{margin:"8px 0 12px"}}>
              <span className="now mono" style={{fontSize:24}}>{fmt(p.price,lang)}</span>
              {p.was && <span className="was mono">{fmt(p.was,lang)}</span>}
            </div>
            <p style={{fontSize:14,color:C.inkSoft,marginBottom:14}}>{L({fr:p.dFr,en:p.dEn,ar:p.dAr})}</p>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
              <span className="bx-spec mono">SKU {p.sku}</span>
              {p.drop && <span className="bx-spec"><Shield size={12} color={C.cobalt}/>{t.dropTest} <span className="mono">{p.drop} m</span></span>}
              <span className="bx-spec" style={{color:out?C.red:C.green}}>{out?t.outOfStock:`${t.inStock} (${p.stock})`}</span>
            </div>
            {!out && (
              <div className="bx-row-gap" style={{marginBottom:12}}>
                <div className="bx-qty">
                  <button onClick={()=>setQty(Math.max(1,qty-1))}><Minus size={14}/></button>
                  <span>{qty}</span>
                  <button onClick={()=>setQty(Math.min(p.stock,qty+1))}><Plus size={14}/></button>
                </div>
              </div>
            )}
            <div style={{display:"flex",gap:10}}>
              <button className="bx-btn" style={{flex:1,background:"transparent",color:"var(--orange,#FF6600)",border:"1.5px solid var(--orange,#FF6600)"}} disabled={out} onClick={()=>onAdd(p,qty)}>
                <ShoppingCart size={16}/>{out?t.outOfStock:t.addToCart}
              </button>
              <button className="bx-btn bx-amber" style={{flex:1}} disabled={out} onClick={()=>onBuy(p,qty)}>
                {out?t.outOfStock:t.buyNow}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Checkout({ t, lang, subtotal, fees, onClose, onSubmit }) {
  const [f, setF] = useState({ name:"", phone:"", wilaya:"", commune:"", address:"", deliveryType:"home", note:"" });
  const [err, setErr] = useState({});
  const set = (k,v)=>setF(p=>({...p,[k]:v}));
  const delivery = f.wilaya ? (fees[f.wilaya]?.[f.deliveryType==="home"?"home":"desk"] ?? 0) : 0;
  const total = subtotal + delivery;

  const submit = () => {
    const e = {};
    if(!f.name.trim()) e.name=t.reqName;
    if(!/^0?[567]\d{8}$/.test(f.phone.replace(/\s/g,""))) e.phone=t.reqPhone;
    if(!f.wilaya) e.wilaya=t.reqWilaya;
    if(!f.commune.trim()) e.commune=t.reqCommune;
    if(!f.address.trim()) e.address=t.reqAddress;
    setErr(e);
    if(Object.keys(e).length===0) onSubmit(f);
  };

  return (
    <div className="bx-overlay" onClick={onClose}>
      <div className="bx-modal" onClick={e=>e.stopPropagation()}>
        <div className="bx-dh"><h3>{t.checkout}</h3><button className="bx-x" onClick={onClose}><X size={18}/></button></div>
        <div style={{padding:20}}>
          <h3 style={{fontSize:15,marginBottom:12}}>{t.yourInfo}</h3>
          <div className="bx-form-grid">
            <div><label className="bx-label">{t.fullName}</label>
              <input className="bx-input" value={f.name} onChange={e=>set("name",e.target.value)}/>
              {err.name && <div className="bx-err">{err.name}</div>}</div>
            <div><label className="bx-label">{t.phone}</label>
              <input className="bx-input" value={f.phone} placeholder="0X XX XX XX XX" onChange={e=>set("phone",e.target.value)}/>
              {err.phone && <div className="bx-err">{err.phone}</div>}</div>
            <div><label className="bx-label">{t.wilaya}</label>
              <select className="bx-select" value={f.wilaya} onChange={e=>set("wilaya",e.target.value)}>
                <option value="">{t.chooseWilaya}</option>
                {WILAYAS.map(w=>(
                  <option key={w.code} value={w.code}>{String(w.code).padStart(2,"0")} — {lang==="ar"?w.ar:w.name}</option>
                ))}
              </select>
              {err.wilaya && <div className="bx-err">{err.wilaya}</div>}</div>
            <div><label className="bx-label">{t.commune}</label>
              <input className="bx-input" value={f.commune} onChange={e=>set("commune",e.target.value)}/>
              {err.commune && <div className="bx-err">{err.commune}</div>}</div>
          </div>
          <div style={{marginTop:12}}><label className="bx-label">{t.address}</label>
            <input className="bx-input" value={f.address} onChange={e=>set("address",e.target.value)}/>
            {err.address && <div className="bx-err">{err.address}</div>}</div>

          <label className="bx-label" style={{marginTop:14}}>{t.deliveryType}</label>
          <div className="bx-radio">
            {["home","desk"].map(dt=>(
              <label key={dt} className={f.deliveryType===dt?"on":""} onClick={()=>set("deliveryType",dt)}>
                {dt==="home"?t.homeDeliv:t.desk}
                <small className="mono">{f.wilaya ? fmt(fees[f.wilaya]?.[dt==="home"?"home":"desk"]??0, lang) : "—"}</small>
              </label>
            ))}
          </div>

          <div style={{marginTop:14}}><label className="bx-label">{t.note}</label>
            <textarea className="bx-area" rows={2} value={f.note} onChange={e=>set("note",e.target.value)}/></div>

          <div className="bx-card" style={{padding:14,marginTop:16}}>
            <div className="bx-sumrow"><span>{t.subtotal}</span><span className="mono">{fmt(subtotal,lang)}</span></div>
            <div className="bx-sumrow"><span>{t.delivery}</span><span className="mono">{f.wilaya?fmt(delivery,lang):"—"}</span></div>
            <div className="bx-sumrow tot"><span>{t.total}</span><span className="mono">{fmt(total,lang)}</span></div>
          </div>
          <p style={{fontSize:12.5,color:C.muted,margin:"10px 0 14px",display:"flex",gap:6,alignItems:"center"}}><Truck size={15} color={C.cobalt}/>{t.payNote}</p>
          <button className="bx-btn bx-amber" style={{width:"100%"}} onClick={submit}>{t.placeOrder}</button>
        </div>
      </div>
    </div>
  );
}

export { Shop };
