import { ActiveTab, formatMoney } from '../types';
import { AppData } from '../utils/storage';
import { useLanguage } from '../context/LanguageContext';
import { 
  FolderHeart, 
  FileText, 
  PackageOpen, 
  Gift, 
  FileCheck,
  TrendingUp, 
  ArrowUpRight, 
  Plus, 
  Clock,
  UserCheck,
  BadgePercent,
  Calculator
} from 'lucide-react';

interface DashboardProps {
  data: AppData;
  setActiveTab: (tab: ActiveTab) => void;
  onCreateNewDocument: (type: 'invoice' | 'packing' | 'sample' | 'contract' | 'quotation') => void;
  onViewDocument: (type: 'invoice' | 'packing' | 'sample' | 'contract' | 'quotation', id: string) => void;
}

export default function Dashboard({ data, setActiveTab, onCreateNewDocument, onViewDocument }: DashboardProps) {
  const { t, language } = useLanguage();

  // Calculations
  const totalProducts = data.products.length;
  const totalInvoices = data.invoices.length;
  const totalPackingLists = data.packingLists.length;
  const totalSampleInvoices = data.sampleInvoices.length;
  const totalContracts = (data.contracts || []).length;

  // Calculate total revenue from USD invoices
  const totalRevenue = data.invoices.reduce((sum, inv) => {
    return sum + inv.grandTotal;
  }, 0);

  // Combine recent documents for unified ledger sorting by date
  interface RecentDoc {
    id: string;
    docNumber: string;
    type: 'invoice' | 'packing' | 'sample' | 'contract' | 'quotation';
    clientName: string;
    date: string;
    amount?: string;
    status: string;
  }

  const recentDocs: RecentDoc[] = [];

  (data.quotations || []).forEach(q => {
    recentDocs.push({
      id: q.id,
      docNumber: q.quotationNumber,
      type: 'quotation',
      clientName: q.client.company,
      date: q.date,
      amount: formatMoney(q.grandTotal, q.currency),
      status: language === 'zh' ? '已报价' : 'Quotation'
    });
  });

  data.invoices.forEach(inv => {
    recentDocs.push({
      id: inv.id,
      docNumber: inv.invoiceNumber,
      type: 'invoice',
      clientName: inv.client.company,
      date: inv.date,
      amount: formatMoney(inv.grandTotal, inv.currency),
      status: language === 'zh' ? '已开票' : 'Issued'
    });
  });

  (data.contracts || []).forEach(c => {
    const val = (c.items || []).reduce((sum, i) => sum + (i.amount || 0), 0);
    recentDocs.push({
      id: c.id,
      docNumber: c.contractNumber,
      type: 'contract',
      clientName: c.buyer?.companyName || 'Buyer',
      date: c.date,
      amount: formatMoney(val, c.currency || data.settings?.defaultCurrency || 'USD'),
      status: language === 'zh' ? '已签合同' : 'Signed Contract'
    });
  });

  data.packingLists.forEach(pl => {
    recentDocs.push({
      id: pl.id,
      docNumber: pl.packingListNumber,
      type: 'packing',
      clientName: pl.client.company,
      date: pl.shipmentDate,
      amount: language === 'zh' ? `${pl.totalCartons} 箱 / ${pl.totalCbm.toFixed(2)} 立方` : `${pl.totalCartons} Cartons / ${pl.totalCbm.toFixed(2)} CBM`,
      status: language === 'zh' ? '已出运' : 'Shipped'
    });
  });

  data.sampleInvoices.forEach(si => {
    recentDocs.push({
      id: si.id,
      docNumber: si.sampleInvoiceNumber,
      type: 'sample',
      clientName: si.client.company,
      date: si.date,
      amount: language === 'zh' ? '免费样品 (0元)' : 'FREE (Sample)',
      status: language === 'zh' ? '已寄送' : 'Delivered'
    });
  });

  // Sort by date descending
  recentDocs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const displayRecentDocs = recentDocs.slice(0, 5);

  return (
    <div className="space-y-6 print:hidden">
      {/* Welcome & Heading Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('dashboard.overview', 'Dashboard Overview')}</h1>
          <p className="text-xs text-slate-500 mt-1">{t('dashboard.welcome_workspace', 'Welcome to Waimao Tools Workspace.')}</p>
        </div>
        <button 
          onClick={() => onCreateNewDocument('invoice')}
          className="bg-[#1565C0] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#0D47A1] transition-all cursor-pointer shadow-xs"
        >
          <Plus size={14} />
          {t('dashboard.new_invoice', 'New Invoice')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Invoices / Revenue Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.commercial_value', 'Commercial Value')}</span>
            <div className="p-2 bg-blue-50 rounded-xl text-[#1565C0]">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
              {data.settings.defaultCurrency} {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <span>{t('dashboard.active_ledger', 'Active ledger summary value')}</span>
            </p>
          </div>
        </div>

        {/* Total Products Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer" onClick={() => setActiveTab('products')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.library_catalog', 'Library Catalog')}</span>
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <FolderHeart size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{totalProducts}</h3>
            <p className="text-[10px] text-slate-400 mt-1">{t('dashboard.stored_skus', 'Stored export product SKUs')}</p>
          </div>
        </div>

        {/* Packing Lists Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer" onClick={() => setActiveTab('packing')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.packing_ledgers', 'Packing Ledgers')}</span>
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <PackageOpen size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{totalPackingLists}</h3>
            <p className="text-[10px] text-slate-400 mt-1">{t('dashboard.active_shipment_pls', 'Active shipment packing lists')}</p>
          </div>
        </div>

        {/* Sample Invoices Card */}
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer" onClick={() => setActiveTab('sample')}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">{t('dashboard.sample_logs', 'Sample Logs')}</span>
            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
              <Gift size={16} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{totalSampleInvoices}</h3>
            <p className="text-[10px] text-slate-400 mt-1">{t('dashboard.free_samples_count', 'Free evaluations supplied')}</p>
          </div>
        </div>
      </div>

      {/* Quick Workflows */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('dashboard.quick_actions', 'Quick Actions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => onCreateNewDocument('invoice')}
            className="group text-left bg-white border border-slate-200 p-4 rounded-xl shadow-xs hover:border-[#1565C0] hover:shadow-sm transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center group-hover:bg-[#1565C0] group-hover:text-white transition-all">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('dashboard.new_ci_title', 'New Commercial Invoice')}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{t('dashboard.new_ci_desc', 'Commercial exporting billing')}</p>
              </div>
            </div>
            <Plus size={14} className="text-slate-400 group-hover:text-[#1565C0]" />
          </button>

          <button 
            onClick={() => onCreateNewDocument('packing')}
            className="group text-left bg-white border border-slate-200 p-4 rounded-xl shadow-xs hover:border-[#1565C0] hover:shadow-sm transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all">
                <PackageOpen size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('dashboard.new_pl_title', 'New Packing List')}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{t('dashboard.new_pl_desc', 'Container freight specs sheet')}</p>
              </div>
            </div>
            <Plus size={14} className="text-slate-400 group-hover:text-amber-600" />
          </button>

          <button 
            onClick={() => setActiveTab('quotation_calculator')}
            className="group text-left bg-white border border-slate-200 p-4 rounded-xl shadow-xs hover:border-[#1565C0] hover:shadow-sm transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1565C0] flex items-center justify-center group-hover:bg-[#1565C0] group-hover:text-white transition-all">
                <BadgePercent size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('dashboard.calc_title', 'Quotation Calculator')}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{t('dashboard.calc_desc', 'Inquiry cost, dip tube, color & FOB')}</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-[#1565C0]" />
          </button>

          <button 
            onClick={() => onCreateNewDocument('sample')}
            className="group text-left bg-white border border-slate-200 p-4 rounded-xl shadow-xs hover:border-[#1565C0] hover:shadow-sm transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all">
                <Gift size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('dashboard.new_sample_title', 'New Sample Invoice')}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{t('dashboard.new_sample_desc', 'Free items & courier tracking')}</p>
              </div>
            </div>
            <Plus size={14} className="text-slate-400 group-hover:text-purple-600" />
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className="group text-left bg-white border border-slate-200 p-4 rounded-xl shadow-xs hover:border-[#1565C0] hover:shadow-sm transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-all">
                <UserCheck size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('dashboard.settings_title', 'Company Settings')}</p>
                <p className="text-[9px] text-slate-500 mt-0.5">{t('dashboard.settings_desc', 'Configure stamps, logos, bank info')}</p>
              </div>
            </div>
            <ArrowUpRight size={14} className="text-slate-400 group-hover:text-slate-800" />
          </button>
        </div>
      </div>

      {/* Main Grid: Recent Docs & Operational Helpers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unified Recent Documents Ledger */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs flex flex-col lg:col-span-2 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-slate-400" />
              <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">
                {t('dashboard.recent_ledger', 'Recent Unified Ledger')}
              </h3>
            </div>
            <span className="text-[10px] text-slate-500 font-medium">{t('dashboard.last_entries', 'Last 5 active entries')}</span>
          </div>

          <div className="divide-y divide-slate-100 overflow-x-auto">
            {displayRecentDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                {t('dashboard.no_docs', 'No generated documents yet. Tap any quick action above to start.')}
              </div>
            ) : (
              displayRecentDocs.map(doc => {
                let badgeClass = "bg-blue-50 text-[#1565C0]";
                let label = language === 'zh' ? '商业发票' : 'Invoice';
                if (doc.type === 'contract') {
                  badgeClass = "bg-[#1565C0] text-white";
                  label = language === 'zh' ? '售货合同' : 'Sales Contract';
                } else if (doc.type === 'quotation') {
                  badgeClass = "bg-amber-100 text-amber-800 border border-amber-300";
                  label = language === 'zh' ? '报价单' : 'Price Quote';
                } else if (doc.type === 'packing') {
                  badgeClass = "bg-amber-50 text-amber-700";
                  label = language === 'zh' ? '装箱单' : 'Packing List';
                } else if (doc.type === 'sample') {
                  badgeClass = "bg-purple-50 text-purple-700";
                  label = language === 'zh' ? '样品发票' : 'Sample Invoice';
                }

                return (
                  <div key={doc.id} className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${badgeClass}`}>
                        {label}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-slate-800 truncate">
                          {doc.docNumber}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {doc.clientName}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 sm:border-transparent">
                      <div className="text-left sm:text-right shrink-0">
                        <p className="text-xs font-bold text-slate-800">
                          {doc.amount}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {doc.date}
                        </p>
                      </div>

                      <div className="shrink-0 pl-1 sm:pl-2">
                        <button 
                          onClick={() => onViewDocument(doc.type, doc.id)}
                          className="text-xs text-[#1565C0] hover:text-blue-800 font-bold px-3 py-1.5 rounded-lg bg-blue-50/60 sm:bg-transparent hover:bg-blue-50 transition-all border border-blue-200/50 sm:border-transparent hover:border-blue-100 cursor-pointer"
                        >
                          {t('dashboard.view_print', 'View / Print')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Insights Card */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4">
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-2.5">
            {t('dashboard.insights_title', 'Export & Trade Insights')}
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('dashboard.hs_code_title', 'Verified HS Code')}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t('dashboard.hs_code_desc', 'Standardized exporter codes: 3924.10, 3923.10 loaded in database.')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('dashboard.company_conf_title', 'Company Settings Configured')}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t('dashboard.company_conf_desc', 'Stamps, swift details, default VAT (14%) are ready and auto-fill documents.')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <PackageOpen size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">{t('dashboard.a4_title', 'A4 Formatting Standard')}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{t('dashboard.a4_desc', 'A4 document exports are fully responsive, clean layout and ready to download.')}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 border border-slate-150">
            <p className="text-[10px] text-slate-500 leading-normal font-semibold">
              💡 <span className="text-slate-700">{language === 'zh' ? '外贸小贴士：' : 'Exporter Tip:'}</span> {t('dashboard.exporter_tip', 'When compiling Invoices or Packing Lists, click "Select from Product Library" or "Select Client" to automatically pull weights, dimension specs, barcodes, and address logs!')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
