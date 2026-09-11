import React, { useState, useEffect } from 'react';
import { SampleInvoice, SampleInvoiceItem, Client, Product, CompanySettings, SUPPORTED_CURRENCIES } from '../types';
import { generateId, getNextDocumentNumber } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
import { 
  Gift, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Check, 
  X, 
  ChevronRight,
  Database,
  Truck,
  Eye,
  Award,
  Download,
  Package,
  Copy
} from 'lucide-react';

import { compressImageFile } from '../utils/imageCompressor';
import { TransparentSignature } from './TransparentSignature';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { useLanguage } from '../context/LanguageContext';

interface SampleInvoiceGeneratorProps {
  sampleInvoices: SampleInvoice[];
  onSaveSampleInvoices: (samples: SampleInvoice[]) => void;
  products: Product[];
  clients: Client[];
  settings: CompanySettings;
  // Deep link targeting
  searchTarget: { id: string; type: string } | null;
  clearSearchTarget: () => void;
  activeDocId: string | null;
  clearActiveDoc: () => void;
}

export default function SampleInvoiceGenerator({ 
  sampleInvoices, 
  onSaveSampleInvoices, 
  products, 
  clients, 
  settings,
  searchTarget,
  clearSearchTarget,
  activeDocId,
  clearActiveDoc
}: SampleInvoiceGeneratorProps) {
  const { t, language } = useLanguage();
  // Navigation & form state
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeSI, setActiveSI] = useState<Partial<SampleInvoice> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges, requestActionWithGuard } = useNavigationGuard();

  useEffect(() => {
    if (isEditing && activeSI) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activeSI.sampleInvoiceNumber ? `Sample Invoice: ${activeSI.sampleInvoiceNumber}` : 'Sample Invoice Draft',
        docType: 'Sample Invoice',
        onSave: () => {
          handleSaveSampleInvoiceDocument();
        },
        onDiscard: () => {
          setIsEditing(false);
          setActiveSI(null);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [isEditing, activeSI, sampleInvoices]);

  // Deep linking triggers
  useEffect(() => {
    if (searchTarget && searchTarget.type === 'sample_invoice') {
      const found = sampleInvoices.find(si => si.id === searchTarget.id);
      if (found) {
        setActiveSI(found);
        setIsEditing(true);
      }
      clearSearchTarget();
    }
  }, [searchTarget, sampleInvoices]);

  const filteredSI = sampleInvoices.filter(si => 
    si.sampleInvoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    si.client.company.toLowerCase().includes(search.toLowerCase()) ||
    (si.trackingNumber && si.trackingNumber.toLowerCase().includes(search.toLowerCase()))
  );

  const handleFieldChange = (field: keyof SampleInvoice, value: any) => {
    if (!activeSI) return;
    setActiveSI(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectClient = (c: Client) => {
    handleFieldChange('client', c);
    setShowClientModal(false);
  };

  // Select product
  const handleSelectProduct = (p: Product) => {
    if (!activeSI) return;
    const currentItems = [...(activeSI.items || [])];

    const ppb = p.piecesPerBox || 100;
    // Sample quantities are usually small, e.g. 5-10 pieces
    const initialQty = 10;
    const boxes = 1;

    const newItem: SampleInvoiceItem = {
      id: generateId(),
      productId: p.id,
      name: p.name,
      sku: p.sku,
      size: p.size || '',
      hsCode: p.hsCode || '',
      quantity: initialQty,
      piecesPerBox: ppb,
      numBoxes: boxes,
      totalPieces: initialQty,
      image: p.image
    };

    currentItems.push(newItem);
    setActiveSI(prev => ({ ...prev, items: currentItems }));
    setShowProductModal(false);
  };

  const handleAddManualItem = () => {
    if (!activeSI) return;
    const currentItems = [...(activeSI.items || [])];
    const newItem: SampleInvoiceItem = {
      id: generateId(),
      name: 'Evaluation Sample Molding',
      sku: 'SAMPLE-01',
      size: '28/410',
      hsCode: '3923.30',
      quantity: 5,
      piecesPerBox: 5,
      numBoxes: 1,
      totalPieces: 5
    };
    currentItems.push(newItem);
    setActiveSI(prev => ({ ...prev, items: currentItems }));
  };

  const handleItemRowChange = (index: number, key: keyof SampleInvoiceItem, value: any) => {
    if (!activeSI) return;
    const currentItems = [...(activeSI.items || [])];
    const item = { ...currentItems[index] };

    if (key === 'quantity') {
      if (value === '') {
        item.quantity = '' as any;
        item.totalPieces = '' as any;
        item.numBoxes = '' as any;
      } else {
        const qty = Math.max(0, Number(value));
        item.quantity = qty;
        item.totalPieces = qty;
        item.numBoxes = Math.ceil(qty / (Number(item.piecesPerBox) || 100));
      }
    } else if (key === 'piecesPerBox') {
      if (value === '') {
        item.piecesPerBox = '' as any;
        item.numBoxes = '' as any;
      } else {
        const ppb = Math.max(1, Number(value));
        item.piecesPerBox = ppb;
        item.numBoxes = Math.ceil((Number(item.quantity) || 0) / ppb);
      }
    } else {
      (item as any)[key] = value;
    }

    currentItems[index] = item;
    setActiveSI(prev => ({ ...prev, items: currentItems }));
  };

  const handleRemoveItem = (index: number) => {
    if (!activeSI) return;
    const currentItems = [...(activeSI.items || [])];
    currentItems.splice(index, 1);
    setActiveSI(prev => ({ ...prev, items: currentItems }));
  };

  const handleDuplicateItem = (index: number) => {
    if (!activeSI || !activeSI.items) return;
    const itemToClone = activeSI.items[index];
    if (!itemToClone) return;

    const clonedItem: SampleInvoiceItem = {
      ...itemToClone,
      id: generateId()
    };

    const currentItems = [...activeSI.items];
    currentItems.splice(index + 1, 0, clonedItem);
    setActiveSI(prev => ({ ...prev, items: currentItems }));
  };

  const handleDuplicateSampleInvoice = (si: SampleInvoice, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newSI: SampleInvoice = {
      ...si,
      id: generateId(),
      sampleInvoiceNumber: `${si.sampleInvoiceNumber}-COPY`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    onSaveSampleInvoices([newSI, ...sampleInvoices]);
    setActiveSI(newSI);
    setIsEditing(true);
  };

  const handleCreateNew = () => {
    const nextSINum = getNextDocumentNumber('sample', sampleInvoices);
    setActiveSI({
      title: 'SAMPLE INVOICE',
      sampleInvoiceNumber: nextSINum,
      date: new Date().toISOString().split('T')[0],
      items: [],
      shippingFee: 75.0,
      courier: 'DHL Express',
      trackingNumber: '',
      notes: 'These are complimentary factory samples dispatched strictly for physical weight, thickness, and color profile inspection.',
      statement: 'Samples supplied free of charge. Customer is responsible only for shipping costs.',
      client: clients[0] || { id: 'temp', company: 'Global Prospect', contactPerson: 'Purchasing', address: '', phone: '', email: '', country: 'USA', notes: '' }
    });
    setIsEditing(true);
  };

  // Handle direct view target from Dashboard / Global search or 'new' draft action
  useEffect(() => {
    if (activeDocId) {
      if (activeDocId === 'new') {
        handleCreateNew();
      } else {
        const found = sampleInvoices.find(si => si.id === activeDocId);
        if (found) {
          setActiveSI(found);
          setIsEditing(true);
        }
      }
      clearActiveDoc();
    }
  }, [activeDocId, sampleInvoices]);

  const handleSaveSampleInvoiceDocument = () => {
    if (!activeSI) return;
    if (!activeSI.sampleInvoiceNumber) {
      alert("Sample Invoice Number is required");
      return;
    }

    const doc = { ...activeSI } as SampleInvoice;
    doc.createdAt = doc.createdAt || new Date().toISOString();

    // Normalize any temporary empty string inputs to numeric 0/defaults for database storage
    doc.shippingFee = Number(doc.shippingFee) || 0;
    doc.items = (doc.items || []).map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      piecesPerBox: Number(item.piecesPerBox) || 0,
      numBoxes: Number(item.numBoxes) || 0,
      totalPieces: Number(item.totalPieces) || 0,
    }));

    let nextSIs: SampleInvoice[];
    if (doc.id) {
      nextSIs = sampleInvoices.map(si => si.id === doc.id ? doc : si);
    } else {
      doc.id = generateId();
      nextSIs = [doc, ...sampleInvoices];
    }

    onSaveSampleInvoices(nextSIs);
    setIsEditing(false);
    setActiveSI(null);
  };

  const handleDeleteSampleInvoice = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = window.confirm(language === 'zh' ? '确定要删除此样品发票记录吗？' : "Are you sure you want to delete this Sample Invoice log?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const next = sampleInvoices.filter(si => si.id !== id);
      onSaveSampleInvoices(next);
    }
  };

  const handlePrint = () => {
    printDocument('print-area');
  };

  // PDF Download Execution
  const handleDownloadPDF = async () => {
    if (!activeSI) return;
    setIsDownloading(true);
    try {
      await exportDocumentToPDF('print-area', activeSI.sampleInvoiceNumber || 'sample_invoice');
    } catch (err) {
      console.error('PDF generation failed:', err);
      printDocument('print-area');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!isEditing ? (
        <div className="space-y-6 print:hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                <Gift className="text-[#1565C0]" size={22} />
                {language === 'zh' ? '样品/快递发票管理' : 'Sample Evaluation Invoice'}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'zh' ? '制作免费样品/评估样品的快递运输发票，商品申报零价值，仅结算国际快递运费。' : 'Draft shipping documents for zero-value product samples. Only courier freight charges will be invoiced.'}
              </p>
            </div>
            
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1565C0] text-white hover:bg-blue-700 text-xs font-black transition-all shadow-sm shrink-0"
            >
              <Plus size={14} /> {language === 'zh' ? '新建样品发票' : 'Create Sample Invoice'}
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={language === 'zh' ? '按发票编号、客户、快递单号搜索...' : 'Search sample invoices by document number, client, courier...'} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold">{filteredSI.length} {language === 'zh' ? '条记录' : 'Logs Recorded'}</span>
          </div>

          {/* Table display */}
          {filteredSI.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Gift size={24} />
              </div>
              <p className="text-xs font-semibold text-slate-600">{language === 'zh' ? '暂无样品发票记录' : 'No sample invoices logged.'}</p>
              <p className="text-[10px] mt-1">{language === 'zh' ? '点击“新建样品发票”开始填写样品出单明细。' : 'Tap "Create Sample Invoice" to initiate a freight dispatch form.'}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">{language === 'zh' ? '发票编号' : 'Sample Invoice No'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '开立日期' : 'Date Issued'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '收件客户' : 'Importer Client'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '快递承运 / 单号' : 'Courier / Tracking'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '运费金额' : 'Freight Fee'}</th>
                      <th className="py-3 px-4 text-right">{language === 'zh' ? '操作' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredSI.map(si => (
                      <tr 
                        key={si.id}
                        onClick={() => {
                          setActiveSI(si);
                          setIsEditing(true);
                        }}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-bold text-slate-800">{si.sampleInvoiceNumber}</td>
                        <td className="py-3 px-4 text-slate-500">{si.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">{si.client.company}</td>
                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {si.courier} <span className="text-slate-400 font-mono text-[10px]">({si.trackingNumber || (language === 'zh' ? '暂无单号' : 'No tracking yet')})</span>
                        </td>
                        <td className="py-3 px-4 font-black text-[#1565C0]">${si.shippingFee.toFixed(2)}</td>
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveSI(si);
                                setIsEditing(true);
                              }}
                              className="p-1.5 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                              title={language === 'zh' ? '编辑' : 'Edit'}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDuplicateSampleInvoice(si, e)}
                              className="p-1.5 rounded text-slate-500 hover:text-[#1565C0] hover:bg-blue-50 cursor-pointer transition-colors"
                              title={language === 'zh' ? '复制样品发票' : 'Duplicate Sample Invoice'}
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDeleteSampleInvoice(si.id, e)}
                              className="p-1.5 rounded text-red-500 hover:bg-red-50 cursor-pointer"
                              title={language === 'zh' ? '删除' : 'Delete'}
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
        /* Form Editor panel & live A4 preview panel */
        <div className="space-y-4">
          {/* Actions bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-3 sm:p-4 rounded-xl shadow-xs print:hidden">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    requestActionWithGuard(() => {
                      setIsEditing(false);
                      setActiveSI(null);
                    });
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
                  title={language === 'zh' ? '返回列表' : 'Back to ledger'}
                >
                  <X size={16} />
                </button>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{language === 'zh' ? '样品发票编辑器' : 'Sample Document Editor'}</h2>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{activeSI.sampleInvoiceNumber || 'SI-Draft'}</p>
                </div>
              </div>

              {/* Mobile View Toggle (Visible only on mobile/tablet) */}
              <div className="lg:hidden flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setMobileTab('form')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mobileTab === 'form' 
                      ? 'bg-white text-[#1565C0] shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {language === 'zh' ? '编辑表单' : 'Form'}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('preview')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    mobileTab === 'preview' 
                      ? 'bg-white text-[#1565C0] shadow-xs' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {language === 'zh' ? '发票预览' : 'Preview'}
                </button>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 justify-end">
              <button 
                type="button"
                onClick={() => {
                  if (activeSI) {
                    handleDuplicateSampleInvoice(activeSI as SampleInvoice);
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-[#1565C0] text-xs font-bold transition-all cursor-pointer"
                title={language === 'zh' ? '复制此样品发票' : 'Duplicate this Sample Invoice'}
              >
                <Copy size={13} /> {language === 'zh' ? '复制发票' : 'Duplicate Sample'}
              </button>
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
                title={language === 'zh' ? '打印或保存为PDF' : 'Print or Save as PDF via Print'}
              >
                <Printer size={13} /> {language === 'zh' ? '打印' : 'Print'}
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              >
                {isDownloading ? (
                  <span className="flex items-center gap-1">
                    <span className="animate-spin inline-block w-3 h-3 border-2 border-slate-500 border-t-transparent rounded-full mr-1"></span>
                    {language === 'zh' ? '生成中...' : 'Generating...'}
                  </span>
                ) : (
                  <>
                    <Download size={13} /> PDF
                  </>
                )}
              </button>
              <button 
                onClick={handleSaveSampleInvoiceDocument}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-lg bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Check size={13} /> {language === 'zh' ? '保存发票' : 'Save Sample'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <div className={`space-y-6 lg:col-span-6 print:hidden ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              {/* Core info */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <Truck size={12} /> {language === 'zh' ? '样品寄送明细' : 'Dispatch Particulars'}
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '单据标题' : 'Document Title / Header'}</label>
                    <input 
                      type="text" 
                      value={activeSI.title || ''}
                      placeholder="SAMPLE INVOICE"
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-extrabold text-[#1565C0] placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '样品发票编号' : 'Sample Invoice Number'}</label>
                    <input 
                      type="text" 
                      value={activeSI.sampleInvoiceNumber || ''}
                      onChange={(e) => handleFieldChange('sampleInvoiceNumber', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '寄件日期' : 'Dispatch Date'}</label>
                    <input 
                      type="date" 
                      value={activeSI.date || ''}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '国际快递承运商' : 'Courier Carrier'}</label>
                    <select 
                      value={activeSI.courier || ''}
                      onChange={(e) => handleFieldChange('courier', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    >
                      <option value="DHL Express">DHL Express</option>
                      <option value="FedEx International">FedEx International</option>
                      <option value="Aramex">Aramex</option>
                      <option value="TNT / FedEx">TNT Cargo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '快递单号 (Tracking No)' : 'Tracking Number'}</label>
                    <input 
                      type="text" 
                      placeholder="e.g. DHL-99882312"
                      value={activeSI.trackingNumber || ''}
                      onChange={(e) => handleFieldChange('trackingNumber', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? '币种' : 'Currency'}</label>
                    <select 
                      value={activeSI.currency || settings.defaultCurrency || 'USD'}
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

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">{language === 'zh' ? `快递运费 (${activeSI.currency || settings.defaultCurrency || 'USD'})` : `Courier Freight Cost (${activeSI.currency || settings.defaultCurrency || 'USD'})`}</label>
                    <input 
                      type="number" 
                      value={activeSI.shippingFee !== undefined ? activeSI.shippingFee : ''}
                      onChange={(e) => handleFieldChange('shippingFee', e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Client Selector */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={12} /> {language === 'zh' ? '收件客户档案' : 'Recipient Prospect File'}
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="text-[10px] text-[#1565C0] font-bold hover:underline cursor-pointer"
                  >
                    {language === 'zh' ? '从客户库选择' : 'Select From Directory'}
                  </button>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                  <p className="text-[9px] text-[#1565C0] font-bold uppercase tracking-widest">{activeSI.client?.country || 'USA'}</p>
                  <p className="font-extrabold text-slate-800 text-xs mt-1">{activeSI.client?.company || (language === 'zh' ? '未关联收件客户' : 'No recipient mapped')}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{language === 'zh' ? '收件人' : 'Attn'}: {activeSI.client?.contactPerson || 'N/A'}</p>
                </div>
              </div>

              {/* Items listing */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={12} /> {language === 'zh' ? '样品明细列表' : 'Sample Items Table'}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddManualItem}
                      className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer"
                    >
                      {language === 'zh' ? '添加空白行' : 'Manual Row'}
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setShowProductModal(true)}
                      className="text-[10px] text-[#1565C0] font-bold hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus size={10} /> {language === 'zh' ? '从产品库选择' : 'Add from Catalog'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 divide-y divide-slate-100">
                  {(!activeSI.items || activeSI.items.length === 0) ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No sample items mapped. Choose from the Product Library to auto-copy dimensions.
                    </div>
                  ) : (
                    activeSI.items.map((item, index) => (
                      <div key={item.id} className="pt-3 first:pt-0 space-y-2">
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
                              <span className="text-[9px] font-mono font-bold text-slate-400">SKU: {item.sku}</span>
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
                              <span className="text-[9px] text-slate-300">•</span>
                              <span className="text-[9px] font-semibold text-slate-500 flex items-center gap-1">
                                HS Code: 
                                <input 
                                  type="text" 
                                  value={item.hsCode || ''} 
                                  onChange={(e) => handleItemRowChange(index, 'hsCode', e.target.value)}
                                  className="bg-transparent border-b border-slate-200 hover:border-slate-400 focus:border-[#1565C0] focus:outline-hidden font-bold w-20 px-0.5 text-[9px]"
                                  placeholder="e.g. 3923.30"
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
                              className="text-red-500 hover:bg-red-50 p-1 rounded-lg shrink-0 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {/* Qty row */}
                        <div className="grid grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">Quantity (Pcs)</label>
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => handleItemRowChange(index, 'quantity', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs font-semibold text-slate-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">Pieces Per Box</label>
                            <input 
                              type="number" 
                              value={item.piecesPerBox}
                              onChange={(e) => handleItemRowChange(index, 'piecesPerBox', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs"
                            />
                          </div>

                          <div className="bg-slate-50 p-1 rounded border border-slate-150 text-right h-8 flex flex-col justify-center">
                            <span className="text-[8px] text-slate-400 block font-bold">BOX VOLUME</span>
                            <span className="text-[10px] font-bold text-slate-700">{item.numBoxes} Box</span>
                          </div>
                        </div>

                        {/* Value state */}
                        <div className="text-right text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                          Product Value: FREE ($0.00)
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Statement & notes block */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                  Declarations & Statements
                </span>
                
                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer mb-1.5">
                    <input
                      type="checkbox"
                      checked={activeSI.showStatement !== false}
                      onChange={(e) => handleFieldChange('showStatement', e.target.checked)}
                      className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-700 uppercase">Include Export Sample Customs Statement</span>
                  </label>
                  {activeSI.showStatement !== false ? (
                    <>
                      <textarea 
                        rows={2}
                        value={activeSI.statement || ''}
                        onChange={(e) => handleFieldChange('statement', e.target.value)}
                        placeholder="Enter sample statement..."
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 resize-y"
                      />
                      <div className="flex flex-wrap gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleFieldChange('statement', 'FREE SAMPLES OF NO COMMERCIAL VALUE. VALUE FOR CUSTOMS DECLARATION ONLY.')}
                          className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                        >
                          + Standard Customs Statement
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Customs statement is hidden from this sample invoice.</p>
                  )}
                </div>

                <div className="bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeSI.showNotes !== false}
                        onChange={(e) => handleFieldChange('showNotes', e.target.checked)}
                        className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                      />
                      <span className="text-[10px] font-bold text-slate-700 uppercase">Include Exporter Evaluation Notes</span>
                    </label>
                    {activeSI.showNotes !== false && (
                      <input
                        type="text"
                        value={activeSI.notesTitle || ''}
                        onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                        placeholder="Title (Default: EXPORTER EVALUATION NOTES)"
                        className="text-[10px] bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-52 text-right"
                      />
                    )}
                  </div>
                  {activeSI.showNotes !== false ? (
                    <textarea 
                      rows={2}
                      value={activeSI.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder="Enter notes, tracking instructions, material notes..."
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 resize-y"
                    />
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Evaluation notes are hidden from this sample invoice.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: WYSIWYG A4 Preview */}
            <div className={`lg:col-span-6 flex flex-col items-center w-full min-w-0 ${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="w-full flex items-center justify-between mb-2.5 px-1 print:hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <Eye size={12} className="text-[#1565C0]" /> Live A4 Sheet Preview (WYSIWYG)
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

              <div className="w-full overflow-x-auto pb-6 flex justify-center bg-slate-100/50 p-2 sm:p-4 rounded-xl border border-slate-200/80">
                <div 
                  id="print-area"
                  style={{ 
                    boxSizing: 'border-box',
                    transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                    transformOrigin: 'top center',
                    marginBottom: previewZoom > 100 ? `${(previewZoom - 100) * 8}px` : undefined
                  }}
                  className="w-full max-w-[210mm] min-h-[296mm] bg-white border border-slate-200 shadow-xl rounded-none p-4 sm:p-8 md:p-[12mm] text-slate-800 flex flex-col justify-between font-sans relative shrink-0 box-border overflow-hidden transition-all duration-150 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none"
                >
                {/* Upper body */}
                <div className="space-y-4 sm:space-y-5">
                  {/* Header info */}
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
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <input
                        type="text"
                        value={activeSI.title || 'SAMPLE INVOICE'}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className="text-left sm:text-right bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#1565C0] text-xl font-black text-[#1565C0] uppercase tracking-tight w-full outline-hidden"
                        title="Click to edit document title"
                        placeholder="SAMPLE INVOICE"
                      />
                      <div className="mt-3 grid grid-cols-2 gap-x-2.5 gap-y-1 text-[9px] text-slate-500 leading-normal font-semibold text-left justify-end">
                        <span className="font-bold text-slate-400 text-left sm:text-right">Sample Ref No:</span>
                        <span className="font-bold text-slate-800">{activeSI.sampleInvoiceNumber}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Issue Date:</span>
                        <span className="text-slate-800">{activeSI.date}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Evaluation Statement:</span>
                        <span className="text-[#1565C0] font-bold uppercase text-[8px]">PROMOTIONAL SAMPLES</span>
                      </div>
                    </div>
                  </div>

                  {/* Consignee and shipment ports */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Recipient (Prospect Buyer)</span>
                      <p className="text-xs font-black text-slate-800">{activeSI.client?.company}</p>
                      <div className="text-[9px] text-slate-500 leading-normal font-semibold">
                        <p>Attn: {activeSI.client?.contactPerson}</p>
                        <p>{activeSI.client?.address}</p>
                        <p>{activeSI.client?.country}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-100 rounded-lg space-y-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Courier Delivery Details</span>
                      <div className="text-[9px] text-slate-500 leading-normal font-semibold grid grid-cols-2 gap-x-2">
                        <span className="font-bold text-slate-400">Courier Partner:</span>
                        <span className="font-extrabold text-slate-800">{activeSI.courier || 'N/A'}</span>
                        <span className="font-bold text-slate-400">Airway Bill / Tracking:</span>
                        <span className="font-extrabold text-slate-800 font-mono">{activeSI.trackingNumber || 'Pending pickup...'}</span>
                        <span className="font-bold text-slate-400">Country of Origin:</span>
                        <span className="text-slate-800">{settings.country}</span>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto w-full -mx-1 sm:mx-0">
                    <table className="w-full min-w-[500px] text-left border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-[#1565C0] text-white font-bold uppercase text-[8px] border-b border-[#1565C0]">
                          <th className="py-2 px-2 rounded-l">Sample Specifications</th>
                          <th className="py-2 px-2 text-center">Size / NK</th>
                          <th className="py-2 px-2 text-center">Packaging (Box)</th>
                          <th className="py-2 px-2 text-right">Quantity (Pcs)</th>
                          <th className="py-2 px-2 text-right rounded-r">Declared Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 leading-tight font-semibold text-slate-700">
                        {(!activeSI.items || activeSI.items.length === 0) ? (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              No sample product listings added.
                            </td>
                          </tr>
                        ) : (
                          activeSI.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  {item.image && <img src={item.image} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />}
                                  <div>
                                    <p className="font-extrabold text-slate-800">{item.name}</p>
                                    <p className="text-[8px] text-slate-400 font-semibold">
                                      SKU: {item.sku}{item.hsCode ? ` | HS Code: ${item.hsCode}` : ''}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center font-bold font-mono text-slate-800">{item.size || '-'}</td>
                              <td className="py-2 px-2 text-center">{item.numBoxes} Box ({item.piecesPerBox} Pcs/Box)</td>
                              <td className="py-2 px-2 text-right font-bold text-slate-800">{item.quantity} Pcs</td>
                              <td className="py-2 px-2 text-right text-emerald-600 font-extrabold uppercase">FREE</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Important declarations statement banner block (Optional & Modifiable in preview) */}
                  {activeSI.showStatement !== false ? (
                    <div className={`bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-[9px] text-[#1565C0] leading-normal font-semibold flex items-center gap-2.5 group relative ${!activeSI.statement ? 'print:hidden' : ''}`}>
                      <Award size={16} className="text-[#1565C0] shrink-0" />
                      <textarea
                        rows={1}
                        value={activeSI.statement || ''}
                        onChange={(e) => handleFieldChange('statement', e.target.value)}
                        placeholder="[ Click to edit sample customs declaration statement (optional)... ]"
                        className="w-full bg-transparent border border-transparent hover:border-dashed hover:border-blue-300 focus:border-[#1565C0] rounded p-0.5 text-[9px] text-[#1565C0] font-bold italic resize-none outline-hidden print:border-none print:p-0 text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleFieldChange('showStatement', false)}
                        className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-1 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                        title="Hide customs statement from this sample invoice"
                      >
                        ✕ Remove
                      </button>
                    </div>
                  ) : (
                    <div className="print:hidden">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('showStatement', true)}
                        className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                      >
                        + Add Customs Statement (Optional)
                      </button>
                    </div>
                  )}

                  {/* Surcharges totals */}
                  <div className="grid grid-cols-12 gap-6 pt-2">
                    <div className="col-span-7">
                      {activeSI.showNotes !== false ? (
                        <div className={`text-[8px] text-slate-600 leading-relaxed group relative ${!activeSI.notes ? 'print:hidden' : ''}`}>
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={activeSI.notesTitle || 'EXPORTER EVALUATION NOTES'}
                              onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                              className="font-bold uppercase not-italic block text-slate-400 hover:text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                              title="Click to edit section title"
                            />
                            <button
                              type="button"
                              onClick={() => handleFieldChange('showNotes', false)}
                              className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                              title="Hide evaluation notes from this invoice"
                            >
                              ✕ Remove
                            </button>
                          </div>
                          <textarea
                            rows={2}
                            value={activeSI.notes || ''}
                            onChange={(e) => handleFieldChange('notes', e.target.value)}
                            placeholder="[ Click to add / modify exporter evaluation notes (optional)... ]"
                            className="w-full bg-transparent border border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] rounded p-0.5 text-[8px] text-slate-600 leading-relaxed italic resize-none outline-hidden print:border-none print:p-0"
                            title="Click to modify evaluation notes directly"
                          />
                        </div>
                      ) : (
                        <div className="print:hidden">
                          <button
                            type="button"
                            onClick={() => handleFieldChange('showNotes', true)}
                            className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                          >
                            + Add Evaluation Notes (Optional)
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="col-span-5 text-[9px] space-y-1 text-slate-500 font-semibold text-right">
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 leading-normal">
                        <span className="text-slate-400">Commercial Subtotal:</span>
                        <span className="text-slate-800 font-bold">{activeSI.currency || settings.defaultCurrency || 'USD'} 0.00</span>
                        
                        <span className="text-slate-400">Freight & Courier Charges:</span>
                        <span className="text-slate-800 font-black">{activeSI.currency || settings.defaultCurrency || 'USD'} {(activeSI.shippingFee || 0).toFixed(2)}</span>

                        <div className="col-span-2 border-t border-slate-200 my-1"></div>

                        <span className="text-xs text-[#1565C0] font-black uppercase">GRAND TOTAL DUE:</span>
                        <span className="text-xs text-[#1565C0] font-black">{activeSI.currency || settings.defaultCurrency || 'USD'} {(activeSI.shippingFee || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer block */}
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

      {/* Select Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full flex flex-col max-h-[75vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Consignee Selector Directory</span>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="p-4 divide-y divide-slate-100 overflow-y-auto">
              {clients.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className="w-full text-left py-2.5 hover:bg-slate-50 flex items-center justify-between transition-colors group"
                >
                  <div>
                    <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#1565C0]">{c.company}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Agent: {c.contactPerson} | {c.country}</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-[#1565C0]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Select Complimentary SKU from Catalog</span>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
            </div>
            <div className="p-4 divide-y divide-slate-100 overflow-y-auto space-y-1">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="w-full text-left py-3 hover:bg-slate-50 flex items-center gap-3 transition-colors group"
                >
                  <div className="w-8 h-8 bg-slate-50 border border-slate-100 rounded flex items-center justify-center shrink-0">
                    {p.image ? (
                      <img src={p.image} alt="" className="w-6 h-6 object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Gift size={14} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#1565C0] truncate">{p.name}</p>
                      <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">{p.sku}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Specifications: pieces/box: {p.piecesPerBox} | color: {p.color}</p>
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
