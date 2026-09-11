import React, { useState, useEffect } from 'react';
import { Contract, ContractItem, Client, Product, CompanySettings, formatUnitPrice, SUPPORTED_CURRENCIES } from '../types';
import { generateId, getNextDocumentNumber, DEFAULT_CONTRACT_STAMP_SVG } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
import { TransparentSignature } from './TransparentSignature';
import { 
  FileCheck, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Download, 
  X, 
  Check, 
  ChevronRight, 
  Eye, 
  Database, 
  UserPlus, 
  Sparkles,
  Building2,
  Copy,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  FileImage
} from 'lucide-react';

import { compressImageFile } from '../utils/imageCompressor';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { useLanguage } from '../context/LanguageContext';

const handleImageFileRead = async (file: File, callback: (dataUrl: string) => void) => {
  if (!file) return;
  try {
    const compressed = await compressImageFile(file, 350, 350, 0.7);
    callback(compressed);
  } catch (err) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        callback(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  }
};

interface ContractGeneratorProps {
  contracts: Contract[];
  onSaveContracts: (contracts: Contract[]) => void;
  products: Product[];
  clients: Client[];
  onSaveClients?: (clients: Client[]) => void;
  settings: CompanySettings;
  searchTarget: { id: string; type: string } | null;
  clearSearchTarget: () => void;
  activeDocId: string | null;
  clearActiveDoc: () => void;
}

