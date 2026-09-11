import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  QuotationCalculation, 
  Product, 
  Client, 
  Quotation, 
  ProformaInvoice, 
  CompanySettings, 
  getCurrencySymbol,
  getCurrencyDetails,
  formatMoney,
  SUPPORTED_CURRENCIES,
  CurrencyInfo,
  QuotationItem,
  ProformaInvoiceItem
} from '../types';
import { generateId, getNextDocumentNumber, PRODUCT_IMAGES_SVG } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
import { compressImageFile, removeWhiteBackground } from '../utils/imageCompressor';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { 
  Calculator, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Download, 
  X, 
  Check, 
  FileSpreadsheet, 
  Coins, 
  ArrowRight, 
  Copy, 
  Sparkles, 
  Droplets,
  Layers, 
  Paintbrush, 
  FileText, 
  Ship, 
  Truck, 
  PackageCheck, 
  ShieldCheck, 
  DollarSign, 
  Percent, 
  HelpCircle,
  Sliders,
  ChevronDown,
  ChevronUp,
  Tag,
  Boxes,
  Compass,
  CheckCircle2,
  RefreshCw,
  Building2,
  Share2,
  Maximize2,
  Upload,
  Image as ImageIcon,
  Wand2,
  Link2,
  Camera,
  FileImage,
  Palette,
  Globe,
  ArrowLeftRight,
  TrendingUp,
  Loader2,
  Eye,
  FileCheck
} from 'lucide-react';

interface QuotationCalculatorProps {
  quotationCalculations: QuotationCalculation[];
  onSaveQuotationCalculations: (calcs: QuotationCalculation[]) => void;
  products: Product[];
  clients: Client[];
  onSaveClients?: (clients: Client[]) => void;
  quotations: Quotation[];
  onSaveQuotations: (quotations: Quotation[]) => void;
  proformaInvoices: ProformaInvoice[];
  onSaveProformaInvoices: (pis: ProformaInvoice[]) => void;
  settings: CompanySettings;
  setActiveTab: (tab: any) => void;
}

