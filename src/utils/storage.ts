import { Product, Client, CompanySettings, Invoice, PackingList, SampleInvoice, Contract, ProformaInvoice, Quotation, CertificateOfOrigin, ShippingInstruction, QuotationCalculation } from '../types';

// Helper to generate unique IDs
export const generateId = () => Math.random().toString(36).substring(2, 9);

// Default SVG Logos and Graphics represented as clean Base64 or inline SVGs for instant loading
export const DEFAULT_LOGO_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" width="100%" height="100%"><rect width="400" height="100" fill="white"/><path d="M35 25 L65 25 L80 60 L95 25 L125 25 L95 85 L65 85 Z" fill="%231565C0"/><path d="M50 35 L80 35 L65 65 Z" fill="%2342A5F5" opacity="0.8"/><circle cx="150" cy="55" r="20" fill="none" stroke="%231565C0" stroke-width="7"/><path d="M185 30 L205 75 L225 30" fill="none" stroke="%231565C0" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><text x="245" y="65" font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="26" fill="%231565C0">WAIMAO</text><text x="365" y="65" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="16" fill="%2364748B">TOOLS</text></svg>`;

export const DEFAULT_STAMP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 150" width="150" height="150"><circle cx="75" cy="75" r="70" fill="none" stroke="%231565C0" stroke-width="3" stroke-dasharray="4,2"/><circle cx="75" cy="75" r="62" fill="none" stroke="%231565C0" stroke-width="1.5"/><circle cx="75" cy="75" r="42" fill="none" stroke="%231565C0" stroke-width="1" stroke-dasharray="2,2"/><text x="75" y="32" font-family="sans-serif" font-weight="bold" font-size="8" fill="%231565C0" text-anchor="middle">WAIMAO GLOBAL EXPORT CO.</text><text x="75" y="125" font-family="sans-serif" font-weight="bold" font-size="8" fill="%231565C0" text-anchor="middle">* APPROVED *</text><path d="M40 75 Q75 45 110 75" fill="none" stroke="%231565C0" stroke-width="1.5"/><text x="75" y="78" font-family="sans-serif" font-weight="900" font-size="12" fill="%231565C0" text-anchor="middle">QC PASS</text><path d="M45 85 Q75 115 105 85" fill="none" stroke="%231565C0" stroke-width="1.5"/></svg>`;

export const DEFAULT_CONTRACT_STAMP_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 150" width="220" height="150"><ellipse cx="110" cy="75" rx="100" ry="65" fill="none" stroke="%23dc2626" stroke-width="3.5" opacity="0.9"/><ellipse cx="110" cy="75" rx="92" ry="57" fill="none" stroke="%23dc2626" stroke-width="1.5" opacity="0.9"/><path id="stampTopArc" d="M 22,75 A 88,52 0 0,1 198,75" fill="none"/><text fill="%23dc2626" font-size="14" font-weight="bold" font-family="sans-serif" opacity="0.9"><textPath href="%23stampTopArc" startOffset="50%" text-anchor="middle">外贸进出口商务有限公司</textPath></text><polygon points="110,55 114,66 125,66 116,73 119,84 110,77 101,84 104,73 95,66 106,66" fill="%23dc2626" opacity="0.9"/><text x="110" y="112" font-size="15" font-weight="bold" font-family="sans-serif" fill="%23dc2626" text-anchor="middle" opacity="0.9">合同专用章</text></svg>`;


export const DEFAULT_SIGNATURE_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 80" width="200" height="80"><path d="M20 50 Q40 10 50 30 T70 40 T90 20 T110 45 T140 25 T170 55 T190 40" fill="none" stroke="%231565C0" stroke-width="2.5" stroke-linecap="round"/><text x="25" y="70" font-family="monospace" font-size="9" fill="%2342A5F5">Export Director, GM</text></svg>`;

export const PRODUCT_IMAGES_SVG = {
  sprayer: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23E0F2FE"/><path d="M35 30 L65 30 L62 42 L38 42 Z" fill="%231E3A8A"/><path d="M65 30 L78 34 L78 38 L62 42 Z" fill="%230284C7"/><path d="M38 42 Q32 58 35 68 C36 70 38 70 39 68 Q44 58 41 42 Z" fill="%230284C7"/><rect x="42" y="42" width="16" height="10" rx="2" fill="%231E3A8A"/><line x1="50" y1="52" x2="50" y2="88" stroke="%2338BDF8" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  miniTrigger: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23ECFDF5"/><path d="M38 32 C38 24 56 22 66 28 C68 30 68 34 62 38 L40 40 Z" fill="%23047857"/><circle cx="48" cy="35" r="3" fill="%2310B981"/><path d="M36 40 Q30 52 32 60 C33 62 35 62 36 60 Q40 52 38 40 Z" fill="%23059669"/><rect x="42" y="40" width="16" height="10" rx="2" fill="%23047857"/><line x1="50" y1="50" x2="50" y2="88" stroke="%2334D399" stroke-width="2.5" stroke-linecap="round"/><rect x="52" y="44" width="4" height="4" rx="1" fill="%23F59E0B"/></svg>`,
  pump: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23E0F2FE"/><path d="M45 25 L65 22 L65 30 L55 32 Z" fill="%231E3A8A"/><rect x="45" y="32" width="10" height="12" fill="%2394A3B8"/><rect x="38" y="44" width="24" height="12" rx="2" fill="%231E3A8A"/><line x1="38" y1="50" x2="62" y2="50" stroke="white" stroke-width="1"/><line x1="50" y1="56" x2="50" y2="88" stroke="%2338BDF8" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  treatmentPump: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23FAF5FF"/><rect x="44" y="18" width="12" height="14" rx="2" fill="%237C3AED"/><path d="M48 20 L58 18 L58 24 L52 24 Z" fill="%23A78BFA"/><rect x="42" y="32" width="16" height="12" rx="2" fill="%23C4B5FD"/><rect x="38" y="44" width="24" height="12" rx="2" fill="%236D28D9"/><line x1="50" y1="56" x2="50" y2="88" stroke="%23A78BFA" stroke-width="2" stroke-linecap="round"/></svg>`,
  mist: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23E0F2FE"/><rect x="42" y="20" width="16" height="22" rx="4" fill="%23F1F5F9" stroke="%23CBD5E1" stroke-width="1.5" opacity="0.8"/><rect x="44" y="24" width="12" height="18" rx="2" fill="%231E3A8A"/><rect x="38" y="42" width="24" height="12" rx="2" fill="%231E3A8A"/><line x1="50" y1="54" x2="50" y2="88" stroke="%2338BDF8" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  bottle: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23E0F2FE"/><rect x="44" y="20" width="12" height="12" rx="1" fill="%2378350F" opacity="0.9"/><path d="M32 32 L68 32 C72 32 74 35 74 38 L74 82 C74 86 70 88 66 88 L34 88 C30 88 26 86 26 82 L26 38 C26 35 28 32 32 32 Z" fill="%2378350F" opacity="0.85"/><path d="M30 40 Q50 36 70 40 L70 45 Q50 41 30 45 Z" fill="%23B45309" opacity="0.3"/></svg>`,
  foam: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23E0F2FE"/><path d="M40 20 C40 20 62 18 64 24 C66 30 54 34 54 34" stroke="%231E3A8A" stroke-width="5" stroke-linecap="round" fill="none"/><rect x="42" y="34" width="16" height="18" rx="2" fill="%2394A3B8"/><rect x="35" y="52" width="30" height="14" rx="2" fill="%231E3A8A"/><line x1="50" y1="66" x2="50" y2="90" stroke="%2338BDF8" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  foamBrush: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23FDF2F8"/><ellipse cx="50" cy="22" rx="18" ry="10" fill="%23F472B6"/><circle cx="44" cy="20" r="1.5" fill="white"/><circle cx="50" cy="18" r="1.5" fill="white"/><circle cx="56" cy="20" r="1.5" fill="white"/><circle cx="47" cy="24" r="1.5" fill="white"/><circle cx="53" cy="24" r="1.5" fill="white"/><rect x="44" y="32" width="12" height="18" fill="%23CBD5E1"/><rect x="36" y="50" width="28" height="14" rx="2" fill="%230284C7"/><line x1="50" y1="64" x2="50" y2="90" stroke="%2338BDF8" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  continuousSprayer: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23EFF6FF"/><path d="M40 18 C40 18 64 16 68 24 C70 30 58 36 58 42 L42 42 C42 36 34 26 40 18 Z" fill="%231E3A8A"/><path d="M42 26 Q32 32 30 46" stroke="%230284C7" stroke-width="3" stroke-linecap="round" fill="none"/><path d="M42 42 L58 42 L62 84 C62 86 60 88 56 88 L44 88 C40 88 38 86 38 84 Z" fill="%23E11D48" opacity="0.85"/></svg>`,
  cardSprayer: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23F8FAFC"/><rect x="28" y="20" width="44" height="66" rx="8" fill="%23FFFFFF" stroke="%230284C7" stroke-width="2"/><circle cx="50" cy="32" r="5" fill="%231E3A8A"/><line x1="50" y1="37" x2="50" y2="78" stroke="%2338BDF8" stroke-width="2" stroke-linecap="round"/></svg>`,
  travelKit: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23F0FDF4"/><rect x="20" y="24" width="60" height="58" rx="6" fill="%23DCFCE7" stroke="%2316A34A" stroke-width="2"/><line x1="20" y1="34" x2="80" y2="34" stroke="%2316A34A" stroke-width="1.5" stroke-dasharray="2,2"/><rect x="26" y="40" width="10" height="34" rx="2" fill="%2338BDF8"/><rect x="40" y="40" width="10" height="34" rx="2" fill="%23F472B6"/><circle cx="58" cy="56" r="6" fill="%23FBBF24"/><circle cx="68" cy="62" r="5" fill="%23A78BFA"/></svg>`,
  jar: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23E0F2FE"/><rect x="25" y="28" width="50" height="14" rx="3" fill="%230F172A"/><rect x="25" y="44" width="50" height="36" rx="4" fill="%231E3A8A" opacity="0.2"/><rect x="30" y="47" width="40" height="28" rx="2" fill="%230284C7" opacity="0.8"/></svg>`,
  box: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23E0F2FE"/><path d="M50 20 L80 32 L50 44 L20 32 Z" fill="%23D97706" opacity="0.9"/><path d="M50 44 L80 32 L80 68 L50 80 Z" fill="%23B45309" opacity="0.95"/><path d="M50 44 L20 32 L20 68 L50 80 Z" fill="%2392400E" opacity="0.8"/><line x1="50" y1="20" x2="50" y2="44" stroke="%23FCD34D" stroke-width="1.5"/></svg>`,
  spring: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23F1F5F9"/><path d="M36 22 C32 22 30 26 36 28 C48 31 68 31 68 36 C68 41 32 41 32 46 C32 51 68 51 68 56 C68 61 32 61 32 66 C32 71 68 71 68 76 C68 80 50 82 46 82" fill="none" stroke="%2364748B" stroke-width="4.5" stroke-linecap="round"/><circle cx="36" cy="22" r="3" fill="%23475569"/><circle cx="46" cy="82" r="3" fill="%23475569"/></svg>`,
  padGasket: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23F8FAFC"/><ellipse cx="50" cy="50" rx="36" ry="24" fill="%23E2E8F0" stroke="%2394A3B8" stroke-width="2"/><ellipse cx="50" cy="50" rx="16" ry="10" fill="%23F8FAFC" stroke="%2394A3B8" stroke-width="2"/><ellipse cx="50" cy="46" rx="34" ry="21" fill="none" stroke="%23CBD5E1" stroke-width="1.5"/></svg>`,
  glassBall: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23EFF6FF"/><circle cx="50" cy="50" r="28" fill="%2393C5FD" opacity="0.6"/><circle cx="50" cy="50" r="28" stroke="%233B82F6" stroke-width="2" fill="none"/><ellipse cx="42" cy="40" rx="8" ry="5" transform="rotate(-30 42 40)" fill="white" opacity="0.8"/><circle cx="58" cy="58" r="4" fill="white" opacity="0.5"/></svg>`,
  dropper: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23FAF5FF"/><path d="M42 20 C42 16 58 16 58 20 L56 30 L44 30 Z" fill="%231E293B"/><rect x="38" y="30" width="24" height="10" rx="2" fill="%239333EA"/><rect x="46" y="40" width="8" height="42" fill="%23E2E8F0" stroke="%23A855F7" stroke-width="1.5"/><path d="M46 82 L50 90 L54 82 Z" fill="%23A855F7"/></svg>`,
  flipCap: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23F0FDF4"/><rect x="30" y="44" width="40" height="26" rx="3" fill="%23059669"/><path d="M30 44 L32 24 C32 20 68 20 68 24 L70 44 Z" fill="%2310B981" opacity="0.85"/><circle cx="50" cy="44" r="3" fill="white"/><rect x="26" y="70" width="48" height="6" rx="2" fill="%23047857"/></svg>`,
  discCap: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23F8FAFC"/><rect x="30" y="42" width="40" height="28" rx="3" fill="%231E293B"/><path d="M32 42 L68 34 L68 42 Z" fill="%2338BDF8"/><text x="42" y="38" font-family="sans-serif" font-size="6" font-weight="bold" fill="%230F172A">PRESS</text><circle cx="62" cy="38" r="2" fill="%230284C7"/></svg>`,
  aluminumBottle: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23F1F5F9"/><rect x="44" y="16" width="12" height="10" rx="1" fill="%2394A3B8"/><path d="M34 26 L66 26 C70 26 72 30 72 34 L72 84 C72 88 68 90 64 90 L36 90 C32 90 28 88 28 84 L28 34 C28 30 30 26 34 26 Z" fill="%23CBD5E1"/><path d="M36 26 L46 26 L46 90 L36 90 Z" fill="white" opacity="0.4"/><line x1="28" y1="36" x2="72" y2="36" stroke="%2394A3B8" stroke-width="1"/></svg>`,
  dipTube: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100"><rect width="100" height="100" rx="12" fill="%23F0F9FF"/><circle cx="50" cy="50" r="32" fill="none" stroke="%2338BDF8" stroke-width="4.5"/><circle cx="50" cy="50" r="24" fill="none" stroke="%230284C7" stroke-width="3.5" stroke-dasharray="8,4"/><line x1="50" y1="16" x2="82" y2="50" stroke="%230284C7" stroke-width="3"/></svg>`
};

