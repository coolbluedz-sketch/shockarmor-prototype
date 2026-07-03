import React, { useState, useEffect } from "react";
import { Globe } from "lucide-react";

const C = {
  ink: "#0F2233", inkSoft: "#1E3950", paper: "#FFFFFF", bg: "#F6F9FC", mist: "#EFF7FE",
  line: "#E5EDF4", cobalt: "#0090E3", cobaltDk: "#0077C2", amber: "#FF6600",
  amberDk: "#E65C00", green: "#14B86A", red: "#F0453A", muted: "#637588",
};

/* ---------- Wilayas (58) + zones ---------- */
const ZONE_FEE = {
  Centre:  { home: 400, desk: 250 }, Est: { home: 600, desk: 350 }, Ouest: { home: 600, desk: 350 },
  Hauts:   { home: 700, desk: 400 }, Sud: { home: 900, desk: 500 }, GrandSud:{ home: 1200, desk: 700 },
};
const WILAYAS = [
  [1,"Adrar","أدرار","GrandSud"],[2,"Chlef","الشلف","Ouest"],[3,"Laghouat","الأغواط","Sud"],
  [4,"Oum El Bouaghi","أم البواقي","Hauts"],[5,"Batna","باتنة","Hauts"],[6,"Béjaïa","بجاية","Centre"],
  [7,"Biskra","بسكرة","Sud"],[8,"Béchar","بشار","GrandSud"],[9,"Blida","البليدة","Centre"],
  [10,"Bouira","البويرة","Centre"],[11,"Tamanrasset","تمنراست","GrandSud"],[12,"Tébessa","تبسة","Est"],
  [13,"Tlemcen","تلمسان","Ouest"],[14,"Tiaret","تيارت","Hauts"],[15,"Tizi Ouzou","تيزي وزو","Centre"],
  [16,"Alger","الجزائر","Centre"],[17,"Djelfa","الجلفة","Sud"],[18,"Jijel","جيجل","Est"],
  [19,"Sétif","سطيف","Hauts"],[20,"Saïda","سعيدة","Ouest"],[21,"Skikda","سكيكدة","Est"],
  [22,"Sidi Bel Abbès","سيدي بلعباس","Ouest"],[23,"Annaba","عنابة","Est"],[24,"Guelma","قالمة","Est"],
  [25,"Constantine","قسنطينة","Est"],[26,"Médéa","المدية","Centre"],[27,"Mostaganem","مستغانم","Ouest"],
  [28,"M'Sila","المسيلة","Hauts"],[29,"Mascara","معسكر","Ouest"],[30,"Ouargla","ورقلة","Sud"],
  [31,"Oran","وهران","Ouest"],[32,"El Bayadh","البيض","Sud"],[33,"Illizi","إليزي","GrandSud"],
  [34,"Bordj Bou Arréridj","برج بوعريريج","Hauts"],[35,"Boumerdès","بومرداس","Centre"],
  [36,"El Tarf","الطارف","Est"],[37,"Tindouf","تندوف","GrandSud"],[38,"Tissemsilt","تيسمسيلت","Hauts"],
  [39,"El Oued","الوادي","Sud"],[40,"Khenchela","خنشلة","Hauts"],[41,"Souk Ahras","سوق أهراس","Est"],
  [42,"Tipaza","تيبازة","Centre"],[43,"Mila","ميلة","Est"],[44,"Aïn Defla","عين الدفلى","Centre"],
  [45,"Naâma","النعامة","Sud"],[46,"Aïn Témouchent","عين تموشنت","Ouest"],[47,"Ghardaïa","غرداية","Sud"],
  [48,"Relizane","غليزان","Ouest"],[49,"El M'Ghair","المغير","Sud"],[50,"El Meniaa","المنيعة","GrandSud"],
  [51,"Ouled Djellal","أولاد جلال","Sud"],[52,"Bordj Badji Mokhtar","برج باجي مختار","GrandSud"],
  [53,"Béni Abbès","بني عباس","GrandSud"],[54,"Timimoun","تيميمون","GrandSud"],[55,"Touggourt","تقرت","Sud"],
  [56,"Djanet","جانت","GrandSud"],[57,"In Salah","عين صالح","GrandSud"],[58,"In Guezzam","عين قزام","GrandSud"],
].map(([code,name,ar,zone]) => ({ code, name, ar, zone }));

/* ---------- Seed catégories ---------- */
const SEED_CATS = [
  { id:"c1", art:"case",   fr:"Coques antichoc",     en:"Shockproof cases",   ar:"أغطية مضادة للصدمات" },
  { id:"c2", art:"glass",  fr:"Protections d'écran", en:"Screen protectors",  ar:"حماية الشاشة" },
  { id:"c3", art:"bumper", fr:"Bumpers & coins",     en:"Bumpers & corners",  ar:"إطارات وزوايا" },
  { id:"c4", art:"sleeve", fr:"Housses & sacoches",  en:"Sleeves & pouches",  ar:"أغلفة وحقائب" },
];

