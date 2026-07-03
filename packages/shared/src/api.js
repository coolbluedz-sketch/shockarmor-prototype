// =====================================================================
//  Couche d'accès aux données (Supabase) — catalogue, commandes, livraison.
//
//  - Les fonctions de LECTURE renvoient `null` si Supabase n'est pas
//    configuré → l'appelant garde ses données de démo en mémoire.
//  - Les fonctions d'ÉCRITURE supposent Supabase configuré (l'appelant
//    vérifie `isSupabaseConfigured` et fait sinon une mise à jour locale).
//  - RLS : le catalogue actif + l'insertion de commandes sont publics ;
//    la lecture des commandes et toutes les écritures admin exigent une
//    session admin authentifiée.
// =====================================================================
import { supabase, isSupabaseConfigured } from "./supabaseClient";
import * as M from "./mappers";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

// Supprime un asset Cloudinary via signature serveur (Edge Function cloudinary-sign).
export async function deleteCloudinaryImage(publicId) {
  if (!CLOUD_NAME || !publicId) return;
  const { data, error } = await supabase.functions.invoke("cloudinary-sign", {
    body: { mode: "delete", publicId },
  });
  if (error) throw new Error(error.message || "Signature de suppression Cloudinary échouée.");
  if (data?.error) throw new Error(data.error);
  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", data.apiKey);
  form.append("timestamp", String(data.timestamp));
  form.append("signature", data.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
    method: "POST",
    body: form,
  });
  const body = await res.json().catch(() => null);
  if (body?.result !== "ok" && body?.result !== "not found") {
    throw new Error(body?.error?.message || `Suppression Cloudinary échouée (${body?.result ?? res.status}).`);
  }
  return body;
}

/* ------------------------------- LECTURES ------------------------------- */

export async function fetchCatalog() {
  if (!isSupabaseConfigured) return null;
  const [cats, prods] = await Promise.all([
    supabase.from("categories").select("*").order("created_at", { ascending: true }),
    supabase.from("products").select("*").order("created_at", { ascending: false }),
  ]);
  if (cats.error) throw cats.error;
  if (prods.error) throw prods.error;
  return {
    cats: cats.data.map(M.catFromDb),
    products: prods.data.map(M.productFromDb),
  };
}

export async function fetchWilayaFees() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from("wilayas").select("code, fee_home, fee_desk");
  if (error) throw error;
  const fees = {};
  for (const w of data) fees[w.code] = { home: w.fee_home, desk: w.fee_desk };
  return fees;
}

// Commandes : lisibles uniquement par un admin authentifié (RLS).
// Pour le public (anon), la requête renvoie 0 ligne → [].
export async function fetchOrders() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data.map(M.orderFromDb);
}

/* ------------------------------- ÉCRITURES ------------------------------ */

// Création de commande (checkout public). On génère l'id + order_no côté
// client : l'anon ne peut pas relire la ligne insérée (RLS), donc on ne
// dépend pas d'un RETURNING. (Un RPC `place_order` SECURITY DEFINER serait
// plus robuste — n° séquentiel serveur, total recalculé — cf. CLAUDE.md.)
export async function createOrder(o) {
  const id = crypto.randomUUID();
  const row = { ...M.orderToDb(o), id, order_no: o.no };
  const { error } = await supabase.from("orders").insert(row);
  if (error) throw error;
  const items = o.items.map((it) => ({
    order_id: id, product_id: it.productId, name: it.name, price: it.price, qty: it.qty,
  }));
  const { error: e2 } = await supabase.from("order_items").insert(items);
  if (e2) throw e2;
  return { ...o, id };
}

export async function saveProduct(p) {
  const row = M.productToDb(p);
  const q = p.id
    ? supabase.from("products").update(row).eq("id", p.id)
    : supabase.from("products").insert(row);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return M.productFromDb(data);
}

// Accepte soit un id, soit l'objet produit complet (pour nettoyer ses images).
export async function deleteProduct(product) {
  const id = typeof product === "string" ? product : product?.id;
  const images = (product && typeof product === "object" && product.images) || [];
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
  // Nettoyage best-effort des images Cloudinary (n'échoue pas la suppression du produit).
  for (const img of images) {
    if (img?.publicId) {
      try { await deleteCloudinaryImage(img.publicId); }
      catch (e) { console.warn("[cloudinary] suppression image échouée:", img.publicId, e.message); }
    }
  }
}

export async function saveCategory(c) {
  const row = M.catToDb(c);
  const q = c.id
    ? supabase.from("categories").update(row).eq("id", c.id)
    : supabase.from("categories").insert(row);
  const { data, error } = await q.select().single();
  if (error) throw error;
  return M.catFromDb(data);
}

export async function deleteCategory(id) {
  // products.category_id est ON DELETE SET NULL : les produits liés perdent leur gamme.
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

// new -> confirmed : RPC atomique qui décrémente le stock ET passe le statut.
export async function confirmOrder(id) {
  const { error } = await supabase.rpc("confirm_order", { p_order_id: id });
  if (error) throw error;
}

export async function setOrderStatus(id, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function setWilayaFee(code, { home, desk }) {
  const { error } = await supabase
    .from("wilayas")
    .update({ fee_home: Number(home) || 0, fee_desk: Number(desk) || 0 })
    .eq("code", code);
  if (error) throw error;
}
