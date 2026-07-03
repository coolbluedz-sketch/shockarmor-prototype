// Conversions entre le format DB (Supabase, snake_case) et le format proto
// utilisé dans App.jsx (fr/en/ar, cat, was, drop, hot...).

/* ---------- Catégories (gammes) ---------- */
export const catFromDb = (r) => ({
  id: r.id, art: r.art, fr: r.name_fr, en: r.name_en, ar: r.name_ar, active: r.active,
});
export const catToDb = (c) => ({
  name_fr: c.fr, name_en: c.en, name_ar: c.ar, art: c.art || "case", active: c.active ?? true,
});

/* ---------- Produits ---------- */
// Normalise le champ images quelle que soit la forme réellement stockée :
//  - objet {url, publicId} (colonne jsonb, cas nominal)
//  - chaîne JSON '{"url":...}' (si la colonne est restée en text[] sans migration 01)
//  - URL nue "https://..." (ancien format d'URLs simples)
// Ne garde que les entrées ayant une url exploitable.
export const normImages = (raw) => {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((it) => {
      if (it && typeof it === "object") return it;
      if (typeof it === "string") {
        const s = it.trim();
        if (s.startsWith("{")) { try { return JSON.parse(s); } catch { return null; } }
        return s ? { url: s } : null;
      }
      return null;
    })
    .filter((x) => x && x.url);
};

export const productFromDb = (r) => ({
  id: r.id,
  cat: r.category_id,
  sku: r.sku || "",
  brand: r.brand || "",
  model: r.model || "",
  fr: r.name_fr, en: r.name_en, ar: r.name_ar,
  dFr: r.desc_fr || "", dEn: r.desc_en || "", dAr: r.desc_ar || "",
  price: r.price,
  was: r.compare_price,
  stock: r.stock,
  drop: r.drop_test,
  hot: !!r.featured,
  active: r.active,
  images: normImages(r.images),
});
export const productToDb = (p) => ({
  category_id: p.cat || null,
  sku: p.sku || null,
  brand: p.brand || null,
  model: p.model || null,
  name_fr: p.fr, name_en: p.en, name_ar: p.ar,
  desc_fr: p.dFr || null, desc_en: p.dEn || null, desc_ar: p.dAr || null,
  price: Number(p.price) || 0,
  compare_price: p.was ?? null,
  stock: Number(p.stock) || 0,
  drop_test: p.drop ?? null,
  featured: !!p.hot,
  active: p.active ?? true,
  images: Array.isArray(p.images) ? p.images : [],
});

/* ---------- Commandes ---------- */
export const orderFromDb = (r) => ({
  id: r.id,
  no: r.order_no,
  name: r.customer_name,
  phone: r.phone,
  wilaya: r.wilaya_code,
  commune: r.commune,
  address: r.address,
  deliveryType: r.delivery_type,
  note: r.note || "",
  subtotal: r.subtotal,
  delivery: r.delivery_fee,
  total: r.total,
  status: r.status,
  createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  items: (r.order_items || []).map((it) => ({
    productId: it.product_id, name: it.name, price: it.price, qty: it.qty,
  })),
});
export const orderToDb = (o) => ({
  customer_name: o.name,
  phone: o.phone,
  wilaya_code: o.wilaya,
  commune: o.commune,
  address: o.address,
  delivery_type: o.deliveryType,
  note: o.note || null,
  subtotal: o.subtotal,
  delivery_fee: o.delivery,
  total: o.total,
  status: "new",
});
