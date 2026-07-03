import React, { useState, useEffect } from "react";
import { CSS, T, WILAYAS, ZONE_FEE, SEED_CATS, SEED_PRODUCTS, SEED_ORDERS, api, supabase, isSupabaseConfigured } from "@shared";
import { Admin } from "./Admin.jsx";

export default function App() {
  const [lang, setLang] = useState("fr");
  const t = T[lang];
  const rtl = lang === "ar";

  const [cats, setCats] = useState(SEED_CATS);
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [fees, setFees] = useState(() => {
    const m = {}; WILAYAS.forEach(w => m[w.code] = { ...ZONE_FEE[w.zone] }); return m;
  });
  const [waNumber, setWaNumber] = useState("213555123456");

  // Chargement depuis Supabase (si configuré) ; sinon seeds en mémoire.
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const loadCatalog = async () => {
      try {
        const cat = await api.fetchCatalog();
        if (active && cat) { setCats(cat.cats); setProducts(cat.products); }
        const f = await api.fetchWilayaFees();
        if (active && f && Object.keys(f).length) setFees(f);
      } catch (e) { console.warn("[data] catalogue/livraison:", e.message); }
    };
    const loadOrders = async () => {
      try {
        const o = await api.fetchOrders();
        if (active && o) setOrders(o);
      } catch (e) { console.warn("[data] commandes:", e.message); }
    };
    loadCatalog();
    loadOrders();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") { loadCatalog(); loadOrders(); }
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return (
    <div className="bx" dir={rtl ? "rtl" : "ltr"}>
      <style>{CSS}</style>
      <div className="bx-topbar">
        <div className="bx-wrap">
          <div className="bx-lang">
            {["fr","en","ar"].map(l => (
              <button key={l} className={lang===l?"on":""} onClick={()=>setLang(l)}>{l.toUpperCase()}</button>
            ))}
          </div>
        </div>
      </div>
      <Admin {...{ t, lang, rtl, cats, setCats, products, setProducts, orders, setOrders, fees, setFees, waNumber, setWaNumber }} />
    </div>
  );
}