/* ---------- Seed produits ---------- */
const SEED_PRODUCTS = [
  { id:"p1", cat:"c1", sku:"ARM-360", price:2200, was:2900, stock:24, drop:2.4, rating:4.8, hot:true, brand:"Armorix", model:"AX-360",
    fr:"Coque Armor 360", en:"Armor 360 case", ar:"غطاء أرمور 360",
    dFr:"Double couche TPU + polycarbonate, coins renforcés.", dEn:"Dual-layer TPU + polycarbonate, reinforced corners.", dAr:"طبقتان TPU وبولي كربونات، زوايا معززة." },
  { id:"p2", cat:"c1", sku:"DEF-RGD", price:3400, was:null, stock:12, drop:3.0, rating:4.9, hot:true, brand:"Defender", model:"DF-RGD",
    fr:"Coque Rugged Defender", en:"Rugged Defender case", ar:"غطاء ديفندر القوي",
    dFr:"Protection militaire, résiste aux chutes de 3 m.", dEn:"Military-grade, survives 3 m drops.", dAr:"حماية عسكرية، يتحمل السقوط من 3 أمتار." },
  { id:"p3", cat:"c1", sku:"SLM-SHK", price:1800, was:null, stock:40, drop:1.8, rating:4.5, hot:false, brand:"Armorix", model:"AX-Slim",
    fr:"Coque Slim Shock", en:"Slim Shock case", ar:"غطاء سليم شوك",
    dFr:"Fine et légère, absorbe les chocs du quotidien.", dEn:"Thin and light, absorbs everyday shocks.", dAr:"رقيق وخفيف، يمتص الصدمات اليومية." },
  { id:"p4", cat:"c2", sku:"GLS-9H", price:900, was:1200, stock:60, drop:null, rating:4.7, hot:true, brand:"GlassPro", model:"FG-9H",
    fr:"Verre trempé Full Glue 9H", en:"Full Glue 9H glass", ar:"زجاج مقوى فول غلو 9H",
    dFr:"Dureté 9H, adhésif total, anti-traces.", dEn:"9H hardness, full adhesive, smudge-resistant.", dAr:"صلابة 9H، لاصق كامل، مقاوم للبصمات." },
  { id:"p5", cat:"c2", sku:"GLS-PRV", price:1500, was:null, stock:18, drop:null, rating:4.6, hot:false, brand:"GlassPro", model:"PRV-Edge",
    fr:"Verre trempé Privacy", en:"Privacy glass", ar:"زجاج الخصوصية",
    dFr:"Filtre anti-espion, vision protégée de côté.", dEn:"Anti-spy filter, side view blocked.", dAr:"فلتر ضد التجسس، يحجب الرؤية الجانبية." },
  { id:"p6", cat:"c3", sku:"BMP-CRN", price:700, was:null, stock:35, drop:2.0, rating:4.3, hot:false, brand:"BumperX", model:"BX-Corner",
    fr:"Bumper Corner Guard", en:"Corner Guard bumper", ar:"واقي الزوايا",
    dFr:"Coins en silicone absorbants, ultra-discrets.", dEn:"Absorbing silicone corners, ultra-discreet.", dAr:"زوايا سيليكون ماصة، خفية جدًا." },
  { id:"p7", cat:"c3", sku:"BMP-CRB", price:1300, was:null, stock:9, drop:2.2, rating:4.6, hot:false, brand:"BumperX", model:"BX-Carbon",
    fr:"Bumper Carbon Edge", en:"Carbon Edge bumper", ar:"إطار كاربون إيدج",
    dFr:"Cadre fibre de carbone, rigide et léger.", dEn:"Carbon fiber frame, rigid and light.", dAr:"إطار ألياف كربون، صلب وخفيف." },
  { id:"p8", cat:"c4", sku:"SLV-NEO", price:2600, was:null, stock:7, drop:null, rating:4.4, hot:false, brand:"CarryFit", model:"CF-Neo10",
    fr:"Housse Néoprène Tablette", en:"Neoprene tablet sleeve", ar:"غلاف نيوبرين للوحي",
    dFr:"Rembourrage néoprène, fermeture zip renforcée.", dEn:"Neoprene padding, reinforced zip.", dAr:"حشوة نيوبرين، سحاب معزز." },
  { id:"p9", cat:"c1", sku:"MAG-ASK", price:3100, was:null, stock:0, drop:2.6, rating:4.8, hot:false, brand:"Armorix", model:"AX-Mag",
    fr:"Coque MagSafe Antichoc", en:"MagSafe Shock case", ar:"غطاء ماغ سايف مضاد للصدمات",
    dFr:"Compatible MagSafe, aimants intégrés.", dEn:"MagSafe compatible, built-in magnets.", dAr:"متوافق مع ماغ سايف، مغناطيس مدمج." },
];

/* ---------- Seed commandes ---------- */
const now = Date.now();
const SEED_ORDERS = [
  { id:"o1", no:"CMD-100231", name:"Yacine Hamadi", phone:"0661234567", wilaya:16, commune:"Bab Ezzouar",
    address:"Cité 1200 lgts, Bt 4", deliveryType:"home",
    items:[{productId:"p2",name:"Coque Rugged Defender",price:3400,qty:1},{productId:"p4",name:"Verre trempé Full Glue 9H",price:900,qty:1}],
    subtotal:4300, delivery:400, total:4700, status:"delivered", createdAt: now-86400000*4 },
  { id:"o2", no:"CMD-100245", name:"Sara Belkacem", phone:"0770112233", wilaya:31, commune:"Bir El Djir",
    address:"Rue des Frères Bouadou", deliveryType:"desk",
    items:[{productId:"p1",name:"Coque Armor 360",price:2200,qty:2}],
    subtotal:4400, delivery:350, total:4750, status:"shipped", createdAt: now-86400000*1 },
  { id:"o3", no:"CMD-100250", name:"Karim Ould", phone:"0555998877", wilaya:25, commune:"El Khroub",
    address:"Lotissement 20 Août, n°12", deliveryType:"home",
    items:[{productId:"p6",name:"Bumper Corner Guard",price:700,qty:1},{productId:"p3",name:"Coque Slim Shock",price:1800,qty:1}],
    subtotal:2500, delivery:600, total:3100, status:"new", createdAt: now-3600000*3 },
];

