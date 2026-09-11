import React, { useState, useEffect, useRef } from 'react';
import { ProformaInvoice, ProformaInvoiceItem, Client, Product, CompanySettings, getCurrencySymbol, formatUnitPrice, SUPPORTED_CURRENCIES } from '../types';
import { generateId, getNextDocumentNumber, DEFAULT_STAMP_SVG, DEFAULT_CONTRACT_STAMP_SVG, DEFAULT_SIGNATURE_SVG } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
import { compressImageFile, removeWhiteBackground } from '../utils/imageCompressor';
import { TransparentSignature } from './TransparentSignature';
import ProductImageModal from './ProductImageModal';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Download, 
  X, 
  Check, 
  ChevronRight,
  PackageCheck,
  Eye,
  Calculator,
  UserPlus,
  Coins,
  Building2,
  Loader2,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Copy,
  Camera,
  Upload,
  BookmarkPlus,
  BookmarkCheck,
  Image as ImageIcon,
  Package,
  Layers,
  Wand2,
  Stamp,
  PenTool,
  RotateCcw,
  CheckSquare,
  Square,
  ShieldCheck,
  SlidersHorizontal,
  EyeOff,
  Languages
} from 'lucide-react';

interface ProformaGeneratorProps {
  proformaInvoices: ProformaInvoice[];
  onSaveProformaInvoices: (proformas: ProformaInvoice[]) => void;
  products: Product[];
  onSaveProducts?: (products: Product[]) => void;
  clients: Client[];
  onSaveClients: (clients: Client[]) => void;
  settings: CompanySettings;
}