export default function ContractGenerator({
  contracts,
  onSaveContracts,
  products,
  clients,
  onSaveClients,
  settings,
  searchTarget,
  clearSearchTarget,
  activeDocId,
  clearActiveDoc
}: ContractGeneratorProps) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeContract, setActiveContract] = useState<Partial<Contract> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Selector modals
  const [showProductModal, setShowProductModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [itemIndexToEdit, setItemIndexToEdit] = useState<number | null>(null);

  // Quick inline client creation
  const [showInlineClientForm, setShowInlineClientForm] = useState(false);
  const [inlineClient, setInlineClient] = useState<Partial<Client>>({ company: '', contactPerson: '', country: '', email: '', phone: '', address: '' });

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges, requestActionWithGuard } = useNavigationGuard();

  useEffect(() => {
    if (isEditing && activeContract) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activeContract.contractNumber ? `Sales Contract: ${activeContract.contractNumber}` : 'Sales Contract Draft',
        docType: 'Sales Contract',
        onSave: () => {
          handleSaveDoc();
        },
        onDiscard: () => {
          setIsEditing(false);
          setActiveContract(null);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [isEditing, activeContract, contracts]);

  // Handle deep linking or active document selection
  useEffect(() => {
    if (activeDocId) {
      if (activeDocId === 'new') {
        handleCreateNew();
      } else {
        const found = contracts.find(c => c.id === activeDocId);
        if (found) {
          setActiveContract(found);
          setIsEditing(true);
        }
      }
      clearActiveDoc();
    }
  }, [activeDocId, contracts]);

  useEffect(() => {
    if (searchTarget && searchTarget.type === 'contract') {
      const found = contracts.find(c => c.id === searchTarget.id);
      if (found) {
        setActiveContract(found);
        setIsEditing(true);
      }
      clearSearchTarget();
    }
  }, [searchTarget, contracts]);

  // Create new contract draft prefilled with default factory info
  const handleCreateNew = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
    const nextNum = getNextDocumentNumber('contract', contracts);

    const defaultBuyer: Client = clients[0] || {
      id: 'temp',
      company: 'DUONG HOANG HOA COMPANYLIMITED',
      contactPerson: 'Điện thoại',
      address: 'Viet Yen village , Nam Phu commune, Ha Noi city, Vietnam',
      phone: '0334029328',
      email: 'duonghoanghoa.pkt@gmail.com',
      country: 'Vietnam',
      notes: ''
    };

    setActiveContract({
      contractNumber: nextNum,
      date: formattedDate,
      seller: {
        party: 'PartyB:',
        companyName: settings.name || 'Zhejiang Mila Plastic Industry Co.,Ltd',
        address: settings.address || '1#Panlong South Road Donggang development Zone Kecheng area Quzhou',
        tel: settings.phone || '18858002300',
        fax: '0574-62422007',
        contact: 'Liu Zhenxing'
      },
      buyer: {
        party: 'Party A:',
        companyName: defaultBuyer.company,
        email: defaultBuyer.email,
        phone: defaultBuyer.phone,
        contact: defaultBuyer.contactPerson || 'Điện thoại',
        address: defaultBuyer.address
      },
      client: defaultBuyer,
      confirmationStatement: 'We as seller, hereby confirm will sell to you as Buyer, the following goods in accordance with all the provisions here off:',
      items: [
        {
          id: generateId(),
          productId: products[0]?.id,
          name: products[0]?.name || 'Trigger sprayer A 28/400 WHITE',
          sku: products[0]?.sku || 'MTS-28410-W',
          units: 'PCS',
          quantity: 250000,
          unitPrice: 0.046,
          amount: 11500,
          ctns: 500,
          cbm: 36.68,
          image: products[0]?.image
        }
      ],
      deliveryTime: '10-15 DAYS',
      placeOfDelivery: 'Quzhou',
      paymentTerms: 'By T/T. 30%advance payment,balance before loading',
      beneficiary: {
        bankAdd: 'No.188,Nanguan Road ,Luqiao Taizhou Zhejiang',
        swiftCode: settings.swift || 'ZJTLCNBHXXX',
        bankName: settings.bankName || 'ZHEJIANG TAILONG COMMERCIAL BANK CO.,LTD',
        accountNo: settings.accountNumber || '33110100201000012295',
        beneficiaryName: settings.accountName || 'Zhejiang MILA Plastic Industry Co.,Ltd'
      },
      intermediaryBank: {
        name: 'ZHEJIANG TAILONG COMMERCIAL BANK CO LTD',
        swiftCode: settings.swift || 'ZJTLCNBHXXX',
        address: 'No. 188,Nanguan Road ,Luqino TaizhouZhejiang 318050'
      },
      partyAConfirmedBy: defaultBuyer.company,
      partyBConfirmedBy: settings.name || 'Zhejiang Mila Plastic Industry Co.,Ltd',
      showStamp: true,
      stampImage: DEFAULT_CONTRACT_STAMP_SVG
    });
    setIsEditing(true);
  };

  // Filtered contracts list
  const filteredContracts = contracts.filter(c => 
    c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.buyer.companyName.toLowerCase().includes(search.toLowerCase()) ||
    c.seller.companyName.toLowerCase().includes(search.toLowerCase())
  );

  // Field change helpers
  const handleSellerChange = (field: keyof Contract['seller'], val: string) => {
    if (!activeContract) return;
    setActiveContract({
      ...activeContract,
      seller: {
        ...activeContract.seller!,
        [field]: val
      }
    });
  };

  const handleBuyerChange = (field: keyof Contract['buyer'], val: string) => {
    if (!activeContract) return;
    const nextBuyer = {
      ...activeContract.buyer!,
      [field]: val
    };
    setActiveContract({
      ...activeContract,
      buyer: nextBuyer,
      partyAConfirmedBy: field === 'companyName' ? val : activeContract.partyAConfirmedBy
    });
  };

  const handleBeneficiaryChange = (field: keyof Contract['beneficiary'], val: string) => {
    if (!activeContract) return;
    setActiveContract({
      ...activeContract,
      beneficiary: {
        ...activeContract.beneficiary!,
        [field]: val
      }
    });
  };

  const handleIntermediaryChange = (field: keyof Contract['intermediaryBank'], val: string) => {
    if (!activeContract) return;
    setActiveContract({
      ...activeContract,
      intermediaryBank: {
        ...activeContract.intermediaryBank!,
        [field]: val
      }
    });
  };

  // Select client from database modal
  const handleSelectClient = (c: Client) => {
    if (!activeContract) return;
    setActiveContract({
      ...activeContract,
      client: c,
      buyer: {
        party: 'Party A:',
        companyName: c.company,
        email: c.email,
        phone: c.phone,
        contact: c.contactPerson,
        address: c.address
      },
      partyAConfirmedBy: c.company
    });
    setShowClientModal(false);
  };

  // Handle inline client creation
  const handleCreateInlineClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineClient.company) return;

    const brandNew: Client = {
      id: generateId(),
      company: inlineClient.company,
      contactPerson: inlineClient.contactPerson || 'Contact',
      country: inlineClient.country || 'Vietnam',
      address: inlineClient.address || '',
      phone: inlineClient.phone || '',
      email: inlineClient.email || '',
      notes: 'Registered during contract creation.'
    };

    if (onSaveClients) {
      onSaveClients([brandNew, ...clients]);
    }
    handleSelectClient(brandNew);
    setShowInlineClientForm(false);
    setInlineClient({ company: '', contactPerson: '', country: '', email: '', phone: '', address: '' });
  };

  // Add product from modal to contract items
  const handleSelectProduct = (p: Product) => {
    if (!activeContract) return;
    const currentItems = [...(activeContract.items || [])];

    const qty = p.moq || 10000;
    const price = p.price || 0.05;
    const boxCount = p.piecesPerBox ? Math.ceil(qty / p.piecesPerBox) : 100;
    const estCbm = Number((boxCount * ((p.cartonLength || 50) * (p.cartonWidth || 40) * (p.cartonHeight || 40)) / 1000000).toFixed(2)) || 10;

    const newItem: ContractItem = {
      id: generateId(),
      productId: p.id,
      name: p.name,
      sku: p.sku,
      units: 'PCS',
      quantity: qty,
      unitPrice: price,
      amount: Number((qty * price).toFixed(2)),
      ctns: boxCount,
      cbm: estCbm,
      image: p.image
    };

    if (itemIndexToEdit !== null) {
      currentItems[itemIndexToEdit] = newItem;
      setItemIndexToEdit(null);
    } else {
      currentItems.push(newItem);
    }

    setActiveContract({ ...activeContract, items: currentItems });
    setShowProductModal(false);
  };

  const handleAddManualItem = () => {
    if (!activeContract) return;
    const currentItems = [...(activeContract.items || [])];
    const newItem: ContractItem = {
      id: generateId(),
      name: 'Trigger sprayer A 28/400 WHITE',
      sku: 'MTS-28410-W',
      units: 'PCS',
      quantity: 100000,
      unitPrice: 0.046,
      amount: 4600,
      ctns: 200,
      cbm: 15.00
    };
    currentItems.push(newItem);
    setActiveContract({ ...activeContract, items: currentItems });
  };

  const handleItemRowChange = (index: number, key: keyof ContractItem, val: any) => {
    if (!activeContract) return;
    const items = [...(activeContract.items || [])];
    const item = { ...items[index] };

    if (key === 'quantity' || key === 'unitPrice') {
      const q = key === 'quantity' ? Number(val) || 0 : item.quantity;
      const u = key === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
      item[key] = Number(val) || 0;
      item.amount = Number((q * u).toFixed(2));
    } else if (key === 'ctns' || key === 'cbm') {
      item[key] = Number(val) || 0;
    } else {
      (item as any)[key] = val;
    }

    items[index] = item;
    setActiveContract({ ...activeContract, items });
  };

  const handleRemoveItem = (index: number) => {
    if (!activeContract) return;
    const items = [...(activeContract.items || [])].filter((_, i) => i !== index);
    setActiveContract({ ...activeContract, items });
  };

  const handleDuplicateItem = (index: number) => {
    if (!activeContract || !activeContract.items) return;
    const itemToClone = activeContract.items[index];
    if (!itemToClone) return;

    const clonedItem: ContractItem = {
      ...itemToClone,
      id: generateId()
    };

    const currentItems = [...activeContract.items];
    currentItems.splice(index + 1, 0, clonedItem);
    setActiveContract({ ...activeContract, items: currentItems });
  };

  // Calculate grand totals for contract table
  const items = activeContract?.items || [];
  const totalQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const totalCtns = items.reduce((sum, item) => sum + (Number(item.ctns) || 0), 0);
  const totalCbm = items.reduce((sum, item) => sum + (Number(item.cbm) || 0), 0);

  // Save contract handler
  const handleSaveDoc = () => {
    if (!activeContract) return;
    const doc = { ...activeContract } as Contract;
    doc.id = doc.id || generateId();
    doc.createdAt = doc.createdAt || new Date().toISOString();

    let nextList: Contract[];
    if (contracts.some(c => c.id === doc.id)) {
      nextList = contracts.map(c => c.id === doc.id ? doc : c);
    } else {
      nextList = [doc, ...contracts];
    }

    onSaveContracts(nextList);
    setIsEditing(false);
    setActiveContract(null);
  };

  const handleDeleteContract = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = window.confirm(language === 'zh' ? '确定要永久删除此销售合同吗？' : "Are you sure you want to permanently delete this Contract?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const next = contracts.filter(c => c.id !== id);
      onSaveContracts(next);
    }
  };

  const handleDuplicateContract = (c: Contract, e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const formattedDate = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;
    const nextNum = getNextDocumentNumber('contract', contracts);

    const dup: Contract = {
      ...c,
      id: generateId(),
      contractNumber: nextNum,
      date: formattedDate,
      createdAt: new Date().toISOString()
    };

    onSaveContracts([dup, ...contracts]);
  };

  // Download PDF Execution
  const handleDownloadPDF = async () => {
    if (!activeContract) return;
    const elementId = document.getElementById('contract-print-area') ? 'contract-print-area' : 'print-area';
    setIsDownloading(true);
    try {
      await exportDocumentToPDF(elementId, `Contract_${activeContract?.contractNumber || 'ML'}`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      printDocument(elementId);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      {!isEditing ? (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <FileCheck className="text-[#1565C0]" size={26} />
              {t('contract.title', 'Factory Sales Contracts')}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {t('contract.subtitle', 'Generate binding international trade contracts with official stamps, bank details, and FOB items.')}
            </p>
          </div>

          <button
            onClick={handleCreateNew}
            className="bg-[#1565C0] hover:bg-[#0D47A1] text-white px-4 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>{t('contract.create_new', 'Create New Contract')}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  requestActionWithGuard(() => {
                    setIsEditing(false);
                    setActiveContract(null);
                  });
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                {language === 'zh' ? '← 返回' : '← Back'}
              </button>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-xs font-bold text-slate-800">
                <span className="hidden sm:inline">{language === 'zh' ? '正在编辑合同: ' : 'Editing Contract: '}</span>
                <span className="text-[#1565C0] font-mono">{activeContract?.contractNumber}</span>
              </span>
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
                {language === 'zh' ? '合同预览' : 'Preview'}
              </button>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={(e) => {
                if (activeContract) {
                  handleDuplicateContract(activeContract as Contract, e);
                }
              }}
              className="hidden sm:inline-flex bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title={language === 'zh' ? '复制此销售合同' : 'Duplicate this Contract'}
            >
              <Copy size={13} />
              <span>{language === 'zh' ? '复制合同' : 'Duplicate'}</span>
            </button>

            <button
              onClick={handleSaveDoc}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Check size={14} />
              <span>{t('contract.save_button', 'Save')}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="bg-[#1565C0] hover:bg-[#0D47A1] text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download size={14} />
              <span>{isDownloading ? (language === 'zh' ? '生成中...' : 'PDF...') : 'PDF'}</span>
            </button>

            <button
              onClick={() => printDocument(document.getElementById('contract-print-area') ? 'contract-print-area' : 'print-area')}
              className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer size={14} />
              <span>{language === 'zh' ? '打印' : 'Print'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!isEditing ? (
        /* Contract List View */
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={language === 'zh' ? '按合同号、买方名称、卖方名称搜索...' : 'Search by Contract No, Buyer Name, Seller Name...'}
              className="flex-1 text-xs border-none outline-hidden text-slate-800 placeholder-slate-400 bg-transparent"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-slate-400 hover:text-slate-600 text-xs">
                {language === 'zh' ? '清空' : 'Clear'}
              </button>
            )}
          </div>

          {filteredContracts.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
              <FileCheck size={48} className="mx-auto text-slate-300" />
              <h3 className="text-sm font-bold text-slate-700">{language === 'zh' ? '暂未找到外贸合同' : 'No contracts found'}</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {language === 'zh' ? '暂无匹配的销售合同记录。点击“新建外贸合同”开始制作具备公章和银行信息的正规合同。' : 'No matching sales contracts. Click "Create New Contract" to generate an official contract document.'}
              </p>
              <button
                onClick={handleCreateNew}
                className="mt-2 bg-[#1565C0] text-white px-4 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-2 hover:bg-[#0D47A1] cursor-pointer"
              >
                <Plus size={14} />
                {t('contract.create_new', 'Create Contract')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContracts.map((c) => {
                const totalVal = (c.items || []).reduce((sum, item) => sum + (item.amount || 0), 0);
                const totalCbmVal = (c.items || []).reduce((sum, item) => sum + (item.cbm || 0), 0);
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveContract(c);
                      setIsEditing(true);
                    }}
                    className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#1565C0] bg-blue-50 px-2.5 py-1 rounded-md tracking-wider">
                          {c.contractNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {c.date}
                        </span>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{language === 'zh' ? '买方 (Party A)' : 'Buyer (Party A)'}</p>
                        <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1 mt-0.5">
                          {c.buyer?.companyName || (language === 'zh' ? '未指定客户' : 'Unnamed Buyer')}
                        </h4>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {language === 'zh' ? '联系方式: ' : 'Contact: '}{c.buyer?.contact || c.buyer?.email || '-'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">{language === 'zh' ? '产品种类' : 'Total Items'}</span>
                          <span className="font-bold text-slate-700">{c.items?.length || 0} {language === 'zh' ? '款商品' : 'Products'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">{language === 'zh' ? '合同总额' : 'Contract Value'}</span>
                          <span className="font-extrabold text-emerald-600">${totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#1565C0] group-hover:translate-x-1 transition-transform">
                        <span>{language === 'zh' ? '查看 / 编辑合同' : 'View / Edit Document'}</span>
                        <ChevronRight size={14} />
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => handleDuplicateContract(c, e)}
                          title={language === 'zh' ? '复制合同' : 'Duplicate Contract'}
                          className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteContract(c.id, e)}
                          title={language === 'zh' ? '删除合同' : 'Delete Contract'}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Contract Editor & Live Printable PDF Preview Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Controls Column */}
          <div className={`lg:col-span-5 space-y-6 print:hidden ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
            {/* Document Meta Info */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <FileCheck size={16} className="text-[#1565C0]" />
                Contract Metadata
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Contract No
                  </label>
                  <input
                    type="text"
                    value={activeContract?.contractNumber || ''}
                    onChange={(e) => setActiveContract({ ...activeContract, contractNumber: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="text"
                    value={activeContract?.date || ''}
                    onChange={(e) => setActiveContract({ ...activeContract, date: e.target.value })}
                    placeholder="2026.8.3"
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Currency
                  </label>
                  <select
                    value={activeContract?.currency || settings.defaultCurrency || 'USD'}
                    onChange={(e) => setActiveContract({ ...activeContract, currency: e.target.value })}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
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

            {/* Buyer (Party A) Selection & Details */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <UserPlus size={16} className="text-[#1565C0]" />
                  Buyer Information (Party A)
                </h3>
                <button
                  onClick={() => setShowClientModal(true)}
                  className="text-[11px] font-bold text-[#1565C0] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Database size={12} />
                  Select Client
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Party A Company Name
                  </label>
                  <input
                    type="text"
                    value={activeContract?.buyer?.companyName || ''}
                    onChange={(e) => handleBuyerChange('companyName', e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Email
                    </label>
                    <input
                      type="text"
                      value={activeContract?.buyer?.email || ''}
                      onChange={(e) => handleBuyerChange('email', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Telephone
                    </label>
                    <input
                      type="text"
                      value={activeContract?.buyer?.phone || ''}
                      onChange={(e) => handleBuyerChange('phone', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={activeContract?.buyer?.contact || ''}
                      onChange={(e) => handleBuyerChange('contact', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Label Prefix
                    </label>
                    <input
                      type="text"
                      value={activeContract?.buyer?.party || 'Party A:'}
                      onChange={(e) => handleBuyerChange('party', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={activeContract?.buyer?.address || ''}
                    onChange={(e) => handleBuyerChange('address', e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Seller (Party B) Details */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-[#1565C0]" />
                Seller Information (Party B)
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Party B Company Name
                  </label>
                  <input
                    type="text"
                    value={activeContract?.seller?.companyName || ''}
                    onChange={(e) => handleSellerChange('companyName', e.target.value)}
                    className="w-full text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Tel
                    </label>
                    <input
                      type="text"
                      value={activeContract?.seller?.tel || ''}
                      onChange={(e) => handleSellerChange('tel', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Fax
                    </label>
                    <input
                      type="text"
                      value={activeContract?.seller?.fax || ''}
                      onChange={(e) => handleSellerChange('fax', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={activeContract?.seller?.contact || ''}
                      onChange={(e) => handleSellerChange('contact', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Label Prefix
                    </label>
                    <input
                      type="text"
                      value={activeContract?.seller?.party || 'PartyB:'}
                      onChange={(e) => handleSellerChange('party', e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Address
                  </label>
                  <textarea
                    rows={2}
                    value={activeContract?.seller?.address || ''}
                    onChange={(e) => handleSellerChange('address', e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-[#1565C0] outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Goods Items Manager */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={16} className="text-[#1565C0]" />
                  Contract Goods ({activeContract?.items?.length || 0})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowProductModal(true)}
                    className="text-[11px] font-bold text-[#1565C0] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Database size={12} />
                    From Library
                  </button>
                  <button
                    onClick={handleAddManualItem}
                    className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    Custom Item
                  </button>
                </div>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {(activeContract?.items || []).map((item, idx) => (
                  <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                    {/* Item Description & Actions */}
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemRowChange(idx, 'name', e.target.value)}
                        placeholder="Description of goods"
                        className="flex-1 text-xs font-bold p-1 bg-white border border-slate-200 rounded-md"
                      />
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateItem(idx)}
                          title="Duplicate Line Item"
                          className="text-slate-400 hover:text-[#1565C0] hover:bg-blue-50 p-1 rounded-md cursor-pointer transition-colors"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          title="Delete Item"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md cursor-pointer transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Product Image Upload & Preview Controls */}
                    <div className="p-2 bg-white rounded-md border border-slate-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {item.image ? (
                          <img src={item.image} alt="Product" className="w-10 h-10 object-contain rounded-md border border-slate-200 bg-slate-50 p-0.5 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-100 rounded-md border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 shrink-0">
                            <ImageIcon size={14} />
                            <span className="text-[8px] font-semibold">No Pic</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-bold text-slate-700 block truncate">Product Image</span>
                          <span className="text-[9px] text-slate-400 block truncate">
                            {item.image ? 'Custom image attached' : 'Add image for contract'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <label
                          htmlFor={`item-img-upload-${item.id}`}
                          className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-[#1565C0] text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Upload size={11} />
                          <span>{item.image ? 'Change' : 'Upload'}</span>
                        </label>
                        <input
                          id={`item-img-upload-${item.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileRead(file, (dataUrl) => {
                                handleItemRowChange(idx, 'image', dataUrl);
                              });
                            }
                          }}
                        />
                        {item.image && (
                          <button
                            type="button"
                            onClick={() => handleItemRowChange(idx, 'image', '')}
                            title="Remove Image"
                            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-slate-100 cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-semibold text-slate-400 block">Units</label>
                        <input
                          type="text"
                          value={item.units || 'PCS'}
                          onChange={(e) => handleItemRowChange(idx, 'units', e.target.value)}
                          className="w-full text-xs p-1 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-semibold text-slate-400 block">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemRowChange(idx, 'quantity', e.target.value)}
                          className="w-full text-xs p-1 bg-white border border-slate-200 rounded-md font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-semibold text-slate-400 block">Unit Price ({activeContract?.currency || settings.defaultCurrency || 'USD'})</label>
                        <input
                          type="number"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => handleItemRowChange(idx, 'unitPrice', e.target.value)}
                          className="w-full text-xs p-1 bg-white border border-slate-200 rounded-md font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-semibold text-slate-400 block">Amount ({activeContract?.currency || settings.defaultCurrency || 'USD'})</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.amount}
                          onChange={(e) => handleItemRowChange(idx, 'amount', e.target.value)}
                          className="w-full text-xs p-1 bg-white border border-slate-200 rounded-md font-extrabold text-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-semibold text-slate-400 block">CTNS (Cartons)</label>
                        <input
                          type="number"
                          value={item.ctns}
                          onChange={(e) => handleItemRowChange(idx, 'ctns', e.target.value)}
                          className="w-full text-xs p-1 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-semibold text-slate-400 block">CBM</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.cbm}
                          onChange={(e) => handleItemRowChange(idx, 'cbm', e.target.value)}
                          className="w-full text-xs p-1 bg-white border border-slate-200 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terms & Bank Information */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                Terms & Payment Provisions
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Delivery Time
                    </label>
                    <input
                      type="text"
                      value={activeContract?.deliveryTime || ''}
                      onChange={(e) => setActiveContract({ ...activeContract, deliveryTime: e.target.value })}
                      placeholder="10-15 DAYS"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Place of Delivery
                    </label>
                    <input
                      type="text"
                      value={activeContract?.placeOfDelivery || ''}
                      onChange={(e) => setActiveContract({ ...activeContract, placeOfDelivery: e.target.value })}
                      placeholder="Quzhou"
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={activeContract?.paymentTerms || ''}
                    onChange={(e) => setActiveContract({ ...activeContract, paymentTerms: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-hidden"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Beneficiary Bank</p>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-400 block">Bank Name</label>
                    <input
                      type="text"
                      value={activeContract?.beneficiary?.bankName || ''}
                      onChange={(e) => handleBeneficiaryChange('bankName', e.target.value)}
                      className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-semibold text-slate-400 block">Swift Code</label>
                      <input
                        type="text"
                        value={activeContract?.beneficiary?.swiftCode || ''}
                        onChange={(e) => handleBeneficiaryChange('swiftCode', e.target.value)}
                        className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-semibold text-slate-400 block">Account No</label>
                      <input
                        type="text"
                        value={activeContract?.beneficiary?.accountNo || ''}
                        onChange={(e) => handleBeneficiaryChange('accountNo', e.target.value)}
                        className="w-full text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FileImage size={15} className="text-[#1565C0]" />
                      <span className="text-xs font-bold text-slate-700">Official Company Stamp / Seal</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={activeContract?.showStamp ?? true}
                      onChange={(e) => setActiveContract({ ...activeContract, showStamp: e.target.checked })}
                      className="w-4 h-4 text-[#1565C0] rounded-xs cursor-pointer"
                    />
                  </div>

                  {(activeContract?.showStamp ?? true) && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-14 bg-white border border-slate-200 rounded-md p-1 flex items-center justify-center shrink-0 overflow-hidden relative">
                            {activeContract?.stampImage ? (
                              <img src={activeContract.stampImage} alt="Stamp preview" className="max-w-full max-h-full object-contain" />
                            ) : (
                              <span className="text-[9px] text-slate-400 font-semibold text-center">No Stamp</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800">Company Seal Image</p>
                            <p className="text-[10px] text-slate-500">Appears on Party B confirmation</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                        <label
                          htmlFor="stamp-upload-input"
                          className="flex-1 bg-[#1565C0] hover:bg-[#0D47A1] text-white px-2.5 py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload size={12} />
                          <span>Upload Stamp Image</span>
                        </label>
                        <input
                          id="stamp-upload-input"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleImageFileRead(file, (dataUrl) => {
                                setActiveContract({ ...activeContract, stampImage: dataUrl });
                              });
                            }
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => setActiveContract({ ...activeContract, stampImage: DEFAULT_CONTRACT_STAMP_SVG })}
                          title="Reset to default factory red seal"
                          className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw size={12} />
                          <span>Default</span>
                        </button>

                        {activeContract?.stampImage && (
                          <button
                            type="button"
                            onClick={() => setActiveContract({ ...activeContract, stampImage: '' })}
                            title="Remove stamp image"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-md transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Printable A4 PDF Paper Frame */}
          <div className={`lg:col-span-7 flex flex-col items-center w-full min-w-0 ${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'}`}>
            <div className="w-full flex items-center justify-between mb-2.5 px-1 print:hidden">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                <Eye size={12} className="text-[#1565C0]" /> Live Contract Preview (WYSIWYG)
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

            {/* Scrollable Container with Zoom */}
            <div className="w-full overflow-x-auto pb-6 flex justify-center bg-slate-100/50 p-2 sm:p-4 rounded-xl border border-slate-200/80">
              <div 
                id="contract-print-area"
                style={{ 
                  fontFamily: 'Arial, sans-serif',
                  transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                  transformOrigin: 'top center',
                  marginBottom: previewZoom > 100 ? `${(previewZoom - 100) * 8}px` : undefined
                }}
                className="bg-white text-slate-900 shadow-xl border border-slate-200 w-full max-w-[210mm] min-h-[297mm] p-[8mm] sm:p-[12mm] text-[11px] leading-normal font-sans antialiased relative space-y-4 print:p-0 print:border-none print:shadow-none print:max-w-none print:w-full transition-transform duration-150 shrink-0 box-border"
              >
              {/* Header Date and Contract Number */}
              <div className="space-y-0.5 text-left text-[11px] text-slate-900 font-normal">
                <div>Date: {activeContract?.date}</div>
                <div>Contract No: {activeContract?.contractNumber}</div>
              </div>

              {/* Title */}
              <div className="text-center py-1">
                <h2 className="text-[16px] font-bold tracking-wide uppercase text-black">
                  CONTRACT
                </h2>
              </div>

              {/* Seller & Buyer Header Section */}
              <div className="space-y-2 text-[11px] text-black">
                {/* Seller Block */}
                <div className="grid grid-cols-12 gap-x-2 items-start">
                  <div className="col-span-2 font-bold whitespace-nowrap">Seller:</div>
                  <div className="col-span-10 space-y-0.5">
                    <div>
                      <span className="font-bold">{activeContract?.seller?.party || 'PartyB:'}</span>
                    </div>
                    <div>
                      <span>Company name:</span>
                      <span className="font-bold ml-1">{activeContract?.seller?.companyName}</span>
                    </div>
                    <div>
                      <span>Address:</span>
                      <span className="ml-1">{activeContract?.seller?.address}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span>Tel: {activeContract?.seller?.tel}</span>
                      <span>Fax: {activeContract?.seller?.fax}</span>
                    </div>
                    <div>
                      <span>Contact :{activeContract?.seller?.contact}</span>
                    </div>
                  </div>
                </div>

                {/* Buyer Block */}
                <div className="grid grid-cols-12 gap-x-2 items-start pt-1">
                  <div className="col-span-2 font-bold whitespace-nowrap">Buyer:</div>
                  <div className="col-span-10 space-y-0.5">
                    <div>
                      <span className="font-bold">{activeContract?.buyer?.party || 'Party A:'}</span>
                      <span className="font-bold ml-1 uppercase">{activeContract?.buyer?.companyName}</span>
                    </div>
                    <div>
                      <span>EMAIL:</span>
                      <span className="ml-1">{activeContract?.buyer?.email}</span>
                    </div>
                    <div>
                      <span>Telephone:</span>
                      <span className="ml-1">{activeContract?.buyer?.phone}</span>
                    </div>
                    <div>
                      <span>Contact :{activeContract?.buyer?.contact}</span>
                    </div>
                    <div>
                      <span>Address:</span>
                      <span className="ml-1">{activeContract?.buyer?.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirmation Statement */}
              <div className="pt-1 text-[11px] text-black leading-snug font-normal">
                {activeContract?.confirmationStatement || 'We as seller, hereby confirm will sell to you as Buyer, the following goods in accordance with all the provisions here off:'}
              </div>

              {/* Goods Table */}
              <div className="w-full border-t border-l border-black text-[10px] text-black">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-black font-normal text-center">
                      <th className="border-r border-black p-1 w-[60px]">Picture</th>
                      <th className="border-r border-black p-1">Description of goods</th>
                      <th className="border-r border-black p-1 w-[45px]">Units</th>
                      <th className="border-r border-black p-1 w-[60px]">Quantity</th>
                      <th className="border-r border-black p-1 w-[80px]">Unit price(FOB Ningbo)</th>
                      <th className="border-r border-black p-1 w-[75px]">Amount ({activeContract?.currency || settings.defaultCurrency || 'USD'})</th>
                      <th className="border-r border-black p-1 w-[45px]">CTNS</th>
                      <th className="border-r border-black p-1 w-[50px]">CBM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeContract?.items || []).map((item) => (
                      <tr key={item.id} className="border-b border-black">
                        <td className="border-r border-black p-1 text-center align-middle">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 object-contain mx-auto" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-100 rounded-sm mx-auto flex items-center justify-center text-[8px] text-slate-400">
                              No Pic
                            </div>
                          )}
                        </td>
                        <td className="border-r border-black p-1.5 align-middle font-normal">
                          {item.name}
                        </td>
                        <td className="border-r border-black p-1 text-center align-middle">
                          {item.units || 'PCS'}
                        </td>
                        <td className="border-r border-black p-1 text-right align-middle font-normal">
                          {Number(item.quantity).toLocaleString()}
                        </td>
                        <td className="border-r border-black p-1 text-right align-middle">
                          {formatUnitPrice(item.unitPrice, activeContract?.currency || settings.defaultCurrency || 'USD')}
                        </td>
                        <td className="border-r border-black p-1 text-right align-middle font-normal">
                          {activeContract?.currency || settings.defaultCurrency || 'USD'} {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="border-r border-black p-1 text-right align-middle">
                          {item.ctns}
                        </td>
                        <td className="border-r border-black p-1 text-right align-middle">
                          {Number(item.cbm).toFixed(2)}
                        </td>
                      </tr>
                    ))}

                    {/* Total Row */}
                    <tr className="border-b border-black font-bold text-slate-900">
                      <td colSpan={3} className="border-r border-black p-1 text-center">
                        Total
                      </td>
                      <td className="border-r border-black p-1 text-right">
                        {totalQuantity.toLocaleString()}
                      </td>
                      <td className="border-r border-black p-1"></td>
                      <td className="border-r border-black p-1 text-right font-extrabold">
                        {activeContract?.currency || settings.defaultCurrency || 'USD'} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="border-r border-black p-1 text-right">
                        {totalCtns}
                      </td>
                      <td className="border-r border-black p-1 text-right">
                        {totalCbm.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Provisions & Terms Section */}
              <div className="space-y-2 text-[10.5px] text-black leading-snug pt-1">
                <div>
                  <div className="font-bold">1. Time:</div>
                  <div className="pl-2 space-y-0.5">
                    <div>- Delivery time: {activeContract?.deliveryTime || '10-15 DAYS'}</div>
                    <div>- Place of delivery: {activeContract?.placeOfDelivery || 'Quzhou'}</div>
                  </div>
                </div>

                <div>
                  <div className="font-bold">2. Payment:</div>
                  <div className="pl-2 space-y-1">
                    <div>
                      2.1. Payment terms: {activeContract?.paymentTerms || 'By T/T. 30%advance payment,balance before loading'}
                    </div>

                    <div>
                      <div className="font-normal">2.2. Beneficiary:</div>
                      <div className="pl-4 space-y-0.5">
                        <div>- Bank add: {activeContract?.beneficiary?.bankAdd}</div>
                        <div>- Swift code (BIC): {activeContract?.beneficiary?.swiftCode}</div>
                        <div>- Bank name: {activeContract?.beneficiary?.bankName}</div>
                        <div>- Account no: {activeContract?.beneficiary?.accountNo}</div>
                        <div>- Beneficiary name: {activeContract?.beneficiary?.beneficiaryName}</div>
                      </div>
                    </div>

                    <div>
                      <div className="font-normal">2.3. Intermediary bank:</div>
                      <div className="pl-4 space-y-0.5">
                        <div>- Name :{activeContract?.intermediaryBank?.name}</div>
                        <div>- Swift code (BIC): {activeContract?.intermediaryBank?.swiftCode}</div>
                        <div>- Address: {activeContract?.intermediaryBank?.address}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signature & Stamp Section */}
              <div className="pt-6 grid grid-cols-2 gap-4 text-[11px] text-black relative min-h-[110px]">
                {/* Party A Confirmation */}
                <div className="space-y-1">
                  <div className="font-bold">Party A:CONFIRMED BY BUYER</div>
                  <div className="font-bold uppercase tracking-tight">{activeContract?.partyAConfirmedBy || activeContract?.buyer?.companyName}</div>
                </div>

                {/* Party B Confirmation */}
                <div className="space-y-1 relative">
                  <div className="font-bold">Party B:CONFIRMED BY SELLER</div>
                  <div className="font-bold tracking-tight">{activeContract?.partyBConfirmedBy || activeContract?.seller?.companyName}</div>

                  {/* Red Official Stamp Overlay */}
                  {activeContract?.showStamp && (
                    <div className="absolute -top-4 -left-6 pointer-events-none z-10 opacity-90 mix-blend-multiply w-48 h-32">
                      <TransparentSignature 
                        src={activeContract?.stampImage || DEFAULT_CONTRACT_STAMP_SVG} 
                        alt="Factory Stamp" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Select Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Select Product from Library</h3>
              <button onClick={() => setShowProductModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {products.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg flex items-center gap-3 cursor-pointer transition-all"
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-10 h-10 object-contain rounded-md bg-white p-1 border border-slate-200" />
                  ) : (
                    <div className="w-10 h-10 bg-slate-200 rounded-md flex items-center justify-center text-xs font-bold text-slate-500">
                      IMG
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500">SKU: {p.sku} | Unit Price: {activeContract?.currency || settings.defaultCurrency || 'USD'} {p.price}</p>
                  </div>
                  <span className="text-xs font-bold text-[#1565C0]">Select</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-xl max-w-lg w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Select Client from Database</h3>
              <button onClick={() => setShowClientModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {clients.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectClient(c)}
                  className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg flex items-center justify-between cursor-pointer transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">{c.company}</p>
                    <p className="text-[10px] text-slate-500">Contact: {c.contactPerson} • {c.country}</p>
                  </div>
                  <span className="text-xs font-bold text-[#1565C0]">Select</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setShowClientModal(false);
                  setShowInlineClientForm(true);
                }}
                className="text-xs font-bold text-[#1565C0] hover:underline"
              >
                + Register New Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Client Form Modal */}
      {showInlineClientForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:hidden">
          <form onSubmit={handleCreateInlineClient} className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Register New Buyer Client</h3>
              <button onClick={() => setShowInlineClientForm(false)} type="button" className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  value={inlineClient.company}
                  onChange={(e) => setInlineClient({ ...inlineClient, company: e.target.value })}
                  placeholder="e.g. DUONG HOANG HOA COMPANYLIMITED"
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={inlineClient.contactPerson}
                    onChange={(e) => setInlineClient({ ...inlineClient, contactPerson: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Telephone</label>
                  <input
                    type="text"
                    value={inlineClient.phone}
                    onChange={(e) => setInlineClient({ ...inlineClient, phone: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={inlineClient.email}
                  onChange={(e) => setInlineClient({ ...inlineClient, email: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Address</label>
                <textarea
                  rows={2}
                  value={inlineClient.address}
                  onChange={(e) => setInlineClient({ ...inlineClient, address: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInlineClientForm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#1565C0] text-white text-xs font-bold hover:bg-[#0D47A1]"
              >
                Save & Select
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
