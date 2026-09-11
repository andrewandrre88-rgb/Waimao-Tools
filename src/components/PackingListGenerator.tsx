import React, { useState, useEffect } from 'react';
import { PackingList, PackingListItem, Client, Product, CompanySettings } from '../types';
import { generateId, getNextDocumentNumber } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
import { 
  PackageOpen, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Check, 
  X, 
  ChevronRight,
  Database,
  Calculator,
  Ship,
  Eye,
  Weight,
  Download,
  Package,
  Copy,
  Truck,
  Building2,
  Warehouse,
  Plane,
  Train,
  MapPin,
  Barcode,
  FileText,
  Tag,
  Navigation,
  Sparkles,
  Layers,
  Phone,
  UserCheck,
  Users,
  RotateCcw,
  Briefcase
} from 'lucide-react';

import { compressImageFile } from '../utils/imageCompressor';
import { TransparentSignature } from './TransparentSignature';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { useLanguage } from '../context/LanguageContext';

const CHINA_WAREHOUSE_PRESETS = [
  {
    id: 'yiwu',
    label: '义乌指定仓 (Yiwu)',
    name: '义乌指定外贸货代仓 (Yiwu Forwarder Warehouse)',
    city: '义乌市 (Yiwu)',
    address: '浙江省义乌市北苑街道雪峰西路968号传化公路港B区12号门 (Yiwu Logistics Hub)',
    contact: '李主管 (Receiving Desk)',
    phone: '+86 138-5798-8821',
    carrier: '顺丰速运 (SF Express)',
    incoterm: 'FCA Yiwu Warehouse (义乌交货)',
    deliveryMethod: 'Dedicated Truck 4.2m (4.2米专线货车)',
    entryCodePlaceholder: 'YIWU-EXP-2026-8821'
  },
  {
    id: 'guangzhou',
    label: '广州集运仓 (Guangzhou)',
    name: '广州白云外贸集运中心仓 (Guangzhou Consolidation WH)',
    city: '广州市 (Guangzhou)',
    address: '广东省广州市白云区石井街道石沙路88号石门物流园C栋3号库 (Baiyun Logistics Park)',
    contact: '张主管 (Inbound Ops)',
    phone: '+86 139-2218-9932',
    carrier: '德邦物流 (Deppon Express)',
    incoterm: 'FCA Guangzhou Warehouse (广州交货)',
    deliveryMethod: 'Dedicated Truck 6.8m (6.8米专线货车)',
    entryCodePlaceholder: 'GZ-WH-2026-9921'
  },
  {
    id: 'shenzhen',
    label: '深圳保税仓 (Shenzhen)',
    name: '深圳盐田指定外贸保税仓 (Shenzhen Yantian Bonded WH)',
    city: '深圳市 (Shenzhen)',
    address: '广东省深圳市盐田区综合保税区南片区现代物流中心2号库 (Yantian Bonded Hub)',
    contact: '陈经理 (Bonded Intake)',
    phone: '+86 135-1029-3388',
    carrier: '专线货运包车 (Dedicated Truck)',
    incoterm: 'FCA Shenzhen Warehouse (深圳交货)',
    deliveryMethod: 'Dedicated Truck 9.6m (9.6米厢式货车)',
    entryCodePlaceholder: 'SZ-YT-2026-3388'
  },
  {
    id: 'ningbo',
    label: '宁波北仑仓 (Ningbo)',
    name: '宁波北仑国际物流园区中心仓 (Ningbo Beilun Logistics WH)',
    city: '宁波市 (Ningbo)',
    address: '浙江省宁波市北仑区进港路与大港六路交叉口国际物流园区A1库',
    contact: '王主管 (Wh Manager)',
    phone: '+86 137-7789-5566',
    carrier: '安能物流 (ANE Freight)',
    incoterm: 'FCA Ningbo Warehouse (宁波交货)',
    deliveryMethod: 'LTL Loose Pallets (零担打托配货)',
    entryCodePlaceholder: 'NB-BL-2026-5566'
  },
  {
    id: 'foshan',
    label: '佛山顺德仓 (Foshan)',
    name: '佛山顺德指定外贸拼箱仓 (Foshan Forwarder WH)',
    city: '佛山市 (Foshan)',
    address: '广东省佛山市顺德区北滘镇广教工业大道18号快件监管中心2号仓',
    contact: '何主管 (Dispatch Dept)',
    phone: '+86 136-3001-2299',
    carrier: '顺丰速运 (SF Express)',
    incoterm: 'FCA Foshan Warehouse (佛山交货)',
    deliveryMethod: 'Courier Express (快递直达送仓)',
    entryCodePlaceholder: 'FS-SD-2026-2299'
  },
  {
    id: 'shanghai',
    label: '上海集运仓 (Shanghai)',
    name: '上海洋山/外高桥集运保税仓 (Shanghai Consolidation WH)',
    city: '上海市 (Shanghai)',
    address: '上海市浦东新区外高桥保税区富特西一路456号普洛斯物流园B库',
    contact: '赵经理 (Receiving Desk)',
    phone: '+86 138-1899-7722',
    carrier: '德邦物流 (Deppon Express)',
    incoterm: 'FCA Shanghai Warehouse (上海交货)',
    deliveryMethod: 'Dedicated Truck 4.2m (4.2米专线货车)',
    entryCodePlaceholder: 'SH-WGQ-2026-7722'
  }
];

interface PackingListGeneratorProps {
  packingLists: PackingList[];
  onSavePackingLists: (lists: PackingList[]) => void;
  products: Product[];
  clients: Client[];
  settings: CompanySettings;
  // Deep link targeting
  searchTarget: { id: string; type: string } | null;
  clearSearchTarget: () => void;
  activeDocId: string | null;
  clearActiveDoc: () => void;
}

