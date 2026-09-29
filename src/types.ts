export interface Product {
  id: string;
  name: string;
  sku?: string;
  size?: string;
  category: string;
  description: string;
  color: string;
  material: string;
  weight: number; // in kg
  price: number;
  moq: number;
  piecesPerBox: number;
  cartonLength: number; // cm
  cartonWidth: number; // cm
  cartonHeight: number; // cm
  grossWeight: number; // kg
  netWeight: number; // kg
  barcode?: string;
  hsCode?: string;
  countryOfOrigin: string;
  image?: string; // base64 string
  notes: string;
}

export interface Client {
  id: string;
  company: string;
  contactPerson: string;
  address: string;
  phone: string;
  email: string;
  country: string;
  notes: string;
}

export interface CompanySettings {
  logo?: string; // base64 string
  name: string;
  contactPerson?: string;
  address: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  taxNumber: string;
  stamp?: string; // Primary Stamp (Round / Official)
  secondaryStamp?: string; // Secondary Stamp (Contract / Finance / Customs / Oval)
  signature?: string; // base64 string
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swift: string;
  branch: string;
  defaultCurrency: string;
  defaultTaxRate: number;
  localBankName?: string;
  localAccountName?: string;
  localAccountNumber?: string;
  wechatQr?: string; // base64 / data URL
  alipayQr?: string; // base64 / data URL
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  size?: string;
  description: string;
  unitPrice: number;
  quantity: number;
  piecesPerBox: number;
  numBoxes: number;
  totalPieces: number;
  totalPrice: number;
  image?: string;
}

export interface Invoice {
  id: string;
  title?: string;
  notesTitle?: string;
  termsTitle?: string;
  bankTitle?: string;
  showNotes?: boolean;
  showTerms?: boolean;
  showBankDetails?: boolean;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swift?: string;
  iban?: string;
  branch?: string;
  bankRemarks?: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  currency: string;
  salesperson: string;
  client: Client;
  items: InvoiceItem[];
  shippingFee: number;
  insurance: number;
  packagingFee?: number;
  taxRate: number; // percentage
  taxAmount: number;
  discountRate: number; // percentage or fixed? Let's treat as fixed discount or percentage
  discountAmount: number;
  otherCharges: number;
  notes: string;
  terms: string;
  subtotal: number;
  grandTotal: number;
  createdAt: string;
  paymentMethodType?: 'international' | 'local_rmb' | 'both';
  localBankName?: string;
  localAccountName?: string;
  localAccountNumber?: string;
  wechatQr?: string;
  alipayQr?: string;
}

export interface PackingListItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  size?: string;
  hsCode?: string;
  quantity: number;
  numBoxes: number;
  piecesPerBox: number;
  totalPieces: number;
  grossWeight: number; // weight of single carton or total weight? Let's store total gross weight for this line or per box. Total makes calculation direct.
  netWeight: number; // total net weight for this line
  cartonLength: number;
  cartonWidth: number;
  cartonHeight: number;
  cbm: number; // volume in cubic meters
  image?: string;
}

export interface PackingList {
  id: string;
  title?: string;
  notesTitle?: string;
  showNotes?: boolean;
  packingListNumber: string;
  transportMode?: 'sea' | 'china_warehouse' | 'air_express' | 'railway' | 'buyer_seller';
  containerNumber: string;
  sealNumber: string;
  shipmentDate: string;
  portOfLoading: string;
  portOfDestination: string;
  containerType: '20FT' | '40FT' | '40HQ' | '45HQ' | 'LCL' | 'TRUCK' | 'EXPRESS' | '';
  shippingType?: string;
  // China Domestic / Forwarder Warehouse Specific Fields
  chinaWarehouseName?: string;
  warehouseEntryCode?: string; // 进仓编号 / SO No. / Inbound Ref
  chinaWarehouseAddress?: string;
  chinaWarehouseContact?: string;
  chinaWarehousePhone?: string;
  domesticCarrier?: string; // e.g. 顺丰速运 SF Express, 德邦 Deppon, 专线货车
  domesticTrackingNumber?: string;
  shippingMarks?: string; // 唛头 / Box Marking
  deliveryMethod?: string; // e.g. Dedicated Truck, LTL Freight, Express Courier, Self-Pickup
  // Simple Buyer & Seller Specific Fields
  sellerName?: string;
  sellerAddress?: string;
  sellerContact?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  sellerTaxId?: string;
  buyerName?: string;
  buyerAddress?: string;
  buyerContact?: string;
  buyerPhone?: string;
  buyerEmail?: string;
  buyerTaxId?: string;
  client: Client;
  items: PackingListItem[];
  totalCbm: number;
  totalCartons: number;
  totalPieces: number;
  totalWeight: number; // total gross weight
  notes: string;
  createdAt: string;
}

