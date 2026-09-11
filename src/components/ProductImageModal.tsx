import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  X, 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  Trash2, 
  Check, 
  Image as ImageIcon,
  Wand2,
  Package,
  Layers,
  ZoomIn
} from 'lucide-react';
import { PRODUCT_IMAGES_SVG } from '../utils/storage';
import { compressImageFile, removeWhiteBackground } from '../utils/imageCompressor';

export interface ProductImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: string;
  productName: string;
  onSaveImage: (imageUrl: string | undefined) => void;
}

const PRESET_CATEGORIES = [
  {
    category: "Sprayers & Dispensers",
    categoryZh: "喷雾枪与分配器",
    items: [
      { key: "sprayer", label: "28/410 Trigger Sprayer", labelZh: "28/410 手扣式喷雾枪", svg: PRODUCT_IMAGES_SVG.sprayer },
      { key: "miniTrigger", label: "Mini Trigger Sprayer", labelZh: "微型手扣喷枪", svg: PRODUCT_IMAGES_SVG.miniTrigger },
      { key: "mist", label: "Fine Mist Sprayer", labelZh: "微细雾化喷头", svg: PRODUCT_IMAGES_SVG.mist },
      { key: "continuousSprayer", label: "Continuous Flairosol Sprayer", labelZh: "高压连续喷雾瓶", svg: PRODUCT_IMAGES_SVG.continuousSprayer },
      { key: "cardSprayer", label: "Pocket Card Sprayer", labelZh: "便携卡片式喷雾盒", svg: PRODUCT_IMAGES_SVG.cardSprayer },
    ]
  },
  {
    category: "Pumps & Foamers",
    categoryZh: "乳液泵与泡沫泵",
    items: [
      { key: "pump", label: "Standard Lotion Pump", labelZh: "标准洗手液乳液泵", svg: PRODUCT_IMAGES_SVG.pump },
      { key: "treatmentPump", label: "Cosmetic Treatment Pump", labelZh: "护肤精华乳液泵", svg: PRODUCT_IMAGES_SVG.treatmentPump },
      { key: "foam", label: "Foam Pump Mechanism", labelZh: "慕斯泡沫泵头", svg: PRODUCT_IMAGES_SVG.foam },
      { key: "foamBrush", label: "Foam Pump with Brush", labelZh: "带硅胶刷泡沫泵", svg: PRODUCT_IMAGES_SVG.foamBrush },
      { key: "dropper", label: "Pipette Dropper Cap", labelZh: "精油滴管盖", svg: (PRODUCT_IMAGES_SVG as any).dropper },
    ]
  },
  {
    category: "Bottles, Jars & Closures",
    categoryZh: "瓶身、膏霜罐与盖类",
    items: [
      { key: "bottle", label: "Boston Round Bottle", labelZh: "波士顿圆塑料瓶", svg: PRODUCT_IMAGES_SVG.bottle },
      { key: "aluminumBottle", label: "Aluminum Metal Bottle", labelZh: "金属铝瓶", svg: (PRODUCT_IMAGES_SVG as any).aluminumBottle },
      { key: "jar", label: "Cream Cosmetic Jar", labelZh: "化妆品面霜膏霜罐", svg: PRODUCT_IMAGES_SVG.jar },
      { key: "flipCap", label: "Flip-Top Bottle Cap", labelZh: "掀盖/蝴蝶盖", svg: (PRODUCT_IMAGES_SVG as any).flipCap },
      { key: "discCap", label: "Disc-Top Press Cap", labelZh: "千秋盖/按压盖", svg: (PRODUCT_IMAGES_SVG as any).discCap },
      { key: "travelKit", label: "Cosmetic Travel Set", labelZh: "分装旅行套装", svg: PRODUCT_IMAGES_SVG.travelKit },
      { key: "box", label: "Export Master Carton", labelZh: "外贸标准瓦楞纸箱", svg: PRODUCT_IMAGES_SVG.box },
    ]
  },
  {
    category: "Precision Components & Hardware",
    categoryZh: "精密内部配件与五金",
    items: [
      { key: "spring", label: "SUS304 Stainless Spring", labelZh: "SUS304不锈钢弹簧", svg: (PRODUCT_IMAGES_SVG as any).spring },
      { key: "padGasket", label: "PE Gasket Sealing Pad", labelZh: "PE密封垫片", svg: (PRODUCT_IMAGES_SVG as any).padGasket },
      { key: "glassBall", label: "Precision Glass Ball", labelZh: "精密止回玻璃珠", svg: (PRODUCT_IMAGES_SVG as any).glassBall },
      { key: "dipTube", label: "PE Dip Tube Coil", labelZh: "PE吸管/导液管", svg: (PRODUCT_IMAGES_SVG as any).dipTube },
    ]
  }
];

