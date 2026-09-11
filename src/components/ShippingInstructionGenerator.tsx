import React, { useState, useEffect } from 'react';
import { ShippingInstruction, ShippingInstructionItem, Client, Product, CompanySettings } from '../types';
import { generateId, getNextDocumentNumber } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
import { TransparentSignature } from './TransparentSignature';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  Ship, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Download,
  X, 
  Check, 
  ChevronRight,
  Anchor,
  Compass,
  FileSpreadsheet
} from 'lucide-react';

interface ShippingInstructionProps {
  shippingInstructions: ShippingInstruction[];
  onSaveShippingInstructions: (sis: ShippingInstruction[]) => void;
  products: Product[];
  clients: Client[];
  settings: CompanySettings;
}

export default function ShippingInstructionGenerator({
  shippingInstructions,
  onSaveShippingInstructions,
  products,
  clients,
  settings
}: ShippingInstructionProps) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeSI, setActiveSI] = useState<Partial<ShippingInstruction> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const [showClientModal, setShowClientModal] = useState(false);

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges, requestActionWithGuard } = useNavigationGuard();

  useEffect(() => {
    if (isEditing && activeSI) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activeSI.siNumber ? `Shipping Instruction: ${activeSI.siNumber}` : 'Shipping Instruction Draft',
        docType: 'Shipping Instruction',
        onSave: () => {
          handleSave();
        },
        onDiscard: () => {
          setIsEditing(false);
          setActiveSI(null);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [isEditing, activeSI, shippingInstructions]);

  const handleCreateNew = () => {
    const nextNum = getNextDocumentNumber('shipping', shippingInstructions || []);
    const today = new Date().toISOString().split('T')[0];

    setActiveSI({
      siNumber: nextNum,
      date: today,
      shipper: `${settings.name}\n${settings.address}, ${settings.country}\nTEL: ${settings.phone}`,
      consignee: clients[0]?.company ? `${clients[0].company}\n${clients[0].address}\nTEL: ${clients[0].phone}` : "DUONG HOANG HOA CO., LTD\nHo Chi Minh City, Vietnam",
      notifyParty: 'SAME AS CONSIGNEE',
      carrier: 'COSCO SHIPPING LINES',
      vesselVoyage: 'COSCO GUANGZHOU V.112E',
      portOfLoading: 'Ningbo Port, China',
      portOfDischarge: 'Cat Lai Port, Ho Chi Minh, Vietnam',
      finalDestination: 'Ho Chi Minh City, Vietnam',
      freightTerm: 'FREIGHT PREPAID',
      bookingNumber: 'NGB987654321',
      blType: 'Telex Release',
      items: [
        {
          id: generateId(),
          containerNo: 'TCLU8823910',
          sealNo: 'COS661029',
          packages: '50 CARTONS',
          description: 'PLASTIC TRIGGER SPRAYERS AND LOTION PUMPS FOR COSMETIC PACKAGING',
          grossWeightKg: 723.00,
          cbm: 6.85,
          hsCode: '3926.90.90'
        }
      ],
      totalPackages: '50 CARTONS',
      totalGrossWeight: 723.00,
      totalCbm: 6.85,
      specialInstructions: 'Please issue Telex Release B/L upon receipt of payment confirmation. Maintain dry container environment.',
      createdAt: new Date().toISOString()
    });
    setIsEditing(true);
  };

  const handleFieldChange = (field: keyof ShippingInstruction, value: any) => {
    if (!activeSI) return;
    setActiveSI({ ...activeSI, [field]: value });
  };

  const handleItemChange = (index: number, field: keyof ShippingInstructionItem, value: any) => {
    if (!activeSI || !activeSI.items) return;
    const items = [...activeSI.items];
    items[index] = { ...items[index], [field]: value };

    const totGw = items.reduce((acc, it) => acc + (Number(it.grossWeightKg) || 0), 0);
    const totCbm = items.reduce((acc, it) => acc + (Number(it.cbm) || 0), 0);

    setActiveSI({ 
      ...activeSI, 
      items,
      totalGrossWeight: Number(totGw.toFixed(2)),
      totalCbm: Number(totCbm.toFixed(2))
    });
  };

  const handleAddItem = () => {
    if (!activeSI) return;
    const items = activeSI.items || [];
    const newItem: ShippingInstructionItem = {
      id: generateId(),
      containerNo: 'EGHU4412930',
      sealNo: 'EGH99281',
      packages: '20 CARTONS',
      description: 'COSMETIC BOTTLES',
      grossWeightKg: 250.00,
      cbm: 2.10,
      hsCode: '3923.30.00'
    };
    const nextItems = [...items, newItem];
    const totGw = nextItems.reduce((acc, it) => acc + (Number(it.grossWeightKg) || 0), 0);
    const totCbm = nextItems.reduce((acc, it) => acc + (Number(it.cbm) || 0), 0);

    setActiveSI({ 
      ...activeSI, 
      items: nextItems,
      totalGrossWeight: Number(totGw.toFixed(2)),
      totalCbm: Number(totCbm.toFixed(2))
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!activeSI || !activeSI.items) return;
    const items = activeSI.items.filter((_, i) => i !== index);
    const totGw = items.reduce((acc, it) => acc + (Number(it.grossWeightKg) || 0), 0);
    const totCbm = items.reduce((acc, it) => acc + (Number(it.cbm) || 0), 0);

    setActiveSI({ 
      ...activeSI, 
      items,
      totalGrossWeight: Number(totGw.toFixed(2)),
      totalCbm: Number(totCbm.toFixed(2))
    });
  };

  const handleSave = () => {
    if (!activeSI || !activeSI.siNumber) return;
    const list = shippingInstructions || [];
    const index = list.findIndex(s => s.id === activeSI.id);

    const docToSave = {
      ...activeSI,
      id: activeSI.id || generateId(),
      createdAt: activeSI.createdAt || new Date().toISOString()
    } as ShippingInstruction;

    if (index >= 0) {
      const updated = [...list];
      updated[index] = docToSave;
      onSaveShippingInstructions(updated);
    } else {
      onSaveShippingInstructions([docToSave, ...list]);
    }
    setIsEditing(false);
  };

  const handlePrint = () => {
    printDocument('shipping-preview-document');
  };

  const handleDownloadPDF = async () => {
    if (!activeSI) return;
    setIsDownloading(true);
    try {
      await exportDocumentToPDF('shipping-preview-document', `Shipping_Instructions_${activeSI.siNumber || 'SI'}`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      printDocument('shipping-preview-document');
    } finally {
      setIsDownloading(false);
    }
  };

  const filtered = (shippingInstructions || []).filter(s => 
    s.siNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.bookingNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.consignee.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Ship className="text-[#1565C0]" size={24} />
            {language === 'zh' ? '托运单与装船通知 (S/I) 生成器' : 'Bill of Lading & Shipping Instructions (S/I)'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'zh' ? '向海运或空运货运代理出具正式订舱及提单格式样本。' : 'Generate formal shipping instructions to ocean & air freight forwarders for Bill of Lading issuance.'}
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus size={16} />
            {language === 'zh' ? '新建订舱托运单' : 'New Shipping Instruction'}
          </button>
        )}
      </div>

      {isEditing && activeSI ? (
        <div className="space-y-6">
          {/* Action bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3 sm:p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  {language === 'zh' ? '托运单号:' : 'SI:'}
                </span>
                <span className="text-sm font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                  {activeSI.siNumber}
                </span>
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
                    setActiveSI(null);
                  });
                }}
                className="px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                {language === 'zh' ? '返回' : 'Cancel'}
              </button>
              <button
                onClick={handleSave}
                className="px-3.5 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Check size={14} />
                {language === 'zh' ? '保存托运单' : 'Save S/I'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="px-3 sm:px-3.5 py-1.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download size={14} />
                {isDownloading ? (language === 'zh' ? '生成中...' : 'Generating...') : 'PDF'}
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer size={14} />
                {language === 'zh' ? '打印' : 'Print'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className={`lg:col-span-5 space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100 flex items-center gap-2">
                <Anchor size={16} className="text-[#1565C0]" /> {language === 'zh' ? '航次、船名与订舱明细' : 'Voyage & Carrier Details'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '托运单编号' : 'SI Ref No'}</label>
                  <input
                    type="text"
                    value={activeSI.siNumber || ''}
                    onChange={(e) => handleFieldChange('siNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '订舱单号 (SO/BKG)' : 'Booking Number'}</label>
                  <input
                    type="text"
                    value={activeSI.bookingNumber || ''}
                    onChange={(e) => handleFieldChange('bookingNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '船公司 / 承运人' : 'Shipping Line / Carrier'}</label>
                  <input
                    type="text"
                    value={activeSI.carrier || ''}
                    onChange={(e) => handleFieldChange('carrier', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '船名 / 航次' : 'Vessel / Voyage No'}</label>
                  <input
                    type="text"
                    value={activeSI.vesselVoyage || ''}
                    onChange={(e) => handleFieldChange('vesselVoyage', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '起运港 (POL)' : 'Port of Loading'}</label>
                  <input
                    type="text"
                    value={activeSI.portOfLoading || ''}
                    onChange={(e) => handleFieldChange('portOfLoading', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '目的港 / 卸货港 (POD)' : 'Port of Discharge'}</label>
                  <input
                    type="text"
                    value={activeSI.portOfDischarge || ''}
                    onChange={(e) => handleFieldChange('portOfDischarge', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '运费条款' : 'Freight Term'}</label>
                  <select
                    value={activeSI.freightTerm || 'FREIGHT PREPAID'}
                    onChange={(e) => handleFieldChange('freightTerm', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="FREIGHT PREPAID">{language === 'zh' ? 'FREIGHT PREPAID (运费预付)' : 'FREIGHT PREPAID'}</option>
                    <option value="FREIGHT COLLECT">{language === 'zh' ? 'FREIGHT COLLECT (运费到付)' : 'FREIGHT COLLECT'}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '提单签发形式' : 'B/L Release Type'}</label>
                  <select
                    value={activeSI.blType || 'Telex Release'}
                    onChange={(e) => handleFieldChange('blType', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="Telex Release">{language === 'zh' ? 'Telex Release (电放提单)' : 'Telex Release'}</option>
                    <option value="Original B/L">{language === 'zh' ? 'Original B/L (正本提单 3/3)' : 'Original B/L (3/3)'}</option>
                    <option value="Express Release">{language === 'zh' ? 'Express Release (快放)' : 'Express Release'}</option>
                    <option value="Waybill">{language === 'zh' ? 'Sea Waybill (海运单)' : 'Sea Waybill'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '发货人 / 出口商 (Shipper)' : 'Shipper (Exporter)'}</label>
                <textarea
                  rows={2}
                  value={activeSI.shipper || ''}
                  onChange={(e) => handleFieldChange('shipper', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-600">{language === 'zh' ? '收货人 (Consignee)' : 'Consignee'}</label>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline cursor-pointer"
                  >
                    {language === 'zh' ? '选择客户档案' : 'Select Client'}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={activeSI.consignee || ''}
                  onChange={(e) => handleFieldChange('consignee', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '通知人 (Notify Party)' : 'Notify Party'}</label>
                <textarea
                  rows={2}
                  value={activeSI.notifyParty || ''}
                  onChange={(e) => handleFieldChange('notifyParty', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Items / Containers */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">{language === 'zh' ? '集装箱柜号与货品明细' : 'Containers & Goods Breakdown'}</label>
                  <button
                    onClick={handleAddItem}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> {language === 'zh' ? '添加集装箱' : 'Add Container'}
                  </button>
                </div>

                <div className="space-y-3">
                  {activeSI.items?.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{language === 'zh' ? `集装箱 #${idx + 1}` : `Container #${idx + 1}`}</span>
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 size={14} /></button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '集装箱号 (Container No)' : 'Container No'}</label>
                          <input
                            type="text"
                            value={item.containerNo}
                            onChange={(e) => handleItemChange(idx, 'containerNo', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-white text-xs font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '封签号 (Seal No)' : 'Seal No'}</label>
                          <input
                            type="text"
                            value={item.sealNo}
                            onChange={(e) => handleItemChange(idx, 'sealNo', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '件数 / 箱数' : 'Cartons'}</label>
                          <input
                            type="text"
                            value={item.packages}
                            onChange={(e) => handleItemChange(idx, 'packages', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '毛重 (kg)' : 'Gross Weight (kg)'}</label>
                          <input
                            type="number"
                            value={item.grossWeightKg}
                            onChange={(e) => handleItemChange(idx, 'grossWeightKg', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded bg-white text-xs text-right font-bold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '体积 (CBM)' : 'CBM'}</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.cbm}
                            onChange={(e) => handleItemChange(idx, 'cbm', Number(e.target.value))}
                            className="w-full px-2 py-1 border rounded bg-white text-xs text-right font-bold"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '提单英文货名描述' : 'Cargo Description for B/L'}</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white text-xs font-medium"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Preview */}
            <div className={`lg:col-span-7 flex flex-col items-center w-full min-w-0 ${mobileTab === 'form' ? 'hidden lg:flex' : 'flex'}`}>
              <div className="w-full flex items-center justify-between mb-2.5 px-1 print:hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 shrink-0">
                  <Ship size={12} className="text-[#1565C0]" /> Live S/I Draft Preview (WYSIWYG)
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
                  id="shipping-preview-document"
                  style={{ 
                    boxSizing: 'border-box',
                    transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                    transformOrigin: 'top center',
                    marginBottom: previewZoom > 100 ? `${(previewZoom - 100) * 8}px` : undefined
                  }}
                  className="bg-white p-4 sm:p-6 w-full max-w-[210mm] mx-auto shadow-md border border-slate-300 text-slate-800 text-[11px] font-sans print:shadow-none print:border-none print:p-0 transition-transform duration-150"
                >
                {/* Header */}
                <div className="text-center border-b-2 border-slate-900 pb-2 mb-3">
                  <h1 className="text-base font-black uppercase tracking-wider text-slate-900">
                    SHIPPING INSTRUCTIONS / BILL OF LADING DRAFT
                  </h1>
                  <p className="text-[10px] text-slate-500">ISSUED TO FREIGHT FORWARDER FOR BILL OF LADING ISSUANCE</p>
                </div>

                <div className="grid grid-cols-2 border border-slate-800">
                  <div className="p-2 border-r border-b border-slate-800 space-y-1">
                    <p className="font-bold text-[9px] text-slate-400 uppercase">SHIPPER / EXPORTER:</p>
                    <pre className="whitespace-pre-wrap font-sans text-[10px] text-slate-800 font-bold">{activeSI.shipper}</pre>
                  </div>

                  <div className="p-2 border-b border-slate-800 space-y-1 bg-slate-50">
                    <p className="font-bold text-[9px] text-slate-400 uppercase">B/L & BOOKING METADATA:</p>
                    <p><strong>BOOKING NO:</strong> <span className="font-mono font-bold text-blue-800">{activeSI.bookingNumber}</span></p>
                    <p><strong>SI REF NO:</strong> <span className="font-mono">{activeSI.siNumber}</span></p>
                    <p><strong>CARRIER:</strong> <span className="font-bold">{activeSI.carrier}</span></p>
                    <p><strong>FREIGHT TERM:</strong> <span className="font-bold text-emerald-700">{activeSI.freightTerm}</span></p>
                    <p><strong>RELEASE TYPE:</strong> <span className="font-bold">{activeSI.blType}</span></p>
                  </div>

                  <div className="p-2 border-r border-b border-slate-800 space-y-1">
                    <p className="font-bold text-[9px] text-slate-400 uppercase">CONSIGNEE:</p>
                    <pre className="whitespace-pre-wrap font-sans text-[10px] text-slate-800 font-bold">{activeSI.consignee}</pre>
                  </div>

                  <div className="p-2 border-b border-slate-800 space-y-1">
                    <p className="font-bold text-[9px] text-slate-400 uppercase">NOTIFY PARTY:</p>
                    <pre className="whitespace-pre-wrap font-sans text-[10px] text-slate-800">{activeSI.notifyParty}</pre>
                  </div>

                  <div className="p-2 border-r border-slate-800 space-y-1">
                    <p><strong>VESSEL & VOYAGE:</strong> {activeSI.vesselVoyage}</p>
                    <p><strong>PORT OF LOADING:</strong> {activeSI.portOfLoading}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    <p><strong>PORT OF DISCHARGE:</strong> {activeSI.portOfDischarge}</p>
                    <p><strong>FINAL DESTINATION:</strong> {activeSI.finalDestination}</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-x border-b border-slate-800 text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-800 text-white font-bold text-center">
                      <th className="p-1.5 border-r border-slate-700 w-28">Container No & Seal No</th>
                      <th className="p-1.5 border-r border-slate-700 w-20">Packages</th>
                      <th className="p-1.5 border-r border-slate-700">Description of Goods</th>
                      <th className="p-1.5 border-r border-slate-700 w-24">Gross Weight (KGS)</th>
                      <th className="p-1.5 w-20">Measurement (CBM)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeSI.items?.map((item) => (
                      <tr key={item.id} className="border-b border-slate-300">
                        <td className="p-2 border-r border-slate-800 text-center font-mono">
                          <p className="font-bold text-slate-900">{item.containerNo}</p>
                          <p className="text-[9px] text-slate-500">SEAL: {item.sealNo}</p>
                        </td>
                        <td className="p-2 border-r border-slate-800 text-center font-bold">{item.packages}</td>
                        <td className="p-2 border-r border-slate-800">{item.description}</td>
                        <td className="p-2 border-r border-slate-800 text-right font-bold">{item.grossWeightKg?.toFixed(2)} KGS</td>
                        <td className="p-2 text-right font-bold">{item.cbm?.toFixed(2)} CBM</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-2 border-r border-slate-800 text-right uppercase">TOTALS:</td>
                      <td className="p-2 border-r border-slate-800 text-center">{activeSI.totalPackages}</td>
                      <td className="p-2 border-r border-slate-800">SAID TO CONTAIN</td>
                      <td className="p-2 border-r border-slate-800 text-right text-blue-800">{activeSI.totalGrossWeight?.toFixed(2)} KGS</td>
                      <td className="p-2 text-right text-blue-800">{activeSI.totalCbm?.toFixed(2)} CBM</td>
                    </tr>
                  </tbody>
                </table>

                {/* Special Instructions */}
                <div className="p-3 border-x border-b border-slate-800 space-y-1 bg-slate-50">
                  <p className="font-bold text-[9px] text-slate-500 uppercase">SPECIAL INSTRUCTIONS / REMARKS:</p>
                  <p className="text-slate-700 text-[10px] leading-relaxed">{activeSI.specialInstructions}</p>
                </div>

                <div className="flex justify-end items-end pt-4">
                  {settings.stamp && <div className="h-12 w-20 flex justify-end"><TransparentSignature src={settings.stamp} alt="Factory Stamp" className="h-12 object-contain" /></div>}
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder={language === 'zh' ? '按托运单号或订舱号搜索...' : 'Search SI or booking number...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map(s => (
              <div
                key={s.id}
                onClick={() => { setActiveSI(s); setIsEditing(true); }}
                className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <h3 className="font-bold text-xs text-slate-900">{s.siNumber}</h3>
                  <p className="text-[11px] text-slate-500">{language === 'zh' ? '订舱号:' : 'Booking:'} {s.bookingNumber} • {language === 'zh' ? '船公司/承运人:' : 'Carrier:'} {s.carrier}</p>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {language === 'zh' ? '暂无托运单/装船通知记录。' : 'No shipping instructions found.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Select Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-sm text-slate-800">{language === 'zh' ? '选择收货人客户' : 'Select Client for Consignee'}</h3>
              <button onClick={() => setShowClientModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {clients.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    handleFieldChange('consignee', `${c.company}\n${c.address}\nTEL: ${c.phone}`);
                    setShowClientModal(false);
                  }}
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900">{c.company}</p>
                    <p className="text-[10px] text-slate-500">{c.country} • {c.contactPerson}</p>
                  </div>
                  <Check size={16} className="text-blue-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