export interface SampleInvoiceItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  size?: string;
  hsCode?: string;
  quantity: number; // quantity of pieces
  piecesPerBox: number;
  numBoxes: number;
  totalPieces: number;
  image?: string;
}

export interface SampleInvoice {
  id: string;
  title?: string;
  notesTitle?: string;
  showNotes?: boolean;
  showStatement?: boolean;
  sampleInvoiceNumber: string;
  date: string;
  currency?: string;
  client: Client;
  items: SampleInvoiceItem[];
  shippingFee: number;
  courier: string;
  trackingNumber: string;
  notes: string;
  statement: string;
  createdAt: string;
}

export interface ContractItem {
  id: string;
  productId?: string;
  name: string; // Description of goods
  sku?: string;
  units: string; // PCS
  quantity: number;
  unitPrice: number; // Unit price (FOB Ningbo / Port)
  amount: number; // Total amount USD
  ctns: number; // Cartons
  cbm: number; // CBM
  image?: string;
}

export interface ContractSeller {
  party: string; // Party B
  companyName: string;
  address: string;
  tel: string;
  fax: string;
  contact: string;
}

export interface ContractBuyer {
  party: string; // Party A
  companyName: string;
  email: string;
  phone: string;
  contact: string;
  address: string;
}

export interface ContractBeneficiary {
  bankAdd: string;
  swiftCode: string;
  bankName: string;
  accountNo: string;
  beneficiaryName: string;
}

export interface ContractIntermediaryBank {
  name: string;
  swiftCode: string;
  address: string;
}

export interface Contract {
  id: string;
  contractNumber: string; // e.g. ML20260803
  date: string; // e.g. 2026.8.3
  currency?: string;
  seller: ContractSeller;
  buyer: ContractBuyer;
  client?: Client;
  confirmationStatement: string;
  items: ContractItem[];
  deliveryTime: string; // 10-15 DAYS
  placeOfDelivery: string; // Quzhou
  paymentTerms: string; // By T/T. 30%advance payment,balance before loading
  beneficiary: ContractBeneficiary;
  intermediaryBank: ContractIntermediaryBank;
  partyAConfirmedBy: string; // DUONG HOANG HOA COMPANYLIMITED
  partyBConfirmedBy: string; // Zhejiang Mila Plastic Industry Co.,Ltd
  showStamp: boolean;
  stampImage?: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  companyName?: string;
  role?: string;
}

export interface ProformaInvoiceItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  size?: string;
  material?: string;
  color?: string;
  description?: string;
  hsCode?: string;
  unitPrice: number;
  quantity: number;
  piecesPerBox: number;
  numBoxes: number;
  totalPieces: number;
  totalPrice: number;
  image?: string;
}

export interface ProformaInvoice {
  id: string;
  title?: string;
  notesTitle?: string;
  termsTitle?: string;
  bankTitle?: string;
  showNotes?: boolean;
  showTerms?: boolean;
  showBankDetails?: boolean;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swift?: string;
  iban?: string;
  branch?: string;
  bankRemarks?: string;
  proformaNumber: string;
  date: string;
  validUntil: string;
  currency: string;
  salesperson: string;
  client: Client;
  incoterm: 'FOB' | 'CIF' | 'CFR' | 'EXW' | 'DDP' | 'DAP';
  portOfLoading: string;
  portOfDestination: string;
  paymentTerms: string;
  depositPercentage: number;
  depositAmount: number;
  balanceAmount: number;
  items: ProformaInvoiceItem[];
  shippingFee: number;
  insurance: number;
  packagingFee?: number;
  subtotal: number;
  grandTotal: number;
  estimatedLeadTime: string;
  notes: string;
  terms: string;
  showStamp?: boolean;
  showSecondaryStamp?: boolean;
  showSignature?: boolean;
  customStamp?: string;
  customSecondaryStamp?: string;
  customSignature?: string;
  createdAt: string;
}

export interface CertificateItem {
  id: string;
  marksAndNumbers: string;
  packagesCount: string;
  goodsDescription: string;
  hsCode: string;
  quantity: string;
  grossWeight: string;
}