/* ---------- i18n ---------- */
const T = {
  fr:{ shop:"Boutique", admin:"Admin", home:"Accueil", catalog:"Catalogue", cart:"Panier",
    heroKicker:"Protection testée en conditions réelles", heroTitle:"Vos appareils encaissent les chocs. Pas vous.",
    heroSub:"Coques, verres trempés et bumpers anti-choc. Paiement à la livraison partout en Algérie.",
    shopNow:"Voir les produits", trustCod:"Paiement à la livraison", trustDelivery:"Livraison 58 wilayas",
    trustWarranty:"Garantie 6 mois", categories:"Nos gammes", featured:"Meilleures ventes", all:"Tout",
    addToCart:"Ajouter au panier", buyNow:"Acheter", outOfStock:"Rupture de stock", inStock:"En stock", dropTest:"Testé chute",
    qty:"Quantité", specs:"Caractéristiques", emptyCart:"Votre panier est vide", subtotal:"Sous-total",
    delivery:"Livraison", total:"Total", checkout:"Passer la commande", continue:"Continuer mes achats",
    yourInfo:"Vos informations", fullName:"Nom complet", phone:"Téléphone", wilaya:"Wilaya", commune:"Commune",
    address:"Adresse", deliveryType:"Type de livraison", homeDeliv:"À domicile", desk:"Stop-desk (bureau)",
    note:"Note (optionnel)", placeOrder:"Confirmer la commande", payNote:"Paiement à la livraison — aucun paiement en ligne.",
    chooseWilaya:"Choisir la wilaya", orderOk:"Commande confirmée !", orderNo:"N° de commande",
    callConfirm:"Nous vous appellerons pour confirmer votre commande.", contactWa:"Nous contacter sur WhatsApp",
    reqName:"Nom requis", reqPhone:"Téléphone invalide", reqWilaya:"Wilaya requise", reqCommune:"Commune requise",
    reqAddress:"Adresse requise", search:"Rechercher un produit...",
    login:"Connexion admin", email:"E-mail", password:"Mot de passe", signin:"Se connecter",
    demoHint:"Démo : n'importe quel e-mail / mot de passe.", signingIn:"Connexion…", authHint:"Connectez-vous avec votre compte admin Supabase.", dashboard:"Tableau de bord", products:"Produits",
    gammes:"Gammes", orders:"Commandes", clients:"Clients", logout:"Déconnexion",
    kpiRevenue:"CA livré", kpiOrders:"Commandes", kpiNew:"Nouvelles", kpiStockOut:"En rupture",
    ordersByStatus:"Commandes par statut", latestOrders:"Dernières commandes", waNumber:"Numéro WhatsApp de notification",
    notifyWa:"Notifier sur WhatsApp", newProduct:"Nouveau produit", newCat:"Nouvelle gamme", name:"Nom", featuredLabel:"Mettre en avant sur l'accueil", activeLabel:"Visible dans la boutique", featuredShort:"Accueil", hidden:"Masqué",
    price:"Prix", stock:"Stock", category:"Gamme", actions:"Actions", save:"Enregistrer", cancel:"Annuler",
    edit:"Modifier", del:"Supprimer", confirmDelTitle:"Supprimer le produit ?", confirmDelMsg:"Cette action est irréversible.", status:"Statut", date:"Date", customer:"Client", detail:"Détail",
    changeStatus:"Changer le statut", items:"Articles", ordersCount:"Commandes", spent:"Total dépensé",
    feeHome:"Frais domicile", feeDesk:"Frais stop-desk", confirmStock:"Confirmer (décompte le stock)", callClient:"Appeler le client",
    st_new:"Nouvelle", st_confirmed:"Confirmée", st_shipped:"Expédiée", st_delivered:"Livrée", st_cancelled:"Annulée",
    noOrders:"Aucune commande pour le moment.", required:"Ce champ est requis." },
  en:{ shop:"Shop", admin:"Admin", home:"Home", catalog:"Catalog", cart:"Cart",
    heroKicker:"Protection tested in real conditions", heroTitle:"Your devices take the hits. You don't.",
    heroSub:"Shockproof cases, tempered glass and bumpers. Cash on delivery across Algeria.",
    shopNow:"Shop products", trustCod:"Cash on delivery", trustDelivery:"Delivery to 58 wilayas",
    trustWarranty:"6-month warranty", categories:"Categories", featured:"Best sellers", all:"All",
    addToCart:"Add to cart", buyNow:"Buy now", outOfStock:"Out of stock", inStock:"In stock", dropTest:"Drop tested",
    qty:"Quantity", specs:"Specs", emptyCart:"Your cart is empty", subtotal:"Subtotal",
    delivery:"Delivery", total:"Total", checkout:"Checkout", continue:"Continue shopping",
    yourInfo:"Your information", fullName:"Full name", phone:"Phone", wilaya:"Wilaya", commune:"Town",
    address:"Address", deliveryType:"Delivery type", homeDeliv:"Home delivery", desk:"Stop-desk (pickup)",
    note:"Note (optional)", placeOrder:"Place order", payNote:"Cash on delivery — no online payment.",
    chooseWilaya:"Choose wilaya", orderOk:"Order confirmed!", orderNo:"Order number",
    callConfirm:"We will call you to confirm your order.", contactWa:"Contact us on WhatsApp",
    reqName:"Name required", reqPhone:"Invalid phone", reqWilaya:"Wilaya required", reqCommune:"Town required",
    reqAddress:"Address required", search:"Search a product...",
    login:"Admin login", email:"Email", password:"Password", signin:"Sign in",
    demoHint:"Demo: any email / password.", signingIn:"Signing in…", authHint:"Sign in with your Supabase admin account.", dashboard:"Dashboard", products:"Products",
    gammes:"Categories", orders:"Orders", clients:"Customers", logout:"Log out",
    kpiRevenue:"Delivered revenue", kpiOrders:"Orders", kpiNew:"New", kpiStockOut:"Out of stock",
    ordersByStatus:"Orders by status", latestOrders:"Latest orders", waNumber:"Notification WhatsApp number",
    notifyWa:"Notify on WhatsApp", newProduct:"New product", newCat:"New category", name:"Name", featuredLabel:"Feature on home page", activeLabel:"Visible in shop", featuredShort:"Home", hidden:"Hidden",
    price:"Price", stock:"Stock", category:"Category", actions:"Actions", save:"Save", cancel:"Cancel",
    edit:"Edit", del:"Delete", confirmDelTitle:"Delete product?", confirmDelMsg:"This action cannot be undone.", status:"Status", date:"Date", customer:"Customer", detail:"Detail",
    changeStatus:"Change status", items:"Items", ordersCount:"Orders", spent:"Total spent",
    feeHome:"Home fee", feeDesk:"Stop-desk fee", confirmStock:"Confirm (deduct stock)", callClient:"Call customer",
    st_new:"New", st_confirmed:"Confirmed", st_shipped:"Shipped", st_delivered:"Delivered", st_cancelled:"Cancelled",
    noOrders:"No orders yet.", required:"This field is required." },
  ar:{ shop:"المتجر", admin:"الإدارة", home:"الرئيسية", catalog:"الكتالوج", cart:"السلة",
    heroKicker:"حماية مُختبرة في ظروف حقيقية", heroTitle:"أجهزتك تتحمّل الصدمات، وأنت مرتاح.",
    heroSub:"أغطية وزجاج مقوى وإطارات مضادة للصدمات. الدفع عند الاستلام في كامل الجزائر.",
    shopNow:"تصفّح المنتجات", trustCod:"الدفع عند الاستلام", trustDelivery:"توصيل لـ 58 ولاية",
    trustWarranty:"ضمان 6 أشهر", categories:"التصنيفات", featured:"الأكثر مبيعًا", all:"الكل",
    addToCart:"أضف إلى السلة", buyNow:"شراء الآن", outOfStock:"نفد المخزون", inStock:"متوفر", dropTest:"اختبار السقوط",
    qty:"الكمية", specs:"المواصفات", emptyCart:"سلتك فارغة", subtotal:"المجموع الفرعي",
    delivery:"التوصيل", total:"الإجمالي", checkout:"إتمام الطلب", continue:"متابعة التسوق",
    yourInfo:"معلوماتك", fullName:"الاسم الكامل", phone:"الهاتف", wilaya:"الولاية", commune:"البلدية",
    address:"العنوان", deliveryType:"نوع التوصيل", homeDeliv:"إلى المنزل", desk:"مكتب التوصيل",
    note:"ملاحظة (اختياري)", placeOrder:"تأكيد الطلب", payNote:"الدفع عند الاستلام — لا دفع إلكتروني.",
    chooseWilaya:"اختر الولاية", orderOk:"تم تأكيد الطلب!", orderNo:"رقم الطلب",
    callConfirm:"سنتصل بك لتأكيد طلبك.", contactWa:"تواصل معنا عبر واتساب",
    reqName:"الاسم مطلوب", reqPhone:"رقم غير صالح", reqWilaya:"الولاية مطلوبة", reqCommune:"البلدية مطلوبة",
    reqAddress:"العنوان مطلوب", search:"ابحث عن منتج...",
    login:"دخول الإدارة", email:"البريد الإلكتروني", password:"كلمة المرور", signin:"تسجيل الدخول",
    demoHint:"تجريبي: أي بريد / كلمة مرور.", signingIn:"جارٍ الدخول…", authHint:"سجّل الدخول بحساب المشرف على Supabase.", dashboard:"لوحة القيادة", products:"المنتجات",
    gammes:"التصنيفات", orders:"الطلبات", clients:"العملاء", logout:"خروج",
    kpiRevenue:"الإيرادات المُسلّمة", kpiOrders:"الطلبات", kpiNew:"جديدة", kpiStockOut:"نفد المخزون",
    ordersByStatus:"الطلبات حسب الحالة", latestOrders:"آخر الطلبات", waNumber:"رقم واتساب للإشعار",
    notifyWa:"إشعار عبر واتساب", newProduct:"منتج جديد", newCat:"تصنيف جديد", name:"الاسم", featuredLabel:"إبراز في الصفحة الرئيسية", activeLabel:"ظاهر في المتجر", featuredShort:"الرئيسية", hidden:"مخفي",
    price:"السعر", stock:"المخزون", category:"التصنيف", actions:"إجراءات", save:"حفظ", cancel:"إلغاء",
    edit:"تعديل", del:"حذف", confirmDelTitle:"حذف المنتج؟", confirmDelMsg:"لا يمكن التراجع عن هذا الإجراء.", status:"الحالة", date:"التاريخ", customer:"العميل", detail:"التفاصيل",
    changeStatus:"تغيير الحالة", items:"المنتجات", ordersCount:"الطلبات", spent:"الإجمالي المُنفق",
    feeHome:"سعر المنزل", feeDesk:"سعر المكتب", confirmStock:"تأكيد (خصم المخزون)", callClient:"اتصل بالعميل",
    st_new:"جديدة", st_confirmed:"مؤكدة", st_shipped:"مُرسلة", st_delivered:"مُسلّمة", st_cancelled:"ملغاة",
    noOrders:"لا توجد طلبات بعد.", required:"هذا الحقل مطلوب." },
};

