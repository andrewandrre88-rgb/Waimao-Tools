import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Quotation, QuotationItem, Client, Product, CompanySettings, ProformaInvoice, Contract, ProformaInvoiceItem, ContractItem, getCurrencySymbol, formatUnitPrice, SUPPORTED_CURRENCIES } from '../types';
import { generateId, getNextDocumentNumber } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
import { compressImageFile } from '../utils/imageCompressor';
import { TransparentSignature } from './TransparentSignature';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { 
  FileSpreadsheet, 
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
  ArrowRightLeft,
  FileCheck,
  Clock,
  ShieldCheck,
  Tag,
  Boxes
} from 'lucide-react';

interface QuotationGeneratorProps {
  quotations: Quotation[];
  onSaveQuotations: (quotations: Quotation[]) => void;
  products: Product[];
  clients: Client[];
  onSaveClients: (clients: Client[]) => void;
  settings: CompanySettings;
  proformaInvoices?: ProformaInvoice[];
  onSaveProformaInvoices?: (proformas: ProformaInvoice[]) => void;
  contracts?: Contract[];
  onSaveContracts?: (contracts: Contract[]) => void;
  onNavigateToTab?: (tab: 'proforma' | 'contract') => void;
  searchTarget?: { id: string; type: string } | null;
  clearSearchTarget?: () => void;
  activeDocId?: string | null;
  clearActiveDoc?: () => void;
}

