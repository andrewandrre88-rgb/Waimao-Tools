import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Product, CompanySettings } from '../types';
import { generateId, PRODUCT_IMAGES_SVG } from '../utils/storage';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  Edit2, 
  Trash2, 
  Copy, 
  Upload, 
  Download, 
  X, 
  Check,
  ChevronRight,
  Package,
  HelpCircle,
  Sparkles,
  Calculator,
  Layers,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Wand2
} from 'lucide-react';

import { compressImageFile } from '../utils/imageCompressor';
import ProductImageModal from './ProductImageModal';

interface ProductLibraryProps {
  products: Product[];
  onSaveProducts: (products: Product[]) => void;
  settings?: CompanySettings;
  // Hook for deep linking from Global Search
  searchTarget: { id: string; type: string } | null;
  clearSearchTarget: () => void;
}

function formatUnitPrice(price: number | undefined | null, curr: string = 'USD'): string {
  if (price === undefined || price === null || isNaN(price)) return `${curr} 0.00`;
  if (price === 0) return `${curr} 0.00`;
  if (price < 0.01) {
    return `${curr} ${price.toFixed(6)}`;
  }
  return `${curr} ${price.toFixed(3)}`;
}

const LOW_PRICE_COMPONENT_PRESETS: Partial<Product>[] = [
  {
    name: "Spring for liquid soap pump",
    sku: "SPR-LSP-01",
    category: "Pump & Atomizer Components",
    description: "Stainless steel spring for liquid soap pump mechanism. High corrosion resistance.",
    color: "Silver",
    material: "SUS304 Stainless Steel",
    weight: 0.001,
    price: 0.004448,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 30,
    cartonWidth: 30,
    cartonHeight: 25,
    grossWeight: 10.0,
    netWeight: 9.5,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Priced at $44.48 per 10,000 pcs ($0.004448 / unit)."
  },
  {
    name: "Pad for liquid soap pump",
    sku: "PAD-LSP-02",
    category: "Pump & Atomizer Components",
    description: "Sealing pad gasket for liquid soap pump valve assembly.",
    color: "White",
    material: "PE",
    weight: 0.0005,
    price: 0.000800,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 25,
    cartonWidth: 25,
    cartonHeight: 20,
    grossWeight: 5.0,
    netWeight: 4.8,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Priced at $8.00 per 10,000 pcs ($0.000800 / unit)."
  },
  {
    name: "Glass ball for liquid soap pump",
    sku: "GLB-LSP-03",
    category: "Pump & Atomizer Components",
    description: "Precision glass ball valve element for liquid soap pump intake.",
    color: "Clear",
    material: "High-grade Glass",
    weight: 0.0003,
    price: 0.000506,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 20,
    cartonWidth: 20,
    cartonHeight: 15,
    grossWeight: 3.5,
    netWeight: 3.2,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.pump,
    notes: "Priced at $5.06 per 10,000 pcs ($0.000506 / unit)."
  },
  {
    name: "Spring for atomizer",
    sku: "SPR-ATM-04",
    category: "Pump & Atomizer Components",
    description: "Precision spring for fine mist atomizer mechanism.",
    color: "Silver",
    material: "SUS304 Stainless Steel",
    weight: 0.0008,
    price: 0.003687,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 30,
    cartonWidth: 30,
    cartonHeight: 25,
    grossWeight: 8.5,
    netWeight: 8.0,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Priced at $36.87 per 10,000 pcs ($0.003687 / unit)."
  },
  {
    name: "Pad for atomizer",
    sku: "PAD-ATM-05",
    category: "Pump & Atomizer Components",
    description: "Gasket sealing pad for fine mist atomizer pump.",
    color: "White",
    material: "PE",
    weight: 0.0005,
    price: 0.000800,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 25,
    cartonWidth: 25,
    cartonHeight: 20,
    grossWeight: 5.0,
    netWeight: 4.8,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Priced at $8.00 per 10,000 pcs ($0.000800 / unit)."
  },
  {
    name: "Glass ball for atomizer",
    sku: "GLB-ATM-06",
    category: "Pump & Atomizer Components",
    description: "Precision micro glass ball valve for atomizer engine.",
    color: "Clear",
    material: "High-grade Glass",
    weight: 0.0002,
    price: 0.000370,
    moq: 10000,
    piecesPerBox: 10000,
    cartonLength: 20,
    cartonWidth: 20,
    cartonHeight: 15,
    grossWeight: 2.5,
    netWeight: 2.2,
    countryOfOrigin: "China",
    image: PRODUCT_IMAGES_SVG.sprayer,
    notes: "Priced at $3.70 per 10,000 pcs ($0.000370 / unit)."
  }
];