const STATUS = ["new","confirmed","shipped","delivered","cancelled"];
const STATUS_COLOR = { new:C.amber, confirmed:C.cobalt, shipped:"#6C5CE7", delivered:C.green, cancelled:C.red };

/* ---------- Helpers ---------- */
const fmt = (n, lang) => `${Number(n).toLocaleString("fr-FR")} ${lang==="ar"?"دج":"DA"}`;
const genNo = () => "CMD-" + Math.floor(100000 + Math.random()*899999);
const waLink = (num, text) => `https://wa.me/${num.replace(/\D/g,"")}?text=${encodeURIComponent(text)}`;
const catArt = (catId) => (SEED_CATS.find(c=>c.id===catId)||{}).art || "case";

/* ---------- Product artwork (SVG) ---------- */
function ProductArt({ variant="case", accent=C.cobalt, size=130 }) {
  const gid = "g"+String(accent).replace("#","");
  const phone = (
    <g>
      <rect x="46" y="22" width="58" height="106" rx="13" fill="#13202d" />
      <rect x="51" y="27" width="48" height="96" rx="9" fill="#0a141d" />
      <rect x="58" y="34" width="34" height="6" rx="3" fill="#22323f" />
    </g>
  );
  return (
    <svg viewBox="0 0 150 150" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.18" />
          <stop offset="1" stopColor={accent} stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="150" height="150" rx="20" fill={`url(#${gid})`} />
      {variant==="case" && (<>
        <rect x="40" y="16" width="70" height="118" rx="18" fill="none" stroke={accent} strokeWidth="5" />
        {phone}
        {[[40,16],[110,16],[40,134],[110,134]].map((p,i)=>(
          <circle key={i} cx={p[0]} cy={p[1]} r="9" fill={accent} opacity="0.92" />
        ))}
      </>)}
      {variant==="glass" && (<>
        {phone}
        <rect x="49" y="25" width="52" height="100" rx="10" fill="#bfe3ff" opacity="0.30" stroke={accent} strokeWidth="2.5" />
        <path d="M55 30 L70 30 L55 46 Z" fill="#fff" opacity="0.55" />
      </>)}
      {variant==="bumper" && (<>
        {phone}
        <rect x="42" y="18" width="66" height="114" rx="16" fill="none" stroke={accent} strokeWidth="6" />
      </>)}
      {variant==="sleeve" && (<>
        <rect x="34" y="30" width="82" height="92" rx="13" fill={accent} opacity="0.20" stroke={accent} strokeWidth="4" />
        <rect x="34" y="30" width="82" height="14" rx="7" fill={accent} opacity="0.55" />
        <circle cx="75" cy="37" r="3" fill="#fff" />
      </>)}
      <g transform="translate(98,98)">
        <circle cx="0" cy="0" r="15" fill={C.ink} />
        <path d="M0 -8 L7 -5 V2 C7 6 0 9 0 9 C0 9 -7 6 -7 2 V-5 Z" fill={accent} />
      </g>
    </svg>
  );
}

/* ===================== LOGO (original) ===================== */
function Logo({ variant="light", size=34, wordmark=true }) {
  const ink = variant==="dark" ? "#FFFFFF" : C.ink;
  return (
    <span className="bx-logo2">
      {/* <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <rect width="40" height="40" rx="12" fill={C.amber}/>
        <path d="M20 7.5 L30.5 11.5 V20 C30.5 27.2 20 32.5 20 32.5 C20 32.5 9.5 27.2 9.5 20 V11.5 Z" fill="#fff"/>
        <path d="M21.6 12.6 L15 22 H19 L17.4 28.6 L25 18.4 H20.4 Z" fill={C.cobalt}/>
      </svg> */}
      {wordmark && <span className="wm" style={{color:ink}}>Cool Blue<span style={{color:C.cobalt}}> DZ</span></span>}
    </span>
  );
}