export default function QuotationGenerator({ 
  quotations, 
  onSaveQuotations, 
  products, 
  clients, 
  onSaveClients, 
  settings,
  proformaInvoices = [],
  onSaveProformaInvoices,
  contracts = [],
  onSaveContracts,
  onNavigateToTab,
  searchTarget,
  clearSearchTarget,
  activeDocId,
  clearActiveDoc
}: QuotationGeneratorProps) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeQuotation, setActiveQuotation] = useState<Partial<Quotation> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges, requestActionWithGuard } = useNavigationGuard();

  useEffect(() => {
    if (isEditing && activeQuotation) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activeQuotation.quotationNumber ? `Price Quotation: ${activeQuotation.quotationNumber}` : 'Price Quotation Draft',
        docType: 'Price Quotation',
        onSave: () => {
          handleSaveDocument();
        },
        onDiscard: () => {
          setIsEditing(false);
          setActiveQuotation(null);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [isEditing, activeQuotation, quotations]);

  // Modals & Search state
  const [showProductModal, setShowProductModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
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

  // Handle deep linking or active document selection
  useEffect(() => {
    if (activeDocId) {
      if (activeDocId === 'new') {
        handleCreateNew();
      } else {
        const found = (quotations || []).find(q => q.id === activeDocId);
        if (found) {
          setActiveQuotation(found);
          setIsEditing(true);
        }
      }
      if (clearActiveDoc) clearActiveDoc();
    }
  }, [activeDocId, quotations]);

  useEffect(() => {
    if (searchTarget && searchTarget.type === 'quotation') {
      const found = (quotations || []).find(q => q.id === searchTarget.id);
      if (found) {
        setActiveQuotation(found);
        setIsEditing(true);
      }
      if (clearSearchTarget) clearSearchTarget();
    }
  }, [searchTarget, quotations]);

  // Calculation helper
  const calculateTotals = (
    items: QuotationItem[], 
    shipFee: number = 0, 
    pkgFee: number = 0,
    discAmount: number = 0
  ) => {
    const subtotal = items.reduce((acc, item) => acc + (Number(item.totalPrice) || 0), 0);
    const grandTotal = Math.max(0, subtotal + Number(shipFee || 0) + Number(pkgFee || 0) - Number(discAmount || 0));
    
    // Aggregates
    const totalCartons = items.reduce((acc, item) => acc + (Number(item.numBoxes) || 0), 0);
    const totalCbm = items.reduce((acc, item) => acc + (Number(item.cbm) || 0), 0);
    const totalWeight = items.reduce((acc, item) => acc + (Number(item.grossWeight) || 0), 0);

    return {
      subtotal: Number(subtotal.toFixed(2)),
      grandTotal: Number(grandTotal.toFixed(2)),
      totalCartons,
      totalCbm: Number(totalCbm.toFixed(2)),
      totalWeight: Number(totalWeight.toFixed(1))
    };
  };

  const handleFieldChange = (field: keyof Quotation, value: any) => {
    if (!activeQuotation) return;
    const nextQt = { ...activeQuotation, [field]: value };
    const items = nextQt.items || [];
    const ship = Number(nextQt.shippingFee || 0);
    const pkg = Number(nextQt.packagingFee || 0);
    const disc = Number(nextQt.discountAmount || 0);

    const calcs = calculateTotals(items, ship, pkg, disc);

    setActiveQuotation({
      ...nextQt,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      totalCartons: calcs.totalCartons,
      totalCbm: calcs.totalCbm,
      totalWeight: calcs.totalWeight
    });
  };

  // Create new Quotation
  const handleCreateNew = () => {
    const newNum = getNextDocumentNumber('quotation', quotations || []);
    const today = new Date().toISOString().split('T')[0];
    
    // Default valid 30 days
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);
    const validUntilStr = validDate.toISOString().split('T')[0];

    const defaultClient = clients[0] || {
      id: generateId(),
      company: 'Global Beauty Innovations LLC',
      contactPerson: 'David Miller',
      address: '742 Evergreen Terrace, Suite 400',
      phone: '+1 (555) 234-5678',
      email: 'd.miller@globalbeauty.com',
      country: 'United States',
      notes: 'Key buyer for sprayer packaging'
    };

    // Default item using first product if available
    const firstP = products[0];
    const initialItems: QuotationItem[] = firstP ? [
      {
        id: generateId(),
        productId: firstP.id,
        name: firstP.name,
        sku: firstP.sku,
        size: firstP.size || '',
        material: firstP.material || 'PP Plastic',
        color: firstP.color || 'Custom / White',
        unitPrice: firstP.price,
        moq: firstP.moq || 10000,
        quantity: (firstP.moq || 10000) * 2,
        piecesPerBox: firstP.piecesPerBox || 500,
        numBoxes: Math.ceil(((firstP.moq || 10000) * 2) / (firstP.piecesPerBox || 500)),
        totalPieces: (firstP.moq || 10000) * 2,
        totalPrice: Number((((firstP.moq || 10000) * 2) * firstP.price).toFixed(2)),
        leadTime: '15 days',
        cbm: Number((Math.ceil(((firstP.moq || 10000) * 2) / (firstP.piecesPerBox || 500)) * (firstP.cartonLength * firstP.cartonWidth * firstP.cartonHeight) / 1000000).toFixed(2)),
        grossWeight: Number((Math.ceil(((firstP.moq || 10000) * 2) / (firstP.piecesPerBox || 500)) * firstP.grossWeight).toFixed(1)),
        image: firstP.image
      }
    ] : [
      {
        id: generateId(),
        name: '28/410 Plastic Trigger Sprayer (MTS-01)',
        sku: 'MTS-28410-A',
        size: '28/410',
        material: 'PP & SUS304 Spring',
        color: 'White / Black',
        unitPrice: 0.0495,
        moq: 10000,
        quantity: 20000,
        piecesPerBox: 500,
        numBoxes: 40,
        totalPieces: 20000,
        totalPrice: 990.00,
        leadTime: '15 days',
        cbm: 3.64,
        grossWeight: 528.0
      }
    ];

    const calcs = calculateTotals(initialItems, 0, 0, 0);

    const newQuotation: Quotation = {
      id: generateId(),
      quotationNumber: newNum,
      date: today,
      validUntil: validUntilStr,
      currency: settings.defaultCurrency || 'USD',
      salesperson: 'Andrew Manager',
      client: defaultClient,
      incoterm: 'FOB',
      portOfLoading: 'Ningbo Port, China',
      portOfDestination: defaultClient.country ? `Main Port, ${defaultClient.country}` : 'Destination Port',
      paymentTerms: '30% T/T deposit upon order, 70% balance before shipment',
      estimatedLeadTime: '15-20 days after sample & deposit approval',
      items: initialItems,
      shippingFee: 0,
      packagingFee: 0,
      discountAmount: 0,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      totalCartons: calcs.totalCartons,
      totalCbm: calcs.totalCbm,
      totalWeight: calcs.totalWeight,
      notes: '1. Prices are valid for 30 days due to raw material plastic resin price index changes.\n2. Standard export 5-ply corrugated carton packaging included.\n3. Custom color matching (PMS) and customized dip tube lengths supported.',
      terms: 'FOB Ningbo / Shanghai Port. Payment via Telegraphic Transfer (T/T). Samples are provided free of charge with freight collect.',
      showStamp: true,
      createdAt: new Date().toISOString()
    };

    setActiveQuotation(newQuotation);
    setIsEditing(true);
  };

  // Inline Client save
  const handleSaveInlineClient = () => {
    if (!inlineClient.company) {
      alert("Company Name is required");
      return;
    }
    const newC: Client = {
      id: generateId(),
      company: inlineClient.company || '',
      contactPerson: inlineClient.contactPerson || '',
      address: inlineClient.address || '',
      phone: inlineClient.phone || '',
      email: inlineClient.email || '',
      country: inlineClient.country || 'International',
      notes: 'Added from Price Quotation Generator'
    };

    const updated = [newC, ...clients];
    onSaveClients(updated);

    if (activeQuotation) {
      setActiveQuotation({
        ...activeQuotation,
        client: newC
      });
    }

    setShowInlineClientForm(false);
    setShowClientModal(false);
    setInlineClient({ company: '', contactPerson: '', country: '', address: '', phone: '', email: '' });
  };

  // Select product from library modal
  const handleSelectProduct = (p: Product) => {
    if (!activeQuotation) return;
    const currentItems = [...(activeQuotation.items || [])];

    const piecesPerBox = p.piecesPerBox || 500;
    const initialQty = (p.moq || 10000) > 0 ? p.moq : piecesPerBox * 2;
    const numBoxes = Math.ceil(initialQty / piecesPerBox);
    const totPcs = numBoxes * piecesPerBox;

    const volPerCtn = (p.cartonLength * p.cartonWidth * p.cartonHeight) / 1000000;
    const itemCbm = Number((numBoxes * volPerCtn).toFixed(2));
    const itemWeight = Number((numBoxes * p.grossWeight).toFixed(1));

    const newItem: QuotationItem = {
      id: generateId(),
      productId: p.id,
      name: p.name,
      sku: p.sku,
      size: p.size || '',
      material: p.material || 'PP',
      color: p.color || 'Standard / Custom',
      unitPrice: p.price,
      moq: p.moq || 10000,
      quantity: totPcs,
      piecesPerBox: piecesPerBox,
      numBoxes: numBoxes,
      totalPieces: totPcs,
      totalPrice: Number((totPcs * p.price).toFixed(2)),
      leadTime: '15 days',
      cbm: itemCbm,
      grossWeight: itemWeight,
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
      Number(activeQuotation.shippingFee || 0), 
      Number(activeQuotation.packagingFee || 0),
      Number(activeQuotation.discountAmount || 0)
    );

    setActiveQuotation({
      ...activeQuotation,
      items: currentItems,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      totalCartons: calcs.totalCartons,
      totalCbm: calcs.totalCbm,
      totalWeight: calcs.totalWeight
    });

    setShowProductModal(false);
  };

  // Add custom manual item
  const handleAddManualItem = () => {
    if (!activeQuotation) return;
    const currentItems = [...(activeQuotation.items || [])];
    const newItem: QuotationItem = {
      id: generateId(),
      name: 'Custom Molded Cosmetic Container',
      sku: 'CUSTOM-01',
      size: '28/410',
      material: 'PET / PP',
      color: 'Custom PMS Color',
      unitPrice: 0.150,
      moq: 10000,
      quantity: 10000,
      piecesPerBox: 500,
      numBoxes: 20,
      totalPieces: 10000,
      totalPrice: 1500.00,
      leadTime: '18 days',
      cbm: 1.80,
      grossWeight: 260.0
    };
    currentItems.push(newItem);

    const calcs = calculateTotals(
      currentItems, 
      Number(activeQuotation.shippingFee || 0), 
      Number(activeQuotation.packagingFee || 0),
      Number(activeQuotation.discountAmount || 0)
    );

    setActiveQuotation({
      ...activeQuotation,
      items: currentItems,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      totalCartons: calcs.totalCartons,
      totalCbm: calcs.totalCbm,
      totalWeight: calcs.totalWeight
    });
  };

  // Line item row change
  const handleItemRowChange = (index: number, field: keyof QuotationItem, value: any) => {
    if (!activeQuotation || !activeQuotation.items) return;
    const items = [...activeQuotation.items];
    const item = { ...items[index], [field]: value };

    if (field === 'numBoxes' || field === 'piecesPerBox' || field === 'unitPrice' || field === 'quantity' || field === 'totalPieces') {
      const ppb = Math.max(1, Number(item.piecesPerBox) || 1);
      
      if (field === 'numBoxes') {
        const boxes = Math.max(1, Number(value) || 1);
        item.numBoxes = boxes;
        item.totalPieces = boxes * ppb;
        item.quantity = item.totalPieces;
      } else if (field === 'quantity' || field === 'totalPieces') {
        const qty = Math.max(1, Number(value) || 1);
        item.quantity = qty;
        item.totalPieces = qty;
        item.numBoxes = Math.ceil(qty / ppb);
      } else if (field === 'piecesPerBox') {
        item.piecesPerBox = ppb;
        item.totalPieces = (item.numBoxes || 1) * ppb;
        item.quantity = item.totalPieces;
      }

      const price = Number(item.unitPrice) || 0;
      item.totalPrice = Number((item.totalPieces * price).toFixed(2));
    }

    items[index] = item;

    const calcs = calculateTotals(
      items, 
      Number(activeQuotation.shippingFee || 0), 
      Number(activeQuotation.packagingFee || 0),
      Number(activeQuotation.discountAmount || 0)
    );

    setActiveQuotation({
      ...activeQuotation,
      items,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      totalCartons: calcs.totalCartons,
      totalCbm: calcs.totalCbm,
      totalWeight: calcs.totalWeight
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!activeQuotation || !activeQuotation.items) return;
    const items = activeQuotation.items.filter((_, i) => i !== index);
    const calcs = calculateTotals(
      items, 
      Number(activeQuotation.shippingFee || 0), 
      Number(activeQuotation.packagingFee || 0),
      Number(activeQuotation.discountAmount || 0)
    );

    setActiveQuotation({
      ...activeQuotation,
      items,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      totalCartons: calcs.totalCartons,
      totalCbm: calcs.totalCbm,
      totalWeight: calcs.totalWeight
    });
  };

  const handleDuplicateItem = (index: number) => {
    if (!activeQuotation || !activeQuotation.items) return;
    const itemToClone = activeQuotation.items[index];
    if (!itemToClone) return;

    const clonedItem: QuotationItem = {
      ...itemToClone,
      id: generateId()
    };

    const items = [...activeQuotation.items];
    items.splice(index + 1, 0, clonedItem);

    const calcs = calculateTotals(
      items, 
      Number(activeQuotation.shippingFee || 0), 
      Number(activeQuotation.packagingFee || 0),
      Number(activeQuotation.discountAmount || 0)
    );

    setActiveQuotation({
      ...activeQuotation,
      items,
      subtotal: calcs.subtotal,
      grandTotal: calcs.grandTotal,
      totalCartons: calcs.totalCartons,
      totalCbm: calcs.totalCbm,
      totalWeight: calcs.totalWeight
    });
  };

  // Save document
  const handleSaveDocument = () => {
    if (!activeQuotation || !activeQuotation.quotationNumber) {
      alert("Quotation Number is required");
      return;
    }

    const list = quotations || [];
    const docToSave = {
      ...activeQuotation,
      id: activeQuotation.id || generateId(),
      createdAt: activeQuotation.createdAt || new Date().toISOString()
    } as Quotation;

    const index = list.findIndex(q => q.id === docToSave.id);

    if (index >= 0) {
      const updated = [...list];
      updated[index] = docToSave;
      onSaveQuotations(updated);
    } else {
      onSaveQuotations([docToSave, ...list]);
    }

    setActionNotice(`Price Quotation ${docToSave.quotationNumber} saved successfully!`);
    setTimeout(() => setActionNotice(null), 4000);

    setIsEditing(false);
    setActiveQuotation(null);
  };

  const handleDeleteQuotation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = window.confirm("Are you sure you want to delete this Price Quotation?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const updated = quotations.filter(q => q.id !== id);
      onSaveQuotations(updated);
    }
  };

  const handleDuplicateQuotation = (q: Quotation, e: React.MouseEvent) => {
    e.stopPropagation();
    const newNum = getNextDocumentNumber('quotation', quotations || []);
    const dup: Quotation = {
      ...q,
      id: generateId(),
      quotationNumber: newNum,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    onSaveQuotations([dup, ...quotations]);
    setActionNotice(`Duplicated to new Quotation ${newNum}`);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // CONVERT TO PROFORMA INVOICE
  const handleConvertToProforma = (q: Quotation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onSaveProformaInvoices) {
      alert("Proforma Invoice module is initializing.");
      return;
    }

    const piNum = getNextDocumentNumber('proforma', proformaInvoices || []);
    const today = new Date().toISOString().split('T')[0];
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 30);

    const piItems: ProformaInvoiceItem[] = (q.items || []).map(i => ({
      id: generateId(),
      productId: i.productId,
      name: i.name,
      sku: i.sku,
      size: i.size || '',
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      piecesPerBox: i.piecesPerBox,
      numBoxes: i.numBoxes,
      totalPieces: i.totalPieces,
      totalPrice: i.totalPrice,
      image: i.image
    }));

    const depPercent = 30;
    const depositAmount = Number(((q.grandTotal * depPercent) / 100).toFixed(2));
    const balanceAmount = Number((q.grandTotal - depositAmount).toFixed(2));

    const newPI: ProformaInvoice = {
      id: generateId(),
      proformaNumber: piNum,
      date: today,
      validUntil: validDate.toISOString().split('T')[0],
      currency: q.currency || 'USD',
      salesperson: q.salesperson || 'Andrew Manager',
      client: q.client,
      incoterm: q.incoterm || 'FOB',
      portOfLoading: q.portOfLoading || 'Ningbo, China',
      portOfDestination: q.portOfDestination || '',
      paymentTerms: q.paymentTerms || '30% T/T deposit before production, 70% balance before shipment',
      depositPercentage: depPercent,
      depositAmount,
      balanceAmount,
      items: piItems,
      shippingFee: q.shippingFee || 0,
      insurance: 0,
      packagingFee: q.packagingFee || 0,
      subtotal: q.subtotal,
      grandTotal: q.grandTotal,
      estimatedLeadTime: q.estimatedLeadTime || '15 days after deposit confirmation',
      notes: q.notes || '',
      terms: q.terms || '',
      createdAt: new Date().toISOString()
    };

    onSaveProformaInvoices([newPI, ...(proformaInvoices || [])]);
    setActionNotice(`Converted ${q.quotationNumber} into Proforma Invoice ${piNum}!`);
    setTimeout(() => setActionNotice(null), 5000);

    if (onNavigateToTab) {
      onNavigateToTab('proforma');
    }
  };

  // CONVERT TO SALES CONTRACT
  const handleConvertToContract = (q: Quotation, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!onSaveContracts) {
      alert("Sales Contract module is initializing.");
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const prefix = `ML${todayStr.slice(0, 6)}`;
    const contractNum = `${prefix}${String((contracts?.length || 0) + 1).padStart(2, '0')}`;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.');

    const contractItems: ContractItem[] = (q.items || []).map(i => ({
      id: generateId(),
      productId: i.productId,
      name: `${i.name} (${i.size || ''} ${i.material || ''})`,
      sku: i.sku,
      units: 'PCS',
      quantity: i.totalPieces,
      unitPrice: i.unitPrice,
      amount: i.totalPrice,
      ctns: i.numBoxes,
      cbm: i.cbm || 0,
      image: i.image
    }));

    const newContract: Contract = {
      id: generateId(),
      contractNumber: contractNum,
      date: today,
      currency: q.currency || 'USD',
      seller: {
        party: 'Party B (Seller)',
        companyName: settings.name || 'Zhejiang Mila Plastic Industry Co.,Ltd',
        address: settings.address || 'No. 188 East Century Avenue, Ningbo, Zhejiang, China',
        tel: settings.phone || '+86-574-87654321',
        fax: '+86-574-87654322',
        contact: q.salesperson || 'Andrew Manager'
      },
      buyer: {
        party: 'Party A (Buyer)',
        companyName: q.client.company,
        email: q.client.email,
        phone: q.client.phone,
        contact: q.client.contactPerson,
        address: q.client.address
      },
      client: q.client,
      confirmationStatement: 'THE BUYER AGREES TO BUY AND THE SELLER AGREES TO SELL THE FOLLOWING GOODS ACCORDING TO THE TERMS AND CONDITIONS SPECIFIED BELOW:',
      items: contractItems,
      deliveryTime: q.estimatedLeadTime || '15-20 DAYS',
      placeOfDelivery: q.portOfLoading || 'Ningbo Port, China',
      paymentTerms: q.paymentTerms || 'By T/T. 30% advance deposit, balance before shipment',
      beneficiary: {
        bankAdd: settings.branch || 'TAILONG COMMERCIAL BANK NINGBO BRANCH',
        swiftCode: settings.swift || 'TLCBCN22',
        bankName: settings.bankName || 'TAILONG COMMERCIAL BANK',
        accountNo: settings.accountNumber || '38990123456789',
        beneficiaryName: settings.accountName || 'ZHEJIANG MILA PLASTIC INDUSTRY CO., LTD'
      },
      intermediaryBank: {
        name: 'CHINA CONSTRUCTION BANK NINGBO BRANCH',
        swiftCode: 'PCBCN2BJNBG',
        address: 'NINGBO, ZHEJIANG, CHINA'
      },
      partyAConfirmedBy: q.client.company.toUpperCase(),
      partyBConfirmedBy: settings.name || 'Zhejiang Mila Plastic Industry Co.,Ltd',
      showStamp: true,
      stampImage: settings.stamp,
      createdAt: new Date().toISOString()
    };

    onSaveContracts([newContract, ...(contracts || [])]);
    setActionNotice(`Converted ${q.quotationNumber} into Sales Contract ${contractNum}!`);
    setTimeout(() => setActionNotice(null), 5000);

    if (onNavigateToTab) {
      onNavigateToTab('contract');
    }
  };

  const handlePrint = () => {
    printDocument('print-area');
  };

  // PDF Download Execution
  const handleDownloadPDF = async () => {
    if (!activeQuotation) return;
    setIsDownloading(true);
    try {
      await exportDocumentToPDF('print-area', activeQuotation.quotationNumber || 'Price_Quotation');
    } catch (err) {
      console.error("PDF generation failed:", err);
      printDocument('print-area');
    } finally {
      setIsDownloading(false);
    }
  };

  // Filter list
  const filteredQuotations = (quotations || []).filter(q => {
    const term = search.toLowerCase();
    return (
      q.quotationNumber.toLowerCase().includes(term) ||
      q.client.company.toLowerCase().includes(term) ||
      q.client.contactPerson.toLowerCase().includes(term) ||
      q.salesperson.toLowerCase().includes(term) ||
      (q.items || []).some(i => i.name.toLowerCase().includes(term) || i.sku.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-8 z-50 bg-[#1565C0] text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 animate-bounce">
          <Sparkles size={18} />
          <span className="text-sm font-semibold">{actionNotice}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                {language === 'zh' ? '外贸报价单生成器' : 'Price Quotation Generator'}
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                {language === 'zh'
                  ? '制作正规国际贸易报价方案、产品规格明细、包装参数与起订量阶梯报价，支持一键转为形式发票 (PI) 或外贸合同 (SC)。'
                  : 'Create B2B price proposals, spec sheets, and volume tiers with 1-click conversion to Proforma or Contract.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isEditing ? (
            <button
              onClick={() => {
                setIsEditing(false);
                setActiveQuotation(null);
              }}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
            >
              <X size={16} />
              {language === 'zh' ? '关闭编辑器' : 'Close Editor'}
            </button>
          ) : (
            <button
              onClick={handleCreateNew}
              className="px-5 py-2.5 bg-[#1565C0] text-white hover:bg-[#0D47A1] rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus size={16} />
              {language === 'zh' ? '新建外贸报价单' : 'New Price Quotation'}
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE: LIST OR EDITOR */}
      {!isEditing ? (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'zh' ? '报价单总数' : 'Total Quotations'}
                </span>
                <span className="text-2xl font-black text-slate-800">{(quotations || []).length}</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Coins size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'zh' ? '报价累计总金额' : 'Quoted Value'}
                </span>
                <span className="text-xl font-black text-slate-800">
                  ${(quotations || []).reduce((acc, q) => acc + (q.grandTotal || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Boxes size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'zh' ? '总报价箱数' : 'Total Cartons Quoted'}
                </span>
                <span className="text-2xl font-black text-slate-800">
                  {(quotations || []).reduce((acc, q) => acc + (q.totalCartons || 0), 0)}
                </span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShieldCheck size={24} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  {language === 'zh' ? '标准有效期限' : 'Standard Validity'}
                </span>
                <span className="text-base font-bold text-slate-700">
                  {language === 'zh' ? '30天 (原材料价格联动)' : '30 Days (PP Resin)'}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Ledger Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'zh' ? '搜索报价单号、客户公司名称或产品SKU...' : 'Search quote #, client company, or product SKU...'}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1565C0] focus:bg-white"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-medium">
              {language === 'zh' ? (
                <>显示 <span className="font-bold text-slate-800">{filteredQuotations.length}</span> / 共 <span className="font-bold text-slate-800">{(quotations || []).length}</span> 份报价单</>
              ) : (
                <>Showing <span className="font-bold text-slate-800">{filteredQuotations.length}</span> of <span className="font-bold text-slate-800">{(quotations || []).length}</span> Price Quotes</>
              )}
            </div>
          </div>

          {/* Quotation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">{language === 'zh' ? '报价单号' : 'Quotation #'}</th>
                    <th className="py-3.5 px-4">{language === 'zh' ? '日期与有效期' : 'Date & Validity'}</th>
                    <th className="py-3.5 px-4">{language === 'zh' ? '买家/客户公司' : 'Client / Buyer'}</th>
                    <th className="py-3.5 px-4">{language === 'zh' ? '贸易术语与港口' : 'Incoterm & Port'}</th>
                    <th className="py-3.5 px-4 text-center">{language === 'zh' ? '商品项与体积' : 'Items & Volume'}</th>
                    <th className="py-3.5 px-4 text-right">{language === 'zh' ? '报价总金额' : 'Quoted Amount'}</th>
                    <th className="py-3.5 px-4 text-center">{language === 'zh' ? '操作' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {filteredQuotations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <FileSpreadsheet size={36} className="mx-auto mb-2 text-slate-300" />
                        <p className="font-bold text-slate-600">
                          {language === 'zh' ? '暂无报价单记录' : 'No Price Quotations Found'}
                        </p>
                        <p className="text-[11px] mt-1">
                          {language === 'zh' ? '点击“新建外贸报价单”开始制作第一份报价方案。' : 'Click "New Price Quotation" to construct your first proposal.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredQuotations.map((q) => {
                      const isExpired = new Date(q.validUntil) < new Date();
                      return (
                        <tr 
                          key={q.id}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                          onClick={() => {
                            setActiveQuotation(q);
                            setIsEditing(true);
                          }}
                        >
                          <td className="py-3.5 px-4 font-bold text-[#1565C0]">
                            <div className="flex items-center gap-2">
                              <Tag size={14} className="text-amber-500" />
                              <span>{q.quotationNumber}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{q.date}</div>
                            <div className="flex items-center gap-1.5 text-[10px] mt-0.5">
                              <span className={isExpired ? "text-red-500 font-bold" : "text-emerald-600 font-medium"}>
                                {language === 'zh' ? '有效期至: ' : 'Valid to: '}{q.validUntil}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{q.client.company}</div>
                            <div className="text-[10px] text-slate-400">{q.client.contactPerson} ({q.client.country})</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] uppercase">
                              {q.incoterm}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[140px]" title={q.portOfLoading}>
                              {q.portOfLoading}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="font-bold text-slate-800">{q.items?.length || 0} {language === 'zh' ? '个品项' : 'Items'}</div>
                            <div className="text-[10px] text-slate-400">{q.totalCartons || 0} {language === 'zh' ? '箱' : 'Ctns'} / {q.totalCbm?.toFixed(2) || '0.00'} CBM</div>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-black text-slate-900 text-sm">
                              {q.currency} {q.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setActiveQuotation(q);
                                  setIsEditing(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-[#1565C0] hover:bg-blue-50 rounded-lg transition-colors"
                                title={language === 'zh' ? '编辑 / 查看报价单' : 'Edit / View Quotation'}
                              >
                                <Eye size={15} />
                              </button>

                              <button
                                onClick={(e) => handleConvertToProforma(q, e)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title={language === 'zh' ? '转为形式发票 (PI)' : 'Convert to Proforma Invoice'}
                              >
                                <Coins size={15} />
                              </button>

                              <button
                                onClick={(e) => handleConvertToContract(q, e)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title={language === 'zh' ? '转为外贸售货合同 (SC)' : 'Convert to Sales Contract'}
                              >
                                <FileCheck size={15} />
                              </button>

                              <button
                                onClick={(e) => handleDuplicateQuotation(q, e)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title={language === 'zh' ? '复制报价单' : 'Duplicate Quotation'}
                              >
                                <Copy size={15} />
                              </button>

                              <button
                                onClick={(e) => handleDeleteQuotation(q.id, e)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title={language === 'zh' ? '删除报价单' : 'Delete Quotation'}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* EDITOR MODE WITH LIVE WYSIWYG PREVIEW */
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="bg-slate-900 text-white p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 sticky top-4 z-30">
            <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-900 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                  {language === 'zh' ? '正在编辑' : 'Editing'}
                </span>
                <span className="font-mono text-sm font-bold text-amber-300">
                  {activeQuotation?.quotationNumber}
                </span>
              </div>

              {/* Mobile View Toggle (Visible only on mobile/tablet) */}
              <div className="lg:hidden flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMobileTab('form')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mobileTab === 'form' 
                      ? 'bg-amber-500 text-slate-900 shadow-xs font-black' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'zh' ? '表单编辑' : 'Form'}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mobileTab === 'preview' 
                      ? 'bg-amber-500 text-slate-900 shadow-xs font-black' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {language === 'zh' ? '实时预览' : 'Preview'}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  requestActionWithGuard(() => {
                    setIsEditing(false);
                    setActiveQuotation(null);
                  });
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                title={language === 'zh' ? '返回报价单列表' : 'Back to Quotation list'}
              >
                <X size={14} />
                <span>{language === 'zh' ? '退出' : 'Exit'}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  if (activeQuotation) {
                    handleDuplicateQuotation(activeQuotation as Quotation, e);
                  }
                }}
                className="hidden sm:inline-flex px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors items-center gap-1.5 shadow-xs cursor-pointer"
                title={language === 'zh' ? '复制此报价单' : 'Duplicate this Quotation'}
              >
                <Copy size={13} />
                {language === 'zh' ? '复制单据' : 'Duplicate'}
              </button>

              <button
                onClick={handleSaveDocument}
                className="px-3.5 sm:px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <Check size={14} />
                {language === 'zh' ? '保存报价单' : 'Save Quote'}
              </button>

              {activeQuotation && (
                <>
                  <button
                    onClick={() => handleConvertToProforma(activeQuotation as Quotation)}
                    className="hidden md:inline-flex px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors items-center gap-1.5 shadow-xs"
                    title={language === 'zh' ? '转为形式发票 (PI)' : 'Convert into Proforma Invoice'}
                  >
                    <Coins size={13} />
                    {language === 'zh' ? '转为 PI' : 'To PI'}
                  </button>

                  <button
                    onClick={() => handleConvertToContract(activeQuotation as Quotation)}
                    className="hidden md:inline-flex px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors items-center gap-1.5 shadow-xs"
                    title={language === 'zh' ? '转为售货合同 (SC)' : 'Convert into Sales Contract'}
                  >
                    <FileCheck size={13} />
                    {language === 'zh' ? '转为合同' : 'To Contract'}
                  </button>
                </>
              )}

              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Printer size={13} />
                {language === 'zh' ? '打印' : 'Print'}
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-3.5 sm:px-4 py-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {language === 'zh' ? '导出 PDF' : 'PDF'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* FORM CONTROLS (Left 5 cols on desktop) */}
            <div className={`lg:col-span-5 space-y-6 ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              {/* Quote Parameters Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5 flex items-center justify-between">
                  <span>{language === 'zh' ? '1. 报价基础参数' : '1. Quote Parameters'}</span>
                  <Tag size={16} className="text-amber-500" />
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '报价单号' : 'Quote Number'}
                    </label>
                    <input
                      type="text"
                      value={activeQuotation?.quotationNumber || ''}
                      onChange={(e) => handleFieldChange('quotationNumber', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '报价日期' : 'Quote Date'}
                    </label>
                    <input
                      type="date"
                      value={activeQuotation?.date || ''}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '有效截止日期' : 'Valid Until'}
                    </label>
                    <input
                      type="date"
                      value={activeQuotation?.validUntil || ''}
                      onChange={(e) => handleFieldChange('validUntil', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '报价币种' : 'Currency'}
                    </label>
                    <select
                      value={activeQuotation?.currency || 'USD'}
                      onChange={(e) => handleFieldChange('currency', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    >
                      {SUPPORTED_CURRENCIES.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.flag} {curr.code} ({curr.symbol}) - {curr.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '贸易术语 (Incoterms)' : 'Incoterms'}
                    </label>
                    <select
                      value={activeQuotation?.incoterm || 'FOB'}
                      onChange={(e) => handleFieldChange('incoterm', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    >
                      <option value="FOB">FOB (Free on Board / 装运港船上交货)</option>
                      <option value="EXW">EXW (Ex Works / 工厂交货)</option>
                      <option value="CIF">CIF (Cost Insurance Freight / 到岸价)</option>
                      <option value="CFR">CFR (Cost and Freight / 成本加运费)</option>
                      <option value="DDP">DDP (Delivered Duty Paid / 完税后交货)</option>
                      <option value="DAP">DAP (Delivered at Place / 目的地交货)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '业务员 / 报价人' : 'Sales Representative'}
                    </label>
                    <input
                      type="text"
                      value={activeQuotation?.salesperson || ''}
                      onChange={(e) => handleFieldChange('salesperson', e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '起运港口 (Port of Loading)' : 'Port of Loading'}
                    </label>
                    <input
                      type="text"
                      value={activeQuotation?.portOfLoading || ''}
                      onChange={(e) => handleFieldChange('portOfLoading', e.target.value)}
                      placeholder={language === 'zh' ? '例如: Ningbo Port, China' : 'e.g. Ningbo Port, China'}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '目的港口 (Port of Destination)' : 'Port of Destination'}
                    </label>
                    <input
                      type="text"
                      value={activeQuotation?.portOfDestination || ''}
                      onChange={(e) => handleFieldChange('portOfDestination', e.target.value)}
                      placeholder={language === 'zh' ? '例如: Cat Lai Port, Ho Chi Minh, Vietnam' : 'e.g. Cat Lai Port, Ho Chi Minh, Vietnam'}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '预计生产交货期 (Lead Time)' : 'Estimated Production Lead Time'}
                    </label>
                    <input
                      type="text"
                      value={activeQuotation?.estimatedLeadTime || ''}
                      onChange={(e) => handleFieldChange('estimatedLeadTime', e.target.value)}
                      placeholder={language === 'zh' ? '例如: 定金确认后 15-20 天发货' : 'e.g. 15-20 days upon deposit & sample confirmation'}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                    />
                  </div>
                </div>
              </div>

              {/* Client Selector Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-800">
                    {language === 'zh' ? '2. 目标买家 / 客户' : '2. Target Client / Buyer'}
                  </h3>
                  <button
                    onClick={() => setShowClientModal(true)}
                    className="text-xs text-[#1565C0] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {language === 'zh' ? '选择 / 新增客户' : 'Select / Add Client'}
                  </button>
                </div>

                {activeQuotation?.client ? (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="font-bold text-slate-900 text-sm">{activeQuotation.client.company}</div>
                    <div className="text-slate-600">
                      {language === 'zh' ? '联系人: ' : 'Attn: '}
                      <span className="font-medium">{activeQuotation.client.contactPerson}</span>
                    </div>
                    <div className="text-slate-500 text-[11px]">{activeQuotation.client.address}, {activeQuotation.client.country}</div>
                    <div className="text-slate-500 text-[11px]">Tel: {activeQuotation.client.phone} | Email: {activeQuotation.client.email}</div>
                  </div>
                ) : (
                  <div className="p-4 text-center border-2 border-dashed border-slate-200 rounded-xl">
                    <p className="text-xs text-slate-500">
                      {language === 'zh' ? '暂未选择客户，请点击上方按钮添加。' : 'No client selected.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Line Items Editor Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <h3 className="text-sm font-bold text-slate-800">
                    {language === 'zh' ? '3. 报价商品明细' : '3. Quoted Line Items'}
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setItemIndexToEdit(null);
                        setShowProductModal(true);
                      }}
                      className="px-2.5 py-1 bg-blue-50 text-[#1565C0] hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      {language === 'zh' ? '从产品库选择' : 'From Library'}
                    </button>
                    <button
                      onClick={handleAddManualItem}
                      className="px-2.5 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} />
                      {language === 'zh' ? '新增自定义项' : 'Custom Item'}
                    </button>
                  </div>
                </div>

                {/* Items List */}
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                  {(activeQuotation?.items || []).map((item, index) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 relative group">
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(index)}
                          className="p-1 text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                          title={language === 'zh' ? '复制此商品' : 'Duplicate line item'}
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                          title={language === 'zh' ? '删除此商品' : 'Remove item'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-start gap-3 pr-14">
                        {/* Thumbnail */}
                        <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative group/img">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <PackageCheck size={20} className="text-slate-300" />
                          )}
                          <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-[9px] font-bold cursor-pointer transition-opacity">
                            {language === 'zh' ? '上传' : 'Upload'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  try {
                                    const compressed = await compressImageFile(file, 300, 300, 0.7);
                                    handleItemRowChange(index, 'image', compressed);
                                  } catch (err) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      handleItemRowChange(index, 'image', reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }
                              }}
                              className="hidden" 
                            />
                          </label>
                        </div>

                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemRowChange(index, 'name', e.target.value)}
                            placeholder={language === 'zh' ? '产品英文/中文品名及规格描述' : 'Product Name / Description'}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                          />

                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">SKU</span>
                              <input
                                type="text"
                                value={item.sku}
                                onChange={(e) => handleItemRowChange(index, 'sku', e.target.value)}
                                className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px] font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {language === 'zh' ? '规格/尺寸' : 'Size / Spec'}
                              </span>
                              <input
                                type="text"
                                value={item.size || ''}
                                onChange={(e) => handleItemRowChange(index, 'size', e.target.value)}
                                className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px]"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-medium">
                                {language === 'zh' ? '材质' : 'Material'}
                              </span>
                              <input
                                type="text"
                                value={item.material || ''}
                                onChange={(e) => handleItemRowChange(index, 'material', e.target.value)}
                                className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Numbers Grid */}
                      <div className="grid grid-cols-4 gap-2 text-xs pt-1 border-t border-slate-200/60">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">
                            {language === 'zh' ? '单价' : 'Unit Price'} ({activeQuotation?.currency || 'USD'})
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => handleItemRowChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold text-[#1565C0]"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">
                            {language === 'zh' ? '装箱数/箱' : 'Pcs / Carton'}
                          </label>
                          <input
                            type="number"
                            value={item.piecesPerBox}
                            onChange={(e) => handleItemRowChange(index, 'piecesPerBox', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">
                            {language === 'zh' ? '总箱数' : 'Total Cartons'}
                          </label>
                          <input
                            type="number"
                            value={item.numBoxes}
                            onChange={(e) => handleItemRowChange(index, 'numBoxes', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">
                            {language === 'zh' ? '总数量' : 'Total Pcs'}
                          </label>
                          <input
                            type="number"
                            value={item.totalPieces || item.quantity || 0}
                            onChange={(e) => handleItemRowChange(index, 'totalPieces', parseInt(e.target.value) || 0)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                          />
                        </div>
                      </div>

                      {/* Extra Metadata row: Volume & Weight */}
                      <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/40 text-slate-600">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {language === 'zh' ? '预估体积 (CBM)' : 'Est CBM (m³)'}
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            value={item.cbm || 0}
                            onChange={(e) => handleItemRowChange(index, 'cbm', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px]"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-medium">
                            {language === 'zh' ? '总毛重 (kg)' : 'Gross Weight (kg)'}
                          </span>
                          <input
                            type="number"
                            step="0.1"
                            value={item.grossWeight || 0}
                            onChange={(e) => handleItemRowChange(index, 'grossWeight', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px]"
                          />
                        </div>
                        <div className="text-right flex flex-col justify-end">
                          <span className="text-[10px] text-slate-400 font-medium">
                            {language === 'zh' ? '单项金额小计' : 'Line Total'}
                          </span>
                          <span className="font-black text-slate-900 text-xs">
                            {getCurrencySymbol(activeQuotation?.currency)}{(item.totalPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Surcharges & Discounts */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">
                  {language === 'zh' ? '4. 运费及附加费用调整' : '4. Surcharges & Financial Adjustments'}
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '国际/国内运费' : 'Freight / Shipping'} ({activeQuotation?.currency || 'USD'})
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={activeQuotation?.shippingFee || 0}
                      onChange={(e) => handleFieldChange('shippingFee', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '包装/打托费' : 'Packaging Fee'} ({activeQuotation?.currency || 'USD'})
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={activeQuotation?.packagingFee || 0}
                      onChange={(e) => handleFieldChange('packagingFee', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">
                      {language === 'zh' ? '特别折扣优惠' : 'Discount Amount'} ({activeQuotation?.currency || 'USD'})
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={activeQuotation?.discountAmount || 0}
                      onChange={(e) => handleFieldChange('discountAmount', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Remarks & Terms */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2.5">
                  {language === 'zh' ? '5. 结算方式与交易条款' : '5. Commercial Terms & Payment Form'}
                </h3>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">
                    {language === 'zh' ? '结算收款方式 (Payment Method)' : 'Payment Method Type (结算方式)'}
                  </label>
                  <select
                    value={activeQuotation?.paymentMethodType || 'international'}
                    onChange={(e) => handleFieldChange('paymentMethodType', e.target.value as 'international' | 'local_rmb' | 'both')}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#1565C0] focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                  >
                    <option value="international">
                      {language === 'zh' ? '🌐 国际外汇电汇账户 (USD / Foreign SWIFT)' : '🌐 International Wire Transfer (USD / Foreign SWIFT)'}
                    </option>
                    <option value="local_rmb">
                      {language === 'zh' ? '🇨🇳 国内人民币结算 (支付宝 / 微信 / 农行对公私卡)' : '🇨🇳 Domestic RMB Payment (Alipay / WeChat / ABC Local Bank)'}
                    </option>
                    <option value="both">
                      {language === 'zh' ? '🔄 国际电汇与国内人民币同时展示' : '🔄 Both International & Domestic RMB'}
                    </option>
                  </select>
                </div>

                {(!activeQuotation?.paymentMethodType || activeQuotation?.paymentMethodType === 'international' || activeQuotation?.paymentMethodType === 'both') && (
                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeQuotation?.showBankDetails !== false}
                          onChange={(e) => handleFieldChange('showBankDetails', e.target.checked)}
                          className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
                          {language === 'zh' ? '包含国际电汇账户信息' : 'Include International Wire Details'}
                        </span>
                      </label>
                      {activeQuotation?.showBankDetails !== false && (
                        <input
                          type="text"
                          value={activeQuotation?.bankTitle || ''}
                          onChange={(e) => handleFieldChange('bankTitle', e.target.value)}
                          placeholder={language === 'zh' ? '标题 (默认: WIRE SETTLEMENT)' : 'Title (Default: WIRE SETTLEMENT)'}
                          className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-44 text-right"
                        />
                      )}
                    </div>

                    {activeQuotation?.showBankDetails !== false ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">
                              {language === 'zh' ? '开户银行 (Bank Name)' : 'Bank Name'}
                            </label>
                            <input
                              type="text"
                              value={activeQuotation?.bankName ?? settings.bankName ?? ''}
                              onChange={(e) => handleFieldChange('bankName', e.target.value)}
                              placeholder={settings.bankName || 'Bank Name'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">
                              {language === 'zh' ? '银行支行 (Branch)' : 'Branch'}
                            </label>
                            <input
                              type="text"
                              value={activeQuotation?.branch ?? settings.branch ?? ''}
                              onChange={(e) => handleFieldChange('branch', e.target.value)}
                              placeholder={settings.branch || 'Branch'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">
                              {language === 'zh' ? '受益人户名 (Beneficiary Name)' : 'Beneficiary Name'}
                            </label>
                            <input
                              type="text"
                              value={activeQuotation?.accountName ?? settings.accountName ?? ''}
                              onChange={(e) => handleFieldChange('accountName', e.target.value)}
                              placeholder={settings.accountName || 'Beneficiary Name'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">
                              {language === 'zh' ? '银行账号 (Account Number)' : 'Account Number'}
                            </label>
                            <input
                              type="text"
                              value={activeQuotation?.accountNumber ?? settings.accountNumber ?? ''}
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
                              value={activeQuotation?.swift ?? settings.swift ?? ''}
                              onChange={(e) => handleFieldChange('swift', e.target.value)}
                              placeholder={settings.swift || 'SWIFT Code'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 uppercase">IBAN</label>
                            <input
                              type="text"
                              value={activeQuotation?.iban ?? settings.iban ?? ''}
                              onChange={(e) => handleFieldChange('iban', e.target.value)}
                              placeholder={settings.iban || 'IBAN'}
                              className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        {language === 'zh' ? '已隐藏国际电汇账户。' : 'International wire details are hidden from this quotation.'}
                      </p>
                    )}
                  </div>
                )}

                {(activeQuotation?.paymentMethodType === 'local_rmb' || activeQuotation?.paymentMethodType === 'both') && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                    <div className="font-bold text-[#07C160] text-xs flex items-center justify-between">
                      <span>{language === 'zh' ? '国内人民币结算信息' : 'Domestic RMB Settlement Details'}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {language === 'zh' ? '自动同步' : 'Auto-synced'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 block">
                          {language === 'zh' ? '开户行 (Bank Branch)' : 'Bank Branch'}
                        </label>
                        <input
                          type="text"
                          value={activeQuotation?.localBankName || settings.localBankName || '农业银行衢州衢化支行'}
                          onChange={(e) => handleFieldChange('localBankName', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">
                            {language === 'zh' ? '户名 (Account Name)' : 'Account Name'}
                          </label>
                          <input
                            type="text"
                            value={activeQuotation?.localAccountName || settings.localAccountName || '徐叶兵'}
                            onChange={(e) => handleFieldChange('localAccountName', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">
                            {language === 'zh' ? '卡号 (Card Number)' : 'Card Number'}
                          </label>
                          <input
                            type="text"
                            value={activeQuotation?.localAccountNumber || settings.localAccountNumber || '6228481077103681570'}
                            onChange={(e) => handleFieldChange('localAccountNumber', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/50">
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">
                            {language === 'zh' ? '微信收款码' : 'WeChat Pay QR'}
                          </span>
                          <div className="flex items-center gap-2">
                            <img src={activeQuotation?.wechatQr || settings.wechatQr} alt="WeChat QR" className="w-8 h-8 object-contain border rounded bg-white" referrerPolicy="no-referrer" />
                            <label className="px-2 py-1 bg-white border border-slate-200 hover:border-[#07C160] rounded text-[10px] font-bold text-[#07C160] cursor-pointer">
                              {language === 'zh' ? '更换二维码' : 'Change QR'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImageFile(file, 400, 400, 0.8);
                                      handleFieldChange('wechatQr', compressed);
                                    } catch (err) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => handleFieldChange('wechatQr', reader.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-slate-500 block mb-1">
                            {language === 'zh' ? '支付宝收款码' : 'Alipay QR'}
                          </span>
                          <div className="flex items-center gap-2">
                            <img src={activeQuotation?.alipayQr || settings.alipayQr} alt="Alipay QR" className="w-8 h-8 object-contain border rounded bg-white" referrerPolicy="no-referrer" />
                            <label className="px-2 py-1 bg-white border border-slate-200 hover:border-[#1677FF] rounded text-[10px] font-bold text-[#1677FF] cursor-pointer">
                              {language === 'zh' ? '更换二维码' : 'Change QR'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      const compressed = await compressImageFile(file, 400, 400, 0.8);
                                      handleFieldChange('alipayQr', compressed);
                                    } catch (err) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => handleFieldChange('alipayQr', reader.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeQuotation?.showNotes !== false}
                        onChange={(e) => handleFieldChange('showNotes', e.target.checked)}
                        className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                      />
                      <span className="text-[10px] font-bold text-slate-700 uppercase">
                        {language === 'zh' ? '包含报价有效期与特别备注' : 'Include Price Validity & Notes'}
                      </span>
                    </label>
                    {activeQuotation?.showNotes !== false && (
                      <input
                        type="text"
                        value={activeQuotation?.notesTitle || ''}
                        onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                        placeholder={language === 'zh' ? '标题 (默认: SPECIAL REMARKS & VALIDITY)' : 'Title (Default: SPECIAL REMARKS & VALIDITY)'}
                        className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-52 text-right"
                      />
                    )}
                  </div>
                  {activeQuotation?.showNotes !== false ? (
                    <>
                      <textarea
                        rows={2}
                        value={activeQuotation?.notes || ''}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        placeholder={language === 'zh' ? '输入报价有效期、交货期、起订量政策等...' : 'Enter quotation validity, delivery lead time, MOQ...'}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleFieldChange('notes', '1. Price quotation is valid for 30 days from issue date.\n2. Customized mold fee to be refunded after accumulated orders reach 50,000 units.\n3. Standard export packaging included in unit price.')}
                          className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          + {language === 'zh' ? '标准模具与有效期条款' : 'Standard Quotation Validity & Mold Notes'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      {language === 'zh' ? '已隐藏报价有效期与特别备注。' : 'Price validity & notes section is hidden from this quotation.'}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeQuotation?.showPaymentTerms !== false && activeQuotation?.showTerms !== false}
                        onChange={(e) => {
                          handleFieldChange('showPaymentTerms', e.target.checked);
                          handleFieldChange('showTerms', e.target.checked);
                        }}
                        className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                      />
                      <span className="text-[10px] font-bold text-slate-700 uppercase">
                        {language === 'zh' ? '包含付款方式与样品条款' : 'Include Payment & Sample Terms'}
                      </span>
                    </label>
                    {(activeQuotation?.showPaymentTerms !== false && activeQuotation?.showTerms !== false) && (
                      <input
                        type="text"
                        value={activeQuotation?.paymentTermsTitle || ''}
                        onChange={(e) => handleFieldChange('paymentTermsTitle', e.target.value)}
                        placeholder={language === 'zh' ? '标题 (默认: TERMS OF PAYMENT)' : 'Title (Default: TERMS OF PAYMENT)'}
                        className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-48 text-right"
                      />
                    )}
                  </div>
                  {(activeQuotation?.showPaymentTerms !== false && activeQuotation?.showTerms !== false) ? (
                    <>
                      <textarea
                        rows={2}
                        value={activeQuotation?.paymentTerms || activeQuotation?.terms || ''}
                        onChange={(e) => {
                          handleFieldChange('paymentTerms', e.target.value);
                          handleFieldChange('terms', e.target.value);
                        }}
                        placeholder={language === 'zh' ? '输入付款条款、定金比例、样品规则等...' : 'Enter payment terms, deposit details, sample policy...'}
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#1565C0]"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            const val = 'T/T 30% deposit with order confirmation, 70% balance paid prior to dispatch.';
                            handleFieldChange('paymentTerms', val);
                            handleFieldChange('terms', val);
                          }}
                          className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          + {language === 'zh' ? '30% 定金 / 70% 发货前结清' : '30% Deposit / 70% Pre-Shipment'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const val = 'Samples provided free of charge (1-3 pcs); international courier freight collect.';
                            handleFieldChange('paymentTerms', val);
                            handleFieldChange('terms', val);
                          }}
                          className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          + {language === 'zh' ? '免费样品条款' : 'Free Sample Terms'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">
                      {language === 'zh' ? '已隐藏付款与样品条款。' : 'Payment & sample terms section is hidden from this quotation.'}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    {language === 'zh' ? '在单据中显示公司印章公章' : 'Display Company Stamp & Seal'}
                  </span>
                  <input
                    type="checkbox"
                    checked={activeQuotation?.showStamp ?? true}
                    onChange={(e) => handleFieldChange('showStamp', e.target.checked)}
                    className="w-4 h-4 text-[#1565C0] rounded border-slate-300 focus:ring-[#1565C0]"
                  />
                </div>
              </div>
            </div>

            {/* LIVE A4 PRINT PREVIEW (Right 7 cols on desktop) */}
            <div className={`lg:col-span-7 flex flex-col items-center w-full min-w-0 ${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="w-full flex items-center justify-between mb-2.5 px-1 print:hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <Eye size={12} className="text-[#1565C0]" /> 
                  {language === 'zh' ? '实时单据排版预览 (所见即所得)' : 'Live Quotation Preview (WYSIWYG)'}
                </span>

                {/* Zoom Controller */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs text-[11px] font-bold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.max(50, z - 10))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                    title={language === 'zh' ? '缩小' : 'Zoom Out'}
                  >
                    -
                  </button>
                  <span className="px-1.5 font-mono text-[10px] min-w-[38px] text-center">{previewZoom}%</span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(z => Math.min(150, z + 10))}
                    className="w-6 h-6 flex items-center justify-center hover:bg-slate-100 rounded text-slate-700 cursor-pointer"
                    title={language === 'zh' ? '放大' : 'Zoom In'}
                  >
                    +
                  </button>
                  {previewZoom !== 100 && (
                    <button
                      type="button"
                      onClick={() => setPreviewZoom(100)}
                      className="px-1.5 py-0.5 text-[9px] text-[#1565C0] hover:bg-blue-50 rounded cursor-pointer ml-0.5 font-semibold"
                    >
                      {language === 'zh' ? '重置' : 'Reset'}
                    </button>
                  )}
                </div>
              </div>

              {/* A4 Document Container */}
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
                  <div className="space-y-4 sm:space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-4 gap-4 sm:gap-6">
                      <div className="flex items-center gap-3">
                        {settings.logo ? (
                          <img src={settings.logo} alt="Logo" className="h-10 w-auto object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-[#1565C0] text-white font-extrabold flex items-center justify-center rounded">
                            {(settings.name || 'ML').substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-extrabold text-sm text-slate-800">{settings.name || 'Zhejiang Mila Plastic Industry Co.,Ltd'}</p>
                          <p className="text-[9px] text-slate-500 max-w-xs leading-normal">{settings.address || 'No. 188 East Century Avenue, Ningbo, Zhejiang, China'}</p>
                          <p className="text-[9px] text-slate-500">Tax ID: {settings.taxNumber || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right w-full sm:w-auto">
                        <input
                          type="text"
                          value={activeQuotation?.title || 'PRICE QUOTATION'}
                          onChange={(e) => handleFieldChange('title', e.target.value)}
                          className="text-left sm:text-right bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#1565C0] text-xl font-black text-[#1565C0] uppercase tracking-tight w-full outline-hidden"
                          title="Click to edit document title"
                          placeholder="PRICE QUOTATION"
                        />
                        <div className="mt-3 grid grid-cols-2 gap-x-2.5 gap-y-1 text-[9px] text-slate-500 leading-normal font-semibold text-left justify-end">
                          <span className="font-bold text-slate-400 text-left sm:text-right">Quotation No:</span>
                          <span className="font-bold text-slate-800">{activeQuotation?.quotationNumber || 'QT-000001'}</span>
                          <span className="font-bold text-slate-400 text-left sm:text-right">Date:</span>
                          <span className="text-slate-800">{activeQuotation?.date}</span>
                          <span className="font-bold text-slate-400 text-left sm:text-right">Valid Until:</span>
                          <span className="text-slate-800">{activeQuotation?.validUntil}</span>
                          <span className="font-bold text-slate-400 text-left sm:text-right">Currency:</span>
                          <select
                            value={activeQuotation?.currency || 'USD'}
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
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Consignee and shipment addresses */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Consignee (Buyer)</span>
                        <p className="text-xs font-black text-slate-800">{activeQuotation?.client?.company || 'Client Company'}</p>
                        <div className="text-[9px] text-slate-500 leading-normal font-semibold">
                          <p>Attn: {activeQuotation?.client?.contactPerson || 'N/A'}</p>
                          <p>{activeQuotation?.client?.address}</p>
                          <p>{activeQuotation?.client?.country}</p>
                          {activeQuotation?.client?.phone && <p>Phone: {activeQuotation.client.phone}</p>}
                        </div>
                      </div>

                      <div className="p-3 bg-white border border-slate-100 rounded-lg space-y-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Commercial Parameters</span>
                        <p className="text-xs font-extrabold text-slate-800">{settings.name}</p>
                        <div className="text-[9px] text-slate-500 leading-normal font-semibold">
                          <p>Sales Rep: {activeQuotation?.salesperson || 'Andrew Admin'}</p>
                          <p>Incoterm: {activeQuotation?.incoterm || 'FOB Ningbo'}</p>
                          <p>Port of Origin: {activeQuotation?.portOfLoading || 'Ningbo, China'}</p>
                          <p>Lead Time: {activeQuotation?.estimatedLeadTime || '25-30 Days'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto w-full -mx-1 sm:mx-0">
                      <table className="w-full min-w-[500px] text-left border-collapse text-[9px]">
                        <thead>
                          <tr className="bg-[#1565C0] text-white font-bold uppercase text-[8px] border-b border-[#1565C0]">
                            <th className="py-2 px-2 rounded-l">Item Description</th>
                            <th className="py-2 px-2 text-center">Size / Spec</th>
                            <th className="py-2 px-2 text-center">Box Volume</th>
                            <th className="py-2 px-2 text-right">Quantity (Pcs)</th>
                            <th className="py-2 px-2 text-right">Unit Price ({activeQuotation?.currency || 'USD'})</th>
                            <th className="py-2 px-2 text-right rounded-r">Total ({activeQuotation?.currency || 'USD'})</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 leading-tight font-semibold text-slate-700">
                          {(!activeQuotation?.items || activeQuotation.items.length === 0) ? (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400">
                                No product item entries mapped.
                              </td>
                            </tr>
                          ) : (
                            activeQuotation.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-2">
                                    {item.image && <img src={item.image} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />}
                                    <div>
                                      <p className="font-extrabold text-slate-800">{item.name}</p>
                                      <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-semibold">
                                        <span>SKU: {item.sku}</span>
                                        {item.material && (
                                          <>
                                            <span>•</span>
                                            <span>{item.material}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-center font-bold font-mono text-slate-800">{item.size || '-'}</td>
                                <td className="py-2 px-2 text-center">{item.numBoxes || 0} Box <span className="text-[8px] text-slate-400">({item.piecesPerBox || 1000} Pcs/Box)</span></td>
                                <td className="py-2 px-2 text-right font-bold">{(item.totalPieces || item.quantity || 0).toLocaleString()}</td>
                                <td className="py-2 px-2 text-right font-mono">{formatUnitPrice(item.unitPrice, activeQuotation?.currency)}</td>
                                <td className="py-2 px-2 text-right font-bold text-slate-800">{getCurrencySymbol(activeQuotation?.currency)}{(item.totalPrice || item.unitPrice * (item.totalPieces || item.quantity || 0)).toFixed(2)}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Totals & Notes Section */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 pt-4 border-t border-slate-100">
                      <div className="col-span-1 md:col-span-7 space-y-4">
                        {/* Dynamic Bank Settlement Coordinates (Inline Editable) */}
                        {(!activeQuotation?.paymentMethodType || activeQuotation?.paymentMethodType === 'international' || activeQuotation?.paymentMethodType === 'both') && (
                          activeQuotation?.showBankDetails !== false ? (
                            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-[8px] text-slate-500 leading-normal font-semibold group relative">
                              <div className="flex items-center justify-between pb-0.5 border-b border-slate-200/60">
                                <input
                                  type="text"
                                  value={activeQuotation?.bankTitle || 'Beneficiary Bank Settlement Coordinates (International Wire)'}
                                  onChange={(e) => handleFieldChange('bankTitle', e.target.value)}
                                  className="font-black text-slate-400 uppercase tracking-widest block bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                  title="Click to edit section title"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleFieldChange('showBankDetails', false)}
                                  className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                                  title="Hide international wire details from this quotation"
                                >
                                  ✕ Remove
                                </button>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="font-extrabold text-slate-700 shrink-0">Bank:</span>
                                <input
                                  type="text"
                                  value={activeQuotation?.bankName ?? settings.bankName ?? ''}
                                  onChange={(e) => handleFieldChange('bankName', e.target.value)}
                                  placeholder="Bank Name"
                                  className="font-extrabold text-slate-700 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] flex-1"
                                />
                                <span className="text-slate-400 font-normal shrink-0">(</span>
                                <input
                                  type="text"
                                  value={activeQuotation?.branch ?? settings.branch ?? ''}
                                  onChange={(e) => handleFieldChange('branch', e.target.value)}
                                  placeholder="Branch"
                                  className="font-semibold text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-28 text-center"
                                />
                                <span className="text-slate-400 font-normal shrink-0">)</span>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="shrink-0 text-slate-500">Account Name:</span>
                                <input
                                  type="text"
                                  value={activeQuotation?.accountName ?? settings.accountName ?? ''}
                                  onChange={(e) => handleFieldChange('accountName', e.target.value)}
                                  placeholder="Beneficiary Account Name"
                                  className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="shrink-0 text-slate-500">Account No:</span>
                                <input
                                  type="text"
                                  value={activeQuotation?.accountNumber ?? settings.accountNumber ?? ''}
                                  onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                                  placeholder="Account Number"
                                  className="font-mono font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                />
                              </div>

                              {(activeQuotation?.iban !== undefined ? activeQuotation?.iban : settings.iban) ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-mono shrink-0 text-slate-500">IBAN:</span>
                                  <input
                                    type="text"
                                    value={activeQuotation?.iban ?? settings.iban ?? ''}
                                    onChange={(e) => handleFieldChange('iban', e.target.value)}
                                    placeholder="IBAN"
                                    className="font-mono font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                  />
                                </div>
                              ) : null}

                              <div className="flex items-center gap-1">
                                <span className="font-mono shrink-0 text-slate-500">SWIFT:</span>
                                <input
                                  type="text"
                                  value={activeQuotation?.swift ?? settings.swift ?? ''}
                                  onChange={(e) => handleFieldChange('swift', e.target.value)}
                                  placeholder="SWIFT Code"
                                  className="font-mono font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="print:hidden">
                              <button
                                type="button"
                                onClick={() => handleFieldChange('showBankDetails', true)}
                                className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                              >
                                + Add International Wire Coordinates (Optional)
                              </button>
                            </div>
                          )
                        )}

                        {(activeQuotation?.paymentMethodType === 'local_rmb' || activeQuotation?.paymentMethodType === 'both') && (
                          <div className="bg-emerald-50/40 p-2.5 rounded-lg border border-emerald-100/80 space-y-2 text-[8px] text-slate-600 leading-normal font-semibold">
                            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1">
                              <span className="font-black text-[#07C160] uppercase tracking-wider block text-[8px]">
                                国内人民币结算 (Domestic RMB Settlement)
                              </span>
                              <span className="text-[7px] bg-[#07C160] text-white px-1.5 py-0.2 rounded font-bold">RMB / 微信 / 支付宝</span>
                            </div>

                            <div className="space-y-0.5 text-slate-700">
                              <div className="flex items-center gap-1">
                                <span className="shrink-0">开户行 Bank:</span>
                                <input
                                  type="text"
                                  value={activeQuotation?.localBankName || settings.localBankName || ''}
                                  onChange={(e) => handleFieldChange('localBankName', e.target.value)}
                                  placeholder="农业银行衢州衢化支行"
                                  className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-dashed hover:border-emerald-300 focus:border-[#07C160] outline-hidden text-[8px] w-full"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="shrink-0">户名 Account Name:</span>
                                <input
                                  type="text"
                                  value={activeQuotation?.localAccountName || settings.localAccountName || ''}
                                  onChange={(e) => handleFieldChange('localAccountName', e.target.value)}
                                  placeholder="户名"
                                  className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-dashed hover:border-emerald-300 focus:border-[#07C160] outline-hidden text-[8px] w-full"
                                />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-mono shrink-0">卡号 Card No:</span>
                                <input
                                  type="text"
                                  value={activeQuotation?.localAccountNumber || settings.localAccountNumber || ''}
                                  onChange={(e) => handleFieldChange('localAccountNumber', e.target.value)}
                                  placeholder="卡号"
                                  className="font-mono font-extrabold text-slate-900 bg-transparent border-b border-transparent hover:border-dashed hover:border-emerald-300 focus:border-[#07C160] outline-hidden text-[9px] w-full"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-5 pt-2 border-t border-emerald-100/80">
                              {(activeQuotation?.wechatQr || settings.wechatQr) && (
                                <div className="text-center">
                                  <img 
                                    src={activeQuotation?.wechatQr || settings.wechatQr} 
                                    alt="WeChat QR" 
                                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain border-2 border-emerald-200 rounded-lg p-1 bg-white mx-auto shadow-xs" 
                                    referrerPolicy="no-referrer" 
                                  />
                                  <span className="text-[9px] text-[#07C160] font-black block mt-1">微信 Pay QR</span>
                                </div>
                              )}

                              {(activeQuotation?.alipayQr || settings.alipayQr) && (
                                <div className="text-center">
                                  <img 
                                    src={activeQuotation?.alipayQr || settings.alipayQr} 
                                    alt="Alipay QR" 
                                    className="w-28 h-28 sm:w-32 sm:h-32 object-contain border-2 border-blue-200 rounded-lg p-1 bg-white mx-auto shadow-xs" 
                                    referrerPolicy="no-referrer" 
                                  />
                                  <span className="text-[9px] text-[#1677FF] font-black block mt-1">支付宝 Alipay QR</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Price Validity & Notes (Optional & Modifiable) */}
                        {activeQuotation?.showNotes !== false ? (
                          <div className={`text-[8px] text-slate-600 leading-relaxed group relative ${!activeQuotation?.notes ? 'print:hidden' : ''}`}>
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={activeQuotation?.notesTitle || 'SPECIAL REMARKS & VALIDITY'}
                                onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                                className="font-bold uppercase not-italic block text-slate-400 hover:text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                title="Click to edit section title"
                              />
                              <button
                                type="button"
                                onClick={() => handleFieldChange('showNotes', false)}
                                className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                                title="Hide remarks & validity notes from this quotation"
                              >
                                ✕ Remove
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={activeQuotation?.notes || ''}
                              onChange={(e) => handleFieldChange('notes', e.target.value)}
                              placeholder="[ Click to add / modify quotation notes & validity (optional)... ]"
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
                              + Add Special Remarks & Validity (Optional)
                            </button>
                          </div>
                        )}

                        {/* Terms of Payment (Optional & Modifiable) */}
                        {(activeQuotation?.showPaymentTerms !== false && activeQuotation?.showTerms !== false) ? (
                          <div className={`text-[8px] text-slate-600 leading-relaxed group relative ${!activeQuotation?.paymentTerms && !activeQuotation?.terms ? 'print:hidden' : ''}`}>
                            <div className="flex items-center justify-between">
                              <input
                                type="text"
                                value={activeQuotation?.paymentTermsTitle || 'TERMS OF PAYMENT'}
                                onChange={(e) => handleFieldChange('paymentTermsTitle', e.target.value)}
                                className="font-bold uppercase not-italic block text-slate-400 hover:text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                title="Click to edit section title"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  handleFieldChange('showPaymentTerms', false);
                                  handleFieldChange('showTerms', false);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                                title="Hide payment terms from this quotation"
                              >
                                ✕ Remove
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={activeQuotation?.paymentTerms || activeQuotation?.terms || ''}
                              onChange={(e) => {
                                handleFieldChange('paymentTerms', e.target.value);
                                handleFieldChange('terms', e.target.value);
                              }}
                              placeholder="[ Click to add / modify terms of payment (optional)... ]"
                              className="w-full bg-transparent border border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] rounded p-0.5 text-[8px] text-slate-600 leading-relaxed italic resize-none outline-hidden print:border-none print:p-0"
                              title="Click to modify terms directly"
                            />
                          </div>
                        ) : (
                          <div className="print:hidden">
                            <button
                              type="button"
                              onClick={() => {
                                handleFieldChange('showPaymentTerms', true);
                                handleFieldChange('showTerms', true);
                              }}
                              className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                            >
                              + Add Terms of Payment (Optional)
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="col-span-1 md:col-span-5 text-[9px] space-y-1 text-slate-500 font-semibold text-right max-w-full">
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 leading-normal">
                          <span className="text-slate-400">Subtotal:</span>
                          <span className="text-slate-800 font-bold">{activeQuotation?.currency} {(activeQuotation?.subtotal || 0).toFixed(2)}</span>
                          
                          {(activeQuotation?.discountAmount || 0) > 0 && (
                            <>
                              <span className="text-slate-400">Volume Discount:</span>
                              <span className="text-red-500 font-bold">- {activeQuotation?.currency} {(activeQuotation?.discountAmount || 0).toFixed(2)}</span>
                            </>
                          )}

                          {(activeQuotation?.shippingFee || 0) > 0 && (
                            <>
                              <span className="text-slate-400">Ocean/Courier Freight:</span>
                              <span className="text-slate-800 font-bold">+ {activeQuotation?.currency} {Number(activeQuotation?.shippingFee).toFixed(2)}</span>
                            </>
                          )}

                          {Number(activeQuotation?.packagingFee || 0) > 0 && (
                            <>
                              <span className="text-slate-400">Packaging Fee:</span>
                              <span className="text-slate-800 font-bold">+ {activeQuotation?.currency} {Number(activeQuotation?.packagingFee).toFixed(2)}</span>
                            </>
                          )}

                          <div className="col-span-2 border-t border-slate-200 my-1"></div>

                          <span className="text-xs text-[#1565C0] font-black uppercase">GRAND TOTAL:</span>
                          <span className="text-xs text-[#1565C0] font-black">{activeQuotation?.currency} {(activeQuotation?.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Print Layout Footer */}
                  <div className="border-t border-slate-100 pt-6 flex items-end justify-end text-[8px] text-slate-400 font-semibold mt-8 shrink-0">
                    {/* Stamp & Sign Overlay */}
                    <div className="flex gap-4 items-center shrink-0 relative h-16 w-60 justify-end">
                      {settings.secondaryStamp && (
                        <div className="absolute right-24 bottom-0 w-16 h-16 pointer-events-none opacity-90 mix-blend-multiply">
                          <TransparentSignature src={settings.secondaryStamp} alt="Secondary Stamp" className="w-full h-full object-contain" />
                        </div>
                      )}
                      {settings.stamp && (
                        <div className="absolute right-12 bottom-0 w-16 h-16 pointer-events-none opacity-90 mix-blend-multiply">
                          <TransparentSignature src={settings.stamp} alt="Factory Stamp" className="w-full h-full object-contain" />
                        </div>
                      )}
                      {settings.signature && (
                        <div className="relative z-10 w-28 h-12 pointer-events-none text-right flex flex-col justify-end">
                          <p className="text-[7px] text-slate-400 uppercase tracking-widest text-center mb-0.5">Authorized Signature</p>
                          <TransparentSignature src={settings.signature} alt="Authorized Signature" className="max-w-full max-h-10 object-contain mx-auto" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SELECT PRODUCT MODAL */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base">
                {language === 'zh' ? '从工厂产品库选择产品' : 'Select Product from Factory Library'}
              </h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder={language === 'zh' ? '搜索品名、SKU、类别...' : 'Search products by name, SKU, or category...'}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {products
                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku.toLowerCase().includes(productSearch.toLowerCase()))
                .map(p => (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className="p-3 bg-slate-50 hover:bg-blue-50/80 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-between transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                        {p.image ? (
                          <img src={p.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <PackageCheck size={18} className="text-slate-300" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 text-xs group-hover:text-[#1565C0]">{p.name}</div>
                        <div className="text-[10px] text-slate-500">
                          SKU: {p.sku} | {language === 'zh' ? '规格' : 'Spec'}: {p.size || 'N/A'} | {language === 'zh' ? '材质' : 'Material'}: {p.material || 'PP'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-black text-[#1565C0] text-xs">${p.price.toFixed(3)}</div>
                      <div className="text-[10px] text-slate-400">MOQ: {(p.moq || 10000).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* SELECT / ADD CLIENT MODAL */}
      {showClientModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-base">
                {language === 'zh' ? '选择目标采购商 / 客户' : 'Select Target Buyer / Client'}
              </h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {!showInlineClientForm ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder={language === 'zh' ? '搜索公司名称或联系人...' : 'Search company or contact...'}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                    />
                  </div>
                  <button
                    onClick={() => setShowInlineClientForm(true)}
                    className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <UserPlus size={14} />
                    {language === 'zh' ? '新建客户' : 'New Client'}
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2">
                  {clients
                    .filter(c => c.company.toLowerCase().includes(clientSearch.toLowerCase()) || c.contactPerson.toLowerCase().includes(clientSearch.toLowerCase()))
                    .map(c => (
                      <div
                        key={c.id}
                        onClick={() => {
                          if (activeQuotation) {
                            setActiveQuotation({ ...activeQuotation, client: c });
                          }
                          setShowClientModal(false);
                        }}
                        className="p-3 bg-slate-50 hover:bg-blue-50/80 rounded-xl border border-slate-200 cursor-pointer transition-colors"
                      >
                        <div className="font-bold text-slate-900 text-xs">{c.company}</div>
                        <div className="text-[10px] text-slate-500">
                          {language === 'zh' ? '联系人' : 'Contact'}: {c.contactPerson} | {c.country}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700">
                  {language === 'zh' ? '填写新增买家信息' : 'Add New Buyer Details'}
                </h4>
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder={language === 'zh' ? '公司名称 (必填) *' : 'Company Name *'}
                    value={inlineClient.company || ''}
                    onChange={(e) => setInlineClient({ ...inlineClient, company: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder={language === 'zh' ? '联系人姓名' : 'Contact Person'}
                    value={inlineClient.contactPerson || ''}
                    onChange={(e) => setInlineClient({ ...inlineClient, contactPerson: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder={language === 'zh' ? '国家/地区' : 'Country'}
                    value={inlineClient.country || ''}
                    onChange={(e) => setInlineClient({ ...inlineClient, country: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    placeholder={language === 'zh' ? '详细地址' : 'Address'}
                    value={inlineClient.address || ''}
                    onChange={(e) => setInlineClient({ ...inlineClient, address: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder={language === 'zh' ? '电话号码' : 'Phone'}
                      value={inlineClient.phone || ''}
                      onChange={(e) => setInlineClient({ ...inlineClient, phone: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <input
                      type="email"
                      placeholder={language === 'zh' ? '电子邮箱' : 'Email'}
                      value={inlineClient.email || ''}
                      onChange={(e) => setInlineClient({ ...inlineClient, email: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowInlineClientForm(false)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {language === 'zh' ? '返回列表' : 'Back'}
                  </button>
                  <button
                    onClick={handleSaveInlineClient}
                    className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 cursor-pointer"
                  >
                    {language === 'zh' ? '保存并选中' : 'Save & Select'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
