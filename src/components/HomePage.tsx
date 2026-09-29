import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ActiveTab } from '../types';
import { AppData } from '../utils/storage';
import { 
  BadgePercent, 
  FileText, 
  Coins, 
  FileSpreadsheet, 
  PackageOpen, 
  FileCheck, 
  Globe2, 
  Ship, 
  Gift, 
  Box, 
  FolderHeart, 
  Users, 
  Settings, 
  Cloud, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Printer, 
  Smartphone, 
  Receipt,
  Plus
} from 'lucide-react';

interface HomePageProps {
  data: AppData;
  setActiveTab: (tab: ActiveTab) => void;
  onCreateNewDocument: (type: 'invoice' | 'packing' | 'sample' | 'contract' | 'quotation') => void;
  isSuperAdmin?: boolean;
}

export default function HomePage({ data, setActiveTab, onCreateNewDocument, isSuperAdmin }: HomePageProps) {
  const { language } = useLanguage();
  const isZh = language === 'zh';

  const coreFeatures = [
    {
      id: 'quotation_calculator' as ActiveTab,
      badge: isZh ? '利润核算' : 'Pricing Engine',
      title: isZh ? '外贸报价与利润核算器' : 'Quotation & Cost Calculator',
      desc: isZh 
        ? '多汇率即时换算、管长差价、定制颜色喷涂加价、退税率、FOB/CIF 运费加成，秒级推导精准美金底价。'
        : 'Live exchange rates, dip tube differentials, custom coloring surcharges, VAT rebate rates, and FOB/CIF freight markup calculations.',
      icon: BadgePercent,
      onClick: () => setActiveTab('quotation_calculator')
    },
    {
      id: 'invoice' as ActiveTab,
      badge: isZh ? '清关必备' : 'Customs Ready',
      title: isZh ? 'Commercial Invoice 商业发票' : 'Commercial Invoice (CI)',
      desc: isZh 
        ? '外贸出口报关与海外买家清关的核心凭证。中英文大写金额自动拼写、印章透明抠图与矢量 A4 导出。'
        : 'Official export billing with bilingual layouts, automatic spelled-out currency totals, digital stamps, and crisp A4 exports.',
      icon: FileText,
      onClick: () => onCreateNewDocument('invoice')
    },
    {
      id: 'proforma' as ActiveTab,
      badge: isZh ? '定金催付' : 'Deposit Ready',
      title: isZh ? 'Proforma Invoice 形式发票 (PI)' : 'Proforma Invoice (PI)',
      desc: isZh 
        ? '买家打款与开立信用证的正式预结算依据。自带银行美金 SWIFT 账户信息，清晰列明付款条款与交期。'
        : 'Standard PI for advance payments and L/C opening, featuring international bank SWIFT details, lead times, and flexible deposit terms.',
      icon: Coins,
      onClick: () => setActiveTab('proforma')
    },
    {
      id: 'quotation' as ActiveTab,
      badge: isZh ? '商务谈判' : 'Price Quotation',
      title: isZh ? 'Sales Quotation 外贸报价单' : 'Sales Price Quotation',
      desc: isZh 
        ? '阶梯起订量 (MOQ)、FOB/EXW/CIF 国际贸易术语、阶梯定价与有效期，排版精致大方，提升买家成交率。'
        : 'Formal multi-item quotation sheets with Incoterms (FOB/CIF/EXW), MOQ tiers, validity dates, and dynamic terms.',
      icon: FileSpreadsheet,
      onClick: () => onCreateNewDocument('quotation')
    },
    {
      id: 'packing' as ActiveTab,
      badge: isZh ? '仓储出运' : 'Warehouse & Port',
      title: isZh ? 'Packing List 导出装箱单' : 'Packing List Generator',
      desc: isZh 
        ? '全自动联动单箱净重、毛重、外箱尺寸与总 CBM 体积。整柜 (FCL) 与拼箱 (LCL) 智能箱号连续排列。'
        : 'Automated gross/net weight calculation, total carton counts, and CBM volumetric computation with sequential numbering.',
      icon: PackageOpen,
      onClick: () => onCreateNewDocument('packing')
    },
    {
      id: 'contract' as ActiveTab,
      badge: isZh ? '法务保障' : 'Legal Binding',
      title: isZh ? 'Sales Contract 外销合同 (SC)' : 'Sales Contract (SC)',
      desc: isZh 
        ? '严谨的中英双语法律条款：仲裁协议、不可抗力、质量异议索赔期，支持买卖双方中英双电子印章。'
        : 'Legally vetted bilingual export contracts with arbitration, force majeure, inspection criteria, and dual party signature sections.',
      icon: FileCheck,
      onClick: () => onCreateNewDocument('contract')
    },
    {
      id: 'certificate' as ActiveTab,
      badge: isZh ? '关税减免' : 'Tariff Preference',
      title: isZh ? 'Certificate of Origin 原产地证明' : 'Certificate of Origin (CO)',
      desc: isZh 
        ? '协助海外客户在目的港享受关税减免或清关审核必备文件。包含完整发货人、收货人及原产地标准标注。'
        : 'Standard Certificate of Origin document generation with origin criteria, consignee and consignor details for customs clearance.',
      icon: Globe2,
      onClick: () => setActiveTab('certificate')
    },
    {
      id: 'shipping' as ActiveTab,
      badge: isZh ? '货代交接' : 'Forwarder Dispatch',
      title: isZh ? 'Shipping Instructions 托运指示 (SO)' : 'Shipping Instructions (S/I)',
      desc: isZh 
        ? '致货运代理人 (Forwarder) 的订舱与提单放单确认书。精确注明起运港 (POL)、目的港 (POD) 与电放指示。'
        : 'Official booking instruction to ocean and air freight forwarders, detailing ports, notify parties, freight terms, and B/L requirements.',
      icon: Ship,
      onClick: () => setActiveTab('shipping')
    },
    {
      id: 'cbm_calculator' as ActiveTab,
      badge: isZh ? '配载模拟' : 'CBM Simulation',
      title: isZh ? '集装箱装柜 CBM 计算器' : 'Container CBM Calculator',
      desc: isZh 
        ? '模拟 20GP、40GP、40HQ 真实货柜尺寸，自动测算装载率与限重提示，优化外销物流成本。'
        : 'Physical volume simulation for 20GP, 40GP, and 40HQ ocean containers with live loading ratio and weight alerts.',
      icon: Box,
      onClick: () => setActiveTab('cbm_calculator')
    }
  ];

  return (
    <div className="space-y-12 animate-fadeIn pb-16">
      
      {/* ================= CLARIO STYLE HERO SECTION ================= */}
      <section className="pt-8 sm:pt-14 pb-12 text-center relative max-w-4xl mx-auto px-4">
        
        {/* Subtle diffuse ambient glow spots */}
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute top-[-20%] left-[10%] w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-amber-100/40 via-rose-100/30 to-sky-100/30 blur-[80px] -z-10" 
        />
        <div 
          aria-hidden="true" 
          className="pointer-events-none absolute top-[0%] right-[10%] w-[420px] h-[420px] rounded-full bg-gradient-to-bl from-sky-100/40 via-indigo-100/30 to-purple-100/20 blur-[90px] -z-10" 
        />

        {/* Clario Headline: "Exporting reimagined for today's [CI/PI] world" */}
        <div className="inline-block relative mb-3">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-[-0.035em] text-[#111] leading-[1.1]">
            {isZh ? (
              <>
                外贸单证制作 <br className="hidden sm:inline" />
                <span className="inline-flex items-center gap-2 font-medium">
                  轻巧重塑
                  <span className="inline-flex items-center justify-center align-middle px-3 py-1 mx-1.5 rounded-xl bg-[#111] text-white text-xs sm:text-sm font-sans shadow-md">
                    CI / PI
                  </span>
                  全球出海
                </span>
              </>
            ) : (
              <>
                Exporting reimagined <br className="hidden sm:inline" />
                <span className="inline-flex items-center gap-2">
                  for today's
                  <span className="inline-flex items-center justify-center align-middle px-3.5 py-1.5 mx-1.5 rounded-xl bg-[#111] text-white text-xs sm:text-sm font-sans shadow-md">
                    CI / PI
                  </span>
                  world
                </span>
              </>
            )}
          </h1>
        </div>

        {/* Refined subtitle */}
        <p className="text-xs sm:text-sm text-slate-500 font-normal max-w-lg mx-auto leading-relaxed mt-2 mb-8">
          {isZh 
            ? '摆脱繁杂易错的传统表格。为您打造包含商业发票、形式发票、装箱单与外贸报价在内的全流程出海协同工具。'
            : 'Take control of your export trade with tools that simplify documentation, highlight profit margins, and help you quote with confidence.'}
        </p>

        {/* Dual pill CTA buttons (matching Clario "Download App" and "Begin your plan") */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <button
            type="button"
            onClick={() => onCreateNewDocument('invoice')}
            className="h-10 px-5.5 rounded-full bg-[#EFEFEF] hover:bg-[#E5E5E5] active:scale-97 text-[#111] text-xs font-medium transition-all cursor-pointer flex items-center gap-2 shadow-2xs"
          >
            <FileText size={14} />
            <span>{isZh ? '新建商业发票 (CI)' : 'New Invoice'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quotation_calculator')}
            className="h-10 px-5.5 rounded-full bg-white hover:bg-slate-50 active:scale-97 text-[#111] border border-slate-200/80 text-xs font-medium transition-all cursor-pointer shadow-2xs flex items-center gap-2"
          >
            <BadgePercent size={14} />
            <span>{isZh ? '核算美金底价' : 'Calculate Margin'}</span>
          </button>
        </div>

        {/* Floating Mockup Stage (Phone + Satellite cards) */}
        <div className="relative max-w-xl mx-auto pt-2 pb-6 flex items-center justify-center">
          
          {/* Top-Right Pill */}
          <div className="hidden sm:flex absolute -top-1 right-12 z-20 px-3 py-1.5 rounded-full bg-[#FCECEE] border border-rose-200/40 text-rose-700 text-[11px] font-semibold items-center gap-1.5 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>{isZh ? '出口退税 13%' : 'VAT Rebate'}</span>
          </div>

          {/* Left Pill */}
          <div className="hidden sm:flex absolute -left-10 top-28 z-20 px-3.5 py-1.5 rounded-xl bg-[#EAF2FE] border border-blue-200/60 text-[#1E60B8] text-xs font-semibold items-center gap-1.5 shadow-xs">
            <span>+ $300.00</span>
          </div>

          {/* Right Card: New Expense */}
          <div className="hidden sm:flex items-center justify-between gap-3 absolute -right-12 top-20 z-20 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-black/[0.06] shadow-sm w-44 text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                <Receipt size={13} />
              </div>
              <div>
                <div className="text-[9px] text-slate-400">{isZh ? '预付款' : 'PI Advance'}</div>
                <div className="text-xs font-bold text-slate-900">30% T/T</div>
              </div>
            </div>
            <div className="w-5 h-5 rounded-md bg-[#111] text-white flex items-center justify-center text-[10px]">
              +
            </div>
          </div>

          {/* Central Mockup Phone */}
          <div className="w-[270px] sm:w-[290px] rounded-[40px] bg-[#000] p-2.5 shadow-xl shadow-slate-900/10 ring-1 ring-black/10 text-left">
            <div className="w-full bg-[#FFFFFF] rounded-[32px] overflow-hidden p-3.5 pt-2.5 flex flex-col select-none">
              
              {/* Notch */}
              <div className="w-16 h-3.5 bg-black rounded-full mx-auto mb-2.5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                    WT
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-900 leading-tight">{isZh ? '外贸总览' : 'Overview'}</div>
                    <div className="text-[8px] text-slate-400">2026 Global Export</div>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">🔍</span>
              </div>

              {/* Balance */}
              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900 tracking-tight">$9,826.15</span>
                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">+14.08%</span>
                </div>
                <div className="text-[8px] text-slate-400 mt-0.5">{isZh ? '已开发票与出运总额' : 'Total cleared commercial value'}</div>
              </div>

              {/* Sparkline chart */}
              <div className="w-full h-12 mb-3">
                <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible">
                  <path
                    d="M0,45 Q20,40 40,48 T80,30 T120,38 T160,15 T200,22 L200,60 L0,60 Z"
                    fill="rgba(34, 197, 94, 0.12)"
                  />
                  <path
                    d="M0,45 Q20,40 40,48 T80,30 T120,38 T160,15 T200,22"
                    fill="none"
                    stroke="#16a34a"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="200" cy="22" r="3" fill="#16a34a" />
                </svg>
              </div>

              {/* Recent records inside phone */}
              <div className="space-y-1.5 border-t border-slate-100 pt-2 text-[9px]">
                <div className="flex items-center justify-between text-slate-700">
                  <span>Commercial Invoice #{data.invoices[0]?.invoiceNumber || 'CI-2026'}</span>
                  <span className="font-bold text-slate-900">${data.invoices[0]?.grandTotal ? data.invoices[0].grandTotal.toFixed(2) : '44.29'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span>Proforma Deposit #PI-02</span>
                  <span className="font-bold text-slate-900">$33.75</span>
                </div>
              </div>

              {/* Home indicator bar */}
              <div className="w-20 h-1 bg-slate-200 rounded-full mx-auto mt-3" />

            </div>
          </div>

        </div>

      </section>

      {/* ================= FEATURE GRID SECTION ================= */}
      <section className="space-y-6 max-w-5xl mx-auto px-4">
        <div className="text-center max-w-xl mx-auto mb-8 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {isZh ? '全套工具矩阵' : 'Capabilities'}
          </span>
          <h2 className="text-xl sm:text-2xl font-normal text-slate-900 tracking-tight">
            {isZh ? '覆盖外贸业务从询盘到出运全流程' : 'End-to-end export documentation workflow'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {coreFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div 
                key={feat.id}
                onClick={feat.onClick}
                className="group p-5 rounded-3xl bg-white border border-slate-200/70 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-800 group-hover:bg-[#111] group-hover:text-white transition-colors">
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 group-hover:text-[#111]">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>{isZh ? '立即打开' : 'Open'}</span>
                  <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= CLOUD TRUST BANNER ================= */}
      <section className="max-w-5xl mx-auto px-4 pt-4">
        <div className="bg-[#FAF9F6] rounded-3xl p-6 sm:p-8 border border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
              Google Cloud Firestore
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900">
              {isZh ? '企业级云端隔离与全设备实时同步' : 'Multi-device real-time sync with per-user sandbox'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              {isZh 
                ? '所有开票数据、产品库与客户信息在电脑与手机随时互通，保障商业机密严密隔离。' 
                : 'Your documents, clients, and catalog items are synced automatically across phone and desktop.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {isZh ? '印章与公司设置' : 'Settings & Stamps'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2.5 rounded-full bg-[#111] text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isZh ? '查看业务仪表盘' : 'View Dashboard'}
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
