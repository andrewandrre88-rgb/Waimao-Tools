import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Product, Client, Invoice, PackingList } from '../types';
import { generateId, getNextDocumentNumber } from '../utils/storage';
import { 
  Calculator, 
  Box, 
  Package, 
  Plus, 
  Trash2, 
  Ship, 
  Scale, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  FileText,
  PackageOpen,
  Sparkles,
  X
} from 'lucide-react';

interface CbmCalculatorProps {
  products: Product[];
  clients: Client[];
  invoices: Invoice[];
  onSaveInvoices: (invs: Invoice[]) => void;
  packingLists: PackingList[];
  onSavePackingLists: (pls: PackingList[]) => void;
  setActiveTab: (tab: any) => void;
}

interface CalcItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  cartonLength: number; // cm
  cartonWidth: number; // cm
  cartonHeight: number; // cm
  cartonGrossWeight: number; // kg
  piecesPerBox: number;
  numBoxes: number;
}

const CONTAINER_SPECS = [
  { name: '20GP Container (20ft Standard)', nameZh: '20GP 小柜 (20尺普柜)', maxCbm: 28.0, maxKg: 28000, color: 'blue' },
  { name: '40GP Container (40ft Standard)', nameZh: '40GP 大柜 (40尺普柜)', maxCbm: 58.0, maxKg: 26000, color: 'emerald' },
  { name: '40HQ Container (40ft High Cube)', nameZh: '40HQ 高柜 (40尺高柜)', maxCbm: 68.0, maxKg: 26000, color: 'purple' },
  { name: '45HQ Container (45ft High Cube)', nameZh: '45HQ 特种高柜 (45尺高柜)', maxCbm: 78.0, maxKg: 27000, color: 'amber' },
];