export default function ProductImageModal({
  isOpen,
  onClose,
  currentImage,
  productName,
  onSaveImage
}: ProductImageModalProps) {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | undefined>(currentImage);
  const [urlInput, setUrlInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedImage(currentImage);
      setUrlInput(currentImage && currentImage.startsWith('http') ? currentImage : '');
    }
  }, [isOpen, currentImage]);

  // Global paste handler when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            await processFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const processFile = async (file: File, makeTransparent = false) => {
    setIsProcessing(true);
    setProcessingMsg(
      makeTransparent 
        ? (language === 'zh' ? '正在智能抠图并压缩优化图片...' : 'Removing background & optimizing image...') 
        : (language === 'zh' ? '正在优化与压缩产品图片...' : 'Optimizing and compressing image...')
    );
    try {
      let compressed = await compressImageFile(file, 600, 600, 0.75);
      if (makeTransparent) {
        compressed = await removeWhiteBackground(compressed, 210);
      }
      setSelectedImage(compressed);
    } catch (err) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    setSelectedImage(urlInput.trim());
  };

  const handleMakeTransparent = async () => {
    if (!selectedImage) return;
    setIsProcessing(true);
    setProcessingMsg(language === 'zh' ? '正在智能消除白色背景与保留透明通道...' : 'Removing white background & enhancing alpha...');
    try {
      const transparent = await removeWhiteBackground(selectedImage, 210);
      setSelectedImage(transparent);
    } catch (e) {
      console.warn('Background removal error:', e);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  const handleSave = () => {
    onSaveImage(selectedImage);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1565C0] flex items-center justify-center">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                {t('modal.img_title', 'Product Image Manager')}
              </h2>
              <p className="text-[11px] text-slate-500 truncate max-w-md">
                {productName || (language === 'zh' ? '自定义出口产品' : 'Custom Product')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-[#1565C0] text-[#1565C0]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Upload size={14} />
            {t('modal.img_upload_tab', 'Upload File / Paste (Ctrl+V)')}
          </button>
          
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'presets'
                ? 'border-[#1565C0] text-[#1565C0]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={14} className="text-amber-500" />
            {t('modal.img_preset_tab', 'Preset Vector Library')}
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'url'
                ? 'border-[#1565C0] text-[#1565C0]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <LinkIcon size={14} />
            {t('modal.img_url_tab', 'Web URL Link')}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* Main Preview Area */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-28 h-28 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-2 relative overflow-hidden shadow-xs shrink-0">
              {selectedImage ? (
                <img 
                  src={selectedImage} 
                  alt="Product preview" 
                  className="max-h-full max-w-full object-contain filter drop-shadow-xs" 
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center text-slate-300">
                  <Package size={32} className="mx-auto" />
                  <span className="text-[9px] block mt-1">{language === 'zh' ? '无图片' : 'No Image'}</span>
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  {selectedImage 
                    ? (language === 'zh' ? '已选产品照片 / 矢量图' : 'Selected Product Photo') 
                    : (language === 'zh' ? '尚未选择产品图片' : 'No photo chosen')}
                </span>
                {selectedImage && (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={10} /> {language === 'zh' ? '就绪' : 'Ready'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {language === 'zh' 
                  ? '此图片将展示在产品库、报价单、PI形式发票、商业发票及装箱单打印件中。' 
                  : 'This image will appear across the Product Library, Quotations, Proforma Invoices, and Commercial Invoices.'}
              </p>

              {selectedImage && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!selectedImage.startsWith('data:image/svg+xml') && (
                    <button
                      type="button"
                      onClick={handleMakeTransparent}
                      disabled={isProcessing}
                      className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      title={language === 'zh' ? '自动移除图片白色背景以形成透明通道' : 'Automatically remove white background to make transparent PNG'}
                    >
                      <Wand2 size={12} />
                      {t('modal.img_remove_bg', 'Remove White BG')}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedImage(undefined)}
                    className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} />
                    {t('modal.img_remove_photo', 'Remove Image')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tab 1: Upload File / Drag & Drop */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' 
                    : 'border-slate-300 hover:border-[#1565C0] bg-slate-50/50 hover:bg-blue-50/20'
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1565C0] flex items-center justify-center mb-3">
                  <Upload size={22} />
                </div>
                <h4 className="text-xs font-extrabold text-slate-800 mb-1">
                  {t('modal.img_drag_text', 'Click to browse or drag & drop product photo')}
                </h4>
                <p className="text-[11px] text-slate-500 max-w-sm">
                  {t('modal.img_supports', 'Supports JPG, PNG, WEBP, SVG or GIF. You can also paste from clipboard (Ctrl + V).')}
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-1.5 bg-white border border-slate-300 hover:border-[#1565C0] text-slate-700 text-xs font-bold rounded-lg shadow-2xs transition-all"
                >
                  {t('modal.img_select_btn', 'Select File from Computer')}
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {isProcessing && (
                <div className="p-3 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg text-xs flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span>{processingMsg || (language === 'zh' ? '正在处理图片...' : 'Processing image...')}</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Factory Vector Presets */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {language === 'zh' 
                  ? '💡 高清包装矢量结构图：泵头喷头、喷雾枪、膏霜瓶、拉管、弹簧及密封垫圈部件。'
                  : '💡 High-resolution vector diagrams for pump dispensers, trigger sprayers, cosmetic bottles, and internal hardware components.'}
              </div>

              <div className="space-y-4">
                {PRESET_CATEGORIES.map(cat => (
                  <div key={cat.category} className="space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {language === 'zh' ? (cat.categoryZh || cat.category) : cat.category}
                    </h5>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {cat.items.map(item => {
                        const isSelected = selectedImage === item.svg;
                        const itemTitle = language === 'zh' ? (item.labelZh || item.label) : item.label;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setSelectedImage(item.svg)}
                            className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-50 border-[#1565C0] ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center p-1.5 overflow-hidden">
                              <img 
                                src={item.svg} 
                                alt={itemTitle} 
                                className="max-h-full max-w-full object-contain"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <span className="text-[10px] font-bold text-slate-700 leading-tight">
                              {itemTitle}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Web URL Link */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'zh' ? '直接图片网址链接 (HTTPS)' : 'Direct Image URL Link (HTTPS)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://example.com/images/trigger-sprayer.png"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors cursor-pointer"
                  >
                    {language === 'zh' ? '加载链接' : 'Load Link'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {language === 'zh' 
                    ? '粘贴来自供应商相册、1688、阿里巴巴国际站或云存储服务器的公开图片直链。' 
                    : 'Paste links from suppliers, Alibaba, image hosting CDNs, or company servers.'}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
          >
            {t('btn.cancel', 'Cancel')}
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-[#1565C0] hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <Check size={14} />
            {t('modal.img_apply_btn', 'Apply Product Image')}
          </button>
        </div>

      </div>
    </div>
  );
}