export default function PackingListGenerator({ 
  packingLists, 
  onSavePackingLists, 
  products, 
  clients, 
  settings,
  searchTarget,
  clearSearchTarget,
  activeDocId,
  clearActiveDoc
}: PackingListGeneratorProps) {
  const { t, language } = useLanguage();
  // Navigation & Form state
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activePL, setActivePL] = useState<Partial<PackingList> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const [showProductModal, setShowProductModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges, requestActionWithGuard } = useNavigationGuard();

  useEffect(() => {
    if (isEditing && activePL) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activePL.packingListNumber ? `Packing List: ${activePL.packingListNumber}` : 'Packing List Draft',
        docType: 'Packing List',
        onSave: () => {
          handleSavePackingListDocument();
        },
        onDiscard: () => {
          setIsEditing(false);
          setActivePL(null);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [isEditing, activePL, packingLists]);

  // Deep link triggers
  useEffect(() => {
    if (searchTarget && searchTarget.type === 'packing_list') {
      const found = packingLists.find(pl => pl.id === searchTarget.id);
      if (found) {
        setActivePL(found);
        setIsEditing(true);
      }
      clearSearchTarget();
    }
  }, [searchTarget, packingLists]);

  const filteredPL = packingLists.filter(pl => 
    pl.packingListNumber.toLowerCase().includes(search.toLowerCase()) ||
    pl.client.company.toLowerCase().includes(search.toLowerCase()) ||
    (pl.containerNumber && pl.containerNumber.toLowerCase().includes(search.toLowerCase()))
  );

  // Math totals calculator for Packing List items
  const recalculatePLTotals = (items: PackingListItem[]) => {
    const totalCartons = items.reduce((sum, item) => sum + (Number(item.numBoxes) || 0), 0);
    const totalPieces = items.reduce((sum, item) => sum + (Number(item.totalPieces) || 0), 0);
    const totalCbm = items.reduce((sum, item) => sum + (Number(item.cbm) || 0), 0);
    // Sum gross weight
    const totalWeight = items.reduce((sum, item) => sum + (Number(item.grossWeight) || 0), 0);

    return {
      items,
      totalCartons,
      totalPieces,
      totalCbm,
      totalWeight
    };
  };

  const handleFieldChange = (field: keyof PackingList, value: any) => {
    if (!activePL) return;
    setActivePL(prev => ({ ...prev, [field]: value }));
  };

  // Select client
  const handleSelectClient = (c: Client) => {
    handleFieldChange('client', c);
    setShowClientModal(false);
  };

  // Add product from Library
  const handleSelectProduct = (p: Product) => {
    if (!activePL) return;
    const currentItems = [...(activePL.items || [])];

    const ppb = p.piecesPerBox || 100;
    const initialQty = p.moq || ppb;
    const boxes = Math.ceil(initialQty / ppb);
    
    // Volume calculation in cubic meters (CBM) = (Length * Width * Height * Boxes) / 1,000,000
    const itemCbm = ((p.cartonLength || 0) * (p.cartonWidth || 0) * (p.cartonHeight || 0) * boxes) / 1000000;
    
    // Weight calculations = boxes * grossWeight per box
    const totalGross = boxes * (p.grossWeight || 0);
    const totalNet = boxes * (p.netWeight || 0);

    const newItem: PackingListItem = {
      id: generateId(),
      productId: p.id,
      name: p.name,
      sku: p.sku,
      size: p.size || '',
      hsCode: p.hsCode || '',
      quantity: initialQty,
      numBoxes: boxes,
      piecesPerBox: ppb,
      totalPieces: initialQty,
      grossWeight: Number(totalGross.toFixed(2)),
      netWeight: Number(totalNet.toFixed(2)),
      cartonLength: p.cartonLength || 40,
      cartonWidth: p.cartonWidth || 40,
      cartonHeight: p.cartonHeight || 40,
      cbm: Number(itemCbm.toFixed(3)),
      image: p.image
    };

    currentItems.push(newItem);
    const synced = recalculatePLTotals(currentItems);
    setActivePL(prev => ({ ...prev, ...synced }));
    setShowProductModal(false);
  };

  // Add custom item
  const handleAddManualItem = () => {
    if (!activePL) return;
    const currentItems = [...(activePL.items || [])];
    
    const newItem: PackingListItem = {
      id: generateId(),
      name: 'Custom Plastic Molded Cartons',
      sku: 'CUSTOM-01',
      size: '28/410',
      hsCode: '3923.30',
      quantity: 1000,
      numBoxes: 10,
      piecesPerBox: 100,
      totalPieces: 1000,
      grossWeight: 120.0,
      netWeight: 100.0,
      cartonLength: 50,
      cartonWidth: 40,
      cartonHeight: 40,
      cbm: 0.8 // (50*40*40*10)/1,000,000 = 0.8
    };

    currentItems.push(newItem);
    const synced = recalculatePLTotals(currentItems);
    setActivePL(prev => ({ ...prev, ...synced }));
  };

  // Update item details
  const handleItemRowChange = (index: number, key: keyof PackingListItem, value: any) => {
    if (!activePL) return;
    const currentItems = [...(activePL.items || [])];
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
        // Recalculate boxes
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
    } else if (key === 'numBoxes') {
      if (value === '') {
        item.numBoxes = '' as any;
        item.quantity = '' as any;
        item.totalPieces = '' as any;
      } else {
        const boxes = Math.max(0, Number(value));
        item.numBoxes = boxes;
        item.quantity = boxes * (Number(item.piecesPerBox) || 0);
        item.totalPieces = item.quantity;
      }
    } else if (key === 'grossWeight') {
      item.grossWeight = value === '' ? '' as any : Number(value);
    } else if (key === 'netWeight') {
      item.netWeight = value === '' ? '' as any : Number(value);
    } else if (key === 'cartonLength' || key === 'cartonWidth' || key === 'cartonHeight') {
      (item as any)[key] = value === '' ? '' as any : Number(value);
    } else {
      (item as any)[key] = value;
    }

    // Dynamic calculations after quantity or box changes
    const l = Number(item.cartonLength) || 0;
    const w = Number(item.cartonWidth) || 0;
    const h = Number(item.cartonHeight) || 0;
    const boxes = Number(item.numBoxes) || 0;

    item.cbm = Number(((l * w * h * boxes) / 1000000).toFixed(3));

    // If linked to a product, we can multiply the product box weights or let them be manually fine tuned
    const matchedProduct = products.find(p => p.id === item.productId);
    if (matchedProduct && (key === 'quantity' || key === 'piecesPerBox' || key === 'numBoxes')) {
      if (item.numBoxes !== '') {
        item.grossWeight = Number((boxes * (matchedProduct.grossWeight || 0)).toFixed(2));
        item.netWeight = Number((boxes * (matchedProduct.netWeight || 0)).toFixed(2));
      } else {
        item.grossWeight = '' as any;
        item.netWeight = '' as any;
      }
    }

    currentItems[index] = item;
    const synced = recalculatePLTotals(currentItems);
    setActivePL(prev => ({ ...prev, ...synced }));
  };

  const handleRemoveItem = (index: number) => {
    if (!activePL) return;
    const currentItems = [...(activePL.items || [])];
    currentItems.splice(index, 1);
    const synced = recalculatePLTotals(currentItems);
    setActivePL(prev => ({ ...prev, ...synced }));
  };

  const handleDuplicateItem = (index: number) => {
    if (!activePL || !activePL.items) return;
    const itemToClone = activePL.items[index];
    if (!itemToClone) return;

    const clonedItem: PackingListItem = {
      ...itemToClone,
      id: generateId()
    };

    const currentItems = [...activePL.items];
    currentItems.splice(index + 1, 0, clonedItem);
    const synced = recalculatePLTotals(currentItems);
    setActivePL(prev => ({ ...prev, ...synced }));
  };

  const handleDuplicatePackingList = (pl: PackingList, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newPL: PackingList = {
      ...pl,
      id: generateId(),
      packingListNumber: `${pl.packingListNumber}-COPY`,
      shipmentDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    onSavePackingLists([newPL, ...packingLists]);
    setActivePL(newPL);
    setIsEditing(true);
  };

  const handleApplyWarehousePreset = (preset: typeof CHINA_WAREHOUSE_PRESETS[0]) => {
    if (!activePL) return;
    setActivePL(prev => ({
      ...prev,
      transportMode: 'china_warehouse',
      chinaWarehouseName: preset.name,
      chinaWarehouseAddress: preset.address,
      chinaWarehouseContact: preset.contact,
      chinaWarehousePhone: preset.phone,
      domesticCarrier: preset.carrier,
      shippingType: preset.incoterm,
      deliveryMethod: preset.deliveryMethod,
      warehouseEntryCode: prev?.warehouseEntryCode || preset.entryCodePlaceholder
    }));
  };

  const handleCreateNew = () => {
    const nextPLNum = getNextDocumentNumber('packing', packingLists);
    setActivePL({
      title: 'PACKING LIST',
      packingListNumber: nextPLNum,
      transportMode: 'china_warehouse',
      containerNumber: 'MSKU0000000',
      sealNumber: 'CN-000000',
      shipmentDate: new Date().toISOString().split('T')[0],
      portOfLoading: 'Ningbo Port, China',
      portOfDestination: 'Port of Long Beach, USA',
      containerType: '20FT',
      shippingType: 'FCA Yiwu Warehouse',
      chinaWarehouseName: '义乌指定外贸货代仓 (Yiwu Forwarder Warehouse)',
      warehouseEntryCode: 'YIWU-EXP-2026-8821',
      chinaWarehouseAddress: '浙江省义乌市北苑街道雪峰西路968号传化公路港B区12号门',
      chinaWarehouseContact: '李主管 (Receiving Desk)',
      chinaWarehousePhone: '+86 138-5798-8821',
      domesticCarrier: '顺丰速运 (SF Express)',
      domesticTrackingNumber: 'SF1482938491823',
      shippingMarks: 'MILA / YIWU-WH / C/NO. 1-50',
      deliveryMethod: 'Dedicated Truck 4.2m (4.2米专线货车)',
      sellerName: settings.name || '',
      sellerAddress: settings.address || '',
      sellerContact: settings.contactPerson || 'Sales Dept',
      sellerPhone: settings.phone || '',
      sellerEmail: settings.email || '',
      sellerTaxId: settings.taxNumber || '',
      buyerName: clients[0]?.company || '',
      buyerAddress: clients[0]?.address || '',
      buyerContact: clients[0]?.contactPerson || '',
      buyerPhone: clients[0]?.phone || '',
      buyerEmail: clients[0]?.email || '',
      items: [],
      totalCbm: 0,
      totalCartons: 0,
      totalPieces: 0,
      totalWeight: 0,
      notes: 'Exporter declarations of weights are approximate. Packaging conform to standard seaworthy and warehouse delivery specifications.',
      client: clients[0] || { id: 'temp', company: 'Global Buyers', contactPerson: 'Agent', address: '', phone: '', email: '', country: 'Europe', notes: '' }
    });
    setIsEditing(true);
  };

  // Handle direct view target from Dashboard / Global search or 'new' draft action
  useEffect(() => {
    if (activeDocId) {
      if (activeDocId === 'new') {
        handleCreateNew();
      } else {
        const found = packingLists.find(pl => pl.id === activeDocId);
        if (found) {
          setActivePL(found);
          setIsEditing(true);
        }
      }
      clearActiveDoc();
    }
  }, [activeDocId, packingLists]);

  const handleSavePackingListDocument = () => {
    if (!activePL) return;
    if (!activePL.packingListNumber) {
      alert("Packing List Number is required");
      return;
    }

    const doc = { ...activePL } as PackingList;
    doc.createdAt = doc.createdAt || new Date().toISOString();

    // Normalize any temporary empty string inputs to numeric 0/defaults for database storage
    doc.items = (doc.items || []).map(item => ({
      ...item,
      quantity: Number(item.quantity) || 0,
      piecesPerBox: Number(item.piecesPerBox) || 0,
      numBoxes: Number(item.numBoxes) || 0,
      totalPieces: Number(item.totalPieces) || 0,
      grossWeight: Number(item.grossWeight) || 0,
      netWeight: Number(item.netWeight) || 0,
      cartonLength: Number(item.cartonLength) || 0,
      cartonWidth: Number(item.cartonWidth) || 0,
      cartonHeight: Number(item.cartonHeight) || 0,
      cbm: Number(item.cbm) || 0,
    }));

    let nextLists: PackingList[];
    if (doc.id) {
      nextLists = packingLists.map(pl => pl.id === doc.id ? doc : pl);
    } else {
      doc.id = generateId();
      nextLists = [doc, ...packingLists];
    }

    onSavePackingLists(nextLists);
    setIsEditing(false);
    setActivePL(null);
  };

  const handleDeletePackingList = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = window.confirm(language === 'zh' ? '确定要删除此装箱单吗？' : "Are you sure you want to delete this Packing List ledger?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const next = packingLists.filter(pl => pl.id !== id);
      onSavePackingLists(next);
    }
  };

  const handlePrint = () => {
    printDocument('print-area');
  };

  // PDF Download Execution
  const handleDownloadPDF = async () => {
    if (!activePL) return;
    setIsDownloading(true);
    try {
      await exportDocumentToPDF('print-area', activePL.packingListNumber || 'packing_list');
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
                <PackageOpen className="text-[#1565C0]" size={22} />
                {t('packing_list.title', 'Packing List Generator')}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                {t('packing_list.subtitle', 'Generate containerized packaging documents, calculate volume in CBM, and summarize weight ledgers.')}
              </p>
            </div>
            
            <button 
              onClick={handleCreateNew}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#1565C0] text-white hover:bg-blue-700 text-xs font-black transition-all shadow-sm shrink-0"
            >
              <Plus size={14} /> {t('packing_list.create_new', 'Create Packing List')}
            </button>
          </div>

          {/* Search bar */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex items-center gap-4">
            <div className="relative w-full max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={language === 'zh' ? '按单号、货柜号、客户搜索装箱单...' : 'Search packing lists by document number, container, client...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
              />
            </div>
            <span className="text-xs text-slate-400 font-semibold">{filteredPL.length} {language === 'zh' ? '条装箱单记录' : 'Lists Recorded'}</span>
          </div>

          {/* Table list */}
          {filteredPL.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <PackageOpen size={24} />
              </div>
              <p className="text-xs font-semibold text-slate-600">{language === 'zh' ? '暂无装箱单记录' : 'No packing sheets logged.'}</p>
              <p className="text-[10px] mt-1">{language === 'zh' ? '点击“新建装箱单”开始录入箱规与毛净重' : 'Tap "Create Packing List" to start structuring carton weights.'}</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">{t('packing_list.pl_number', 'Packing List No')}</th>
                      <th className="py-3 px-4">{t('packing_list.date', 'Shipment Date')}</th>
                      <th className="py-3 px-4">{t('packing_list.client', 'Importer Client')}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '货柜 / 入仓号' : 'Container / Code'}</th>
                      <th className="py-3 px-4">{t('packing_list.total_cbm', 'Total Volume (CBM)')}</th>
                      <th className="py-3 px-4 text-right">{language === 'zh' ? '操作' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredPL.map(pl => (
                      <tr 
                        key={pl.id}
                        onClick={() => {
                          setActivePL(pl);
                          setIsEditing(true);
                        }}
                        className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800 block">{pl.packingListNumber}</span>
                          {pl.transportMode === 'buyer_seller' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 mt-0.5">
                              <Users size={10} /> {language === 'zh' ? '买卖双方' : 'Buyer & Seller'}
                            </span>
                          ) : (pl.transportMode === 'china_warehouse' || (!pl.transportMode && pl.chinaWarehouseName)) ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 mt-0.5">
                              <Warehouse size={10} /> {language === 'zh' ? '国内仓' : 'China WH'}: {pl.warehouseEntryCode || 'Domestic'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5">
                              <Ship size={10} /> {language === 'zh' ? '海运' : 'Ocean'}: {pl.containerType || '20FT'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500">{pl.shipmentDate}</td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          <div>{pl.client?.company || pl.buyerName || (language === 'zh' ? '买方客户' : 'Buyer')}</div>
                          {pl.transportMode === 'buyer_seller' ? (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-[200px]">{language === 'zh' ? '卖方' : 'Seller'}: {pl.sellerName || settings.name}</div>
                          ) : pl.chinaWarehouseName && (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-[200px]">{pl.chinaWarehouseName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {pl.transportMode === 'buyer_seller' ? (
                            <span className="text-emerald-800 font-bold">{pl.shippingType || 'EXW / FOB'}</span>
                          ) : pl.chinaWarehouseName ? (
                            <span className="text-amber-800 font-bold">{pl.warehouseEntryCode || pl.domesticTrackingNumber || 'Domestic Dispatch'}</span>
                          ) : (
                            pl.containerNumber || 'N/A'
                          )}
                        </td>
                        <td className="py-3 px-4 font-black text-[#1565C0]">{pl.totalCbm.toFixed(2)} CBM ({pl.totalCartons} {language === 'zh' ? '箱' : 'Ctn'})</td>
                        <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePL(pl);
                                setIsEditing(true);
                              }}
                              className="p-1.5 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                              title={language === 'zh' ? '编辑/查看' : 'Edit'}
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDuplicatePackingList(pl, e)}
                              className="p-1.5 rounded text-slate-500 hover:text-[#1565C0] hover:bg-blue-50 cursor-pointer transition-colors"
                              title={language === 'zh' ? '复制装箱单' : 'Duplicate Packing List'}
                            >
                              <Copy size={13} />
                            </button>
                            <button
                              onClick={(e) => handleDeletePackingList(pl.id, e)}
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
                      setActivePL(null);
                    });
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500 cursor-pointer"
                  title={language === 'zh' ? '返回列表' : 'Back to ledger'}
                >
                  <X size={16} />
                </button>
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{language === 'zh' ? '装箱单编译器' : 'Packing List Compiler'}</h2>
                  <p className="text-sm font-black text-slate-800 mt-0.5">{activePL.packingListNumber || (language === 'zh' ? '装箱单草稿' : 'PL-Draft')}</p>
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
                  {language === 'zh' ? '单据预览' : 'Preview'}
                </button>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 justify-end">
              <button 
                type="button"
                onClick={() => {
                  if (activePL) {
                    handleDuplicatePackingList(activePL as PackingList);
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-[#1565C0] text-xs font-bold transition-all cursor-pointer"
                title={language === 'zh' ? '复制此装箱单' : 'Duplicate this Packing List'}
              >
                <Copy size={13} /> {language === 'zh' ? '复制装箱单' : 'Duplicate PL'}
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
                onClick={handleSavePackingListDocument}
                className="flex items-center gap-1.5 px-4 sm:px-5 py-1.5 rounded-lg bg-[#1565C0] hover:bg-blue-700 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Check size={13} /> {t('packing_list.save_button', 'Save PL')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <div className={`space-y-6 lg:col-span-6 print:hidden ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              {/* Core Logistics info */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Navigation size={12} className="text-[#1565C0]" /> Shipping & Delivery Logistics
                  </span>
                  
                  {/* Transport Mode Switcher Tabs */}
                  <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transportMode', 'buyer_seller')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                        activePL.transportMode === 'buyer_seller'
                          ? 'bg-white text-[#1565C0] shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Users size={11} /> Buyer & Seller (买卖双方)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transportMode', 'china_warehouse')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                        (activePL.transportMode === 'china_warehouse' || (!activePL.transportMode && activePL.chinaWarehouseName))
                          ? 'bg-white text-[#1565C0] shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Warehouse size={11} /> China Warehouse (国内指定仓)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transportMode', 'sea')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                        activePL.transportMode === 'sea' || (!activePL.transportMode && !activePL.chinaWarehouseName && activePL.transportMode !== 'buyer_seller')
                          ? 'bg-white text-[#1565C0] shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Ship size={11} /> Ocean Freight (海运)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('transportMode', 'air_express')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
                        activePL.transportMode === 'air_express'
                          ? 'bg-white text-[#1565C0] shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Plane size={11} /> Air / Express (空运)
                    </button>
                  </div>
                </div>

                {/* Common Header Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Document Title / Header</label>
                    <input 
                      type="text" 
                      value={activePL.title || ''}
                      placeholder="PACKING LIST"
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-extrabold text-[#1565C0] placeholder-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Packing List Number</label>
                    <input 
                      type="text" 
                      value={activePL.packingListNumber || ''}
                      onChange={(e) => handleFieldChange('packingListNumber', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Delivery / Dispatch Date</label>
                    <input 
                      type="date" 
                      value={activePL.shipmentDate || ''}
                      onChange={(e) => handleFieldChange('shipmentDate', e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                    />
                  </div>
                </div>

                {/* Conditional Logistics Sections */}
                {activePL.transportMode === 'buyer_seller' ? (
                  /* =================== SIMPLE BUYER & SELLER MODE =================== */
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    {/* Seller Details Card */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1">
                          <Building2 size={11} className="text-[#1565C0]" /> Seller Details (卖方 / 供应商信息)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActivePL(prev => ({
                              ...prev,
                              sellerName: settings.name,
                              sellerAddress: settings.address,
                              sellerContact: settings.contactPerson || 'Sales Dept',
                              sellerPhone: settings.phone,
                              sellerEmail: settings.email,
                              sellerTaxId: settings.taxNumber
                            }));
                          }}
                          className="text-[9px] text-[#1565C0] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RotateCcw size={9} /> Reset to Company Profile
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Seller Company Name (卖方公司名称)</label>
                          <input
                            type="text"
                            value={activePL.sellerName !== undefined ? activePL.sellerName : settings.name}
                            onChange={(e) => handleFieldChange('sellerName', e.target.value)}
                            placeholder={settings.name || 'Seller Company Name'}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Seller Address (卖方地址)</label>
                          <input
                            type="text"
                            value={activePL.sellerAddress !== undefined ? activePL.sellerAddress : settings.address}
                            onChange={(e) => handleFieldChange('sellerAddress', e.target.value)}
                            placeholder={settings.address || 'Address, City, Country'}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Contact Person (联系人)</label>
                          <input
                            type="text"
                            value={activePL.sellerContact !== undefined ? activePL.sellerContact : (settings.contactPerson || 'Sales Dept')}
                            onChange={(e) => handleFieldChange('sellerContact', e.target.value)}
                            placeholder="e.g. Sales Dept"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Seller Phone (电话)</label>
                          <input
                            type="text"
                            value={activePL.sellerPhone !== undefined ? activePL.sellerPhone : settings.phone}
                            onChange={(e) => handleFieldChange('sellerPhone', e.target.value)}
                            placeholder={settings.phone || '+86 ...'}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Seller Email (邮箱)</label>
                          <input
                            type="text"
                            value={activePL.sellerEmail !== undefined ? activePL.sellerEmail : settings.email}
                            onChange={(e) => handleFieldChange('sellerEmail', e.target.value)}
                            placeholder={settings.email || 'info@company.com'}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Tax ID / VAT (税号)</label>
                          <input
                            type="text"
                            value={activePL.sellerTaxId !== undefined ? activePL.sellerTaxId : (settings.taxNumber || '')}
                            onChange={(e) => handleFieldChange('sellerTaxId', e.target.value)}
                            placeholder="e.g. 91330782MA2..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Buyer Details Card */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1">
                          <UserCheck size={11} className="text-[#1565C0]" /> Buyer Details (买方 / 客户信息)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowClientModal(true)}
                          className="text-[9px] text-[#1565C0] font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Database size={9} /> Pick Client From Directory
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Buyer / Company Name (买方公司名称)</label>
                          <input
                            type="text"
                            value={activePL.buyerName !== undefined ? activePL.buyerName : (activePL.client?.company || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleFieldChange('buyerName', val);
                              setActivePL(prev => ({
                                ...prev,
                                client: { ...prev.client, company: val }
                              }));
                            }}
                            placeholder="e.g. Global Tech Imports Ltd"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Buyer Address & Country (买方地址与国家)</label>
                          <input
                            type="text"
                            value={activePL.buyerAddress !== undefined ? activePL.buyerAddress : (activePL.client?.address || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleFieldChange('buyerAddress', val);
                              setActivePL(prev => ({
                                ...prev,
                                client: { ...prev.client, address: val }
                              }));
                            }}
                            placeholder="e.g. 100 Main St, New York, NY 10001, USA"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Contact Person (联系人)</label>
                          <input
                            type="text"
                            value={activePL.buyerContact !== undefined ? activePL.buyerContact : (activePL.client?.contactPerson || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleFieldChange('buyerContact', val);
                              setActivePL(prev => ({
                                ...prev,
                                client: { ...prev.client, contactPerson: val }
                              }));
                            }}
                            placeholder="e.g. John Smith"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Buyer Phone (电话)</label>
                          <input
                            type="text"
                            value={activePL.buyerPhone !== undefined ? activePL.buyerPhone : (activePL.client?.phone || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleFieldChange('buyerPhone', val);
                              setActivePL(prev => ({
                                ...prev,
                                client: { ...prev.client, phone: val }
                              }));
                            }}
                            placeholder="e.g. +1 555-0199"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Buyer Email (邮箱)</label>
                          <input
                            type="text"
                            value={activePL.buyerEmail !== undefined ? activePL.buyerEmail : (activePL.client?.email || '')}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleFieldChange('buyerEmail', val);
                              setActivePL(prev => ({
                                ...prev,
                                client: { ...prev.client, email: val }
                              }));
                            }}
                            placeholder="e.g. purchasing@buyer.com"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Tax ID / VAT (税号/VAT)</label>
                          <input
                            type="text"
                            value={activePL.buyerTaxId || ''}
                            onChange={(e) => handleFieldChange('buyerTaxId', e.target.value)}
                            placeholder="e.g. US-EIN-9928192"
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Trade & Terms */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Trade Terms (贸易/交货条款)</label>
                        <select
                          value={activePL.shippingType || 'EXW'}
                          onChange={(e) => handleFieldChange('shippingType', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold text-[#1565C0]"
                        >
                          <option value="EXW">EXW (Ex Works / 工厂自提)</option>
                          <option value="FOB">FOB (Free On Board / 离岸价)</option>
                          <option value="FCA">FCA (Free Carrier / 货交承运人)</option>
                          <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                          <option value="CFR">CFR (Cost and Freight)</option>
                          <option value="DDP">DDP (Delivered Duty Paid)</option>
                          <option value="DAP">DAP (Delivered At Place)</option>
                          <option value="Domestic Delivery">Domestic Delivery (国内送货)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                          <Tag size={11} className="text-slate-400" /> Shipping Marks (外箱唛头)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. N/M or BUYER / C/NO. 1-20"
                          value={activePL.shippingMarks || ''}
                          onChange={(e) => handleFieldChange('shippingMarks', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ) : (activePL.transportMode === 'china_warehouse' || (!activePL.transportMode && activePL.chinaWarehouseName)) ? (
                  /* =================== CHINA WAREHOUSE / DOMESTIC DELIVERY =================== */
                  <div className="space-y-4 pt-2 border-t border-slate-100">
                    {/* Quick Presets */}
                    <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1">
                          <Sparkles size={11} className="text-[#1565C0]" /> 1-Click China Warehouse Presets (国内集运仓快捷填充)
                        </span>
                        <span className="text-[9px] text-blue-600 font-semibold">Auto-fills address, entry code & forwarder details</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {CHINA_WAREHOUSE_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handleApplyWarehousePreset(preset)}
                            className="text-[10px] bg-white hover:bg-blue-600 hover:text-white text-blue-800 font-bold px-2.5 py-1 rounded-lg border border-blue-200 transition-colors shadow-2xs flex items-center gap-1"
                          >
                            <Building2 size={10} /> {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Inbound Entry Code / SO No. */}
                      <div className="col-span-2 bg-amber-50/50 border border-amber-200/80 rounded-xl p-3 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-[10px] font-extrabold text-amber-900 uppercase flex items-center gap-1">
                            <Barcode size={12} className="text-amber-600" /> Inbound Entry Code / SO No. (进仓编号 / 入仓单号)
                          </label>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                            Mandatory for Forwarder Intake (进仓必填)
                          </span>
                        </div>
                        <input 
                          type="text" 
                          placeholder="e.g. YIWU-EXP-2026-8821 / SO# 994821 / 进仓号"
                          value={activePL.warehouseEntryCode || ''}
                          onChange={(e) => handleFieldChange('warehouseEntryCode', e.target.value.toUpperCase())}
                          className="w-full bg-white border border-amber-300 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-slate-900 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {/* Warehouse Name */}
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Destination Warehouse / Forwarder Name (客户指定仓库 / 货代名称)
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. 义乌指定外贸货代仓 (Yiwu Forwarder Warehouse #3)"
                          value={activePL.chinaWarehouseName || ''}
                          onChange={(e) => handleFieldChange('chinaWarehouseName', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-800"
                        />
                      </div>

                      {/* Warehouse Delivery Address */}
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                          <MapPin size={11} className="text-slate-400" /> China Warehouse Delivery Address (国内仓库送货详细地址)
                        </label>
                        <textarea 
                          rows={2}
                          placeholder="e.g. 浙江省义乌市北苑街道雪峰西路968号传化公路港B区12号门"
                          value={activePL.chinaWarehouseAddress || ''}
                          onChange={(e) => handleFieldChange('chinaWarehouseAddress', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 resize-y font-medium"
                        />
                      </div>

                      {/* Contact Person */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Warehouse Contact Person (收货联系人)
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. 李主管 / Receiving Dept"
                          value={activePL.chinaWarehouseContact || ''}
                          onChange={(e) => handleFieldChange('chinaWarehouseContact', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                        />
                      </div>

                      {/* Contact Phone */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Warehouse Phone / Mobile (仓管收货电话/微信)
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. +86 138-5798-8821"
                          value={activePL.chinaWarehousePhone || ''}
                          onChange={(e) => handleFieldChange('chinaWarehousePhone', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                        />
                      </div>

                      {/* Domestic Carrier / Logistics Company */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                          <Truck size={11} className="text-slate-400" /> Domestic Carrier (国内承运商 / 快递物流)
                        </label>
                        <input 
                          type="text" 
                          list="domestic-carrier-list"
                          placeholder="e.g. 顺丰速运 (SF Express)"
                          value={activePL.domesticCarrier || ''}
                          onChange={(e) => handleFieldChange('domesticCarrier', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                        />
                        <datalist id="domestic-carrier-list">
                          <option value="顺丰速运 (SF Express)" />
                          <option value="德邦物流 / 德邦快递 (Deppon Express)" />
                          <option value="安能物流 (ANE Freight)" />
                          <option value="中通快运 (ZTO Freight)" />
                          <option value="跨越速运 (KY Express)" />
                          <option value="专线货运包车 (Dedicated Freight Truck)" />
                          <option value="客户指定货车自提 (Customer Self-Pickup / EXW)" />
                          <option value="工厂专车直发 (Factory Direct Truck)" />
                        </datalist>
                      </div>

                      {/* Domestic Tracking / Waybill No */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Domestic Tracking # (国内物流单号 / 运单号)
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. SF1482938491823"
                          value={activePL.domesticTrackingNumber || ''}
                          onChange={(e) => handleFieldChange('domesticTrackingNumber', e.target.value.toUpperCase())}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700"
                        />
                      </div>

                      {/* Delivery Vehicle Specification / Method */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Delivery Method (送货车型 / 运输规格)
                        </label>
                        <select 
                          value={activePL.deliveryMethod || 'Dedicated Truck 4.2m (4.2米专线货车)'}
                          onChange={(e) => handleFieldChange('deliveryMethod', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                        >
                          <option value="Dedicated Truck 4.2m (4.2米专线货车)">Dedicated Truck 4.2m (4.2米专线货车)</option>
                          <option value="Dedicated Truck 6.8m (6.8米专线货车)">Dedicated Truck 6.8m (6.8米专线货车)</option>
                          <option value="Dedicated Truck 9.6m (9.6米厢式货车)">Dedicated Truck 9.6m (9.6米厢式货车)</option>
                          <option value="LTL Loose Pallets (零担打托配货)">LTL Loose Pallets (零担打托配货)</option>
                          <option value="Courier Express (快递直达送仓)">Courier Express (快递直达送仓)</option>
                          <option value="LCL Warehouse Drayage (拼箱货柜车送仓)">LCL Warehouse Drayage (拼箱货柜车送仓)</option>
                          <option value="Customer Self-Pickup (客户自提 / 工厂交货)">Customer Self-Pickup (客户自提 / 工厂交货)</option>
                        </select>
                      </div>

                      {/* Shipping Terms (Incoterm) */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                          Trade Term (国内/出口交货条款)
                        </label>
                        <select 
                          value={activePL.shippingType || 'FCA Yiwu Warehouse'}
                          onChange={(e) => handleFieldChange('shippingType', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold text-[#1565C0]"
                        >
                          <option value="FCA Yiwu Warehouse">FCA Yiwu Warehouse (义乌指定仓交货)</option>
                          <option value="FCA Guangzhou Warehouse">FCA Guangzhou Warehouse (广州指定仓交货)</option>
                          <option value="FCA Shenzhen Warehouse">FCA Shenzhen Warehouse (深圳指定仓交货)</option>
                          <option value="FCA Ningbo Warehouse">FCA Ningbo Warehouse (宁波指定仓交货)</option>
                          <option value="FCA China Warehouse">FCA China Warehouse (指定国内仓库交货)</option>
                          <option value="EXW Factory">EXW Factory (工厂自提/不含运费)</option>
                          <option value="DDP China Warehouse">DDP China Warehouse (包邮含税送达指定仓)</option>
                          <option value="FOB Ningbo Port">FOB Ningbo Port (宁波港离岸)</option>
                          <option value="FOB Shanghai Port">FOB Shanghai Port (上海港离岸)</option>
                          <option value="FOB Shenzhen Port">FOB Shenzhen Port (深圳港离岸)</option>
                          <option value="Domestic Delivery">Domestic Delivery (国内送货上门)</option>
                          <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                          <option value="CFR">CFR (Cost and Freight)</option>
                          <option value="DAP">DAP (Delivered At Place)</option>
                        </select>
                      </div>

                      {/* Shipping Marks / Box Markings */}
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 flex items-center gap-1">
                          <Tag size={11} className="text-slate-400" /> Shipping Marks & Labels (外箱唛头 / 唛头标识)
                        </label>
                        <input 
                          type="text" 
                          placeholder="e.g. MILA / YIWU-WH / C/NO. 1-50 或 N/M (Neutral Mark)"
                          value={activePL.shippingMarks || ''}
                          onChange={(e) => handleFieldChange('shippingMarks', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* =================== STANDARD OCEAN / AIR FREIGHT =================== */
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Container / Airway Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. MSKU8829321"
                        value={activePL.containerNumber || ''}
                        onChange={(e) => handleFieldChange('containerNumber', e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Customs Seal Number</label>
                      <input 
                        type="text" 
                        placeholder="e.g. EG-993211"
                        value={activePL.sealNumber || ''}
                        onChange={(e) => handleFieldChange('sealNumber', e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-700"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Port of Loading</label>
                        <div className="flex gap-1 text-[8px]">
                          {['Ningbo', 'Shanghai', 'Shenzhen', 'Qingdao'].map(port => (
                            <button
                              key={port}
                              type="button"
                              onClick={() => handleFieldChange('portOfLoading', `${port} Port, China`)}
                              className="text-[#1565C0] hover:underline"
                            >
                              {port}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={activePL.portOfLoading || ''}
                        onChange={(e) => handleFieldChange('portOfLoading', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Port of Destination</label>
                        <div className="flex gap-1 text-[8px]">
                          {['Long Beach', 'Rotterdam', 'Hamburg', 'Jebel Ali'].map(port => (
                            <button
                              key={port}
                              type="button"
                              onClick={() => handleFieldChange('portOfDestination', `Port of ${port}`)}
                              className="text-[#1565C0] hover:underline"
                            >
                              {port}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input 
                        type="text" 
                        value={activePL.portOfDestination || ''}
                        onChange={(e) => handleFieldChange('portOfDestination', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Container Specification</label>
                      <select 
                        value={activePL.containerType || ''}
                        onChange={(e) => handleFieldChange('containerType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700"
                      >
                        <option value="20FT">20FT Dry Container</option>
                        <option value="40FT">40FT Dry Container</option>
                        <option value="40HQ">40FT High-Cube (HQ)</option>
                        <option value="45HQ">45FT High-Cube (HQ)</option>
                        <option value="LCL">LCL (Less Container Load)</option>
                        <option value="TRUCK">Dedicated Truck / LTL</option>
                        <option value="EXPRESS">Express Courier (Air)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Shipping Type (Incoterm)</label>
                      <select 
                        value={activePL.shippingType || 'FOB'}
                        onChange={(e) => handleFieldChange('shippingType', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-bold text-[#1565C0]"
                      >
                        <option value="FOB">FOB (Free On Board)</option>
                        <option value="EXW">EXW (Ex Works)</option>
                        <option value="DDP">DDP (Delivered Duty Paid)</option>
                        <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                        <option value="CFR">CFR (Cost and Freight)</option>
                        <option value="DAP">DAP (Delivered At Place)</option>
                        <option value="FCA">FCA (Free Carrier)</option>
                        <option value="CIP">CIP (Carriage & Insurance Paid)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Client Selector (Only shown for non-buyer_seller modes where buyer is handled within main section) */}
              {activePL.transportMode !== 'buyer_seller' && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Database size={12} /> Consignee Importer Mappings
                    </span>
                    
                    <button
                      type="button"
                      onClick={() => setShowClientModal(true)}
                      className="text-[10px] text-[#1565C0] font-bold hover:underline cursor-pointer"
                    >
                      Select From Directory
                    </button>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                    <p className="text-[9px] text-[#1565C0] font-bold uppercase tracking-widest">{activePL.client?.country || 'USA'}</p>
                    <p className="font-extrabold text-slate-800 text-xs mt-1">{activePL.client?.company || 'No client selected'}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Attn: {activePL.client?.contactPerson || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Item row listing */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database size={12} /> Packaged Cartons Ledger
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddManualItem}
                      className="text-[10px] text-slate-500 font-bold hover:underline"
                    >
                      Manual Row
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setShowProductModal(true)}
                      className="text-[10px] text-[#1565C0] font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Plus size={10} /> Add from Catalog
                    </button>
                  </div>
                </div>

                <div className="space-y-5 divide-y divide-slate-100">
                  {(!activePL.items || activePL.items.length === 0) ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No cartons mapped. Choose a product SKU to auto-populate shipping dimensions.
                    </div>
                  ) : (
                    activePL.items.map((item, index) => (
                      <div key={item.id} className="pt-4 first:pt-0 space-y-3">
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
                              <span className="text-[9px] font-mono font-bold text-slate-400">SKU Code: {item.sku}</span>
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

                        {/* Logistics specifications rows */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">Total Pieces (Qty)</label>
                            <input 
                              type="number" 
                              value={item.quantity}
                              onChange={(e) => handleItemRowChange(index, 'quantity', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">Pcs / Box</label>
                            <input 
                              type="number" 
                              value={item.piecesPerBox}
                              onChange={(e) => handleItemRowChange(index, 'piecesPerBox', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-slate-400 mb-1">Total Cartons</label>
                            <input 
                              type="number" 
                              value={item.numBoxes}
                              onChange={(e) => handleItemRowChange(index, 'numBoxes', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-semibold text-[#1565C0]"
                            />
                          </div>

                          {/* Dimensions fields */}
                          <div className="grid grid-cols-3 gap-1 col-span-2 sm:col-span-1">
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold mb-1">L(cm)</label>
                              <input 
                                type="number" 
                                value={item.cartonLength}
                                onChange={(e) => handleItemRowChange(index, 'cartonLength', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1 text-[10px] text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold mb-1">W(cm)</label>
                              <input 
                                type="number" 
                                value={item.cartonWidth}
                                onChange={(e) => handleItemRowChange(index, 'cartonWidth', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1 text-[10px] text-center"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] text-slate-400 font-bold mb-1">H(cm)</label>
                              <input 
                                type="number" 
                                value={item.cartonHeight}
                                onChange={(e) => handleItemRowChange(index, 'cartonHeight', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-md p-1 text-[10px] text-center"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Weights & Volume */}
                        <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                          <div>
                            <label className="block text-[8px] text-slate-400 font-bold mb-1">Total Gross Wt (kg)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={item.grossWeight ?? 0}
                              onChange={(e) => handleItemRowChange(index, 'grossWeight', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-700 focus:border-[#1565C0] focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-400 font-bold mb-1">Total Net Wt (kg)</label>
                            <input 
                              type="number" 
                              step="0.01"
                              value={item.netWeight ?? 0}
                              onChange={(e) => handleItemRowChange(index, 'netWeight', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-xs font-bold text-slate-700 focus:border-[#1565C0] focus:outline-hidden"
                            />
                          </div>
                          <div className="text-right flex flex-col justify-end pb-1.5">
                            <span className="block text-[8px] text-slate-400 font-bold mb-0.5">Volume (CBM)</span>
                            <span className="text-xs font-black text-[#1565C0]">{item.cbm || 0} m³</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* General remarks */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activePL.showNotes !== false}
                      onChange={(e) => handleFieldChange('showNotes', e.target.checked)}
                      className="rounded text-[#1565C0] focus:ring-[#1565C0] h-3.5 w-3.5"
                    />
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                      Logistical Remarks & Dispatch Notes
                    </span>
                  </label>
                  {activePL.showNotes !== false && (
                    <input
                      type="text"
                      value={activePL.notesTitle || ''}
                      onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                      placeholder="Title (Default: CONTAINER DISPATCH NOTES)"
                      className="text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-0.5 text-slate-600 w-56 text-right"
                    />
                  )}
                </div>
                
                {activePL.showNotes !== false ? (
                  <div>
                    <textarea 
                      rows={2}
                      value={activePL.notes || ''}
                      onChange={(e) => handleFieldChange('notes', e.target.value)}
                      placeholder="Enter container stuffing notes, cargo handling instructions, pallet specifications..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 leading-relaxed resize-y"
                    />
                    <div className="flex flex-wrap gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('notes', 'All cargo packed in standard export cartons with protective shrink-wrap and strapped onto fumigated wooden pallets. Handle with care, keep dry.')}
                        className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        + Standard Export Packing & Pallet Notes
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Logistical remarks & dispatch notes are hidden from this packing list.</p>
                )}
              </div>
            </div>

            {/* Right Side Live A4 Packing List Preview */}
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

              {/* Scrollable Container with Zoom */}
              <div className="w-full overflow-x-auto pb-6 flex justify-center bg-slate-100/50 p-2 sm:p-4 rounded-xl border border-slate-200/80">
                <div 
                  id="print-area"
                  style={{
                    transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                    transformOrigin: 'top center',
                    marginBottom: previewZoom > 100 ? `${(previewZoom - 100) * 8}px` : undefined
                  }}
                  className="w-full max-w-[210mm] min-h-[296mm] bg-white border border-slate-200 shadow-xl rounded-none p-4 sm:p-8 md:p-[12mm] text-slate-800 flex flex-col justify-between font-sans relative shrink-0 box-border overflow-hidden transition-all duration-150 print:p-0 print:border-none print:shadow-none print:w-full print:max-w-none"
                >
                {/* Upper block */}
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
                        {settings.taxNumber && <p>Tax Registration: {settings.taxNumber}</p>}
                      </div>
                    </div>

                    <div className="text-left sm:text-right w-full sm:w-auto">
                      <input
                        type="text"
                        value={activePL.title || 'PACKING LIST'}
                        onChange={(e) => handleFieldChange('title', e.target.value)}
                        className="text-left sm:text-right bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-[#1565C0] text-xl font-black text-[#1565C0] uppercase tracking-tight w-full outline-hidden"
                        title="Click to edit document title"
                        placeholder="PACKING LIST"
                      />
                      <div className="mt-3 grid grid-cols-2 gap-x-2.5 gap-y-1 text-[9px] text-slate-500 leading-normal font-semibold text-left justify-end">
                        <span className="font-bold text-slate-400 text-left sm:text-right">Packing List No:</span>
                        <span className="font-bold text-slate-800">{activePL.packingListNumber}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Date:</span>
                        <span className="text-slate-800">{activePL.shipmentDate}</span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">
                          {activePL.transportMode === 'buyer_seller'
                            ? (activePL.shippingMarks ? 'Marks / Ref:' : 'Dispatch Mode:')
                            : (activePL.transportMode === 'china_warehouse' || (!activePL.transportMode && activePL.chinaWarehouseName))
                            ? 'Delivery Type:'
                            : 'Container Type:'}
                        </span>
                        <span className="text-slate-800 font-bold">
                          {activePL.transportMode === 'buyer_seller'
                            ? (activePL.shippingMarks || 'Direct Dispatch')
                            : (activePL.transportMode === 'china_warehouse' || (!activePL.transportMode && activePL.chinaWarehouseName))
                            ? (activePL.deliveryMethod || 'China Warehouse Delivery')
                            : (activePL.containerType || '20FT')}
                        </span>
                        <span className="font-bold text-slate-400 text-left sm:text-right">Trade Term:</span>
                        <span className="text-[#1565C0] font-extrabold">{activePL.shippingType || (activePL.transportMode === 'buyer_seller' ? 'EXW' : 'FOB')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Consignee and shipment ports / China Warehouse details / Buyer & Seller */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                    {activePL.transportMode === 'buyer_seller' ? (
                      /* =================== BUYER & SELLER 2-PARTY CARDS =================== */
                      <>
                        {/* Seller (Left Box) */}
                        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Seller (卖方 / 供应商)</span>
                            {(activePL.sellerTaxId || settings.taxNumber) && (
                              <span className="text-[7.5px] text-slate-400 font-mono">Tax ID: {activePL.sellerTaxId || settings.taxNumber}</span>
                            )}
                          </div>
                          <p className="text-xs font-black text-slate-900">{activePL.sellerName || settings.name || 'Seller Company'}</p>
                          <div className="text-[9px] text-slate-500 leading-normal font-semibold space-y-0.5">
                            <p>Attn: {activePL.sellerContact || settings.contactPerson || 'Sales Dept'} {(activePL.sellerPhone || settings.phone) ? `• Tel: ${activePL.sellerPhone || settings.phone}` : ''}</p>
                            <p>{activePL.sellerAddress || settings.address}</p>
                            {(activePL.sellerEmail || settings.email) && <p>Email: {activePL.sellerEmail || settings.email}</p>}
                          </div>
                        </div>

                        {/* Buyer (Right Box) */}
                        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-100 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black text-[#1565C0] uppercase tracking-widest block">Buyer (买方 / 采购商)</span>
                            {activePL.buyerTaxId && (
                              <span className="text-[7.5px] text-slate-400 font-mono">Tax ID: {activePL.buyerTaxId}</span>
                            )}
                          </div>
                          <p className="text-xs font-black text-slate-900">{activePL.client?.company || activePL.buyerName || 'Buyer Company'}</p>
                          <div className="text-[9px] text-slate-500 leading-normal font-semibold space-y-0.5">
                            <p>Attn: {activePL.client?.contactPerson || activePL.buyerContact || 'Purchasing Dept'} {(activePL.client?.phone || activePL.buyerPhone) ? `• Tel: ${activePL.client?.phone || activePL.buyerPhone}` : ''}</p>
                            <p>{activePL.client?.address || activePL.buyerAddress || 'Address'}</p>
                            <p>{activePL.client?.country || ''} {(activePL.client?.email || activePL.buyerEmail) ? `• Email: ${activePL.client?.email || activePL.buyerEmail}` : ''}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      /* =================== STANDARD LOGISTICS CARDS =================== */
                      <>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Consignee (Importer / Buyer)</span>
                          <p className="text-xs font-black text-slate-800">{activePL.client?.company}</p>
                          <div className="text-[9px] text-slate-500 leading-normal font-semibold">
                            <p>Attn: {activePL.client?.contactPerson}</p>
                            <p>{activePL.client?.address}</p>
                            <p>{activePL.client?.country}</p>
                          </div>
                        </div>

                        {(activePL.transportMode === 'china_warehouse' || (!activePL.transportMode && activePL.chinaWarehouseName)) ? (
                          /* China Warehouse Delivery Details Box */
                          <div className="p-3 bg-amber-50/40 border border-amber-200/80 rounded-lg space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[8px] font-black text-amber-900 uppercase tracking-widest block">
                                China Warehouse Delivery (国内指定仓明细)
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-600 leading-tight font-semibold space-y-0.5">
                              <p><span className="font-bold text-slate-400">Warehouse:</span> <span className="font-bold text-slate-900">{activePL.chinaWarehouseName || 'Designated Forwarder WH'}</span></p>
                              <p className="truncate"><span className="font-bold text-slate-400">Address:</span> <span className="text-slate-800">{activePL.chinaWarehouseAddress || 'China Inbound Warehouse Address'}</span></p>
                              <p><span className="font-bold text-slate-400">Contact:</span> {activePL.chinaWarehouseContact || 'WH Desk'} • Tel: {activePL.chinaWarehousePhone || 'N/A'}</p>
                              <p><span className="font-bold text-slate-400">Domestic Carrier:</span> {activePL.domesticCarrier || 'Express'} {activePL.domesticTrackingNumber ? `• Tracking: ${activePL.domesticTrackingNumber}` : ''}</p>
                              {activePL.shippingMarks && <p><span className="font-bold text-slate-400">Marks:</span> <span className="font-mono text-slate-800">{activePL.shippingMarks}</span></p>}
                            </div>
                          </div>
                        ) : (
                          /* Sea Freight Particulars */
                          <div className="p-3 bg-white border border-slate-100 rounded-lg space-y-1">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Sea Freight Particulars</span>
                            <div className="text-[9px] text-slate-500 leading-normal font-semibold grid grid-cols-2 gap-x-2">
                              <span className="font-bold text-slate-400">Vessel Container No:</span>
                              <span className="font-extrabold text-slate-800">{activePL.containerNumber || 'N/A'}</span>
                              <span className="font-bold text-slate-400">Customs Seal No:</span>
                              <span className="font-extrabold text-slate-800">{activePL.sealNumber || 'N/A'}</span>
                              <span className="font-bold text-slate-400">Port of Loading:</span>
                              <span className="text-slate-800">{activePL.portOfLoading}</span>
                              <span className="font-bold text-slate-400">Port of Discharge:</span>
                              <span className="text-slate-800">{activePL.portOfDestination}</span>
                              <span className="font-bold text-slate-400">Shipping Type:</span>
                              <span className="font-extrabold text-[#1565C0]">{activePL.shippingType || 'FOB'}</span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto w-full -mx-1 sm:mx-0">
                    <table className="w-full min-w-[550px] text-left border-collapse text-[9px]">
                      <thead>
                        <tr className="bg-[#1565C0] text-white font-bold uppercase text-[8px] border-b border-[#1565C0]">
                          <th className="py-2 px-2 rounded-l">Package Specifications</th>
                          <th className="py-2 px-2 text-center">Size / NK</th>
                          <th className="py-2 px-2 text-center">Carton Size (cm)</th>
                          <th className="py-2 px-2 text-center">Cartons</th>
                          <th className="py-2 px-2 text-right">Gross Wt (kg)</th>
                          <th className="py-2 px-2 text-right">Net Wt (kg)</th>
                          <th className="py-2 px-2 text-right rounded-r">Volume (CBM)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 leading-tight font-semibold text-slate-700">
                        {(!activePL.items || activePL.items.length === 0) ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-400">
                              No carton list mapped.
                            </td>
                          </tr>
                        ) : (
                          activePL.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-2 px-2">
                                <div className="flex items-center gap-2">
                                  {item.image && <img src={item.image} alt="" className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />}
                                  <div>
                                    <p className="font-extrabold text-slate-800">{item.name}</p>
                                    <div className="flex items-center gap-1.5 text-[8px] text-slate-400 font-semibold">
                                      <span>SKU: {item.sku}</span>
                                      {item.hsCode && (
                                        <>
                                          <span>•</span>
                                          <span>HS Code: {item.hsCode}</span>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span>Qty: {item.quantity.toLocaleString()} pieces ({item.piecesPerBox} Pcs/Box)</span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-center font-bold font-mono text-slate-800">{item.size || '-'}</td>
                              <td className="py-2 px-2 text-center">{item.cartonLength}x{item.cartonWidth}x{item.cartonHeight}</td>
                              <td className="py-2 px-2 text-center font-bold text-slate-800">{item.numBoxes} Ctn</td>
                              <td className="py-2 px-2 text-right font-bold">{(item.grossWeight || 0).toFixed(1)}</td>
                              <td className="py-2 px-2 text-right">{(item.netWeight || 0).toFixed(1)}</td>
                              <td className="py-2 px-2 text-right font-bold text-[#1565C0]">{(item.cbm || 0).toFixed(3)} m³</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary row */}
                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 sm:p-3.5 flex flex-col sm:flex-row justify-between gap-3 sm:gap-6 items-start sm:items-center text-[10px] text-slate-500 font-extrabold">
                    <div className="flex items-center gap-2">
                      <Calculator size={13} className="text-slate-400" />
                      <span>LOGISTICS TOTALS SUMMARY</span>
                    </div>

                    <div className="flex flex-wrap gap-4 sm:gap-6 leading-none w-full sm:w-auto justify-between sm:justify-end">
                      <div>
                        <span className="text-[8px] text-slate-400 block uppercase">Total Cartons</span>
                        <span className="text-slate-800 font-black text-sm">{(activePL.totalCartons || 0)} Ctn</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block uppercase">Total Pieces</span>
                        <span className="text-slate-800 font-black text-sm">{(activePL.totalPieces || 0).toLocaleString()} Pcs</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block uppercase">Gross Cargo Weight</span>
                        <span className="text-slate-800 font-black text-sm">{(activePL.totalWeight || 0).toFixed(1)} kg</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-[#1565C0] block uppercase">Cargo Volume (CBM)</span>
                        <span className="text-[#1565C0] font-black text-sm">{(activePL.totalCbm || 0).toFixed(3)} m³</span>
                      </div>
                    </div>
                  </div>

                  {/* Container Dispatch Notes (Optional & Modifiable) */}
                  {activePL.showNotes !== false ? (
                    <div className={`text-[8px] text-slate-600 leading-relaxed border-t border-slate-100 pt-3 group relative ${!activePL.notes ? 'print:hidden' : ''}`}>
                      <div className="flex items-center justify-between">
                        <input
                          type="text"
                          value={activePL.notesTitle || 'CONTAINER DISPATCH NOTES'}
                          onChange={(e) => handleFieldChange('notesTitle', e.target.value)}
                          className="font-bold uppercase not-italic block text-slate-400 hover:text-slate-600 bg-transparent border-b border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] outline-hidden text-[8px] w-full"
                          title="Click to edit section title"
                        />
                        <button
                          type="button"
                          onClick={() => handleFieldChange('showNotes', false)}
                          className="opacity-0 group-hover:opacity-100 text-[8px] text-red-500 hover:text-red-700 ml-2 whitespace-nowrap print:hidden cursor-pointer transition-opacity"
                          title="Hide dispatch notes from this packing list"
                        >
                          ✕ Remove
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={activePL.notes || ''}
                        onChange={(e) => handleFieldChange('notes', e.target.value)}
                        placeholder="[ Click to add / modify container dispatch notes & remarks (optional)... ]"
                        className="w-full bg-transparent border border-transparent hover:border-dashed hover:border-slate-300 focus:border-[#1565C0] rounded p-0.5 text-[8px] text-slate-600 leading-relaxed italic resize-none outline-hidden print:border-none print:p-0"
                        title="Click to modify dispatch notes directly"
                      />
                    </div>
                  ) : (
                    <div className="border-t border-slate-100 pt-2 print:hidden">
                      <button
                        type="button"
                        onClick={() => handleFieldChange('showNotes', true)}
                        className="text-[8px] text-slate-400 hover:text-[#1565C0] border border-dashed border-slate-200 hover:border-[#1565C0] rounded px-2 py-1 flex items-center gap-1 transition-colors cursor-pointer w-full justify-center"
                      >
                        + Add Container Dispatch Notes (Optional)
                      </button>
                    </div>
                  )}
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

      {/* Selector modals (Identical design to Invoice modals) */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-md w-full flex flex-col max-h-[75vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Consignee Importer Selection</span>
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

      {showProductModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-xl w-full flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="font-extrabold text-xs uppercase tracking-wider text-slate-700">Select Mold SKU from Library</span>
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
                      <PackageOpen size={14} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#1565C0] truncate">{p.name}</p>
                      <span className="text-[9px] font-mono font-bold text-slate-400 shrink-0">{p.sku}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">Specs: {p.cartonLength}x{p.cartonWidth}x{p.cartonHeight} cm | gross wt: {p.grossWeight} kg</p>
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
