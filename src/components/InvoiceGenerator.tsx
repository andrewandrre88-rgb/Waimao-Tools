import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Invoice, InvoiceItem, Client, Product, CompanySettings, getCurrencySymbol, formatUnitPrice, SUPPORTED_CURRENCIES } from '../types';
import { generateId, getNextDocumentNumber } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
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
  Package,
  Eye,
  Database,
  Calculator,
  UserPlus,
  Coins,
  Copy,
  Edit2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';

import { compressImageFile } from '../utils/imageCompressor';
import { TransparentSignature } from './TransparentSignature';
import { useNavigationGuard } from '../context/NavigationGuardContext';

interface InvoiceGeneratorProps {
  invoices: Invoice[];
  onSaveInvoices: (invoices: Invoice[]) => void;
  products: Product[];
  onSaveProducts?: (products: Product[]) => void;
  clients: Client[];
  onSaveClients: (clients: Client[]) => void;
  settings: CompanySettings;
  // Hook for deep linking from Global Search
  searchTarget: { id: string; type: string } | null;
  clearSearchTarget: () => void;
  activeDocId: string | null;
  clearActiveDoc: () => void;
}

export default function InvoiceGenerator({ 
  invoices, 
  onSaveInvoices, 
  products, 
  onSaveProducts,
  clients, 
  onSaveClients, 
  settings,
  searchTarget,
  clearSearchTarget,
  activeDocId,
  clearActiveDoc
}: InvoiceGeneratorProps) {
  const { t, language } = useLanguage();
  // Navigation & Search State
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState<Partial<Invoice> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges, requestActionWithGuard } = useNavigationGuard();

  // Keep unsaved changes registration up-to-date
  useEffect(() => {
    if (isEditing && activeInvoice) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activeInvoice.invoiceNumber ? `Commercial Invoice: ${activeInvoice.invoiceNumber}` : 'Commercial Invoice Draft',
        docType: 'Commercial Invoice',
        onSave: () => {
          handleSaveInvoiceDocument();
        },
        onDiscard: () => {
          setIsEditing(false);
          setActiveInvoice(null);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [isEditing, activeInvoice, invoices]);

  // Selector Modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [itemIndexToEdit, setItemIndexToEdit] = useState<number | null>(null);

  // Quick Inline Client Add State
  const [showInlineClientForm, setShowInlineClientForm] = useState(false);
  const [inlineClient, setInlineClient] = useState<Partial<Client>>({ company: '', contactPerson: '', country: '' });

  // Handle general fields change
  const handleFieldChange = (field: keyof Invoice, value: any) => {
    if (!activeInvoice) return;
    
    const nextInvoice = { ...activeInvoice, [field]: value };
    const items = nextInvoice.items || [];
    const ship = nextInvoice.shippingFee !== undefined ? Number(nextInvoice.shippingFee) : 0;
    const ins = nextInvoice.insurance !== undefined ? Number(nextInvoice.insurance) : 0;
    const pkg = nextInvoice.packagingFee !== undefined ? Number(nextInvoice.packagingFee) : 0;
    const taxRate = nextInvoice.taxRate !== undefined ? Number(nextInvoice.taxRate) : settings.defaultTaxRate;
    const discRate = nextInvoice.discountRate !== undefined ? Number(nextInvoice.discountRate) : 0;
    const other = nextInvoice.otherCharges !== undefined ? Number(nextInvoice.otherCharges) : 0;

    const calcs = calculateTotals(items, ship, ins, pkg, taxRate, discRate, other);

    setActiveInvoice({
      ...nextInvoice,
      subtotal: calcs.subtotal,
      discountAmount: calcs.discountAmount,
      taxAmount: calcs.taxAmount,
      grandTotal: calcs.grandTotal
    });
  };

  // Initialize new invoice draft
  const handleCreateNew = () => {
    const nextInvNum = getNextDocumentNumber('invoice', invoices);
    setActiveInvoice({
      title: 'COMMERCIAL INVOICE',
      invoiceNumber: nextInvNum,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days due
      currency: settings.defaultCurrency,
      salesperson: 'Andrew Admin',
      items: [],
      shippingFee: 0,
      insurance: 0,
      packagingFee: 0,
      taxRate: settings.defaultTaxRate,
      taxAmount: 0,
      discountRate: 0,
      discountAmount: 0,
      otherCharges: 0,
      subtotal: 0,
      grandTotal: 0,
      notes: 'All goods originate from China. Standards conform to ISO 9001.',
      terms: '30% deposit upon order placement, 70% against delivery drafts.',
      client: clients[0] || { id: 'temp', company: 'Global Importers', contactPerson: 'Agent', address: '', phone: '', email: '', country: 'USA', notes: '' }
    });
    setIsEditing(true);
  };

  // Handle direct view target from Dashboard / Global search or 'new' draft action
  useEffect(() => {
    if (activeDocId) {
      if (activeDocId === 'new') {
        handleCreateNew();
      } else {
        const found = invoices.find(inv => inv.id === activeDocId);
        if (found) {
          setActiveInvoice(found);
          setIsEditing(true);
        }
      }
      clearActiveDoc();
    }
  }, [activeDocId, invoices]);

  useEffect(() => {
    if (searchTarget && searchTarget.type === 'invoice') {
      const found = invoices.find(inv => inv.id === searchTarget.id);
      if (found) {
        setActiveInvoice(found);
        setIsEditing(true);
      }
      clearSearchTarget();
    }
  }, [searchTarget, invoices]);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => 
    inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    inv.client.company.toLowerCase().includes(search.toLowerCase()) ||
    inv.salesperson.toLowerCase().includes(search.toLowerCase())
  );

  // Calculations for Active Invoice
  const calculateTotals = (items: InvoiceItem[], ship: number, ins: number, pkg: number, taxRate: number, discRate: number, other: number) => {
    const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const discountAmount = subtotal * (discRate / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    const grandTotal = subtotal - discountAmount + taxAmount + Number(ship) + Number(ins) + Number(pkg) + Number(other);
    
    return {
      subtotal,
      discountAmount,
      taxAmount,
      grandTotal
    };
  };

  // Helper to sync subfields upon item change
  const updateInvoiceItems = (items: InvoiceItem[]) => {
    if (!activeInvoice) return;
    const ship = activeInvoice.shippingFee || 0;
    const ins = activeInvoice.insurance || 0;
    const pkg = activeInvoice.packagingFee || 0;
    const taxRate = activeInvoice.taxRate !== undefined ? activeInvoice.taxRate : settings.defaultTaxRate;
    const discRate = activeInvoice.discountRate || 0;
    const other = activeInvoice.otherCharges || 0;

    const calcs = calculateTotals(items, ship, ins, pkg, taxRate, discRate, other);

    setActiveInvoice(prev => ({
      ...prev,
      items,
      subtotal: calcs.subtotal,
      discountAmount: calcs.discountAmount,
      taxAmount: calcs.taxAmount,
      grandTotal: calcs.grandTotal
    }));
  };

  // Select client from database
  const handleSelectClient = (c: Client) => {
    handleFieldChange('client', c);
    setShowClientModal(false);
  };

  // Create client inline
  const handleInlineClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineClient.company || !inlineClient.contactPerson) return;

    const brandNew: Client = {
      id: generateId(),
      company: inlineClient.company,
      contactPerson: inlineClient.contactPerson,
      country: inlineClient.country || 'Egypt',
      address: inlineClient.address || '',
      phone: inlineClient.phone || '',
      email: inlineClient.email || '',
      notes: 'Registered inline during invoice creation.'
    };

    onSaveClients([brandNew, ...clients]);
    handleFieldChange('client', brandNew);
    setShowInlineClientForm(false);
    setInlineClient({ company: '', contactPerson: '', country: '' });
  };

  // Select product to add to invoice
  const handleSelectProduct = (p: Product) => {
    if (!activeInvoice) return;
    const currentItems = [...(activeInvoice.items || [])];

    const piecesPerBox = p.piecesPerBox || 100;
    // Standard quantity is 1 box volume initially or MOQ
    const initialQty = p.moq || piecesPerBox;
    const boxes = Math.ceil(initialQty / piecesPerBox);

    const newItem: InvoiceItem = {
      id: generateId(),
      productId: p.id,
      name: p.name,
      sku: p.sku,
      size: p.size || '',
      description: p.description,
      unitPrice: p.price,
      quantity: initialQty,
      piecesPerBox: piecesPerBox,
      numBoxes: boxes,
      totalPieces: initialQty,
      totalPrice: initialQty * p.price,
      image: p.image
    };

    if (itemIndexToEdit !== null) {
      currentItems[itemIndexToEdit] = newItem;
      setItemIndexToEdit(null);
    } else {
      currentItems.push(newItem);
    }

    updateInvoiceItems(currentItems);
    setShowProductModal(false);
  };

  // Manual non-library item insertion
  const handleAddManualItem = () => {
    if (!activeInvoice) return;
    const currentItems = [...(activeInvoice.items || [])];
    const newItem: InvoiceItem = {
      id: generateId(),
      name: 'Custom Plastic Molded Item',
      sku: 'CUSTOM-01',
      size: '28/410',
      description: 'Manufactured per custom specifications.',
      unitPrice: 1.0,
      quantity: 1000,
      piecesPerBox: 100,
      numBoxes: 10,
      totalPieces: 1000,
      totalPrice: 1000
    };
    currentItems.push(newItem);
    updateInvoiceItems(currentItems);
  };

  // Update specific item quantities/prices
  const handleItemRowChange = (index: number, key: keyof InvoiceItem, value: any) => {
    if (!activeInvoice) return;
    const currentItems = [...(activeInvoice.items || [])];
    const item = { ...currentItems[index] };

    if (key === 'quantity' || key === 'totalPieces') {
      const qty = Math.max(0, Number(value));
      item.quantity = qty;
      item.totalPieces = qty;
      item.numBoxes = Math.ceil(qty / (item.piecesPerBox || 100));
      item.totalPrice = qty * item.unitPrice;
    } else if (key === 'numBoxes') {
      const boxes = Math.max(1, Number(value));
      item.numBoxes = boxes;
      item.quantity = boxes * (item.piecesPerBox || 100);
      item.totalPieces = item.quantity;
      item.totalPrice = item.quantity * item.unitPrice;
    } else if (key === 'unitPrice') {
      const price = Math.max(0, Number(value));
      item.unitPrice = price;
      item.totalPrice = item.quantity * price;
    } else if (key === 'piecesPerBox') {
      const ppb = Math.max(1, Number(value));
      item.piecesPerBox = ppb;
      item.numBoxes = Math.ceil(item.quantity / ppb);
    } else {
      (item as any)[key] = value;
    }

    currentItems[index] = item;
    updateInvoiceItems(currentItems);
  };

  const handleRemoveItem = (index: number) => {
    if (!activeInvoice) return;
    const currentItems = [...(activeInvoice.items || [])];
    currentItems.splice(index, 1);
    updateInvoiceItems(currentItems);
  };

  const handleDuplicateItem = (index: number) => {
    if (!activeInvoice || !activeInvoice.items) return;
    const itemToClone = activeInvoice.items[index];
    if (!itemToClone) return;

    const clonedItem: InvoiceItem = {
      ...itemToClone,
      id: generateId()
    };

    const currentItems = [...activeInvoice.items];
    currentItems.splice(index + 1, 0, clonedItem);
    updateInvoiceItems(currentItems);
  };

  const handleDuplicateInvoice = (invoice: Invoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newInv: Invoice = {
      ...invoice,
      id: generateId(),
      invoiceNumber: `${invoice.invoiceNumber}-COPY`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    onSaveInvoices([newInv, ...invoices]);
    setActiveInvoice(newInv);
    setIsEditing(true);
  };

  // Save the full document to database
  const handleSaveInvoiceDocument = () => {
    if (!activeInvoice) return;
    if (!activeInvoice.invoiceNumber) {
      alert("Invoice Number is required");
      return;
    }

    const doc = { ...activeInvoice } as Invoice;
    doc.createdAt = doc.createdAt || new Date().toISOString();

    let nextInvoices: Invoice[];
    if (doc.id) {
      nextInvoices = invoices.map(i => i.id === doc.id ? doc : i);
    } else {
      doc.id = generateId();
      nextInvoices = [doc, ...invoices];
    }

    onSaveInvoices(nextInvoices);
    setIsEditing(false);
    setActiveInvoice(null);
  };

  const handleDeleteInvoice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = window.confirm("Are you sure you want to permanently delete this Invoice?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const next = invoices.filter(i => i.id !== id);
      onSaveInvoices(next);
    }
  };

  const handlePrint = () => {
    printDocument('print-area');
  };

  // PDF Download Execution
  const handleDownloadPDF = async () => {
    if (!activeInvoice) return;
    setIsDownloading(true);
    try {
      await exportDocumentToPDF('print-area', activeInvoice.invoiceNumber || 'Commercial_Invoice');
    } catch (err) {
      console.error('PDF generation failed:', err);
      printDocument('print-area');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* List / Form toggles */}
      {!isEditing ? (
        <div className="space-y-6 print:hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="text-[#1565C0]" size={22} />
                {t('invoice.title', 'Commercial Invoice Generator')}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {t('invoice.subtitle', 'Draft and print highly compliant, beautifully structured A4 commercial export invoices.')}
              </p>
            </div>
            
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1565C0] text-white hover:bg-blue-700 text-xs font-black transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <Plus size={14} /> {t('invoice.new_invoice', 'New Export Invoice')}
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('invoice.search_placeholder', 'Search invoices by document number, client...')} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold">{filteredInvoices.length} {t('invoice.invoices_recorded', 'Invoices Recorded')}</span>
          </div>

          {/* Ledger Table */}
          {filteredInvoices.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <FileText size={24} />
              </div>
              <p className="text-xs font-semibold text-slate-600">{t('invoice.no_invoices', 'No invoices logged.')}</p>
              <p className="text-[10px] mt-1">{language === 'zh' ? '点击“新建商业发票”开始制作发票。' : 'Tap "New Export Invoice" to compile a fresh document.'}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">{t('invoice.invoice_number', 'Invoice No')}</th>
                      <th className="py-3 px-4">{t('invoice.issue_date', 'Date Issued')}</th>
                      <th className="py-3 px-4">{t('invoice.client', 'Client Importer')}</th>
                      <th className="py-3 px-4">{t('invoice.salesperson', 'Salesperson')}</th>
                      <th className="py-3 px-4">{t('invoice.total_amount', 'Grand Total')}</th>
                      <th className="py-3 px-4 text-right">{t('common.actions', 'Actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredInvoices.map(inv => (
                      <tr 
                        key={inv.id}
                        onClick={() => {
                          setActiveInvoice(inv);
                          setIsEditing(true);
                        }}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-800">{inv.invoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{inv.client.company}</td>
                        <td className="py-3 px-4 text-slate-500">{inv.salesperson}</td>
                        <td className="py-3 px-4 font-black text-[#1565C0]">{inv.currency} {inv.grandTotal.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveInvoice(inv);
                                setIsEditing(true);
                              }}
                              className="p-1.5 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                              title="Edit"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDuplicateInvoice(inv, e)}
                              className="p-1.5 rounded text-slate-500 hover:text-[#1565C0] hover:bg-blue-50 cursor-pointer transition-colors"
                              title="Duplicate Commercial Invoice"
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteInvoice(inv.id, e)}
                              className="p-1.5 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Form Editor Side-By-Side Preview Panel */
        <div className="space-y-4">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3.5 sm:p-4 rounded-xl shadow-xs print:hidden">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => {
                    requestActionWithGuard(() => {
                      setIsEditing(false);
                      setActiveInvoice(null);
                    });
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 active:scale-95 cursor-pointer"
                  title={language === 'zh' ? '返回发票列表' : 'Back to ledger'}
                >
                  <X size={16} />
                </button>
                <div>
                  <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {language === 'zh' ? '商业发票编辑器' : 'Export Invoice Editor'}
                  </h2>
                  <p className="text-sm font-black text-slate-800 leading-tight">{activeInvoice.invoiceNumber || 'INV-Draft'}</p>
                </div>
              </div>

              {/* Mobile / Tablet Segmented View Switcher (visible < lg) */}
              <div className="flex bg-slate-100 p-1 rounded-xl lg:hidden">
                <button
                  type="button"
                  onClick={() => setMobileTab('form')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mobileTab === 'form' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Edit2 size={12} />
                  <span>{language === 'zh' ? '编辑表单' : 'Form'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mobileTab === 'preview' ? 'bg-white text-[#1565C0] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Eye size={12} />
                  <span>{language === 'zh' ? 'A4预览' : 'A4'}</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button 
                type="button"
                onClick={() => {
                  if (activeInvoice) {
                    handleDuplicateInvoice(activeInvoice as Invoice);
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-[#1565C0] text-xs font-bold transition-all cursor-pointer active:scale-95"
                title={language === 'zh' ? '复制此商业发票' : 'Duplicate this Commercial Invoice'}
              >
                <Copy size={13} /> <span className="hidden sm:inline">{language === 'zh' ? '复制发票' : 'Duplicate'}</span>
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer active:scale-95"
                title={language === 'zh' ? '打印或另存为 PDF' : 'Print or Save as PDF via Print'}
              >
                <Printer size={13} /> {language === 'zh' ? '打印' : 'Print'}
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full mr-1"></span>
                    {language === 'zh' ? '生成中...' : 'Generating...'}
                  </span>
                ) : (
                  <>
                    <Download size={13} /> <span className="hidden xs:inline">{language === 'zh' ? '下载' : 'Download'}</span> PDF
                  </>
                )}
              </button>
              <button 
                onClick={handleSaveInvoiceDocument}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-lg bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-xs active:scale-95 cursor-pointer"
              >
                <Check size={13} /> {language === 'zh' ? '保存并提交' : 'Save & Commit'}
              </button>
            </div>
          </div>

          {/* S-B-S Panels with Mobile View Responsiveness */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Side Form Fields (lg:col-span-6) */}
            <div className={`space-y-6 lg:col-span-6 print:hidden ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              {/* Document Registry Data */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Database size={12} /> {language === 'zh' ? '单据登记信息' : 'Registry Particulars'}
                </span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '单据大标题' : 'Document Title / Header'}
                    </label>
                    <input 
                      type="text" 
                      value={activeInvoice.title || ''}
                      placeholder="COMMERCIAL INVOICE"
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-extrabold text-[#1565C0] placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '发票编号' : 'Invoice Number'}
                    </label>
                    <input 
                      type="text" 
                      value={activeInvoice.invoiceNumber || ''}
                      onChange={(e) => handleFieldChange('invoiceNumber', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '业务经办人 / 业务员' : 'Sales Representative'}
                    </label>
                    <input 
                      type="text" 
                      value={activeInvoice.salesperson || ''}
                      onChange={(e) => handleFieldChange('salesperson', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '开票日期' : 'Invoice Date'}
                    </label>
                    <input 
                      type="date" 
                      value={activeInvoice.date || ''}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '付款截止日' : 'Due Date'}
                    </label>
                    <input 
                      type="date" 
                      value={activeInvoice.dueDate || ''}
                      onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1.5">
                      <Coins size={12} /> {language === 'zh' ? '结算币种选择' : 'Currency Selection'}
                    </label>
                    <select 
                      value={activeInvoice.currency || 'USD'}
                      onChange={(e) => handleFieldChange('currency', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold"
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

              {/* Client Selector */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={12} /> {language === 'zh' ? '收货人 / 进口商 (Consignee)' : 'Consignee Importer'}
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInlineClientForm(!showInlineClientForm)}
                      className="text-[10px] text-[#1565C0] font-bold hover:underline flex items-center gap-0.5"
                    >
                      <UserPlus size={10} /> {showInlineClientForm 
                        ? (language === 'zh' ? '取消登记' : 'Cancel Add') 
                        : (language === 'zh' ? '快速登记新客户' : 'Quick Register Client')}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setShowClientModal(true)}
                      className="text-[10px] text-[#1565C0] font-bold hover:underline"
                    >
                      {language === 'zh' ? '从客户库选择' : 'Select From Files'}
                    </button>
                  </div>
                </div>

                {showInlineClientForm ? (
                  <form onSubmit={handleInlineClientSubmit} className="bg-slate-50 p-3 rounded-lg border border-slate-150 space-y-3">
                    <p className="text-[9px] font-bold text-[#1565C0] uppercase">
                      {language === 'zh' ? '登记客户档案' : 'Register Client File'}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <input 
                          type="text" 
                          placeholder={language === 'zh' ? '公司名称 (Company Name)' : 'Company Name'}
                          required
                          value={inlineClient.company || ''}
                          onChange={(e) => setInlineClient(prev => ({ ...prev, company: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <input 
                          type="text" 
                          placeholder={language === 'zh' ? '联系人 / 经办人 (Contact Person)' : 'Contact Person (Agent)'}
                          required
                          value={inlineClient.contactPerson || ''}
                          onChange={(e) => setInlineClient(prev => ({ ...prev, contactPerson: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                        />
                      </div>
                      <div>
                        <input 
                          type="text" 
                          placeholder={language === 'zh' ? '国家 / 地区 (Country)' : 'Country'}
                          required
                          value={inlineClient.country || ''}
                          onChange={(e) => setInlineClient(prev => ({ ...prev, country: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button 
                        type="button" 
                        onClick={() => setShowInlineClientForm(false)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] text-slate-500 cursor-pointer"
                      >
                        {language === 'zh' ? '取消' : 'Cancel'}
                      </button>
                      <button 
                        type="submit" 
                        className="px-3 py-1 bg-[#1565C0] text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        {language === 'zh' ? '登记并套用' : 'Register Importer'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <p className="text-[9px] text-[#1565C0] font-bold uppercase tracking-widest">{activeInvoice.client?.country || 'USA'}</p>
                    <p className="font-extrabold text-slate-800 text-xs mt-1">{activeInvoice.client?.company || (language === 'zh' ? '未关联客户' : 'No client registered')}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Attn: {activeInvoice.client?.contactPerson || 'N/A'}</p>
                    {activeInvoice.client?.address && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{activeInvoice.client.address}</p>}
                  </div>
                )}
              </div>

              {/* Invoice Product Items */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={12} /> {language === 'zh' ? '发票产品行明细' : 'Product Line Ledger'}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddManualItem}
                      className="text-[10px] text-slate-500 font-bold hover:underline"
                    >
                      {language === 'zh' ? '手动新增单行' : 'Manual Entry'}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setItemIndexToEdit(null);
                        setShowProductModal(true);
                      }}
                      className="text-[10px] text-[#1565C0] font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus size={10} /> {language === 'zh' ? '从产品库添加' : 'Add From Library'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 divide-y divide-slate-100">
                  {(!activeInvoice.items || activeInvoice.items.length === 0) ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      {language === 'zh' 
                        ? '发票暂未添加任何产品。点击“从产品库添加”或“手动新增单行”快速填入。' 
                        : 'No products added to invoice. Click "Add From Library" to fill details automatically.'}
                    </div>
                  ) : (
                    activeInvoice.items.map((item, index) => (
                      <div key={item.id} className={`pt-3 first:pt-0 space-y-2.5`}>
                        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                          {/* Item image with upload */}
                          <div className="relative w-11 h-11 bg-white rounded-md border border-slate-200 flex items-center justify-center overflow-hidden group shrink-0 shadow-2xs">
                            {item.image ? (
                              <img src={item.image} alt="" className="max-w-full max-h-full object-contain p-0.5" referrerPolicy="no-referrer" />
                            ) : (
                              <Package size={14} className="text-slate-300" />
                            )}
                            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white font-extrabold cursor-pointer transition-opacity">
                              Upload
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

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-[9px] font-mono font-semibold text-slate-400">SKU: {item.sku}</span>
                              <span className="text-[9px] text-slate-300">•</span>
                              <span className="text-[9px] font-semibold text-[#1565C0] flex items-center gap-1">
                                Size: 
                                <input 
                                  type="text" 
                                  value={item.size || ''} 
                                  onChange={(e) => handleItemRowChange(index, 'size', e.target.value)}
                                  className="bg-transparent border-b border-slate-200 hover:border-slate-400 focus:border-[#1565C0] focus:outline-hidden font-bold w-16 px-0.5 text-[9px]"
                                  placeholder="e.g. 28/410"
                                />
                              </span>
                            </div>
                            <input 
                              type="text"
                              value={item.name}
                              onChange={(e) => handleItemRowChange(index, 'name', e.target.value)}
                              className="w-full bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#1565C0] text-xs font-extrabold text-slate-800 leading-tight mt-0.5 outline-hidden"
                              title="Click to edit item name"
                              placeholder="Product Name"
                            />
                          </div>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {onSaveProducts && (
                              <button
                                type="button"
                                onClick={() => {
                                  const p: Product = {
                                    id: item.productId || generateId(),
                                    name: item.name || 'Custom Item',
                                    sku: item.sku || '',
                                    category: 'Custom & Components',
                                    description: item.description || item.name || '',
                                    color: 'Standard',
                                    material: 'Plastic/Metal',
                                    weight: 0.001,
                                    price: item.unitPrice || 0,
                                    moq: item.piecesPerBox || 10000,
                                    piecesPerBox: item.piecesPerBox || 10000,
                                    cartonLength: 30,
                                    cartonWidth: 30,
                                    cartonHeight: 25,
                                    grossWeight: 10,
                                    netWeight: 9.5,
                                    countryOfOrigin: 'China',
                                    size: item.size || '',
                                    image: item.image,
                                    notes: 'Added from invoice generator line item.'
                                  };
                                  const existingIdx = products.findIndex(existing => existing.id === p.id || (p.sku && p.sku !== '' && existing.sku === p.sku));
                                  let next: Product[];
                                  if (existingIdx >= 0) {
                                    next = [...products];
                                    next[existingIdx] = { ...next[existingIdx], ...p };
                                  } else {
                                    next = [p, ...products];
                                  }
                                  onSaveProducts(next);
                                  alert(`"${p.name}" has been saved to your Product Library!`);
                                }}
                                className="text-[9px] font-bold text-[#1565C0] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-md transition-all cursor-pointer"
                                title="Save or update this product in Product Library"
                              >
                                + Save to Library
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(index)}
                              className="text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Duplicate line item"
                            >
                              <Copy size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              className="text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Calculations Row - Responsive 2-col on Mobile, 4-col on Tablet/Desktop */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 items-end">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                              {language === 'zh' ? '数量 (Pcs)' : 'Qty (Pcs)'}
                            </label>
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => handleItemRowChange(index, 'quantity', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                              {language === 'zh' ? '单价' : 'Unit Price'} ({activeInvoice.currency || 'USD'})
                            </label>
                            <input 
                              type="number" 
                              step="any"
                              value={item.unitPrice}
                              onChange={(e) => handleItemRowChange(index, 'unitPrice', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-mono"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">
                              {language === 'zh' ? '单箱装量' : 'Pcs/Box'}
                            </label>
                            <input 
                              type="number" 
                              value={item.piecesPerBox}
                              onChange={(e) => handleItemRowChange(index, 'piecesPerBox', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">
                              {language === 'zh' ? '箱数' : 'Boxes'}
                            </label>
                            <input 
                              type="number" 
                              value={item.numBoxes || Math.ceil(item.quantity / (item.piecesPerBox || 100))}
                              onChange={(e) => handleItemRowChange(index, 'numBoxes', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-[#1565C0]"
                            />
                          </div>
                        </div>

                        {/* Total Line price representation */}
                        <div className="text-right text-[10px] text-slate-500 font-semibold">
                          {language === 'zh' ? '行总金额' : 'Total Value'}: <span className="font-bold text-slate-700">{getCurrencySymbol(activeInvoice.currency)}{(item.unitPrice * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Adjustments & Logistics Charges */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Calculator size={12} /> {language === 'zh' ? '费用加项、折扣与税费调整' : 'Surcharges & Adjustments'}
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '海运/快递运费' : 'Shipping Fee'}
                    </label>
                    <input 
                      type="number" 
                      value={activeInvoice.shippingFee !== undefined ? activeInvoice.shippingFee : ''}
                      onChange={(e) => handleFieldChange('shippingFee', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '海运保险费' : 'Insurance Fee'}
                    </label>
                    <input 
                      type="number" 
                      value={activeInvoice.insurance !== undefined ? activeInvoice.insurance : ''}
                      onChange={(e) => handleFieldChange('insurance', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '打包/木架费' : 'Packaging Fee'}
                    </label>
                    <input 
                      type="number" 
                      value={activeInvoice.packagingFee !== undefined ? activeInvoice.packagingFee : ''}
                      onChange={(e) => handleFieldChange('packagingFee', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '增值税率 (%)' : 'Tax Rate (%)'}
                    </label>
                    <input 
                      type="number" 
                      value={activeInvoice.taxRate !== undefined ? activeInvoice.taxRate : ''}
                      onChange={(e) => handleFieldChange('taxRate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '商业折扣率 (%)' : 'Discount Rate (%)'}
                    </label>
                    <input 
                      type="number" 
                      value={activeInvoice.discountRate !== undefined ? activeInvoice.discountRate : ''}
                      onChange={(e) => handleFieldChange('discountRate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                      {language === 'zh' ? '其他杂费' : 'Other Surcharges'}
                    </label>
                    <input 
                      type="number" 
                      value={activeInvoice.otherCharges !== undefined ? activeInvoice.otherCharges : ''}
                      onChange={(e) => handleFieldChange('otherCharges', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Terms and notes */}
                <div className="space-y-3.5 pt-2 border-t border-slate-100">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                      {language === 'zh' ? '收款账户结算方式' : 'Payment Method Type'}
                    </label>
                    <select
                      value={activeInvoice.paymentMethodType || 'international'}
                      onChange={(e) => handleFieldChange('paymentMethodType', e.target.value as 'international' | 'local_rmb' | 'both')}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-[#1565C0] focus:outline-hidden focus:ring-1 focus:ring-[#1565C0]"
                    >
                      <option value="international">
                        {language === 'zh' ? '🌐 国际电汇账户 (USD / 外币 SWIFT 电汇)' : '🌐 International Wire Transfer (USD / Foreign SWIFT)'}
                      </option>
                      <option value="local_rmb">
                        {language === 'zh' ? '🇨🇳 国内人民币结算 (微信 / 支付宝 / 农行卡号)' : '🇨🇳 Domestic RMB Payment (Alipay / WeChat / ABC Local Bank)'}
                      </option>
                      <option value="both">
                        {language === 'zh' ? '🔄 国际电汇 + 国内人民币双重显示' : '🔄 Both International & Domestic RMB'}
                      </option>
                    </select>
                  </div>

                  {(!activeInvoice.paymentMethodType || activeInvoice.paymentMethodType === 'international' || activeInvoice.paymentMethodType === 'both') && (
                    <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={activeInvoice.showBankDetails !== false}
                            onChange={(e) => handleFieldChange('showBankDetails', e.target.checked)}
                            className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                          />
                          <span className="text-[10px] font-bold text-slate-700 uppercase">
                            {language === 'zh' ? '显示国际电汇银行信息 (SWIFT)' : 'Include International Wire Details'}
                          </span>
                        </label>
                        {activeInvoice.showBankDetails !== false && (
                          <input
                            type="text"
                            value={activeInvoice.bankTitle || ''}
                            onChange={(e) => handleFieldChange('bankTitle', e.target.value)}
                            placeholder={language === 'zh' ? '标题 (默认: WIRE SETTLEMENT)' : 'Title (Default: WIRE SETTLEMENT)'}
                            className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-44 text-right"
                          />
                        )}
                      </div>

                      {activeInvoice.showBankDetails !== false ? (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                {language === 'zh' ? '收款银行 (Bank Name)' : 'Bank Name'}
                              </label>
                              <input
                                type="text"
                                value={activeInvoice.bankName ?? settings.bankName ?? ''}
                                onChange={(e) => handleFieldChange('bankName', e.target.value)}
                                placeholder={settings.bankName || 'Bank Name'}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                {language === 'zh' ? '支行 / 分行 (Branch)' : 'Branch'}
                              </label>
                              <input
                                type="text"
                                value={activeInvoice.branch ?? settings.branch ?? ''}
                                onChange={(e) => handleFieldChange('branch', e.target.value)}
                                placeholder={settings.branch || 'Branch'}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                {language === 'zh' ? '收款人名称 (Beneficiary)' : 'Beneficiary Name'}
                              </label>
                              <input
                                type="text"
                                value={activeInvoice.accountName ?? settings.accountName ?? ''}
                                onChange={(e) => handleFieldChange('accountName', e.target.value)}
                                placeholder={settings.accountName || 'Beneficiary Name'}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                {language === 'zh' ? '银行账号 / IBAN' : 'Account Number'}
                              </label>
                              <input
                                type="text"
                                value={activeInvoice.accountNumber ?? settings.accountNumber ?? ''}
                                onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                                placeholder={settings.accountNumber || 'Account Number'}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                {language === 'zh' ? 'SWIFT / BIC 代码' : 'SWIFT Code'}
                              </label>
                              <input
                                type="text"
                                value={activeInvoice.swift ?? settings.swift ?? ''}
                                onChange={(e) => handleFieldChange('swift', e.target.value)}
                                placeholder={settings.swift || 'SWIFT Code'}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">
                                {language === 'zh' ? 'IBAN (欧洲地区选填)' : 'IBAN (Optional)'}
                              </label>
                              <input
                                type="text"
                                value={activeInvoice.iban ?? settings.iban ?? ''}
                                onChange={(e) => handleFieldChange('iban', e.target.value)}
                                placeholder={settings.iban || 'IBAN'}
                                className="w-full bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic">
                          {language === 'zh' ? '国际电汇信息已隐藏。' : 'International wire details are hidden from this invoice.'}
                        </p>
                      )}
                    </div>
                  )}

                  {(activeInvoice.paymentMethodType === 'local_rmb' || activeInvoice.paymentMethodType === 'both') && (
                    <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3 text-xs">
                      <div className="font-bold text-[#07C160] text-xs flex items-center justify-between">
                        <span>{language === 'zh' ? '国内人民币结算信息' : 'Domestic RMB Settlement Details'}</span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {language === 'zh' ? '已自动套用' : 'Auto-synced'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 block">
                            {language === 'zh' ? '开户行 (Bank Branch)' : '开户行 (Bank Branch)'}
                          </label>
                          <input
                            type="text"
                            value={activeInvoice.localBankName || settings.localBankName || '农业银行衢州衢化支行'}
                            onChange={(e) => handleFieldChange('localBankName', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">
                              {language === 'zh' ? '户名 (Account Name)' : '户名 (Account Name)'}
                            </label>
                            <input
                              type="text"
                              value={activeInvoice.localAccountName || settings.localAccountName || '徐叶兵'}
                              onChange={(e) => handleFieldChange('localAccountName', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-medium"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block">
                              {language === 'zh' ? '卡号 (Card Number)' : '卡号 (Card Number)'}
                            </label>
                            <input
                              type="text"
                              value={activeInvoice.localAccountNumber || settings.localAccountNumber || '6228481077103681570'}
                              onChange={(e) => handleFieldChange('localAccountNumber', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono font-bold"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/50">
                          <div>
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">微信 WeChat QR</span>
                            <div className="flex items-center gap-2">
                              <img src={activeInvoice.wechatQr || settings.wechatQr} alt="WeChat QR" className="w-8 h-8 object-contain border rounded bg-white" referrerPolicy="no-referrer" />
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
                            <span className="text-[10px] font-bold text-slate-500 block mb-1">支付宝 Alipay QR</span>
                            <div className="flex items-center gap-2">
                              <img src={activeInvoice.alipayQr || settings.alipayQr} alt="Alipay QR" className="w-8 h-8 object-contain border rounded bg-white" referrerPolicy="no-referrer" />
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
                          checked={activeInvoice.showNotes !== false}
                          onChange={(e) => handleFieldChange('showNotes', e.target.checked)}
                          className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
                          {language === 'zh' ? '包含出口商声明与说明' : 'Include Declarations / Notes'}
                        </span>
                      </label>
                      {activeInvoice.showNotes !== false && (
                        <input
                          type="text"
                          value={activeInvoice.notesTitle || ''}
                          onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                          placeholder={language === 'zh' ? '标题 (默认: DECLARATIONS / COMPLIANCE)' : 'Title (Default: DECLARATIONS / COMPLIANCE)'}
                          className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-52 text-right"
                        />
                      )}
                    </div>
                    {activeInvoice.showNotes !== false ? (
                      <>
                        <textarea 
                          rows={2}
                          value={activeInvoice.notes || ''}
                          onChange={(e) => handleFieldChange('notes', e.target.value)}
                          placeholder={language === 'zh' ? '输入出口商合规声明、质量保证等...' : 'Enter declarations, compliance notes, certifications...'}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 leading-relaxed resize-y"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('notes', 'We hereby certify that this invoice is true and correct, and that the goods are of China origin and manufactured under strict quality standards.')}
                            className="text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + {language === 'zh' ? '标准出口声明模版' : 'Standard Exporter Declaration'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        {language === 'zh' ? '出口声明已从发票中隐藏。' : 'Declarations / notes section is hidden from this commercial invoice.'}
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeInvoice.showTerms !== false}
                          onChange={(e) => handleFieldChange('showTerms', e.target.checked)}
                          className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                        />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">
                          {language === 'zh' ? '包含付款条款说明' : 'Include Terms of Payment'}
                        </span>
                      </label>
                      {activeInvoice.showTerms !== false && (
                        <input
                          type="text"
                          value={activeInvoice.termsTitle || ''}
                          onChange={(e) => handleFieldChange('termsTitle', e.target.value)}
                          placeholder={language === 'zh' ? '标题 (默认: TERMS OF PAYMENT)' : 'Title (Default: TERMS OF PAYMENT)'}
                          className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-48 text-right"
                        />
                      )}
                    </div>
                    {activeInvoice.showTerms !== false ? (
                      <>
                        <textarea 
                          rows={2}
                          value={activeInvoice.terms || ''}
                          onChange={(e) => handleFieldChange('terms', e.target.value)}
                          placeholder={language === 'zh' ? '输入国际电汇结算条款、定金比例等...' : 'Enter payment terms, balance details, wire instructions...'}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 leading-relaxed resize-y"
                        />
                        <div className="flex flex-wrap gap-1 mt-1">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('terms', 'Payment by T/T: 30% advance deposit paid, 70% balance paid prior to release of original shipping documents / B/L.')}
                            className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + {language === 'zh' ? '30%定金 / 70%尾款' : '30% Deposit / 70% Balance'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFieldChange('terms', '100% full payment received by wire transfer prior to shipment dispatch.')}
                            className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                          >
                            + {language === 'zh' ? '100%发货前结清' : '100% Paid in Full'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">
                        {language === 'zh' ? '付款条款已从发票中隐藏。' : 'Terms of payment section is hidden from this commercial invoice.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side Live A4 Visual Preview (lg:col-span-6) */}
            <div className={`lg:col-span-6 flex flex-col items-center w-full min-w-0 ${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="w-full flex items-center justify-between gap-2 mb-2.5 px-1 print:hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <Eye size={12} className="text-[#1565C0]" /> Live A4 Export Preview
                </span>

                {/* Zoom & Fit Toolbar */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(prev => Math.max(40, prev - 15))}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={13} />
                  </button>
                  <span className="text-[10px] font-mono font-bold text-slate-600 px-1.5 min-w-10 text-center">
                    {previewZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(prev => Math.min(150, prev + 15))}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(100)}
                    className="px-1.5 py-0.5 text-[9px] font-semibold text-slate-500 hover:text-[#1565C0] hover:bg-slate-50 rounded transition-colors ml-0.5 cursor-pointer"
                    title="Reset Zoom (100%)"
                  >
                    100%
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(65)}
                    className="px-1.5 py-0.5 text-[9px] font-semibold text-[#1565C0] bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                    title="Fit on Mobile Screen (65%)"
                  >
                    Fit
                  </button>
                </div>
              </div>

              {/* Responsive Scroll & Scale Container */}
              <div className="w-full overflow-x-auto overflow-y-visible pb-4 pt-1 flex justify-center bg-slate-200/40 rounded-2xl border border-slate-200/80 p-2 sm:p-4">
                <div 
                  style={{ 
                    transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                    transformOrigin: 'top center',
                    marginBottom: previewZoom !== 100 ? `${(previewZoom - 100) * 3}px` : undefined
                  }}
                  className="transition-transform duration-150 origin-top shrink-0 max-w-full"
                >
                  {/* Realistic A4 Page Wrap Container */}
                  <div 
                    id="print-area"
                    className="w-full max-w-[210mm] min-h-[296mm] bg-white border border-slate-200 shadow-xl rounded-none p-4 sm:p-8 md:p-[12mm] text-slate-800 flex flex-col justify-between font-sans relative shrink-0 box-border overflow-hidden transition-all duration-150 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none"
                  >
                {/* Print Layout Header */}
                <div className="space-y-4 sm:space-y-5">
                  {/* Company info logo block */}
                  <div className="flex flex-col sm:flex-row justify-between items-start border-b-2 border-slate-100 pb-4 sm:pb-6 gap-4 sm:gap-6">
                    <div className="space-y-2 max-w-full sm:max-w-[60%]">
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
                        value={activeInvoice.title || 'COMMERCIAL INVOICE'}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className="text-left sm:text-right bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#1565C0] text-xl font-black text-[#1565C0] uppercase tracking-tight w-full outline-hidden"
                        title="Click to edit document title"
                        placeholder="COMMERCIAL INVOICE"
                      />
                      <div className="mt-2 sm:mt-3 grid grid-cols-2 gap-x-2.5 gap-y-1 text-[9px] text-slate-500 leading-normal font-semibold text-left justify-end">
                        <span className="font-bold text-slate-400 text-left sm:text-right">Invoice No:</span>
                        <span className="font-bold text-slate-800">{activeInvoice.invoiceNumber}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Date:</span>
                        <span className="text-slate-800">{activeInvoice.date}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Due Date:</span>
                        <span className="text-slate-800">{activeInvoice.dueDate}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Currency:</span>
                        <select
                          value={activeInvoice.currency || 'USD'}
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

                  {/* Consignee and shipment addresses */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Consignee (Importer)</span>
                      <p className="text-xs font-black text-slate-800">{activeInvoice.client?.company}</p>
                      <div className="text-[9px] text-slate-500 leading-normal font-semibold">
                        <p>Attn: {activeInvoice.client?.contactPerson}</p>
                        <p>{activeInvoice.client?.address}</p>
                        <p>{activeInvoice.client?.country}</p>
                        {activeInvoice.client?.phone && <p>Phone: {activeInvoice.client.phone}</p>}
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-100 rounded-lg space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Operational Dispatcher</span>
                      <p className="text-xs font-extrabold text-slate-800">{settings.name}</p>
                      <div className="text-[9px] text-slate-500 leading-normal font-semibold">
                        <p>Salesperson: {activeInvoice.salesperson}</p>
                        <p>Origin: {settings.country}</p>
                        <p>Contact: {settings.whatsapp || settings.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto w-full -mx-1 sm:mx-0">
                    <table className="w-full min-w-[500px] text-left border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-[#1565C0] text-white font-bold uppercase text-[8px] border-b border-[#1565C0]">
                          <th className="py-2 px-2 rounded-l">Item Description</th>
                          <th className="py-2 px-2 text-center">Size / NK</th>
                          <th className="py-2 px-2 text-center">Box Volume</th>
                          <th className="py-2 px-2 text-right">Quantity (Pcs)</th>
                          <th className="py-2 px-2 text-right">Unit Price ({activeInvoice.currency || 'USD'})</th>
                          <th className="py-2 px-2 text-right rounded-r">Total ({activeInvoice.currency || 'USD'})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 leading-tight font-semibold text-slate-700">
                        {(!activeInvoice.items || activeInvoice.items.length === 0) ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-400">
                              No product item entries mapped.
                            </td>
                          </tr>
                        ) : (
                          activeInvoice.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  {item.image && <img src={item.image} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />}
                                  <div>
                                    <p className="font-extrabold text-slate-800">{item.name}</p>
                                    <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-semibold flex-wrap">
                                      <span>SKU: {item.sku}</span>
                                      {item.description && (
                                        <>
                                          <span>•</span>
                                          <span className="text-slate-500 max-w-sm">{item.description}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center font-bold font-mono text-slate-800">{item.size || '-'}</td>
                              <td className="py-2 px-2 text-center">{item.numBoxes} Box <span className="text-[8px] text-slate-400">({item.piecesPerBox} Pcs/Box)</span></td>
                              <td className="py-2 px-2 text-right font-bold">{item.quantity.toLocaleString()}</td>
                              <td className="py-2 px-2 text-right font-mono">{formatUnitPrice(item.unitPrice, activeInvoice.currency)}</td>
                              <td className="py-2 px-2 text-right font-bold text-slate-800">{getCurrencySymbol(activeInvoice.currency)}{(item.unitPrice * item.quantity).toFixed(2)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals & Notes Section */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 pt-4 border-t border-slate-100">
                    <div className="col-span-1 md:col-span-7 space-y-4">
                      {/* Dynamic Bank Settlement Coordinates (Fully Editable inline) */}
                      {(!activeInvoice.paymentMethodType || activeInvoice.paymentMethodType === 'international' || activeInvoice.paymentMethodType === 'both') && (
                        activeInvoice.showBankDetails !== false ? (
                          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1 text-[8px] text-slate-500 leading-normal font-semibold group relative">
                            <div className="flex items-center justify-between pb-0.5 border-b border-slate-200/60">
                              <input
                                type="text"
                                value={activeInvoice.bankTitle || 'Beneficiary Bank Settlement Coordinates (International Wire)'}
                                onChange={(e) => handleFieldChange('bankTitle', e.target.value)}
                                className="font-black text-slate-400 uppercase tracking-widest block bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                                title="Click to edit section title"
                              />
                              <button
                                type="button"
                                onClick={() => handleFieldChange('showBankDetails', false)}
                                className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                                title="Hide international wire details from this invoice"
                              >
                                ✕ Remove
                              </button>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-slate-700 shrink-0">Bank:</span>
                              <input
                                type="text"
                                value={activeInvoice.bankName ?? settings.bankName ?? ''}
                                onChange={(e) => handleFieldChange('bankName', e.target.value)}
                                placeholder="Bank Name"
                                className="font-extrabold text-slate-700 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] flex-1"
                              />
                              <span className="text-slate-400 font-normal shrink-0">(</span>
                              <input
                                type="text"
                                value={activeInvoice.branch ?? settings.branch ?? ''}
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
                                value={activeInvoice.accountName ?? settings.accountName ?? ''}
                                onChange={(e) => handleFieldChange('accountName', e.target.value)}
                                placeholder="Beneficiary Account Name"
                                className="font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              />
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="shrink-0 text-slate-500">Account No:</span>
                              <input
                                type="text"
                                value={activeInvoice.accountNumber ?? settings.accountNumber ?? ''}
                                onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                                placeholder="Account Number"
                                className="font-mono font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              />
                            </div>

                            {(activeInvoice.iban !== undefined ? activeInvoice.iban : settings.iban) ? (
                              <div className="flex items-center gap-1">
                                <span className="font-mono shrink-0 text-slate-500">IBAN:</span>
                                <input
                                  type="text"
                                  value={activeInvoice.iban ?? settings.iban ?? ''}
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
                                value={activeInvoice.swift ?? settings.swift ?? ''}
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

                      {(activeInvoice.paymentMethodType === 'local_rmb' || activeInvoice.paymentMethodType === 'both') && (
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
                                value={activeInvoice.localBankName || settings.localBankName || ''}
                                onChange={(e) => handleFieldChange('localBankName', e.target.value)}
                                placeholder="农业银行衢州衢化支行"
                                className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-dashed hover:border-emerald-300 focus:border-[#07C160] outline-hidden text-[8px] w-full"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="shrink-0">户名 Account Name:</span>
                              <input
                                type="text"
                                value={activeInvoice.localAccountName || settings.localAccountName || ''}
                                onChange={(e) => handleFieldChange('localAccountName', e.target.value)}
                                placeholder="户名"
                                className="font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-dashed hover:border-emerald-300 focus:border-[#07C160] outline-hidden text-[8px] w-full"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="font-mono shrink-0">卡号 Card No:</span>
                              <input
                                type="text"
                                value={activeInvoice.localAccountNumber || settings.localAccountNumber || ''}
                                onChange={(e) => handleFieldChange('localAccountNumber', e.target.value)}
                                placeholder="卡号"
                                className="font-mono font-extrabold text-slate-900 bg-transparent border-b border-transparent hover:border-dashed hover:border-emerald-300 focus:border-[#07C160] outline-hidden text-[9px] w-full"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-5 pt-2 border-t border-emerald-100/80">
                            {(activeInvoice.wechatQr || settings.wechatQr) && (
                              <div className="text-center">
                                <img 
                                  src={activeInvoice.wechatQr || settings.wechatQr} 
                                  alt="WeChat QR" 
                                  className="w-28 h-28 sm:w-32 sm:h-32 object-contain border-2 border-emerald-200 rounded-lg p-1 bg-white mx-auto shadow-xs" 
                                  referrerPolicy="no-referrer" 
                                />
                                <span className="text-[9px] text-[#07C160] font-black block mt-1">微信 Pay QR</span>
                              </div>
                            )}

                            {(activeInvoice.alipayQr || settings.alipayQr) && (
                              <div className="text-center">
                                <img 
                                  src={activeInvoice.alipayQr || settings.alipayQr} 
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

                      {/* Commercial Notes / Declarations (Optional & Modifiable) */}
                      {activeInvoice.showNotes !== false ? (
                        <div className={`text-[8px] text-slate-600 leading-relaxed group relative ${!activeInvoice.notes ? 'print:hidden' : ''}`}>
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={activeInvoice.notesTitle || 'DECLARATIONS / COMPLIANCE'}
                              onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                              className="font-bold uppercase not-italic block text-slate-400 hover:text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              title="Click to edit section title"
                            />
                            <button
                              type="button"
                              onClick={() => handleFieldChange('showNotes', false)}
                              className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                              title="Hide declarations / compliance notes from this invoice"
                            >
                              ✕ Remove
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={activeInvoice.notes || ''}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            placeholder="[ Click to add / modify declarations & compliance notes (optional)... ]"
                            className="w-full bg-transparent border border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] rounded p-0.5 text-[8px] text-slate-600 leading-relaxed italic resize-none outline-hidden print:border-none print:p-0"
                            title="Click to modify declarations directly"
                          />
                        </div>
                      ) : (
                        <div className="print:hidden">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('showNotes', true)}
                            className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                          >
                            + Add Declarations / Compliance (Optional)
                          </button>
                        </div>
                      )}

                      {/* Payment Terms (Optional & Modifiable) */}
                      {activeInvoice.showTerms !== false ? (
                        <div className={`text-[8px] text-slate-600 leading-relaxed group relative ${!activeInvoice.terms ? 'print:hidden' : ''}`}>
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={activeInvoice.termsTitle || 'TERMS OF PAYMENT'}
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
                            value={activeInvoice.terms || ''}
                            onChange={(e) => handleFieldChange('terms', e.target.value)}
                            placeholder="[ Click to add / modify payment terms (optional)... ]"
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
                            + Add Payment Terms (Optional)
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="col-span-1 md:col-span-5 text-[9px] space-y-1 text-slate-500 font-semibold text-right max-w-full">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 leading-normal">
                        <span className="text-slate-400">Subtotal:</span>
                        <span className="text-slate-800 font-bold">{activeInvoice.currency} {(activeInvoice.subtotal || 0).toFixed(2)}</span>
                        
                        {activeInvoice.discountRate > 0 && (
                          <>
                            <span className="text-slate-400">Discount ({activeInvoice.discountRate}%):</span>
                            <span className="text-red-500 font-bold">- {activeInvoice.currency} {(activeInvoice.discountAmount || 0).toFixed(2)}</span>
                          </>
                        )}

                        {activeInvoice.taxRate > 0 && (
                          <>
                            <span className="text-slate-400">Sales VAT ({activeInvoice.taxRate}%):</span>
                            <span className="text-slate-800 font-bold">+ {activeInvoice.currency} {(activeInvoice.taxAmount || 0).toFixed(2)}</span>
                          </>
                        )}

                        {activeInvoice.shippingFee > 0 && (
                          <>
                            <span className="text-slate-400">Ocean/Courier Freight:</span>
                            <span className="text-slate-800 font-bold">+ {activeInvoice.currency} {Number(activeInvoice.shippingFee).toFixed(2)}</span>
                          </>
                        )}

                        {activeInvoice.insurance > 0 && (
                          <>
                            <span className="text-slate-400">Marine Insurance:</span>
                            <span className="text-slate-800 font-bold">+ {activeInvoice.currency} {Number(activeInvoice.insurance).toFixed(2)}</span>
                          </>
                        )}

                        {Number(activeInvoice.packagingFee) > 0 && (
                          <>
                            <span className="text-slate-400">Packaging Fee:</span>
                            <span className="text-slate-800 font-bold">+ {activeInvoice.currency} {Number(activeInvoice.packagingFee).toFixed(2)}</span>
                          </>
                        )}

                        {activeInvoice.otherCharges > 0 && (
                          <>
                            <span className="text-slate-400">Other Surcharges:</span>
                            <span className="text-slate-800 font-bold">+ {activeInvoice.currency} {Number(activeInvoice.otherCharges).toFixed(2)}</span>
                          </>
                        )}

                        <div className="col-span-2 border-t border-slate-200 my-1"></div>

                        <span className="text-xs text-[#1565C0] font-black uppercase">GRAND TOTAL:</span>
                        <span className="text-xs text-[#1565C0] font-black">{activeInvoice.currency} {(activeInvoice.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
        </div>
      )}

      {/* Select Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full flex flex-col max-h-[75vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                {language === 'zh' ? '从已登记客户库选择买家' : 'Consignee Directory Mappings'}
              </span>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-4 divide-y divide-slate-100 overflow-y-auto">
              {clients.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  {language === 'zh' ? '暂未登记客户，请先新建客户档案。' : 'No registered clients. Create one first.'}
                </p>
              ) : (
                clients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className="w-full text-left py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#1565C0]">{c.company}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {language === 'zh' ? '联系人' : 'Agent'}: {c.contactPerson} | {c.country}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-[#1565C0]" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Select Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">
                {language === 'zh' ? '从出口产品库选择 SKU' : 'Select Mapped Mold Catalog SKU'}
              </span>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={16} /></button>
            </div>
            <div className="p-4 divide-y divide-slate-100 overflow-y-auto space-y-1">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="w-full text-left py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors group cursor-pointer"
                >
                  <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded flex items-center justify-center">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <PackageCheck size={14} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#1565C0] truncate">{p.name}</p>
                      <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">{p.sku}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {language === 'zh' ? '单价' : 'Unit Price'}: {activeInvoice.currency || 'USD'} {p.price.toFixed(3)} | MOQ: {p.moq} pcs
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