/* ===================== STYLES ===================== */
const CSS = `
.bx *{box-sizing:border-box;}
.bx{--ink:${C.ink};--inkSoft:${C.inkSoft};--bg:${C.bg};--mist:${C.mist};--line:${C.line};
  --blue:${C.cobalt};--blueDk:${C.cobaltDk};--orange:${C.amber};--orangeDk:${C.amberDk};--muted:${C.muted};
  font-family:system-ui,-apple-system,"Segoe UI",Roboto,"Helvetica Neue","Noto Sans Arabic",sans-serif;
  color:var(--ink);background:var(--bg);min-height:100vh;line-height:1.5;-webkit-font-smoothing:antialiased;}
.bx h1,.bx h2,.bx h3{margin:0;font-weight:800;letter-spacing:-0.015em;}
.bx button{font-family:inherit;cursor:pointer;border:none;}
.mono{font-variant-numeric:tabular-nums;}
.bx-wrap{max-width:1200px;margin:0 auto;padding:0 20px;}
/* buttons */
.bx-btn{display:inline-flex;align-items:center;gap:8px;justify-content:center;border-radius:12px;
  padding:12px 20px;font-weight:700;font-size:14px;transition:.18s;white-space:nowrap;}
.bx-amber{background:var(--orange);color:#fff;box-shadow:0 8px 18px -8px rgba(255,102,0,.55);}
.bx-amber:hover{background:var(--orangeDk);box-shadow:0 11px 22px -8px rgba(255,102,0,.65);transform:translateY(-1px);}
.bx-cobalt{background:var(--blue);color:#fff;box-shadow:0 8px 18px -10px rgba(0,144,227,.6);}
.bx-cobalt:hover{background:var(--blueDk);transform:translateY(-1px);}
.bx-ghost{background:#fff;color:var(--ink);border:1px solid var(--line);}
.bx-ghost:hover{border-color:var(--blue);color:var(--blue);}
.bx-dark{background:var(--ink);color:#fff;}
.bx-dark:hover{background:#15324a;}
.bx-btn:disabled{opacity:.45;cursor:not-allowed;box-shadow:none;transform:none;}
/* fields */
.bx-input,.bx-select,.bx-area{width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 13px;
  font-size:14px;font-family:inherit;background:#fff;color:var(--ink);transition:.15s;}
.bx-input:focus,.bx-select:focus,.bx-area:focus{outline:none;border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,144,227,.16);}
.bx-label{font-size:12.5px;font-weight:700;color:var(--muted);margin-bottom:6px;display:block;}
.bx-card{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 1px 2px rgba(15,34,51,.04);}
.bx-err{color:var(--orangeDk);font-size:12px;margin-top:4px;}
/* top bar */
.bx-topbar{background:var(--ink);color:#fff;}
.bx-topbar .bx-wrap{display:flex;align-items:center;justify-content:space-between;height:48px;gap:12px;}
.bx-switch{display:inline-flex;background:#ffffff1a;border-radius:11px;padding:3px;gap:3px;}
.bx-switch button{background:transparent;color:#c3d3e0;border-radius:9px;padding:6px 15px;font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:6px;transition:.15s;}
.bx-switch button.on{background:#fff;color:var(--ink);}
.bx-lang{display:inline-flex;gap:2px;background:#ffffff1a;border-radius:10px;padding:3px;}
.bx-lang button{background:transparent;color:#c3d3e0;border-radius:8px;padding:5px 10px;font-weight:700;font-size:12px;}
.bx-lang button.on{background:var(--orange);color:#fff;}
.bx-badge{position:absolute;top:-7px;inset-inline-end:-7px;background:var(--orange);color:#fff;font-size:11px;
  font-weight:800;min-width:18px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 4px;}
/* shop header */
.bx-head{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:30;}
.bx-head .bx-wrap{display:flex;align-items:center;gap:18px;height:68px;}
.bx-logo{display:inline-flex;align-items:center;gap:10px;font-weight:900;font-size:19px;letter-spacing:-0.03em;}
.bx-logo .dot{width:34px;height:34px;border-radius:11px;background:var(--blue);display:grid;place-items:center;box-shadow:0 7px 15px -6px rgba(0,144,227,.7);}
.bx-logo .ac{color:var(--blue);}
.bx-logo2{display:inline-flex;align-items:center;gap:10px;}
.bx-logo2 .wm{font-weight:900;font-size:19px;letter-spacing:-0.03em;line-height:1;white-space:nowrap;}
.bx-nav{display:flex;gap:4px;margin-inline-start:8px;}
.bx-nav button{background:transparent;color:var(--inkSoft);font-weight:600;font-size:14.5px;padding:9px 14px;border-radius:10px;transition:.15s;}
.bx-nav button.on,.bx-nav button:hover{background:var(--mist);color:var(--blue);}
.bx-searchbox{flex:1;max-width:360px;position:relative;display:flex;align-items:center;}
.bx-searchbox svg{position:absolute;inset-inline-start:13px;color:var(--muted);}
.bx-searchbox input{width:100%;padding:11px 13px 11px 40px;border:1px solid var(--line);border-radius:12px;font-size:14px;background:var(--mist);transition:.15s;}
.bx-searchbox input:focus{outline:none;background:#fff;border-color:var(--blue);box-shadow:0 0 0 3px rgba(0,144,227,.16);}
[dir=rtl] .bx-searchbox input{padding:11px 40px 11px 13px;}
.bx-carticon{position:relative;background:var(--blue);color:#fff;border-radius:13px;width:48px;height:48px;display:grid;place-items:center;box-shadow:0 8px 18px -8px rgba(0,144,227,.7);transition:.15s;}
.bx-carticon:hover{background:var(--blueDk);transform:translateY(-1px);}
.bx-head-actions{display:flex;align-items:center;gap:10px;margin-inline-start:auto;}
.bx-burger{display:none;background:var(--mist);color:var(--ink);border-radius:12px;width:46px;height:46px;place-items:center;transition:.15s;}
.bx-burger:hover{background:#e2eefb;color:var(--blue);}
.bx-mmenu{display:none;flex-direction:column;gap:8px;padding:14px 20px 18px;border-top:1px solid var(--line);background:#fff;}
.bx-mmenu .bx-searchbox{max-width:none;}
.bx-mmenu .bx-searchbox input{background:#fff;}
.bx-mmenu > button{background:var(--mist);border-radius:11px;padding:13px 15px;font-weight:700;font-size:15px;text-align:start;color:var(--ink);transition:.15s;}
.bx-mmenu > button:hover{background:#e2eefb;color:var(--blue);}
@media(min-width:981px){.bx-mmenu{display:none !important;}.bx-burger{display:none !important;}}
.bx-langwrap{position:relative;}
.bx-langbtn{display:inline-flex;align-items:center;gap:6px;background:var(--mist);color:var(--ink);border-radius:12px;padding:0 13px;height:48px;font-weight:800;font-size:13px;transition:.15s;}
.bx-langbtn:hover{background:#e2eefb;color:var(--blue);}
.bx-langmenu{position:absolute;top:calc(100% + 8px);inset-inline-end:0;background:#fff;border:1px solid var(--line);border-radius:12px;box-shadow:0 16px 36px -16px rgba(15,34,51,.3);padding:6px;z-index:60;min-width:104px;display:flex;flex-direction:column;gap:2px;}
.bx-langmenu button{background:transparent;border-radius:8px;padding:10px 12px;font-weight:700;font-size:13px;text-align:start;color:var(--inkSoft);transition:.12s;}
.bx-langmenu button:hover{background:var(--mist);color:var(--blue);}
.bx-langmenu button.on{background:var(--blue);color:#fff;}
.bx-langback{position:fixed;inset:0;z-index:55;}
/* hero */
.bx-hero{background:linear-gradient(135deg,#0090E3 0%,#00A2F5 52%,#0086D4 100%);background-size:170% 170%;color:#fff;overflow:hidden;position:relative;}
.bx-hero::before{content:"";position:absolute;top:-130px;inset-inline-end:-70px;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.22),transparent 70%);}
.bx-hero .bx-wrap{display:flex;flex-direction:column;align-items:center;text-align:center;padding-top:72px;padding-bottom:72px;position:relative;}
.bx-kicker{display:inline-flex;align-items:center;gap:8px;font-size:12.5px;font-weight:800;color:#fff;
  background:var(--orange);border-radius:999px;padding:6px 14px;margin-bottom:18px;box-shadow:0 8px 18px -8px rgba(255,102,0,.7);}
.bx-hero h1{font-size:46px;line-height:1.04;margin-bottom:18px;letter-spacing:-0.025em;}
.bx-hero-text{max-width:720px;}
.bx-hero p{color:#eaf6fd;font-size:16.5px;max-width:520px;margin:0 auto 26px;line-height:1.55;}
.bx-heroart{position:relative;display:grid;place-items:center;min-height:300px;}
.bx-glow{position:absolute;width:330px;height:330px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.30),transparent 64%);}
.bx-ring{position:absolute;width:240px;height:240px;border-radius:50%;border:2px solid rgba(255,255,255,.5);}
.bx-ring.r2{width:312px;height:312px;border-color:rgba(255,255,255,.28);}
@media(prefers-reduced-motion:no-preference){
  .bx-ring{animation:pulse 3.4s ease-out infinite;}
  .bx-ring.r2{animation-delay:1.2s;}
  @keyframes pulse{0%{transform:scale(.82);opacity:.8;}100%{transform:scale(1.28);opacity:0;}}
}
.bx-chips{position:absolute;bottom:4px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center;}
.bx-chip{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.34);border-radius:999px;padding:7px 14px;font-size:12.5px;font-weight:700;}
/* trust */
.bx-trust{background:#fff;border-bottom:1px solid var(--line);}
.bx-trust .bx-wrap{display:flex;gap:30px;flex-wrap:wrap;padding:18px 20px;justify-content:center;}
.bx-trust-i{display:inline-flex;align-items:center;gap:10px;font-size:14px;font-weight:600;color:var(--inkSoft);}
.bx-trust-i svg{color:var(--blue);}
/* sections */
.bx-section{padding:48px 0;}
.bx-sec-h{display:flex;align-items:end;justify-content:space-between;margin-bottom:24px;gap:12px;}
.bx-sec-h h2{font-size:27px;}
.bx-cats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}
.bx-cat{background:#fff;border:1px solid var(--line);border-radius:20px;padding:18px;text-align:start;cursor:pointer;transition:.2s;box-shadow:0 1px 2px rgba(15,34,51,.04);}
.bx-cat:hover{border-color:var(--blue);transform:translateY(-4px);box-shadow:0 16px 30px -18px rgba(0,144,227,.4);}
.bx-cat h3{font-size:15.5px;margin-top:8px;}
.bx-cat span{font-size:12.5px;color:var(--muted);}
.bx-cats-wrap{position:relative;}
.bx-cats-arrow{display:none;}
/* filters */
.bx-filters{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;}
.bx-filters button{background:#fff;border:1px solid var(--line);border-radius:999px;padding:9px 17px;font-weight:600;font-size:13.5px;color:var(--inkSoft);transition:.15s;}
.bx-filters button:hover{border-color:var(--blue);color:var(--blue);}
.bx-filters button.on{background:var(--blue);color:#fff;border-color:var(--blue);}
/* product grid */
.bx-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;}
.bx-prod{background:#fff;border:1px solid var(--line);border-radius:20px;overflow:hidden;display:flex;flex-direction:column;transition:.2s;box-shadow:0 1px 2px rgba(15,34,51,.04);}
.bx-prod:hover{box-shadow:0 18px 36px -20px rgba(0,144,227,.45);transform:translateY(-4px);border-color:#d4e6f5;}
.bx-prod-img{position:relative;display:grid;place-items:center;padding:10px;cursor:pointer;}
.bx-prod-img svg,.bx-prod-img img,.bx-cat svg{transition:transform .25s ease;}
.bx-prod:hover .bx-prod-img svg,.bx-prod:hover .bx-prod-img img{transform:scale(1.06);}
.bx-cat:hover svg{transform:scale(1.06);}
.bx-tag{position:absolute;top:12px;inset-inline-start:12px;background:var(--orange);color:#fff;font-size:11px;font-weight:800;border-radius:8px;padding:4px 9px;box-shadow:0 6px 14px -6px rgba(255,102,0,.6);}
.bx-tag.out{background:var(--ink);color:#fff;}
.bx-prod-body{padding:0 16px 16px;display:flex;flex-direction:column;gap:8px;flex:1;}
.bx-prod-cat{font-size:11.5px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.04em;}
.bx-prod-bm{font-size:12px;color:var(--muted);font-weight:600;margin-top:-2px;}
.bx-prod-name{font-size:15.5px;font-weight:700;cursor:pointer;line-height:1.3;}
.bx-prod-meta{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);}
.bx-price{display:flex;align-items:baseline;gap:8px;margin-top:auto;}
.bx-price .now{font-size:19px;font-weight:800;}
.bx-price .was{font-size:13px;color:var(--muted);text-decoration:line-through;}
.bx-spec{display:inline-flex;align-items:center;gap:5px;background:var(--mist);border-radius:8px;padding:4px 9px;font-size:11.5px;font-weight:700;color:var(--inkSoft);}
/* overlay/drawer/modal */
.bx-overlay{position:fixed;inset:0;background:rgba(15,34,51,.45);z-index:50;display:flex;}
.bx-drawer{margin-inline-start:auto;width:min(440px,100%);background:#fff;height:100%;display:flex;flex-direction:column;}
.bx-modal{margin:auto;width:min(640px,94%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;}
.bx-modal.sm{width:min(470px,94%);}
.bx-prodmodal{display:grid;grid-template-columns:1fr 1fr;gap:0;}
.bx-dh{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid var(--line);}
.bx-dh h3{font-size:17px;}
.bx-x{background:var(--mist);border-radius:10px;width:36px;height:36px;display:grid;place-items:center;color:var(--inkSoft);transition:.15s;}
.bx-x:hover{background:#e2eefb;}
.bx-citem{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--line);}
.bx-citem .ci-art{background:var(--mist);border-radius:12px;flex-shrink:0;display:grid;place-items:center;}
.bx-qty{display:inline-flex;align-items:center;border:1px solid var(--line);border-radius:10px;overflow:hidden;}
.bx-qty button{background:#fff;width:32px;height:32px;display:grid;place-items:center;color:var(--ink);transition:.15s;}
.bx-qty button:hover{background:var(--mist);color:var(--blue);}
.bx-qty span{min-width:34px;text-align:center;font-weight:700;font-size:14px;}
.bx-sumrow{display:flex;justify-content:space-between;font-size:14px;padding:6px 0;}
.bx-sumrow.tot{font-size:17px;font-weight:800;border-top:1px solid var(--line);margin-top:8px;padding-top:12px;}
.bx-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;}
.bx-radio{display:flex;gap:10px;}
.bx-radio label{flex:1;border:1px solid var(--line);border-radius:13px;padding:12px;cursor:pointer;font-size:13.5px;font-weight:700;display:flex;flex-direction:column;gap:3px;transition:.15s;}
.bx-radio label.on{border-color:var(--blue);background:rgba(0,144,227,.06);box-shadow:0 0 0 3px rgba(0,144,227,.1);}
.bx-radio small{color:var(--muted);font-weight:600;}
/* admin */
.bx-admin{display:flex;min-height:calc(100vh - 48px);}
.bx-side{width:236px;background:#fff;border-inline-end:1px solid var(--line);padding:18px 14px;flex-shrink:0;}
.bx-side .brand{display:flex;align-items:center;gap:9px;font-weight:900;padding:6px 8px 18px;}
.bx-side button{width:100%;display:flex;align-items:center;gap:11px;background:transparent;color:var(--inkSoft);
  font-weight:600;font-size:14px;padding:11px 12px;border-radius:11px;text-align:start;margin-bottom:3px;position:relative;transition:.15s;}
.bx-side button.on{background:var(--blue);color:#fff;box-shadow:0 8px 18px -10px rgba(0,144,227,.7);}
.bx-side button:not(.on):hover{background:var(--mist);color:var(--blue);}
.bx-main{flex:1;padding:28px;overflow:auto;}
.bx-main h2{font-size:23px;margin-bottom:20px;}
.bx-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;}
.bx-dash2{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:22px;}
.bx-tablewrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;}
.bx-kpi{background:#fff;border:1px solid var(--line);border-radius:18px;padding:18px;box-shadow:0 1px 2px rgba(15,34,51,.04);}
.bx-kpi .k{font-size:12.5px;color:var(--muted);font-weight:700;}
.bx-kpi .v{font-size:27px;font-weight:800;margin-top:5px;}
.bx-table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 1px 2px rgba(15,34,51,.04);}
.bx-table th{text-align:start;font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;padding:13px 15px;border-bottom:1px solid var(--line);background:var(--mist);}
.bx-table td{padding:13px 15px;border-bottom:1px solid var(--line);font-size:14px;}
.bx-table tr:last-child td{border-bottom:none;}
.bx-table tbody tr:hover{background:#fafdff;}
.bx-pill{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;border-radius:999px;padding:5px 11px;color:#fff;}
.bx-iconbtn{background:var(--mist);border-radius:9px;width:34px;height:34px;display:inline-grid;place-items:center;color:var(--inkSoft);transition:.15s;}
.bx-iconbtn:hover{background:#e2eefb;color:var(--blue);}
.bx-bar{height:10px;border-radius:6px;}
.bx-row-gap{display:flex;gap:8px;align-items:center;}
.bx-login{min-height:calc(100vh - 48px);display:grid;place-items:center;padding:24px;background:linear-gradient(160deg,#EAF5FD,#F6F9FC);}
.bx-login .bx-card{padding:30px;width:min(390px,100%);}
/* footer */
.bx-foot{background:var(--ink);color:#9fb1c2;padding:30px 0;margin-top:24px;}
.bx-foot .bx-wrap{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;align-items:center;}
@media(max-width:980px){
  .bx-hero .bx-wrap{grid-template-columns:1fr;}
  .bx-hero h1{font-size:36px;}
  .bx-cats,.bx-grid{grid-template-columns:repeat(2,1fr);}
  .bx-kpis{grid-template-columns:repeat(2,1fr);}
  .bx-nav,.bx-head .bx-wrap > .bx-searchbox{display:none;}
  .bx-burger{display:grid;}
  .bx-mmenu{display:flex;}
}
@media(max-width:820px){
  .bx-admin{flex-direction:column;}
  .bx-side{width:100%;display:flex;gap:6px;overflow-x:auto;border-inline-end:none;border-bottom:1px solid var(--line);padding:10px;}
  .bx-side .brand{display:none;}
  .bx-side button{width:auto;white-space:nowrap;margin-bottom:0;}
  .bx-form-grid{grid-template-columns:1fr;}
  .bx-dash2{grid-template-columns:1fr;}
  /* tableaux : scroll horizontal plutôt que colonnes écrasées */
  .bx-table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;white-space:nowrap;}
}
@media(max-width:560px){
  .bx-cats,.bx-grid{grid-template-columns:1fr;}
  .bx-kpis{grid-template-columns:1fr 1fr;}
  .bx-main{padding:16px 14px;}
  .bx-main h2{font-size:20px;margin-bottom:14px;}
  .bx-modal .bx-form-grid{gap:11px;}
}
@media(max-width:640px){
  .bx-cats-scroll{display:flex;overflow-x:auto;gap:12px;scroll-snap-type:x mandatory;margin-inline:-20px;padding:8px 20px 14px;-webkit-overflow-scrolling:touch;}
  .bx-cats-scroll::-webkit-scrollbar{height:0;}
  .bx-cats-scroll > .bx-cat{flex:0 0 60%;scroll-snap-align:start;}
  .bx-cats-arrow{display:grid;place-items:center;position:absolute;top:50%;transform:translateY(-50%);z-index:5;
    width:38px;height:38px;border-radius:50%;background:#fff;color:var(--ink);border:1px solid var(--line);
    box-shadow:0 6px 16px -6px rgba(15,34,51,.28);transition:.15s;cursor:pointer;}
  .bx-cats-arrow.prev{inset-inline-start:-2px;}
  .bx-cats-arrow.next{inset-inline-end:-2px;}
  .bx-cats-arrow:hover{color:var(--blue);border-color:var(--blue);}
  .bx-cats-arrow:active{transform:translateY(-50%) scale(.9);}
}
@media(max-width:560px){
  .bx-head .bx-wrap{height:60px;gap:10px;}
  .bx-logo{font-size:17px;}
  .bx-hero .bx-wrap{padding-top:40px;padding-bottom:44px;}
  .bx-hero h1{font-size:30px;}
  .bx-heroart{min-height:236px;}
  .bx-sec-h h2{font-size:22px;}
  .bx-section{padding:36px 0;}
  .bx-trust .bx-wrap{gap:18px;}
  .bx-modal,.bx-modal.sm{width:96%;}
  .bx-prodmodal{grid-template-columns:1fr;}
  .bx-head-actions{gap:8px;}
  .bx-langbtn{height:44px;padding:0 10px;}
  .bx-langbtn .lc{display:none;}
  .bx-carticon{width:44px;height:44px;}
  .bx-burger{width:44px;height:44px;}
}
@media(prefers-reduced-motion:no-preference){
  @keyframes rise{from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;}}
  @keyframes fadein{from{opacity:0;}to{opacity:1;}}
  @keyframes pop{from{opacity:0;transform:translateY(10px) scale(.985);}to{opacity:1;transform:none;}}
  @keyframes drawerIn{from{opacity:0;transform:translateX(26px);}to{opacity:1;transform:none;}}
  @keyframes drawerInR{from{opacity:0;transform:translateX(-26px);}to{opacity:1;transform:none;}}
  .bx-fade-up{animation:rise .6s cubic-bezier(.2,.7,.2,1) both;}
  .bx-overlay{animation:fadein .2s ease;}
  .bx-modal{animation:pop .26s cubic-bezier(.2,.8,.2,1);}
  .bx-drawer{animation:drawerIn .3s cubic-bezier(.2,.7,.2,1);}
  [dir=rtl] .bx-drawer{animation-name:drawerInR;}
  .bx-mmenu{animation:rise .22s ease;}
  .bx-grid .bx-prod{animation:rise .5s cubic-bezier(.2,.7,.2,1) both;}
  .bx-grid .bx-prod:nth-child(1){animation-delay:.03s;}
  .bx-grid .bx-prod:nth-child(2){animation-delay:.07s;}
  .bx-grid .bx-prod:nth-child(3){animation-delay:.11s;}
  .bx-grid .bx-prod:nth-child(4){animation-delay:.15s;}
  .bx-grid .bx-prod:nth-child(5){animation-delay:.19s;}
  .bx-grid .bx-prod:nth-child(6){animation-delay:.23s;}
  .bx-grid .bx-prod:nth-child(7){animation-delay:.27s;}
  .bx-grid .bx-prod:nth-child(8){animation-delay:.31s;}
  .bx-cats .bx-cat{animation:rise .5s cubic-bezier(.2,.7,.2,1) both;}
  .bx-cats .bx-cat:nth-child(1){animation-delay:.03s;}
  .bx-cats .bx-cat:nth-child(2){animation-delay:.09s;}
  .bx-cats .bx-cat:nth-child(3){animation-delay:.15s;}
  .bx-cats .bx-cat:nth-child(4){animation-delay:.21s;}
  .bx-kpi{animation:rise .45s ease both;}
  .bx-hero{animation:heroShift 14s ease-in-out infinite;}
  @keyframes heroShift{0%{background-position:0% 50%;}50%{background-position:100% 50%;}100%{background-position:0% 50%;}}
  .bx-hero-text > *{animation:rise .6s cubic-bezier(.2,.7,.2,1) both;}
  .bx-hero-text > *:nth-child(1){animation-delay:.05s;}
  .bx-hero-text > *:nth-child(2){animation-delay:.16s;}
  .bx-hero-text > *:nth-child(3){animation-delay:.28s;}
  .bx-hero-text > *:nth-child(4){animation-delay:.40s;}
  .bx-badge{animation:badgePop .32s cubic-bezier(.2,.8,.2,1);}
  @keyframes badgePop{0%{transform:scale(.3);opacity:0;}60%{transform:scale(1.18);}100%{transform:scale(1);opacity:1;}}
}
`;