export default function ProductLibrary({ products, onSaveProducts, settings, searchTarget, clearSearchTarget }: ProductLibraryProps) {
  const { t, language } = useLanguage();
  const displayCurrency = settings?.defaultCurrency || 'USD';
  // Navigation & Search State
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Form State
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);

  // Dedicated Product Image Modal State
  const [imageModalProduct, setImageModalProduct] = useState<Product | Partial<Product> | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);

  // CSV Import & Batch Calculator Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [calcBatchQty, setCalcBatchQty] = useState<number>(2000000);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);

  // Listen for Clipboard Image Paste (Ctrl+V) when in editing form
  useEffect(() => {
    if (!isEditing) return;

    const handleFormPaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            try {
              const compressed = await compressImageFile(file, 600, 600, 0.75);
              setCurrentProduct(prev => prev ? ({ ...prev, image: compressed }) : null);
              setSaveNotification("Pasted photo applied to product!");
              setTimeout(() => setSaveNotification(null), 3000);
            } catch (err) {
              const reader = new FileReader();
              reader.onloadend = () => {
                setCurrentProduct(prev => prev ? ({ ...prev, image: reader.result as string }) : null);
              };
              reader.readAsDataURL(file);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handleFormPaste);
    return () => window.removeEventListener('paste', handleFormPaste);
  }, [isEditing]);

  const handleOpenImageModal = (product: Product | Partial<Product>, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setImageModalProduct(product);
    setIsImageModalOpen(true);
  };

  const handleSaveImageModal = (newImage: string | undefined) => {
    if (!imageModalProduct) return;

    // If we're inside the product edit form
    if (isEditing && currentProduct) {
      setCurrentProduct(prev => prev ? ({ ...prev, image: newImage }) : null);
      setSaveNotification("Product photo updated!");
      setTimeout(() => setSaveNotification(null), 3000);
      return;
    }

    // Direct update on product catalog from grid or table
    if ('id' in imageModalProduct && imageModalProduct.id) {
      const updatedProducts = products.map(p => 
        p.id === imageModalProduct.id ? { ...p, image: newImage } : p
      );
      onSaveProducts(updatedProducts);
      setSaveNotification(`Product image updated for "${imageModalProduct.name || 'Product'}"`);
      setTimeout(() => setSaveNotification(null), 4000);
    }
  };

  // Extract categories for filter
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Apply deep link searchTarget if matching
  if (searchTarget && searchTarget.type === 'product' && !isEditing) {
    const matched = products.find(p => p.id === searchTarget.id);
    if (matched) {
      setCurrentProduct(matched);
      setIsEditing(true);
      clearSearchTarget();
    }
  }

  // Filter products cleanly (handling optional SKU safely)
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.material || '').toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle preset import
  const handleImportPresets = () => {
    const existingNames = new Set(products.map(p => p.name.toLowerCase()));
    const newItems: Product[] = [];

    LOW_PRICE_COMPONENT_PRESETS.forEach(preset => {
      if (!existingNames.has((preset.name || '').toLowerCase())) {
        newItems.push({
          ...preset,
          id: generateId()
        } as Product);
      }
    });

    if (newItems.length === 0) {
      alert("All pump and atomizer component presets are already in your Product Library!");
      return;
    }

    onSaveProducts([...newItems, ...products]);
    alert(`Successfully added ${newItems.length} low-price component presets to your Product Library!`);
  };

  // Handle save (create or update)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct) return;

    const updated = { ...currentProduct } as Product;
    
    // Validations: SKU is now OPTIONAL
    if (!updated.name) {
      alert(language === 'zh' ? "产品品名 / 描述为必填项" : "Product Name is required");
      return;
    }

    updated.sku = updated.sku ? updated.sku.trim() : '';

    // Default fallbacks
    updated.price = Number(updated.price) || 0;
    updated.moq = Number(updated.moq) || 0;
    updated.piecesPerBox = Number(updated.piecesPerBox) || 1;
    updated.weight = Number(updated.weight) || 0;
    updated.cartonLength = Number(updated.cartonLength) || 0;
    updated.cartonWidth = Number(updated.cartonWidth) || 0;
    updated.cartonHeight = Number(updated.cartonHeight) || 0;
    updated.grossWeight = Number(updated.grossWeight) || 0;
    updated.netWeight = Number(updated.netWeight) || 0;

    let nextProducts: Product[];
    const isUpdate = Boolean(updated.id);
    if (updated.id) {
      // Edit mode - updates ONLY in Product Library
      nextProducts = products.map(p => p.id === updated.id ? updated : p);
    } else {
      // New mode - adds to Product Library
      updated.id = generateId();
      nextProducts = [updated, ...products];
    }

    onSaveProducts(nextProducts);
    setIsEditing(false);
    setCurrentProduct(null);
    setSaveNotification(
      isUpdate 
        ? (language === 'zh' ? `产品 "${updated.name}" 已在产品库中更新！` : `"${updated.name}" updated in Product Library! (Changes saved strictly to Product Library; other sections remain untouched.)`)
        : (language === 'zh' ? `产品 "${updated.name}" 已成功保存至产品库！` : `"${updated.name}" saved to Product Library!`)
    );
    setTimeout(() => setSaveNotification(null), 6000);
  };

  // Handle Delete
  const handleDeleteProduct = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let approved = false;
    try {
      approved = window.confirm("Are you sure you want to delete this product from the library?");
    } catch (err) {
      approved = true;
    }
    if (approved) {
      const next = products.filter(p => p.id !== id);
      onSaveProducts(next);
    }
  };

  // Handle Duplicate
  const handleDuplicateProduct = (p: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: Product = {
      ...p,
      id: generateId(),
      name: `${p.name} (Copy)`,
      sku: p.sku ? `${p.sku}-COPY` : ''
    };
    onSaveProducts([duplicated, ...products]);
  };

  // Handle Drag & Drop Image Upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImageFile(file, 400, 400, 0.7);
        setCurrentProduct(prev => ({ ...prev, image: compressed }));
      } catch (err) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCurrentProduct(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Export Product Catalog to CSV file
  const handleExportCSV = () => {
    const headers = [
      "Product Name", "SKU", "Category", "Description", "Color", "Material", 
      "Weight (kg)", "Price (USD)", "MOQ", "Pieces Per Box", 
      "Carton Length (cm)", "Carton Width (cm)", "Carton Height (cm)", 
      "Gross Weight (kg)", "Net Weight (kg)", "Barcode", "HS Code", "Country Of Origin"
    ];

    const rows = products.map(p => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.sku || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      `"${(p.color || '').replace(/"/g, '""')}"`,
      `"${(p.material || '').replace(/"/g, '""')}"`,
      p.weight, p.price, p.moq, p.piecesPerBox,
      p.cartonLength, p.cartonWidth, p.cartonHeight,
      p.grossWeight, p.netWeight,
      `"${p.barcode || ''}"`,
      `"${p.hsCode || ''}"`,
      `"${p.countryOfOrigin || ''}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `MILA_Products_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import Product Catalog from CSV
  const handleImportCSVSubmit = () => {
    if (!csvPreview.trim()) return;

    try {
      const lines = csvPreview.split("\n");
      if (lines.length < 2) {
        alert("Invalid CSV format. Header and at least one row required.");
        return;
      }

      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const importedProducts: Product[] = [];
      const rows = lines.slice(1);

      rows.forEach(row => {
        if (!row.trim()) return;
        const cols = parseCSVLine(row);
        
        // SKU is optional in CSV import as well
        if (cols.length >= 1 && cols[0]) {
          importedProducts.push({
            id: generateId(),
            name: cols[0].replace(/^"|"$/g, ''),
            sku: cols[1] ? cols[1].replace(/^"|"$/g, '') : '',
            category: cols[2]?.replace(/^"|"$/g, '') || "Uncategorized",
            description: cols[3]?.replace(/^"|"$/g, '') || "",
            color: cols[4]?.replace(/^"|"$/g, '') || "",
            material: cols[5]?.replace(/^"|"$/g, '') || "",
            weight: Number(cols[6]) || 0,
            price: Number(cols[7]) || 0,
            moq: Number(cols[8]) || 0,
            piecesPerBox: Number(cols[9]) || 1,
            cartonLength: Number(cols[10]) || 0,
            cartonWidth: Number(cols[11]) || 0,
            cartonHeight: Number(cols[12]) || 0,
            grossWeight: Number(cols[13]) || 0,
            netWeight: Number(cols[14]) || 0,
            barcode: cols[15]?.replace(/^"|"$/g, '') || "",
            hsCode: cols[16]?.replace(/^"|"$/g, '') || "",
            countryOfOrigin: cols[17]?.replace(/^"|"$/g, '') || "China",
            notes: "Imported via CSV",
            image: PRODUCT_IMAGES_SVG.sprayer
          });
        }
      });

      if (importedProducts.length > 0) {
        onSaveProducts([...importedProducts, ...products]);
        alert(`Successfully imported ${importedProducts.length} products!`);
        setShowImportModal(false);
        setCsvPreview('');
      } else {
        alert("No valid products could be parsed from the CSV rows.");
      }
    } catch (e) {
      alert("Error parsing CSV data. Please check structure.");
    }
  };

  const handleCsvFileLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvPreview(event.target?.result as string || '');
      };
      reader.readAsText(file);
    }
  };

  // Helper template CSV generator to copy/paste
  const getCsvTemplate = () => {
    return `Product Name,SKU,Category,Description,Color,Material,Weight (kg),Price (USD),MOQ,Pieces Per Box,Carton Length,Carton Width,Carton Height,Gross Weight,Net Weight,Barcode,HS Code,Country Of Origin
"Spring for liquid soap pump","SPR-LSP-01","Pump & Atomizer Components","Stainless steel spring for liquid soap pump","Metallic","SUS304",0.001,0.004448,10000,10000,30,30,25,10.0,9.5,"","","China"
"Glass ball for atomizer","GLB-ATM-06","Pump & Atomizer Components","Precision micro glass ball valve","Clear","Glass",0.0002,0.000370,10000,10000,20,20,15,2.5,2.2,"","","China"`;
  };

  return (
    <div className="space-y-6 print:hidden">
      {/* Top Banner and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Package className="text-[#1565C0]" size={22} />
            {t('products.title', 'Product Library')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('products.subtitle', "Store, search, and manage MILA's catalog of industrial components, finished items & high-precision micro-priced parts.")}
          </p>
        </div>
        
        {/* Bulk tools & Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={handleImportPresets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 text-[#1565C0] hover:bg-blue-100 text-xs font-bold transition-all cursor-pointer"
            title={language === 'zh' ? '快速载入泵头喷雾枪标准配件参数' : 'Add low-price pump and atomizer component presets'}
          >
            <Layers size={14} /> {language === 'zh' ? '载入标准配件预设' : 'Add Component Presets'}
          </button>

          <button 
            onClick={() => setShowCalculatorModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50/50 text-purple-700 hover:bg-purple-100 text-xs font-bold transition-all cursor-pointer"
            title={language === 'zh' ? '大批量万件/百万件成本核算器' : 'Batch Quantity & 10,000 Pcs Cost Estimator'}
          >
            <Calculator size={14} /> {language === 'zh' ? '万件/百万件估算' : '10k & 2M Pcs Calculator'}
          </button>

          <button 
            onClick={() => {
              setCsvPreview(getCsvTemplate());
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
          >
            <Upload size={14} /> {t('products.import_csv', 'Import CSV')}
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-all cursor-pointer"
          >
            <Download size={14} /> {t('products.export_csv', 'Export CSV')}
          </button>
          
          <button 
            onClick={() => {
              setCurrentProduct({
                category: 'Uncategorized',
                countryOfOrigin: 'China',
                image: PRODUCT_IMAGES_SVG.sprayer,
                piecesPerBox: 10000,
                moq: 10000
              });
              setIsEditing(true);
            }}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#1565C0] text-white hover:bg-blue-700 text-xs font-extrabold transition-all shadow-xs cursor-pointer"
          >
            <Plus size={14} /> {t('products.new_product', 'Add Product')}
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {saveNotification && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>{saveNotification}</span>
          </div>
          <button 
            onClick={() => setSaveNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 text-xs font-bold px-1.5 py-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Panel */}
      {!isEditing ? (
        <>
          {/* Search, Filter & View Controls */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-xs shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder={t('products.search_placeholder', 'Search catalog by name, SKU, material...')} 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full no-scrollbar py-0.5">
              {categories.map(cat => {
                let catLabel = cat;
                if (language === 'zh') {
                  const catMap: Record<string, string> = {
                    'All': '全部分类',
                    'Trigger Sprayers': '扳机喷枪',
                    'Lotion Pumps': '乳液泵',
                    'Fine Mist Sprayers': '细雾喷头',
                    'Spray Bottles': '塑料喷雾瓶',
                    'Foam Pumps': '泡沫泵',
                    'Aluminum Bottles': '铝瓶',
                    'Cosmetic Jars': '膏霜瓶罐',
                    'Bottle Caps': '瓶盖/千秋盖',
                    'Pump & Atomizer Components': '泵头/喷头配件',
                    'Uncategorized': '未分类'
                  };
                  catLabel = catMap[cat] || cat;
                }
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-xs px-3 py-1 rounded-full transition-all shrink-0 font-medium cursor-pointer ${
                      selectedCategory === cat 
                        ? 'bg-blue-50 text-[#1565C0] font-bold border border-blue-200' 
                        : 'bg-slate-50 text-slate-600 border border-transparent hover:bg-slate-100'
                    }`}
                  >
                    {catLabel}
                  </button>
                );
              })}
            </div>

            {/* Layout switch buttons */}
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 shrink-0 self-end md:self-auto">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title={language === 'zh' ? '卡片网格视图' : 'Grid view'}
              >
                <Grid size={14} />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                title={language === 'zh' ? '列表表格视图' : 'Table list view'}
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Product Grid / Table Display */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-400 mb-3">
                <Package size={24} />
              </div>
              <p className="text-xs font-semibold text-slate-600">{t('products.no_products_found', 'No products found matching filters.')}</p>
              <p className="text-[10px] mt-1">{language === 'zh' ? '请调整搜索词或添加新产品。' : 'Adjust search parameters or insert a new product code.'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid Layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map(p => {
                let displayCat = p.category;
                if (language === 'zh') {
                  const catMap: Record<string, string> = {
                    'Trigger Sprayers': '扳机喷枪',
                    'Lotion Pumps': '乳液泵',
                    'Fine Mist Sprayers': '细雾喷头',
                    'Spray Bottles': '塑料喷雾瓶',
                    'Foam Pumps': '泡沫泵',
                    'Aluminum Bottles': '铝瓶',
                    'Cosmetic Jars': '膏霜瓶罐',
                    'Bottle Caps': '瓶盖/千秋盖',
                    'Pump & Atomizer Components': '泵头配件',
                    'Uncategorized': '未分类'
                  };
                  displayCat = catMap[p.category] || p.category;
                }

                return (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setCurrentProduct(p);
                      setIsEditing(true);
                    }}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-[#1565C0] hover:shadow-md cursor-pointer transition-all group flex flex-col h-full relative"
                  >
                    {/* Photo Section with quick change overlay */}
                    <div className="h-44 bg-slate-50 border-b border-slate-100 relative flex items-center justify-center p-4 overflow-hidden group/img">
                      {p.image ? (
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="max-h-full max-w-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-center text-slate-300 flex flex-col items-center">
                          <Package size={36} />
                          <span className="text-[10px] text-slate-400 font-medium mt-1">
                            {language === 'zh' ? '暂无产品图片' : 'No Image'}
                          </span>
                        </div>
                      )}

                      <span className="absolute top-2.5 right-2.5 text-[9px] bg-white/95 text-[#1565C0] border border-slate-200 font-bold px-2 py-0.5 rounded-md uppercase shadow-xs z-10">
                        {displayCat}
                      </span>

                      {/* Interactive Image Overlay Button */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px] z-20">
                        <button
                          type="button"
                          onClick={(e) => handleOpenImageModal(p, e)}
                          className="px-3 py-1.5 bg-white hover:bg-blue-50 text-slate-800 hover:text-[#1565C0] rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5 transform translate-y-1 group-hover/img:translate-y-0 cursor-pointer"
                          title={language === 'zh' ? '上传、更换图片或选择矢量图预设' : 'Upload, change, or pick preset vector illustration'}
                        >
                          <Camera size={13} className="text-[#1565C0]" />
                          <span>{p.image ? (language === 'zh' ? '更换图片' : 'Change Photo') : (language === 'zh' ? '添加图片' : 'Add Photo')}</span>
                        </button>
                      </div>
                    </div>

                    {/* Body Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-mono text-slate-400 tracking-wider">
                          {p.sku ? `SKU: ${p.sku}` : (language === 'zh' ? '无货号' : 'NO SKU')} {p.size ? `• ${language === 'zh' ? '规格' : 'Size'}: ${p.size}` : ''}
                        </span>
                        <h3 className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-[#1565C0] transition-colors mt-0.5">
                          {p.name}
                        </h3>
                        <p className="text-[10px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
                          {p.description || (language === 'zh' ? '暂无产品详细描述。' : 'No description provided.')}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-4">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-semibold">
                            {language === 'zh' ? '外贸出厂单价' : 'UNIT PRICE'}
                          </span>
                          <span className="text-xs font-black text-[#1565C0] font-mono">
                            {formatUnitPrice(p.price, displayCurrency)}
                          </span>
                          {p.price < 0.01 && p.price > 0 && (
                            <span className="text-[9px] text-blue-600 font-medium block font-mono">
                              ({displayCurrency} { (p.price * 10000).toFixed(2) } {language === 'zh' ? '/ 万只' : '/ 10k pcs'})
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleOpenImageModal(p, e)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-[#1565C0] transition-colors cursor-pointer"
                            title={language === 'zh' ? '管理/更换产品图片' : 'Manage Product Image'}
                          >
                            <Camera size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDuplicateProduct(p, e)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer"
                            title={language === 'zh' ? '快速复制此产品' : 'Duplicate Product'}
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteProduct(p.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                            title={language === 'zh' ? '删除产品' : 'Delete Product'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table Layout */
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-3 px-4">{language === 'zh' ? '产品明细' : 'Product Details'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? 'SKU / 规格' : 'SKU / Size'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '分类' : 'Category'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '材质 / 颜色' : 'Material / Color'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '单价' : 'Unit Price'}</th>
                      <th className="py-3 px-4">{language === 'zh' ? '包装/装箱参数' : 'Export Specs'}</th>
                      <th className="py-3 px-4 text-right">{language === 'zh' ? '操作' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProducts.map(p => {
                      let displayCat = p.category;
                      if (language === 'zh') {
                        const catMap: Record<string, string> = {
                          'Trigger Sprayers': '扳机喷枪',
                          'Lotion Pumps': '乳液泵',
                          'Fine Mist Sprayers': '细雾喷头',
                          'Spray Bottles': '塑料喷雾瓶',
                          'Foam Pumps': '泡沫泵',
                          'Aluminum Bottles': '铝瓶',
                          'Cosmetic Jars': '膏霜瓶罐',
                          'Bottle Caps': '瓶盖/千秋盖',
                          'Pump & Atomizer Components': '泵头配件',
                          'Uncategorized': '未分类'
                        };
                        displayCat = catMap[p.category] || p.category;
                      }

                      return (
                        <tr 
                          key={p.id}
                          onClick={() => {
                            setCurrentProduct(p);
                            setIsEditing(true);
                          }}
                          className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                        >
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => handleOpenImageModal(p, e)}
                                className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-200 hover:border-[#1565C0] hover:ring-2 hover:ring-blue-500/20 shrink-0 relative group/thumb overflow-hidden transition-all cursor-pointer"
                                title={language === 'zh' ? '点击更换产品图片' : 'Click to change product photo'}
                              >
                                {p.image ? (
                                  <img src={p.image} alt="" className="h-7 w-7 object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <Package size={16} className="text-slate-300" />
                                )}
                                <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                                  <Camera size={12} className="text-white" />
                                </div>
                              </button>
                              <div className="min-w-0">
                                <p className="font-extrabold text-slate-800 truncate">{p.name}</p>
                                <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.description || (language === 'zh' ? '暂无描述' : 'No description')}</p>
                              </div>
                            </div>
                          </td>
                           <td className="py-3 px-4 text-slate-600 font-medium">
                            <span className="font-mono font-bold">
                              {p.sku || <span className="text-slate-300 font-normal italic">{language === 'zh' ? '无货号' : 'No SKU'}</span>}
                            </span>
                            {p.size && <span className="block text-[10px] text-slate-400 mt-0.5">{p.size}</span>}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {displayCat}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            {p.material || 'N/A'} <span className="text-slate-400">({p.color || 'N/A'})</span>
                          </td>
                          <td className="py-3 px-4 font-black text-[#1565C0] font-mono">
                            <div>{formatUnitPrice(p.price, displayCurrency)}</div>
                            {p.price < 0.01 && p.price > 0 && (
                              <div className="text-[9px] text-blue-600 font-medium font-mono">
                                {displayCurrency} { (p.price * 10000).toFixed(2) } {language === 'zh' ? '/ 万只' : '/ 10k pcs'}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-500 text-[10px]">
                            {language === 'zh' ? '装箱' : 'Pcs/Box'}: {p.piecesPerBox} | MOQ: {p.moq}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={(e) => handleOpenImageModal(p, e)}
                                className="p-1.5 rounded bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-[#1565C0] transition-colors cursor-pointer"
                                title={language === 'zh' ? '更换图片' : 'Change Photo'}
                              >
                                <Camera size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDuplicateProduct(p, e)}
                                className="p-1.5 rounded bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={language === 'zh' ? '复制产品' : 'Duplicate'}
                              >
                                <Copy size={13} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentProduct(p);
                                  setIsEditing(true);
                                }}
                                className="p-1.5 rounded bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                                title={language === 'zh' ? '编辑产品' : 'Edit'}
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                onClick={(e) => handleDeleteProduct(p.id, e)}
                                className="p-1.5 rounded bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                                title={language === 'zh' ? '删除产品' : 'Delete'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Detailed Edit/Create Form Panel */
        <form onSubmit={handleSaveProduct} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
              {currentProduct.id 
                ? (language === 'zh' ? '修改产品规格与参数' : 'Modify Product Specifications')
                : (language === 'zh' ? '录入新产品模具 / 零部件 / 成品' : 'Define New Product Mold / Component')}
            </h2>
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setCurrentProduct(null);
              }}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Core & Pictures */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Picture Upload Zone */}
              <div className="md:col-span-1 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {language === 'zh' ? '产品图片 / 图纸' : 'Product Illustration / Photo'}
                  </span>
                  {currentProduct.image && (
                    <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Check size={10} /> {language === 'zh' ? '已上传照片' : 'Photo Loaded'}
                    </span>
                  )}
                </div>
                
                <div 
                  onClick={() => handleOpenImageModal(currentProduct || {}, undefined)}
                  className="border-2 border-dashed border-slate-200 hover:border-[#1565C0] rounded-xl p-4 h-52 flex flex-col items-center justify-center bg-slate-50/60 hover:bg-blue-50/15 cursor-pointer transition-all relative overflow-hidden group/formimg shadow-2xs"
                >
                  {currentProduct.image ? (
                    <div className="absolute inset-2 flex items-center justify-center">
                      <img 
                        src={currentProduct.image} 
                        alt="Preview" 
                        className="max-h-full max-w-full object-contain filter drop-shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/formimg:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[1px]">
                        <span className="px-3 py-1.5 bg-white text-slate-800 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
                          <Camera size={12} className="text-[#1565C0]" /> {language === 'zh' ? '更换图片' : 'Change Photo'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentProduct(prev => ({ ...prev, image: undefined }));
                        }}
                        className="absolute top-1 right-1 p-1.5 bg-white/90 text-red-600 hover:bg-red-50 border border-red-200 rounded-full transition-colors cursor-pointer z-10 shadow-xs"
                        title={language === 'zh' ? '删除图片' : 'Remove photo'}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2.5">
                      <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1565C0] flex items-center justify-center mx-auto">
                        <Camera size={22} />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-700">{language === 'zh' ? '添加产品图片' : 'Add Product Image'}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{language === 'zh' ? '支持上传本地图片、预设矢量图或粘贴网络链接' : 'Upload, pick from presets, or paste link'}</p>
                      </div>
                      <span className="inline-block px-2.5 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-bold text-slate-600 shadow-2xs">
                        {language === 'zh' ? '浏览图库或上传' : 'Browse Library or Upload'}
                      </span>
                    </div>
                  )}
                  <input 
                    ref={imgInputRef} 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    className="hidden" 
                  />
                </div>

                {/* Quick Action Buttons Under Image */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenImageModal(currentProduct || {}, undefined)}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1565C0] border border-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Sparkles size={12} className="text-amber-500" />
                    {language === 'zh' ? '矢量预设图' : 'Vector Presets'}
                  </button>
                  <button
                    type="button"
                    onClick={() => imgInputRef.current?.click()}
                    className="flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-[#1565C0] border border-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                  >
                    <Upload size={12} />
                    {language === 'zh' ? '本地上传' : 'Upload File'}
                  </button>
                </div>
                <p className="text-[9px] text-slate-400 text-center">
                  {language === 'zh' ? '💡 提示：在任意位置按 Ctrl+V 即可直接粘贴截图或剪贴板图片！' : '💡 Tip: You can press Ctrl+V anywhere to paste an image!'}
                </p>
              </div>

              {/* Core Details */}
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {language === 'zh' ? '产品品名 / 描述' : 'Product Name'} <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder={language === 'zh' ? '例如：洗手液乳液泵不锈钢弹簧' : 'e.g. Spring for liquid soap pump'}
                    value={currentProduct.name || ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {language === 'zh' ? '产品编码 / 货号 (SKU)' : 'SKU Code'} <span className="text-slate-400 font-normal font-sans">({language === 'zh' ? '选填' : 'Optional'})</span>
                  </label>
                  <input 
                    type="text" 
                    placeholder={language === 'zh' ? '例如：SPR-LSP-01 (选填)' : 'e.g. SPR-LSP-01 (Optional)'}
                    value={currentProduct.sku || ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, sku: e.target.value.toUpperCase() }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {language === 'zh' ? '规格 / 尺寸参数' : 'Size / Specification'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={language === 'zh' ? '例如：28/410，标准泵芯' : 'e.g. 28/410, Standard Pump Engine'}
                    value={currentProduct.size || ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {language === 'zh' ? '产品分类' : 'Category Filter'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={language === 'zh' ? '例如：泵头与喷头配件' : 'e.g. Pump & Atomizer Components'}
                    value={currentProduct.category || ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {language === 'zh' ? '材质构成 / 模具材料' : 'Molding Material'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={language === 'zh' ? '例如：不锈钢 SUS304, PE塑料, 玻璃' : 'e.g. Stainless Steel SUS304, PE, Glass'}
                    value={currentProduct.material || ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, material: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {language === 'zh' ? '外观颜色 / 表面处理' : 'Color Profile'}
                  </label>
                  <input 
                    type="text" 
                    placeholder={language === 'zh' ? '例如：银色、金属亮光、透明' : 'e.g. Silver, Metallic, Clear'}
                    value={currentProduct.color || ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] focus:ring-1 focus:ring-[#1565C0] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Description Block */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                {language === 'zh' ? '外贸英文商业品名与详细描述' : 'Detailed Commercial Description'}
              </label>
              <textarea 
                rows={2}
                placeholder={language === 'zh' ? '填写出口报关品名、公差标准、材质认证、适用场景等...' : 'Details of materials, tolerances, certifications...'}
                value={currentProduct.description || ''}
                onChange={(e) => setCurrentProduct(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
              />
            </div>

            {/* Price, Weight, MOQ & Barcode */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 border-t border-slate-100 pt-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'zh' ? `单价 (${displayCurrency})` : `Unit Price (${displayCurrency})`}
                </label>
                <input 
                  type="number" 
                  step="0.000001"
                  min="0"
                  placeholder="0.000000"
                  value={currentProduct.price !== undefined ? currentProduct.price : ''}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCurrentProduct(prev => ({ ...prev, price: isNaN(val) ? 0 : val }));
                  }}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 font-mono focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 text-[#1565C0]">
                  {language === 'zh' ? `万只单价 / 10,000个 (${displayCurrency})` : `Price / 10,000 Pcs (${displayCurrency})`}
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder={language === 'zh' ? '例如：44.48' : 'e.g. 44.48'}
                  value={currentProduct.price !== undefined && currentProduct.price > 0 ? parseFloat((currentProduct.price * 10000).toFixed(2)) : ''}
                  onChange={(e) => {
                    const val10k = parseFloat(e.target.value);
                    if (!isNaN(val10k)) {
                      const unitP = parseFloat((val10k / 10000).toFixed(6));
                      setCurrentProduct(prev => ({ ...prev, price: unitP }));
                    } else {
                      setCurrentProduct(prev => ({ ...prev, price: 0 }));
                    }
                  }}
                  className="w-full bg-blue-50/40 border border-blue-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 font-mono focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                />
                <span className="text-[9px] text-slate-400 block mt-1">{language === 'zh' ? '自动折算单个出厂单价' : 'Calculates unit price automatically'}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'zh' ? '最小起订量 (MOQ)' : 'MOQ (Pcs)'}
                </label>
                <input 
                  type="number" 
                  placeholder="10000"
                  value={currentProduct.moq !== undefined ? currentProduct.moq : ''}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, moq: Number(e.target.value) }))}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'zh' ? '单件净重 (kg)' : 'Single Piece Weight (kg)'}
                </label>
                <input 
                  type="number" 
                  step="0.0001"
                  placeholder="0.001"
                  value={currentProduct.weight !== undefined ? currentProduct.weight : ''}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, weight: Number(e.target.value) }))}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'zh' ? '海关编码 (HS Code)' : 'HS Code'}
                </label>
                <input 
                  type="text" 
                  placeholder="7320.20.00"
                  value={currentProduct.hsCode || ''}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, hsCode: e.target.value }))}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'zh' ? '原产国' : 'Country of Origin'}
                </label>
                <input 
                  type="text" 
                  placeholder={language === 'zh' ? '中国' : 'China'}
                  value={currentProduct.countryOfOrigin || ''}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, countryOfOrigin: e.target.value }))}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                />
              </div>
            </div>

            {/* Packing Logistics Dimensions */}
            <div className="border-t border-slate-100 pt-5">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 text-[#1565C0]">
                {language === 'zh' ? '标准外贸出口装箱与物流参数' : 'Standard Export Packing Logistics'}
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    {language === 'zh' ? '单箱装箱数 (PCS/箱)' : 'Pieces Per Box'}
                  </label>
                  <input 
                    type="number" 
                    placeholder="10000"
                    value={currentProduct.piecesPerBox !== undefined ? currentProduct.piecesPerBox : ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, piecesPerBox: Number(e.target.value) }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    {language === 'zh' ? '外箱长度 (cm)' : 'Box Length (cm)'}
                  </label>
                  <input 
                    type="number" 
                    placeholder="30"
                    value={currentProduct.cartonLength !== undefined ? currentProduct.cartonLength : ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, cartonLength: Number(e.target.value) }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    {language === 'zh' ? '外箱宽度 (cm)' : 'Box Width (cm)'}
                  </label>
                  <input 
                    type="number" 
                    placeholder="30"
                    value={currentProduct.cartonWidth !== undefined ? currentProduct.cartonWidth : ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, cartonWidth: Number(e.target.value) }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    {language === 'zh' ? '外箱高度 (cm)' : 'Box Height (cm)'}
                  </label>
                  <input 
                    type="number" 
                    placeholder="25"
                    value={currentProduct.cartonHeight !== undefined ? currentProduct.cartonHeight : ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, cartonHeight: Number(e.target.value) }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    {language === 'zh' ? '单箱毛重 (kg)' : 'Box Gross Wt. (kg)'}
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="10.0"
                    value={currentProduct.grossWeight !== undefined ? currentProduct.grossWeight : ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, grossWeight: Number(e.target.value) }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">
                    {language === 'zh' ? '单箱净重 (kg)' : 'Box Net Wt. (kg)'}
                  </label>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="9.5"
                    value={currentProduct.netWeight !== undefined ? currentProduct.netWeight : ''}
                    onChange={(e) => setCurrentProduct(prev => ({ ...prev, netWeight: Number(e.target.value) }))}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Extra Specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'zh' ? '商品条形码 / EAN' : 'EAN / Barcode'}
                </label>
                <input 
                  type="text" 
                  placeholder="622100200..."
                  value={currentProduct.barcode || ''}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, barcode: e.target.value }))}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {language === 'zh' ? '工厂内部备注 / 成本备忘' : 'Internal Factory Notes'}
                </label>
                <input 
                  type="text" 
                  placeholder={language === 'zh' ? '例如：按万只报价 $44.48 ($0.004448/只)' : 'e.g. Priced at $44.48 per 10,000 pcs ($0.004448 / unit)'}
                  value={currentProduct.notes || ''}
                  onChange={(e) => setCurrentProduct(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button 
              type="button" 
              onClick={() => {
                setIsEditing(false);
                setCurrentProduct(null);
              }}
              className="px-4 py-2 border border-slate-200 text-slate-500 hover:bg-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
            >
              {language === 'zh' ? '取消编辑' : 'Cancel Edit'}
            </button>
            
            <button 
              type="submit" 
              className="px-6 py-2 bg-[#1565C0] hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold transition-all shadow-xs cursor-pointer"
            >
              {language === 'zh' ? '保存产品规格' : 'Save Product Specifications'}
            </button>
          </div>
        </form>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-2xl w-full flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 text-slate-700">
                <Sparkles size={16} className="text-[#1565C0]" />
                <span className="font-extrabold text-xs uppercase tracking-wider">
                  {language === 'zh' ? 'CSV 批量产品导入器' : 'CSV Catalog Importer'}
                </span>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-150 p-3 rounded-lg">
                <span className="font-bold text-slate-700 block mb-1">
                  {language === 'zh' ? '导入说明：' : 'How to import:'}
                </span>
                {language === 'zh' 
                  ? '支持上传标准 .CSV 表格文件或直接将 Excel/表格内容复制粘贴到下方文本框中。表格首行必须包含字段表头（品名、SKU、单价等）。'
                  : 'Upload a standard CSV file or paste spreadsheet columns directly into the area. Your table must start with headers. SKU numbers are optional.'}
              </div>

              {/* Upload input button */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'zh' ? '选择本地 CSV 表格文件' : 'Select CSV Source File'}
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
                  >
                    <Upload size={14} /> {language === 'zh' ? '选择文件...' : 'Choose File...'}
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {language === 'zh' ? '支持 UTF-8 编码的 .csv 格式' : 'Accepts .csv encoded UTF-8 files'}
                  </span>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept=".csv" 
                  onChange={handleCsvFileLoad}
                  className="hidden" 
                />
              </div>

              {/* CSV Editor TextArea */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {language === 'zh' ? '表格 CSV 纯文本数据内容' : 'Spreadsheet CSV Contents'}
                </label>
                <textarea 
                  rows={8}
                  placeholder={language === 'zh' ? '直接在此处粘贴 CSV 表格行...' : 'Paste CSV rows directly here...'}
                  value={csvPreview}
                  onChange={(e) => setCsvPreview(e.target.value)}
                  className="w-full bg-slate-50 font-mono text-[10px] border border-slate-200 rounded-lg p-3 text-slate-700 focus:outline-hidden focus:bg-white focus:border-[#1565C0] transition-all"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCsvPreview(getCsvTemplate())}
                className="text-[10px] text-[#1565C0] hover:underline font-semibold cursor-pointer"
              >
                {language === 'zh' ? '重置为标准模板示例' : 'Reset to Sample Template'}
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowImportModal(false)}
                  className="px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button 
                  onClick={handleImportCSVSubmit}
                  className="px-4 py-1.5 bg-[#1565C0] hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer"
                >
                  {language === 'zh' ? '批量导入产品' : 'Import Stated Products'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10,000 Pcs & Batch Quantity Calculator Modal */}
      {showCalculatorModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-purple-50/50">
              <div className="flex items-center gap-2 text-purple-900">
                <Calculator size={18} className="text-purple-700" />
                <span className="font-extrabold text-xs uppercase tracking-wider">
                  {language === 'zh' ? '大宗零部件万只成本测算器' : 'High-Volume Component Cost Estimator'}
                </span>
              </div>
              <button 
                onClick={() => setShowCalculatorModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-5">
              <div className="bg-purple-50/30 border border-purple-100 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">
                    {language === 'zh' ? '万只单价与大货批量模拟计算' : '10,000 Pcs Unit Price & Bulk Order Simulator'}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {language === 'zh' 
                      ? '针对喷头、泵芯、微型精密配件按“万只单价”折算单价与批量采购总价。'
                      : 'Calculate total cost based on price per 10,000 pieces for pumps, atomizers & micro components.'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">
                    {language === 'zh' ? '目标采购量:' : 'Target Quantity:'}
                  </label>
                  <input 
                    type="number" 
                    step="100000"
                    value={calcBatchQty}
                    onChange={(e) => setCalcBatchQty(Math.max(1, Number(e.target.value) || 0))}
                    className="w-32 bg-white border border-purple-200 rounded-lg px-2.5 py-1 text-xs text-slate-800 font-bold font-mono focus:outline-hidden focus:border-purple-600"
                  />
                  <span className="text-xs font-semibold text-slate-500">{language === 'zh' ? '只 / PCS' : 'pcs'}</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">{language === 'zh' ? '配件描述' : 'Item Description'}</th>
                      <th className="py-2.5 px-3 text-right">{language === 'zh' ? '万只单价' : 'Price / 10,000 pcs'}</th>
                      <th className="py-2.5 px-3 text-right">{language === 'zh' ? '单只价格' : 'Unit Price'}</th>
                      <th className="py-2.5 px-3 text-right">{language === 'zh' ? `合计 (${calcBatchQty.toLocaleString()} 只)` : `Total for ${calcBatchQty.toLocaleString()} pcs`}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {LOW_PRICE_COMPONENT_PRESETS.map((item, idx) => {
                      const unitPrice = item.price || 0;
                      const price10k = unitPrice * 10000;
                      const lineTotal = unitPrice * calcBatchQty;
                      return (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 font-bold text-slate-800">
                            {item.name}
                            <span className="block text-[9px] font-normal text-slate-400 font-mono">{item.sku}</span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-semibold">
                            {displayCurrency} {price10k.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-700 font-bold">
                            {displayCurrency} {unitPrice.toFixed(6)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                            {displayCurrency} {lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-purple-50/80 border-t-2 border-purple-200 font-black text-slate-900 text-xs">
                      <td colSpan={3} className="py-3 px-3 uppercase tracking-wider text-purple-900 font-extrabold">
                        {language === 'zh' ? `总计金额 (每种 ${calcBatchQty.toLocaleString()} 只)` : `Grand Total (${calcBatchQty.toLocaleString()} pcs each)`}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-sm text-purple-900">
                        {displayCurrency} { LOW_PRICE_COMPONENT_PRESETS.reduce((sum, item) => sum + ((item.price || 0) * calcBatchQty), 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button 
                onClick={() => setShowCalculatorModal(false)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-600 hover:bg-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
              >
                {language === 'zh' ? '关闭计算器' : 'Close Calculator'}
              </button>

              <button 
                onClick={() => {
                  handleImportPresets();
                  setShowCalculatorModal(false);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-extrabold transition-all cursor-pointer shadow-xs"
              >
                <Layers size={14} /> {language === 'zh' ? '一键导入全部 6 款配件至产品库' : 'Import All 6 Components to Library'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Image Manager Modal */}
      {isImageModalOpen && imageModalProduct && (
        <ProductImageModal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setImageModalProduct(null);
          }}
          currentImage={imageModalProduct.image}
          productName={imageModalProduct.name || 'Product'}
          onSaveImage={handleSaveImageModal}
        />
      )}
    </div>
  );
}