export const DEFAULT_WECHAT_QR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%2307C160" rx="16"/><rect x="10" y="10" width="180" height="180" fill="white" rx="12"/><path d="M40 40 h40 v40 h-40 z M48 48 h24 v24 h-24 z M56 56 h8 v8 h-8 z M120 40 h40 v40 h-40 z M128 48 h24 v24 h-24 z M136 56 h8 v8 h-8 z M40 120 h40 v40 h-40 z M48 128 h24 v24 h-24 z M56 136 h8 v8 h-8 z M90 40 h20 v20 h-20 z M100 70 h20 v30 h-20 z M130 90 h30 v20 h-30 z M90 120 h20 v40 h-20 z M120 120 h40 v20 h-40 z M140 150 h20 v10 h-20 z M100 100 h10 v10 h-10 z M120 100 h10 v10 h-10 z" fill="%2307C160"/><circle cx="100" cy="100" r="20" fill="%2307C160"/><path d="M91 97 C91 90 97 86 103 86 C109 86 115 90 115 97 C115 103 109 107 103 107 C101 107 100 108 98 109 L94 111 L95 107 C92 104 91 101 91 97 Z" fill="white"/></svg>`;

export const DEFAULT_ALIPAY_QR_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="%231677FF" rx="16"/><rect x="10" y="10" width="180" height="180" fill="white" rx="12"/><path d="M40 40 h40 v40 h-40 z M48 48 h24 v24 h-24 z M56 56 h8 v8 h-8 z M120 40 h40 v40 h-40 z M128 48 h24 v24 h-24 z M136 56 h8 v8 h-8 z M40 120 h40 v40 h-40 z M48 128 h24 v24 h-24 z M56 136 h8 v8 h-8 z M90 40 h20 v20 h-20 z M100 70 h20 v30 h-20 z M130 90 h30 v20 h-30 z M90 120 h20 v40 h-20 z M120 120 h40 v20 h-40 z M140 150 h20 v10 h-20 z M100 100 h10 v10 h-10 z M120 100 h10 v10 h-10 z" fill="%231677FF"/><circle cx="100" cy="100" r="20" fill="%231677FF"/><text x="100" y="106" font-family="sans-serif" font-weight="900" font-size="16" fill="white" text-anchor="middle">支</text></svg>`;

const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  logo: DEFAULT_LOGO_SVG,
  name: "Zhejiang Waimao International Trade Co., Ltd.",
  address: "No. 188 Century Avenue, International Trade Center, Ningbo, Zhejiang Prov., China",
  country: "China",
  phone: "0574-87008888",
  whatsapp: "+86 574 8700 8888",
  email: "export@waimaotools.com",
  website: "www.waimaotools.com",
  taxNumber: "91330200MA28Trade01(1/1)",
  stamp: DEFAULT_STAMP_SVG,
  secondaryStamp: DEFAULT_CONTRACT_STAMP_SVG,
  signature: DEFAULT_SIGNATURE_SVG,
  bankName: "BANK OF CHINA NINGBO BRANCH",
  accountName: "Zhejiang Waimao International Trade Co., Ltd.",
  accountNumber: "38920199201000088888",
  iban: "",
  swift: "BKCHCNBJ988",
  branch: "No. 188 Century Avenue, Ningbo, Zhejiang 315000",
  defaultCurrency: "USD",
  defaultTaxRate: 13,
  localBankName: "中国银行宁波分行",
  localAccountName: "外贸结算部",
  localAccountNumber: "6217009880103688888",
  wechatQr: DEFAULT_WECHAT_QR_SVG,
  alipayQr: DEFAULT_ALIPAY_QR_SVG,
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "28/410 Plastic Trigger Sprayer (MTS-01)",
    sku: "MTS-28410-A",
    size: "28/410",
    category: "Trigger Sprayers",
    description: "High-quality trigger sprayer with adjustable nozzle (Spray/Stream/Off). Smooth trigger action, leak-proof design. Standard dip tube length 25cm.",
    color: "White / Custom",
    material: "Polypropylene (PP)",
    weight: 0.024,
    price: 0.0495,
    moq: 10000,
    piecesPerBox: 500,
    cartonLength: 57,
    cartonWidth: 38,
    cartonHeight: 42,
    grossWeight: 13.2,
    netWeight: 12.0,
    barcode: "697100200301",
    hsCode: "3926.90.90",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Standard master export carton. Sleeved in packs of 100. Double corrugated cardboard box."
  },
  {
    id: "p2",
    name: "24/410 Ribbed Lotion Pump (MLP-02)",
    sku: "MLP-24410-B",
    size: "24/410",
    category: "Lotion Pumps",
    description: "Ribbed closure plastic lotion pump with lock-up pump mechanism. Smooth spring response, suitable for liquid soaps, shampoos, and cosmetic creams.",
    color: "Shiny Silver / Black",
    material: "PP & SUS304 Spring",
    weight: 0.018,
    price: 0.135,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 54,
    cartonWidth: 38,
    cartonHeight: 38,
    grossWeight: 19.5,
    netWeight: 18.0,
    barcode: "697100200302",
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Fitted with protective polybags. High pressure tested."
  },
  {
    id: "p3",
    name: "20/410 Fine Mist Sprayer (MMS-03)",
    sku: "MMS-20410-C",
    size: "20/410",
    category: "Fine Mist Sprayers",
    description: "Smooth skirt fine mist sprayer with clear plastic overcap. Perfect for cosmetic spray, perfume, face mist, or hair care products.",
    color: "Transparent / Gold Accent",
    material: "PP & PE",
    weight: 0.006,
    price: 0.075,
    moq: 20000,
    piecesPerBox: 2000,
    cartonLength: 50,
    cartonWidth: 38,
    cartonHeight: 35,
    grossWeight: 13.5,
    netWeight: 12.0,
    barcode: "697100200303",
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.mist,
    notes: "Dust-free packaging in double layers of clean PE bags."
  },
  {
    id: "p4",
    name: "100ml Amber PET Bottle (MPB-04)",
    sku: "MPB-100AMB",
    size: "24/410",
    category: "Spray Bottles",
    description: "Amber PET cylindrical round bottle, 100ml capacity, 24/410 neck finish. Highly durable, protects UV sensitive ingredients. Pairs perfectly with MLP-02 lotion pump.",
    color: "Amber",
    material: "PET (Polyethylene Terephthalate)",
    weight: 0.015,
    price: 0.085,
    moq: 10000,
    piecesPerBox: 400,
    cartonLength: 62,
    cartonWidth: 48,
    cartonHeight: 45,
    grossWeight: 7.2,
    netWeight: 6.0,
    barcode: "697100200304",
    hsCode: "3923.30.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.bottle,
    notes: "Carton lined with cardboard partitions to prevent scratching during shipment."
  },
  {
    id: "p5",
    name: "40mm Cosmetic Foam Pump (MFP-05)",
    sku: "MFP-40400-A",
    size: "40/400",
    category: "Foam Pumps",
    description: "40mm neck diameter foaming pump, dispatches dense, creamy foam directly without propellant. Ideal for facial wash, hand sanitizer, and baby wash.",
    color: "White",
    material: "PP & Stainless Steel",
    weight: 0.022,
    price: 0.185,
    moq: 5000,
    piecesPerBox: 500,
    cartonLength: 55,
    cartonWidth: 40,
    cartonHeight: 40,
    grossWeight: 12.2,
    netWeight: 11.0,
    barcode: "697100200305",
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foam,
    notes: "Avoid mixing with particulates. Shipped with lock clips."
  },
  {
    id: "p6",
    name: "50g Matte Black Cream Jar (MCJ-06)",
    sku: "MCJ-50-MB",
    size: "50g",
    category: "Cosmetic Packaging & Travel Sets",
    description: "Premium double-wall plastic cosmetic cream jar, 50g capacity. Outer wall acrylic, inner wall PP. Includes white PE disc gasket and black screw lid.",
    color: "Matte Black",
    material: "Acrylic Outer / PP Inner",
    weight: 0.035,
    price: 0.280,
    moq: 5000,
    piecesPerBox: 300,
    cartonLength: 50,
    cartonWidth: 50,
    cartonHeight: 30,
    grossWeight: 11.5,
    netWeight: 10.5,
    barcode: "697100200306",
    hsCode: "3923.90.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.jar,
    notes: "Individual compartments in the carton. Protected with soft foam sheets."
  },

  // PDF Page 1 Products
  {
    id: "p-cat-01",
    name: "20/24/28 Mouse Mini Trigger Sprayer (小老鼠喷头)",
    sku: "MTS-202428-STD",
    size: "20/410, 24/410, 28/410",
    category: "Trigger Sprayers",
    description: "Compact mouse mini trigger sprayer with ergonomic finger lever. Ideal for household cleaners, personal care hair mist, gardening, and disinfectant sprayers.",
    color: "Black / White / Custom",
    material: "PP (Polypropylene)",
    weight: 0.014,
    price: 0.042,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 56,
    cartonWidth: 38,
    cartonHeight: 42,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Factory price: ¥0.30 RMB (Anodized aluminum collar: ¥0.76 loose bulk, polybag +¥0.04). Packing: 24/410 (56x37x38cm, 1000pcs, 14/13kg), 28/410 (56x38x42cm, 1000pcs, 15/14kg), 20/410 (56x38x42cm, 1250pcs, 15/14kg)."
  },
  {
    id: "p-cat-02",
    name: "24/28 Mouse Trigger Sprayer - Smooth White (小老鼠光面白色)",
    sku: "MTS-2428-WHT",
    size: "24/410, 28/410",
    category: "Trigger Sprayers",
    description: "Streamlined smooth-hood mouse trigger sprayer with smooth actuator skirt, fine atomization output.",
    color: "White",
    material: "PP (Polypropylene)",
    weight: 0.014,
    price: 0.037,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 60,
    cartonWidth: 37,
    cartonHeight: 38,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Factory price: ¥0.265 RMB. Packing: 60x37x38cm, 1000 pcs (or 1200 pcs), G.W. 15.0kg, N.W. 14.0kg."
  },
  {
    id: "p-cat-03",
    name: "24/28 Mouse Trigger Sprayer with Lock Clip (小老鼠带夹子)",
    sku: "MTS-2428-LC",
    size: "24/410, 28/410",
    category: "Trigger Sprayers",
    description: "Mini mouse trigger sprayer equipped with safety lock clip to prevent accidental actuation during transport and storage.",
    color: "White / Translucent",
    material: "PP (Polypropylene)",
    weight: 0.014,
    price: 0.049,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 56,
    cartonWidth: 38,
    cartonHeight: 40,
    grossWeight: 14.5,
    netWeight: 13.5,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Factory price: ¥0.35 RMB. Packing: 56x38x40cm, 1000 pcs/ctn. G.W. 14.5kg, N.W. 13.5kg."
  },
  {
    id: "p-cat-04",
    name: "24/28 Mouse Trigger Sprayer - Slanted Top Handle (小老鼠斜顶喷枪)",
    sku: "MTS-2428-SLT",
    size: "24/410, 28/410",
    category: "Trigger Sprayers",
    description: "Ergonomic slanted-top mini trigger sprayer for comfortable multi-angle spraying and continuous trigger pull.",
    color: "White / Natural",
    material: "PP (Polypropylene)",
    weight: 0.014,
    price: 0.043,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 57,
    cartonWidth: 39,
    cartonHeight: 47,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Factory price: ¥0.31 RMB. Packing: 24/410 (56x38x42cm, 1000pcs), 28/410 (57x39x47cm, 1000pcs)."
  },
  {
    id: "p-cat-05",
    name: "Model A Heavy Duty Trigger Sprayer (A枪喷雾器)",
    sku: "HTS-A28-BLU",
    size: "28/400, 28/410",
    category: "Trigger Sprayers",
    description: "Classic Model A industrial and household trigger sprayer with blue/white heavy duty actuator and adjustable spray/stream nozzle.",
    color: "Blue & White",
    material: "PP (Polypropylene)",
    weight: 0.022,
    price: 0.049,
    moq: 10000,
    piecesPerBox: 500,
    cartonLength: 59,
    cartonWidth: 38,
    cartonHeight: 37,
    grossWeight: 11.6,
    netWeight: 10.6,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Factory price: ¥0.35 RMB (with dip tube) / ¥0.34 RMB (without dip tube). Packing: 59x38x37cm, 500 pcs/ctn. G.W. 11.6kg, N.W. 10.6kg."
  },
  {
    id: "p-cat-06",
    name: "Model D Heavy Duty Trigger Sprayer (D枪喷雾器)",
    sku: "HTS-D28-YEL",
    size: "28/400, 28/410",
    category: "Trigger Sprayers",
    description: "Heavy-duty Model D trigger sprayer with yellow nozzle shroud, ergonomic grip, high output 1.0-1.2ml discharge.",
    color: "Yellow & White",
    material: "PP (Polypropylene)",
    weight: 0.027,
    price: 0.068,
    moq: 20000,
    piecesPerBox: 500,
    cartonLength: 57,
    cartonWidth: 33,
    cartonHeight: 46,
    grossWeight: 14.0,
    netWeight: 13.0,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Tiered factory price (without tube): 20k @ ¥0.49, 50k @ ¥0.47, 100k @ ¥0.46 RMB. Packing: 28/400 (57x33x46cm, G.W. 14kg, N.W. 13kg), 28/410 (57x33x46cm, G.W. 14.5kg, N.W. 13.5kg)."
  },
  {
    id: "p-cat-07",
    name: "24/28 Anodized Aluminum Lotion Pump (电化铝乳液泵)",
    sku: "ALP-2428-ALU",
    size: "24/410, 28/410",
    category: "Lotion Pumps",
    description: "Luxury aluminum-collared cosmetic lotion pump with shiny metallic sheath and smooth white actuator.",
    color: "Shiny Silver / White",
    material: "PP & Anodized Aluminum",
    weight: 0.015,
    price: 0.088,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 60,
    cartonWidth: 37,
    cartonHeight: 38,
    grossWeight: 15.5,
    netWeight: 14.5,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: ¥0.62 / ¥0.65 RMB. Packing: 60x37x38cm, 1000 pcs (15.5/14.5kg) or 1200 pcs (15.0/14.0kg)."
  },

  // PDF Page 2 Products
  {
    id: "p-cat-08",
    name: "43/410 Soft Silicone Brush Cleansing Foam Pump (43牙硅胶刷头泡沫泵)",
    sku: "FMB-43410-PNK",
    size: "43/410",
    category: "Foam Pumps",
    description: "Facial cleansing foam pump with soft pink silicone massage brush head and clear protective overcap for daily deep pore facial cleansing.",
    color: "Pink & White",
    material: "PP & Food-Grade Silicone",
    weight: 0.043,
    price: 0.118,
    moq: 5000,
    piecesPerBox: 300,
    cartonLength: 60,
    cartonWidth: 40,
    cartonHeight: 46,
    grossWeight: 13.5,
    netWeight: 12.5,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foamBrush,
    notes: "Factory price: ¥0.85 RMB. Packing: 60x40x46cm, 300 pcs/ctn. G.W. 13.5kg, N.W. 12.5kg."
  },
  {
    id: "p-cat-09",
    name: "40/410 High Volume Cosmetic Foam Pump (40牙双头/标准泡沫泵)",
    sku: "FMP-40410-STD",
    size: "40/410",
    category: "Foam Pumps",
    description: "High volume 40/410 cosmetic foaming dispenser pump creating thick, rich lather without propellant gases.",
    color: "White & Translucent",
    material: "PP (Polypropylene)",
    weight: 0.024,
    price: 0.108,
    moq: 5000,
    piecesPerBox: 700,
    cartonLength: 62,
    cartonWidth: 38,
    cartonHeight: 43,
    grossWeight: 17.0,
    netWeight: 16.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foam,
    notes: "Factory price: ¥0.78 RMB. Packing: 62x38x43cm, 700 pcs/ctn. G.W. 17.0kg, N.W. 16.0kg."
  },
  {
    id: "p-cat-10",
    name: "43/410 Bristle Brush Cleansing Foam Pump (43牙毛刷泡沫泵 - 硅胶/硬毛刷)",
    sku: "FMB-43410-BRS",
    size: "43/410",
    category: "Foam Pumps",
    description: "Cleansing brush foam pump available with soft silicone or firm bristle brush head for face wash and deep pore exfoliating.",
    color: "White & Light Blue",
    material: "PP, Silicone / Nylon",
    weight: 0.030,
    price: 0.118,
    moq: 5000,
    piecesPerBox: 500,
    cartonLength: 60,
    cartonWidth: 40,
    cartonHeight: 46,
    grossWeight: 15.5,
    netWeight: 14.5,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foamBrush,
    notes: "Factory price: Silicone brush ¥0.85 RMB, Hard bristle brush ¥0.90 RMB. Packing: 60x40x46cm, 500 pcs/ctn. G.W. 15.5kg, N.W. 14.5kg."
  },
  {
    id: "p-cat-11",
    name: "42/410 Standard Foam Pump with Clear Dust Cap (42牙标准泡沫泵)",
    sku: "FMP-42410-CLR",
    size: "42/410",
    category: "Foam Pumps",
    description: "42/410 neck foaming soap pump with transparent dust cover cap. Smooth press action, instant dense foam generation.",
    color: "White & Clear",
    material: "PP & PE",
    weight: 0.029,
    price: 0.074,
    moq: 5000,
    piecesPerBox: 500,
    cartonLength: 62,
    cartonWidth: 38,
    cartonHeight: 43,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foam,
    notes: "Factory price: ¥0.53 RMB. Packing: 62x38x43cm, 500 pcs/ctn. G.W. 15.0kg, N.W. 14.0kg."
  },
  {
    id: "p-cat-12",
    name: "40/410 Foam Pump with Teal Accent Actuator (40牙青色泡沫泵)",
    sku: "FMP-40410-TEA",
    size: "40/410",
    category: "Foam Pumps",
    description: "40/410 cosmetic foam pump with custom vibrant teal accent actuator and smooth press dispensing mechanism.",
    color: "Teal & White",
    material: "PP (Polypropylene)",
    weight: 0.024,
    price: 0.108,
    moq: 5000,
    piecesPerBox: 700,
    cartonLength: 62,
    cartonWidth: 38,
    cartonHeight: 43,
    grossWeight: 17.0,
    netWeight: 16.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foam,
    notes: "Factory price: ¥0.78 RMB. Packing: 62x38x43cm, 700 pcs/ctn. G.W. 17.0kg, N.W. 16.0kg."
  },
  {
    id: "p-cat-13",
    name: "18/20/24/28 Anodized Aluminum Fine Mist Sprayer (电化铝小喷雾)",
    sku: "AMS-1828-ALU",
    size: "18/410, 20/410, 24/410, 28/410",
    category: "Fine Mist Sprayers",
    description: "Premium anodized aluminum ferrule fine mist sprayer with clear hood. Excellent atomization for toner, perfumes, and facial mist.",
    color: "Shiny Silver / Gold / White",
    material: "Anodized Aluminum & PP",
    weight: 0.006,
    price: 0.061,
    moq: 10000,
    piecesPerBox: 2000,
    cartonLength: 56,
    cartonWidth: 38,
    cartonHeight: 42,
    grossWeight: 13.5,
    netWeight: 12.5,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.mist,
    notes: "Factory price: 18/410 (¥0.42), 20/410 (¥0.42), 24/410 (¥0.44), 28/410 (¥0.48). Packing: 18/410: 57x33x39cm, 2500pcs (14/12kg); 20/410: 57x33x39cm (15.5/14.5kg); 24/410: 56x38x42cm, 2000pcs (13.5/12.5kg); 28/410: 57x33x39cm, 1500pcs (14/13kg)."
  },

  // PDF Page 3 Products
  {
    id: "p-cat-14",
    name: "28/410 4cc High Output Lotion Pump (28牙4CC大排量乳液泵)",
    sku: "HLP-28410-4CC",
    size: "28/410",
    category: "Lotion Pumps",
    description: "Heavy-duty 4.0ml dosage lotion dispenser pump with extended spout. Suitable for large shampoo, conditioner, body wash, and industrial liquid soap.",
    color: "White",
    material: "PP & Stainless Steel Spring",
    weight: 0.022,
    price: 0.065,
    moq: 10000,
    piecesPerBox: 834,
    cartonLength: 56,
    cartonWidth: 38,
    cartonHeight: 44,
    grossWeight: 19.0,
    netWeight: 18.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: ¥0.47 RMB. Packing: 56x38x44cm, 834 pcs/ctn. G.W. 19.0kg, N.W. 18.0kg."
  },
  {
    id: "p-cat-15",
    name: "33/410 4cc High Output Lotion Pump - Black (33牙4CC大排量乳液泵)",
    sku: "HLP-33410-BLK",
    size: "33/410",
    category: "Lotion Pumps",
    description: "33/410 wide-neck 4.0ml high output liquid pump with matte black finish and heavy-duty spring.",
    color: "Black",
    material: "PP & Stainless Steel Spring",
    weight: 0.026,
    price: 0.065,
    moq: 10000,
    piecesPerBox: 550,
    cartonLength: 85,
    cartonWidth: 40,
    cartonHeight: 38,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: ¥0.47 RMB. Packing: 85x40x38cm, 550 pcs/ctn. G.W. 15.0kg, N.W. 14.0kg."
  },
  {
    id: "p-cat-16",
    name: "Continuous High-Pressure Fine Mist Spray Bottle (持续高压喷雾瓶 200ml/300ml/500ml)",
    sku: "CFS-FLA-SET",
    size: "200ml, 300ml, 500ml",
    category: "Spray Bottles",
    description: "Flairosol-style continuous ultra-fine mist spray bottle. Continuous aerosol-free spray with prolonged misting action. Ideal for hair salons, barber shops, plant care, and disinfection.",
    color: "White / Gradient / Custom",
    material: "PET Bottle + PP Engine",
    weight: 0.080,
    price: 0.360,
    moq: 1000,
    piecesPerBox: 100,
    cartonLength: 62.5,
    cartonWidth: 38.5,
    cartonHeight: 50.5,
    grossWeight: 12.6,
    netWeight: 4.2,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.continuousSprayer,
    notes: "Factory combo price: 200ml (¥2.50), 300ml (¥2.60), 500ml (¥2.70). Individual box: +¥0.32/pc, custom color: +¥0.05/pc. Packing (100pcs with box): 200ml (60.5x38.5x42cm, G.W.11.1kg); 300ml (62.5x38.5x50.5cm, G.W.12.6kg); 500ml (70x38.5x58.5cm, G.W.14.7kg)."
  },

  // PDF Page 4 Products
  {
    id: "p-cat-17",
    name: "24/28 Standard Ribbed Lotion Pump (24/28牙常规乳液泵)",
    sku: "SLP-2428-STD",
    size: "24/410, 28/410",
    category: "Lotion Pumps",
    description: "Standard 2.0ml cosmetic lotion pump with ribbed collar and lock-up mechanism.",
    color: "White",
    material: "PP (Polypropylene)",
    weight: 0.014,
    price: 0.033,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 56,
    cartonWidth: 38,
    cartonHeight: 42,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: ¥0.24 RMB. Packing: 56x38x42cm, 1000 pcs/ctn. G.W. 15.0kg, N.W. 14.0kg."
  },
  {
    id: "p-cat-18",
    name: "24/28 2nd Gen Duckbill Lotion Pump (二代鸭嘴乳液泵)",
    sku: "DLP-2428-GEN2",
    size: "24/410, 28/410",
    category: "Lotion Pumps",
    description: "Modern 2nd generation duckbill style lotion pump with sleek aesthetic and smooth downward dispensing.",
    color: "White",
    material: "PP (Polypropylene)",
    weight: 0.014,
    price: 0.035,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 56,
    cartonWidth: 38,
    cartonHeight: 42,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: ¥0.25 RMB. Packing: 56x38x42cm, 1000 pcs/ctn. G.W. 15.0kg, N.W. 14.0kg."
  },
  {
    id: "p-cat-19",
    name: "24/28 Clear Transparent Mouse Trigger Sprayer (小老鼠全透明喷头)",
    sku: "MTS-2428-CLR",
    size: "24/410, 28/410",
    category: "Trigger Sprayers",
    description: "Fully transparent clear body mouse trigger sprayer for cosmetics and beauty mists.",
    color: "Clear Transparent",
    material: "PP / PETG",
    weight: 0.014,
    price: 0.049,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 57,
    cartonWidth: 39,
    cartonHeight: 47,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Factory price: ¥0.35 RMB. Packing: 28/410 (57x39x47cm, 1000pcs, 15/14kg); 24/410 (56x38x43cm, 1000pcs, 14/12kg)."
  },
  {
    id: "p-cat-20",
    name: "24/28 Left-Right Switch Lock Lotion Pump (开关泵 / 左右锁乳液泵)",
    sku: "KLP-2428-SWT",
    size: "24/410, 28/410",
    category: "Lotion Pumps",
    description: "Convenient left-right switch lock lotion pump (turn left to lock, turn right to dispense), preventing leaks without pushing actuator down.",
    color: "Black / White",
    material: "PP (Polypropylene)",
    weight: 0.015,
    price: 0.078,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 56,
    cartonWidth: 38,
    cartonHeight: 42,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: 24/410 (¥0.56), 28/410 (¥0.60). Tiered for ≥50k pcs: 24/410 @ ¥0.53, 28/410 @ ¥0.58 (tube length ≤150mm). Packing: 28/410 (56x38x42cm, 15/14kg), 24/410 (56x38x40cm, 14/13kg)."
  },
  {
    id: "p-cat-21",
    name: "20/24/28 Clip Lock Cosmetic Lotion Pump (夹子乳液泵)",
    sku: "CLP-2028-PNK",
    size: "20/410, 24/410, 28/410",
    category: "Lotion Pumps",
    description: "Cosmetic lotion pump with snap-on plastic safety clip collar. Available in pastel pink and custom Pantone shades.",
    color: "Pastel Pink / Custom",
    material: "PP (Polypropylene)",
    weight: 0.010,
    price: 0.032,
    moq: 10000,
    piecesPerBox: 2000,
    cartonLength: 60,
    cartonWidth: 40,
    cartonHeight: 50,
    grossWeight: 20.0,
    netWeight: 19.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: 20/410 (¥0.22), 24/410 (¥0.23), 28/410 (¥0.28). Custom colors <30k pcs: ¥0.25-0.26. Packing: 20/410 (60x40x50cm, 2500pcs, 22/21kg); 24/410 (60x40x50cm, 2000pcs, 20/19kg); 28/410 (60x37x38cm, 1000pcs, 11/10kg)."
  },
  {
    id: "p-cat-22",
    name: "Model B Heavy Duty Trigger Sprayer (B枪喷雾器)",
    sku: "HTS-B28-YEL",
    size: "28/400, 28/410",
    category: "Trigger Sprayers",
    description: "Heavy-duty Model B trigger sprayer with yellow nozzle and ribbed/smooth screw collar.",
    color: "Yellow & White",
    material: "PP (Polypropylene)",
    weight: 0.021,
    price: 0.086,
    moq: 10000,
    piecesPerBox: 500,
    cartonLength: 57,
    cartonWidth: 33,
    cartonHeight: 40,
    grossWeight: 11.5,
    netWeight: 10.5,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Tiered factory price: 10k @ ¥0.62, 50k @ ¥0.60, 100k @ ¥0.59 RMB. Packing: B-400 (57x33x39cm, G.W. 11kg, N.W. 10kg); B-410 (57x33x40cm, G.W. 11.5kg, N.W. 10.5kg)."
  },
  {
    id: "p-cat-23",
    name: "24/28 Luxury Mini Trigger Sprayer with Blue Insert (豪华小老鼠喷头)",
    sku: "MTS-2428-BLU",
    size: "24/410, 28/410",
    category: "Trigger Sprayers",
    description: "Premium mini trigger sprayer with blue accent nozzle and high precision atomizing core.",
    color: "White & Blue",
    material: "PP (Polypropylene)",
    weight: 0.008,
    price: 0.111,
    moq: 5000,
    piecesPerBox: 2945,
    cartonLength: 60,
    cartonWidth: 40,
    cartonHeight: 50,
    grossWeight: 22.5,
    netWeight: 21.5,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Factory price: ¥0.80 RMB. Packing: 60x40x50cm, 2945 pcs/ctn. G.W. 22.5kg, N.W. 21.5kg."
  },

  // PDF Page 5 Products
  {
    id: "p-cat-24",
    name: "24/28 Large Mouse Trigger Sprayer (大老鼠高排量喷头)",
    sku: "MTS-2428-BIG",
    size: "24/410, 28/410",
    category: "Trigger Sprayers",
    description: "Large profile mouse trigger sprayer with wide ergonomic trigger lever and higher discharge volume.",
    color: "White",
    material: "PP (Polypropylene)",
    weight: 0.018,
    price: 0.054,
    moq: 10000,
    piecesPerBox: 500,
    cartonLength: 57,
    cartonWidth: 32,
    cartonHeight: 38,
    grossWeight: 10.0,
    netWeight: 9.0,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Factory price: ¥0.39 RMB. Packing: 28/410 (57x32x38cm, 500pcs, 10/9kg); 24/410 (57x32x34cm, 500pcs, 9/8kg)."
  },
  {
    id: "p-cat-25",
    name: "42/410 Clip Lock Foam Pump (42牙夹子泡沫泵)",
    sku: "FMP-42410-CLP",
    size: "42/410",
    category: "Foam Pumps",
    description: "42mm cosmetic foaming pump with protective clip mechanism to prevent inadvertent pump compression.",
    color: "White",
    material: "PP (Polypropylene)",
    weight: 0.027,
    price: 0.074,
    moq: 5000,
    piecesPerBox: 500,
    cartonLength: 60,
    cartonWidth: 40,
    cartonHeight: 42,
    grossWeight: 14.5,
    netWeight: 13.5,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foam,
    notes: "Factory price: ¥0.53 RMB. Packing: 60x40x42cm, 500 pcs/ctn. G.W. 14.5kg, N.W. 13.5kg."
  },
  {
    id: "p-cat-26",
    name: "30mm Travel Foam Pump with Full Overcap (30牙带罩泡沫泵)",
    sku: "FMP-30410-OVC",
    size: "30/410 (30mm)",
    category: "Foam Pumps",
    description: "30mm compact foaming pump with full-length transparent dust overcap. Ideal for travel facial wash and pocket foamers.",
    color: "White & Clear",
    material: "PP & Clear Cap",
    weight: 0.029,
    price: 0.076,
    moq: 5000,
    piecesPerBox: 500,
    cartonLength: 62,
    cartonWidth: 38,
    cartonHeight: 43,
    grossWeight: 15.5,
    netWeight: 14.5,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foam,
    notes: "Factory price: ¥0.55 RMB. Packing: 62x38x43cm, 500 pcs/ctn. G.W. 15.5kg, N.W. 14.5kg."
  },
  {
    id: "p-cat-27",
    name: "30mm Wing Nozzle Foam Pump (30牙翅嘴泡沫泵)",
    sku: "FMP-30410-WNG",
    size: "30/410 (30mm)",
    category: "Foam Pumps",
    description: "30mm foaming pump with curved wing actuator spout for precise palm dispensing.",
    color: "White",
    material: "PP (Polypropylene)",
    weight: 0.034,
    price: 0.061,
    moq: 5000,
    piecesPerBox: 500,
    cartonLength: 62,
    cartonWidth: 38,
    cartonHeight: 43,
    grossWeight: 18.0,
    netWeight: 17.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foam,
    notes: "Factory price: ¥0.44 RMB. Packing: 62x38x43cm, 500 pcs/ctn. G.W. 18.0kg, N.W. 17.0kg."
  },
  {
    id: "p-cat-28",
    name: "40/400 Cosmetic Foam Pump - Mint Green (40/400 薄荷绿泡沫泵)",
    sku: "FMP-40400-MNT",
    size: "40/400",
    category: "Foam Pumps",
    description: "40/400 foam pump with custom pastel mint green collar and smooth white actuator.",
    color: "Mint Green & White",
    material: "PP (Polypropylene)",
    weight: 0.018,
    price: 0.118,
    moq: 5000,
    piecesPerBox: 625,
    cartonLength: 30,
    cartonWidth: 40,
    cartonHeight: 50,
    grossWeight: 12.0,
    netWeight: 11.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.foam,
    notes: "Factory price: ¥0.85 RMB. Packing: 30x40x50cm, 625 pcs/ctn. G.W. 12.0kg, N.W. 11.0kg."
  },
  {
    id: "p-cat-29",
    name: "24/28 Duckbill & Custom Actuator Lotion Pump (24/28牙鸭嘴及定制头帽乳液泵)",
    sku: "DLP-2428-CUS",
    size: "24/410, 28/410",
    category: "Lotion Pumps",
    description: "Versatile lotion pump with interchangeable duckbill or customized actuator heads.",
    color: "White",
    material: "PP (Polypropylene)",
    weight: 0.014,
    price: 0.032,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 56,
    cartonWidth: 38,
    cartonHeight: 42,
    grossWeight: 15.0,
    netWeight: 14.0,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: Duckbill ¥0.23 RMB, Other caps ¥0.24 RMB. Packing: 28/410 (56x38x42cm, 1000pcs, 15/14kg); 24/410 (56x38x40cm, 1000pcs, 14/13kg); Big Cap (56x38x42cm, 835pcs, 12/11kg)."
  },

  // PDF Page 6 Products
  {
    id: "p-cat-30",
    name: "24/28 Dual Chamber Dispensing Pump Head (24/28牙双层组合泵头)",
    sku: "DSP-2428-DUO",
    size: "24/410, 28/410",
    category: "Lotion Pumps",
    description: "Specialized dual spray/pump component mechanism for dual-chamber cosmetic bottles and two-phase formulas.",
    color: "White",
    material: "PP (Polypropylene)",
    weight: 0.019,
    price: 0.069,
    moq: 5000,
    piecesPerBox: 835,
    cartonLength: 57,
    cartonWidth: 38,
    cartonHeight: 42,
    grossWeight: 16.5,
    netWeight: 15.5,
    hsCode: "8413.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Factory price: ¥0.50 RMB. Packing: 24/410 (57x38x42cm, 835pcs, 16/15kg); 28/410 (57x38x42cm, 835pcs, 17/16kg)."
  },
  {
    id: "p-cat-31",
    name: "15mm/18mm/20mm Gold Anodized Perfume Crimp Atomizer (卡扣金盖香水喷头)",
    sku: "PFS-1520-GLD",
    size: "15mm, 18mm, 20mm",
    category: "Perfume Atomizers",
    description: "Luxury gold anodized perfume atomizer crimp/bayonet pump for glass fragrance bottles. Provides ultra-fine mist dispersion.",
    color: "Shiny Gold",
    material: "Anodized Aluminum + PP",
    weight: 0.006,
    price: 0.042,
    moq: 10000,
    piecesPerBox: 2500,
    cartonLength: 47,
    cartonWidth: 33,
    cartonHeight: 34,
    grossWeight: 14.5,
    netWeight: 13.5,
    hsCode: "8424.89.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.mist,
    notes: "Factory price: 15mm (¥0.26), 18mm (¥0.35), 20mm (¥0.35). Packing: 15mm clip (tube<100mm: 47x33x34cm; tube>100mm: 47x33x40cm, 14.5kg); 18mm clip (56x32x38cm, 16kg); 20mm clip (56x32x40cm, 17kg)."
  },
  {
    id: "p-cat-32",
    name: "20ml Pocket Card Mist Spray Bottle (20ml 卡片便携喷雾瓶)",
    sku: "PSB-20ML-CRD",
    size: "20ml",
    category: "Spray Bottles",
    description: "Slim credit-card pocket mist spray bottle, 20ml capacity. Highly portable for hand sanitizer, breath spray, and perfume.",
    color: "White / Translucent",
    material: "PP (Polypropylene)",
    weight: 0.016,
    price: 0.044,
    moq: 10000,
    piecesPerBox: 1000,
    cartonLength: 56,
    cartonWidth: 35,
    cartonHeight: 34,
    grossWeight: 17.0,
    netWeight: 16.0,
    hsCode: "3923.30.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.cardSprayer,
    notes: "Factory price: ¥0.32 RMB / set. Packing: 56x35x34cm, 1000 sets/ctn. G.W. 17.0kg, N.W. 16.0kg."
  },

  // PDF Page 10 & 11 Products
  {
    id: "p-cat-33",
    name: "9-Piece Travel Cosmetic Dispenser Bottle Kit (9件套旅行分装瓶套装)",
    sku: "TBK-9PCS-SET",
    size: "60ml*2 + 80ml*2 + Jars + Sprayers + Funnel + Pouch",
    category: "Cosmetic Packaging & Travel Sets",
    description: "Complete 9-in-1 travel toiletries kit including 2x 60ml PET bottles, 2x 80ml PET bottles, 2x disc press caps, 2x fine mist sprayers, 2x cream jars, 1x mini funnel, packed in a transparent zipper travel pouch with hang tag.",
    color: "Clear / Pink / White",
    material: "PET Bottles + PP Closures + PVC Pouch",
    weight: 0.110,
    price: 0.320,
    moq: 2000,
    piecesPerBox: 100,
    cartonLength: 60,
    cartonWidth: 40,
    cartonHeight: 35,
    grossWeight: 12.0,
    netWeight: 10.5,
    hsCode: "3923.30.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.travelKit,
    notes: "Component breakdown: 60ml bottle (¥0.15-0.20*2), 80ml bottle (¥0.15-0.20*2), disc cap (¥0.08-0.09*2), spray head (¥0.10-0.15*2), cream jar (¥0.15-0.18*2), funnel (¥0.03-0.05), zipper pouch (¥0.38-0.40), labor & tag (¥0.32-0.36), carton (¥0.10). Total kit: ~¥1.85 - ¥2.45 RMB ($0.26 - $0.35 USD)."
  },

  // Component Presets
  {
    id: "p7",
    name: "Spring for liquid soap pump",
    sku: "SPR-LSP-01",
    category: "Pump & Atomizer Components",
    description: "Stainless steel spring for liquid soap pump mechanism. High corrosion resistance.",
    color: "Silver",
    material: "SUS304 Stainless Steel",
    weight: 0.001,
    price: 0.004448,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 30,
    cartonWidth: 30,
    cartonHeight: 25,
    grossWeight: 10.0,
    netWeight: 9.5,
    barcode: "",
    hsCode: "7320.20.00",
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Price per 10,000 pcs: $44.48 ($0.004448 / unit)."
  },
  {
    id: "p8",
    name: "Pad for liquid soap pump",
    sku: "PAD-LSP-02",
    category: "Pump & Atomizer Components",
    description: "Sealing pad gasket for liquid soap pump valve assembly.",
    color: "White",
    material: "PE",
    weight: 0.0005,
    price: 0.000800,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 25,
    cartonWidth: 25,
    cartonHeight: 20,
    grossWeight: 5.0,
    netWeight: 4.8,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Price per 10,000 pcs: $8.00 ($0.000800 / unit)."
  },
  {
    id: "p9",
    name: "Glass ball for liquid soap pump",
    sku: "GLB-LSP-03",
    category: "Pump & Atomizer Components",
    description: "Precision glass ball valve element for liquid soap pump intake.",
    color: "Clear",
    material: "High-grade Glass",
    weight: 0.0003,
    price: 0.000506,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 20,
    cartonWidth: 20,
    cartonHeight: 15,
    grossWeight: 3.5,
    netWeight: 3.2,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Price per 10,000 pcs: $5.06 ($0.000506 / unit)."
  },
  {
    id: "p10",
    name: "Spring for atomizer",
    sku: "SPR-ATM-04",
    category: "Pump & Atomizer Components",
    description: "Precision spring for fine mist atomizer mechanism.",
    color: "Silver",
    material: "SUS304 Stainless Steel",
    weight: 0.0008,
    price: 0.003687,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 30,
    cartonWidth: 30,
    cartonHeight: 25,
    grossWeight: 8.5,
    netWeight: 8.0,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Price per 10,000 pcs: $36.87 ($0.003687 / unit)."
  },
  {
    id: "p11",
    name: "Pad for atomizer",
    sku: "PAD-ATM-05",
    category: "Pump & Atomizer Components",
    description: "Gasket sealing pad for fine mist atomizer pump.",
    color: "White",
    material: "PE",
    weight: 0.0005,
    price: 0.000800,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 25,
    cartonWidth: 25,
    cartonHeight: 20,
    grossWeight: 5.0,
    netWeight: 4.8,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Price per 10,000 pcs: $8.00 ($0.000800 / unit)."
  },
  {
    id: "p12",
    name: "Glass ball for atomizer",
    sku: "GLB-ATM-06",
    category: "Pump & Atomizer Components",
    description: "Precision micro glass ball valve for atomizer engine.",
    color: "Clear",
    material: "High-grade Glass",
    weight: 0.0002,
    price: 0.000370,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 20,
    cartonWidth: 20,
    cartonHeight: 15,
    grossWeight: 2.5,
    netWeight: 2.2,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Price per 10,000 pcs: $3.70 ($0.000370 / unit)."
  }
];

const DEFAULT_CLIENTS: Client[] = [
  {
    id: "c1",
    company: "Global Packaging Corp",
    contactPerson: "Sarah Jenkins",
    address: "100 Packing Way, Suite 400, Chicago, IL 60601",
    phone: "+1 (312) 555-0199",
    email: "sjenkins@globalpkg.com",
    country: "United States",
    notes: "Key accounts client. Requires customs document drafts 3 days prior to shipping."
  },
  {
    id: "c2",
    company: "EuroTrade Importers GmbH",
    contactPerson: "Hans Müller",
    address: "Industriestrasse 12, Building B, 80331 München",
    phone: "+49 89 1234567",
    email: "h.mueller@eurotrade.de",
    country: "Germany",
    notes: "Standard EUR pallet stacking required. Double check HS code description for German customs."
  },
  {
    id: "c3",
    company: "Asia Logistics Group Ltd",
    contactPerson: "Wei Zhang",
    address: "12 Changi South Ave 2, Singapore 486354",
    phone: "+65 6789 0123",
    email: "zhang.wei@asialog.sg",
    country: "Singapore",
    notes: "Vessel shipping preference: APL or Maersk line."
  },
  {
    id: "c4",
    company: "LATAM Distribuidora S.A.",
    contactPerson: "Maria Gomez",
    address: "Av. Paseo de la Reforma 500, Colonia Juarez, CDMX 06600",
    phone: "+52 55 5555 1234",
    email: "mgomez@latamdist.mx",
    country: "Mexico",
    notes: "Needs both English and Spanish descriptions if possible in notes."
  }
];

// Seed initial invoices and packing lists
const DEFAULT_INVOICES = (clients: Client[], products: Product[]): Invoice[] => [
  {
    id: "i1",
    invoiceNumber: "INV-000001",
    date: "2026-06-15",
    dueDate: "2026-07-15",
    currency: "USD",
    salesperson: "Andrew Admin",
    client: clients[0],
    items: [
      {
        id: "ii1",
        productId: products[0].id,
        name: products[0].name,
        sku: products[0].sku,
        size: "28/410",
        description: products[0].description,
        unitPrice: products[0].price,
        quantity: 50000,
        piecesPerBox: products[0].piecesPerBox,
        numBoxes: 100,
        totalPieces: 50000,
        totalPrice: 5750,
        image: products[0].image
      },
      {
        id: "ii2",
        productId: products[1].id,
        name: products[1].name,
        sku: products[1].sku,
        size: "24/410",
        description: products[1].description,
        unitPrice: products[1].price,
        quantity: 20000,
        piecesPerBox: products[1].piecesPerBox,
        numBoxes: 20,
        totalPieces: 20000,
        totalPrice: 2700,
        image: products[1].image
      }
    ],
    shippingFee: 950,
    insurance: 150,
    taxRate: 13,
    taxAmount: 1043.58,
    discountRate: 5,
    discountAmount: 422.50,
    otherCharges: 0,
    notes: "Goods ready for sea shipping. Origin: China.",
    terms: "30% advance, 70% against draft documents.",
    subtotal: 8450,
    grandTotal: 10171.08,
    createdAt: "2026-06-15T10:30:00Z"
  },
  {
    id: "i2",
    invoiceNumber: "INV-000002",
    date: "2026-07-02",
    dueDate: "2026-08-02",
    currency: "USD",
    salesperson: "Andrew Admin",
    client: clients[1],
    items: [
      {
        id: "ii3",
        productId: products[2].id,
        name: products[2].name,
        sku: products[2].sku,
        size: "20/410",
        description: products[2].description,
        unitPrice: products[2].price,
        quantity: 40000,
        piecesPerBox: products[2].piecesPerBox,
        numBoxes: 20,
        totalPieces: 40000,
        totalPrice: 3000,
        image: products[2].image
      }
    ],
    shippingFee: 1100,
    insurance: 100,
    taxRate: 13,
    taxAmount: 390,
    discountRate: 0,
    discountAmount: 0,
    otherCharges: 0,
    notes: "Standard Euro pallets packaging. Urgent delivery required.",
    terms: "Letter of Credit at sight.",
    subtotal: 3000,
    grandTotal: 4590,
    createdAt: "2026-07-02T14:15:00Z"
  }
];

const DEFAULT_PACKING_LISTS = (clients: Client[], products: Product[]): PackingList[] => [
  {
    id: "pl1",
    packingListNumber: "PL-000001",
    containerNumber: "MSKU8847291",
    sealNumber: "CN-993821",
    shipmentDate: "2026-06-18",
    portOfLoading: "Ningbo Port, China",
    portOfDestination: "Port of Rotterdam, Netherlands",
    containerType: "20FT",
    shippingType: "FOB",
    client: clients[0],
    items: [
      {
        id: "pli1",
        productId: products[0].id,
        name: products[0].name,
        sku: products[0].sku,
        size: "28/410",
        quantity: 50000,
        numBoxes: 100,
        piecesPerBox: products[0].piecesPerBox,
        totalPieces: 50000,
        grossWeight: 1320,
        netWeight: 1200,
        cartonLength: 57,
        cartonWidth: 38,
        cartonHeight: 42,
        cbm: 9.097,
        image: products[0].image
      },
      {
        id: "pli2",
        productId: products[1].id,
        name: products[1].name,
        sku: products[1].sku,
        size: "24/410",
        quantity: 20000,
        numBoxes: 20,
        piecesPerBox: products[1].piecesPerBox,
        totalPieces: 20000,
        grossWeight: 390,
        netWeight: 360,
        cartonLength: 54,
        cartonWidth: 38,
        cartonHeight: 38,
        cbm: 1.559,
        image: products[1].image
      }
    ],
    totalCbm: 10.656,
    totalCartons: 120,
    totalPieces: 70000,
    totalWeight: 1710,
    notes: "Palletized and secured in 20FT Dry Container. Fragile handling requested.",
    createdAt: "2026-06-18T11:00:00Z"
  }
];

const DEFAULT_SAMPLE_INVOICES = (clients: Client[], products: Product[]): SampleInvoice[] => [
  {
    id: "s1",
    sampleInvoiceNumber: "SI-000001",
    date: "2026-07-05",
    currency: "USD",
    client: clients[2],
    items: [
      {
        id: "si1",
        productId: products[0].id,
        name: products[0].name,
        sku: products[0].sku,
        size: "28/410",
        quantity: 50,
        piecesPerBox: products[0].piecesPerBox,
        numBoxes: 1,
        totalPieces: 50,
        image: products[0].image
      },
      {
        id: "si2",
        productId: products[4].id,
        name: products[4].name,
        sku: products[4].sku,
        size: "40/400",
        quantity: 20,
        piecesPerBox: products[4].piecesPerBox,
        numBoxes: 1,
        totalPieces: 20,
        image: products[4].image
      }
    ],
    shippingFee: 95,
    courier: "FedEx International",
    trackingNumber: "FDX-9923-1022",
    notes: "Samples shipped for evaluation before placing order for 100,000 pcs.",
    statement: "Samples supplied free of charge. Customer is responsible only for shipping costs.",
    createdAt: "2026-07-05T09:00:00Z"
  }
];

const DEFAULT_CONTRACTS = (clients: Client[], products: Product[]): Contract[] => [
  {
    id: "cnt1",
    contractNumber: "WT20260803",
    date: "2026.8.3",
    currency: "USD",
    seller: {
      party: "PartyB:",
      companyName: "Zhejiang Waimao International Trade Co., Ltd.",
      address: "No. 188 Century Avenue, Ningbo, Zhejiang Prov., China",
      tel: "18858002300",
      fax: "0574-87008888",
      contact: "Export Department"
    },
    buyer: {
      party: "Party A:",
      companyName: "DUONG HOANG HOA COMPANYLIMITED",
      email: "duonghoanghoa.pkt@gmail.com",
      phone: "0334029328",
      contact: "Điện thoại",
      address: "Viet Yen village , Nam Phu commune, Ha Noi city, Vietnam"
    },
    confirmationStatement: "We as seller, hereby confirm will sell to you as Buyer, the following goods in accordance with all the provisions here off:",
    items: [
      {
        id: "ci1",
        productId: products[0]?.id,
        name: "Trigger sprayer A 28/400 WHITE",
        sku: "MTS-28410-W",
        units: "PCS",
        quantity: 250000,
        unitPrice: 0.046,
        amount: 11500,
        ctns: 500,
        cbm: 36.68,
        image: products[0]?.image || PRODUCT_IMAGES_SVG.sprayer
      },
      {
        id: "ci2",
        productId: products[0]?.id,
        name: "Trigger sprayer A 28/400 YELLOW",
        sku: "MTS-28410-Y",
        units: "PCS",
        quantity: 75000,
        unitPrice: 0.046,
        amount: 3450,
        ctns: 150,
        cbm: 109.95,
        image: products[0]?.image || PRODUCT_IMAGES_SVG.sprayer
      },
      {
        id: "ci3",
        productId: products[0]?.id,
        name: "Trigger sprayer A 28/400 BLUE",
        sku: "MTS-28410-B",
        units: "PCS",
        quantity: 150000,
        unitPrice: 0.046,
        amount: 6900,
        ctns: 300,
        cbm: 219.9,
        image: products[0]?.image || PRODUCT_IMAGES_SVG.sprayer
      }
    ],
    deliveryTime: "10-15 DAYS",
    placeOfDelivery: "Ningbo",
    paymentTerms: "By T/T. 30%advance payment,balance before loading",
    beneficiary: {
      bankAdd: "No. 188 Century Avenue, Ningbo, Zhejiang",
      swiftCode: "BKCHCNBJ988",
      bankName: "BANK OF CHINA NINGBO BRANCH",
      accountNo: "38920199201000088888",
      beneficiaryName: "Zhejiang Waimao International Trade Co., Ltd."
    },
    intermediaryBank: {
      name: "BANK OF CHINA HEAD OFFICE",
      swiftCode: "BKCHCNBJXXX",
      address: "No. 1 Fuxingmen Inner Street, Beijing, China"
    },
    partyAConfirmedBy: "DUONG HOANG HOA COMPANYLIMITED",
    partyBConfirmedBy: "Zhejiang Waimao International Trade Co., Ltd.",
    showStamp: true,
    stampImage: DEFAULT_CONTRACT_STAMP_SVG,
    createdAt: "2026-08-03T08:00:00Z"
  }
];

const DEFAULT_PROFORMA_INVOICES = (clients: Client[], products: Product[]): ProformaInvoice[] => [
  {
    id: "pi-001",
    proformaNumber: "PI-20260801",
    date: "2026-08-05",
    validUntil: "2026-09-05",
    currency: "USD",
    salesperson: "Andrew Manager",
    client: clients[0] || DEFAULT_CLIENTS[0],
    incoterm: "FOB",
    portOfLoading: "Ningbo, China",
    portOfDestination: "Ho Chi Minh City, Vietnam",
    paymentTerms: "30% T/T deposit before production, 70% balance before shipment",
    depositPercentage: 30,
    depositAmount: 1140.00,
    balanceAmount: 2660.00,
    items: [
      {
        id: "pii-1",
        productId: products[0]?.id || "p1",
        name: products[0]?.name || "28/410 Plastic Trigger Sprayer (MTS-01)",
        sku: products[0]?.sku || "MTS-28410-A",
        size: "28/410",
        unitPrice: 0.0495,
        quantity: 20000,
        piecesPerBox: 500,
        numBoxes: 40,
        totalPieces: 20000,
        totalPrice: 990.00
      },
      {
        id: "pii-2",
        productId: products[1]?.id || "p2",
        name: products[1]?.name || "24/410 Ribbed Lotion Pump (MLP-02)",
        sku: products[1]?.sku || "MLP-24410-B",
        size: "24/410",
        unitPrice: 0.135,
        quantity: 10000,
        piecesPerBox: 1000,
        numBoxes: 10,
        totalPieces: 10000,
        totalPrice: 1350.00
      }
    ],
    shippingFee: 150,
    insurance: 0,
    subtotal: 2340.00,
    grandTotal: 2490.00,
    estimatedLeadTime: "15 days after deposit confirmation",
    notes: "Prices based on FOB Ningbo. Quality guaranteed according to pre-shipment sample.",
    terms: "Payment via Bank Wire (T/T). All banking charges outside China are on account of buyer.",
    createdAt: "2026-08-05T09:00:00Z"
  }
];

const DEFAULT_QUOTATIONS = (clients: Client[], products: Product[]): Quotation[] => [
  {
    id: "qt-001",
    quotationNumber: "QT-20260801",
    date: "2026-08-10",
    validUntil: "2026-09-10",
    currency: "USD",
    salesperson: "Andrew Manager",
    client: clients[0] || DEFAULT_CLIENTS[0],
    incoterm: "FOB",
    portOfLoading: "Ningbo Port, China",
    portOfDestination: "Cat Lai Port, Ho Chi Minh, Vietnam",
    paymentTerms: "30% T/T deposit upon order confirmation, 70% balance before shipment",
    estimatedLeadTime: "15-20 days upon deposit & sample approval",
    items: [
      {
        id: "qti-1",
        productId: products[0]?.id || "p1",
        name: products[0]?.name || "28/410 Plastic Trigger Sprayer (MTS-01)",
        sku: products[0]?.sku || "MTS-28410-A",
        size: "28/410",
        material: "PP",
        color: "White / All Colors",
        unitPrice: 0.0495,
        moq: 10000,
        quantity: 30000,
        piecesPerBox: 500,
        numBoxes: 60,
        totalPieces: 30000,
        totalPrice: 1485.00,
        leadTime: "15 days",
        cbm: 5.46,
        grossWeight: 792.0
      },
      {
        id: "qti-2",
        productId: products[2]?.id || "p3",
        name: products[2]?.name || "20/410 Fine Mist Sprayer (MMS-03)",
        sku: products[2]?.sku || "MMS-20410-C",
        size: "20/410",
        material: "PP & PE",
        color: "Clear / Translucent",
        unitPrice: 0.082,
        moq: 10000,
        quantity: 20000,
        piecesPerBox: 1000,
        numBoxes: 20,
        totalPieces: 20000,
        totalPrice: 1640.00,
        leadTime: "12 days",
        cbm: 1.44,
        grossWeight: 290.0
      }
    ],
    shippingFee: 0,
    packagingFee: 0,
    discountAmount: 25.00,
    subtotal: 3125.00,
    grandTotal: 3100.00,
    totalCbm: 6.90,
    totalCartons: 80,
    totalWeight: 1082.0,
    notes: "Prices valid for 30 days due to raw material PP index fluctuations. Customized dip tube lengths included free of charge.",
    terms: "FOB Ningbo terms. Samples provided free upon express freight collect account.",
    showStamp: true,
    createdAt: "2026-08-10T10:00:00Z"
  }
];

const DEFAULT_CERTIFICATES = (clients: Client[], products: Product[]): CertificateOfOrigin[] => [
  {
    id: "co-001",
    certificateNumber: "CO-20260801",
    issueDate: "2026-08-06",
    exporterName: "Zhejiang Waimao International Trade Co., Ltd.",
    exporterAddress: "No. 188 East Century Avenue, International Trade Center, Ningbo, China",
    consigneeName: clients[0]?.company || "DUONG HOANG HOA COMPANY LIMITED",
    consigneeAddress: clients[0]?.address || "123 Tan Binh District, Ho Chi Minh City, Vietnam",
    countryOfOrigin: "P.R. CHINA",
    countryOfDestination: "VIETNAM",
    transportDetails: "BY SEA VESSEL 'EVER GIVEN' V.042E FROM NINGBO TO HO CHI MINH PORT",
    remarks: "INVOICE NO: INV-000001 DATED 2026.08.03",
    items: [
      {
        id: "coi-1",
        marksAndNumbers: "N/M OR AS PER CARTON",
        packagesCount: "50 CARTONS",
        goodsDescription: "PLASTIC TRIGGER SPRAYERS & LOTION PUMPS",
        hsCode: "3926.90.90",
        quantity: "30,000 PCS",
        grossWeight: "723.00 KGS"
      }
    ],
    declarationByExporter: "The undersigned hereby declares that the above details and statements are correct and that all goods were produced in P.R. CHINA.",
    issuingAuthority: "China Council for the Promotion of International Trade (CCPIT)",
    createdAt: "2026-08-06T10:00:00Z"
  }
];

const DEFAULT_SHIPPING_INSTRUCTIONS = (clients: Client[], products: Product[]): ShippingInstruction[] => [
  {
    id: "si-001",
    siNumber: "SI-20260801",
    date: "2026-08-06",
    shipper: "Zhejiang Waimao International Trade Co., Ltd.\nNo. 188 East Century Avenue, Ningbo, China",
    consignee: clients[0]?.company ? `${clients[0].company}\n${clients[0].address}\nTEL: ${clients[0].phone}` : "DUONG HOANG HOA CO., LTD\nHo Chi Minh City, Vietnam",
    notifyParty: "SAME AS CONSIGNEE",
    carrier: "COSCO SHIPPING LINES",
    vesselVoyage: "COSCO GUANGZHOU V.112E",
    portOfLoading: "Ningbo Port, China",
    portOfDischarge: "Cat Lai Port, Ho Chi Minh, Vietnam",
    finalDestination: "Ho Chi Minh City, Vietnam",
    freightTerm: "FREIGHT PREPAID",
    bookingNumber: "NGB987654321",
    blType: "Telex Release",
    items: [
      {
        id: "sii-1",
        containerNo: "TCLU8823910",
        sealNo: "COS661029",
        packages: "50 CARTONS",
        description: "PLASTIC TRIGGER SPRAYERS AND LOTION PUMPS FOR COSMETIC PACKAGING",
        grossWeightKg: 723.00,
        cbm: 6.85,
        hsCode: "3926.90.90"
      }
    ],
    totalPackages: "50 CARTONS",
    totalGrossWeight: 723.00,
    totalCbm: 6.85,
    specialInstructions: "Please issue Telex Release B/L upon receipt of payment confirmation. Maintain dry container environment.",
    createdAt: "2026-08-06T11:00:00Z"
  }
];

const DEFAULT_QUOTATION_CALCULATIONS = (clients: Client[], products: Product[]): QuotationCalculation[] => [
  {
    id: "calc-001",
    calcNumber: "CALC-000001",
    inquiryTitle: "28/410 Standard Plastic Trigger Sprayer (FOB Ningbo Benchmark)",
    date: "2026-08-20",
    client: clients[0] || DEFAULT_CLIENTS[0],
    clientName: clients[0]?.company || "Apex Cleaning & Packaging USA LLC",
    currency: "USD",
    exchangeRate: 7.20,
    quantity: 50000,
    targetProfitMargin: 12.0,
    taxRebateRate: 13.0,

    productId: products[0]?.id || "p1",
    productName: "28/410 Plastic Trigger Sprayer (MTS-01)",
    sku: "MTS-28410-A",
    productCategory: "Trigger Sprayers",
    neckSize: "28/410",
    closureType: "Ratchet Anti-Spin / Ribbed",
    outputDosage: "1.0ml ± 0.1ml",
    baseCostRmb: 0.285,
    baseCostCurrency: "RMB",
    productImage: PRODUCT_IMAGES_SVG.sprayer,

    // 1. Dip Tube Customization
    dipTubeEnabled: false,
    standardTubeLengthMm: 220,
    requiredTubeLengthMm: 220,
    tubeExtraCostPer10mmRmb: 0.0025,
    tubeMaterial: "standard_pe",
    tubeCutType: "slant_angle_cut",
    tubeFilterMesh: false,
    tubeFilterMeshCostRmb: 0,

    // 2. Color Customization
    colorType: "standard_white_black",
    pantoneCode: "Standard White",
    masterbatchColorCostPerUnitRmb: 0,
    colorMatchingFeeOneOffRmb: 0,
    surfaceFinishCostPerUnitRmb: 0,

    // 3. Logo Customization
    logoEnabled: false,
    logoPrintingMethod: "none",
    logoColorsCount: 0,
    logoPrintingCostPerUnitRmb: 0,
    logoPlateFeeOneOffRmb: 0,
    moldCustomizationFeeOneOffRmb: 0,

    // 4. Function Upgrades
    nozzleType: "spray_stream_off",
    nozzleUpgradeCostRmb: 0,
    springMaterial: "sus304_standard",
    springUpgradeCostRmb: 0,
    gasketType: "pe_foam_standard",
    gasketUpgradeCostRmb: 0,

    // 5. Packaging
    packagingType: "bulk_master_carton",
    piecesPerCarton: 500,
    cartonLengthCm: 57,
    cartonWidthCm: 38,
    cartonHeightCm: 42,
    cartonGrossWeightKg: 13.2,
    cartonBoxCostRmb: 4.5,
    packagingExtraCostPerUnitRmb: 0,
    palletCostEachRmb: 120,
    palletsCount: 0,

    // 6. Logistics & Extra Fees
    inlandFreightRmb: 450,
    portThcAndCustomsRmb: 350,
    bankHandlingFeeUsd: 20,
    exportDocsFeeRmb: 100,
    sampleAndCourierRmb: 60,
    otherExtraFeesRmb: 0,
    internationalFreightUsd: 0,
    destinationDutyAndDeliveryUsd: 0,

    portOfLoading: "Ningbo Port, China",
    portOfDestination: "Long Beach, CA, USA",
    leadTimeDays: 20,
    remarks: "Standard 28/410 Plastic Trigger Sprayer (MTS-01) with adjustable Spray/Stream nozzle, 220mm standard PE dip tube, bulk master carton (500 pcs/ctn), FOB Ningbo Port benchmark quote ($0.0495/pc).",
    createdAt: "2026-08-20T10:30:00Z"
  },
  {
    id: "calc-002",
    calcNumber: "CALC-000002",
    inquiryTitle: "24/410 Luxury Ribbed Lotion Pump with Metallic Collar",
    date: "2026-08-21",
    client: clients[1] || DEFAULT_CLIENTS[0],
    clientName: "CosmoCare Brands International",
    currency: "USD",
    exchangeRate: 7.20,
    quantity: 30000,
    targetProfitMargin: 18.0,
    taxRebateRate: 13.0,

    productId: products[1]?.id || "p2",
    productName: "24/410 Ribbed Lotion Pump (MLP-02)",
    sku: "MLP-24410-B",
    productCategory: "Lotion Pumps",
    neckSize: "24/410",
    closureType: "Ribbed with Aluminum Sheath",
    outputDosage: "2.0ml ± 0.15ml",
    baseCostRmb: 0.72,
    baseCostCurrency: "RMB",
    productImage: PRODUCT_IMAGES_SVG.pump,

    dipTubeEnabled: true,
    standardTubeLengthMm: 160,
    requiredTubeLengthMm: 210,
    tubeExtraCostPer10mmRmb: 0.0025,
    tubeMaterial: "standard_pe",
    tubeCutType: "v_notch",
    tubeFilterMesh: false,
    tubeFilterMeshCostRmb: 0,

    colorType: "metallic_electroplating",
    pantoneCode: "Shiny Silver Aluminum Collar",
    masterbatchColorCostPerUnitRmb: 0,
    colorMatchingFeeOneOffRmb: 0,
    surfaceFinishCostPerUnitRmb: 0.08,

    logoEnabled: false,
    logoPrintingMethod: "none",
    logoColorsCount: 0,
    logoPrintingCostPerUnitRmb: 0,
    logoPlateFeeOneOffRmb: 0,
    moldCustomizationFeeOneOffRmb: 0,

    nozzleType: "spray_stream_off",
    nozzleUpgradeCostRmb: 0,
    springMaterial: "sus316_chemical",
    springUpgradeCostRmb: 0.025,
    gasketType: "pe_foam_standard",
    gasketUpgradeCostRmb: 0,

    packagingType: "individual_polybag",
    piecesPerCarton: 1000,
    cartonLengthCm: 54,
    cartonWidthCm: 38,
    cartonHeightCm: 38,
    cartonGrossWeightKg: 19.5,
    cartonBoxCostRmb: 6.8,
    packagingExtraCostPerUnitRmb: 0.015,
    palletCostEachRmb: 120,
    palletsCount: 2,

    inlandFreightRmb: 500,
    portThcAndCustomsRmb: 400,
    bankHandlingFeeUsd: 30,
    exportDocsFeeRmb: 120,
    sampleAndCourierRmb: 80,
    otherExtraFeesRmb: 0,
    internationalFreightUsd: 0,
    destinationDutyAndDeliveryUsd: 0,

    portOfLoading: "Shanghai Port, China",
    portOfDestination: "Rotterdam, Netherlands",
    leadTimeDays: 25,
    remarks: "Luxury pump for body lotion with shiny silver collar, chemical resistant SUS316 internal spring, and individual polybag scratch protection.",
    createdAt: "2026-08-21T14:15:00Z"
  }
];

// Core state data wrapper
export interface AppData {
  products: Product[];
  clients: Client[];
  invoices: Invoice[];
  packingLists: PackingList[];
  sampleInvoices: SampleInvoice[];
  contracts: Contract[];
  proformaInvoices?: ProformaInvoice[];
  quotations?: Quotation[];
  quotationCalculations?: QuotationCalculation[];
  certificatesOfOrigin?: CertificateOfOrigin[];
  shippingInstructions?: ShippingInstruction[];
  settings: CompanySettings;
}

export function getInitialDefaultAppData(): AppData {
  return {
    products: DEFAULT_PRODUCTS,
    clients: DEFAULT_CLIENTS,
    invoices: DEFAULT_INVOICES(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    packingLists: DEFAULT_PACKING_LISTS(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    sampleInvoices: DEFAULT_SAMPLE_INVOICES(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    contracts: DEFAULT_CONTRACTS(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    proformaInvoices: DEFAULT_PROFORMA_INVOICES(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    quotations: DEFAULT_QUOTATIONS(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    quotationCalculations: DEFAULT_QUOTATION_CALCULATIONS(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    certificatesOfOrigin: DEFAULT_CERTIFICATES(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    shippingInstructions: DEFAULT_SHIPPING_INSTRUCTIONS(DEFAULT_CLIENTS, DEFAULT_PRODUCTS),
    settings: DEFAULT_COMPANY_SETTINGS
  };
}

export function loadAppData(userKey?: string): AppData {
  try {
    const storageKey = userKey ? `waimao_tools_data_${userKey}` : "waimao_tools_data";
    const legacyKey = userKey ? `mila_tools_data_${userKey}` : "mila_tools_data";
    const raw = localStorage.getItem(storageKey) || 
                localStorage.getItem(legacyKey) || 
                (!userKey ? null : localStorage.getItem("waimao_tools_data")) || 
                (!userKey ? null : localStorage.getItem("mila_tools_data"));
    if (raw) {
      const parsed = JSON.parse(raw);
      // Verify basic fields are arrays
      if (
        Array.isArray(parsed.products) &&
        Array.isArray(parsed.clients) &&
        Array.isArray(parsed.invoices) &&
        Array.isArray(parsed.packingLists) &&
        Array.isArray(parsed.sampleInvoices) &&
        parsed.settings
      ) {
        if (!Array.isArray(parsed.contracts)) {
          parsed.contracts = DEFAULT_CONTRACTS(parsed.clients || DEFAULT_CLIENTS, parsed.products || DEFAULT_PRODUCTS);
        }
        if (!Array.isArray(parsed.proformaInvoices)) {
          parsed.proformaInvoices = DEFAULT_PROFORMA_INVOICES(parsed.clients || DEFAULT_CLIENTS, parsed.products || DEFAULT_PRODUCTS);
        }
        if (!Array.isArray(parsed.quotations)) {
          parsed.quotations = DEFAULT_QUOTATIONS(parsed.clients || DEFAULT_CLIENTS, parsed.products || DEFAULT_PRODUCTS);
        }
        if (!Array.isArray(parsed.quotationCalculations)) {
          parsed.quotationCalculations = DEFAULT_QUOTATION_CALCULATIONS(parsed.clients || DEFAULT_CLIENTS, parsed.products || DEFAULT_PRODUCTS);
        }
        if (!Array.isArray(parsed.certificatesOfOrigin)) {
          parsed.certificatesOfOrigin = DEFAULT_CERTIFICATES(parsed.clients || DEFAULT_CLIENTS, parsed.products || DEFAULT_PRODUCTS);
        }
        if (!Array.isArray(parsed.shippingInstructions)) {
          parsed.shippingInstructions = DEFAULT_SHIPPING_INSTRUCTIONS(parsed.clients || DEFAULT_CLIENTS, parsed.products || DEFAULT_PRODUCTS);
        }
        return parsed as AppData;
      }
    }
  } catch (e) {
    console.error("Error reading from localStorage, using defaults", e);
  }

  // If no data exists, load the default seeds
  const initialData: AppData = getInitialDefaultAppData();
  saveAppData(initialData, userKey);
  return initialData;
}

export function saveAppData(data: AppData, userKey?: string) {
  try {
    const storageKey = userKey ? `waimao_tools_data_${userKey}` : "waimao_tools_data";
    localStorage.setItem(storageKey, JSON.stringify(data));
    if (!userKey) {
      localStorage.setItem("waimao_tools_data", JSON.stringify(data));
    }
  } catch (e) {
    console.error("Failed to save data to localStorage", e);
  }
}

/**
 * Normalizes remote AppData from Cloud Firestore, ensuring all document arrays exist
 */
export function mergeAppData(localData: AppData, remoteData: AppData): AppData {
  if (!remoteData) return localData;
  
  return {
    products: Array.isArray(remoteData.products) ? remoteData.products : (localData?.products || []),
    clients: Array.isArray(remoteData.clients) ? remoteData.clients : (localData?.clients || []),
    invoices: Array.isArray(remoteData.invoices) ? remoteData.invoices : (localData?.invoices || []),
    packingLists: Array.isArray(remoteData.packingLists) ? remoteData.packingLists : (localData?.packingLists || []),
    sampleInvoices: Array.isArray(remoteData.sampleInvoices) ? remoteData.sampleInvoices : (localData?.sampleInvoices || []),
    contracts: Array.isArray(remoteData.contracts) ? remoteData.contracts : (localData?.contracts || []),
    proformaInvoices: Array.isArray(remoteData.proformaInvoices) ? remoteData.proformaInvoices : (localData?.proformaInvoices || []),
    quotations: Array.isArray(remoteData.quotations) ? remoteData.quotations : (localData?.quotations || []),
    quotationCalculations: Array.isArray(remoteData.quotationCalculations) ? remoteData.quotationCalculations : (localData?.quotationCalculations || []),
    certificatesOfOrigin: Array.isArray(remoteData.certificatesOfOrigin) ? remoteData.certificatesOfOrigin : (localData?.certificatesOfOrigin || []),
    shippingInstructions: Array.isArray(remoteData.shippingInstructions) ? remoteData.shippingInstructions : (localData?.shippingInstructions || []),
    settings: remoteData.settings && remoteData.settings.name ? remoteData.settings : (localData?.settings || remoteData.settings)
  };
}

// Helpers for automatic document numbering & incrementing
export function getNextDocumentNumber(type: 'invoice' | 'packing' | 'sample' | 'contract' | 'proforma' | 'quotation' | 'certificate' | 'shipping' | 'calc', list: Array<any>): string {
  if (type === 'contract') {
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ML${todayStr.slice(0, 6)}`;
    if (list.length === 0) {
      return `${prefix}01`;
    }
    return `${prefix}${String(list.length + 1).padStart(2, '0')}`;
  }

  const prefix = type === 'invoice' 
    ? 'INV-' 
    : type === 'packing' 
      ? 'PL-' 
      : type === 'sample' 
        ? 'SAMP-' 
        : type === 'proforma' 
          ? 'PI-' 
          : type === 'quotation' 
            ? 'QT-' 
            : type === 'certificate' 
              ? 'CO-' 
              : type === 'calc'
                ? 'CALC-'
                : 'SI-';
  
  if (!list || list.length === 0) {
    return `${prefix}000001`;
  }

  // Find max number
  let maxNum = 0;
  const numRegex = new RegExp(`${prefix}(\\d+)`);
  
  list.forEach(doc => {
    const fieldName = type === 'invoice' 
      ? 'invoiceNumber' 
      : type === 'packing' 
        ? 'packingListNumber' 
        : type === 'sample'
          ? 'sampleInvoiceNumber'
          : type === 'proforma'
            ? 'proformaNumber'
            : type === 'quotation'
              ? 'quotationNumber'
              : type === 'certificate'
                ? 'certificateNumber'
                : type === 'calc'
                  ? 'calcNumber'
                  : 'siNumber';
        
    const val = doc[fieldName];
    if (val) {
      const match = val.match(numRegex);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) {
          maxNum = num;
        }
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${prefix}${String(nextNum).padStart(6, '0')}`;
}

// Global search interface
export interface SearchResult {
  id: string;
  type: 'product' | 'client' | 'invoice' | 'packing_list' | 'sample_invoice' | 'contract' | 'quotation';
  title: string;
  subtitle: string;
  metadata: string;
}

export function performGlobalSearch(query: string, data: AppData): SearchResult[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: SearchResult[] = [];

  // Search Products
  data.products.forEach(p => {
    if (
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    ) {
      results.push({
        id: p.id,
        type: 'product',
        title: p.name,
        subtitle: `Product • SKU: ${p.sku}`,
        metadata: `${p.category} | ${p.material}`
      });
    }
  });

  // Search Clients
  data.clients.forEach(c => {
    if (
      c.company.toLowerCase().includes(q) ||
      c.contactPerson.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    ) {
      results.push({
        id: c.id,
        type: 'client',
        title: c.company,
        subtitle: `Client • Contact: ${c.contactPerson}`,
        metadata: `${c.country} | ${c.email}`
      });
    }
  });

  // Search Invoices
  data.invoices.forEach(inv => {
    if (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.client.company.toLowerCase().includes(q) ||
      inv.salesperson.toLowerCase().includes(q)
    ) {
      results.push({
        id: inv.id,
        type: 'invoice',
        title: inv.invoiceNumber,
        subtitle: `Invoice • Total: ${inv.currency} ${inv.grandTotal.toFixed(2)}`,
        metadata: `Client: ${inv.client.company} | Date: ${inv.date}`
      });
    }
  });

  // Search Packing Lists
  data.packingLists.forEach(pl => {
    if (
      pl.packingListNumber.toLowerCase().includes(q) ||
      pl.client.company.toLowerCase().includes(q) ||
      pl.containerNumber.toLowerCase().includes(q) ||
      pl.sealNumber.toLowerCase().includes(q)
    ) {
      results.push({
        id: pl.id,
        type: 'packing_list',
        title: pl.packingListNumber,
        subtitle: `Packing List • Cartons: ${pl.totalCartons} | CBM: ${pl.totalCbm.toFixed(2)}`,
        metadata: `Client: ${pl.client.company} | Container: ${pl.containerNumber || 'N/A'}`
      });
    }
  });

  // Search Sample Invoices
  data.sampleInvoices.forEach(si => {
    if (
      si.sampleInvoiceNumber.toLowerCase().includes(q) ||
      si.client.company.toLowerCase().includes(q) ||
      si.trackingNumber.toLowerCase().includes(q) ||
      si.courier.toLowerCase().includes(q)
    ) {
      results.push({
        id: si.id,
        type: 'sample_invoice',
        title: si.sampleInvoiceNumber,
        subtitle: `Sample Invoice • Courier: ${si.courier}`,
        metadata: `Client: ${si.client.company} | Tracking: ${si.trackingNumber || 'N/A'}`
      });
    }
  });

  // Search Contracts
  if (data.contracts) {
    data.contracts.forEach(cnt => {
      if (
        cnt.contractNumber.toLowerCase().includes(q) ||
        cnt.buyer.companyName.toLowerCase().includes(q) ||
        cnt.seller.companyName.toLowerCase().includes(q)
      ) {
        results.push({
          id: cnt.id,
          type: 'contract',
          title: cnt.contractNumber,
          subtitle: `Contract • Buyer: ${cnt.buyer.companyName}`,
          metadata: `Date: ${cnt.date} | Delivery: ${cnt.deliveryTime}`
        });
      }
    });
  }

  // Search Quotations
  if (data.quotations) {
    data.quotations.forEach(qt => {
      if (
        qt.quotationNumber.toLowerCase().includes(q) ||
        qt.client.company.toLowerCase().includes(q) ||
        qt.salesperson.toLowerCase().includes(q)
      ) {
        results.push({
          id: qt.id,
          type: 'quotation',
          title: qt.quotationNumber,
          subtitle: `Price Quote • Total: ${qt.currency} ${qt.grandTotal.toFixed(2)}`,
          metadata: `Client: ${qt.client.company} | Valid Until: ${qt.validUntil}`
        });
      }
    });
  }

  return results.slice(0, 10); // Return top 10 results
}