export default function QuotationCalculator({
  quotationCalculations,
  onSaveQuotationCalculations,
  products,
  clients,
  onSaveClients,
  quotations,
  onSaveQuotations,
  proformaInvoices,
  onSaveProformaInvoices,
  settings,
  setActiveTab
}: QuotationCalculatorProps) {
  const { t, language } = useLanguage();
  // Current active calculation
  const [activeCalc, setActiveCalc] = useState<QuotationCalculation>(() => {
    if (quotationCalculations && quotationCalculations.length > 0) {
      return quotationCalculations[0];
    }
    return createDefaultCalculation(products, clients);
  });

  const [search, setSearch] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [tierDisplayCurrency, setTierDisplayCurrency] = useState<string>('ACTIVE');
  const [activeSection, setActiveSection] = useState<'all' | 'tube' | 'color' | 'logo' | 'mechanism' | 'packaging' | 'logistics'>('all');

  // Product Image Management State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [showPresetGallery, setShowPresetGallery] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Target Price Solver & Calibration State
  const [showPriceSolver, setShowPriceSolver] = useState(false);
  const [targetPriceInput, setTargetPriceInput] = useState<number>(0.0495);

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges } = useNavigationGuard();

  // Track if active calculation has unsaved edits
  useEffect(() => {
    const existingInList = (quotationCalculations || []).find(c => c.id === activeCalc.id);
    const hasModifications = !existingInList || JSON.stringify(existingInList) !== JSON.stringify(activeCalc);

    if (hasModifications) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activeCalc.inquiryTitle || `Inquiry Calc: ${activeCalc.calcNumber || 'New'} (${activeCalc.productName})`,
        docType: 'Cost Calculation & Quotation',
        onSave: () => {
          const updatedList = (quotationCalculations || []).some(c => c.id === activeCalc.id)
            ? quotationCalculations.map(c => c.id === activeCalc.id ? activeCalc : c)
            : [activeCalc, ...(quotationCalculations || [])];
          onSaveQuotationCalculations(updatedList);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [activeCalc, quotationCalculations]);

  const PRESET_PRODUCT_IMAGES = [
    { label: 'Trigger Sprayer', key: 'sprayer', svg: PRODUCT_IMAGES_SVG.sprayer },
    { label: 'Mini Mouse Trigger', key: 'miniTrigger', svg: (PRODUCT_IMAGES_SVG as any).miniTrigger || PRODUCT_IMAGES_SVG.sprayer },
    { label: 'Lotion Pump', key: 'pump', svg: PRODUCT_IMAGES_SVG.pump },
    { label: 'Treatment / Serum Pump', key: 'treatmentPump', svg: (PRODUCT_IMAGES_SVG as any).treatmentPump || PRODUCT_IMAGES_SVG.pump },
    { label: 'Fine Mist Sprayer', key: 'mist', svg: PRODUCT_IMAGES_SVG.mist },
    { label: 'Foam Pump', key: 'foam', svg: PRODUCT_IMAGES_SVG.foam },
    { label: 'Foam Brush Head', key: 'foamBrush', svg: PRODUCT_IMAGES_SVG.foamBrush },
    { label: 'Continuous Mist', key: 'continuousSprayer', svg: PRODUCT_IMAGES_SVG.continuousSprayer },
    { label: 'Card Pocket Sprayer', key: 'cardSprayer', svg: PRODUCT_IMAGES_SVG.cardSprayer },
    { label: 'Boston Bottle', key: 'bottle', svg: PRODUCT_IMAGES_SVG.bottle },
    { label: 'Cosmetic Cream Jar', key: 'jar', svg: PRODUCT_IMAGES_SVG.jar },
    { label: 'Travel Bottle Set', key: 'travelKit', svg: PRODUCT_IMAGES_SVG.travelKit },
  ];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper to calibrate calculations to hit any target price (e.g., $0.0495)
  const handleSolveBaseCostForTarget = (targetPrice: number) => {
    const fx = Math.max(0.0001, activeCalc.exchangeRate || 7.20);
    const marginPct = (activeCalc.targetProfitMargin || 12.0) / 100;
    const q = Math.max(1, activeCalc.quantity || 50000);
    const piecesPerBox = Math.max(1, activeCalc.piecesPerCarton || 500);

    // Total Port Logistics Extra Fees
    const totalFobExtraFeesRmb = (activeCalc.inlandFreightRmb || 0) + (activeCalc.portThcAndCustomsRmb || 0) + ((activeCalc.bankHandlingFeeUsd || 0) * fx) + (activeCalc.exportDocsFeeRmb || 0) + (activeCalc.sampleAndCourierRmb || 0) + (activeCalc.otherExtraFeesRmb || 0);
    const unitFobExtraFeeRmb = totalFobExtraFeesRmb / q;

    // Customization & Packaging costs
    let unitTubeRmb = 0;
    if (activeCalc.dipTubeEnabled) {
      const extraLengthMm = Math.max(0, (activeCalc.requiredTubeLengthMm || 0) - (activeCalc.standardTubeLengthMm || 0));
      unitTubeRmb += (extraLengthMm / 10) * (activeCalc.tubeExtraCostPer10mmRmb || 0);
      if (activeCalc.tubeFilterMesh) unitTubeRmb += (activeCalc.tubeFilterMeshCostRmb || 0);
    }
    let unitColorRmb = 0;
    if (activeCalc.colorType === 'custom_pantone') {
      unitColorRmb += (activeCalc.masterbatchColorCostPerUnitRmb || 0) + ((activeCalc.colorMatchingFeeOneOffRmb || 0) / q);
    }
    let unitLogoRmb = 0;
    if (activeCalc.logoEnabled && activeCalc.logoPrintingMethod !== 'none') {
      unitLogoRmb += (activeCalc.logoPrintingCostPerUnitRmb || 0) * Math.max(1, activeCalc.logoColorsCount || 1) + ((activeCalc.logoPlateFeeOneOffRmb || 0) / q) + ((activeCalc.moldCustomizationFeeOneOffRmb || 0) / q);
    }
    const unitMechanismRmb = (activeCalc.nozzleUpgradeCostRmb || 0) + (activeCalc.springUpgradeCostRmb || 0) + (activeCalc.gasketUpgradeCostRmb || 0);
    const unitPackagingRmb = (activeCalc.packagingExtraCostPerUnitRmb || 0) + ((activeCalc.cartonBoxCostRmb || 4.5) / piecesPerBox);

    const targetFobQuoteRmb = targetPrice * fx;
    const targetExwQuoteRmb = Math.max(0, targetFobQuoteRmb - unitFobExtraFeeRmb);
    const targetExwCostRmb = targetExwQuoteRmb * (1 - marginPct);
    const requiredBaseCostRmb = Math.max(0, Number((targetExwCostRmb - unitTubeRmb - unitColorRmb - unitLogoRmb - unitMechanismRmb - unitPackagingRmb).toFixed(4)));

    setActiveCalc(prev => ({
      ...prev,
      baseCostRmb: requiredBaseCostRmb
    }));
    showToast(`Calibrated Base Factory Cost to ¥${requiredBaseCostRmb} RMB to achieve target ${targetPrice} ${activeCalc.currency || 'USD'}/pc!`);
  };

  const handleApplyStandardTriggerSprayerBenchmark = () => {
    setActiveCalc(prev => ({
      ...prev,
      inquiryTitle: '28/410 Standard Plastic Trigger Sprayer (FOB Ningbo Benchmark)',
      productName: '28/410 Plastic Trigger Sprayer (MTS-01)',
      sku: 'MTS-28410-A',
      productCategory: 'Trigger Sprayers',
      neckSize: '28/410',
      closureType: 'Ratchet / Ribbed',
      outputDosage: '1.0ml ± 0.1ml',
      currency: 'USD',
      exchangeRate: 7.20,
      quantity: 50000,
      targetProfitMargin: 12.0,
      baseCostRmb: 0.285,
      dipTubeEnabled: false,
      standardTubeLengthMm: 220,
      requiredTubeLengthMm: 220,
      tubeCutType: 'slant_angle_cut',
      tubeFilterMesh: false,
      tubeFilterMeshCostRmb: 0,
      colorType: 'standard_white_black',
      pantoneCode: 'Standard White / Natural',
      masterbatchColorCostPerUnitRmb: 0,
      colorMatchingFeeOneOffRmb: 0,
      logoEnabled: false,
      packagingType: 'bulk_master_carton',
      cartonBoxCostRmb: 4.5,
      packagingExtraCostPerUnitRmb: 0,
      inlandFreightRmb: 450,
      portThcAndCustomsRmb: 350,
      bankHandlingFeeUsd: 20,
      exportDocsFeeRmb: 100,
      sampleAndCourierRmb: 60,
      remarks: 'Standard 28/410 Plastic Trigger Sprayer (MTS-01) with adjustable Spray/Stream nozzle, 220mm standard PE dip tube, bulk master carton (500 pcs/ctn), FOB Ningbo Port benchmark quote ($0.0495/pc).'
    }));
    showToast('Applied Standard Trigger Sprayer Benchmark ($0.0495/pc FOB Ningbo)!');
  };

  // Image Upload Handlers
  const handleImageFileSelect = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WEBP, SVG)');
      return;
    }
    try {
      setIsUploadingImage(true);
      const compressedBase64 = await compressImageFile(file, 800, 800, 0.85);
      setActiveCalc(prev => ({
        ...prev,
        productImage: compressedBase64
      }));
      showToast('Product photo uploaded and optimized!');
    } catch (err) {
      console.error('Failed to process image:', err);
      showToast('Failed to upload image. Please try another file.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAutoRemoveWhiteBg = async () => {
    if (!activeCalc.productImage) {
      showToast('No product image loaded to process');
      return;
    }
    try {
      setIsRemovingBg(true);
      const transparentPng = await removeWhiteBackground(activeCalc.productImage);
      setActiveCalc(prev => ({
        ...prev,
        productImage: transparentPng
      }));
      showToast('Clean transparent PNG created with background removed!');
    } catch (err) {
      console.error('Background removal failed:', err);
      showToast('Could not remove background on this image');
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleSelectPresetImage = (svg: string, label: string) => {
    setActiveCalc(prev => ({
      ...prev,
      productImage: svg
    }));
    setShowPresetGallery(false);
    showToast(`Applied ${label} illustration`);
  };

  const handleApplyImageUrl = () => {
    if (!imageUrlInput.trim()) {
      showToast('Please enter a valid image URL');
      return;
    }
    setActiveCalc(prev => ({
      ...prev,
      productImage: imageUrlInput.trim()
    }));
    setImageUrlInput('');
    setShowUrlInput(false);
    showToast('Applied web image URL to product');
  };

  const handleClearProductImage = () => {
    setActiveCalc(prev => ({
      ...prev,
      productImage: ''
    }));
    showToast('Product image removed');
  };

  // Helper to create empty calculation
  function createDefaultCalculation(prods: Product[], clis: Client[]): QuotationCalculation {
    const defaultProd = prods[0];
    const defaultCli = clis[0];

    return {
      id: generateId(),
      calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
      inquiryTitle: '28/410 Standard Plastic Trigger Sprayer (FOB Ningbo Benchmark)',
      date: new Date().toISOString().slice(0, 10),
      client: defaultCli,
      clientName: defaultCli?.company || '',
      currency: 'USD',
      exchangeRate: 7.20,
      quantity: 50000,
      targetProfitMargin: 12.0,
      taxRebateRate: 13.0,

      productId: defaultProd?.id || 'p1',
      productName: defaultProd?.name || '28/410 Plastic Trigger Sprayer (MTS-01)',
      sku: defaultProd?.sku || 'MTS-28410-A',
      productCategory: defaultProd?.category || 'Trigger Sprayers',
      neckSize: defaultProd?.size || '28/410',
      closureType: 'Ratchet / Ribbed',
      outputDosage: '1.0ml ± 0.1ml',
      baseCostRmb: 0.285,
      baseCostCurrency: 'RMB',
      productImage: defaultProd?.image || PRODUCT_IMAGES_SVG.sprayer,

      // 1. Dip Tube Customization
      dipTubeEnabled: false,
      standardTubeLengthMm: 220,
      requiredTubeLengthMm: 220,
      tubeExtraCostPer10mmRmb: 0.0025,
      tubeMaterial: 'standard_pe',
      tubeCutType: 'slant_angle_cut',
      tubeFilterMesh: false,
      tubeFilterMeshCostRmb: 0,

      // 2. Color Customization
      colorType: 'standard_white_black',
      pantoneCode: 'Standard White / Natural',
      masterbatchColorCostPerUnitRmb: 0,
      colorMatchingFeeOneOffRmb: 0,
      surfaceFinishCostPerUnitRmb: 0,

      // 3. Logo Customization
      logoEnabled: false,
      logoPrintingMethod: 'none',
      logoColorsCount: 0,
      logoPrintingCostPerUnitRmb: 0,
      logoPlateFeeOneOffRmb: 0,
      moldCustomizationFeeOneOffRmb: 0,

      // 4. Function Upgrades
      nozzleType: 'spray_stream_off',
      nozzleUpgradeCostRmb: 0,
      springMaterial: 'sus304_standard',
      springUpgradeCostRmb: 0,
      gasketType: 'pe_foam_standard',
      gasketUpgradeCostRmb: 0,

      // 5. Packaging
      packagingType: 'bulk_master_carton',
      piecesPerCarton: defaultProd?.piecesPerBox || 500,
      cartonLengthCm: defaultProd?.cartonLength || 57,
      cartonWidthCm: defaultProd?.cartonWidth || 38,
      cartonHeightCm: defaultProd?.cartonHeight || 42,
      cartonGrossWeightKg: defaultProd?.grossWeight || 13.2,
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

      portOfLoading: 'Ningbo Port, China',
      portOfDestination: 'Long Beach, CA, USA',
      leadTimeDays: 20,
      remarks: 'Standard 28/410 Plastic Trigger Sprayer (MTS-01) with adjustable Spray/Stream nozzle, 220mm standard PE dip tube, bulk master carton (500 pcs/ctn), FOB Ningbo Port benchmark quote ($0.0495/pc).',
      createdAt: new Date().toISOString()
    };
  }

  // Preset Inquiries
  const loadPreset = (presetKey: 'trigger' | 'trigger_foam' | 'mini_trigger' | 'mist' | 'lotion' | 'lotion_gallon' | 'treatment' | 'foam' | 'continuous') => {
    if (presetKey === 'trigger') {
      const p = products.find(prod => prod.category.toLowerCase().includes('trigger') && !prod.name.toLowerCase().includes('mini')) || products[0];
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '28/410 Standard Trigger Sprayer (FOB Ningbo $0.0495/pc)',
        productName: p?.name || '28/410 Plastic Trigger Sprayer (MTS-01)',
        sku: p?.sku || 'MTS-28410-A',
        productCategory: 'Trigger Sprayers',
        neckSize: '28/410',
        closureType: 'Ratchet / Ribbed',
        baseCostRmb: 0.285,
        productImage: p?.image || PRODUCT_IMAGES_SVG.sprayer,
        dipTubeEnabled: false,
        standardTubeLengthMm: 220,
        requiredTubeLengthMm: 220,
        tubeExtraCostPer10mmRmb: 0.0025,
        tubeCutType: 'slant_angle_cut',
        tubeFilterMesh: false,
        tubeFilterMeshCostRmb: 0,
        nozzleType: 'spray_stream_off',
        nozzleUpgradeCostRmb: 0,
        colorType: 'standard_white_black',
        pantoneCode: 'Standard White / Natural',
        masterbatchColorCostPerUnitRmb: 0,
        colorMatchingFeeOneOffRmb: 0,
        logoEnabled: false,
        logoPrintingMethod: 'none',
        logoColorsCount: 0,
        logoPrintingCostPerUnitRmb: 0,
        logoPlateFeeOneOffRmb: 0,
        packagingType: 'bulk_master_carton',
        packagingExtraCostPerUnitRmb: 0,
        cartonBoxCostRmb: 4.5,
        inlandFreightRmb: 450,
        portThcAndCustomsRmb: 350,
        bankHandlingFeeUsd: 20,
        exportDocsFeeRmb: 100,
        sampleAndCourierRmb: 60,
        quantity: 50000,
        targetProfitMargin: 12.0,
        exchangeRate: 7.20,
        currency: 'USD'
      });
      showToast('Loaded Standard Trigger Sprayer Benchmark ($0.0495/pc FOB Ningbo)!');
    } else if (presetKey === 'trigger_foam') {
      const p = products.find(prod => prod.category.toLowerCase().includes('trigger')) || products[0];
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '28/410 Trigger Sprayer (with Foam Mesh Nozzle +¥0.025)',
        productName: p?.name || '28/410 Plastic Trigger Sprayer (MTS-01)',
        sku: p?.sku || 'MTS-28410-FOAM',
        productCategory: 'Trigger Sprayers',
        neckSize: '28/410',
        closureType: 'Ratchet / Ribbed',
        baseCostRmb: 0.62,
        productImage: p?.image || PRODUCT_IMAGES_SVG.sprayer,
        dipTubeEnabled: true,
        standardTubeLengthMm: 200,
        requiredTubeLengthMm: 260,
        tubeExtraCostPer10mmRmb: 0.003,
        tubeCutType: 'slant_angle_cut',
        tubeFilterMesh: true,
        tubeFilterMeshCostRmb: 0.015,
        nozzleType: 'foam_mesh_nozzle',
        nozzleUpgradeCostRmb: 0.025,
        colorType: 'custom_pantone',
        pantoneCode: 'Pantone 2935C Royal Blue / White Foam Mesh',
        masterbatchColorCostPerUnitRmb: 0.015,
        colorMatchingFeeOneOffRmb: 300,
        logoEnabled: true,
        logoPrintingMethod: 'silkscreen',
        logoColorsCount: 1,
        logoPrintingCostPerUnitRmb: 0.035,
        logoPlateFeeOneOffRmb: 200,
        packagingType: 'egg_grid_partition',
        packagingExtraCostPerUnitRmb: 0.012,
        quantity: 50000,
        targetProfitMargin: 16.0
      });
      showToast('Loaded Trigger Sprayer with Foam Mesh Nozzle Preset');
    } else if (presetKey === 'mini_trigger') {
      const p = products.find(prod => prod.name.toLowerCase().includes('mini') || prod.name.toLowerCase().includes('mouse')) || products[0];
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '24/410 Mouse Mini Trigger Sprayer (with Safety Clip & Fine Mist)',
        productName: '24/410 Mouse Mini Trigger Sprayer (MTS-24-MOUSE)',
        sku: 'MTS-24410-MINI',
        productCategory: 'Mini Trigger Sprayers',
        neckSize: '24/410',
        closureType: 'Smooth with Lock Clip',
        outputDosage: '0.25ml ± 0.05ml',
        baseCostRmb: 0.32,
        productImage: (PRODUCT_IMAGES_SVG as any).miniTrigger || PRODUCT_IMAGES_SVG.sprayer,
        dipTubeEnabled: true,
        standardTubeLengthMm: 150,
        requiredTubeLengthMm: 180,
        tubeExtraCostPer10mmRmb: 0.002,
        tubeCutType: 'v_notch',
        tubeFilterMesh: false,
        colorType: 'custom_pantone',
        pantoneCode: 'Emerald Green Body / Black Button Clip',
        masterbatchColorCostPerUnitRmb: 0.012,
        colorMatchingFeeOneOffRmb: 250,
        logoEnabled: false,
        packagingType: 'individual_polybag',
        packagingExtraCostPerUnitRmb: 0.008,
        quantity: 50000,
        targetProfitMargin: 15.0
      });
      showToast('Loaded Mouse Mini Trigger Sprayer Preset');
    } else if (presetKey === 'mist') {
      const p = products.find(prod => prod.category.toLowerCase().includes('mist')) || products[2] || products[0];
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '24/410 Fine Mist Sprayer (Gold Hot Stamp + Clear Cap)',
        productName: p?.name || '24/410 Fine Mist Sprayer (MMS-02)',
        sku: p?.sku || 'MMS-24410-B',
        productCategory: 'Fine Mist Sprayers',
        neckSize: '24/410',
        closureType: 'Smooth with Aluminum Sheath',
        outputDosage: '0.15ml ± 0.02ml',
        baseCostRmb: 0.45,
        productImage: p?.image || PRODUCT_IMAGES_SVG.mist,
        dipTubeEnabled: true,
        standardTubeLengthMm: 140,
        requiredTubeLengthMm: 190,
        tubeExtraCostPer10mmRmb: 0.002,
        tubeCutType: 'v_notch',
        tubeFilterMesh: false,
        colorType: 'metallic_electroplating',
        pantoneCode: 'Shiny Gold Cap / White Body',
        surfaceFinishCostPerUnitRmb: 0.06,
        logoEnabled: true,
        logoPrintingMethod: 'hot_stamping',
        logoColorsCount: 1,
        logoPrintingCostPerUnitRmb: 0.04,
        logoPlateFeeOneOffRmb: 250,
        packagingType: 'individual_polybag',
        packagingExtraCostPerUnitRmb: 0.01,
        quantity: 30000,
        targetProfitMargin: 18.0
      });
      showToast('Loaded Fine Mist Sprayer Inquiry Preset');
    } else if (presetKey === 'lotion') {
      const p = products.find(prod => prod.category.toLowerCase().includes('lotion')) || products[1] || products[0];
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '33/410 High Dosage Lotion Pump (SUS316 Chemical Spring + Pallet)',
        productName: p?.name || '33/410 Heavy Lotion Pump (MLP-33410)',
        sku: p?.sku || 'MLP-33410-L',
        productCategory: 'Lotion Pumps',
        neckSize: '33/410',
        closureType: 'Ribbed',
        outputDosage: '4.0ml ± 0.3ml',
        baseCostRmb: 0.85,
        productImage: p?.image || PRODUCT_IMAGES_SVG.pump,
        dipTubeEnabled: true,
        standardTubeLengthMm: 180,
        requiredTubeLengthMm: 240,
        tubeExtraCostPer10mmRmb: 0.003,
        tubeCutType: 'straight_cut',
        tubeFilterMesh: false,
        colorType: 'custom_pantone',
        pantoneCode: 'Pantone 7461C Matte Teal',
        masterbatchColorCostPerUnitRmb: 0.02,
        colorMatchingFeeOneOffRmb: 300,
        springMaterial: 'sus316_chemical',
        springUpgradeCostRmb: 0.03,
        packagingType: 'palletized',
        palletsCount: 4,
        palletCostEachRmb: 120,
        quantity: 40000,
        targetProfitMargin: 15.0
      });
      showToast('Loaded Luxury Lotion Pump Inquiry Preset');
    } else if (presetKey === 'lotion_gallon') {
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '38/400 High Viscosity Gallon Dispensing Pump (10ml-30ml Output)',
        productName: '38/400 Industrial Gallon Dispenser Pump (MGP-38400)',
        sku: 'MGP-38400-HD',
        productCategory: 'Lotion Pumps',
        neckSize: '38/400',
        closureType: 'Ribbed with Lock Down Spout',
        outputDosage: '15.0ml ± 1.0ml',
        baseCostRmb: 1.35,
        productImage: PRODUCT_IMAGES_SVG.pump,
        dipTubeEnabled: true,
        standardTubeLengthMm: 220,
        requiredTubeLengthMm: 300,
        tubeExtraCostPer10mmRmb: 0.004,
        tubeCutType: 'slant_angle_cut',
        tubeFilterMesh: false,
        tubeMaterial: 'heavy_duty_thick',
        colorType: 'custom_pantone',
        pantoneCode: 'White Body / Blue Plunger Collar',
        masterbatchColorCostPerUnitRmb: 0.02,
        springMaterial: 'sus304_standard',
        packagingType: 'egg_grid_partition',
        packagingExtraCostPerUnitRmb: 0.015,
        quantity: 20000,
        targetProfitMargin: 16.0
      });
      showToast('Loaded Industrial Gallon Dispenser Pump Preset');
    } else if (presetKey === 'treatment') {
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '20/410 Cosmetic Serum & Treatment Pump (Clear Overcap)',
        productName: '20/410 Treatment / Essence Dispenser Pump (MTP-20410)',
        sku: 'MTP-20410-SRM',
        productCategory: 'Fine Mist Sprayers',
        neckSize: '20/410',
        closureType: 'Smooth Anodized Aluminum Collar',
        outputDosage: '0.2ml ± 0.03ml',
        baseCostRmb: 0.52,
        productImage: (PRODUCT_IMAGES_SVG as any).treatmentPump || PRODUCT_IMAGES_SVG.pump,
        dipTubeEnabled: true,
        standardTubeLengthMm: 100,
        requiredTubeLengthMm: 130,
        tubeExtraCostPer10mmRmb: 0.002,
        tubeCutType: 'v_notch',
        colorType: 'metallic_electroplating',
        pantoneCode: 'Rose Gold Aluminum / Frost Clear Cap',
        surfaceFinishCostPerUnitRmb: 0.08,
        packagingType: 'individual_polybag',
        packagingExtraCostPerUnitRmb: 0.012,
        quantity: 20000,
        targetProfitMargin: 18.0
      });
      showToast('Loaded Serum Treatment Pump Preset');
    } else if (presetKey === 'foam') {
      const p = products.find(prod => prod.category.toLowerCase().includes('foam')) || products[0];
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '43/410 Facial Cleansing Foam Pump with Silicone Brush',
        productName: p?.name || '43/410 Brush Foam Pump (FMB-43410)',
        sku: p?.sku || 'FMB-43410-PNK',
        productCategory: 'Foam Pumps',
        neckSize: '43/410',
        closureType: 'Threaded Overcap',
        outputDosage: '0.8ml',
        baseCostRmb: 0.85,
        productImage: p?.image || PRODUCT_IMAGES_SVG.foamBrush || PRODUCT_IMAGES_SVG.foam,
        dipTubeEnabled: true,
        standardTubeLengthMm: 150,
        requiredTubeLengthMm: 170,
        tubeExtraCostPer10mmRmb: 0.003,
        nozzleType: 'foam_mesh_nozzle',
        nozzleUpgradeCostRmb: 0.02,
        colorType: 'two_tone_assembly',
        pantoneCode: 'Pink Silicone Brush + Pearl White Pump',
        masterbatchColorCostPerUnitRmb: 0.025,
        logoEnabled: true,
        logoPrintingMethod: 'silkscreen',
        logoColorsCount: 1,
        logoPrintingCostPerUnitRmb: 0.035,
        packagingType: 'individual_polybag',
        packagingExtraCostPerUnitRmb: 0.015,
        quantity: 20000,
        targetProfitMargin: 17.0
      });
      showToast('Loaded Foam Pump Inquiry Preset');
    } else if (presetKey === 'continuous') {
      setActiveCalc({
        ...createDefaultCalculation(products, clients),
        id: generateId(),
        calcNumber: getNextDocumentNumber('calc', quotationCalculations || []),
        inquiryTitle: '300ml Continuous Ultra-Fine Mist Sprayer (Flairosol Style)',
        productName: '300ml Flairosol High-Pressure Continuous Mist Sprayer (MCS-300)',
        sku: 'MCS-300-FLR',
        productCategory: 'Continuous Sprayers',
        neckSize: 'Bayonet Snap / 24mm',
        closureType: 'Ergonomic Curved Trigger Engine',
        outputDosage: '1.25ml/sec continuous',
        baseCostRmb: 2.30,
        productImage: PRODUCT_IMAGES_SVG.continuousSprayer,
        dipTubeEnabled: true,
        standardTubeLengthMm: 190,
        requiredTubeLengthMm: 210,
        tubeExtraCostPer10mmRmb: 0.003,
        colorType: 'custom_pantone',
        pantoneCode: 'Matte Gradient Black & White',
        masterbatchColorCostPerUnitRmb: 0.05,
        packagingType: 'individual_polybag',
        packagingExtraCostPerUnitRmb: 0.03,
        quantity: 10000,
        targetProfitMargin: 18.0
      });
      showToast('Loaded Continuous Mist Sprayer Preset');
    }
  };

  // -------------------------------------------------------------
  // Comprehensive Mathematical Cost & Pricing Engine
  // -------------------------------------------------------------
  const calcResults = useMemo(() => {
    const q = Math.max(1, activeCalc.quantity || 1);
    const activeCurrency = activeCalc.currency || 'USD';
    const currDetails = getCurrencyDetails(activeCurrency);
    const fx = Math.max(0.0001, activeCalc.exchangeRate || (currDetails ? currDetails.rateFromRmb : 7.20));
    const marginPct = (activeCalc.targetProfitMargin || 0) / 100;
    const piecesPerBox = Math.max(1, activeCalc.piecesPerCarton || 500);

    // Reference exchange rates for parallel multi-currency benchmark display
    const fxUsd = activeCurrency === 'USD' ? fx : 7.23;
    const fxEur = activeCurrency === 'EUR' ? fx : 7.86;
    const fxGbp = activeCurrency === 'GBP' ? fx : 9.18;
    const fxRmb = 1.0;

    // 1. Base Cost
    const unitBaseRmb = activeCalc.baseCostRmb || 0;

    // 2. Dip Tube Surcharge
    let unitTubeRmb = 0;
    if (activeCalc.dipTubeEnabled) {
      const extraLengthMm = Math.max(0, (activeCalc.requiredTubeLengthMm || 0) - (activeCalc.standardTubeLengthMm || 0));
      const extraSegments = extraLengthMm / 10; // each 10mm
      unitTubeRmb += extraSegments * (activeCalc.tubeExtraCostPer10mmRmb || 0);

      if (activeCalc.tubeFilterMesh) {
        unitTubeRmb += (activeCalc.tubeFilterMeshCostRmb || 0);
      }
      if (activeCalc.tubeMaterial === 'heavy_duty_thick') {
        unitTubeRmb += 0.005;
      } else if (activeCalc.tubeMaterial === 'silicone_soft') {
        unitTubeRmb += 0.035;
      } else if (activeCalc.tubeMaterial === 'chemical_fluorinated') {
        unitTubeRmb += 0.045;
      }
    }

    // 3. Color & Surface Treatment Surcharge
    let unitColorRmb = 0;
    if (activeCalc.colorType === 'custom_pantone') {
      unitColorRmb += (activeCalc.masterbatchColorCostPerUnitRmb || 0);
      // One-off color matching fee amortized over order quantity
      unitColorRmb += (activeCalc.colorMatchingFeeOneOffRmb || 0) / q;
    } else if (activeCalc.colorType === 'two_tone_assembly') {
      unitColorRmb += (activeCalc.masterbatchColorCostPerUnitRmb || 0.02);
    } else if (activeCalc.colorType === 'metallic_electroplating' || activeCalc.colorType === 'uv_coating') {
      unitColorRmb += (activeCalc.surfaceFinishCostPerUnitRmb || 0.08);
    }

    // 4. Logo Printing & Mold Tooling Surcharge
    let unitLogoRmb = 0;
    if (activeCalc.logoEnabled && activeCalc.logoPrintingMethod !== 'none') {
      const colors = Math.max(1, activeCalc.logoColorsCount || 1);
      unitLogoRmb += (activeCalc.logoPrintingCostPerUnitRmb || 0) * colors;
      // One-off plate/screen fee amortized
      unitLogoRmb += (activeCalc.logoPlateFeeOneOffRmb || 0) / q;
      // One-off mold insert fee amortized
      unitLogoRmb += (activeCalc.moldCustomizationFeeOneOffRmb || 0) / q;
    }

    // 5. Functional & Mechanism Upgrades
    let unitMechanismRmb = 0;
    unitMechanismRmb += (activeCalc.nozzleUpgradeCostRmb || 0);
    unitMechanismRmb += (activeCalc.springUpgradeCostRmb || 0);
    unitMechanismRmb += (activeCalc.gasketUpgradeCostRmb || 0);

    // 6. Packaging & Carton Amortization
    const totalCartons = Math.ceil(q / piecesPerBox);
    const cartonVolumeCbmEach = ((activeCalc.cartonLengthCm || 50) * (activeCalc.cartonWidthCm || 40) * (activeCalc.cartonHeightCm || 40)) / 1000000;
    const totalCbm = Number((totalCartons * cartonVolumeCbmEach).toFixed(2));
    const totalGrossWeightKg = Number((totalCartons * (activeCalc.cartonGrossWeightKg || 12)).toFixed(1));

    let unitPackagingRmb = (activeCalc.packagingExtraCostPerUnitRmb || 0);
    // Outer Carton Box Cost amortized per piece
    unitPackagingRmb += (activeCalc.cartonBoxCostRmb || 6.5) / piecesPerBox;
    // Pallet cost amortized
    if (activeCalc.packagingType === 'palletized' && activeCalc.palletsCount) {
      unitPackagingRmb += (activeCalc.palletsCount * (activeCalc.palletCostEachRmb || 120)) / q;
    }

    // Total Factory Ex-Works Manufacturing Cost per Piece (RMB)
    const unitExwCostRmb = unitBaseRmb + unitTubeRmb + unitColorRmb + unitLogoRmb + unitMechanismRmb + unitPackagingRmb;
    const unitExwCostTarget = unitExwCostRmb / fx;
    const unitExwCostUsd = unitExwCostRmb / fxUsd;

    // Factory EXW Quote per piece with Target Margin
    // Quote = Cost / (1 - Margin)
    const unitExwQuoteRmb = marginPct < 1 ? unitExwCostRmb / (1 - marginPct) : unitExwCostRmb * 1.2;
    const unitExwQuoteTarget = unitExwQuoteRmb / fx;
    const unitExwQuoteUsd = unitExwQuoteRmb / fxUsd;
    const unitExwQuoteEur = unitExwQuoteRmb / fxEur;
    const unitExwQuoteGbp = unitExwQuoteRmb / fxGbp;

    // 7. Domestic Logistics, Inland Freight & Port Charges (RMB)
    const totalInlandTruckingRmb = activeCalc.inlandFreightRmb || 0;
    const totalPortChargesRmb = activeCalc.portThcAndCustomsRmb || 0;
    const totalBankFeeRmb = (activeCalc.bankHandlingFeeUsd || 0) * fxUsd;
    const totalDocsAndSampleRmb = (activeCalc.exportDocsFeeRmb || 0) + (activeCalc.sampleAndCourierRmb || 0) + (activeCalc.otherExtraFeesRmb || 0);

    const totalFobExtraFeesRmb = totalInlandTruckingRmb + totalPortChargesRmb + totalBankFeeRmb + totalDocsAndSampleRmb;
    const unitFobExtraFeeRmb = totalFobExtraFeesRmb / q;
    const unitFobExtraFeeTarget = unitFobExtraFeeRmb / fx;
    const unitFobExtraFeeUsd = unitFobExtraFeeRmb / fxUsd;

    // FOB Ningbo / Shanghai Quote per piece
    const unitFobCostRmb = unitExwCostRmb + unitFobExtraFeeRmb;
    const unitFobCostTarget = unitFobCostRmb / fx;
    const unitFobCostUsd = unitFobCostRmb / fxUsd;
    const unitFobQuoteRmb = unitExwQuoteRmb + unitFobExtraFeeRmb;
    const unitFobQuoteTarget = unitFobQuoteRmb / fx;
    const unitFobQuoteUsd = unitFobQuoteRmb / fxUsd;
    const unitFobQuoteEur = unitFobQuoteRmb / fxEur;
    const unitFobQuoteGbp = unitFobQuoteRmb / fxGbp;

    // 8. International Freight (for CFR/CIF)
    const unitOceanFreightUsd = (activeCalc.internationalFreightUsd || 0) / q;
    const unitCifQuoteUsd = unitFobQuoteUsd + unitOceanFreightUsd;
    const unitCifQuoteTarget = unitFobQuoteTarget + (unitOceanFreightUsd * fxUsd) / fx;

    // 9. DDP Destination Duty & Delivery
    const unitDdpDutyUsd = (activeCalc.destinationDutyAndDeliveryUsd || 0) / q;
    const unitDdpQuoteUsd = unitCifQuoteUsd + unitDdpDutyUsd;
    const unitDdpQuoteTarget = unitCifQuoteTarget + (unitDdpDutyUsd * fxUsd) / fx;

    // Overall Financial Totals
    const totalExwAmountTarget = Number(((unitExwQuoteRmb * q) / fx).toFixed(2));
    const totalFobAmountTarget = Number(((unitFobQuoteRmb * q) / fx).toFixed(2));
    const totalFobAmountRmb = Number((unitFobQuoteRmb * q).toFixed(2));
    const totalExwAmountRmb = Number((unitExwQuoteRmb * q).toFixed(2));
    const totalCostAmountRmb = Number((unitFobCostRmb * q).toFixed(2));
    const totalProfitAmountRmb = Number((totalFobAmountRmb - totalCostAmountRmb).toFixed(2));
    const totalProfitAmountTarget = Number((totalProfitAmountRmb / fx).toFixed(2));
    const actualProfitMarginPercent = Number(((totalProfitAmountRmb / totalFobAmountRmb) * 100).toFixed(1));

    // Parallel multi-currency totals
    const totalFobAmountUsd = Number(((unitFobQuoteRmb * q) / fxUsd).toFixed(2));
    const totalExwAmountUsd = Number(((unitExwQuoteRmb * q) / fxUsd).toFixed(2));
    const totalProfitAmountUsd = Number((totalProfitAmountRmb / fxUsd).toFixed(2));

    const totalFobAmountEur = Number(((unitFobQuoteRmb * q) / fxEur).toFixed(2));
    const totalExwAmountEur = Number(((unitExwQuoteRmb * q) / fxEur).toFixed(2));

    const totalFobAmountGbp = Number(((unitFobQuoteRmb * q) / fxGbp).toFixed(2));
    const totalExwAmountGbp = Number(((unitExwQuoteRmb * q) / fxGbp).toFixed(2));

    // Quantity Tier Breakdown (5k, 10k, 25k, 50k, 100k)
    const tiers = [5000, 10000, 25000, 50000, 100000].map(tierQty => {
      // Amortize one-off fixed fees over tier quantity
      const fixedColorMatching = (activeCalc.colorMatchingFeeOneOffRmb || 0) / tierQty;
      const fixedLogoPlate = (activeCalc.logoPlateFeeOneOffRmb || 0) / tierQty;
      const fixedMold = (activeCalc.moldCustomizationFeeOneOffRmb || 0) / tierQty;
      const fixedLogistics = totalFobExtraFeesRmb / tierQty;

      // Variable component
      const variableUnit = unitBaseRmb + unitTubeRmb + (unitColorRmb - ((activeCalc.colorMatchingFeeOneOffRmb || 0)/q)) + (unitLogoRmb - (((activeCalc.logoPlateFeeOneOffRmb || 0) + (activeCalc.moldCustomizationFeeOneOffRmb || 0))/q)) + unitMechanismRmb + unitPackagingRmb;
      const tierUnitCostRmb = variableUnit + fixedColorMatching + fixedLogoPlate + fixedMold + fixedLogistics;
      
      const tierFobQuoteTarget = (tierUnitCostRmb / (1 - marginPct)) / fx;
      const tierExwQuoteTarget = ((tierUnitCostRmb - fixedLogistics) / (1 - marginPct)) / fx;

      const tierFobQuoteUsd = (tierUnitCostRmb / (1 - marginPct)) / fxUsd;
      const tierExwQuoteUsd = ((tierUnitCostRmb - fixedLogistics) / (1 - marginPct)) / fxUsd;

      const tierFobQuoteEur = (tierUnitCostRmb / (1 - marginPct)) / fxEur;
      const tierExwQuoteEur = ((tierUnitCostRmb - fixedLogistics) / (1 - marginPct)) / fxEur;

      const tierFobQuoteGbp = (tierUnitCostRmb / (1 - marginPct)) / fxGbp;
      const tierExwQuoteGbp = ((tierUnitCostRmb - fixedLogistics) / (1 - marginPct)) / fxGbp;

      const tierFobQuoteRmb = (tierUnitCostRmb / (1 - marginPct));
      const tierExwQuoteRmb = ((tierUnitCostRmb - fixedLogistics) / (1 - marginPct));

      return {
        qty: tierQty,
        exwTarget: Number(tierExwQuoteTarget.toFixed(4)),
        fobTarget: Number(tierFobQuoteTarget.toFixed(4)),
        totalTarget: Number((tierFobQuoteTarget * tierQty).toFixed(2)),

        exwUsd: Number(tierExwQuoteUsd.toFixed(4)),
        fobUsd: Number(tierFobQuoteUsd.toFixed(4)),
        totalUsd: Number((tierFobQuoteUsd * tierQty).toFixed(2)),

        exwEur: Number(tierExwQuoteEur.toFixed(4)),
        fobEur: Number(tierFobQuoteEur.toFixed(4)),
        totalEur: Number((tierFobQuoteEur * tierQty).toFixed(2)),

        exwGbp: Number(tierExwQuoteGbp.toFixed(4)),
        fobGbp: Number(tierFobQuoteGbp.toFixed(4)),
        totalGbp: Number((tierFobQuoteGbp * tierQty).toFixed(2)),

        exwRmb: Number(tierExwQuoteRmb.toFixed(3)),
        fobRmb: Number(tierFobQuoteRmb.toFixed(3)),
        totalRmb: Number((tierFobQuoteRmb * tierQty).toFixed(2)),

        isCurrent: tierQty === q
      };
    });

    return {
      q,
      fx,
      activeCurrency,
      currDetails,
      totalCartons,
      totalCbm,
      totalGrossWeightKg,
      unitBaseRmb,
      unitTubeRmb,
      unitColorRmb,
      unitLogoRmb,
      unitMechanismRmb,
      unitPackagingRmb,
      unitExwCostRmb,
      unitExwCostTarget,
      unitExwCostUsd,
      unitExwQuoteRmb,
      unitExwQuoteTarget,
      unitExwQuoteUsd,
      unitExwQuoteEur,
      unitExwQuoteGbp,
      unitFobExtraFeeRmb,
      unitFobExtraFeeTarget,
      unitFobExtraFeeUsd,
      unitFobCostRmb,
      unitFobCostTarget,
      unitFobCostUsd,
      unitFobQuoteRmb,
      unitFobQuoteTarget,
      unitFobQuoteUsd,
      unitFobQuoteEur,
      unitFobQuoteGbp,
      unitCifQuoteUsd,
      unitCifQuoteTarget,
      unitDdpQuoteUsd,
      unitDdpQuoteTarget,
      totalExwAmountTarget,
      totalFobAmountTarget,
      totalExwAmountRmb,
      totalFobAmountRmb,
      totalCostAmountRmb,
      totalProfitAmountRmb,
      totalProfitAmountTarget,
      totalExwAmountUsd,
      totalFobAmountUsd,
      totalProfitAmountUsd,
      totalFobAmountEur,
      totalExwAmountEur,
      totalFobAmountGbp,
      totalExwAmountGbp,
      actualProfitMarginPercent,
      tiers
    };
  }, [activeCalc]);

  // Save current calculation
  const handleSaveCurrent = () => {
    const updatedList = quotationCalculations.some(c => c.id === activeCalc.id)
      ? quotationCalculations.map(c => c.id === activeCalc.id ? activeCalc : c)
      : [activeCalc, ...quotationCalculations];

    onSaveQuotationCalculations(updatedList);
    showToast(`Inquiry Calculation "${activeCalc.calcNumber}" saved successfully.`);
  };

  // Delete current calculation
  const handleDeleteCurrent = (idToDelete: string) => {
    const nextList = quotationCalculations.filter(c => c.id !== idToDelete);
    onSaveQuotationCalculations(nextList);
    if (nextList.length > 0) {
      setActiveCalc(nextList[0]);
    } else {
      const fresh = createDefaultCalculation(products, clients);
      setActiveCalc(fresh);
      onSaveQuotationCalculations([fresh]);
    }
    showToast('Calculation deleted');
  };

  // Convert to official Quotation
  const handleConvertToQuotation = () => {
    const currency = activeCalc.currency || 'USD';
    const unitPrice = calcResults.unitFobQuoteTarget;
    const nozzleLabel = 
      activeCalc.nozzleType === 'foam_mesh_nozzle' ? 'Foam Mesh Nozzle' :
      activeCalc.nozzleType === 'dual_spray_mist' ? 'Dual Spray & Foam Nozzle' :
      activeCalc.nozzleType === 'child_resistant_lock' ? 'CR Lock Nozzle' :
      activeCalc.nozzleType === 'upside_down_360' ? '360° Inverted Nozzle' : '';

    const newItem: QuotationItem = {
      id: generateId(),
      productId: activeCalc.productId || 'custom-p1',
      name: `${activeCalc.productName} (${nozzleLabel ? nozzleLabel + ', ' : ''}${activeCalc.pantoneCode ? activeCalc.pantoneCode + ', ' : ''}${activeCalc.requiredTubeLengthMm}mm tube${activeCalc.logoEnabled ? ', Logo printed' : ''})`,
      sku: activeCalc.sku,
      size: activeCalc.neckSize,
      material: 'PP & PE (Eco-friendly)',
      color: activeCalc.pantoneCode || 'Custom Pantone Color',
      unitPrice: Number(unitPrice.toFixed(4)),
      moq: Math.min(10000, activeCalc.quantity),
      quantity: activeCalc.quantity,
      piecesPerBox: activeCalc.piecesPerCarton,
      numBoxes: calcResults.totalCartons,
      totalPieces: activeCalc.quantity,
      totalPrice: Number((unitPrice * activeCalc.quantity).toFixed(2)),
      leadTime: `${activeCalc.leadTimeDays || 20} days`,
      cbm: calcResults.totalCbm,
      grossWeight: calcResults.totalGrossWeightKg,
      image: activeCalc.productImage
    };

    const newQuotation: Quotation = {
      id: generateId(),
      quotationNumber: getNextDocumentNumber('quotation', quotations),
      date: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      currency: currency,
      salesperson: 'Andrew Sales Manager',
      client: activeCalc.client || clients[0],
      incoterm: 'FOB',
      portOfLoading: activeCalc.portOfLoading || 'Ningbo Port, China',
      portOfDestination: activeCalc.portOfDestination || '',
      paymentTerms: '30% T/T deposit upon order confirmation, 70% balance before shipment',
      estimatedLeadTime: `${activeCalc.leadTimeDays || 20} days upon deposit & pre-production sample approval`,
      items: [newItem],
      shippingFee: 0,
      packagingFee: 0,
      discountAmount: 0,
      subtotal: Number((unitPrice * activeCalc.quantity).toFixed(2)),
      grandTotal: Number((unitPrice * activeCalc.quantity).toFixed(2)),
      totalCbm: calcResults.totalCbm,
      totalCartons: calcResults.totalCartons,
      totalWeight: calcResults.totalGrossWeightKg,
      notes: `Customized product specifications as per inquiry ${activeCalc.calcNumber}: Tube Length ${activeCalc.requiredTubeLengthMm}mm, Color: ${activeCalc.pantoneCode || 'Custom'}, Packaging: ${activeCalc.packagingType.replace(/_/g, ' ')}.`,
      terms: 'FOB Ningbo/Shanghai terms. Prices valid for 30 days based on current PP raw material index.',
      showStamp: true,
      createdAt: new Date().toISOString()
    };

    onSaveQuotations([newQuotation, ...quotations]);
    showToast(`Converted to Formal Quotation "${newQuotation.quotationNumber}" (${currency})! Redirecting...`);
    setTimeout(() => {
      setActiveTab('quotation');
    }, 1200);
  };

  // Convert to Proforma Invoice (PI)
  const handleConvertToProformaInvoice = () => {
    const currency = activeCalc.currency || 'USD';
    const unitPrice = calcResults.unitFobQuoteTarget;
    const totalVal = Number((unitPrice * activeCalc.quantity).toFixed(2));
    const depositPct = 30;
    const depositAmt = Number(((totalVal * depositPct) / 100).toFixed(2));
    const balanceAmt = Number((totalVal - depositAmt).toFixed(2));
    const nozzleLabel = 
      activeCalc.nozzleType === 'foam_mesh_nozzle' ? 'Foam Mesh Nozzle' :
      activeCalc.nozzleType === 'dual_spray_mist' ? 'Dual Spray & Foam Nozzle' :
      activeCalc.nozzleType === 'child_resistant_lock' ? 'CR Lock Nozzle' :
      activeCalc.nozzleType === 'upside_down_360' ? '360° Inverted Nozzle' : '';

    const newItem: ProformaInvoiceItem = {
      id: generateId(),
      productId: activeCalc.productId || 'custom-p1',
      name: `${activeCalc.productName} (${nozzleLabel ? nozzleLabel + ', ' : ''}Customized ${activeCalc.requiredTubeLengthMm}mm Tube, ${activeCalc.pantoneCode || 'Custom Color'})`,
      sku: activeCalc.sku,
      size: activeCalc.neckSize,
      unitPrice: Number(unitPrice.toFixed(4)),
      quantity: activeCalc.quantity,
      piecesPerBox: activeCalc.piecesPerCarton,
      numBoxes: calcResults.totalCartons,
      totalPieces: activeCalc.quantity,
      totalPrice: totalVal,
      image: activeCalc.productImage
    };

    const newPI: ProformaInvoice = {
      id: generateId(),
      proformaNumber: getNextDocumentNumber('proforma', proformaInvoices),
      date: new Date().toISOString().slice(0, 10),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      currency: currency,
      salesperson: 'Andrew Sales Manager',
      client: activeCalc.client || clients[0],
      incoterm: 'FOB',
      portOfLoading: activeCalc.portOfLoading || 'Ningbo Port, China',
      portOfDestination: activeCalc.portOfDestination || '',
      paymentTerms: '30% T/T deposit upon order confirmation, 70% balance before shipment',
      depositPercentage: depositPct,
      depositAmount: depositAmt,
      balanceAmount: balanceAmt,
      items: [newItem],
      shippingFee: 0,
      insurance: 0,
      subtotal: totalVal,
      grandTotal: totalVal,
      estimatedLeadTime: `${activeCalc.leadTimeDays || 20} days after deposit receipt`,
      notes: `Customized Production: Tube ${activeCalc.requiredTubeLengthMm}mm, Pantone ${activeCalc.pantoneCode || 'Standard'}, Packaging: ${activeCalc.packagingType.replace(/_/g, ' ')}.`,
      terms: 'Payment via Bank Wire (T/T). Banking charges outside China are for buyer account.',
      createdAt: new Date().toISOString()
    };

    onSaveProformaInvoices([newPI, ...proformaInvoices]);
    showToast(`Converted to Proforma Invoice "${newPI.proformaNumber}"! Redirecting...`);
    setTimeout(() => {
      setActiveTab('proforma');
    }, 1200);
  };

  // Filter calculation list
  const filteredCalculations = (quotationCalculations || []).filter(c => 
    c.calcNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.inquiryTitle.toLowerCase().includes(search.toLowerCase()) ||
    (c.client?.company || c.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
    c.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div id="quotation-calculator-app" className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-semibold">{notification}</span>
        </div>
      )}

      {/* Top Header & Fast Preset Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1565C0]">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {t('calculator.title', 'Quotation Calculator & Inquiry Cost Engine')}
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1565C0] border border-blue-200/60">
                    {language === 'zh' ? '外贸精准核价' : 'Cost Engine'}
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('calculator.subtitle', 'Calculate trigger sprayers, pumps & mist sprayers inquiries: dip tube length, Pantone color masterbatch, logo printing, egg-grid packing, port THC & FOB/EXW/CIF pricing.')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                const fresh = createDefaultCalculation(products, clients);
                setActiveCalc(fresh);
                showToast(language === 'zh' ? '已创建新的询盘核价单' : 'Started new inquiry calculation');
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors border border-slate-300/80 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              {language === 'zh' ? '新建核价询盘' : t('calculator.new_calculation', 'New Inquiry')}
            </button>

            <button
              onClick={handleSaveCurrent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[#1565C0] hover:bg-[#0D47A1] text-white shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {language === 'zh' ? '保存核价结果' : t('calculator.save_calculation', 'Save Calculation')}
            </button>

            <button
              onClick={handleConvertToQuotation}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              title={language === 'zh' ? '从此核价结果一键生成正式对外《外贸形式报价单》' : 'Generate formal price quotation document from this calculation'}
            >
              <FileSpreadsheet className="w-4 h-4" />
              {language === 'zh' ? '一键生成报价单' : t('calculator.convert_quotation', 'Convert to Quotation')}
            </button>

            <button
              onClick={handleConvertToProformaInvoice}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer"
              title={language === 'zh' ? '从此核价结果一键生成形式发票(PI)' : 'Generate formal Proforma Invoice (PI) from this calculation'}
            >
              <Coins className="w-4 h-4" />
              {language === 'zh' ? '一键生成形式发票(PI)' : t('calculator.convert_pi', 'Convert to PI')}
            </button>

            <button
              onClick={() => printDocument('inquiry-cost-sheet')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200"
              title={language === 'zh' ? '打印官方核算分析单' : 'Print Cost Analysis Sheet'}
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={async () => {
                setIsDownloading(true);
                try {
                  await exportDocumentToPDF('inquiry-cost-sheet', `Cost_Calculation_${activeCalc.calcNumber}`);
                  showToast(language === 'zh' ? `已成功保存 ${activeCalc.calcNumber} 核价单 PDF！` : `Cost Sheet PDF for ${activeCalc.calcNumber} saved successfully!`);
                } catch (err) {
                  console.error('PDF export failed:', err);
                  showToast(language === 'zh' ? '正在调用系统打印对话框导出...' : 'Exporting via print dialog fallback...');
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer border border-slate-200 disabled:opacity-50"
              title={language === 'zh' ? '导出 PDF 核算单' : 'Export PDF Cost Sheet'}
            >
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-[#1565C0]" /> : <Download className="w-4 h-4" />}
              <span className="hidden sm:inline">{language === 'zh' ? '导出 PDF' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

          {/* 1-Click Fast Presets */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {language === 'zh' ? '一键快速载入泵头喷枪询盘模板:' : '1-Click Dispensing System Presets:'}
          </span>
          <button
            onClick={() => loadPreset('trigger')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            title="Standard Trigger Sprayer 28/410 - Benchmark $0.0495/pc"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            {language === 'zh' ? '⭐ 28/410 标准扳机喷枪 (基准 $0.0495/pc)' : 'Trigger Sprayer Standard ($0.0495/pc)'}
          </button>
          <button
            onClick={() => loadPreset('trigger_foam')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan-50 text-cyan-800 hover:bg-cyan-100 transition-colors border border-cyan-300/60 cursor-pointer flex items-center gap-1"
          >
            <Droplets className="w-3 h-3 text-cyan-600" />
            {language === 'zh' ? '发泡网嘴喷枪' : 'Foam Trigger Sprayer'}
          </button>
          <button
            onClick={() => loadPreset('mini_trigger')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors border border-emerald-300/60 cursor-pointer flex items-center gap-1"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            {language === 'zh' ? '小老鼠微型扳机' : 'Mini Mouse Trigger'}
          </button>
          <button
            onClick={() => loadPreset('lotion')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors border border-amber-200/50 cursor-pointer"
          >
            {language === 'zh' ? '乳液泵 (24-33mm)' : 'Lotion Pump (Standard 24-33mm)'}
          </button>
          <button
            onClick={() => loadPreset('lotion_gallon')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 text-orange-800 hover:bg-orange-100 transition-colors border border-orange-200/50 cursor-pointer"
          >
            {language === 'zh' ? '工业加仑泵 (38/400)' : 'Gallon Dispenser Pump (38/400)'}
          </button>
          <button
            onClick={() => loadPreset('mist')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200/50 cursor-pointer"
          >
            {language === 'zh' ? '细雾喷雾头' : 'Fine Mist Sprayer'}
          </button>
          <button
            onClick={() => loadPreset('treatment')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors border border-violet-200/50 cursor-pointer"
          >
            {language === 'zh' ? '精华精油泵' : 'Serum Treatment Pump'}
          </button>
          <button
            onClick={() => loadPreset('foam')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200/50 cursor-pointer"
          >
            {language === 'zh' ? '洁面刷头泡沫泵' : 'Brush Foam Pump'}
          </button>
          <button
            onClick={() => loadPreset('continuous')}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200/50 cursor-pointer"
          >
            {language === 'zh' ? '高压连续喷雾枪' : 'Continuous Mist (Flairosol)'}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Controls (Customization Parameters) & Right Pricing Dashboard */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left Column: Calculation Parameters & Customization Matrix (7 Cols) */}
        <div className="xl:col-span-7 space-y-6">
          {/* Card 1: Inquiry Basics & Commercial Baseline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-[#1565C0]" />
                {language === 'zh' ? '1. 询盘基本信息与基准核算参数' : '1. Inquiry Information & Baseline'}
              </h2>
              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {activeCalc.calcNumber}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '询盘标题 / 客户询价描述' : 'Inquiry Title / Description'}
                </label>
                <input
                  type="text"
                  value={activeCalc.inquiryTitle}
                  onChange={e => setActiveCalc({ ...activeCalc, inquiryTitle: e.target.value })}
                  placeholder={language === 'zh' ? '例: 28/410 塑料扳机喷枪定制询盘 - 客户 John USA' : 'e.g. 28/410 Trigger Sprayer Custom Inquiry - John USA'}
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span>{language === 'zh' ? '买家客户 / 公司名称' : 'Client / Buyer'}</span>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="text-[11px] text-[#1565C0] hover:underline font-medium cursor-pointer"
                  >
                    {language === 'zh' ? '从客户库选择' : 'Select Client DB'}
                  </button>
                </label>
                <input
                  type="text"
                  value={activeCalc.client?.company || activeCalc.clientName || ''}
                  onChange={e => setActiveCalc({ ...activeCalc, clientName: e.target.value })}
                  placeholder={language === 'zh' ? '输入客户公司名称' : 'Client company name'}
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '订购数量 (Pcs)' : 'Order Quantity (Pcs)'}
                </label>
                <input
                  type="number"
                  min={1}
                  step={1000}
                  value={activeCalc.quantity}
                  onChange={e => setActiveCalc({ ...activeCalc, quantity: Math.max(1, Number(e.target.value)) })}
                  className="w-full text-sm font-bold text-slate-900 bg-blue-50/50 border border-blue-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '目标毛利率 (%)' : 'Target Profit Margin (%)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={80}
                    step={0.5}
                    value={activeCalc.targetProfitMargin}
                    onChange={e => setActiveCalc({ ...activeCalc, targetProfitMargin: Number(e.target.value) })}
                    className="w-full text-sm font-bold text-emerald-700 bg-emerald-50/40 border border-emerald-200 rounded-xl pl-3.5 pr-8 py-2 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Quotation Currency Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-blue-600" />
                    {language === 'zh' ? '对外报价结算币种' : 'Quotation Currency'}
                  </span>
                  <span className="text-[10px] text-slate-400">{language === 'zh' ? '支持29种全球主流外币' : '29 Currencies'}</span>
                </label>
                <select
                  value={activeCalc.currency || 'USD'}
                  onChange={e => {
                    const newCurr = e.target.value;
                    const cInfo = getCurrencyDetails(newCurr);
                    setActiveCalc({
                      ...activeCalc,
                      currency: newCurr,
                      exchangeRate: cInfo ? cInfo.rateFromRmb : activeCalc.exchangeRate
                    });
                  }}
                  className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  {SUPPORTED_CURRENCIES.map(curr => (
                    <option key={curr.code} value={curr.code}>
                      {curr.flag} {curr.code} ({curr.symbol}) - {curr.name} [Ref: 1={curr.rateFromRmb}¥]
                    </option>
                  ))}
                </select>
              </div>

              {/* Exchange Rate Config */}
              <div className="sm:col-span-2 bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/70 rounded-xl p-3 border border-blue-100/80 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-blue-600" />
                    {language === 'zh' 
                      ? `实时结汇汇率 (每 1 ${activeCalc.currency || 'USD'} 兑换人民币 RMB)` 
                      : `Custom Exchange Rate (RMB per 1 ${activeCalc.currency || 'USD'})`}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const cInfo = getCurrencyDetails(activeCalc.currency || 'USD');
                        if (cInfo) {
                          setActiveCalc({ ...activeCalc, exchangeRate: cInfo.rateFromRmb });
                        }
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-white hover:bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      title={language === 'zh' ? '重置为系统基准参考汇率' : 'Reset to benchmark reference exchange rate'}
                    >
                      <RefreshCw className="w-3 h-3" />
                      {language === 'zh' 
                        ? `恢复基准参考 (${getCurrencyDetails(activeCalc.currency || 'USD')?.rateFromRmb || 7.20}¥)` 
                        : `Reset to Standard (${getCurrencyDetails(activeCalc.currency || 'USD')?.rateFromRmb || 7.20}¥)`}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step={0.0001}
                      min={0.0001}
                      value={activeCalc.exchangeRate}
                      onChange={e => setActiveCalc({ ...activeCalc, exchangeRate: Math.max(0.0001, Number(e.target.value)) })}
                      className="w-full text-sm font-black text-slate-900 bg-white border border-blue-200 rounded-lg pl-3 pr-16 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono shadow-2xs"
                    />
                    <span className="absolute right-2.5 top-1.5 text-xs text-slate-500 font-bold font-mono">
                      ¥ / 1 {activeCalc.currency || 'USD'}
                    </span>
                  </div>

                  {/* Quick Fine-Tuning Step Controls */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setActiveCalc({ ...activeCalc, exchangeRate: Number(Math.max(0.0001, (activeCalc.exchangeRate || 7.20) - 0.05).toFixed(4)) })}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold font-mono rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                      title="Decrease rate by 0.05"
                    >
                      -0.05
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCalc({ ...activeCalc, exchangeRate: Number(((activeCalc.exchangeRate || 7.20) + 0.05).toFixed(4)) })}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold font-mono rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                      title="Increase rate by 0.05"
                    >
                      +0.05
                    </button>
                  </div>
                </div>

                {/* Live Currency Quick-Pick Pills & Formula Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-blue-100/60 text-[11px]">
                  <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                    <span className="text-slate-500 font-medium mr-1 text-[10px]">
                      {language === 'zh' ? '常用外币:' : 'Popular:'}
                    </span>
                    {['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'RMB', 'AED', 'SAR', 'JPY'].map(cCode => {
                      const cItem = getCurrencyDetails(cCode);
                      const isSelected = (activeCalc.currency || 'USD') === cCode;
                      return (
                        <button
                          key={cCode}
                          type="button"
                          onClick={() => {
                            if (cItem) {
                              setActiveCalc({
                                ...activeCalc,
                                currency: cCode,
                                exchangeRate: cItem.rateFromRmb
                              });
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono flex items-center gap-1 transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-blue-600 text-white shadow-xs' 
                              : 'bg-white text-slate-700 hover:bg-blue-50 border border-slate-200'
                          }`}
                        >
                          <span>{cItem?.flag}</span>
                          <span>{cCode}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="font-mono text-slate-600 font-medium">
                    1 {activeCalc.currency || 'USD'} = <span className="font-bold text-blue-700">{activeCalc.exchangeRate} RMB</span>
                    <span className="text-slate-400 mx-1.5">|</span>
                    1 RMB = <span className="font-bold text-slate-800">{(1 / Math.max(0.0001, activeCalc.exchangeRate || 7.20)).toFixed(4)} {activeCalc.currency || 'USD'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Base Product Selection & Factory Raw Cost */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#1565C0]" />
                {language === 'zh' ? '2. 基础产品与出厂裸价成本' : '2. Base Product & Raw Factory Cost'}
              </h2>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                className="text-xs font-bold text-[#1565C0] bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                {language === 'zh' ? '从产品库选取' : 'Pick from Product Library'}
              </button>
            </div>

            {/* Product Image Showcase & Upload Panel */}
            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#1565C0]" />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'zh' ? '产品图片与视觉规格 (产品实拍 / 矢量图)' : 'Product Photo & Visual Spec'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {activeCalc.productImage && (
                    <button
                      type="button"
                      onClick={handleAutoRemoveWhiteBg}
                      disabled={isRemovingBg}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/60 transition-colors cursor-pointer disabled:opacity-50"
                      title={language === 'zh' ? '自动识别白色底色并转化为透明底 PNG' : 'Auto-detect white background and convert into transparent PNG'}
                    >
                      <Wand2 className={`w-3.5 h-3.5 ${isRemovingBg ? 'animate-spin' : 'text-indigo-600'}`} />
                      {isRemovingBg ? (language === 'zh' ? '抠图中...' : 'Removing BG...') : (language === 'zh' ? '一键去除白底' : 'Remove White BG')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowPresetGallery(!showPresetGallery);
                      setShowUrlInput(false);
                    }}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border ${showPresetGallery ? 'bg-[#1565C0] text-white border-[#1565C0]' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'}`}
                  >
                    <Palette className="w-3.5 h-3.5" />
                    {language === 'zh' ? '预设矢量图' : 'Preset Vectors'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUrlInput(!showUrlInput);
                      setShowPresetGallery(false);
                    }}
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer border ${showUrlInput ? 'bg-[#1565C0] text-white border-[#1565C0]' : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'}`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    {language === 'zh' ? '网络链接' : 'URL'}
                  </button>
                </div>
              </div>

              {/* Main Image Frame & Upload Zone */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Visual Thumbnail Box with Drag & Drop */}
                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDraggingOver(true);
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={e => {
                    e.preventDefault();
                    setIsDraggingOver(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleImageFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-28 h-28 sm:w-32 sm:h-32 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all relative overflow-hidden group shrink-0 ${
                    isDraggingOver 
                      ? 'border-blue-500 bg-blue-50/80 scale-102' 
                      : activeCalc.productImage 
                        ? 'border-slate-200 bg-white shadow-xs hover:border-blue-400' 
                        : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30'
                  }`}
                  title={language === 'zh' ? '点击或拖拽上传/替换产品实物图' : 'Click or drag & drop to upload/replace product photo'}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png, image/jpeg, image/webp, image/svg+xml"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageFileSelect(e.target.files[0]);
                      }
                    }}
                  />

                  {activeCalc.productImage ? (
                    <>
                      <img
                        src={activeCalc.productImage}
                        alt={activeCalc.productName || 'Product Image'}
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-semibold gap-1">
                        <Upload className="w-4 h-4" />
                        <span>{language === 'zh' ? '更换图片' : 'Change Photo'}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 gap-1.5 p-1">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Upload className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 leading-tight">
                        {isUploadingImage ? (language === 'zh' ? '正在上传...' : 'Uploading...') : (language === 'zh' ? '拖拽或点击上传' : 'Drop or Click to Upload')}
                      </span>
                      <span className="text-[9px] text-slate-400">PNG, JPG, SVG</span>
                    </div>
                  )}
                </div>

                {/* Details & Action Controls */}
                <div className="flex-1 space-y-2 w-full">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{activeCalc.productName || (language === 'zh' ? '定制产品' : 'Custom Product')}</span>
                        {activeCalc.productImage && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                            {language === 'zh' ? '已载入实拍图' : 'Photo Loaded'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {language === 'zh' 
                          ? '高清图片将自动同步至外贸形式报价单、PI 发票及官方 A4 核算分析单中。' 
                          : 'High-resolution photo will automatically sync to quotations, proforma invoices, and printable cost analysis sheets.'}
                      </p>
                    </div>

                    {activeCalc.productImage && (
                      <button
                        type="button"
                        onClick={handleClearProductImage}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={language === 'zh' ? '删除产品照片' : 'Remove product photo'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1565C0] hover:bg-[#0D47A1] text-white transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingImage ? (language === 'zh' ? '处理中...' : 'Processing...') : (language === 'zh' ? '上传图片文件' : 'Upload Image File')}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowProductModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-slate-500" />
                      {language === 'zh' ? '从产品目录选取' : 'Select from Catalog'}
                    </button>
                  </div>
                </div>
              </div>

              {/* URL Input Drawer */}
              {showUrlInput && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 animate-in fade-in duration-150">
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={e => setImageUrlInput(e.target.value)}
                    placeholder={language === 'zh' ? '粘贴图片网络链接 (例如 https://...)' : 'Paste direct product image URL (e.g. https://...)'}
                    className="flex-1 text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={handleApplyImageUrl}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-[#1565C0] text-white hover:bg-blue-700 cursor-pointer"
                  >
                    {language === 'zh' ? '应用网址' : 'Apply URL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(false)}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Preset Vector Gallery Drawer */}
              {showPresetGallery && (
                <div className="pt-3 border-t border-slate-200/80 space-y-2 animate-in fade-in duration-150">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    {language === 'zh' ? '选择标准泵头/喷枪/瓶盖产品矢量剪影:' : 'Select Standard Packaging Silhouette:'}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {PRESET_PRODUCT_IMAGES.map((preset) => (
                      <button
                        key={preset.key}
                        type="button"
                        onClick={() => handleSelectPresetImage(preset.svg, preset.label)}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 ${
                          activeCalc.productImage === preset.svg 
                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' 
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <img 
                          src={preset.svg} 
                          alt={preset.label} 
                          className="w-12 h-12 object-contain" 
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] font-medium text-slate-700 leading-tight">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '产品品名 / 型号' : 'Product Model / Name'}
                </label>
                <input
                  type="text"
                  value={activeCalc.productName}
                  onChange={e => setActiveCalc({ ...activeCalc, productName: e.target.value })}
                  placeholder={language === 'zh' ? '例如: 28/410 塑料扳机喷枪' : 'e.g. 28/410 Plastic Trigger Sprayer'}
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '产品分类大类' : 'Product Category'}
                </label>
                <select
                  value={activeCalc.productCategory || 'Trigger Sprayers'}
                  onChange={e => setActiveCalc({ ...activeCalc, productCategory: e.target.value })}
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Trigger Sprayers">{language === 'zh' ? '标准扳机喷枪 (Trigger Sprayers)' : 'Trigger Sprayers (标准扳机喷枪)'}</option>
                  <option value="Mini Trigger Sprayers">{language === 'zh' ? '微型小老鼠扳机 (Mini Trigger)' : 'Mini Trigger Sprayers (微型小老鼠扳机)'}</option>
                  <option value="Lotion Pumps">{language === 'zh' ? '乳液泵 / 沐浴露泵 (Lotion Pumps)' : 'Lotion Pumps (乳液泵 / 沐浴露泵)'}</option>
                  <option value="Gallon Dispensing Pumps">{language === 'zh' ? '大剂量工业加仑泵 38/400 (Gallon Pumps)' : 'Gallon Pumps (大剂量工业桶泵 38/400)'}</option>
                  <option value="Foam Pumps">{language === 'zh' ? '泡沫泵 / 洁面刷头 (Foam Pumps)' : 'Foam Pumps (泡沫泵 / 洁面刷头)'}</option>
                  <option value="Fine Mist Sprayers">{language === 'zh' ? '细雾喷雾头 (Fine Mist Sprayers)' : 'Fine Mist Sprayers (细雾喷雾头)'}</option>
                  <option value="Treatment Pumps">{language === 'zh' ? '精华液/精油泵 (Treatment Pumps)' : 'Treatment Pumps (精华液/精油泵)'}</option>
                  <option value="Continuous Sprayers">{language === 'zh' ? '高压连续喷雾枪 (Continuous Sprayers)' : 'Continuous Sprayers (高压连续喷雾枪)'}</option>
                  <option value="Closures & Caps">{language === 'zh' ? '各类瓶盖 / 翻盖 (Closures & Caps)' : 'Closures & Caps (各类瓶盖 / 翻盖)'}</option>
                  <option value="Bottles & Jars">{language === 'zh' ? '配套瓶罐容器 (Bottles & Jars)' : 'Bottles & Jars (配套瓶罐容器)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '产品货号 / SKU' : 'SKU / Code'}
                </label>
                <input
                  type="text"
                  value={activeCalc.sku}
                  onChange={e => setActiveCalc({ ...activeCalc, sku: e.target.value })}
                  className="w-full text-sm font-mono text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '口径 / 牙口规格' : 'Neck Size / Closure'}
                </label>
                <input
                  type="text"
                  value={activeCalc.neckSize}
                  onChange={e => setActiveCalc({ ...activeCalc, neckSize: e.target.value })}
                  placeholder="28/410, 24/410, 33/410..."
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '盖面 / 牙口类型' : 'Closure Type'}
                </label>
                <select
                  value={activeCalc.closureType || 'Ribbed'}
                  onChange={e => setActiveCalc({ ...activeCalc, closureType: e.target.value })}
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                >
                  <option value="Ribbed">{language === 'zh' ? '螺纹防滑 (Ribbed)' : 'Ribbed (螺纹防滑)'}</option>
                  <option value="Smooth">{language === 'zh' ? '光滑平盖 (Smooth)' : 'Smooth (光滑平盖)'}</option>
                  <option value="Smooth with Lock Clip">{language === 'zh' ? '卡扣防压扣 (Smooth with Lock Clip)' : 'Smooth with Lock Clip (卡扣防压扣)'}</option>
                  <option value="Ratchet">{language === 'zh' ? '防盗卡扣 (Ratchet Anti-Spin)' : 'Ratchet Anti-Spin (防盗卡扣)'}</option>
                  <option value="Aluminum Sheath">{language === 'zh' ? '电化铝包边 (Aluminum Metal Sheath)' : 'Aluminum Metal Sheath (电化铝包边)'}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '出液量 / 泵出量' : 'Output Dosage'}
                </label>
                <input
                  type="text"
                  value={activeCalc.outputDosage || '1.0ml ± 0.1ml'}
                  onChange={e => setActiveCalc({ ...activeCalc, outputDosage: e.target.value })}
                  placeholder="e.g. 1.0ml, 0.15ml, 4.0ml"
                  className="w-full text-sm font-medium text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {language === 'zh' ? '出厂裸价成本 (RMB/pc)' : 'Raw Factory Cost (RMB/pc)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={0.001}
                    value={activeCalc.baseCostRmb}
                    onChange={e => setActiveCalc({ ...activeCalc, baseCostRmb: Number(e.target.value) })}
                    className="w-full text-sm font-bold text-slate-900 bg-amber-50/50 border border-amber-200 rounded-xl pl-7 pr-3.5 py-2 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono"
                  />
                  <span className="absolute left-2.5 top-2.5 text-xs text-amber-700 font-bold">¥</span>
                </div>
              </div>
            </div>

            {/* Target Price Auto-Solver & Quick Benchmark Box */}
            <div className="mt-4 pt-3 border-t border-slate-100 bg-blue-50/60 rounded-xl p-3.5 border border-blue-200/70">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {language === 'zh' ? '目标对外单价反推计算 (逆向推演出厂裸价)' : 'Target Unit Price Calibration Solver'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleApplyStandardTriggerSprayerBenchmark}
                  className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-slate-950" />
                  {language === 'zh' ? '⭐ 标准扳机枪基准 ($0.0495/pc)' : '⭐ Standard Trigger ($0.0495/pc)'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">
                    {language === 'zh' ? '目标对外报价:' : 'Target Quote Price:'}
                  </span>
                  <div className="relative w-32">
                    <input
                      type="number"
                      step={0.0001}
                      min={0.001}
                      value={targetPriceInput}
                      onChange={e => setTargetPriceInput(Number(e.target.value))}
                      className="w-full text-xs font-bold text-slate-900 bg-white border border-blue-300 rounded-lg pl-6 pr-2 py-1.5 focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-mono"
                    />
                    <span className="absolute left-2 top-1.5 text-xs text-blue-700 font-bold">
                      {activeCalc.currency === 'USD' ? '$' : activeCalc.currency === 'EUR' ? '€' : activeCalc.currency === 'GBP' ? '£' : '¥'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSolveBaseCostForTarget(targetPriceInput)}
                  className="px-3 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  {language === 'zh' ? '一键自动反推出厂裸价' : 'Auto-Calculate Base Cost'}
                </button>
                <span className="text-[11px] text-blue-800/80">
                  {language === 'zh' 
                    ? `目标: ${activeCalc.currency === 'USD' ? '$' : ''}${targetPriceInput} / pc (含宁波港 FOB 及 ${activeCalc.targetProfitMargin || 12}% 目标利润)` 
                    : `Target: ${activeCalc.currency === 'USD' ? '$' : ''}${targetPriceInput} / pc (FOB Ningbo with ${activeCalc.targetProfitMargin || 12}% profit margin)`}
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Customization Matrix - Dip Tube, Color, Logo, Mechanism */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#1565C0]" />
                {language === 'zh' ? '3. 定制工艺与附加费矩阵' : '3. Customization & Surcharges'}
              </h2>
              <span className="text-xs text-slate-400 font-medium">
                {language === 'zh' ? '多维度智能自动加价计算' : 'Automatic Surcharge Calculations'}
              </span>
            </div>

            {/* A. Dip Tube Customization */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="dipTubeEnabled"
                    checked={activeCalc.dipTubeEnabled}
                    onChange={e => setActiveCalc({ ...activeCalc, dipTubeEnabled: e.target.checked })}
                    className="w-4 h-4 text-[#1565C0] rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="dipTubeEnabled" className="text-xs font-bold text-slate-800 cursor-pointer">
                    {language === 'zh' ? '吸管长度与裁切工艺定制' : 'Dip Tube Length & Specification'}
                  </label>
                </div>
                {activeCalc.dipTubeEnabled && (
                  <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                    +¥{calcResults.unitTubeRmb.toFixed(4)} / pc
                  </span>
                )}
              </div>

              {activeCalc.dipTubeEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'zh' ? '标配长度 (mm)' : 'Standard Length (mm)'}
                    </label>
                    <input
                      type="number"
                      value={activeCalc.standardTubeLengthMm}
                      onChange={e => setActiveCalc({ ...activeCalc, standardTubeLengthMm: Number(e.target.value) })}
                      className="w-full text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'zh' ? '要求长度 (mm)' : 'Requested Length (mm)'}
                    </label>
                    <input
                      type="number"
                      value={activeCalc.requiredTubeLengthMm}
                      onChange={e => setActiveCalc({ ...activeCalc, requiredTubeLengthMm: Number(e.target.value) })}
                      className="w-full text-xs font-bold text-blue-700 bg-blue-50/60 border border-blue-200 rounded-lg px-2.5 py-1.5 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'zh' ? '管尾切口方式' : 'Tube Cut Type'}
                    </label>
                    <select
                      value={activeCalc.tubeCutType}
                      onChange={e => setActiveCalc({ ...activeCalc, tubeCutType: e.target.value as any })}
                      className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5"
                    >
                      <option value="slant_angle_cut">{language === 'zh' ? '斜角切口 (Slant Cut)' : 'Slant Cut (斜角切口)'}</option>
                      <option value="straight_cut">{language === 'zh' ? '平口 (Straight Cut)' : 'Straight Cut (平口)'}</option>
                      <option value="v_notch">{language === 'zh' ? 'V型缺口 (V-Notch)' : 'V-Notch (V型缺口)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'zh' ? '超长每10mm加价 (¥)' : 'Extra per 10mm (¥)'}
                    </label>
                    <input
                      type="number"
                      step={0.0005}
                      value={activeCalc.tubeExtraCostPer10mmRmb}
                      onChange={e => setActiveCalc({ ...activeCalc, tubeExtraCostPer10mmRmb: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                    />
                  </div>

                  <div className="sm:col-span-4 flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeCalc.tubeFilterMesh}
                        onChange={e => setActiveCalc({ ...activeCalc, tubeFilterMesh: e.target.checked })}
                        className="w-3.5 h-3.5 text-[#1565C0] rounded border-slate-300"
                      />
                      {language === 'zh' ? '加装吸管底部防堵滤网 (+¥0.015/pc)' : 'Add Bottom Anti-Clog Filter Mesh (+¥0.015/pc)'}
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {language === 'zh' ? '超长差值: ' : 'Delta: '}+{Math.max(0, activeCalc.requiredTubeLengthMm - activeCalc.standardTubeLengthMm)} mm
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* B. Color & Surface Customization */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'zh' ? '颜色与表面工艺定制' : 'Color & Surface Treatment'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded">
                  +¥{calcResults.unitColorRmb.toFixed(4)} / pc
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '颜色与工艺类型' : 'Color Type'}
                  </label>
                  <select
                    value={activeCalc.colorType}
                    onChange={e => setActiveCalc({ ...activeCalc, colorType: e.target.value as any })}
                    className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="standard_white_black">{language === 'zh' ? '常规现货标准色 (黑/白/本色半透)' : 'Standard Stock (White / Black / Natural)'}</option>
                    <option value="custom_pantone">{language === 'zh' ? '定制潘通色母注塑 (Custom Pantone)' : 'Custom Pantone Masterbatch (定制色母)'}</option>
                    <option value="two_tone_assembly">{language === 'zh' ? '双色拼色组装 (Two-Tone Assembly)' : 'Two-Tone Dual Color Assembly (双色拼色)'}</option>
                    <option value="metallic_electroplating">{language === 'zh' ? 'UV 真空电镀金属色 (Electroplating)' : 'Metallic Electroplating (UV真空电镀)'}</option>
                    <option value="uv_coating">{language === 'zh' ? '哑光 / 亮光喷涂工艺 (UV Coating)' : 'Matte / Glossy UV Coating (喷涂工艺)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '潘通色号 / 颜色描述' : 'Color / Pantone Code'}
                  </label>
                  <input
                    type="text"
                    value={activeCalc.pantoneCode}
                    onChange={e => setActiveCalc({ ...activeCalc, pantoneCode: e.target.value })}
                    placeholder={language === 'zh' ? '例如: Pantone 2935C / 哑光磨砂银' : 'e.g. Pantone 2935C / Matte Silver'}
                    className="w-full text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '单只颜色加价值 (¥/pc)' : 'Color Surcharge / pc (¥)'}
                  </label>
                  <input
                    type="number"
                    step={0.005}
                    value={activeCalc.colorType === 'metallic_electroplating' || activeCalc.colorType === 'uv_coating' ? activeCalc.surfaceFinishCostPerUnitRmb : activeCalc.masterbatchColorCostPerUnitRmb}
                    onChange={e => {
                      const v = Number(e.target.value);
                      if (activeCalc.colorType === 'metallic_electroplating' || activeCalc.colorType === 'uv_coating') {
                        setActiveCalc({ ...activeCalc, surfaceFinishCostPerUnitRmb: v });
                      } else {
                        setActiveCalc({ ...activeCalc, masterbatchColorCostPerUnitRmb: v });
                      }
                    }}
                    className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                {activeCalc.colorType === 'custom_pantone' && (
                  <div className="sm:col-span-3 flex items-center justify-between text-xs bg-purple-50/50 p-2 rounded-lg border border-purple-100">
                    <span className="text-purple-800">
                      {language === 'zh' ? '一次性对色打样费 (固定摊销):' : 'One-off Color Matching Fee:'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-purple-900">¥</span>
                      <input
                        type="number"
                        value={activeCalc.colorMatchingFeeOneOffRmb}
                        onChange={e => setActiveCalc({ ...activeCalc, colorMatchingFeeOneOffRmb: Number(e.target.value) })}
                        className="w-20 text-xs font-mono font-bold bg-white border border-purple-200 rounded px-2 py-0.5 text-right"
                      />
                      <span className="text-[11px] text-purple-600">
                        {language === 'zh' ? '平摊至单只: ' : 'Amortized: '}+¥{((activeCalc.colorMatchingFeeOneOffRmb || 0) / calcResults.q).toFixed(4)}/pc
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* C. Logo & Branding Customization */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="logoEnabled"
                    checked={activeCalc.logoEnabled}
                    onChange={e => setActiveCalc({ ...activeCalc, logoEnabled: e.target.checked })}
                    className="w-4 h-4 text-[#1565C0] rounded border-slate-300 focus:ring-blue-500"
                  />
                  <label htmlFor="logoEnabled" className="text-xs font-bold text-slate-800 cursor-pointer">
                    {language === 'zh' ? 'Logo 加印与定制模具刻字' : 'Logo Printing & Mold Tooling'}
                  </label>
                </div>
                {activeCalc.logoEnabled && (
                  <span className="text-xs font-mono font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded">
                    +¥{calcResults.unitLogoRmb.toFixed(4)} / pc
                  </span>
                )}
              </div>

              {activeCalc.logoEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'zh' ? '加印工艺方式' : 'Printing Method'}
                    </label>
                    <select
                      value={activeCalc.logoPrintingMethod}
                      onChange={e => setActiveCalc({ ...activeCalc, logoPrintingMethod: e.target.value as any })}
                      className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                    >
                      <option value="silkscreen">{language === 'zh' ? '丝网印刷 (Silk Screen)' : 'Silk Screen Printing (丝网印)'}</option>
                      <option value="hot_stamping">{language === 'zh' ? '烫金 / 烫银 (Hot Foil Stamping)' : 'Hot Foil Stamping (烫金/烫银)'}</option>
                      <option value="pad_printing">{language === 'zh' ? '移印工艺 (Pad Printing)' : 'Pad Printing (移印)'}</option>
                      <option value="mold_embossing">{language === 'zh' ? '模具凸凹刻字 (Mold Engraving)' : 'Mold Engraving / Embossing (模具刻字)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'zh' ? '印刷套色数量' : 'Number of Colors'}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      value={activeCalc.logoColorsCount}
                      onChange={e => setActiveCalc({ ...activeCalc, logoColorsCount: Math.max(1, Number(e.target.value)) })}
                      className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {language === 'zh' ? '单只每色印刷费 (¥)' : 'Print Cost / Color (¥)'}
                    </label>
                    <input
                      type="number"
                      step={0.005}
                      value={activeCalc.logoPrintingCostPerUnitRmb}
                      onChange={e => setActiveCalc({ ...activeCalc, logoPrintingCostPerUnitRmb: Number(e.target.value) })}
                      className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                    />
                  </div>

                  <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="flex items-center justify-between text-xs bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                      <span className="text-amber-900">
                        {language === 'zh' ? '版费/菲林费 (固定摊销):' : 'Plate/Film Fee (版费/菲林费):'}
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold">
                        <span>¥</span>
                        <input
                          type="number"
                          value={activeCalc.logoPlateFeeOneOffRmb}
                          onChange={e => setActiveCalc({ ...activeCalc, logoPlateFeeOneOffRmb: Number(e.target.value) })}
                          className="w-16 bg-white border border-amber-200 rounded px-1.5 py-0.5 text-right text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                      <span className="text-amber-900">
                        {language === 'zh' ? '模具刻字嵌件费 (固定摊销):' : 'Mold Custom Insert (开模刻字费):'}
                      </span>
                      <div className="flex items-center gap-1 font-mono font-bold">
                        <span>¥</span>
                        <input
                          type="number"
                          value={activeCalc.moldCustomizationFeeOneOffRmb}
                          onChange={e => setActiveCalc({ ...activeCalc, moldCustomizationFeeOneOffRmb: Number(e.target.value) })}
                          className="w-20 bg-white border border-amber-200 rounded px-1.5 py-0.5 text-right text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* D. Nozzle Configuration & Foam Sprayer Upgrade */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'zh' ? '喷嘴配置与发泡喷头附加费' : 'Nozzle Type & Foam Sprayer Upgrade'}
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  calcResults.unitMechanismRmb > 0 
                    ? 'text-cyan-700 bg-cyan-100/70 border border-cyan-200/60' 
                    : 'text-slate-500 bg-slate-100'
                }`}>
                  {calcResults.unitMechanismRmb > 0 
                    ? `+¥${calcResults.unitMechanismRmb.toFixed(4)} / pc` 
                    : (language === 'zh' ? '标准标配 (无附加费)' : 'Standard (No Surcharge)')}
                </span>
              </div>

              {/* Quick Select Grid for Trigger / Sprayer Nozzle */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600">
                  {language === 'zh' ? '选择喷头结构与发泡网嘴配置:' : 'Select Nozzle Configuration:'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {/* Standard Spray / Stream */}
                  <button
                    type="button"
                    onClick={() => setActiveCalc({
                      ...activeCalc,
                      nozzleType: 'spray_stream_off',
                      nozzleUpgradeCostRmb: 0
                    })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      activeCalc.nozzleType === 'spray_stream_off'
                        ? 'border-blue-500 bg-blue-50/80 ring-1 ring-blue-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">
                        {language === 'zh' ? '常规喷雾/直线喷枪' : 'Standard Spray/Stream'}
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                        {language === 'zh' ? '标配' : 'Standard'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {language === 'zh' ? '常规喷雾、水柱与关闭 3 档模式 (SP/ST/OFF)' : 'Standard spray, straight stream & OFF modes'}
                    </p>
                    <div className="mt-2 text-xs font-mono font-bold text-slate-700">
                      +¥0.000 / pc
                    </div>
                  </button>

                  {/* Dedicated Foam Mesh Nozzle */}
                  <button
                    type="button"
                    onClick={() => setActiveCalc({
                      ...activeCalc,
                      nozzleType: 'foam_mesh_nozzle',
                      nozzleUpgradeCostRmb: activeCalc.nozzleUpgradeCostRmb > 0 ? activeCalc.nozzleUpgradeCostRmb : 0.025
                    })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      activeCalc.nozzleType === 'foam_mesh_nozzle'
                        ? 'border-cyan-500 bg-cyan-50/80 ring-1 ring-cyan-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-cyan-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                        {language === 'zh' ? '专用发泡网嘴喷头' : 'Foam Mesh Nozzle'}
                      </span>
                      <span className="text-[10px] font-bold text-cyan-700 bg-cyan-100 px-1.5 py-0.2 rounded">
                        {language === 'zh' ? '发泡网' : 'Foamer'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {language === 'zh' ? '内置发泡滤网，适合清洁剂泡沫喷出' : 'Built-in mesh filter creates rich dense foam for cleaner formulations'}
                    </p>
                    <div className="mt-2 text-xs font-mono font-bold text-cyan-700 flex items-center justify-between">
                      <span>{language === 'zh' ? '加价值:' : 'Extra Surcharge:'}</span>
                      <span>+¥{activeCalc.nozzleType === 'foam_mesh_nozzle' ? (activeCalc.nozzleUpgradeCostRmb || 0.025).toFixed(3) : '0.025'} / pc</span>
                    </div>
                  </button>

                  {/* 2-in-1 Dual Spray & Foam Flip Cap */}
                  <button
                    type="button"
                    onClick={() => setActiveCalc({
                      ...activeCalc,
                      nozzleType: 'dual_spray_mist',
                      nozzleUpgradeCostRmb: activeCalc.nozzleUpgradeCostRmb > 0 ? activeCalc.nozzleUpgradeCostRmb : 0.035
                    })}
                    className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      activeCalc.nozzleType === 'dual_spray_mist'
                        ? 'border-indigo-500 bg-indigo-50/80 ring-1 ring-indigo-500 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        {language === 'zh' ? '翻盖两用喷雾/发泡' : 'Dual Spray / Foam Flip'}
                      </span>
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.2 rounded">
                        {language === 'zh' ? '二合一两用' : '2-in-1'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {language === 'zh' ? '折叠铰链盖：打开为细雾喷射，盖上即为浓密泡沫' : 'Hinged flip screen: open for fine mist spray, close for thick clinging foam'}
                    </p>
                    <div className="mt-2 text-xs font-mono font-bold text-indigo-700 flex items-center justify-between">
                      <span>{language === 'zh' ? '加价值:' : 'Extra Surcharge:'}</span>
                      <span>+¥{activeCalc.nozzleType === 'dual_spray_mist' ? (activeCalc.nozzleUpgradeCostRmb || 0.035).toFixed(3) : '0.035'} / pc</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Detailed Cost & Mechanism Adjustments */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '喷嘴附加费 (¥/pc)' : 'Nozzle Extra Surcharge (¥/pc)'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step={0.005}
                      min={0}
                      value={activeCalc.nozzleUpgradeCostRmb}
                      onChange={e => setActiveCalc({
                        ...activeCalc,
                        nozzleUpgradeCostRmb: Number(e.target.value)
                      })}
                      className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg pl-6 pr-2.5 py-1.5 focus:ring-2 focus:ring-cyan-500"
                    />
                    <span className="absolute left-2 top-1.5 text-xs text-slate-400 font-mono">¥</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '弹簧材质' : 'Spring Material'}
                  </label>
                  <select
                    value={activeCalc.springMaterial}
                    onChange={e => {
                      const val = e.target.value as any;
                      let extra = 0;
                      if (val === 'sus316_chemical') extra = 0.030;
                      else if (val === 'metal_free_all_plastic') extra = 0.050;
                      setActiveCalc({
                        ...activeCalc,
                        springMaterial: val,
                        springUpgradeCostRmb: extra
                      });
                    }}
                    className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="sus304_standard">{language === 'zh' ? 'SUS304 标配不锈钢 (SUS304 Standard)' : 'SUS304 Standard Stainless (标配不锈钢)'}</option>
                    <option value="sus316_chemical">{language === 'zh' ? 'SUS316 耐酸碱不锈钢 (SUS316 +¥0.03)' : 'SUS316 Chemical Anti-Acid (耐强酸碱 +¥0.03)'}</option>
                    <option value="metal_free_all_plastic">{language === 'zh' ? '全塑环保无金属弹簧 (Metal-Free +¥0.05)' : 'Metal-Free Plastic Spring (全塑弹簧 +¥0.05)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '内塞垫片材质' : 'Gasket Seal'}
                  </label>
                  <select
                    value={activeCalc.gasketType}
                    onChange={e => {
                      const val = e.target.value as any;
                      let extra = 0;
                      if (val === 'eva_high_density') extra = 0.008;
                      else if (val === 'nbr_oil_resistant') extra = 0.015;
                      else if (val === 'teflon_chemical') extra = 0.030;
                      setActiveCalc({
                        ...activeCalc,
                        gasketType: val,
                        gasketUpgradeCostRmb: extra
                      });
                    }}
                    className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="pe_foam_standard">{language === 'zh' ? 'PE发泡垫片 (标配 PE Foam)' : 'PE Foam Standard (PE发泡垫片)'}</option>
                    <option value="eva_high_density">{language === 'zh' ? 'EVA高密密封垫片 (+¥0.008)' : 'EVA High-Density (EVA高密密封 +¥0.008)'}</option>
                    <option value="nbr_oil_resistant">{language === 'zh' ? 'NBR耐油密封垫片 (+¥0.015)' : 'NBR Oil Resistant (NBR耐油垫片 +¥0.015)'}</option>
                    <option value="teflon_chemical">{language === 'zh' ? '特氟龙强耐化学腐蚀 (+¥0.030)' : 'Teflon Chemical (特氟龙强耐腐 +¥0.030)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '特殊护罩/机构' : 'Special Mechanism / Shroud'}
                  </label>
                  <select
                    value={activeCalc.nozzleType === 'child_resistant_lock' ? 'cr_lock' : activeCalc.nozzleType === 'upside_down_360' ? 'upside_down' : 'standard'}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'cr_lock') {
                        setActiveCalc({
                          ...activeCalc,
                          nozzleType: 'child_resistant_lock',
                          nozzleUpgradeCostRmb: 0.025
                        });
                      } else if (val === 'upside_down') {
                        setActiveCalc({
                          ...activeCalc,
                          nozzleType: 'upside_down_360',
                          nozzleUpgradeCostRmb: 0.050
                        });
                      } else {
                        setActiveCalc({
                          ...activeCalc,
                          nozzleType: 'spray_stream_off',
                          nozzleUpgradeCostRmb: 0
                        });
                      }
                    }}
                    className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="standard">{language === 'zh' ? '标准外壳 (Standard Shroud)' : 'Standard Shroud (标准护罩)'}</option>
                    <option value="cr_lock">{language === 'zh' ? 'CR儿童安全防误开锁 (+¥0.025)' : 'Child-Resistant Lock (CR儿童锁 +¥0.025)'}</option>
                    <option value="upside_down">{language === 'zh' ? '360°全方位倒喷装置 (+¥0.050)' : '360° Inverted Sprayer (360度倒喷 +¥0.050)'}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* E. Packaging & Box Partition Customization */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'zh' ? '包装方式与外箱成本核算' : 'Packaging & Outer Carton'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                  +¥{calcResults.unitPackagingRmb.toFixed(4)} / pc
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '外包装方式' : 'Packaging Method'}
                  </label>
                  <select
                    value={activeCalc.packagingType}
                    onChange={e => {
                      const val = e.target.value as any;
                      let extra = 0;
                      if (val === 'individual_polybag') extra = 0.015;
                      else if (val === 'egg_grid_partition') extra = 0.012;
                      else if (val === 'custom_color_box') extra = 0.06;
                      setActiveCalc({ ...activeCalc, packagingType: val, packagingExtraCostPerUnitRmb: extra });
                    }}
                    className="w-full text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  >
                    <option value="bulk_master_carton">{language === 'zh' ? '大塑料袋散装 (Bulk in Polybag)' : 'Bulk in Polybag (大袋散装)'}</option>
                    <option value="egg_grid_partition">{language === 'zh' ? '鸡蛋格刀卡隔板 (Egg-Grid Partition)' : 'Egg-Grid Partition (鸡蛋格刀卡隔板)'}</option>
                    <option value="individual_polybag">{language === 'zh' ? '单个独立套袋防划 (Individual Polybag)' : 'Individual Polybag (单个套袋防划)'}</option>
                    <option value="custom_color_box">{language === 'zh' ? '定制外贸彩盒 (Custom Color Box)' : 'Custom Color Box (定制彩盒)'}</option>
                    <option value="palletized">{language === 'zh' ? '打托盘缠膜出货 (Palletized)' : 'Palletized (打托盘出货)'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '每箱装量 (pcs/箱)' : 'Pieces / Carton'}
                  </label>
                  <input
                    type="number"
                    value={activeCalc.piecesPerCarton}
                    onChange={e => setActiveCalc({ ...activeCalc, piecesPerCarton: Math.max(1, Number(e.target.value)) })}
                    className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '外箱尺寸 (长x宽x高 cm)' : 'Carton Dimensions (cm)'}
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      title="Length"
                      placeholder="L"
                      value={activeCalc.cartonLengthCm}
                      onChange={e => setActiveCalc({ ...activeCalc, cartonLengthCm: Number(e.target.value) })}
                      className="text-xs font-mono bg-white border border-slate-200 rounded px-1 py-1 text-center"
                    />
                    <input
                      type="number"
                      title="Width"
                      placeholder="W"
                      value={activeCalc.cartonWidthCm}
                      onChange={e => setActiveCalc({ ...activeCalc, cartonWidthCm: Number(e.target.value) })}
                      className="text-xs font-mono bg-white border border-slate-200 rounded px-1 py-1 text-center"
                    />
                    <input
                      type="number"
                      title="Height"
                      placeholder="H"
                      value={activeCalc.cartonHeightCm}
                      onChange={e => setActiveCalc({ ...activeCalc, cartonHeightCm: Number(e.target.value) })}
                      className="text-xs font-mono bg-white border border-slate-200 rounded px-1 py-1 text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '纸箱成本 (¥/个)' : 'Carton Cost / Box (¥)'}
                  </label>
                  <input
                    type="number"
                    step={0.1}
                    value={activeCalc.cartonBoxCostRmb}
                    onChange={e => setActiveCalc({ ...activeCalc, cartonBoxCostRmb: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                <div className="sm:col-span-4 flex items-center justify-between text-xs bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                  <span className="font-semibold text-emerald-900">
                    {language === 'zh' ? '装箱概算: ' : 'Packing Summary: '}
                    <span className="font-mono font-bold">{calcResults.totalCartons} {language === 'zh' ? '箱' : 'Cartons'}</span> | <span className="font-mono font-bold">{calcResults.totalCbm} CBM</span> | <span className="font-mono font-bold">{calcResults.totalGrossWeightKg} KGS</span>
                  </span>
                  <span className="text-[11px] text-emerald-700">
                    20GP {language === 'zh' ? '集装箱' : ''}: {Math.min(100, Math.round((calcResults.totalCbm / 28) * 100))}% | 40HQ {language === 'zh' ? '高柜' : ''}: {Math.min(100, Math.round((calcResults.totalCbm / 68) * 100))}%
                  </span>
                </div>
              </div>
            </div>

            {/* E. Domestic Logistics, Inland Trucking & Port Fees */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">
                    {language === 'zh' ? '内陆运费、港杂费与出口单证费' : 'Inland Trucking, Port THC & Customs Charges'}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                  +¥{calcResults.unitFobExtraFeeRmb.toFixed(4)} / pc ({language === 'zh' ? 'FOB加价项' : 'FOB Surcharge'})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '内陆拖车运费 (¥)' : 'Inland Trucking (内陆运费 ¥)'}
                  </label>
                  <input
                    type="number"
                    value={activeCalc.inlandFreightRmb}
                    onChange={e => setActiveCalc({ ...activeCalc, inlandFreightRmb: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '港杂/报关/THC (¥)' : 'Port THC & Customs (港杂/报关 ¥)'}
                  </label>
                  <input
                    type="number"
                    value={activeCalc.portThcAndCustomsRmb}
                    onChange={e => setActiveCalc({ ...activeCalc, portThcAndCustomsRmb: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '银行结汇手续费 ($)' : 'Bank Fee (银行结汇 $)'}
                  </label>
                  <input
                    type="number"
                    value={activeCalc.bankHandlingFeeUsd}
                    onChange={e => setActiveCalc({ ...activeCalc, bankHandlingFeeUsd: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    {language === 'zh' ? '产地证/单证/寄样 (¥)' : 'Docs & CO/Sample (产地证/寄样 ¥)'}
                  </label>
                  <input
                    type="number"
                    value={activeCalc.exportDocsFeeRmb + activeCalc.sampleAndCourierRmb}
                    onChange={e => setActiveCalc({ ...activeCalc, exportDocsFeeRmb: Number(e.target.value) })}
                    className="w-full text-xs font-mono font-bold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Quotation Results, Price Comparison Matrix & Waterfall (5 Cols) */}
        <div className="xl:col-span-5 space-y-6">
          {/* Main Price Cards */}
          <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-lg border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                {activeCalc.productImage && (
                  <div className="w-11 h-11 rounded-xl bg-white/10 p-1 border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
                    <img 
                      src={activeCalc.productImage} 
                      alt={activeCalc.productName} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                      {language === 'zh' ? '报价矩阵' : 'Pricing Matrix'}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-blue-500/30 text-blue-200 px-1.5 py-0.2 rounded border border-blue-400/40">
                      {calcResults.currDetails?.flag || '🌐'} {calcResults.activeCurrency}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {language === 'zh' ? '商务报价汇总与分析' : 'Commercial Price Summary'}
                  </h3>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 px-2.5 py-1 rounded-lg">
                {language === 'zh' ? '数量: ' : 'Qty: '}{calcResults.q.toLocaleString()} {language === 'zh' ? '只' : 'pcs'}
              </span>
            </div>

            {/* Incoterms Cards Grid */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* FOB Ningbo / Port */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-3.5 border border-white/15 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                    {language === 'zh' ? `FOB ${activeCalc.portOfLoading || '宁波港'}` : `FOB ${activeCalc.portOfLoading || 'Port'}`}
                  </span>
                  <span className="text-[10px] font-mono text-blue-200/80">{calcResults.activeCurrency}</span>
                </div>
                <div className="text-2xl font-black font-mono text-white mt-1">
                  {formatMoney(calcResults.unitFobQuoteTarget, calcResults.activeCurrency, 4)}
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5 font-mono">
                  ¥{calcResults.unitFobQuoteRmb.toFixed(3)} RMB / pc
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-300">{language === 'zh' ? 'FOB 总金额:' : 'Total FOB Value:'}</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {formatMoney(calcResults.totalFobAmountTarget, calcResults.activeCurrency)}
                  </span>
                </div>
              </div>

              {/* EXW Factory */}
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-3.5 border border-white/10 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'zh' ? 'EXW 工厂出厂价' : 'EXW Factory'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">{calcResults.activeCurrency}</span>
                </div>
                <div className="text-2xl font-black font-mono text-slate-100 mt-1">
                  {formatMoney(calcResults.unitExwQuoteTarget, calcResults.activeCurrency, 4)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
                  ¥{calcResults.unitExwQuoteRmb.toFixed(3)} RMB / pc
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{language === 'zh' ? '出厂总金额:' : 'Total EXW:'}</span>
                  <span className="font-bold text-slate-200 font-mono">
                    {formatMoney(calcResults.totalExwAmountTarget, calcResults.activeCurrency)}
                  </span>
                </div>
              </div>
            </div>

            {/* Parallel Global Currency Benchmarks Strip */}
            <div className="bg-white/5 rounded-xl p-3 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-blue-300 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-blue-400" />
                  {language === 'zh' ? '多币种实时对标换算 (FOB):' : 'Multi-Currency Benchmark Equivalents (FOB):'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {language === 'zh' ? '单价 / 总额' : 'Per Unit / Total'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                <div className={`p-1.5 rounded-lg border text-[11px] ${calcResults.activeCurrency === 'USD' ? 'bg-blue-600/30 border-blue-400 text-white font-bold' : 'bg-black/20 border-white/10 text-slate-300'}`}>
                  <div className="text-[9px] text-slate-400">🇺🇸 USD ($)</div>
                  <div className="font-black text-white">${calcResults.unitFobQuoteUsd.toFixed(4)}</div>
                  <div className="text-[9px] text-emerald-400">${calcResults.totalFobAmountUsd.toLocaleString()}</div>
                </div>

                <div className={`p-1.5 rounded-lg border text-[11px] ${calcResults.activeCurrency === 'EUR' ? 'bg-blue-600/30 border-blue-400 text-white font-bold' : 'bg-black/20 border-white/10 text-slate-300'}`}>
                  <div className="text-[9px] text-slate-400">🇪🇺 EUR (€)</div>
                  <div className="font-black text-white">€{calcResults.unitFobQuoteEur.toFixed(4)}</div>
                  <div className="text-[9px] text-emerald-400">€{calcResults.totalFobAmountEur.toLocaleString()}</div>
                </div>

                <div className={`p-1.5 rounded-lg border text-[11px] ${calcResults.activeCurrency === 'GBP' ? 'bg-blue-600/30 border-blue-400 text-white font-bold' : 'bg-black/20 border-white/10 text-slate-300'}`}>
                  <div className="text-[9px] text-slate-400">🇬🇧 GBP (£)</div>
                  <div className="font-black text-white">£{calcResults.unitFobQuoteGbp.toFixed(4)}</div>
                  <div className="text-[9px] text-emerald-400">£{calcResults.totalFobAmountGbp.toLocaleString()}</div>
                </div>

                <div className={`p-1.5 rounded-lg border text-[11px] ${calcResults.activeCurrency === 'RMB' ? 'bg-blue-600/30 border-blue-400 text-white font-bold' : 'bg-black/20 border-white/10 text-slate-300'}`}>
                  <div className="text-[9px] text-slate-400">🇨🇳 RMB (¥)</div>
                  <div className="font-black text-white">¥{calcResults.unitFobQuoteRmb.toFixed(3)}</div>
                  <div className="text-[9px] text-emerald-400">¥{calcResults.totalFobAmountRmb.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Profitability Analytics */}
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-medium">
                  {language === 'zh' ? '预估毛利润总额:' : 'Estimated Gross Profit:'}
                </span>
                <span className="text-sm font-black font-mono text-emerald-400">
                  +{formatMoney(calcResults.totalProfitAmountTarget, calcResults.activeCurrency)} (¥{calcResults.totalProfitAmountRmb.toLocaleString()})
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {language === 'zh' ? '目标利润率对比实际毛利率:' : 'Target Margin vs Real Margin:'}
                </span>
                <span className="font-bold text-slate-200 font-mono">
                  {language === 'zh' ? '目标: ' : 'Target: '}{activeCalc.targetProfitMargin}% | {language === 'zh' ? '实际: ' : 'Actual: '}{calcResults.actualProfitMarginPercent}%
                </span>
              </div>
            </div>
          </div>

          {/* Cost Composition Waterfall Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1565C0]" />
              {language === 'zh' ? '单只成本构成瀑布明细' : 'Unit Cost Breakdown'}
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  {language === 'zh' ? '基础产品工厂毛坯成本' : 'Raw Base Product'}
                </span>
                <span className="font-mono font-bold text-slate-800">¥{calcResults.unitBaseRmb.toFixed(4)}</span>
              </div>

              {activeCalc.dipTubeEnabled && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    {language === 'zh' ? `加长吸管与裁切 (${activeCalc.requiredTubeLengthMm}mm)` : `Extended Dip Tube & Cut (${activeCalc.requiredTubeLengthMm}mm)`}
                  </span>
                  <span className="font-mono font-bold text-blue-600">+¥{calcResults.unitTubeRmb.toFixed(4)}</span>
                </div>
              )}

              {calcResults.unitColorRmb > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    {language === 'zh' ? '定制颜色母粒/电镀工艺' : 'Custom Color Masterbatch & Finish'}
                  </span>
                  <span className="font-mono font-bold text-purple-600">+¥{calcResults.unitColorRmb.toFixed(4)}</span>
                </div>
              )}

              {activeCalc.logoEnabled && calcResults.unitLogoRmb > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    {language === 'zh' ? 'Logo加印与版费平摊' : 'Logo Printing & Plate Amortization'}
                  </span>
                  <span className="font-mono font-bold text-amber-600">+¥{calcResults.unitLogoRmb.toFixed(4)}</span>
                </div>
              )}

              {calcResults.unitMechanismRmb > 0 && (
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    {activeCalc.nozzleType === 'foam_mesh_nozzle' 
                      ? (language === 'zh' ? '专用发泡网嘴喷头加价' : 'Foam Mesh Nozzle Upgrade')
                      : activeCalc.nozzleType === 'dual_spray_mist' 
                      ? (language === 'zh' ? '翻盖两用喷雾/发泡机构加价' : 'Dual Spray & Foam Flip Nozzle')
                      : activeCalc.nozzleType === 'child_resistant_lock'
                      ? (language === 'zh' ? 'CR儿童安全防误开锁加价' : 'Child-Resistant Lock Nozzle')
                      : activeCalc.nozzleType === 'upside_down_360'
                      ? (language === 'zh' ? '360°全方位倒喷装置加价' : '360° Inverted Sprayer')
                      : (language === 'zh' ? '特殊喷嘴与弹簧升级加价' : 'Special Nozzle / Spring Upgrade')}
                  </span>
                  <span className="font-mono font-bold text-cyan-600">+¥{calcResults.unitMechanismRmb.toFixed(4)}</span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {language === 'zh' ? '外箱、刀卡隔板与包装' : 'Packaging Box & Partition'}
                </span>
                <span className="font-mono font-bold text-emerald-600">+¥{calcResults.unitPackagingRmb.toFixed(4)}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  {language === 'zh' ? '内陆拖车、港杂与银行单证' : 'Domestic Logistics & Port THC/Bank'}
                </span>
                <span className="font-mono font-bold text-indigo-600">+¥{calcResults.unitFobExtraFeeRmb.toFixed(4)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 text-sm font-bold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-slate-800">{language === 'zh' ? '含税综合出厂成本 (未含利润):' : 'Total Factory Cost (EXW Cost):'}</span>
                <span className="font-mono text-slate-900">¥{calcResults.unitFobCostRmb.toFixed(4)} / pc</span>
              </div>
            </div>
          </div>

          {/* Quantity Tier Matrix (阶梯报价) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#1565C0]" />
                {language === 'zh' ? '阶梯起订量价格对照表' : 'Volume Tier Price Breaks'}
              </h3>
              
              {/* Currency Selector for Tier Table */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold font-mono">
                <button
                  type="button"
                  onClick={() => setTierDisplayCurrency('ACTIVE')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    tierDisplayCurrency === 'ACTIVE' 
                      ? 'bg-white text-blue-700 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {calcResults.activeCurrency}
                </button>
                <button
                  type="button"
                  onClick={() => setTierDisplayCurrency('USD')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    tierDisplayCurrency === 'USD' 
                      ? 'bg-white text-blue-700 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  type="button"
                  onClick={() => setTierDisplayCurrency('EUR')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    tierDisplayCurrency === 'EUR' 
                      ? 'bg-white text-blue-700 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  EUR (€)
                </button>
                <button
                  type="button"
                  onClick={() => setTierDisplayCurrency('RMB')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    tierDisplayCurrency === 'RMB' 
                      ? 'bg-white text-blue-700 shadow-2xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  RMB (¥)
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="py-2">{language === 'zh' ? '订购数量' : 'Quantity'}</th>
                    <th className="py-2 text-right">
                      {language === 'zh' ? '出厂单价' : 'EXW Quote'} ({tierDisplayCurrency === 'ACTIVE' ? calcResults.activeCurrency : tierDisplayCurrency})
                    </th>
                    <th className="py-2 text-right">
                      {language === 'zh' ? 'FOB离岸价' : 'FOB Quote'} ({tierDisplayCurrency === 'ACTIVE' ? calcResults.activeCurrency : tierDisplayCurrency})
                    </th>
                    <th className="py-2 text-right">
                      {language === 'zh' ? '总金额' : 'Total'} ({tierDisplayCurrency === 'ACTIVE' ? calcResults.activeCurrency : tierDisplayCurrency})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {calcResults.tiers.map(tier => {
                    const cCode = tierDisplayCurrency === 'ACTIVE' ? calcResults.activeCurrency : tierDisplayCurrency;
                    const exwVal = 
                      cCode === 'USD' ? tier.exwUsd :
                      cCode === 'EUR' ? tier.exwEur :
                      cCode === 'GBP' ? tier.exwGbp :
                      cCode === 'RMB' ? tier.exwRmb : tier.exwTarget;
                    
                    const fobVal = 
                      cCode === 'USD' ? tier.fobUsd :
                      cCode === 'EUR' ? tier.fobEur :
                      cCode === 'GBP' ? tier.fobGbp :
                      cCode === 'RMB' ? tier.fobRmb : tier.fobTarget;

                    const totalVal = 
                      cCode === 'USD' ? tier.totalUsd :
                      cCode === 'EUR' ? tier.totalEur :
                      cCode === 'GBP' ? tier.totalGbp :
                      cCode === 'RMB' ? tier.totalRmb : tier.totalTarget;

                    return (
                      <tr 
                        key={tier.qty} 
                        className={`hover:bg-slate-50/80 transition-colors ${tier.isCurrent ? 'bg-blue-50/60 font-bold' : ''}`}
                      >
                        <td className="py-2.5 font-medium text-slate-800">
                          {tier.qty.toLocaleString()} {language === 'zh' ? '只' : 'pcs'}
                          {tier.isCurrent && <span className="ml-1.5 text-[10px] text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded font-sans font-bold">{language === 'zh' ? '当前核算' : 'Selected'}</span>}
                        </td>
                        <td className="py-2.5 text-right text-slate-600">
                          {formatMoney(exwVal, cCode, 4)}
                        </td>
                        <td className="py-2.5 text-right text-blue-700 font-bold">
                          {formatMoney(fobVal, cCode, 4)}
                        </td>
                        <td className="py-2.5 text-right text-slate-800 font-bold">
                          {formatMoney(totalVal, cCode)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Inquiry Calculations Archive / History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-[#1565C0]" />
              {language === 'zh' ? '历史询盘核算记录档案' : 'Inquiry Calculations Archive'} ({quotationCalculations.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'zh' ? '已保存的客户询价单与成本核算历史记录' : 'Saved calculations & customer inquiry history'}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={language === 'zh' ? '搜索询盘编号、标题或客户...' : 'Search inquiries...'}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>
        </div>

        {filteredCalculations.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs">
            {language === 'zh' ? '没有找到符合条件的询盘核算记录。' : 'No inquiry calculations found matching your search.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">{language === 'zh' ? '核算编号' : 'Calc #'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '询盘项目标题' : 'Inquiry Title'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '客户单位' : 'Client'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '品名规格' : 'Product'}</th>
                  <th className="py-2.5 px-3">{language === 'zh' ? '结算币种' : 'Currency'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'zh' ? '订购数量' : 'Quantity'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'zh' ? '核算日期' : 'Date'}</th>
                  <th className="py-2.5 px-3 text-center">{language === 'zh' ? '操作' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCalculations.map(c => {
                  const isSelected = c.id === activeCalc.id;
                  const cInfo = getCurrencyDetails(c.currency || 'USD');
                  return (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                      onClick={() => setActiveCalc(c)}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-blue-700">{c.calcNumber}</td>
                      <td className="py-3 px-3 font-medium text-slate-800">{c.inquiryTitle}</td>
                      <td className="py-3 px-3 text-slate-600">{c.client?.company || c.clientName || (language === 'zh' ? '通用询价客户' : 'General Client')}</td>
                      <td className="py-3 px-3 text-slate-600">{c.productName} ({c.neckSize})</td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                          <span>{cInfo?.flag}</span>
                          <span>{c.currency || 'USD'}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">{c.quantity.toLocaleString()} {language === 'zh' ? '只' : 'pcs'}</td>
                      <td className="py-3 px-3 text-right text-slate-400">{c.date}</td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              const duplicate: QuotationCalculation = {
                                ...c,
                                id: generateId(),
                                calcNumber: getNextDocumentNumber('calc', quotationCalculations),
                                inquiryTitle: `${c.inquiryTitle} ${language === 'zh' ? '(副本)' : '(Copy)'}`,
                                date: new Date().toISOString().slice(0, 10),
                                createdAt: new Date().toISOString()
                              };
                              onSaveQuotationCalculations([duplicate, ...quotationCalculations]);
                              setActiveCalc(duplicate);
                              showToast(language === 'zh' ? `已复制为 ${duplicate.calcNumber}` : `Duplicated as ${duplicate.calcNumber}`);
                            }}
                            className="p-1 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                            title={language === 'zh' ? '复制此核算' : 'Duplicate calculation'}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCurrent(c.id)}
                            className="p-1 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded transition-colors cursor-pointer"
                            title={language === 'zh' ? '删除' : 'Delete'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Inquiry Cost Analysis Document (A4 PDF & Print Specimen) */}
      <div className="bg-slate-100 p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1565C0]/10 flex items-center justify-center text-[#1565C0]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                {language === 'zh' ? '官方询盘成本核算分析单样本 (A4打印/PDF导出)' : 'Official Inquiry Cost Analysis Document Specimen (官方核算分析单)'}
              </h3>
              <p className="text-xs text-slate-500">
                {language === 'zh' ? '标准 A4 规格，带企业中英签章栏、完整工艺参数明细、多币种换算与审批流' : 'A4 single-page precision layout with company seal, full parameters, multi-currency breakdown, and sign-offs.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => printDocument('inquiry-cost-sheet')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              {language === 'zh' ? '打印核算单' : 'Print Sheet'}
            </button>
            <button
              type="button"
              onClick={async () => {
                setIsDownloading(true);
                try {
                  await exportDocumentToPDF('inquiry-cost-sheet', `Cost_Calculation_${activeCalc.calcNumber}`);
                  showToast(language === 'zh' ? `核算单 ${activeCalc.calcNumber} PDF 导出成功!` : `Cost Sheet PDF for ${activeCalc.calcNumber} saved successfully!`);
                } catch (err) {
                  console.error('PDF export failed:', err);
                  showToast(language === 'zh' ? '正在调用打印备用导出...' : 'Exporting via print dialog fallback...');
                } finally {
                  setIsDownloading(false);
                }
              }}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#1565C0] hover:bg-[#0D47A1] text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {language === 'zh' ? '导出 PDF' : 'Save to PDF'}
            </button>
          </div>
        </div>

        {/* Live A4 Document Canvas */}
        <div className="bg-slate-200/70 p-3 sm:p-6 rounded-xl border border-slate-300 overflow-x-auto flex justify-center shadow-inner">
          <div 
            id="inquiry-cost-sheet" 
            className="w-full max-w-[210mm] min-h-[295mm] bg-white border border-slate-300 shadow-xl p-[10mm] sm:p-[12mm] text-slate-800 flex flex-col justify-between font-sans relative shrink-0 print:border-none print:shadow-none print:p-0 print:m-0"
            style={{ boxSizing: 'border-box' }}
          >
            {/* Printable Header */}
            <div>
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">{settings.name || 'MILA EXPORTER FACTORY'}</h1>
                  <p className="text-xs text-slate-600 mt-1">{settings.address}</p>
                  <p className="text-xs text-slate-600">TEL: {settings.phone} | EMAIL: {settings.email}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-[#1565C0] uppercase">
                    {language === 'zh' ? '出口询盘成本核算分析单' : 'Inquiry Cost Analysis Sheet'}
                  </h2>
                  <p className="text-xs font-mono font-bold text-slate-800 mt-1">DOC #: {activeCalc.calcNumber}</p>
                  <p className="text-xs text-slate-600">{language === 'zh' ? '日期: ' : 'DATE: '}{activeCalc.date}</p>
                </div>
              </div>

              {/* Customer & Item Info */}
              <div className="grid grid-cols-12 gap-4 my-4 text-xs">
                <div className="col-span-5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase block mb-1">
                    {language === 'zh' ? '客户 / 询盘方信息:' : 'Customer / Inquirer:'}
                  </span>
                  <div className="font-bold text-slate-800">{activeCalc.client?.company || activeCalc.clientName || (language === 'zh' ? '通用客户' : 'General Client')}</div>
                  <div>{activeCalc.client?.contactPerson}</div>
                  <div>{activeCalc.client?.country || (language === 'zh' ? '国际客户' : 'International')}</div>
                </div>
                <div className="col-span-5 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-500 uppercase block mb-1">
                    {language === 'zh' ? '询价参数与币种:' : 'Inquiry Parameters:'}
                  </span>
                  <div><span className="font-semibold">{language === 'zh' ? '品名规格:' : 'Product:'}</span> {activeCalc.productName} ({activeCalc.neckSize})</div>
                  <div><span className="font-semibold">{language === 'zh' ? '订购数量:' : 'Quantity:'}</span> {activeCalc.quantity.toLocaleString()} {language === 'zh' ? '只' : 'pcs'}</div>
                  <div><span className="font-semibold">{language === 'zh' ? '结算币种:' : 'Quotation Currency:'}</span> {activeCalc.currency || 'USD'} ({getCurrencyDetails(activeCalc.currency || 'USD')?.symbol})</div>
                  <div><span className="font-semibold">{language === 'zh' ? '核算汇率:' : 'Exchange Rate:'}</span> 1 {activeCalc.currency || 'USD'} = {activeCalc.exchangeRate} RMB</div>
                </div>
                <div className="col-span-2 bg-slate-50 p-2 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
                  {activeCalc.productImage ? (
                    <img 
                      src={activeCalc.productImage} 
                      alt="Product Spec" 
                      className="w-16 h-16 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-400">{language === 'zh' ? '无图片' : 'No Photo'}</span>
                  )}
                  <span className="text-[9px] font-bold text-slate-500 mt-1 uppercase">{language === 'zh' ? '样品图样' : 'Spec Photo'}</span>
                </div>
              </div>

              {/* Customization Breakdown Table */}
              <table className="w-full text-left text-xs border border-slate-300 my-4 border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                    <th className="p-2 border-r border-slate-300">{language === 'zh' ? '成本核算项目' : 'Cost Element'}</th>
                    <th className="p-2 border-r border-slate-300">{language === 'zh' ? '工艺规格与描述' : 'Specifications / Description'}</th>
                    <th className="p-2 border-r border-slate-300 text-right">{language === 'zh' ? '单只成本 (RMB)' : 'Unit Cost (RMB)'}</th>
                    <th className="p-2 text-right">{language === 'zh' ? `总金额 (${activeCalc.currency || 'USD'})` : `Total Amount (${activeCalc.currency || 'USD'})`}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  <tr>
                    <td className="p-2 font-sans font-semibold border-r border-slate-200">
                      {language === 'zh' ? '基础毛坯产品' : 'Base Raw Product'}
                    </td>
                    <td className="p-2 font-sans border-r border-slate-200">{activeCalc.productName} ({activeCalc.sku})</td>
                    <td className="p-2 text-right border-r border-slate-200">¥{calcResults.unitBaseRmb.toFixed(4)}</td>
                    <td className="p-2 text-right">{formatMoney((calcResults.unitBaseRmb * calcResults.q) / calcResults.fx, activeCalc.currency || 'USD')}</td>
                  </tr>
                  {activeCalc.dipTubeEnabled && (
                    <tr>
                      <td className="p-2 font-sans font-semibold border-r border-slate-200">
                        {language === 'zh' ? '定制吸管加长' : 'Extended Dip Tube'}
                      </td>
                      <td className="p-2 font-sans border-r border-slate-200">
                        {language === 'zh' ? '长度: ' : 'Length: '}{activeCalc.requiredTubeLengthMm}mm ({activeCalc.tubeCutType.replace(/_/g, ' ')})
                      </td>
                      <td className="p-2 text-right border-r border-slate-200">¥{calcResults.unitTubeRmb.toFixed(4)}</td>
                      <td className="p-2 text-right">{formatMoney((calcResults.unitTubeRmb * calcResults.q) / calcResults.fx, activeCalc.currency || 'USD')}</td>
                    </tr>
                  )}
                  {calcResults.unitColorRmb > 0 && (
                    <tr>
                      <td className="p-2 font-sans font-semibold border-r border-slate-200">
                        {language === 'zh' ? '定制颜色/喷涂' : 'Custom Color'}
                      </td>
                      <td className="p-2 font-sans border-r border-slate-200">{activeCalc.pantoneCode} ({activeCalc.colorType})</td>
                      <td className="p-2 text-right border-r border-slate-200">¥{calcResults.unitColorRmb.toFixed(4)}</td>
                      <td className="p-2 text-right">{formatMoney((calcResults.unitColorRmb * calcResults.q) / calcResults.fx, activeCalc.currency || 'USD')}</td>
                    </tr>
                  )}
                  {activeCalc.logoEnabled && (
                    <tr>
                      <td className="p-2 font-sans font-semibold border-r border-slate-200">
                        {language === 'zh' ? 'Logo 印刷工艺' : 'Logo Printing'}
                      </td>
                      <td className="p-2 font-sans border-r border-slate-200">{activeCalc.logoPrintingMethod} ({activeCalc.logoColorsCount} {language === 'zh' ? '色' : 'color'})</td>
                      <td className="p-2 text-right border-r border-slate-200">¥{calcResults.unitLogoRmb.toFixed(4)}</td>
                      <td className="p-2 text-right">{formatMoney((calcResults.unitLogoRmb * calcResults.q) / calcResults.fx, activeCalc.currency || 'USD')}</td>
                    </tr>
                  )}
                  {calcResults.unitMechanismRmb > 0 && (
                    <tr>
                      <td className="p-2 font-sans font-semibold border-r border-slate-200">
                        {language === 'zh' ? '喷嘴与结构升级' : 'Nozzle & Mechanism'}
                      </td>
                      <td className="p-2 font-sans border-r border-slate-200">
                        {activeCalc.nozzleType === 'foam_mesh_nozzle' 
                          ? (language === 'zh' ? '发泡网嘴喷头 (Foam Mesh Nozzle)' : 'Foam Mesh Nozzle (发泡喷头)')
                          : activeCalc.nozzleType === 'dual_spray_mist' 
                          ? (language === 'zh' ? '两用翻盖发泡喷嘴 (Dual Spray/Foam)' : 'Dual Spray & Foam Flip Nozzle (两用翻盖发泡喷嘴)') 
                          : activeCalc.nozzleType === 'child_resistant_lock'
                          ? (language === 'zh' ? 'CR儿童安全防误开锁 (CR Lock)' : 'Child-Resistant Lock (CR儿童锁)')
                          : activeCalc.nozzleType === 'upside_down_360'
                          ? (language === 'zh' ? '360°全方位倒喷装置 (360° Inverted)' : '360° Inverted Sprayer (360度倒喷)')
                          : 'Special Nozzle'}
                        {activeCalc.springMaterial !== 'sus304_standard' ? ` / ${activeCalc.springMaterial.replace(/_/g, ' ')}` : ''}
                      </td>
                      <td className="p-2 text-right border-r border-slate-200">¥{calcResults.unitMechanismRmb.toFixed(4)}</td>
                      <td className="p-2 text-right">{formatMoney((calcResults.unitMechanismRmb * calcResults.q) / calcResults.fx, activeCalc.currency || 'USD')}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="p-2 font-sans font-semibold border-r border-slate-200">
                      {language === 'zh' ? '包装材料与隔板' : 'Packaging & Partition'}
                    </td>
                    <td className="p-2 font-sans border-r border-slate-200">{activeCalc.packagingType.replace(/_/g, ' ')} ({calcResults.totalCartons} ctns / {calcResults.totalCbm} CBM)</td>
                    <td className="p-2 text-right border-r border-slate-200">¥{calcResults.unitPackagingRmb.toFixed(4)}</td>
                    <td className="p-2 text-right">{formatMoney((calcResults.unitPackagingRmb * calcResults.q) / calcResults.fx, activeCalc.currency || 'USD')}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-sans font-semibold border-r border-slate-200">
                      {language === 'zh' ? '内陆物流与港杂' : 'Inland Logistics & THC'}
                    </td>
                    <td className="p-2 font-sans border-r border-slate-200">Factory to {activeCalc.portOfLoading} Trucking & Customs</td>
                    <td className="p-2 text-right border-r border-slate-200">¥{calcResults.unitFobExtraFeeRmb.toFixed(4)}</td>
                    <td className="p-2 text-right">{formatMoney((calcResults.unitFobExtraFeeRmb * calcResults.q) / calcResults.fx, activeCalc.currency || 'USD')}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-bold border-t border-slate-300">
                    <td className="p-2" colSpan={2}>
                      {language === 'zh' ? `FOB ${activeCalc.portOfLoading.toUpperCase()} 单只售价与总额 (${activeCalc.currency || 'USD'}):` : `FOB ${activeCalc.portOfLoading.toUpperCase()} UNIT PRICE & GRAND TOTAL (${activeCalc.currency || 'USD'}):`}
                    </td>
                    <td className="p-2 text-right font-mono text-blue-700">¥{calcResults.unitFobQuoteRmb.toFixed(4)}</td>
                    <td className="p-2 text-right font-mono text-blue-700 text-sm">{formatMoney(calcResults.totalFobAmountTarget, activeCalc.currency || 'USD')}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Printable Footer Signoff */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between text-xs text-slate-500">
              <div>
                <p className="font-semibold text-slate-700">
                  {language === 'zh' ? '核算业务员: Andrew Sales Director' : 'Calculated By: Andrew Sales Director'}
                </p>
                <p>{settings.name || 'MILA Packaging Technology Co., Ltd.'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-slate-700">
                  {language === 'zh' ? '审核批准: General Manager' : 'Approved By: General Manager'}
                </p>
                <p>{language === 'zh' ? '企业盖章 / 签署生效' : 'Official Seal & Stamp'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Selection Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Boxes className="w-4 h-4 text-[#1565C0]" />
                {language === 'zh' ? '从产品库选择产品' : 'Select Product from Library'}
              </h3>
              <button 
                onClick={() => setShowProductModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  placeholder={language === 'zh' ? '搜索产品名称、型号或品类...' : 'Search products by model, SKU or category...'}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
              {products
                .filter(p => 
                  p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                  p.category.toLowerCase().includes(productSearch.toLowerCase())
                )
                .map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setActiveCalc({
                        ...activeCalc,
                        productId: p.id,
                        productName: p.name,
                        sku: p.sku,
                        productCategory: p.category,
                        neckSize: p.size || '28/410',
                        baseCostRmb: p.price ? Number((p.price * activeCalc.exchangeRate).toFixed(2)) : activeCalc.baseCostRmb,
                        piecesPerCarton: p.piecesPerBox || 500,
                        cartonLengthCm: p.cartonLength || 57,
                        cartonWidthCm: p.cartonWidth || 38,
                        cartonHeightCm: p.cartonHeight || 42,
                        cartonGrossWeightKg: p.grossWeight || 13.2,
                        productImage: p.image
                      });
                      setShowProductModal(false);
                      showToast(language === 'zh' ? `已导入产品 ${p.name}` : `Imported ${p.name}`);
                    }}
                    className="py-3 px-2 flex items-center justify-between hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded bg-slate-50 border border-slate-100" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                          <Boxes className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-800">{p.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{p.sku} | {p.size} | {p.category}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-blue-700">${p.price?.toFixed(3)}</div>
                      <div className="text-[10px] text-slate-400 font-mono">≈ ¥{(p.price * activeCalc.exchangeRate).toFixed(2)} RMB</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Client Selection Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1565C0]" />
                {language === 'zh' ? '从客户库选择客户' : 'Select Client from Database'}
              </h3>
              <button 
                onClick={() => setShowClientModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder={language === 'zh' ? '搜索客户公司、联系人或国家...' : 'Search clients...'}
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-slate-100 flex-1">
              {clients
                .filter(c => 
                  c.company.toLowerCase().includes(clientSearch.toLowerCase()) ||
                  c.contactPerson.toLowerCase().includes(clientSearch.toLowerCase()) ||
                  c.country.toLowerCase().includes(clientSearch.toLowerCase())
                )
                .map(c => (
                  <div 
                    key={c.id}
                    onClick={() => {
                      setActiveCalc({
                        ...activeCalc,
                        client: c,
                        clientName: c.company
                      });
                      setShowClientModal(false);
                      showToast(language === 'zh' ? `已选择客户 ${c.company}` : `Selected client ${c.company}`);
                    }}
                    className="py-2.5 px-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="text-xs font-bold text-slate-800">{c.company}</div>
                    <div className="text-[11px] text-slate-500">{c.contactPerson} | {c.country}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
