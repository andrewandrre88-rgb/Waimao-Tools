import React, { useState, useEffect } from 'react';
import { CertificateOfOrigin, CertificateItem, Client, Product, CompanySettings } from '../types';
import { generateId, getNextDocumentNumber } from '../utils/storage';
import { exportDocumentToPDF, printDocument } from '../utils/pdf';
import { TransparentSignature } from './TransparentSignature';
import { useNavigationGuard } from '../context/NavigationGuardContext';
import { useLanguage } from '../context/LanguageContext';
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
  Stamp,
  Globe2,
  Building
} from 'lucide-react';

interface CertificateGeneratorProps {
  certificatesOfOrigin: CertificateOfOrigin[];
  onSaveCertificatesOfOrigin: (cos: CertificateOfOrigin[]) => void;
  products: Product[];
  clients: Client[];
  settings: CompanySettings;
}

export default function CertificateGenerator({
  certificatesOfOrigin,
  onSaveCertificatesOfOrigin,
  products,
  clients,
  settings
}: CertificateGeneratorProps) {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [activeCert, setActiveCert] = useState<Partial<CertificateOfOrigin> | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [mobileTab, setMobileTab] = useState<'form' | 'preview'>('form');
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  const [showClientModal, setShowClientModal] = useState(false);

  // Navigation Guard for Unsaved Changes
  const { registerUnsavedChanges, unregisterUnsavedChanges, requestActionWithGuard } = useNavigationGuard();

  useEffect(() => {
    if (isEditing && activeCert) {
      registerUnsavedChanges({
        hasUnsaved: true,
        docTitle: activeCert.certificateNumber ? `Certificate of Origin: ${activeCert.certificateNumber}` : 'Certificate of Origin Draft',
        docType: 'Certificate of Origin',
        onSave: () => {
          handleSave();
        },
        onDiscard: () => {
          setIsEditing(false);
          setActiveCert(null);
        }
      });
    } else {
      unregisterUnsavedChanges();
    }
  }, [isEditing, activeCert, certificatesOfOrigin]);

  const handleCreateNew = () => {
    const nextNum = getNextDocumentNumber('certificate', certificatesOfOrigin || []);
    const today = new Date().toISOString().split('T')[0];

    setActiveCert({
      certificateNumber: nextNum,
      issueDate: today,
      exporterName: settings.name || 'MILA Sprayer & Packaging Factory Ltd.',
      exporterAddress: `${settings.address}, ${settings.country}`,
      consigneeName: clients[0]?.company || 'DUONG HOANG HOA COMPANY LIMITED',
      consigneeAddress: clients[0]?.address || '123 Tan Binh District, Ho Chi Minh City, Vietnam',
      countryOfOrigin: 'P.R. CHINA',
      countryOfDestination: clients[0]?.country || 'VIETNAM',
      transportDetails: 'BY SEA VESSEL FROM NINGBO PORT TO DESTINATION PORT',
      remarks: 'INVOICE NO: INV-000001 DATED ' + today,
      items: [
        {
          id: generateId(),
          marksAndNumbers: 'N/M OR AS PER CARTON',
          packagesCount: '50 CARTONS',
          goodsDescription: 'PLASTIC TRIGGER SPRAYERS & LOTION PUMPS FOR COSMETIC PACKAGING',
          hsCode: '3926.90.90',
          quantity: '30,000 PCS',
          grossWeight: '723.00 KGS'
        }
      ],
      declarationByExporter: 'The undersigned hereby declares that the above details and statements are correct and that all goods were produced in P.R. CHINA.',
      issuingAuthority: 'China Council for the Promotion of International Trade (CCPIT)',
      createdAt: new Date().toISOString()
    });
    setIsEditing(true);
  };

  const handleFieldChange = (field: keyof CertificateOfOrigin, value: any) => {
    if (!activeCert) return;
    setActiveCert({ ...activeCert, [field]: value });
  };

  const handleItemChange = (index: number, field: keyof CertificateItem, value: any) => {
    if (!activeCert || !activeCert.items) return;
    const items = [...activeCert.items];
    items[index] = { ...items[index], [field]: value };
    setActiveCert({ ...activeCert, items });
  };

  const handleAddItem = () => {
    if (!activeCert) return;
    const items = activeCert.items || [];
    const newItem: CertificateItem = {
      id: generateId(),
      marksAndNumbers: 'N/M',
      packagesCount: '20 CARTONS',
      goodsDescription: 'PLASTIC BOTTLES & SPRAY HEADS',
      hsCode: '3923.30.00',
      quantity: '10,000 PCS',
      grossWeight: '250.00 KGS'
    };
    setActiveCert({ ...activeCert, items: [...items, newItem] });
  };

  const handleRemoveItem = (index: number) => {
    if (!activeCert || !activeCert.items) return;
    const items = activeCert.items.filter((_, i) => i !== index);
    setActiveCert({ ...activeCert, items });
  };

  const handleSave = () => {
    if (!activeCert || !activeCert.certificateNumber) return;
    const list = certificatesOfOrigin || [];
    const index = list.findIndex(c => c.id === activeCert.id);

    const docToSave = {
      ...activeCert,
      id: activeCert.id || generateId(),
      createdAt: activeCert.createdAt || new Date().toISOString()
    } as CertificateOfOrigin;

    if (index >= 0) {
      const updated = [...list];
      updated[index] = docToSave;
      onSaveCertificatesOfOrigin(updated);
    } else {
      onSaveCertificatesOfOrigin([docToSave, ...list]);
    }
    setIsEditing(false);
  };

  const handlePrint = () => {
    printDocument('certificate-preview-document');
  };

  const handleDownloadPDF = async () => {
    if (!activeCert) return;
    setIsDownloading(true);
    try {
      await exportDocumentToPDF('certificate-preview-document', `Certificate_of_Origin_${activeCert.certificateNumber || 'CO'}`);
    } catch (err) {
      console.error('PDF generation failed:', err);
      printDocument('certificate-preview-document');
    } finally {
      setIsDownloading(false);
    }
  };

  const filtered = (certificatesOfOrigin || []).filter(c => 
    c.certificateNumber.toLowerCase().includes(search.toLowerCase()) ||
    c.consigneeName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Globe2 className="text-[#1565C0]" size={24} />
            {language === 'zh' ? '原产地证明书 (C/O) 生成器' : 'Certificate of Origin (C/O) Builder'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'zh' ? '官方国际贸易原产地证明文件（符合 CCPIT / 贸促会标准格式）。' : 'Official international trade document certifying origin of goods (Form A / CCPIT standard).'}
          </p>
        </div>

        {!isEditing && (
          <button
            onClick={handleCreateNew}
            className="px-4 py-2.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            <Plus size={16} />
            {language === 'zh' ? '新建原产地证' : 'New Certificate of Origin'}
          </button>
        )}
      </div>

      {isEditing && activeCert ? (
        <div className="space-y-6">
          {/* Action Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 text-white p-3 sm:p-4 rounded-xl shadow-sm">
            <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                  {language === 'zh' ? '产地证编号:' : 'CO:'}
                </span>
                <span className="text-sm font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 font-mono">
                  {activeCert.certificateNumber}
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
                    setActiveCert(null);
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
                {language === 'zh' ? '保存产地证' : 'Save C/O'}
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
            {/* Form Column */}
            <div className={`lg:col-span-5 space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs ${mobileTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                {language === 'zh' ? '出口商与收货人明细' : 'Exporter & Consignee Details'}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '产地证编号' : 'C/O Number'}</label>
                  <input
                    type="text"
                    value={activeCert.certificateNumber || ''}
                    onChange={(e) => handleFieldChange('certificateNumber', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '签发日期' : 'Issue Date'}</label>
                  <input
                    type="date"
                    value={activeCert.issueDate || ''}
                    onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '1. 出口商 / 生产商 (英文)' : '1. Exporter / Producer'}</label>
                <input
                  type="text"
                  value={activeCert.exporterName || ''}
                  onChange={(e) => handleFieldChange('exporterName', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold mb-1"
                />
                <textarea
                  rows={2}
                  value={activeCert.exporterAddress || ''}
                  onChange={(e) => handleFieldChange('exporterAddress', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[11px] font-bold text-slate-600">{language === 'zh' ? '2. 收货人 / 买方' : '2. Consignee (Buyer)'}</label>
                  <button
                    type="button"
                    onClick={() => setShowClientModal(true)}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    {language === 'zh' ? '选择客户档案' : 'Select Client'}
                  </button>
                </div>
                <input
                  type="text"
                  value={activeCert.consigneeName || ''}
                  onChange={(e) => handleFieldChange('consigneeName', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-bold mb-1"
                />
                <textarea
                  rows={2}
                  value={activeCert.consigneeAddress || ''}
                  onChange={(e) => handleFieldChange('consigneeAddress', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '原产国' : 'Country of Origin'}</label>
                  <input
                    type="text"
                    value={activeCert.countryOfOrigin || 'P.R. CHINA'}
                    onChange={(e) => handleFieldChange('countryOfOrigin', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold text-blue-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '目的国' : 'Country of Destination'}</label>
                  <input
                    type="text"
                    value={activeCert.countryOfDestination || ''}
                    onChange={(e) => handleFieldChange('countryOfDestination', e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">{language === 'zh' ? '运输工具与航线' : 'Means of Transport & Route'}</label>
                <textarea
                  rows={2}
                  value={activeCert.transportDetails || ''}
                  onChange={(e) => handleFieldChange('transportDetails', e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                />
              </div>

              {/* Items Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800">{language === 'zh' ? '申报商品货物明细' : 'Itemized Goods Declaration'}</label>
                  <button
                    onClick={handleAddItem}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> {language === 'zh' ? '添加货品行' : 'Add Item'}
                  </button>
                </div>

                <div className="space-y-3">
                  {activeCert.items?.map((item, idx) => (
                    <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-700">{language === 'zh' ? `货品项 #${idx + 1}` : `Item #${idx + 1}`}</span>
                        <button onClick={() => handleRemoveItem(idx)} className="text-red-500 hover:text-red-700 cursor-pointer"><Trash2 size={14} /></button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '唛头与编号' : 'Marks & Numbers'}</label>
                          <input
                            type="text"
                            value={item.marksAndNumbers}
                            onChange={(e) => handleItemChange(idx, 'marksAndNumbers', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '包装件数' : 'Packages Count'}</label>
                          <input
                            type="text"
                            value={item.packagesCount}
                            onChange={(e) => handleItemChange(idx, 'packagesCount', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-white text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '货物英文品名描述' : 'Description of Goods'}</label>
                        <input
                          type="text"
                          value={item.goodsDescription}
                          onChange={(e) => handleItemChange(idx, 'goodsDescription', e.target.value)}
                          className="w-full px-2 py-1 border rounded bg-white text-xs font-medium"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '海关编码 (HS)' : 'HS Code'}</label>
                          <input
                            type="text"
                            value={item.hsCode}
                            onChange={(e) => handleItemChange(idx, 'hsCode', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '数量 (PCS)' : 'Quantity'}</label>
                          <input
                            type="text"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '总毛重 (KGS)' : 'Gross Weight'}</label>
                          <input
                            type="text"
                            value={item.grossWeight}
                            onChange={(e) => handleItemChange(idx, 'grossWeight', e.target.value)}
                            className="w-full px-2 py-1 border rounded bg-white text-xs"
                          />
                        </div>
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
                  <FileCheck size={12} className="text-[#1565C0]" /> Live C/O Preview (WYSIWYG)
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
                  id="certificate-preview-document"
                  style={{ 
                    boxSizing: 'border-box',
                    transform: previewZoom !== 100 ? `scale(${previewZoom / 100})` : undefined,
                    transformOrigin: 'top center',
                    marginBottom: previewZoom > 100 ? `${(previewZoom - 100) * 8}px` : undefined
                  }}
                  className="bg-white p-4 sm:p-8 w-full max-w-[210mm] mx-auto shadow-md border border-slate-300 text-slate-800 text-xs font-serif print:shadow-none print:border-none print:p-0 transition-transform duration-150"
                >
                {/* Formal Certificate Header */}
                <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
                  <h1 className="text-lg font-black uppercase tracking-widest text-slate-900">
                    CERTIFICATE OF ORIGIN
                  </h1>
                  <p className="text-[10px] uppercase tracking-wider text-slate-600 font-sans mt-0.5">
                    (ORIGINAL - PREFERENTIAL TRADE DOCUMENTATION)
                  </p>
                  <div className="text-right mt-1">
                    <span className="text-xs font-mono font-bold text-red-700">NO: {activeCert.certificateNumber}</span>
                  </div>
                </div>

                {/* Grid layout matching standard C/O layout */}
                <div className="border border-slate-800 grid grid-cols-2 text-[10px] font-sans">
                  <div className="p-2 border-r border-b border-slate-800 space-y-1">
                    <p className="font-bold text-slate-400 uppercase">1. Exporter Name & Address:</p>
                    <p className="font-bold text-slate-900 text-xs">{activeCert.exporterName}</p>
                    <p className="text-slate-700 leading-tight">{activeCert.exporterAddress}</p>
                  </div>

                  <div className="p-2 border-b border-slate-800 space-y-1">
                    <p className="font-bold text-slate-400 uppercase">Certificate Ref No:</p>
                    <p className="font-mono font-bold text-slate-900 text-sm">{activeCert.certificateNumber}</p>
                    <p className="text-slate-500">Issued in: {activeCert.countryOfOrigin}</p>
                  </div>

                  <div className="p-2 border-r border-b border-slate-800 space-y-1">
                    <p className="font-bold text-slate-400 uppercase">2. Consignee Name & Address:</p>
                    <p className="font-bold text-slate-900 text-xs">{activeCert.consigneeName}</p>
                    <p className="text-slate-700 leading-tight">{activeCert.consigneeAddress}</p>
                  </div>

                  <div className="p-2 border-b border-slate-800 space-y-1 bg-slate-50">
                    <p className="font-bold text-slate-400 uppercase">Country Details:</p>
                    <p><strong>Produced in:</strong> <span className="text-blue-800 font-bold">{activeCert.countryOfOrigin}</span></p>
                    <p><strong>Destination:</strong> <span className="font-bold">{activeCert.countryOfDestination}</span></p>
                  </div>

                  <div className="p-2 border-r border-slate-800 col-span-2 border-b space-y-1">
                    <p className="font-bold text-slate-400 uppercase">3. Transport Details & Route:</p>
                    <p className="font-medium text-slate-800">{activeCert.transportDetails}</p>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-x border-b border-slate-800 text-[10px] font-sans border-collapse">
                  <thead>
                    <tr className="bg-slate-100 font-bold border-b border-slate-800 text-center">
                      <th className="p-1.5 border-r border-slate-800 w-20">Marks & Nos</th>
                      <th className="p-1.5 border-r border-slate-800 w-24">Number & Kind of Packages</th>
                      <th className="p-1.5 border-r border-slate-800">Description of Goods</th>
                      <th className="p-1.5 border-r border-slate-800 w-20">HS Code</th>
                      <th className="p-1.5 border-r border-slate-800 w-20">Quantity</th>
                      <th className="p-1.5 w-24">Gross Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCert.items?.map((item) => (
                      <tr key={item.id} className="border-b border-slate-300">
                        <td className="p-2 border-r border-slate-800 text-center text-slate-600">{item.marksAndNumbers}</td>
                        <td className="p-2 border-r border-slate-800 text-center font-semibold">{item.packagesCount}</td>
                        <td className="p-2 border-r border-slate-800 font-medium">{item.goodsDescription}</td>
                        <td className="p-2 border-r border-slate-800 text-center font-mono font-bold">{item.hsCode}</td>
                        <td className="p-2 border-r border-slate-800 text-center">{item.quantity}</td>
                        <td className="p-2 text-center font-bold">{item.grossWeight}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Declaration & Certification Boxes */}
                <div className="border-x border-b border-slate-800 grid grid-cols-2 text-[10px] font-sans">
                  <div className="p-3 border-r border-slate-800 space-y-2">
                    <p className="font-bold text-slate-800 uppercase">4. Declaration by the Exporter:</p>
                    <p className="text-slate-600 italic leading-relaxed">{activeCert.declarationByExporter}</p>
                    <div className="pt-6 flex justify-between items-end">
                      <p className="text-slate-400">Date: {activeCert.issueDate}</p>
                      {settings.stamp && <div className="h-12 w-20 flex justify-end"><TransparentSignature src={settings.stamp} alt="Factory Stamp" className="h-12 object-contain" /></div>}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 space-y-2">
                    <p className="font-bold text-slate-800 uppercase">5. Certification Authority:</p>
                    <p className="text-slate-700 font-bold">{activeCert.issuingAuthority}</p>
                    <p className="text-slate-500 italic">It is hereby certified that the declaration by the exporter is correct.</p>
                    <div className="pt-6 text-right">
                      <div className="inline-block border-2 border-red-600 text-red-600 font-bold px-3 py-1 rounded rotate-[-5deg] text-[10px]">
                        CCPIT CERTIFIED STAMP
                      </div>
                    </div>
                  </div>
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
                placeholder={language === 'zh' ? '按产地证编号或收货人搜索...' : 'Search certificate number or consignee...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {filtered.map(c => (
              <div
                key={c.id}
                onClick={() => { setActiveCert(c); setIsEditing(true); }}
                className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
              >
                <div>
                  <h3 className="font-bold text-xs text-slate-900">{c.certificateNumber}</h3>
                  <p className="text-[11px] text-slate-500">{c.consigneeName} • {language === 'zh' ? '原产国:' : 'Origin:'} {c.countryOfOrigin}</p>
                </div>
                <ChevronRight size={18} className="text-slate-400" />
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-xs">
                {language === 'zh' ? '暂未找到原产地证明书。' : 'No certificates of origin found.'}
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
              <h3 className="font-bold text-sm text-slate-800">{language === 'zh' ? '选择收货人客户' : 'Select Consignee Client'}</h3>
              <button onClick={() => setShowClientModal(false)}><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {clients.map(c => (
                <div
                  key={c.id}
                  onClick={() => {
                    handleFieldChange('consigneeName', c.company);
                    handleFieldChange('consigneeAddress', c.address);
                    handleFieldChange('countryOfDestination', c.country);
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
