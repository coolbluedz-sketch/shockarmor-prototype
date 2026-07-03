# Notification WhatsApp automatique des commandes

À chaque nouvelle commande (`INSERT` dans `orders`), l'équipe reçoit un message
WhatsApp automatiquement — via un **Database Webhook Supabase** qui appelle
l'Edge Function [`notify-order`](../supabase/functions/notify-order/index.ts),
laquelle envoie le message avec l'**API WhatsApp Business Cloud (Meta)**.

> En attendant la configuration ci-dessous, le **lien `wa.me` manuel** (bouton
> de la confirmation de commande + bloc d'alertes du dashboard admin) reste
> fonctionnel. Cette fonction ajoute l'**automatisation**.

## 1. Créer l'accès WhatsApp Cloud API (Meta)

1. [Meta for Developers](https://developers.facebook.com/) → créer une **App** de type *Business*.
2. Ajouter le produit **WhatsApp**. Meta fournit un **numéro de test** + un
   **Phone number ID** et un **token temporaire**.
3. Pour la prod : ajouter un vrai numéro dédié et générer un **token permanent**
   (via un *System User* Business). Récupérer :
   - **`WHATSAPP_TOKEN`** — le token d'accès.
   - **`WHATSAPP_PHONE_ID`** — le *Phone number ID* (pas le numéro affiché).
   - **`WHATSAPP_TEAM_TO`** — le numéro de l'équipe qui reçoit l'alerte
     (format international **sans `+`**, ex. `2135XXXXXXXX`).

## 2. Définir les secrets de la fonction

```bash
npx supabase secrets set ORDER_WEBHOOK_SECRET=un-secret-long-et-aleatoire
npx supabase secrets set WHATSAPP_TOKEN=xxxxx
npx supabase secrets set WHATSAPP_PHONE_ID=xxxxx
npx supabase secrets set WHATSAPP_TEAM_TO=2135XXXXXXXX
```

## 3. Déployer la fonction

```bash
npx supabase functions deploy notify-order
```
`verify_jwt = false` est épinglé dans [`supabase/config.toml`](../supabase/config.toml)
(un webhook DB n'envoie pas de JWT utilisateur). La fonction est protégée par le
secret `ORDER_WEBHOOK_SECRET` qu'elle exige dans l'en-tête `x-webhook-secret`.

## 4. Créer le Database Webhook

Dashboard → **Database → Webhooks → Create a new hook** :
- **Table** : `orders` — **Events** : `INSERT`.
- **Type** : *HTTP Request* → `POST`
  `https://TON_REF.supabase.co/functions/v1/notify-order`
- **HTTP Headers** : ajouter
  - `x-webhook-secret` = la valeur d'`ORDER_WEBHOOK_SECRET`
  - `Content-Type` = `application/json`

Le webhook envoie un payload `{ type, table, record, old_record, schema }` ;
la fonction lit `record` (la commande insérée).

## 5. Tester

Passer une commande depuis la boutique → l'équipe doit recevoir le message.
Logs en cas d'échec : Dashboard → **Edge Functions → notify-order → Logs**.

## ⚠️ Fenêtre des 24 h / templates

Un **message texte** business n'aboutit que si le destinataire a écrit au numéro
business dans les **dernières 24 h**. Pour une notification **business-initiée**
hors de cette fenêtre, WhatsApp impose un **template approuvé**. Pour basculer :
créer un template (Meta → WhatsApp Manager), puis remplacer, dans
`notify-order/index.ts`, l'appel `type: "text"` par :

```jsonc
{
  "messaging_product": "whatsapp",
  "to": "…",
  "type": "template",
  "template": {
    "name": "nom_du_template",
    "language": { "code": "fr" },
    "components": [ /* paramètres du template */ ]
  }
}
```

## Alternative (option b) — service tiers

Plutôt que Meta directement, on peut passer par **Twilio** ou **360dialog**
(mise en place plus simple, payant). Il suffit de remplacer `sendWhatsAppText`
par l'appel de leur API — le reste (webhook, secret, payload) est identique.