export default function ProformaGenerator({ 
  proformaInvoices, 
  onSaveProformaInvoices, 
  products, 
  onSaveProducts,
  clients, 
  onSaveClients, 
  settings 
}: ProformaGeneratorProps) {
  const { t, language, setLanguage } = useLanguage();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeProforma, setActiveProforma] = useState<Partial<ProformaInvoice> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges, requestActionWithGuard } = useNavigationGuard();

  useEffect(() => {
    if (isEditing && activeProforma) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activeProforma.proformaNumber ? `Proforma Invoice: ${activeProforma.proformaNumber}` : 'Proforma Invoice Draft',
        docType: 'Proforma Invoice',
        onSave: () => {
          handleSaveDocument();
        },
        onDiscard: () => {
          setIsEditing(false);
          setActiveProforma(null);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [isEditing, activeProforma, proformaInvoices]);

  // Dedicated Product Image Modal State for PI items
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageModalItemIndex, setImageModalItemIndex] = useState<number | null>(null);
  const [imageModalCurrentImg, setImageModalCurrentImg] = useState<string | undefined>(undefined);
  const [imageModalTitle, setImageModalTitle] = useState<string>('Product');

  // Modals & Search state
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [showInlineProductForm, setShowInlineProductForm] = useState(false);
  const [inlineProduct, setInlineProduct] = useState<Partial<Product>>({
    name: '',
    sku: '',
    size: '',
    category: 'Sprayers & Pumps',
    price: 0.50,
    piecesPerBox: 500,
    moq: 1000,
    material: 'PP',
    color: 'Standard',
    description: '',
    image: undefined
  });

  const [showClientModal, setShowClientModal] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showInlineClientForm, setShowInlineClientForm] = useState(false);
  const [inlineClient, setInlineClient] = useState<Partial<Client>>({ 
    company: '', 
    contactPerson: '', 
    country: '', 
    address: '', 
    phone: '', 
    email: '' 
  });
  const [itemIndexToEdit, setItemIndexToEdit] = useState<number | null>(null);

  // Seals, Stamps & Signature Control State
  const customStampRef = useRef<HTMLInputElement>(null);
  const customSecondaryStampRef = useRef<HTMLInputElement>(null);
  const customSignatureRef = useRef<HTMLInputElement>(null);
  const [isProcessingTransparency, setIsProcessingTransparency] = useState<string | null>(null);

  // Stamp & Signature Image Upload Handler
  const handleCustomImageUpload = async (field: 'customStamp' | 'customSecondaryStamp' | 'customSignature', file: File) => {
    setIsProcessingTransparency(field);
    try {
      const compressed = await compressImageFile(file, 500, 500, 0.85, {
        preserveTransparency: true,
        autoRemoveBackground: true
      });
      const cleaned = await removeWhiteBackground(compressed);
      const toggleField = field === 'customStamp' ? 'showStamp' : field === 'customSecondaryStamp' ? 'showSecondaryStamp' : 'showSignature';
      setActiveProforma(prev => prev ? ({ ...prev, [field]: cleaned, [toggleField]: true }) : null);
      setIsProcessingTransparency(null);
      setNotificationMessage(`Applied custom ${field === 'customStamp' ? 'factory stamp' : field === 'customSecondaryStamp' ? 'secondary stamp' : 'signature'}!`);
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (err) {
      console.error('Failed to upload and clean image', err);
      setIsProcessingTransparency(null);
    }
  };

  // Stamp & Signature Clean Background Action
  const handleCleanCustomBg = async (field: 'customStamp' | 'customSecondaryStamp' | 'customSignature', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentVal = activeProforma?.[field] || (field === 'customStamp' ? settings.stamp : field === 'customSecondaryStamp' ? settings.secondaryStamp : settings.signature);
    if (!currentVal) return;
    setIsProcessingTransparency(field);
    try {
      const cleaned = await removeWhiteBackground(currentVal);
      setActiveProforma(prev => prev ? ({ ...prev, [field]: cleaned }) : null);
      setNotificationMessage("Background cleaned with transparency!");
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessingTransparency(null);
    }
  };

  // Preset setter
  const handleSetSealPreset = (field: 'customStamp' | 'customSecondaryStamp' | 'customSignature', preset: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const toggleField = field === 'customStamp' ? 'showStamp' : field === 'customSecondaryStamp' ? 'showSecondaryStamp' : 'showSignature';
    setActiveProforma(prev => prev ? ({ ...prev, [field]: preset, [toggleField]: true }) : null);
    setNotificationMessage(`Loaded ${field === 'customStamp' ? 'factory stamp' : field === 'customSecondaryStamp' ? 'secondary stamp' : 'signature'} preset!`);
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  // Remove / Hide Seal or Signature
  const handleRemoveSeal = (field: 'customStamp' | 'customSecondaryStamp' | 'customSignature', toggleField: 'showStamp' | 'showSecondaryStamp' | 'showSignature', e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveProforma(prev => prev ? ({ ...prev, [field]: '', [toggleField]: false }) : null);
    setNotificationMessage(`Removed ${field === 'customStamp' ? 'factory stamp' : field === 'customSecondaryStamp' ? 'secondary stamp' : 'signature'} from this invoice.`);
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  // Bulk actions
  const handleToggleAllSeals = (enable: boolean) => {
    setActiveProforma(prev => prev ? ({
      ...prev,
      showStamp: enable,
      showSecondaryStamp: enable,
      showSignature: enable
    }) : null);
    setNotificationMessage(enable ? "All stamps & signatures enabled." : "All stamps & signatures hidden (Clean Copy).");
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  const handleResetToCompanyDefaults = () => {
    setActiveProforma(prev => prev ? ({
      ...prev,
      showStamp: true,
      showSecondaryStamp: true,
      showSignature: true,
      customStamp: undefined,
      customSecondaryStamp: undefined,
      customSignature: undefined
    }) : null);
    setNotificationMessage("Restored company default stamps and signature.");
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  // Calculation helper
  const calculateTotals = (
    items: ProformaInvoiceItem[], 
    shipFee: number = 0, 
    insFee: number = 0, 
    pkgFee: number = 0,
    depPercent: number = 30
  ) => {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
    const grandTotal = subtotal + Number(shipFee || 0) + Number(insFee || 0) + Number(pkgFee || 0);
    const depositAmount = (grandTotal * Number(depPercent || 30)) / 100;
    const balanceAmount = Math.max(0, grandTotal - depositAmount);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      depositAmount: Number(depositAmount.toFixed(2)),
      balanceAmount: Number(balanceAmount.toFixed(2))
    };
  };

  const handleFieldChange = (field: keyof ProformaInvoice, value: any) => {
    if (!activeProforma) return;
    const nextPI = { ...activeProforma, [field]: value };
    const items = nextPI.items || [];
    const ship = Number(nextPI.shippingFee || 0);
    const ins = Number(nextPI.insurance || 0);
    const pkg = Number(nextPI.packagingFee || 0);
    const depP = Number(nextPI.depositPercentage !== undefined ? nextPI.depositPercentage : 30);

    const calcs = calculateTotals(items, ship, ins, pkg, depP);

    setActiveProforma({
      ...nextPI,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      depositAmount: calcs.depositAmount,
      balanceAmount: calcs.balanceAmount
    });
  };

  const handleCreateNew = () => {
    const nextNum = getNextDocumentNumber('proforma', proformaInvoices || []);
    const today = new Date().toISOString().split('T')[0];
    const valid = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const initialClient = clients[0] || { 
      company: 'Select Client Company', 
      contactPerson: 'Purchasing Manager', 
      address: '123 Commercial Blvd', 
      phone: '+1 555-0192', 
      email: 'buyer@client.com', 
      country: 'United States', 
      notes: '', 
      id: 'c-default' 
    };

    setActiveProforma({
      title: 'PROFORMA INVOICE',
      proformaNumber: nextNum,
      date: today,
      validUntil: valid,
      currency: settings.defaultCurrency || 'USD',
      salesperson: 'Export Manager',
      client: initialClient,
      incoterm: 'FOB',
      portOfLoading: 'Ningbo Port, China',
      portOfDestination: 'Destination Port',
      paymentTerms: '30% T/T deposit before production, 70% balance before shipment',
      depositPercentage: 30,
      depositAmount: 0,
      balanceAmount: 0,
      items: [],
      shippingFee: 0,
      insurance: 0,
      packagingFee: 0,
      subtotal: 0,
      grandTotal: 0,
      estimatedLeadTime: '15-20 days upon deposit receipt',
      notes: 'This Proforma Invoice is valid for 30 days. All banking wire fees outside China are to buyer account.',
      terms: 'Order production commences upon receipt of 30% advance deposit in our designated bank account.',
      showStamp: true,
      showSecondaryStamp: true,
      showSignature: true,
      createdAt: new Date().toISOString()
    });
    setIsEditing(true);
  };

  // Select client from database
  const handleSelectClient = (c: Client) => {
    if (!activeProforma) return;
    handleFieldChange('client', c);
    setShowClientModal(false);
  };

  // Create inline client
  const handleInlineClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineClient.company || !inlineClient.contactPerson) return;

    const brandNew: Client = {
      id: generateId(),
      company: inlineClient.company,
      contactPerson: inlineClient.contactPerson,
      country: inlineClient.country || 'International',
      address: inlineClient.address || '',
      phone: inlineClient.phone || '',
      email: inlineClient.email || '',
      notes: 'Registered inline during Proforma creation.'
    };

    onSaveClients([brandNew, ...clients]);
    if (activeProforma) {
      handleFieldChange('client', brandNew);
    }
    setShowInlineClientForm(false);
    setShowClientModal(false);
    setInlineClient({ company: '', contactPerson: '', country: '', address: '', phone: '', email: '' });
  };

  // Select product from library modal
  const handleSelectProduct = (p: Product) => {
    if (!activeProforma) return;
    const currentItems = [...(activeProforma.items || [])];

    const piecesPerBox = p.piecesPerBox || 500;
    const initialQty = p.moq || piecesPerBox * 2;
    const numBoxes = Math.ceil(initialQty / piecesPerBox);
    const totPcs = numBoxes * piecesPerBox;

    const newItem: ProformaInvoiceItem = {
      id: generateId(),
      productId: p.id,
      name: p.name,
      sku: p.sku,
      size: p.size || '',
      unitPrice: p.price,
      quantity: totPcs,
      piecesPerBox: piecesPerBox,
      numBoxes: numBoxes,
      totalPieces: totPcs,
      totalPrice: Number((totPcs * p.price).toFixed(2)),
      image: p.image
    };

    if (itemIndexToEdit !== null) {
      currentItems[itemIndexToEdit] = newItem;
      setItemIndexToEdit(null);
    } else {
      currentItems.push(newItem);
    }

    const calcs = calculateTotals(
      currentItems, 
      Number(activeProforma.shippingFee || 0), 
      Number(activeProforma.insurance || 0), 
      Number(activeProforma.packagingFee || 0),
      Number(activeProforma.depositPercentage || 30)
    );

    setActiveProforma({
      ...activeProforma,
      items: currentItems,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      depositAmount: calcs.depositAmount,
      balanceAmount: calcs.balanceAmount
    });

    setShowProductModal(false);
  };

  // Open Product Image Modal for a specific line item
  const handleOpenItemImageModal = (index: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeProforma?.items?.[index]) return;
    const itm = activeProforma.items[index];
    setImageModalItemIndex(index);
    setImageModalCurrentImg(itm.image);
    setImageModalTitle(itm.name || 'Line Item Product');
    setIsImageModalOpen(true);
  };

  // Save image from modal back to the line item
  const handleSaveItemImage = (newImage: string | undefined) => {
    if (imageModalItemIndex === null || !activeProforma || !activeProforma.items) return;
    handleItemRowChange(imageModalItemIndex, 'image', newImage);
    setIsImageModalOpen(false);
    setImageModalItemIndex(null);
    setNotificationMessage("Product photo applied to line item!");
    setTimeout(() => setNotificationMessage(null), 3000);
  };

  // Direct file upload for a specific line item
  const handleItemImageFileUpload = async (index: number, file: File) => {
    try {
      const compressed = await compressImageFile(file, 600, 600, 0.75);
      handleItemRowChange(index, 'image', compressed);
      setNotificationMessage("Product photo updated!");
      setTimeout(() => setNotificationMessage(null), 3000);
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleItemRowChange(index, 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save a line item back into the persistent Product Library
  const handleSaveItemToLibrary = (item: ProformaInvoiceItem) => {
    if (!onSaveProducts) return;
    const existing = products.find(p => p.id === item.productId || (item.sku && p.sku === item.sku));
    if (existing) {
      const updated = products.map(p => p.id === existing.id ? {
        ...p,
        name: item.name || p.name,
        sku: item.sku || p.sku,
        size: item.size || p.size,
        price: item.unitPrice || p.price,
        piecesPerBox: item.piecesPerBox || p.piecesPerBox,
        image: item.image || p.image,
        material: item.material || p.material,
        color: item.color || p.color,
      } : p);
      onSaveProducts(updated);
      setNotificationMessage(`Updated "${item.name}" in Product Library!`);
    } else {
      const newProduct: Product = {
        id: generateId(),
        name: item.name || 'Export Product',
        sku: item.sku || `SKU-${Date.now().toString().slice(-4)}`,
        size: item.size || 'Standard',
        category: 'Proforma Products',
        description: item.description || item.name || '',
        color: item.color || 'Standard',
        material: item.material || 'Plastic',
        weight: 0.02,
        price: item.unitPrice || 0.50,
        moq: item.piecesPerBox ? item.piecesPerBox * 2 : 1000,
        piecesPerBox: item.piecesPerBox || 500,
        cartonLength: 50,
        cartonWidth: 40,
        cartonHeight: 30,
        grossWeight: 10,
        netWeight: 9,
        countryOfOrigin: 'China',
        image: item.image,
        notes: 'Saved from Proforma Invoice'
      };
      onSaveProducts([newProduct, ...products]);
      setNotificationMessage(`Saved "${item.name}" to Product Library!`);
    }
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  // Create inline product inside the product library modal and immediately select it
  const handleInlineProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineProduct.name) return;

    const brandNewProd: Product = {
      id: generateId(),
      name: inlineProduct.name,
      sku: inlineProduct.sku || `SKU-${Date.now().toString().slice(-4)}`,
      size: inlineProduct.size || '',
      category: inlineProduct.category || 'Sprayers & Pumps',
      description: inlineProduct.description || inlineProduct.name,
      color: inlineProduct.color || 'Standard',
      material: inlineProduct.material || 'PP',
      weight: inlineProduct.weight || 0.025,
      price: Number(inlineProduct.price) || 0.50,
      moq: Number(inlineProduct.moq) || 1000,
      piecesPerBox: Number(inlineProduct.piecesPerBox) || 500,
      cartonLength: 50,
      cartonWidth: 40,
      cartonHeight: 30,
      grossWeight: 10,
      netWeight: 9,
      countryOfOrigin: 'China',
      image: inlineProduct.image,
      notes: 'Added inline from Proforma Invoice'
    };

    if (onSaveProducts) {
      onSaveProducts([brandNewProd, ...products]);
    }
    
    // Automatically select the newly created product
    handleSelectProduct(brandNewProd);
    setShowInlineProductForm(false);
    setInlineProduct({
      name: '',
      sku: '',
      size: '',
      category: 'Sprayers & Pumps',
      price: 0.50,
      piecesPerBox: 500,
      moq: 1000,
      material: 'PP',
      color: 'Standard',
      description: '',
      image: undefined
    });
    setNotificationMessage(`Created "${brandNewProd.name}" and added to invoice!`);
    setTimeout(() => setNotificationMessage(null), 3500);
  };

  // Add custom manual item
  const handleAddManualItem = () => {
    if (!activeProforma) return;
    const currentItems = [...(activeProforma.items || [])];
    const newItem: ProformaInvoiceItem = {
      id: generateId(),
      name: 'Fine Mist Sprayer',
      sku: `FMS-${Date.now().toString().slice(-4)}`,
      size: '24/410',
      material: 'PP / Smooth',
      color: 'Custom / White',
      unitPrice: 0.28,
      quantity: 5000,
      piecesPerBox: 1000,
      numBoxes: 5,
      totalPieces: 5000,
      totalPrice: 1400.00
    };
    currentItems.push(newItem);

    const calcs = calculateTotals(
      currentItems, 
      Number(activeProforma.shippingFee || 0), 
      Number(activeProforma.insurance || 0), 
      Number(activeProforma.packagingFee || 0),
      Number(activeProforma.depositPercentage || 30)
    );

    setActiveProforma({
      ...activeProforma,
      items: currentItems,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      depositAmount: calcs.depositAmount,
      balanceAmount: calcs.balanceAmount
    });
  };

  // Line item row change
  const handleItemRowChange = (index: number, field: keyof ProformaInvoiceItem, value: any) => {
    if (!activeProforma || !activeProforma.items) return;
    const items = [...activeProforma.items];
    const item = { ...items[index], [field]: value };

    if (field === 'numBoxes' || field === 'piecesPerBox' || field === 'unitPrice' || field === 'quantity') {
      const ppb = Math.max(1, Number(item.piecesPerBox) || 1);
      
      if (field === 'numBoxes') {
        const nb = Math.max(1, Number(value));
        item.numBoxes = nb;
        item.totalPieces = nb * ppb;
        item.quantity = item.totalPieces;
      } else if (field === 'quantity') {
        const qty = Math.max(0, Number(value));
        item.quantity = qty;
        item.totalPieces = qty;
        item.numBoxes = Math.ceil(qty / ppb);
      } else if (field === 'piecesPerBox') {
        item.piecesPerBox = ppb;
        item.numBoxes = Math.ceil((item.totalPieces || item.quantity) / ppb);
      }

      const up = Math.max(0, Number(item.unitPrice) || 0);
      item.unitPrice = up;
      item.totalPrice = Number((item.totalPieces * up).toFixed(2));
    }

    items[index] = item;
    const calcs = calculateTotals(
      items, 
      Number(activeProforma.shippingFee || 0), 
      Number(activeProforma.insurance || 0), 
      Number(activeProforma.packagingFee || 0),
      Number(activeProforma.depositPercentage || 30)
    );

    setActiveProforma({
      ...activeProforma,
      items,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      depositAmount: calcs.depositAmount,
      balanceAmount: calcs.balanceAmount
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!activeProforma || !activeProforma.items) return;
    const items = activeProforma.items.filter((_, i) => i !== index);
    const calcs = calculateTotals(
      items, 
      Number(activeProforma.shippingFee || 0), 
      Number(activeProforma.insurance || 0), 
      Number(activeProforma.packagingFee || 0),
      Number(activeProforma.depositPercentage || 30)
    );

    setActiveProforma({
      ...activeProforma,
      items,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      depositAmount: calcs.depositAmount,
      balanceAmount: calcs.balanceAmount
    });
  };

  // Duplicate an existing line item
  const handleDuplicateItem = (index: number) => {
    if (!activeProforma || !activeProforma.items) return;
    const itemToClone = activeProforma.items[index];
    if (!itemToClone) return;

    const clonedItem: ProformaInvoiceItem = {
      ...itemToClone,
      id: generateId()
    };

    const items = [...activeProforma.items];
    items.splice(index + 1, 0, clonedItem);

    const calcs = calculateTotals(
      items, 
      Number(activeProforma.shippingFee || 0), 
      Number(activeProforma.insurance || 0), 
      Number(activeProforma.packagingFee || 0),
      Number(activeProforma.depositPercentage || 30)
    );

    setActiveProforma({
      ...activeProforma,
      items,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      depositAmount: calcs.depositAmount,
      balanceAmount: calcs.balanceAmount
    });
  };

  // Duplicate entire document
  const handleDuplicateProforma = (proforma: ProformaInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newPI: ProformaInvoice = {
      ...proforma,
      id: generateId(),
      proformaNumber: `${proforma.proformaNumber}-COPY`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    onSaveProformaInvoices([newPI, ...(proformaInvoices || [])]);
    setActiveProforma(newPI);
    setIsEditing(true);
  };

  // Save document
  const handleSaveDocument = () => {
    if (!activeProforma || !activeProforma.proformaNumber) {
      alert("Proforma Invoice Number is required");
      return;
    }

    const list = proformaInvoices || [];
    const docToSave = {
      ...activeProforma,
      id: activeProforma.id || generateId(),
      createdAt: activeProforma.createdAt || new Date().toISOString()
    } as ProformaInvoice;

    const index = list.findIndex(p => p.id === docToSave.id);

    if (index >= 0) {
      const updated = [...list];
      updated[index] = docToSave;
      onSaveProformaInvoices(updated);
    } else {
      onSaveProformaInvoices([docToSave, ...list]);
    }
    setIsEditing(false);
    setActiveProforma(null);
  };

  const handleDeleteProforma = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = window.confirm("Are you sure you want to delete this Proforma Invoice?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const updated = proformaInvoices.filter(p => p.id !== id);
      onSaveProformaInvoices(updated);
    }
  };

  const handlePrint = () => {
    printDocument('print-area');
  };

  // PDF Download Execution
  const handleDownloadPDF = async () => {
    if (!activeProforma) return;
    setIsDownloading(true);
    try {
      await exportDocumentToPDF('print-area', activeProforma.proformaNumber || 'Proforma_Invoice');
    } catch (e) {
      console.error("PDF generation error:", e);
      printDocument('print-area');
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredList = (proformaInvoices || []).filter(p => 
    p.proformaNumber.toLowerCase().includes(search.toLowerCase()) ||
    (p.client?.company && p.client.company.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.size && p.size.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filteredClients = clients.filter(c => 
    c.company.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.contactPerson.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.country.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Computed Effective Seals, Stamps & Signatures for Current Proforma Invoice
  const effectivePrimaryStamp = activeProforma?.showStamp !== false
    ? (activeProforma?.customStamp !== undefined
        ? (activeProforma.customStamp || null)
        : (settings.stamp || null))
    : null;

  const effectiveSecondaryStamp = activeProforma?.showSecondaryStamp !== false
    ? (activeProforma?.customSecondaryStamp !== undefined
        ? (activeProforma.customSecondaryStamp || null)
        : (settings.secondaryStamp || null))
    : null;

  const effectiveSignature = activeProforma?.showSignature !== false
    ? (activeProforma?.customSignature !== undefined
        ? (activeProforma.customSignature || null)
        : (settings.signature || null))
    : null;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Coins className="text-[#1565C0]" size={24} />
            {language === 'zh' ? '形式发票生成器' : 'Proforma Invoice Generator'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'zh' 
              ? '生成包含预付款条款和银行电汇账户的官方出口形式发票 (PI)。' 
              : 'Generate official export proforma invoices with advance payment terms & bank wire instructions.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Switcher Button */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
            <div className="pl-1.5 pr-1 text-slate-500 flex items-center">
              <Languages size={13} />
            </div>
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-bold select-none ${
                language === 'en'
                  ? 'bg-[#1565C0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('zh')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer text-xs font-bold select-none ${
                language === 'zh'
                  ? 'bg-[#1565C0] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="中文"
            >
              中文
            </button>
          </div>

          {!isEditing && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <Plus size={16} />
              {language === 'zh' ? '新建形式发票' : 'New Proforma Invoice'}
            </button>
          )}
        </div>
      </div>

      {/* Editor or List View */}
      {isEditing && activeProforma ? (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3 sm:p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  PI:
                </span>
                <span className="text-sm font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                  {activeProforma.proformaNumber}
                </span>
              </div>

              {/* Language Switcher inside Action Header */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-bold shrink-0">
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer text-[10px] select-none ${
                    language === 'en'
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Switch to English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('zh')}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer text-[10px] select-none ${
                    language === 'zh'
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="切换至中文"
                >
                  中文
                </button>
              </div>

              {/* Mobile View Toggle (Visible only on mobile/tablet) */}
              <div className="lg:hidden flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMobileTab('form')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mobileTab === 'form' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'zh' ? '表单' : 'Form'}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mobileTab === 'preview' 
                      ? 'bg-blue-600 text-white shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'zh' ? '预览' : 'Preview'}
                </button>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 justify-end w-full sm:w-auto">
              <button
                onClick={() => {
                  requestActionWithGuard(() => {
                    setIsEditing(false);
                    setActiveProforma(null);
                  });
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeProforma) {
                    handleDuplicateProforma(activeProforma as ProformaInvoice);
                  }
                }}
                className="hidden sm:inline-flex px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-blue-200 border border-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer items-center gap-1.5"
                title={language === 'zh' ? '复制此形式发票' : 'Duplicate this Proforma Invoice'}
              >
                <Copy size={13} />
                {language === 'zh' ? '复制' : 'Duplicate'}
              </button>
              <button
                onClick={handleSaveDocument}
                className="px-3.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Check size={14} />
                {language === 'zh' ? '保存' : 'Save'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-3 sm:px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                {isDownloading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    {language === 'zh' ? '导出中...' : 'PDF...'}
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    PDF
                  </>
                )}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={13} />
                {language === 'zh' ? '打印' : 'Print'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Inputs (lg:col-span-6) */}
            <div className={`lg:col-span-6 space-y-5 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              {/* Document Metadata (Card 1) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Building2 size={12} className="text-[#1565C0]" /> 
                  {language === 'zh' ? '单据抬头与发票信息' : 'Header Specifications & Invoice Details'}
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '单据标题' : 'Document Title'}
                    </label>
                    <input 
                      type="text" 
                      value={activeProforma.title || 'PROFORMA INVOICE'}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? 'PI 形式发票编号' : 'PI Number'}
                    </label>
                    <input 
                      type="text" 
                      value={activeProforma.proformaNumber || ''}
                      onChange={(e) => handleFieldChange('proformaNumber', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '开票日期' : 'Issue Date'}
                    </label>
                    <input 
                      type="date" 
                      value={activeProforma.date || ''}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '有效期至' : 'Valid Until'}
                    </label>
                    <input 
                      type="date" 
                      value={activeProforma.validUntil || ''}
                      onChange={(e) => handleFieldChange('validUntil', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '外贸业务员' : 'Sales Manager'}
                    </label>
                    <input 
                      type="text" 
                      value={activeProforma.salesperson || ''}
                      onChange={(e) => handleFieldChange('salesperson', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '结算币种' : 'Currency'}
                    </label>
                    <select
                      value={activeProforma.currency || 'USD'}
                      onChange={(e) => handleFieldChange('currency', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.flag} {curr.code} ({curr.symbol}) - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Client Selection (Card 2) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <UserPlus size={12} className="text-[#1565C0]" /> 
                    {language === 'zh' ? '收货人 / 买方客户' : 'Consignee / Buyer Client'}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setClientSearch(''); setShowClientModal(true); }}
                    className="text-[11px] font-bold text-[#1565C0] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Search size={12} /> {language === 'zh' ? '从客户库选择' : 'Select Client Database'}
                  </button>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80 relative">
                  <p className="text-xs font-bold text-slate-900">{activeProforma.client?.company || (language === 'zh' ? '未指定客户' : 'No client selected')}</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">{language === 'zh' ? '联系人: ' : 'Attn: '}{activeProforma.client?.contactPerson || '-'}</p>
                  <p className="text-[11px] text-slate-500">{activeProforma.client?.address ? `${activeProforma.client?.address}, ` : ''}{activeProforma.client?.country || ''}</p>
                  {activeProforma.client?.phone && <p className="text-[10px] text-slate-500">Tel: {activeProforma.client.phone}</p>}
                </div>
              </div>

              {/* Incoterms & Advance Deposit Breakdown (Card 3) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Coins size={12} className="text-[#1565C0]" /> 
                  {language === 'zh' ? '贸易条款与定金规则' : 'Export Terms & Advance Deposit Rules'}
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '贸易术语' : 'Incoterms'}
                    </label>
                    <select
                      value={activeProforma.incoterm || 'FOB'}
                      onChange={(e) => handleFieldChange('incoterm', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                    >
                      <option value="FOB">FOB (Free On Board)</option>
                      <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                      <option value="CFR">CFR (Cost & Freight)</option>
                      <option value="EXW">EXW (Ex Works)</option>
                      <option value="DDP">DDP (Delivered Duty Paid)</option>
                      <option value="DAP">DAP (Delivered At Place)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '定金比例 (%)' : 'Deposit Percentage (%)'}
                    </label>
                    <input 
                      type="number"
                      min="0"
                      max="100"
                      value={activeProforma.depositPercentage !== undefined ? activeProforma.depositPercentage : 30}
                      onChange={(e) => handleFieldChange('depositPercentage', Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-blue-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '起运港' : 'Port of Loading'}
                    </label>
                    <input 
                      type="text" 
                      value={activeProforma.portOfLoading || ''}
                      onChange={(e) => handleFieldChange('portOfLoading', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '目的港' : 'Port of Destination'}
                    </label>
                    <input 
                      type="text" 
                      value={activeProforma.portOfDestination || ''}
                      onChange={(e) => handleFieldChange('portOfDestination', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Advance deposit display */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-blue-900 block">
                      {language === 'zh' ? `所需定金 (${activeProforma.depositPercentage}%)` : `Required Deposit (${activeProforma.depositPercentage}%)`}
                    </span>
                    <span className="text-sm font-black text-blue-700">{activeProforma.currency || 'USD'} {(activeProforma.depositAmount || 0).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block">
                      {language === 'zh' ? '剩余尾款' : 'Remaining Balance'}
                    </span>
                    <span className="text-sm font-black text-slate-800">{activeProforma.currency || 'USD'} {(activeProforma.balanceAmount || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                {/* Notification toast if active */}
                {notificationMessage && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-between animate-fade-in">
                    <span className="flex items-center gap-1.5">
                      <Check size={14} className="text-emerald-600" />
                      {notificationMessage}
                    </span>
                    <button onClick={() => setNotificationMessage(null)} className="text-emerald-600 hover:text-emerald-800"><X size={12} /></button>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <PackageCheck size={12} className="text-[#1565C0]" /> 
                      {language === 'zh' ? '产品明细与价格清单' : 'Line Items & Pricing Catalog'}
                    </span>
                    {activeProforma.items && activeProforma.items.length > 0 && (
                      <span className="px-2 py-0.5 bg-blue-50 text-[#1565C0] rounded-full text-[10px] font-bold">
                        {activeProforma.items.length} {language === 'zh' ? '项商品' : (activeProforma.items.length === 1 ? 'item' : 'items')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setProductSearch(''); setItemIndexToEdit(null); setShowInlineProductForm(false); setShowProductModal(true); }}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                      title={language === 'zh' ? '从产品库选择产品' : 'Select product from your catalog'}
                    >
                      <Plus size={13} /> {language === 'zh' ? '从产品库添加' : 'Add From Product Library'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddManualItem}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                      title={language === 'zh' ? '添加空白自定义行' : 'Add a customizable blank item row'}
                    >
                      <Plus size={13} /> {language === 'zh' ? '添加自定义商品' : 'Add Custom Item'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowInlineProductForm(true); setShowProductModal(true); }}
                      className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                      title={language === 'zh' ? '新建产品并添加到发票' : 'Create brand new product with image and add to invoice'}
                    >
                      <Sparkles size={13} className="text-amber-600" /> {language === 'zh' ? '新建产品' : 'New Product'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {(!activeProforma.items || activeProforma.items.length === 0) ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                      <div className="w-12 h-12 bg-blue-50 text-[#1565C0] rounded-2xl flex items-center justify-center mx-auto">
                        <Package size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{language === 'zh' ? '发票中暂无产品明细' : 'No product items added to invoice'}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{language === 'zh' ? '点击“从产品库添加”或“添加自定义商品”开始建立形式发票。' : 'Click "Add From Product Library" or "Add Custom Item" to start building your proforma invoice.'}</p>
                      </div>
                      <div className="flex justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => { setProductSearch(''); setItemIndexToEdit(null); setShowInlineProductForm(false); setShowProductModal(true); }}
                          className="px-3 py-1.5 bg-[#1565C0] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus size={14} /> {language === 'zh' ? '从产品库添加' : 'Add From Product Library'}
                        </button>
                        <button
                          type="button"
                          onClick={handleAddManualItem}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 cursor-pointer"
                        >
                          {language === 'zh' ? '+ 自定义商品' : '+ Custom Item'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    activeProforma.items.map((item, index) => (
                      <div key={item.id} className="p-3.5 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl space-y-3 text-xs transition-all shadow-2xs">
                        {/* Item Top Area: Image Thumbnail Box & Product Info */}
                        <div className="flex gap-3 items-start">
                          {/* Product Image Box with Direct Upload / Drag & Drop / Presets */}
                          <div className="relative group shrink-0">
                            <div 
                              onClick={() => handleOpenItemImageModal(index)}
                              className="w-16 h-16 sm:w-20 sm:h-20 bg-white border border-slate-200 rounded-xl flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#1565C0] transition-colors relative"
                              title={language === 'zh' ? '点击更换或添加产品图片 / 矢量预设' : 'Click to change or add product photo / vector presets'}
                            >
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-full h-full object-contain p-1" 
                                  referrerPolicy="no-referrer" 
                                />
                              ) : (
                                <div className="text-center p-1 space-y-0.5">
                                  <Camera size={18} className="text-slate-400 mx-auto group-hover:text-[#1565C0] group-hover:scale-110 transition-transform" />
                                  <span className="text-[8px] font-bold text-slate-400 block leading-tight group-hover:text-[#1565C0]">
                                    {language === 'zh' ? '添加图片' : 'Add Photo'}
                                  </span>
                                </div>
                              )}

                              {/* Hover actions overlay */}
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleOpenItemImageModal(index, e)}
                                  className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded-md shadow-xs transition-colors"
                                  title={language === 'zh' ? '打开图片与预设库' : 'Open Image & Presets Modal'}
                                >
                                  <Wand2 size={12} />
                                </button>
                                
                                <label 
                                  onClick={(e) => e.stopPropagation()} 
                                  className="p-1 bg-white/90 hover:bg-white text-slate-800 rounded-md shadow-xs transition-colors cursor-pointer"
                                  title={language === 'zh' ? '直接上传图片文件' : 'Upload Image File Directly'}
                                >
                                  <Upload size={12} />
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) handleItemImageFileUpload(index, f);
                                    }} 
                                  />
                                </label>

                                {item.image && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleItemRowChange(index, 'image', undefined);
                                    }}
                                    className="p-1 bg-red-500/90 hover:bg-red-600 text-white rounded-md shadow-xs transition-colors"
                                    title={language === 'zh' ? '移除图片' : 'Remove Photo'}
                                  >
                                    <X size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <span className="text-[8px] font-semibold text-slate-400 text-center block mt-0.5">
                              {item.image ? (language === 'zh' ? '已附图片' : 'Photo Attached') : (language === 'zh' ? '无图片' : 'No Image')}
                            </span>
                          </div>

                          {/* Product Info & Specifications */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleItemRowChange(index, 'name', e.target.value)}
                                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-[#1565C0] rounded-lg px-2.5 py-1 font-extrabold text-slate-900 outline-hidden text-xs"
                                  placeholder={language === 'zh' ? '产品名称 / 英文描述 (例如: 24/410 Fine Mist Sprayer)' : 'Product Name / Description (e.g. 24/410 Fine Mist Sprayer)'}
                                />
                              </div>

                              {/* Row action buttons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleOpenItemImageModal(index)}
                                  className="px-2 py-1 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-[#1565C0] rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                  title={language === 'zh' ? '添加/编辑图片与矢量预设' : 'Add/Edit Photo & Vector Presets'}
                                >
                                  <Camera size={12} />
                                  <span>{item.image ? (language === 'zh' ? '更换图片' : 'Edit Photo') : (language === 'zh' ? '上传图片' : 'Upload Photo')}</span>
                                </button>

                                {onSaveProducts && (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveItemToLibrary(item)}
                                    className="px-2 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                    title={language === 'zh' ? '保存或同步此产品至产品库' : 'Save or sync this product item to your central Product Library'}
                                  >
                                    <BookmarkPlus size={12} />
                                    <span>{language === 'zh' ? '保存至库' : 'Save to Catalog'}</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDuplicateItem(index)}
                                  className="text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                  title={language === 'zh' ? '复制此项' : 'Duplicate line item'}
                                >
                                  <Copy size={13} />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                                  title={language === 'zh' ? '删除此项' : 'Delete line item'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Detailed Product Specifications */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-0.5">
                                  {language === 'zh' ? '产品货号 / SKU' : 'SKU / Code'}
                                </label>
                                <input 
                                  type="text" 
                                  value={item.sku} 
                                  onChange={(e) => handleItemRowChange(index, 'sku', e.target.value)} 
                                  placeholder="e.g. FMS-01"
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] font-mono text-slate-700" 
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-0.5">
                                  {language === 'zh' ? '规格 / 尺寸' : 'Neck Size / Spec'}
                                </label>
                                <input 
                                  type="text" 
                                  value={item.size || ''} 
                                  onChange={(e) => handleItemRowChange(index, 'size', e.target.value)} 
                                  placeholder="e.g. 24/410, 50ml"
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-700" 
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-0.5">
                                  {language === 'zh' ? '材质' : 'Material'}
                                </label>
                                <input 
                                  type="text" 
                                  value={item.material || ''} 
                                  onChange={(e) => handleItemRowChange(index, 'material', e.target.value)} 
                                  placeholder="e.g. PP / Aluminum"
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-700" 
                                />
                              </div>

                              <div>
                                <label className="text-[9px] font-bold text-slate-400 block mb-0.5">
                                  {language === 'zh' ? '颜色 / 工艺' : 'Color / Finish'}
                                </label>
                                <input 
                                  type="text" 
                                  value={item.color || ''} 
                                  onChange={(e) => handleItemRowChange(index, 'color', e.target.value)} 
                                  placeholder="e.g. White / Ribbed"
                                  className="w-full bg-white border border-slate-200 rounded px-2 py-0.5 text-[11px] text-slate-700" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Numeric and Pricing Calculations Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 items-end pt-2 border-t border-slate-200/80">
                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                              {language === 'zh' ? '数量 (Pcs)' : 'Quantity (Pcs)'}
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleItemRowChange(index, 'quantity', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-slate-900"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                              {language === 'zh' ? '单箱装数' : 'Pcs / Carton Box'}
                            </label>
                            <input
                              type="number"
                              value={item.piecesPerBox}
                              onChange={(e) => handleItemRowChange(index, 'piecesPerBox', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                              {language === 'zh' ? '总箱数' : 'Total Cartons'}
                            </label>
                            <input
                              type="number"
                              value={item.numBoxes || Math.ceil(item.quantity / (item.piecesPerBox || 1))}
                              onChange={(e) => handleItemRowChange(index, 'numBoxes', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700"
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                              {language === 'zh' ? '单价' : 'Unit Price'} ({activeProforma.currency || 'USD'})
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => handleItemRowChange(index, 'unitPrice', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 font-bold text-blue-700"
                            />
                          </div>

                          <div className="text-right sm:col-span-1 col-span-2 bg-white/70 p-1.5 rounded-lg border border-slate-200">
                            <span className="text-[8px] text-slate-400 font-bold uppercase block tracking-wider">
                              {language === 'zh' ? '小计' : 'Item Total'}
                            </span>
                            <span className="font-black text-slate-900 text-sm">{getCurrencySymbol(activeProforma.currency)}{(item.totalPrice || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Adjustments & Logistics (Card 5) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Calculator size={12} className="text-[#1565C0]" /> 
                  {language === 'zh' ? '运费、保险与商务备注' : 'Freight, Insurance & Commercial Notes'}
                </span>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '海/空运费' : 'Freight Charge'} ({activeProforma.currency || 'USD'})
                    </label>
                    <input 
                      type="number" 
                      value={activeProforma.shippingFee !== undefined ? activeProforma.shippingFee : 0}
                      onChange={(e) => handleFieldChange('shippingFee', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '货运保险费' : 'Insurance Fee'} ({activeProforma.currency || 'USD'})
                    </label>
                    <input 
                      type="number" 
                      value={activeProforma.insurance !== undefined ? activeProforma.insurance : 0}
                      onChange={(e) => handleFieldChange('insurance', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                      {language === 'zh' ? '包装/托盘费' : 'Packaging Fee'} ({activeProforma.currency || 'USD'})
                    </label>
                    <input 
                      type="number" 
                      value={activeProforma.packagingFee !== undefined ? activeProforma.packagingFee : 0}
                      onChange={(e) => handleFieldChange('packagingFee', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {language === 'zh' ? '预计交货期 / 生产工期' : 'Estimated Lead Time'}
                  </label>
                  <input 
                    type="text" 
                    value={activeProforma.estimatedLeadTime || ''}
                    onChange={(e) => handleFieldChange('estimatedLeadTime', e.target.value)}
                    placeholder={language === 'zh' ? '例如: 收到定金后 25-30 天' : 'e.g. 25-30 days after deposit payment'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                  />
                </div>

                <div className="space-y-3 pt-1 border-t border-slate-100">
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeProforma.showNotes !== false}
                          onChange={(e) => handleFieldChange('showNotes', e.target.checked)}
                          className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
                          {language === 'zh' ? '包含商务特别说明' : 'Include Commercial Notes'}
                        </span>
                      </label>
                      {activeProforma.showNotes !== false && (
                        <input
                          type="text"
                          value={activeProforma.notesTitle || ''}
                          onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                          placeholder="Title (Default: COMMERCIAL NOTES)"
                          className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-44 text-right"
                        />
                      )}
                    </div>
                    {activeProforma.showNotes !== false ? (
                      <>
                        <textarea 
                          rows={2}
                          value={activeProforma.notes || ''}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                          placeholder={language === 'zh' ? '输入商务说明、质检认证、装箱要求...' : 'Enter commercial notes, certifications, packing details...'}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 leading-relaxed resize-y"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('notes', '1. Goods are manufactured according to international export standard quality.\n2. All carton packaging reinforced with strapping.\n3. Inspection allowed prior to loading.')}
                            className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + {language === 'zh' ? '标准品质说明' : 'Standard Quality Notes'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange('notes', '1. Warranty period: 12 months from date of shipment.\n2. Customized color and logo silk-screen printing included.')}
                            className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + {language === 'zh' ? '质保与定制说明' : 'Warranty & Customization'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        {language === 'zh' ? '商务特别说明当前已隐藏。' : 'Commercial notes section is currently hidden from this proforma invoice.'}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeProforma.showTerms !== false}
                          onChange={(e) => handleFieldChange('showTerms', e.target.checked)}
                          className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
                          {language === 'zh' ? '包含付款与生产条款' : 'Include Payment & Production Terms'}
                        </span>
                      </label>
                      {activeProforma.showTerms !== false && (
                        <input
                          type="text"
                          value={activeProforma.termsTitle || ''}
                          onChange={(e) => handleFieldChange('termsTitle', e.target.value)}
                          placeholder="Title (Default: PAYMENT & PRODUCTION TERMS)"
                          className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-52 text-right"
                        />
                      )}
                    </div>
                    {activeProforma.showTerms !== false ? (
                      <>
                        <textarea 
                          rows={2}
                          value={activeProforma.terms || ''}
                          onChange={(e) => handleFieldChange('terms', e.target.value)}
                          placeholder={language === 'zh' ? '输入付款节点、定金比例、信用证要求...' : 'Enter payment milestones, deposit terms, L/C conditions...'}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 leading-relaxed resize-y"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('terms', 'Payment by T/T: 30% advance deposit upon order confirmation, 70% balance payment before shipment.')}
                            className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + {language === 'zh' ? '30% 定金 / 70% 发货前' : '30% Deposit / 70% Pre-Shipment'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange('terms', 'Payment by T/T: 30% advance deposit upon order confirmation, 70% balance against copy of Bill of Lading (B/L).')}
                            className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + {language === 'zh' ? '30% 定金 / 70% 见提单副本' : '30% Deposit / 70% vs B/L'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange('terms', '100% Irrevocable Letter of Credit (L/C) at sight confirmed by international first-class bank.')}
                            className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + {language === 'zh' ? '100% 即期信用证 (L/C)' : '100% L/C at Sight'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        {language === 'zh' ? '付款与生产条款当前已隐藏。' : 'Payment & production terms section is currently hidden from this proforma invoice.'}
                      </p>
                    )}
                  </div>

                  {/* Wire Transfer Remittance / Banking Details in Form */}
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeProforma.showBankDetails !== false}
                          onChange={(e) => handleFieldChange('showBankDetails', e.target.checked)}
                          className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
                          {language === 'zh' ? '包含银行电汇账户信息' : 'Include Wire Transfer Banking Coordinates'}
                        </span>
                      </label>
                      {activeProforma.showBankDetails !== false && (
                        <input
                          type="text"
                          value={activeProforma.bankTitle || ''}
                          onChange={(e) => handleFieldChange('bankTitle', e.target.value)}
                          placeholder="Title (Default: WIRE TRANSFER REMITTANCE)"
                          className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-52 text-right"
                        />
                      )}
                    </div>
                    {activeProforma.showBankDetails !== false ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">
                              {language === 'zh' ? '开户银行' : 'Bank Name'}
                            </label>
                            <input
                              type="text"
                              value={activeProforma.bankName ?? settings.bankName ?? ''}
                              onChange={(e) => handleFieldChange('bankName', e.target.value)}
                              placeholder={settings.bankName || 'Bank Name'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">
                              {language === 'zh' ? '支行名称' : 'Branch'}
                            </label>
                            <input
                              type="text"
                              value={activeProforma.branch ?? settings.branch ?? ''}
                              onChange={(e) => handleFieldChange('branch', e.target.value)}
                              placeholder={settings.branch || 'Branch'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">
                              {language === 'zh' ? '收款人名称' : 'Beneficiary Name'}
                            </label>
                            <input
                              type="text"
                              value={activeProforma.accountName ?? settings.accountName ?? ''}
                              onChange={(e) => handleFieldChange('accountName', e.target.value)}
                              placeholder={settings.accountName || 'Beneficiary Name'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">
                              {language === 'zh' ? '银行账号' : 'Account Number'}
                            </label>
                            <input
                              type="text"
                              value={activeProforma.accountNumber ?? settings.accountNumber ?? ''}
                              onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                              placeholder={settings.accountNumber || 'Account Number'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">SWIFT Code</label>
                            <input
                              type="text"
                              value={activeProforma.swift ?? settings.swift ?? ''}
                              onChange={(e) => handleFieldChange('swift', e.target.value)}
                              placeholder={settings.swift || 'SWIFT Code'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">IBAN (Optional)</label>
                            <input
                              type="text"
                              value={activeProforma.iban ?? settings.iban ?? ''}
                              onChange={(e) => handleFieldChange('iban', e.target.value)}
                              placeholder={settings.iban || 'IBAN'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase">
                            {language === 'zh' ? '附言 / 中转行备注' : 'Additional Remittance / Intermediary Notes'}
                          </label>
                          <input
                            type="text"
                            value={activeProforma.bankRemarks || ''}
                            onChange={(e) => handleFieldChange('bankRemarks', e.target.value)}
                            placeholder={language === 'zh' ? '可选 (例如: 请在电汇附言中注明形式发票号)' : 'Optional (e.g. Please state PI number on wire memo)'}
                            className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        {language === 'zh' ? '银行电汇账户信息当前已隐藏。' : 'Wire transfer banking details are hidden from this proforma invoice.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Official Factory Stamps & Authorized Signature Controls (Card 6) */}
              <div id="proforma-stamps-signature-card" className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold">
                      <Stamp size={15} />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                        {language === 'zh' ? '官方印章与签字控制' : 'Official Stamps & Signature'}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {language === 'zh' ? '针对当前形式发票开启、关闭或自定义印章与签字' : 'Toggle, customize, or remove stamps & signature for this PI'}
                      </p>
                    </div>
                  </div>

                  {/* Bulk toggle actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleAllSeals(true)}
                      className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title={language === 'zh' ? '显示所有印章和签字' : 'Enable all stamps and signature on this PI'}
                    >
                      <CheckSquare size={11} /> {language === 'zh' ? '全部显示' : 'Enable All'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAllSeals(false)}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[9px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title={language === 'zh' ? '隐藏所有印章和签字 (生成未盖章版)' : 'Remove all stamps and signature (Clean Unsigned Copy)'}
                    >
                      <EyeOff size={11} /> {language === 'zh' ? '全部隐藏' : 'Hide All'}
                    </button>
                    <button
                      type="button"
                      onClick={handleResetToCompanyDefaults}
                      className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-md text-[9px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                      title={language === 'zh' ? '恢复为公司设置默认印章' : 'Revert stamps & signatures to Company Settings defaults'}
                    >
                      <RotateCcw size={11} /> {language === 'zh' ? '恢复默认' : 'Reset Defaults'}
                    </button>
                  </div>
                </div>

                {/* 3 Asset Control Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* 1. Primary Factory Stamp */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    activeProforma.showStamp !== false && effectivePrimaryStamp
                      ? 'bg-blue-50/30 border-blue-200 shadow-2xs' 
                      : 'bg-slate-50/50 border-slate-200 opacity-80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeProforma.showStamp !== false}
                          onChange={(e) => handleFieldChange('showStamp', e.target.checked)}
                          className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          {language === 'zh' ? '企业公章' : 'Primary Stamp'}
                        </span>
                      </label>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                        activeProforma.showStamp !== false && effectivePrimaryStamp 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {activeProforma.showStamp !== false ? (language === 'zh' ? '已显示' : 'Shown') : (language === 'zh' ? '已隐藏' : 'Hidden')}
                      </span>
                    </div>

                    {/* Preview Box */}
                    <div 
                      onClick={() => customStampRef.current?.click()}
                      className="relative h-28 border border-dashed border-slate-300 hover:border-blue-500 rounded-lg flex flex-col items-center justify-center p-2 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] cursor-pointer group overflow-hidden bg-white/70"
                    >
                      {activeProforma.showStamp !== false && effectivePrimaryStamp ? (
                        <>
                          <img 
                            src={effectivePrimaryStamp} 
                            alt="Primary Stamp" 
                            className="max-h-20 max-w-full object-contain mix-blend-multiply drop-shadow-2xs group-hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                            <button
                              type="button"
                              onClick={(e) => handleCleanCustomBg('customStamp', e)}
                              disabled={isProcessingTransparency === 'customStamp'}
                              className="px-1.5 py-1 bg-white text-slate-800 hover:bg-blue-50 rounded text-[8px] font-bold flex items-center gap-1"
                              title={language === 'zh' ? '一键去除白底' : 'Clean white background'}
                            >
                              <Wand2 size={10} className="text-blue-600" /> {language === 'zh' ? '去白底' : 'Clean'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveSeal('customStamp', 'showStamp', e)}
                              className="px-1.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[8px] font-bold flex items-center gap-1"
                              title={language === 'zh' ? '移除主章' : 'Remove primary stamp'}
                            >
                              <X size={10} /> {language === 'zh' ? '移除' : 'Remove'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-1">
                          <Stamp size={18} className="text-slate-400 mx-auto" />
                          <span className="text-[9px] font-bold text-slate-500 block">
                            {activeProforma.showStamp === false ? (language === 'zh' ? '印章已隐藏' : 'Stamp Hidden') : (language === 'zh' ? '无印章' : 'No Stamp')}
                          </span>
                          <span className="text-[8px] text-slate-400 block">{language === 'zh' ? '点击上传自定义图片' : 'Click to upload custom'}</span>
                        </div>
                      )}
                      <input 
                        ref={customStampRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCustomImageUpload('customStamp', f);
                        }} 
                      />
                    </div>

                    {/* Quick helper links */}
                    <div className="flex items-center justify-between pt-2 text-[9px]">
                      <button
                        type="button"
                        onClick={(e) => handleSetSealPreset('customStamp', DEFAULT_STAMP_SVG, e)}
                        className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <RotateCcw size={9} /> {language === 'zh' ? '使用预设' : 'Use Preset'}
                      </button>
                      {activeProforma.showStamp !== false ? (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSeal('customStamp', 'showStamp', e)}
                          className="text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          {language === 'zh' ? '隐藏/移除' : 'Hide / Remove'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('showStamp', true)}
                          className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                        >
                          {language === 'zh' ? '显示印章' : 'Enable Stamp'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. Secondary Stamp (Contract / Oval) */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    activeProforma.showSecondaryStamp !== false && effectiveSecondaryStamp
                      ? 'bg-rose-50/30 border-rose-200 shadow-2xs' 
                      : 'bg-slate-50/50 border-slate-200 opacity-80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeProforma.showSecondaryStamp !== false}
                          onChange={(e) => handleFieldChange('showSecondaryStamp', e.target.checked)}
                          className="rounded text-rose-600 focus:ring-rose-600 h-3.5 w-3.5"
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          {language === 'zh' ? '合同/财务章' : 'Secondary Stamp'}
                        </span>
                      </label>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                        activeProforma.showSecondaryStamp !== false && effectiveSecondaryStamp 
                          ? 'bg-rose-100 text-rose-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {activeProforma.showSecondaryStamp !== false ? (language === 'zh' ? '已显示' : 'Shown') : (language === 'zh' ? '已隐藏' : 'Hidden')}
                      </span>
                    </div>

                    {/* Preview Box */}
                    <div 
                      onClick={() => customSecondaryStampRef.current?.click()}
                      className="relative h-28 border border-dashed border-slate-300 hover:border-rose-500 rounded-lg flex flex-col items-center justify-center p-2 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] cursor-pointer group overflow-hidden bg-white/70"
                    >
                      {activeProforma.showSecondaryStamp !== false && effectiveSecondaryStamp ? (
                        <>
                          <img 
                            src={effectiveSecondaryStamp} 
                            alt="Secondary Stamp" 
                            className="max-h-20 max-w-full object-contain mix-blend-multiply drop-shadow-2xs group-hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                            <button
                              type="button"
                              onClick={(e) => handleCleanCustomBg('customSecondaryStamp', e)}
                              disabled={isProcessingTransparency === 'customSecondaryStamp'}
                              className="px-1.5 py-1 bg-white text-slate-800 hover:bg-rose-50 rounded text-[8px] font-bold flex items-center gap-1"
                              title={language === 'zh' ? '一键去除白底' : 'Clean white background'}
                            >
                              <Wand2 size={10} className="text-rose-600" /> {language === 'zh' ? '去白底' : 'Clean'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveSeal('customSecondaryStamp', 'showSecondaryStamp', e)}
                              className="px-1.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[8px] font-bold flex items-center gap-1"
                              title={language === 'zh' ? '移除副章' : 'Remove secondary stamp'}
                            >
                              <X size={10} /> {language === 'zh' ? '移除' : 'Remove'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-1">
                          <Stamp size={18} className="text-slate-400 mx-auto" />
                          <span className="text-[9px] font-bold text-slate-500 block">
                            {activeProforma.showSecondaryStamp === false ? (language === 'zh' ? '印章已隐藏' : 'Stamp Hidden') : (language === 'zh' ? '无副章' : 'No 2nd Stamp')}
                          </span>
                          <span className="text-[8px] text-slate-400 block">{language === 'zh' ? '点击上传自定义图片' : 'Click to upload custom'}</span>
                        </div>
                      )}
                      <input 
                        ref={customSecondaryStampRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCustomImageUpload('customSecondaryStamp', f);
                        }} 
                      />
                    </div>

                    {/* Quick helper links */}
                    <div className="flex items-center justify-between pt-2 text-[9px]">
                      <button
                        type="button"
                        onClick={(e) => handleSetSealPreset('customSecondaryStamp', DEFAULT_CONTRACT_STAMP_SVG, e)}
                        className="text-rose-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <RotateCcw size={9} /> {language === 'zh' ? '使用预设' : 'Use Preset'}
                      </button>
                      {activeProforma.showSecondaryStamp !== false ? (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSeal('customSecondaryStamp', 'showSecondaryStamp', e)}
                          className="text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          {language === 'zh' ? '隐藏/移除' : 'Hide / Remove'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('showSecondaryStamp', true)}
                          className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                        >
                          {language === 'zh' ? '显示印章' : 'Enable Stamp'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. Authorized Signature */}
                  <div className={`p-3 rounded-xl border transition-all ${
                    activeProforma.showSignature !== false && effectiveSignature
                      ? 'bg-emerald-50/30 border-emerald-200 shadow-2xs' 
                      : 'bg-slate-50/50 border-slate-200 opacity-80'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeProforma.showSignature !== false}
                          onChange={(e) => handleFieldChange('showSignature', e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-600 h-3.5 w-3.5"
                        />
                        <span className="text-[11px] font-bold text-slate-800">
                          {language === 'zh' ? '授权签字' : 'Authorized Signature'}
                        </span>
                      </label>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                        activeProforma.showSignature !== false && effectiveSignature 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-600'
                      }`}>
                        {activeProforma.showSignature !== false ? (language === 'zh' ? '已显示' : 'Shown') : (language === 'zh' ? '已隐藏' : 'Hidden')}
                      </span>
                    </div>

                    {/* Preview Box */}
                    <div 
                      onClick={() => customSignatureRef.current?.click()}
                      className="relative h-28 border border-dashed border-slate-300 hover:border-emerald-500 rounded-lg flex flex-col items-center justify-center p-2 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px] cursor-pointer group overflow-hidden bg-white/70"
                    >
                      {activeProforma.showSignature !== false && effectiveSignature ? (
                        <>
                          <img 
                            src={effectiveSignature} 
                            alt="Signature" 
                            className="max-h-16 max-w-full object-contain mix-blend-multiply drop-shadow-2xs group-hover:scale-105 transition-transform" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 p-1">
                            <button
                              type="button"
                              onClick={(e) => handleCleanCustomBg('customSignature', e)}
                              disabled={isProcessingTransparency === 'customSignature'}
                              className="px-1.5 py-1 bg-white text-slate-800 hover:bg-emerald-50 rounded text-[8px] font-bold flex items-center gap-1"
                              title={language === 'zh' ? '一键去除白底' : 'Clean white background'}
                            >
                              <Wand2 size={10} className="text-emerald-600" /> {language === 'zh' ? '去白底' : 'Clean'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveSeal('customSignature', 'showSignature', e)}
                              className="px-1.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[8px] font-bold flex items-center gap-1"
                              title={language === 'zh' ? '移除签名' : 'Remove signature'}
                            >
                              <X size={10} /> {language === 'zh' ? '移除' : 'Remove'}
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center space-y-1">
                          <PenTool size={18} className="text-slate-400 mx-auto" />
                          <span className="text-[9px] font-bold text-slate-500 block">
                            {activeProforma.showSignature === false ? (language === 'zh' ? '签字已隐藏' : 'Signature Hidden') : (language === 'zh' ? '无签字' : 'No Signature')}
                          </span>
                          <span className="text-[8px] text-slate-400 block">{language === 'zh' ? '点击上传自定义图片' : 'Click to upload custom'}</span>
                        </div>
                      )}
                      <input 
                        ref={customSignatureRef} 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleCustomImageUpload('customSignature', f);
                        }} 
                      />
                    </div>

                    {/* Quick helper links */}
                    <div className="flex items-center justify-between pt-2 text-[9px]">
                      <button
                        type="button"
                        onClick={(e) => handleSetSealPreset('customSignature', DEFAULT_SIGNATURE_SVG, e)}
                        className="text-emerald-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
                      >
                        <RotateCcw size={9} /> {language === 'zh' ? '使用预设' : 'Use Preset'}
                      </button>
                      {activeProforma.showSignature !== false ? (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSeal('customSignature', 'showSignature', e)}
                          className="text-red-500 hover:underline font-semibold cursor-pointer"
                        >
                          {language === 'zh' ? '隐藏/移除' : 'Hide / Remove'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleFieldChange('showSignature', true)}
                          className="text-emerald-600 hover:underline font-semibold cursor-pointer"
                        >
                          {language === 'zh' ? '显示签字' : 'Enable Signature'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Live A4 Visual Preview (lg:col-span-6) */}
            <div className={`lg:col-span-6 flex flex-col items-center w-full min-w-0 ${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="w-full flex items-center justify-between mb-2.5 px-1 print:hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <Eye size={12} className="text-[#1565C0]" /> Live A4 Export Sheet Preview (WYSIWYG)
                </span>

                {/* Zoom Controller */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs text-[11px] font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.max(50, z - 10))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="px-1.5 font-mono text-[10px] min-w-[38px] text-center">{previewZoom}%</span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.min(150, z + 10))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                    title="Zoom In"
                  >
                    +
                  </button>
                  {previewZoom !== 100 && (
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(100)}
                      className="px-1.5 py-0.5 text-[9px] text-[#1565C0] hover:bg-blue-50 rounded cursor-pointer ml-0.5 font-semibold"
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Realistic A4 Page Wrap Container matching Commercial Invoice */}
              <div className="w-full overflow-x-auto pb-6 flex justify-center bg-slate-100/50 p-2 sm:p-4 rounded-xl border border-slate-200/80">
                <div 
                  id="print-area"
                  style={{ 
                    boxSizing: 'border-box',
                    transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                    transformOrigin: 'top center',
                    marginBottom: previewZoom > 100 ? `${(previewZoom - 100) * 8}px` : undefined
                  }}
                  className="w-full max-w-[210mm] min-h-[297mm] bg-white border border-slate-200 shadow-xl rounded-none p-4 sm:p-8 md:p-[12mm] text-slate-800 flex flex-col justify-between font-sans relative shrink-0 aspect-[1/1.414] overflow-hidden transition-all duration-150 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none"
                >
                {/* Print Layout Header */}
                <div className="space-y-4 sm:space-y-5">
                  {/* Company info logo block */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-100 pb-4 sm:pb-5 gap-4 sm:gap-6">
                    <div className="space-y-1.5 max-w-full sm:max-w-[60%]">
                      {settings.logo ? (
                        <img src={settings.logo} alt="MILA" className="max-h-12 object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <span className="text-lg font-black text-[#1565C0]">{settings.name}</span>
                      )}
                      <div className="text-[9px] text-slate-500 leading-normal font-semibold">
                        <p>{settings.address}</p>
                        <p>{settings.country} • Phone: {settings.phone}</p>
                        {settings.email && <p>Email: {settings.email} • Web: {settings.website}</p>}
                        {settings.taxNumber && <p>Tax Code: {settings.taxNumber}</p>}
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <input
                        type="text"
                        value={activeProforma.title || 'PROFORMA INVOICE'}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className="text-left sm:text-right bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#1565C0] text-xl font-black text-[#1565C0] uppercase tracking-tight w-full outline-hidden"
                        title="Click to edit document title"
                        placeholder="PROFORMA INVOICE"
                      />
                      <div className="mt-2.5 grid grid-cols-2 gap-x-2.5 gap-y-1 text-[9px] text-slate-500 leading-normal font-semibold text-left justify-end">
                        <span className="font-bold text-slate-400 text-left sm:text-right">PI Number:</span>
                        <span className="font-bold text-slate-800">{activeProforma.proformaNumber}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Date:</span>
                        <span className="text-slate-800">{activeProforma.date}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Valid Until:</span>
                        <span className="text-slate-800">{activeProforma.validUntil}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Currency:</span>
                        <select
                          value={activeProforma.currency || 'USD'}
                          onChange={(e) => handleFieldChange('currency', e.target.value)}
                          className="text-slate-800 font-bold bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden cursor-pointer py-0 px-0 text-[9px]"
                          title="Click to switch currency"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="RMB">RMB (¥)</option>
                          <option value="CNY">CNY (¥)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="AUD">AUD (A$)</option>
                          <option value="CAD">CAD (C$)</option>
                          <option value="JPY">JPY (¥)</option>
                          <option value="EGP">EGP (E£)</option>
                          <option value="AED">AED (د.إ)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Consignee and Terms addresses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Proforma To (Buyer)</span>
                      <p className="text-xs font-black text-slate-800">{activeProforma.client?.company}</p>
                      <div className="text-[9px] text-slate-500 leading-normal font-semibold">
                        <p>Attn: {activeProforma.client?.contactPerson}</p>
                        <p>{activeProforma.client?.address}</p>
                        <p>{activeProforma.client?.country}</p>
                        {activeProforma.client?.phone && <p>Phone: {activeProforma.client.phone}</p>}
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-100 rounded-lg space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Shipment & Payment Terms</span>
                      <div className="text-[9px] text-slate-600 leading-normal font-semibold space-y-0.5">
                        <p><strong>Incoterm:</strong> <span className="font-bold text-slate-900">{activeProforma.incoterm}</span></p>
                        <p><strong>Loading Port:</strong> {activeProforma.portOfLoading}</p>
                        <p><strong>Destination:</strong> {activeProforma.portOfDestination}</p>
                        <p><strong>Lead Time:</strong> {activeProforma.estimatedLeadTime}</p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto w-full -mx-1 sm:mx-0">
                    <table className="w-full min-w-[500px] text-left border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-[#1565C0] text-white font-bold uppercase text-[8px] border-b border-[#1565C0]">
                          <th className="py-2 px-2 rounded-l">Item Description</th>
                          <th className="py-2 px-2 text-center">Size</th>
                          <th className="py-2 px-2 text-center">Box Volume</th>
                          <th className="py-2 px-2 text-right">Quantity (Pcs)</th>
                          <th className="py-2 px-2 text-right">Unit Price ({activeProforma.currency || 'USD'})</th>
                          <th className="py-2 px-2 text-right rounded-r">Total ({activeProforma.currency || 'USD'})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 leading-tight font-semibold text-slate-700">
                        {(!activeProforma.items || activeProforma.items.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400">
                              No product item entries mapped.
                            </td>
                          </tr>
                        ) : (
                          activeProforma.items.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50">
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  {item.image ? (
                                    <div className="w-8 h-8 rounded border border-slate-200 bg-white flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
                                      <img src={item.image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded border border-slate-100 bg-slate-50 flex items-center justify-center shrink-0">
                                      <PackageCheck size={12} className="text-slate-300" />
                                    </div>
                                  )}
                                  <div className="min-w-0">
                                    <p className="font-extrabold text-slate-800 leading-tight">{item.name}</p>
                                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[8px] text-slate-400 font-semibold mt-0.5">
                                      <span>SKU: {item.sku}</span>
                                      {item.material && <span>&bull; {item.material}</span>}
                                      {item.color && <span>&bull; {item.color}</span>}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center font-bold font-mono text-slate-800">{item.size || '-'}</td>
                              <td className="py-2 px-2 text-center">{item.numBoxes || Math.ceil((item.totalPieces || item.quantity) / (item.piecesPerBox || 1))} Box <span className="text-[8px] text-slate-400">({item.piecesPerBox} Pcs/Box)</span></td>
                              <td className="py-2 px-2 text-right font-bold">{(item.totalPieces || item.quantity)?.toLocaleString()}</td>
                              <td className="py-2 px-2 text-right font-mono">{formatUnitPrice(item.unitPrice, activeProforma.currency)}</td>
                              <td className="py-2 px-2 text-right font-bold text-slate-800">{getCurrencySymbol(activeProforma.currency)}{(item.totalPrice || 0).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals & Bank Section */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 pt-3 border-t border-slate-100">
                    <div className="col-span-1 md:col-span-7 space-y-3">
                      {/* Bank wire instructions (Fully Editable inline in Preview) */}
                      {activeProforma.showBankDetails !== false ? (
                        <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-[8px] text-slate-500 leading-normal font-semibold group relative">
                          <div className="flex items-center justify-between pb-0.5 border-b border-slate-200/60">
                            <input
                              type="text"
                              value={activeProforma.bankTitle || 'Beneficiary Wire Transfer Remittance Coordinates'}
                              onChange={(e) => handleFieldChange('bankTitle', e.target.value)}
                              className="font-black text-slate-400 uppercase tracking-widest block bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              title="Click to edit banking section title"
                            />
                            <button
                              type="button"
                              onClick={() => handleFieldChange('showBankDetails', false)}
                              className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                              title="Hide banking details from this invoice"
                            >
                              ✕ Remove
                            </button>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <span className="font-extrabold text-slate-700 shrink-0">Bank Name:</span>
                            <input
                              type="text"
                              value={activeProforma.bankName ?? settings.bankName ?? ''}
                              onChange={(e) => handleFieldChange('bankName', e.target.value)}
                              placeholder="Bank Name"
                              className="font-extrabold text-slate-700 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] flex-1"
                              title="Click to edit bank name"
                            />
                            <span className="text-slate-400 font-normal shrink-0">(</span>
                            <input
                              type="text"
                              value={activeProforma.branch ?? settings.branch ?? ''}
                              onChange={(e) => handleFieldChange('branch', e.target.value)}
                              placeholder="Branch"
                              className="font-semibold text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-28 text-center"
                              title="Click to edit bank branch"
                            />
                            <span className="text-slate-400 font-normal shrink-0">)</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="shrink-0 text-slate-500">Beneficiary:</span>
                            <input
                              type="text"
                              value={activeProforma.accountName ?? settings.accountName ?? ''}
                              onChange={(e) => handleFieldChange('accountName', e.target.value)}
                              placeholder="Beneficiary Account Name"
                              className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              title="Click to edit beneficiary name"
                            />
                          </div>

                          <div className="flex items-center gap-1">
                            <span className="shrink-0 text-slate-500">Account Number:</span>
                            <input
                              type="text"
                              value={activeProforma.accountNumber ?? settings.accountNumber ?? ''}
                              onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                              placeholder="Account Number"
                              className="font-mono font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              title="Click to edit account number"
                            />
                          </div>

                          {(activeProforma.iban !== undefined ? activeProforma.iban : settings.iban) ? (
                            <div className="flex items-center gap-1">
                              <span className="font-mono shrink-0 text-slate-500">IBAN:</span>
                              <input
                                type="text"
                                value={activeProforma.iban ?? settings.iban ?? ''}
                                onChange={(e) => handleFieldChange('iban', e.target.value)}
                                placeholder="IBAN (Optional)"
                                className="font-mono font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                title="Click to edit IBAN"
                              />
                            </div>
                          ) : null}

                          <div className="flex items-center gap-1">
                            <span className="font-mono shrink-0 text-slate-500">SWIFT Code:</span>
                            <input
                              type="text"
                              value={activeProforma.swift ?? settings.swift ?? ''}
                              onChange={(e) => handleFieldChange('swift', e.target.value)}
                              placeholder="SWIFT Code"
                              className="font-mono font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              title="Click to edit SWIFT code"
                            />
                          </div>

                          {activeProforma.bankRemarks && (
                            <div className="flex items-center gap-1 pt-0.5 border-t border-slate-100">
                              <span className="shrink-0 text-slate-400 italic">Note:</span>
                              <input
                                type="text"
                                value={activeProforma.bankRemarks}
                                onChange={(e) => handleFieldChange('bankRemarks', e.target.value)}
                                placeholder="Additional wire memo instructions..."
                                className="italic text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="print:hidden">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('showBankDetails', true)}
                            className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                          >
                            + Add Wire Transfer Remittance Coordinates (Optional)
                          </button>
                        </div>
                      )}

                      {/* Commercial Notes (Optional & Modifiable) */}
                      {activeProforma.showNotes !== false ? (
                        <div className={`text-[8px] text-slate-600 leading-relaxed group relative ${!activeProforma.notes ? 'print:hidden' : ''}`}>
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={activeProforma.notesTitle || 'COMMERCIAL NOTES'}
                              onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                              className="font-bold uppercase not-italic block text-slate-400 hover:text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              title="Click to edit section title"
                            />
                            <button
                              type="button"
                              onClick={() => handleFieldChange('showNotes', false)}
                              className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                              title="Hide commercial notes from this invoice"
                            >
                              ✕ Remove
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={activeProforma.notes || ''}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            placeholder="[ Click to add / modify commercial notes (optional)... ]"
                            className="w-full bg-transparent border border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] rounded p-0.5 text-[8px] text-slate-600 leading-relaxed italic resize-none outline-hidden print:border-none print:p-0"
                            title="Click to modify notes directly"
                          />
                        </div>
                      ) : (
                        <div className="print:hidden">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('showNotes', true)}
                            className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                          >
                            + Add Commercial Notes (Optional)
                          </button>
                        </div>
                      )}

                      {/* Payment & Production Terms (Optional & Modifiable) */}
                      {activeProforma.showTerms !== false ? (
                        <div className={`text-[8px] text-slate-600 leading-relaxed group relative ${!activeProforma.terms ? 'print:hidden' : ''}`}>
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={activeProforma.termsTitle || 'PAYMENT & PRODUCTION TERMS'}
                              onChange={(e) => handleFieldChange('termsTitle', e.target.value)}
                              className="font-bold uppercase not-italic block text-slate-400 hover:text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              title="Click to edit section title"
                            />
                            <button
                              type="button"
                              onClick={() => handleFieldChange('showTerms', false)}
                              className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                              title="Hide payment terms from this invoice"
                            >
                              ✕ Remove
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={activeProforma.terms || ''}
                            onChange={(e) => handleFieldChange('terms', e.target.value)}
                            placeholder="[ Click to add / modify payment & production terms (optional)... ]"
                            className="w-full bg-transparent border border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] rounded p-0.5 text-[8px] text-slate-600 leading-relaxed italic resize-none outline-hidden print:border-none print:p-0"
                            title="Click to modify terms directly"
                          />
                        </div>
                      ) : (
                        <div className="print:hidden">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('showTerms', true)}
                            className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                          >
                            + Add Payment & Production Terms (Optional)
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="col-span-1 md:col-span-5 text-[9px] space-y-1.5 text-slate-500 font-semibold text-right max-w-full">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 leading-normal">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="text-slate-800 font-bold">{activeProforma.currency} {(activeProforma.subtotal || 0).toFixed(2)}</span>
                        
                        {Number(activeProforma.shippingFee) > 0 && (
                          <>
                            <span className="text-slate-400">Freight Charge:</span>
                            <span className="text-slate-800 font-bold">+ {activeProforma.currency} {Number(activeProforma.shippingFee).toFixed(2)}</span>
                          </>
                        )}

                        {Number(activeProforma.insurance) > 0 && (
                          <>
                            <span className="text-slate-400">Marine Insurance:</span>
                            <span className="text-slate-800 font-bold">+ {activeProforma.currency} {Number(activeProforma.insurance).toFixed(2)}</span>
                          </>
                        )}

                        {Number(activeProforma.packagingFee) > 0 && (
                          <>
                            <span className="text-slate-400">Packaging Fee:</span>
                            <span className="text-slate-800 font-bold">+ {activeProforma.currency} {Number(activeProforma.packagingFee).toFixed(2)}</span>
                          </>
                        )}

                        <div className="col-span-2 border-t border-slate-200 my-0.5"></div>

                        <span className="text-xs text-[#1565C0] font-black uppercase">GRAND TOTAL:</span>
                        <span className="text-xs text-[#1565C0] font-black">{activeProforma.currency} {(activeProforma.grandTotal || 0).toFixed(2)}</span>
                      </div>

                      {/* Advance deposit callout */}
                      <div className="p-2 bg-blue-50/80 border border-blue-200 rounded text-left space-y-1 mt-2">
                        <div className="flex justify-between items-center text-blue-900 font-extrabold text-[9px]">
                          <span>{activeProforma.depositPercentage}% Advance Deposit:</span>
                          <span>{activeProforma.currency} {(activeProforma.depositAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600 text-[8px]">
                          <span>Balance before loading:</span>
                          <span>{activeProforma.currency} {(activeProforma.balanceAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print Layout Footer */}
                <div className="border-t border-slate-100 pt-5 flex items-end justify-between text-[8px] text-slate-400 font-semibold mt-6 shrink-0">
                  <div className="text-[7.5px] text-slate-400 space-y-0.5 max-w-[50%]">
                    <p>Please sign and stamp this Proforma Invoice to confirm order production.</p>
                    <p className="text-[7px] text-slate-300">Generated via MILA Packaging Export Suite</p>
                  </div>

                  {/* Stamp & Signature Overlay */}
                  <div className="flex gap-4 items-center shrink-0 relative h-16 min-w-[240px] justify-end">
                    {effectiveSecondaryStamp && (
                      <div className="absolute right-24 bottom-0 w-16 h-16 pointer-events-none opacity-90 mix-blend-multiply transition-all">
                        <TransparentSignature src={effectiveSecondaryStamp} alt="Secondary Stamp" className="w-full h-full object-contain" />
                      </div>
                    )}
                    {effectivePrimaryStamp && (
                      <div className="absolute right-12 bottom-0 w-16 h-16 pointer-events-none opacity-90 mix-blend-multiply transition-all">
                        <TransparentSignature src={effectivePrimaryStamp} alt="Factory Stamp" className="w-full h-full object-contain" />
                      </div>
                    )}
                    {effectiveSignature ? (
                      <div className="relative z-10 w-28 h-12 pointer-events-none text-right flex flex-col justify-end">
                        <p className="text-[7px] text-slate-400 uppercase tracking-widest text-center mb-0.5">Authorized Signature</p>
                        <TransparentSignature src={effectiveSignature} alt="Authorized Signature" className="max-w-full max-h-10 object-contain mx-auto" />
                      </div>
                    ) : (
                      <div className="relative z-10 w-28 h-12 pointer-events-none text-right flex flex-col justify-end border-b border-dashed border-slate-300 pb-1">
                        <p className="text-[7px] text-slate-400 uppercase tracking-widest text-center">Authorized Signature</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>
      ) : (
        /* Saved List View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search proforma number or client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Total Documents: <strong>{filteredList.length}</strong>
            </span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {filteredList.map((pi) => (
              <div 
                key={pi.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4 cursor-pointer group"
                onClick={() => {
                  setActiveProforma(pi);
                  setIsEditing(true);
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565C0] flex items-center justify-center font-bold text-xs shrink-0">
                    PI
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900 group-hover:text-[#1565C0] transition-colors">{pi.proformaNumber}</h3>
                    <p className="text-[11px] text-slate-500">{pi.client?.company} • Date: {pi.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">${(pi.grandTotal || 0).toFixed(2)}</span>
                    <span className="text-[10px] text-blue-600 font-bold block">Dep: ${(pi.depositAmount || 0).toFixed(2)}</span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setActiveProforma(pi);
                        setIsEditing(true);
                      }}
                      className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                      title="Edit Document"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDuplicateProforma(pi, e)}
                      className="p-2 hover:bg-blue-50 rounded-lg text-slate-500 hover:text-[#1565C0] transition-colors"
                      title="Duplicate Proforma Invoice"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteProforma(pi.id, e)}
                      className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                      title="Delete Proforma"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <ChevronRight size={18} className="text-slate-400" />
                </div>
              </div>
            ))}

            {filteredList.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                No proforma invoices found. Click "New Proforma Invoice" above to create one.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Select Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full flex flex-col max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-[#1565C0]" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                  {language === 'zh' ? '选择客户档案' : 'Select Client Directory'}
                </span>
              </div>
              <button onClick={() => { setShowClientModal(false); setShowInlineClientForm(false); }} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder={language === 'zh' ? '搜索客户公司或联系人...' : 'Search client company or contact...'}
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {!showInlineClientForm ? (
                <button
                  onClick={() => setShowInlineClientForm(true)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> {language === 'zh' ? '添加新客户至数据库' : 'Add New Client to Database'}
                </button>
              ) : (
                <form onSubmit={handleInlineClientSubmit} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex justify-between items-center pb-1 border-b">
                    <span className="text-xs font-bold text-slate-800">
                      {language === 'zh' ? '新客户详细信息' : 'New Client Details'}
                    </span>
                    <button type="button" onClick={() => setShowInlineClientForm(false)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={language === 'zh' ? '公司名称 *' : 'Company Name *'}
                      required
                      value={inlineClient.company || ''}
                      onChange={(e) => setInlineClient({ ...inlineClient, company: e.target.value })}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder={language === 'zh' ? '联系人 *' : 'Contact Person *'}
                      required
                      value={inlineClient.contactPerson || ''}
                      onChange={(e) => setInlineClient({ ...inlineClient, contactPerson: e.target.value })}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder={language === 'zh' ? '国家 / 地区' : 'Country'}
                      value={inlineClient.country || ''}
                      onChange={(e) => setInlineClient({ ...inlineClient, country: e.target.value })}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder={language === 'zh' ? '联系电话' : 'Phone'}
                      value={inlineClient.phone || ''}
                      onChange={(e) => setInlineClient({ ...inlineClient, phone: e.target.value })}
                      className="px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={language === 'zh' ? '详细英文地址' : 'Full Address'}
                    value={inlineClient.address || ''}
                    onChange={(e) => setInlineClient({ ...inlineClient, address: e.target.value })}
                    className="w-full px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg"
                  />
                  <button
                    type="submit"
                    className="w-full py-1.5 bg-[#1565C0] text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700 cursor-pointer"
                  >
                    {language === 'zh' ? '保存并选用客户' : 'Save & Assign Client'}
                  </button>
                </form>
              )}
            </div>

            <div className="p-4 divide-y divide-slate-100 overflow-y-auto max-h-60 space-y-1">
              {filteredClients.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  {language === 'zh' ? '未找到匹配的客户。' : 'No matching clients found.'}
                </p>
              ) : (
                filteredClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className="w-full text-left py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group cursor-pointer px-2 rounded-lg"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#1565C0]">{c.company}</p>
                      <p className="text-[10px] text-slate-500">{c.country} • {c.contactPerson}</p>
                    </div>
                    <Check size={16} className="text-[#1565C0] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select / Create Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full flex flex-col max-h-[85vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <PackageCheck size={18} className="text-[#1565C0]" />
                <span className="font-extrabold text-xs uppercase tracking-wider text-slate-800">
                  {showInlineProductForm 
                    ? (language === 'zh' ? '新建并添加产品' : 'Create & Add New Product') 
                    : (language === 'zh' ? '选择产品库商品' : 'Select Product Catalog Item')}
                </span>
              </div>
              <button 
                onClick={() => { setShowProductModal(false); setShowInlineProductForm(false); }} 
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Subheader / Toggle Mode */}
            <div className="p-4 border-b border-slate-100 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="text"
                    placeholder={language === 'zh' ? '搜索产品名称、SKU货号或规格...' : 'Search product name, SKU, or size...'}
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      if (showInlineProductForm) setShowInlineProductForm(false);
                    }}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setShowInlineProductForm(!showInlineProductForm)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                    showInlineProductForm 
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' 
                      : 'bg-[#1565C0] text-white hover:bg-blue-700 shadow-xs'
                  }`}
                >
                  {showInlineProductForm ? (
                    <>{language === 'zh' ? '返回列表' : 'Back to List'}</>
                  ) : (
                    <><Plus size={14} /> {language === 'zh' ? '新建产品' : 'New Product'}</>
                  )}
                </button>
              </div>

              {/* Inline Product Creator Form */}
              {showInlineProductForm && (
                <form onSubmit={handleInlineProductSubmit} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                    <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      {language === 'zh' ? '填写产品信息与图片' : 'Add Product Info & Image'}
                    </span>
                    <button type="button" onClick={() => setShowInlineProductForm(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Photo Upload Row for New Product */}
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center shrink-0 overflow-hidden relative group">
                      {inlineProduct.image ? (
                        <img src={inlineProduct.image} alt="" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
                      ) : (
                        <Camera size={20} className="text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-bold text-slate-600 block">
                        {language === 'zh' ? '产品图片' : 'Product Photo'}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <label className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1565C0] rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1">
                          <Upload size={12} /> {language === 'zh' ? '选择图片文件' : 'Choose Image File'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const compressed = await compressImageFile(file, 600, 600, 0.75);
                                  setInlineProduct({ ...inlineProduct, image: compressed });
                                } catch {
                                  const reader = new FileReader();
                                  reader.onloadend = () => setInlineProduct({ ...inlineProduct, image: reader.result as string });
                                  reader.readAsDataURL(file);
                                }
                              }
                            }}
                          />
                        </label>
                        {inlineProduct.image && (
                          <button
                            type="button"
                            onClick={() => setInlineProduct({ ...inlineProduct, image: undefined })}
                            className="text-red-500 hover:text-red-700 text-[10px] font-bold cursor-pointer"
                          >
                            {language === 'zh' ? '移除' : 'Remove'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                        {language === 'zh' ? '产品名称 *' : 'Product Name *'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 24/410 Fine Mist Sprayer"
                        required
                        value={inlineProduct.name || ''}
                        onChange={(e) => setInlineProduct({ ...inlineProduct, name: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                        {language === 'zh' ? 'SKU 货号' : 'SKU / Model Number'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. FMS-24410"
                        value={inlineProduct.sku || ''}
                        onChange={(e) => setInlineProduct({ ...inlineProduct, sku: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                        {language === 'zh' ? '口径 / 规格' : 'Neck Size / Spec'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 24/410, 50ml"
                        value={inlineProduct.size || ''}
                        onChange={(e) => setInlineProduct({ ...inlineProduct, size: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                        {language === 'zh' ? '单价' : 'Unit Price'} ({activeProforma.currency || 'USD'})
                      </label>
                      <input
                        type="number"
                        step="0.001"
                        placeholder="0.50"
                        value={inlineProduct.price || 0.50}
                        onChange={(e) => setInlineProduct({ ...inlineProduct, price: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-bold text-blue-700"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                        {language === 'zh' ? '装箱数 (Pcs/箱)' : 'Pcs / Carton Box'}
                      </label>
                      <input
                        type="number"
                        placeholder="500"
                        value={inlineProduct.piecesPerBox || 500}
                        onChange={(e) => setInlineProduct({ ...inlineProduct, piecesPerBox: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-500 block mb-0.5">
                        {language === 'zh' ? '材质与颜色' : 'Material & Color'}
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. PP / White"
                        value={inlineProduct.material || ''}
                        onChange={(e) => setInlineProduct({ ...inlineProduct, material: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#1565C0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} />
                    {language === 'zh' ? '保存至库并添加到发票' : 'Save to Catalog & Add to Invoice'}
                  </button>
                </form>
              )}
            </div>

            {/* Products List */}
            {!showInlineProductForm && (
              <div className="p-4 divide-y divide-slate-100 overflow-y-auto space-y-1">
                {filteredProducts.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <p className="text-xs text-slate-400">
                      {language === 'zh' ? '产品库中未找到匹配产品。' : 'No matching products found in library.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowInlineProductForm(true)}
                      className="px-3 py-1.5 bg-blue-50 text-[#1565C0] rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
                    >
                      <Plus size={13} /> {language === 'zh' ? '立即创建此产品' : 'Create this product now'}
                    </button>
                  </div>
                ) : (
                  filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProduct(p)}
                      className="w-full text-left py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors group cursor-pointer px-2 rounded-xl"
                    >
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 overflow-hidden group-hover:border-[#1565C0] transition-colors p-1">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <PackageCheck size={20} className="text-slate-300 group-hover:text-[#1565C0] transition-colors" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#1565C0] truncate">{p.name}</p>
                          <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">{p.sku || 'No SKU'}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          <strong className="text-blue-700 font-bold">{formatUnitPrice(p.price, activeProforma.currency)}</strong>
                          {' '}&bull; {p.size ? `Size: ${p.size}` : ''}
                          {' '}&bull; {p.piecesPerBox ? `${p.piecesPerBox} pcs/box` : ''}
                          {p.material ? ` • ${p.material}` : ''}
                        </p>
                      </div>
                      <Check size={16} className="text-[#1565C0] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reusable Product Image Modal with Vector Presets, Upload, URL & Paste support */}
      <ProductImageModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setImageModalItemIndex(null);
        }}
        currentImage={imageModalCurrentImg}
        productName={imageModalTitle}
        onSaveImage={handleSaveItemImage}
      />
    </div>
  );
}
