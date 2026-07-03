// =====================================================================
//  Edge Function : notify-order
//  Notifie l'équipe sur WhatsApp à CHAQUE nouvelle commande, automatiquement.
//
//  Déclenchée par un Database Webhook Supabase sur INSERT dans `orders`
//  (voir docs/whatsapp-setup.md). Envoie un message via l'API officielle
//  WhatsApp Business Cloud (Meta).
//
//  Sécurité : la fonction est publique (verify_jwt = false, car un webhook DB
//  n'envoie pas de JWT utilisateur) → elle exige un secret partagé dans
//  l'en-tête `x-webhook-secret` (ORDER_WEBHOOK_SECRET).
//
//  Secrets requis (supabase secrets set …) :
//    ORDER_WEBHOOK_SECRET, WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_TEAM_TO
//
//  ⚠️ Message "texte" : n'aboutit que si l'équipe a écrit au numéro business
//  dans les dernières 24 h. Pour une notification business-initiée hors fenêtre,
//  utiliser un TEMPLATE approuvé (voir docs/whatsapp-setup.md).
// =====================================================================

const GRAPH_VERSION = "v21.0";

function fmtDZD(n: unknown): string {
  const v = Number(n) || 0;
  return `${v.toLocaleString("fr-FR")} DA`;
}

async function sendWhatsAppText(to: string, body: string) {
  const token = Deno.env.get("WHATSAPP_TOKEN");
  const phoneId = Deno.env.get("WHATSAPP_PHONE_ID");
  if (!token || !phoneId) {
    throw new Error("WHATSAPP_TOKEN / WHATSAPP_PHONE_ID non configurés");
  }
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`WhatsApp API ${res.status}: ${JSON.stringify(json)}`);
  }
  return json;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    // 1) Vérifier le secret partagé (le webhook doit envoyer cet en-tête).
    const expected = Deno.env.get("ORDER_WEBHOOK_SECRET");
    if (!expected || req.headers.get("x-webhook-secret") !== expected) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // 2) Lire la ligne insérée (payload standard d'un webhook Supabase).
    const payload = await req.json().catch(() => null);
    const o = payload?.record;
    if (!o) {
      return new Response(JSON.stringify({ error: "Aucun record dans le payload" }), { status: 400 });
    }

    const to = Deno.env.get("WHATSAPP_TEAM_TO");
    if (!to) {
      return new Response(JSON.stringify({ error: "WHATSAPP_TEAM_TO non configuré" }), { status: 500 });
    }

    // 3) Composer et envoyer le message.
    const deliv = o.delivery_type === "home" ? "Domicile" : "Stop-desk";
    const lines = [
      `🛒 Nouvelle commande ${o.order_no ?? ""}`.trim(),
      `👤 ${o.customer_name} — ${o.phone}`,
      `📍 Wilaya ${o.wilaya_code}, ${o.commune} (${deliv})`,
      `🏠 ${o.address}`,
      `💰 Total : ${fmtDZD(o.total)} (dont livraison ${fmtDZD(o.delivery_fee)})`,
      o.note ? `📝 ${o.note}` : null,
    ].filter(Boolean);

    await sendWhatsAppText(to, lines.join("\n"));

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-order:", e);
    // On renvoie 200 pour éviter que le webhook ne réessaie en boucle sur une
    // erreur non transitoire ; l'échec est journalisé (Dashboard → Functions → Logs).
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
