import React, { useState, useEffect } from "react";
import { CSS, T, WILAYAS, ZONE_FEE, SEED_CATS, SEED_PRODUCTS, api, isSupabaseConfigured } from "@shared";
import { Shop } from "./Shop.jsx";

// TODO: numéro WhatsApp réel (paramétrable depuis l'admin/DB à terme).
const WA_NUMBER = "213555123456";

export default function App() {
  const [lang, setLang] = useState("fr");
  const t = T[lang];
  const rtl = lang === "ar";

  const [cats, setCats] = useState(SEED_CATS);
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [fees, setFees] = useState(() => {
    const m = {}; WILAYAS.forEach(w => m[w.code] = { ...ZONE_FEE[w.zone] }); return m;
  });

  // Catalogue actif + grille de frais depuis Supabase (lecture publique).
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    (async () => {
      try {
        const cat = await api.fetchCatalog();
        if (active && cat) { setCats(cat.cats); setProducts(cat.products); }
        const f = await api.fetchWilayaFees();
        if (active && f && Object.keys(f).length) setFees(f);
      } catch (e) { console.warn("[data] catalogue:", e.message); }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="bx" dir={rtl ? "rtl" : "ltr"}>
      <style>{CSS}</style>
      <Shop {...{ t, lang, setLang, rtl, cats, products, fees, setOrders: () => {}, waNumber: WA_NUMBER }} />
    </div>
  );
}