export default function CbmCalculator({
  products,
  clients,
  invoices,
  onSaveInvoices,
  packingLists,
  onSavePackingLists,
  setActiveTab
}: CbmCalculatorProps) {
  const { t, language } = useLanguage();
  const [items, setItems] = useState<CalcItem[]>([
    {
      id: generateId(),
      productId: products[0]?.id || 'p1',
      name: products[0]?.name || '28/410 Plastic Trigger Sprayer',
      sku: products[0]?.sku || 'MTS-28410-A',
      cartonLength: products[0]?.cartonLength || 57,
      cartonWidth: products[0]?.cartonWidth || 38,
      cartonHeight: products[0]?.cartonHeight || 42,
      cartonGrossWeight: products[0]?.grossWeight || 13.2,
      piecesPerBox: products[0]?.piecesPerBox || 500,
      numBoxes: 50
    }
  ]);

  const [selectedProductModal, setSelectedProductModal] = useState(false);

  const handleAddItemFromCatalog = (p: Product) => {
    const newItem: CalcItem = {
      id: generateId(),
      productId: p.id,
      name: p.name,
      sku: p.sku,
      cartonLength: p.cartonLength || 50,
      cartonWidth: p.cartonWidth || 40,
      cartonHeight: p.cartonHeight || 40,
      cartonGrossWeight: p.grossWeight || 12,
      piecesPerBox: p.piecesPerBox || 500,
      numBoxes: 20
    };
    setItems([...items, newItem]);
    setSelectedProductModal(false);
  };

  const handleAddCustomItem = () => {
    const newItem: CalcItem = {
      id: generateId(),
      name: 'Custom Packaging Box',
      sku: 'CUSTOM-01',
      cartonLength: 50,
      cartonWidth: 40,
      cartonHeight: 40,
      cartonGrossWeight: 10,
      piecesPerBox: 500,
      numBoxes: 10
    };
    setItems([...items, newItem]);
  };

  const handleItemChange = (index: number, field: keyof CalcItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedItems = items.map(it => {
    const cbmPerBox = (it.cartonLength * it.cartonWidth * it.cartonHeight) / 1000000;
    const totalCbm = cbmPerBox * it.numBoxes;
    const totalWeight = it.cartonGrossWeight * it.numBoxes;
    const totalPieces = it.piecesPerBox * it.numBoxes;
    return {
      ...it,
      cbmPerBox,
      totalCbm,
      totalWeight,
      totalPieces
    };
  });

  const totalCartons = calculatedItems.reduce((acc, it) => acc + (Number(it.numBoxes) || 0), 0);
  const totalCbm = calculatedItems.reduce((acc, it) => acc + (it.totalCbm || 0), 0);
  const totalWeightKg = calculatedItems.reduce((acc, it) => acc + (it.totalWeight || 0), 0);
  const totalPieces = calculatedItems.reduce((acc, it) => acc + (it.totalPieces || 0), 0);

  // Export to Packing List
  const handleExportPackingList = () => {
    const nextPLNum = getNextDocumentNumber('packing', packingLists);
    const plItems = calculatedItems.map(it => ({
      id: generateId(),
      productId: it.productId,
      name: it.name,
      sku: it.sku,
      quantity: it.totalPieces,
      numBoxes: it.numBoxes,
      piecesPerBox: it.piecesPerBox,
      totalPieces: it.totalPieces,
      grossWeight: Number(it.totalWeight.toFixed(2)),
      netWeight: Number((it.totalWeight * 0.9).toFixed(2)),
      cartonLength: it.cartonLength,
      cartonWidth: it.cartonWidth,
      cartonHeight: it.cartonHeight,
      cbm: Number(it.totalCbm.toFixed(3))
    }));

    const newPL: PackingList = {
      id: generateId(),
      packingListNumber: nextPLNum,
      containerNumber: 'TBD',
      sealNumber: 'TBD',
      shipmentDate: new Date().toISOString().split('T')[0],
      portOfLoading: 'Ningbo, China',
      portOfDestination: 'Destination Port',
      containerType: totalCbm <= 28 ? '20FT' : totalCbm <= 68 ? '40HQ' : '40FT',
      client: clients[0] || { company: 'Sample Client', address: '', country: '', contactPerson: '', phone: '', email: '', id: 'c1', notes: '' },
      items: plItems,
      totalCbm: Number(totalCbm.toFixed(2)),
      totalCartons,
      totalPieces,
      totalWeight: Number(totalWeightKg.toFixed(2)),
      notes: 'Generated via Container Load CBM Calculator',
      createdAt: new Date().toISOString()
    };

    onSavePackingLists([newPL, ...packingLists]);
    setActiveTab('packing');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="text-[#1565C0]" size={24} />
            {t('cbm.title', 'Container Load & CBM Logistics Calculator')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('cbm.subtitle', 'Calculate ocean container space utilization, carton volume, total weight, and container requirements for shipments.')}
          </p>
        </div>

        <button
          onClick={handleExportPackingList}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
        >
          <PackageOpen size={16} />
          {t('cbm.create_packing', 'Export to Packing List')}
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t('cbm.total_cbm', 'Total Volume (CBM)')}</span>
            <Box size={16} className="text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCbm.toFixed(3)} <span className="text-xs font-normal text-slate-500">m³</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t('cbm.total_weight', 'Total Gross Weight')}</span>
            <Scale size={16} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalWeightKg.toLocaleString()} <span className="text-xs font-normal text-slate-500">kg</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t('cbm.total_cartons', 'Total Export Cartons')}</span>
            <Package size={16} className="text-amber-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCartons.toLocaleString()} <span className="text-xs font-normal text-slate-500">CTNS</span></p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>{t('cbm.total_pcs', 'Total Units / Pieces')}</span>
            <Sparkles size={16} className="text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalPieces.toLocaleString()} <span className="text-xs font-normal text-slate-500">PCS</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Table of Cartons & Dimensions */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Box size={18} className="text-[#1565C0]" />
              {language === 'zh' ? '外箱规格与出运货品批次' : 'Carton Specs & Cargo Batch'}
            </h3>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProductModal(true)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus size={14} /> {language === 'zh' ? '从产品库添加' : 'Add Product'}
              </button>
              <button
                onClick={handleAddCustomItem}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                + {language === 'zh' ? '自定义纸箱' : 'Custom Box'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {calculatedItems.map((item, idx) => (
              <div key={item.id} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="font-bold text-slate-900 text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1 py-0.5"
                    />
                    <p className="text-[10px] text-slate-500 px-1">SKU: {item.sku}</p>
                  </div>
                  <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 p-1 cursor-pointer">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '长 (cm)' : 'Length (cm)'}</label>
                    <input
                      type="number"
                      value={item.cartonLength}
                      onChange={(e) => handleItemChange(idx, 'cartonLength', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '宽 (cm)' : 'Width (cm)'}</label>
                    <input
                      type="number"
                      value={item.cartonWidth}
                      onChange={(e) => handleItemChange(idx, 'cartonWidth', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '高 (cm)' : 'Height (cm)'}</label>
                    <input
                      type="number"
                      value={item.cartonHeight}
                      onChange={(e) => handleItemChange(idx, 'cartonHeight', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '单箱毛重 (kg)' : 'Box GW (kg)'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={item.cartonGrossWeight}
                      onChange={(e) => handleItemChange(idx, 'cartonGrossWeight', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-semibold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '箱数 (Cartons)' : 'Carton Count'}</label>
                    <input
                      type="number"
                      value={item.numBoxes}
                      onChange={(e) => handleItemChange(idx, 'numBoxes', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right font-black text-blue-700"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">{language === 'zh' ? '每箱数量 (PCS)' : 'Pieces / Box'}</label>
                    <input
                      type="number"
                      value={item.piecesPerBox}
                      onChange={(e) => handleItemChange(idx, 'piecesPerBox', Number(e.target.value))}
                      className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-right"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-600 bg-white p-2 rounded border border-slate-100">
                  <span>{language === 'zh' ? '单箱体积' : 'CBM/Box'}: <strong>{item.cbmPerBox.toFixed(4)} m³</strong></span>
                  <span>{language === 'zh' ? '总体积' : 'Total CBM'}: <strong className="text-blue-700">{item.totalCbm.toFixed(3)} m³</strong></span>
                  <span>{language === 'zh' ? '总毛重' : 'Total Weight'}: <strong className="text-emerald-700">{item.totalWeight.toFixed(1)} kg</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Container Fit & Recommendation Panel */}
        <div className="lg:col-span-5 space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="font-bold text-sm text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Ship size={18} className="text-[#1565C0]" />
            {t('cbm.container_fit', 'Ocean Container Load Capacity')}
          </h3>

          <div className="space-y-4">
            {CONTAINER_SPECS.map(spec => {
              const volumeFill = Math.min(100, (totalCbm / spec.maxCbm) * 100);
              const weightFill = Math.min(100, (totalWeightKg / spec.maxKg) * 100);
              const fits = totalCbm <= spec.maxCbm && totalWeightKg <= spec.maxKg;
              const numContainersNeeded = Math.max(1, Math.ceil(totalCbm / spec.maxCbm));
              const displayName = language === 'zh' ? spec.nameZh : spec.name;

              return (
                <div 
                  key={spec.name} 
                  className={`p-4 rounded-xl border transition-all ${
                    fits 
                      ? 'bg-slate-50 border-slate-200' 
                      : 'bg-amber-50/50 border-amber-200'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{displayName}</h4>
                      <p className="text-[10px] text-slate-500">
                        {language === 'zh' ? '最大容积' : 'Max Vol'}: {spec.maxCbm} m³ | {language === 'zh' ? '最大载重' : 'Max Weight'}: {spec.maxKg.toLocaleString()} kg
                      </p>
                    </div>

                    {fits ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <CheckCircle2 size={12} /> {language === 'zh' ? '1个柜子即可装下' : 'Fits in 1 Container'}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> {language === 'zh' ? `需安排 ${numContainersNeeded} 个集装箱` : `Requires ${numContainersNeeded} Containers`}
                      </span>
                    )}
                  </div>

                  {/* Volume Gauge */}
                  <div className="space-y-1 mt-3">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">{language === 'zh' ? '体积装载率' : 'Volume Fill'} ({totalCbm.toFixed(2)} / {spec.maxCbm} m³)</span>
                      <span className="font-bold">{volumeFill.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${volumeFill > 100 ? 'bg-red-500' : volumeFill > 85 ? 'bg-amber-500' : 'bg-blue-600'}`} 
                        style={{ width: `${Math.min(100, volumeFill)}%` }}
                      />
                    </div>
                  </div>

                  {/* Weight Gauge */}
                  <div className="space-y-1 mt-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-500">{language === 'zh' ? '重量装载率' : 'Weight Fill'} ({totalWeightKg.toLocaleString()} / {spec.maxKg.toLocaleString()} kg)</span>
                      <span className="font-bold">{weightFill.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${weightFill > 100 ? 'bg-red-500' : 'bg-emerald-600'}`} 
                        style={{ width: `${Math.min(100, weightFill)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Select Product Modal */}
      {selectedProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="font-bold text-sm text-slate-800">{language === 'zh' ? '从产品库选择货品并测算 CBM' : 'Select Product to Calculate CBM'}</h3>
              <button onClick={() => setSelectedProductModal(false)} className="cursor-pointer"><X size={18} className="text-slate-400" /></button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {products.map(p => (
                <div
                  key={p.id}
                  onClick={() => handleAddItemFromCatalog(p)}
                  className="p-3 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 cursor-pointer flex items-center justify-between"
                >
                  <div>
                    <p className="font-bold text-xs text-slate-900">{p.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {language === 'zh' ? '外箱' : 'Carton'}: {p.cartonLength}x{p.cartonWidth}x{p.cartonHeight} cm | {language === 'zh' ? '毛重' : 'GW'}: {p.grossWeight} kg
                    </p>
                  </div>
                  <Plus size={16} className="text-blue-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