export interface CertificateOfOrigin {
  id: string;
  certificateNumber: string;
  issueDate: string;
  exporterName: string;
  exporterAddress: string;
  consigneeName: string;
  consigneeAddress: string;
  countryOfOrigin: string;
  countryOfDestination: string;
  transportDetails: string;
  remarks: string;
  items: CertificateItem[];
  declarationByExporter: string;
  issuingAuthority: string;
  createdAt: string;
}

export interface ShippingInstructionItem {
  id: string;
  containerNo: string;
  sealNo: string;
  packages: string;
  description: string;
  grossWeightKg: number;
  cbm: number;
  hsCode: string;
}

export interface ShippingInstruction {
  id: string;
  siNumber: string;
  date: string;
  shipper: string;
  consignee: string;
  notifyParty: string;
  carrier: string;
  vesselVoyage: string;
  portOfLoading: string;
  portOfDischarge: string;
  finalDestination: string;
  freightTerm: 'FREIGHT PREPAID' | 'FREIGHT COLLECT';
  bookingNumber: string;
  blType: 'Original B/L' | 'Telex Release' | 'Express Release' | 'Waybill';
  items: ShippingInstructionItem[];
  totalPackages: string;
  totalGrossWeight: number;
  totalCbm: number;
  specialInstructions: string;
  createdAt: string;
}

export interface QuotationItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  size?: string;
  material?: string;
  color?: string;
  unitPrice: number;
  moq?: number;
  quantity: number;
  piecesPerBox: number;
  numBoxes: number;
  totalPieces: number;
  totalPrice: number;
  leadTime?: string;
  cbm?: number;
  grossWeight?: number;
  image?: string;
}

export interface Quotation {
  id: string;
  title?: string;
  notesTitle?: string;
  termsTitle?: string;
  paymentTermsTitle?: string;
  bankTitle?: string;
  showNotes?: boolean;
  showTerms?: boolean;
  showPaymentTerms?: boolean;
  showBankDetails?: boolean;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swift?: string;
  iban?: string;
  branch?: string;
  bankRemarks?: string;
  quotationNumber: string;
  date: string;
  validUntil: string;
  currency: string;
  salesperson: string;
  client: Client;
  incoterm: 'FOB' | 'EXW' | 'CIF' | 'CFR' | 'DDP' | 'DAP';
  portOfLoading: string;
  portOfDestination?: string;
  paymentTerms: string;
  estimatedLeadTime: string;
  items: QuotationItem[];
  shippingFee: number;
  packagingFee?: number;
  discountAmount?: number;
  subtotal: number;
  grandTotal: number;
  totalCbm?: number;
  totalCartons?: number;
  totalWeight?: number;
  notes: string;
  terms: string;
  showStamp?: boolean;
  paymentMethodType?: 'international' | 'local_rmb' | 'both';
  localBankName?: string;
  localAccountName?: string;
  localAccountNumber?: string;
  wechatQr?: string;
  alipayQr?: string;
  createdAt: string;
}

export interface QuotationCalculation {
  id: string;
  calcNumber: string;
  inquiryTitle: string;
  date: string;
  client?: Client;
  clientName?: string;
  currency: string;
  exchangeRate: number; // e.g. 7.20 RMB per USD
  quantity: number; // e.g. 50000 pcs
  targetProfitMargin: number; // e.g. 15 (%)
  taxRebateRate: number; // e.g. 13 (%)

  // Base Product Details
  productId?: string;
  productName: string;
  sku: string;
  productCategory: string;
  neckSize: string; // e.g. 28/410
  closureType?: string; // Ribbed, Smooth, Ratchet
  outputDosage?: string; // 1.0ml ± 0.1ml
  baseCostRmb: number; // Raw factory cost per piece in RMB
  baseCostCurrency: 'RMB' | 'USD';
  productImage?: string;

  // 1. Dip Tube Customization (吸管定制)
  dipTubeEnabled: boolean;
  standardTubeLengthMm: number; // e.g. 200 mm
  requiredTubeLengthMm: number; // e.g. 260 mm
  tubeExtraCostPer10mmRmb: number; // e.g. 0.003 RMB per 10mm
  tubeMaterial: 'standard_pe' | 'heavy_duty_thick' | 'silicone_soft' | 'chemical_fluorinated';
  tubeCutType: 'straight_cut' | 'slant_angle_cut' | 'v_notch';
  tubeFilterMesh: boolean; // Bottom anti-clog filter mesh
  tubeFilterMeshCostRmb: number; // e.g. 0.015 RMB

