import { ActiveTab } from '../types';
import { AppData } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { 
  Home,
  LayoutDashboard, 
  FileText, 
  PackageOpen, 
  Gift, 
  FileCheck, 
  Coins, 
  FileSpreadsheet, 
  Globe2, 
  Ship, 
  Calculator, 
  BadgePercent, 
  Box, 
  FolderHeart, 
  Users, 
  Settings, 
  ShieldCheck,
  Menu, 
  X 
} from 'lucide-react';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  data: AppData;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isSuperAdmin?: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, data, isOpen, setIsOpen, isSuperAdmin }: SidebarProps) {
  const { t, language } = useLanguage();

  const menuItems = [
    { 
      id: 'home' as ActiveTab, 
      label: t('nav.home', 'Home & Features'), 
      icon: Home,
      badge: null
    },
    { 
      id: 'dashboard' as ActiveTab, 
      label: t('nav.dashboard', 'Dashboard'), 
      icon: LayoutDashboard,
      badge: null
    },
    { 
      id: 'quotation_calculator' as ActiveTab, 
      label: t('nav.quotation_calculator', 'Quotation Calculator'), 
      icon: BadgePercent,
      badge: (data.quotationCalculations && data.quotationCalculations.length > 0) ? data.quotationCalculations.length : null
    },
    { 
      id: 'invoice' as ActiveTab, 
      label: t('nav.invoice', 'Commercial Invoice'), 
      icon: FileText,
      badge: data.invoices.length > 0 ? data.invoices.length : null
    },
    { 
      id: 'proforma' as ActiveTab, 
      label: t('nav.proforma', 'Proforma Invoice'), 
      icon: Coins,
      badge: (data.proformaInvoices && data.proformaInvoices.length > 0) ? data.proformaInvoices.length : null
    },
    { 
      id: 'quotation' as ActiveTab, 
      label: t('nav.quotation', 'Price Quotation'), 
      icon: FileSpreadsheet,
      badge: (data.quotations && data.quotations.length > 0) ? data.quotations.length : null
    },
    { 
      id: 'packing' as ActiveTab, 
      label: t('nav.packing', 'Packing List Gen'), 
      icon: PackageOpen,
      badge: data.packingLists.length > 0 ? data.packingLists.length : null
    },
    { 
      id: 'contract' as ActiveTab, 
      label: t('nav.contract', 'Sales Contract'), 
      icon: FileCheck,
      badge: (data.contracts && data.contracts.length > 0) ? data.contracts.length : null
    },
    { 
      id: 'certificate' as ActiveTab, 
      label: t('nav.certificate', 'Certificate of Origin'), 
      icon: Globe2,
      badge: (data.certificatesOfOrigin && data.certificatesOfOrigin.length > 0) ? data.certificatesOfOrigin.length : null
    },
    { 
      id: 'shipping' as ActiveTab, 
      label: t('nav.shipping', 'Shipping Instructions'), 
      icon: Ship,
      badge: (data.shippingInstructions && data.shippingInstructions.length > 0) ? data.shippingInstructions.length : null
    },
    { 
      id: 'sample' as ActiveTab, 
      label: t('nav.sample', 'Sample Invoice'), 
      icon: Gift,
      badge: data.sampleInvoices.length > 0 ? data.sampleInvoices.length : null
    },
    { 
      id: 'cbm_calculator' as ActiveTab, 
      label: t('nav.cbm_calculator', 'Container CBM Calc'), 
      icon: Box,
      badge: null
    },
    { 
      id: 'products' as ActiveTab, 
      label: t('nav.products', 'Product Library'), 
      icon: FolderHeart,
      badge: data.products.length > 0 ? data.products.length : null
    },
    { 
      id: 'clients' as ActiveTab, 
      label: t('nav.clients', 'Client Database'), 
      icon: Users,
      badge: data.clients.length > 0 ? data.clients.length : null
    },
    { 
      id: 'settings' as ActiveTab, 
      label: t('nav.settings', 'Company Settings'), 
      icon: Settings,
      badge: null
    },
    ...(isSuperAdmin ? [{
      id: 'membership' as ActiveTab,
      label: language === 'zh' ? '🔑 会员开通与管理' : '🔑 Member Access Admin',
      icon: ShieldCheck,
      badge: 'VIP'
    }] : [])
  ];

  return (
    <>
      {/* Mobile / Tablet Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
          aria-label="Close Sidebar Backdrop"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 sm:w-80 lg:w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-out shadow-2xl lg:shadow-none lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 border-b border-slate-200 flex items-center justify-between px-5 sm:px-6 shrink-0">
          <button 
            type="button"
            onClick={() => {
              setActiveTab('home');
              setIsOpen(false);
            }}
            className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer"
            title="Go to Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#1565C0] flex items-center justify-center text-white font-black text-lg shadow-xs">
              W
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-[#1565C0] block leading-none">
                {t('brand.title', 'Waimao Tools')}
              </span>
              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase block mt-1">
                {t('brand.subtitle', 'Foreign Trade & Export')}
              </span>
            </div>
          </button>
          
          <button 
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors active:scale-95 cursor-pointer"
            onClick={() => setIsOpen(false)}
            title="Close sidebar"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-1 overscroll-contain">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all font-semibold text-xs sm:text-sm group min-h-[42px] cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 text-[#1565C0] font-bold shadow-2xs' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon 
                    size={19} 
                    className={`transition-colors shrink-0 ${
                      isActive ? 'text-[#1565C0]' : 'text-slate-400 group-hover:text-slate-600'
                    }`} 
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all shrink-0 ${
                    isActive 
                      ? 'bg-[#1565C0] text-white' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1565C0] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
              WT
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">
                {data.settings?.name ? data.settings.name : 'Waimao Tools Workspace'}
              </p>
              <p className="text-[10px] text-slate-500 truncate mt-0.5">
                {t('brand.subtitle', 'Foreign Trade & Export Suite')}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
