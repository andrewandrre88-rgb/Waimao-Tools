import { useState, useRef, useEffect } from 'react';
import { ActiveTab, AuthUser } from '../types';
import { performGlobalSearch, SearchResult, AppData } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import CloudSyncBadge, { CloudSyncState } from './CloudSyncBadge';
import { 
  Search, 
  Bell, 
  Menu, 
  FileText, 
  PackageOpen, 
  Gift, 
  FolderHeart, 
  Users, 
  ChevronRight, 
  LogOut, 
  Plus, 
  DollarSign, 
  Calculator, 
  FileCheck2, 
  Layers,
  Languages 
} from 'lucide-react';

interface HeaderProps {
  data: AppData;
  currentUser: AuthUser | null;
  syncState?: CloudSyncState;
  onManualSync?: () => void;
  onLogout: () => void;
  setActiveTab: (tab: ActiveTab) => void;
  setSearchTarget: (target: { id: string; type: string } | null) => void;
  setSidebarOpen: (open: boolean) => void;
  onCreateNewDocument?: (type: 'invoice' | 'packing' | 'sample' | 'contract' | 'quotation') => void;
}

export default function Header({ 
  data, 
  currentUser, 
  syncState,
  onManualSync,
  onLogout, 
  setActiveTab, 
  setSearchTarget, 
  setSidebarOpen,
  onCreateNewDocument 
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showNewDocMenu, setShowNewDocMenu] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const newDocMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const results = query ? performGlobalSearch(query, data) : [];

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (newDocMenuRef.current && !newDocMenuRef.current.contains(event.target as Node)) {
        setShowNewDocMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectResult = (res: SearchResult) => {
    setQuery('');
    setShowResults(false);
    
    let tab: ActiveTab = 'dashboard';
    if (res.type === 'product') tab = 'products';
    else if (res.type === 'client') tab = 'clients';
    else if (res.type === 'invoice') tab = 'invoice';
    else if (res.type === 'packing_list') tab = 'packing';
    else if (res.type === 'sample_invoice') tab = 'sample';

    setActiveTab(tab);
    setSearchTarget({ id: res.id, type: res.type });
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'product': return <FolderHeart size={16} className="text-[#42A5F5]" />;
      case 'client': return <Users size={16} className="text-emerald-500" />;
      case 'invoice': return <FileText size={16} className="text-[#1565C0]" />;
      case 'packing_list': return <PackageOpen size={16} className="text-amber-500" />;
      case 'sample_invoice': return <Gift size={16} className="text-purple-500" />;
      default: return <Search size={16} className="text-slate-400" />;
    }
  };

  const notifications = [
    { 
      id: 1, 
      title: language === 'zh' ? '商业发票 INV-000002 已成功生成' : 'Invoice INV-000002 created', 
      time: language === 'zh' ? '2小时前' : '2 hours ago', 
      unread: true 
    },
    { 
      id: 2, 
      title: language === 'zh' ? '产品库资料与包装数据同步成功' : 'Product library synced successfully', 
      time: language === 'zh' ? '1天前' : '1 day ago', 
      unread: false 
    },
    { 
      id: 3, 
      title: language === 'zh' ? '已校验客户 EuroTrade 档案' : 'Client EuroTrade details verified', 
      time: language === 'zh' ? '3天前' : '3 days ago', 
      unread: false 
    }
  ];

  const handleCreate = (type: 'invoice' | 'packing' | 'sample' | 'contract' | 'quotation') => {
    setShowNewDocMenu(false);
    if (onCreateNewDocument) {
      onCreateNewDocument(type);
    } else {
      setActiveTab(type === 'packing' ? 'packing' : type === 'sample' ? 'sample' : type === 'contract' ? 'contract' : type === 'quotation' ? 'quotation' : 'invoice');
    }
  };

  // Safe display names without legacy Mila references
  const displayName = currentUser?.name?.includes('Mila') ? 'Authorized Specialist' : (currentUser?.name || 'Authorized User');
  const displayCompany = currentUser?.companyName?.includes('Mila') ? 'Waimao International Trade' : (currentUser?.companyName || 'Waimao International Trade Co., Ltd.');
  const displayEmail = currentUser?.email?.includes('milaplastics') ? 'user@waimaotools.online' : (currentUser?.email || 'user@waimaotools.online');
  const userInitials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'W';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 print:hidden gap-2 sm:gap-4">
      {/* Mobile / Tablet Menu Trigger & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors lg:hidden active:scale-95"
          title="Open menu"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <div className="w-7 h-7 rounded-lg bg-[#1565C0] flex items-center justify-center text-white font-black text-sm shadow-xs">
            W
          </div>
          <span className="font-extrabold text-slate-800 text-xs sm:text-sm tracking-tight hidden xs:inline">WAIMAO TOOLS</span>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md mx-1 sm:mx-2 relative min-w-0" ref={resultsRef}>
        <div className="flex items-center bg-slate-100 rounded-full px-3 sm:px-4 py-1.5 w-full focus-within:ring-2 focus-within:ring-[#1565C0]/20 focus-within:bg-white transition-all">
          <Search size={14} className="text-slate-400 shrink-0" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t('header.search_placeholder', 'Search products, clients, invoices...')}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="bg-transparent border-0 outline-hidden ring-0 focus:ring-0 focus:outline-hidden focus:border-0 text-xs w-full ml-1.5 text-slate-800 placeholder-slate-400 placeholder:text-xs"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && query && (
          <div className="absolute top-full left-0 right-0 sm:-right-12 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-96 overflow-y-auto z-50 py-1.5 w-[calc(100vw-2rem)] sm:w-full max-w-md">
            <div className="px-3.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('btn.search', 'Search Results')}
            </div>
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-slate-400">
                {language === 'zh' ? `未找到关于 "${query}" 的结果` : `No results found for "${query}"`}
              </div>
            ) : (
              results.map((res) => (
                <button
                  key={`${res.type}-${res.id}`}
                  onClick={() => handleSelectResult(res)}
                  className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-start gap-3 transition-colors group border-b border-slate-50 last:border-0"
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 group-hover:bg-white transition-colors shrink-0">
                    {getResultIcon(res.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-[#1565C0] transition-colors truncate">
                        {res.title}
                      </p>
                      <ChevronRight size={12} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">
                      {res.subtitle}
                    </p>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5 bg-slate-50 px-1.5 py-0.5 rounded-sm inline-block">
                      {res.metadata}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Language Selector, Exchange Rate, Google Sync, + New Action, User Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
        
        {/* Language Switcher (EN / 中文) */}
        <div id="header-language-toggle" className="flex items-center bg-slate-100/90 hover:bg-slate-150 p-0.5 rounded-lg border border-slate-200 text-xs font-bold shrink-0 transition-colors shadow-2xs">
          <div className="pl-1.5 pr-1 text-slate-400 hidden sm:flex items-center">
            <Languages size={13} />
          </div>
          <button
            id="lang-btn-en"
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] select-none ${
              language === 'en' 
                ? 'bg-white text-[#1565C0] shadow-xs font-extrabold ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
            title="Switch Language to English"
          >
            EN
          </button>
          <button
            id="lang-btn-zh"
            type="button"
            onClick={() => setLanguage('zh')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer text-[11px] select-none ${
              language === 'zh' 
                ? 'bg-white text-[#1565C0] shadow-xs font-extrabold ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-900 font-medium'
            }`}
            title="切换语言为中文 (简体)"
          >
            中文
          </button>
        </div>

        {/* Exchange Rate Badge */}
        <button
          type="button"
          onClick={() => setActiveTab('quotation_calculator')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          title={t('header.rate_tooltip', 'Live Quotation Exchange Rate (Click to open Calculator)')}
        >
          <span className="text-amber-600 font-bold">$</span>
          <span>{t('header.exchange_rate', '1 USD = ¥7.25')}</span>
        </button>

        {/* Real-time Cloud Firestore Sync Badge */}
        {syncState && (
          <CloudSyncBadge 
            syncState={syncState}
            onManualSync={onManualSync || (() => {})}
          />
        )}

        {/* + New Document Quick Button & Dropdown */}
        <div className="relative" ref={newDocMenuRef}>
          <button
            type="button"
            onClick={() => setShowNewDocMenu(!showNewDocMenu)}
            className="flex items-center gap-1.5 bg-[#1565C0] hover:bg-[#0D47A1] text-white px-3 py-1.5 rounded-lg font-semibold text-xs transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <Plus size={15} className="stroke-[2.5]" />
            <span className="hidden sm:inline">{t('header.new_document', 'New Document')}</span>
          </button>

          {showNewDocMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5">
              <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                {t('dashboard.quick_actions', 'Create New')}
              </div>
              <button
                type="button"
                onClick={() => handleCreate('invoice')}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50/60 text-xs text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <FileText size={15} className="text-[#1565C0]" />
                <span className="font-semibold">{t('menu.new_invoice', 'Commercial Invoice')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreate('packing')}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50/60 text-xs text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <PackageOpen size={15} className="text-amber-500" />
                <span className="font-semibold">{t('menu.new_packing', 'Packing List')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreate('quotation')}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50/60 text-xs text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Calculator size={15} className="text-emerald-600" />
                <span className="font-semibold">{t('menu.new_quotation', 'Sales Quotation')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreate('contract')}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50/60 text-xs text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <FileCheck2 size={15} className="text-purple-600" />
                <span className="font-semibold">{t('menu.new_contract', 'Sales Contract')}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCreate('sample')}
                className="w-full text-left px-3.5 py-2 hover:bg-blue-50/60 text-xs text-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-50"
              >
                <Gift size={15} className="text-indigo-500" />
                <span className="font-semibold">{t('menu.new_sample', 'Sample Invoice')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative active:scale-95 cursor-pointer"
            title="Notifications"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2.5 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">{language === 'zh' ? '消息与系统通知' : 'Notifications'}</span>
                <span className="text-[10px] bg-blue-50 text-[#1565C0] px-2 py-0.5 rounded-full font-bold">{language === 'zh' ? '1条未读' : '1 New'}</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`px-4 py-2.5 border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${
                      n.unread ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-1.5 justify-between">
                      <p className="text-xs font-semibold text-slate-700 leading-tight">{n.title}</p>
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#1565C0] shrink-0 mt-1" />}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Bar + Direct 1-Click Logout */}
        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-[#1565C0] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ring-2 ring-slate-100">
            {userInitials}
          </div>

          <div className="hidden lg:block text-left max-w-[130px] xl:max-w-[160px]">
            <div className="text-xs font-bold text-slate-800 leading-tight truncate">
              {displayCompany}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate">
              {displayEmail}
            </div>
          </div>

          {/* 1-Click Logout Action */}
          <button
            type="button"
            onClick={onLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer active:scale-95 ml-0.5"
            title={t('header.logout', 'Log Out of Account')}
            aria-label="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </header>
  );
}