/* ===================== LANG SWITCH ===================== */
function LangSwitch({ lang, setLang }) {
  const [open, setOpen] = useState(false);
  const langs = [["fr","FR"],["en","EN"],["ar","AR"]];
  return (
    <div className="bx-langwrap">
      <button className="bx-langbtn" onClick={()=>setOpen(o=>!o)} aria-label="Langue" aria-expanded={open}>
        <Globe size={16}/><span className="lc">{lang.toUpperCase()}</span>
      </button>
      {open && (<>
        <div className="bx-langback" onClick={()=>setOpen(false)}/>
        <div className="bx-langmenu">
          {langs.map(([code,label])=>(
            <button key={code} className={lang===code?"on":""} onClick={()=>{setLang(code);setOpen(false);}}>{label}</button>
          ))}
        </div>
      </>)}
    </div>
  );
}

// Visuel produit : 1re vraie photo (product.images) si présente, sinon illustration SVG.
function ProductVisual({ p, size=138, accent=C.cobalt, radius=14 }) {
  const [failed, setFailed] = useState(false);
  const url = p.images?.[0]?.url;
  useEffect(() => { setFailed(false); }, [url]); // réinitialise si le produit/URL change
  if (url && !failed) {
    // alt = nom du produit (accessibilité/SEO) ; onError → repli sur l'illustration SVG si l'URL est morte.
    return <img src={url} alt={p.fr || p.en || p.ar || ""} loading="lazy" onError={()=>setFailed(true)} style={{width:size,height:size,maxWidth:"100%",objectFit:"cover",borderRadius:radius,display:"block"}}/>;
  }
  return <ProductArt variant={catArt(p.cat)} accent={accent} size={size}/>;
}

export { C, ZONE_FEE, WILAYAS, SEED_CATS, SEED_PRODUCTS, SEED_ORDERS, T, STATUS, STATUS_COLOR, fmt, genNo, waLink, catArt, ProductArt, Logo, CSS, LangSwitch, ProductVisual };