  // 2. Color & Surface Customization (颜色与工艺定制)
  colorType: 'standard_white_black' | 'custom_pantone' | 'two_tone_assembly' | 'metallic_electroplating' | 'uv_coating';
  pantoneCode: string;
  masterbatchColorCostPerUnitRmb: number; // e.g. 0.015 RMB/pc
  colorMatchingFeeOneOffRmb: number; // e.g. 300 RMB
  surfaceFinishCostPerUnitRmb: number; // e.g. 0.08 RMB/pc

  // 3. Logo & Branding Customization (加印Logo与模具刻字)
  logoEnabled: boolean;
  logoPrintingMethod: 'none' | 'silkscreen' | 'hot_stamping' | 'pad_printing' | 'mold_embossing';
  logoColorsCount: number; // e.g. 1 or 2
  logoPrintingCostPerUnitRmb: number; // e.g. 0.03 RMB/pc/color
  logoPlateFeeOneOffRmb: number; // e.g. 200 RMB
  moldCustomizationFeeOneOffRmb: number; // e.g. 1500 RMB

  // 4. Function & Mechanism Upgrades (特殊功能/配置)
  nozzleType: 'spray_stream_off' | 'foam_mesh_nozzle' | 'dual_spray_mist' | 'child_resistant_lock' | 'upside_down_360';
  nozzleUpgradeCostRmb: number; // e.g. 0.02 RMB
  springMaterial: 'sus304_standard' | 'sus316_chemical' | 'metal_free_all_plastic';
  springUpgradeCostRmb: number; // e.g. 0.03 RMB
  gasketType: 'pe_foam_standard' | 'eva_high_density' | 'nbr_oil_resistant' | 'teflon_chemical';
  gasketUpgradeCostRmb: number;

  // 5. Packaging & Packing Customization (包装方式与外箱)
  packagingType: 'bulk_master_carton' | 'individual_polybag' | 'egg_grid_partition' | 'custom_color_box' | 'palletized';
  piecesPerCarton: number; // e.g. 500 pcs
  cartonLengthCm: number; // e.g. 57 cm
  cartonWidthCm: number; // e.g. 38 cm
  cartonHeightCm: number; // e.g. 42 cm
  cartonGrossWeightKg: number; // e.g. 13.2 kg
  cartonBoxCostRmb: number; // e.g. 6.5 RMB
  packagingExtraCostPerUnitRmb: number; // e.g. 0.01 RMB
  palletCostEachRmb: number; // e.g. 120 RMB
  palletsCount: number;

  // 6. Extra Fees & Domestic / Port Logistics (杂费与物流)
  inlandFreightRmb: number; // Factory to Port Trucking
  portThcAndCustomsRmb: number; // Port THC, Customs, CFS, Wharfage
  bankHandlingFeeUsd: number; // Remittance & Bank fee
  exportDocsFeeRmb: number; // CO / Form E / Inspection fee
  sampleAndCourierRmb: number; // Courier sample fee
  otherExtraFeesRmb: number; // Other miscellaneous fees
  internationalFreightUsd: number; // Ocean / Air freight for CFR/CIF
  destinationDutyAndDeliveryUsd: number; // DDP customs duty & domestic dispatch

  // Notes & Trade info
  portOfLoading: string; // e.g. Ningbo Port, China
  portOfDestination?: string;
  leadTimeDays: number;
  remarks: string;
  createdAt: string;
}

export type ActiveTab = 
  | 'home'
  | 'dashboard'
  | 'quotation_calculator'
  | 'invoice'
  | 'proforma'
  | 'quotation'
  | 'packing'
  | 'sample'
  | 'contract'
  | 'certificate'
  | 'shipping'
  | 'cbm_calculator'
  | 'products'
  | 'clients'
  | 'settings'
  | 'membership';

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rateToUsd: number; // 1 USD in this currency
  rateFromRmb: number; // 1 Currency in RMB (e.g. 1 USD = 7.23 RMB, 1 EUR = 7.85 RMB, 1 GBP = 9.18 RMB, 1 CAD = 5.32 RMB)
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', rateToUsd: 1.0, rateFromRmb: 7.23 },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', rateToUsd: 0.92, rateFromRmb: 7.86 },
  { code: 'RMB', symbol: '¥', name: 'Chinese Yuan (RMB/CNY)', flag: '🇨🇳', rateToUsd: 7.23, rateFromRmb: 1.0 },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', rateToUsd: 0.79, rateFromRmb: 9.18 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', rateToUsd: 1.36, rateFromRmb: 5.32 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', rateToUsd: 1.52, rateFromRmb: 4.76 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', rateToUsd: 155.0, rateFromRmb: 0.0466 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬', rateToUsd: 1.34, rateFromRmb: 5.40 },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', flag: '🇭🇰', rateToUsd: 7.82, rateFromRmb: 0.925 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', rateToUsd: 0.90, rateFromRmb: 8.03 },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', rateToUsd: 3.67, rateFromRmb: 1.97 },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', rateToUsd: 3.75, rateFromRmb: 1.93 },
  { code: 'EGP', symbol: 'E£', name: 'Egyptian Pound', flag: '🇪🇬', rateToUsd: 48.5, rateFromRmb: 0.149 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', rateToUsd: 83.5, rateFromRmb: 0.0866 },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', rateToUsd: 5.45, rateFromRmb: 1.33 },
  { code: 'MXN', symbol: 'Mex$', name: 'Mexican Peso', flag: '🇲🇽', rateToUsd: 18.2, rateFromRmb: 0.397 },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', flag: '🇰🇷', rateToUsd: 1380.0, rateFromRmb: 0.00524 },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', rateToUsd: 36.8, rateFromRmb: 0.196 },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳', rateToUsd: 25400.0, rateFromRmb: 0.000285 },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', flag: '🇲🇾', rateToUsd: 4.71, rateFromRmb: 1.535 },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', rateToUsd: 16250.0, rateFromRmb: 0.000445 },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', flag: '🇵🇭', rateToUsd: 58.6, rateFromRmb: 0.123 },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', rateToUsd: 1.64, rateFromRmb: 4.41 },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', rateToUsd: 18.4, rateFromRmb: 0.393 },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', rateToUsd: 32.8, rateFromRmb: 0.220 },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble', flag: '🇷🇺', rateToUsd: 89.0, rateFromRmb: 0.0812 },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱', rateToUsd: 3.98, rateFromRmb: 1.817 },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦', rateToUsd: 3.64, rateFromRmb: 1.986 },
  { code: 'KWD', symbol: 'KD', name: 'Kuwaiti Dinar', flag: '🇰🇼', rateToUsd: 0.307, rateFromRmb: 23.55 }
];

export const getCurrencyDetails = (currency?: string): CurrencyInfo => {
  if (!currency) return SUPPORTED_CURRENCIES[0];
  const cur = currency.toUpperCase().trim();
  if (cur === 'CNY') return SUPPORTED_CURRENCIES.find(c => c.code === 'RMB') || SUPPORTED_CURRENCIES[0];
  const found = SUPPORTED_CURRENCIES.find(c => c.code === cur);
  return found || {
    code: cur,
    symbol: cur,
    name: cur,
    flag: '🌐',
    rateToUsd: 1.0,
    rateFromRmb: 7.23
  };
};

export const getCurrencySymbol = (currency?: string): string => {
  if (!currency) return '$';
  const match = getCurrencyDetails(currency);
  return match.symbol;
};

export const formatMoney = (amount: number, currency?: string, decimals: number = 2): string => {
  const symbol = getCurrencySymbol(currency);
  const code = currency ? currency.toUpperCase().trim() : 'USD';
  const formattedNum = (amount || 0).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  // For code-like symbols or currencies like AED, SAR, CHF, format with space
  if (symbol.length > 2 || symbol === 'AED' || symbol === 'SAR' || symbol === 'CHF' || symbol === 'QAR' || symbol === 'KD') {
    return `${symbol} ${formattedNum}`;
  }
  return `${symbol}${formattedNum}`;
};

export const formatUnitPrice = (price: number | string | undefined | null, currency?: string): string => {
  if (price === undefined || price === null || isNaN(Number(price))) {
    return formatMoney(0, currency, 2);
  }
  const num = Number(price);
  const cleanNum = parseFloat(num.toFixed(6));
  const str = String(cleanNum);
  const parts = str.split('.');
  
  // Keep exact user decimals (e.g. 0.0455 -> 4 decimals), with a minimum of 2 and maximum of 6
  let decimals = 2;
  if (parts.length > 1) {
    decimals = Math.max(2, Math.min(parts[1].length, 6));
  }

  const symbol = getCurrencySymbol(currency);
  const formattedNum = cleanNum.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });

  if (symbol.length > 2 || symbol === 'AED' || symbol === 'SAR' || symbol === 'CHF' || symbol === 'QAR' || symbol === 'KD') {
    return `${symbol} ${formattedNum}`;
  }
  return `${symbol}${formattedNum}`;
};



